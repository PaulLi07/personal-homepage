"""可重建的 SQLite 维护库：规范源只读，数据库不是第二份编辑主库。"""
from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import tempfile
from types import ModuleType
from typing import Any
import uuid

BASE_SQL = '''
CREATE TABLE schema_migrations (
    version TEXT PRIMARY KEY,
    sha256 TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
CREATE TABLE dataset_versions (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    project_id TEXT NOT NULL,
    source_fingerprint TEXT NOT NULL,
    imported_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL
);
CREATE TABLE source_documents (
    path TEXT PRIMARY KEY,
    sha256 TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    content BLOB NOT NULL
);
CREATE TABLE validation_runs (
    id INTEGER PRIMARY KEY,
    operation TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed')),
    checked_at TEXT NOT NULL,
    details_json TEXT NOT NULL
);
'''


class MaintenanceError(RuntimeError):
    """维护操作失败，调用方不能当作成功继续发布。"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_text(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


class _Connection(sqlite3.Connection):
    def __exit__(self, exc_type, exc_value, traceback):
        try:
            return super().__exit__(exc_type, exc_value, traceback)
        finally:
            self.close()


def connect(path: Path, *, readonly: bool = False) -> sqlite3.Connection:
    path = Path(path).resolve()
    if readonly and not path.is_file():
        raise MaintenanceError(f'数据库不存在：{path}；请先运行 init。')
    conn = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, isolation_level=None, factory=_Connection) if readonly else sqlite3.connect(path, isolation_level=None, factory=_Connection)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        if conn.execute("SELECT json_valid('{}')").fetchone()[0] != 1:
            raise MaintenanceError('SQLite JSON 校验能力不可用。')
        if conn.execute('PRAGMA foreign_keys').fetchone()[0] != 1:
            raise MaintenanceError('SQLite 外键约束能力不可用。')
    except BaseException as exc:
        conn.close()
        if isinstance(exc, sqlite3.OperationalError) and 'no such function: json_valid' in str(exc):
            raise MaintenanceError(f'SQLite {sqlite3.sqlite_version} 缺少所需 JSON 校验能力。') from exc
        raise
    conn.execute('PRAGMA busy_timeout = 5000')
    if readonly:
        conn.execute('PRAGMA query_only = ON')
    return conn


@contextmanager
def operation_lock(path: Path):
    """同一库的写操作串行；锁文件留在本地维护目录。"""
    lock_dir = path.parent.parent / 'locks'
    lock_dir.mkdir(parents=True, exist_ok=True)
    lock_path = lock_dir / (path.name + '.lock')
    with lock_path.open('a+b') as handle:
        try:
            import fcntl
        except ImportError:
            import msvcrt
            if lock_path.stat().st_size == 0:
                handle.write(b'\0'); handle.flush()
            handle.seek(0)
            try:
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                raise MaintenanceError('该数据库已有维护操作正在运行。') from exc
            try:
                yield
            finally:
                handle.seek(0); msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise MaintenanceError('该数据库已有维护操作正在运行。') from exc
            try:
                yield
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)


def source_snapshot(adapter: ModuleType) -> list[dict]:
    logical_root = Path(adapter.ROOT).absolute()
    root = logical_root.resolve()
    result = []
    seen = set()
    for candidate in adapter.source_files():
        original = Path(candidate).absolute()
        path = original.resolve()
        linked = any(part.is_symlink() for part in [original, *original.parents] if part == logical_root or part.is_relative_to(logical_root))
        if linked or not path.is_relative_to(root) or not path.is_file():
            raise MaintenanceError(f'规范源文件缺失、越界或为符号链接：{original}')
        relative = path.relative_to(root).as_posix()
        if relative in seen:
            raise MaintenanceError(f'规范源文件重复登记：{relative}')
        seen.add(relative)
        payload = path.read_bytes()
        result.append({'path': relative, 'sha256': digest(payload), 'size_bytes': len(payload), 'content': payload})
    if not result:
        raise MaintenanceError('规范源文件清单为空，拒绝生成空库。')
    return sorted(result, key=lambda item: item['path'])


def fingerprint(documents: list[dict]) -> str:
    manifest = [{key: row[key] for key in ('path', 'sha256', 'size_bytes')} for row in documents]
    return digest(json_text(manifest).encode())


def migrations(adapter: ModuleType) -> list[tuple[str, str, str]]:
    result = [('base:001', digest(BASE_SQL.encode()), BASE_SQL)]
    paths = sorted(Path(adapter.MIGRATIONS).glob('[0-9]*_*.sql'))
    if not paths:
        raise MaintenanceError(f'项目未提供迁移 SQL：{adapter.MIGRATIONS}')
    numbers = set()
    for path in paths:
        number = int(path.name.split('_', 1)[0])
        if number in numbers:
            raise MaintenanceError(f'迁移序号重复：{path.name}')
        numbers.add(number)
        sql = path.read_text(encoding='utf-8')
        result.append(('project:' + path.stem, digest(sql.encode()), sql))
    return result


def _executestatements(conn: sqlite3.Connection, sql: str):
    # executescript 会隐式 COMMIT；逐句 execute 保持调用方事务边界。
    statement = ''
    for char in sql:
        statement += char
        if char == ';' and sqlite3.complete_statement(statement):
            conn.execute(statement)
            statement = ''
    if statement.strip():
        conn.execute(statement)


def schema_state(conn: sqlite3.Connection, adapter: ModuleType, *, require_current: bool = True) -> list[tuple[str, str, str]]:
    expected = migrations(adapter)
    exists = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'").fetchone()
    applied = {row['version']: row['sha256'] for row in conn.execute('SELECT version,sha256 FROM schema_migrations')} if exists else {}
    known = {version: sha for version, sha, _ in expected}
    for version, sha in applied.items():
        if version not in known:
            raise MaintenanceError(f'数据库包含当前源码不认识的迁移：{version}')
        if known[version] != sha:
            raise MaintenanceError(f'已应用迁移被修改：{version}；应新增迁移而不是重写旧 SQL。')
    missing = [item for item in expected if item[0] not in applied]
    # 迁移只能是已知序列的前缀，不能有中间缺失。
    if applied and list(applied) != [item[0] for item in expected[:len(applied)]]:
        raise MaintenanceError('迁移顺序不连续，拒绝自动修复。')
    if require_current and missing:
        raise MaintenanceError('数据库结构尚未升级；请运行 migrate。')
    return missing


def _apply_migrations(conn: sqlite3.Connection, adapter: ModuleType) -> list[str]:
    pending = schema_state(conn, adapter, require_current=False)
    applied = []
    for version, sha, sql in pending:
        _executestatements(conn, sql)
        conn.execute('INSERT INTO schema_migrations(version,sha256,applied_at) VALUES (?,?,?)', (version, sha, now()))
        applied.append(version)
    return applied


def _identity(conn: sqlite3.Connection, adapter: ModuleType) -> dict:
    row = conn.execute('SELECT * FROM dataset_versions WHERE id=1').fetchone()
    if row is None or row['project_id'] != adapter.PROJECT_ID:
        raise MaintenanceError(f'数据库项目标识不匹配，应为 {adapter.PROJECT_ID}。')
    return dict(row)


def _structural_errors(conn: sqlite3.Connection) -> list[str]:
    errors = []
    integrity = [row[0] for row in conn.execute('PRAGMA integrity_check')]
    if integrity != ['ok']:
        errors.extend('SQLite 完整性：' + str(message) for message in integrity)
    errors.extend('外键断裂：' + str(tuple(row)) for row in conn.execute('PRAGMA foreign_key_check'))
    return errors


def _persisted_sources(conn: sqlite3.Connection) -> list[dict]:
    documents = [dict(row) for row in conn.execute('SELECT path,sha256,size_bytes,content FROM source_documents ORDER BY path')]
    for row in documents:
        path = Path(row['path'])
        if path.is_absolute() or '..' in path.parts or path.as_posix() != row['path']:
            raise MaintenanceError(f'数据库原始文件路径不安全：{row["path"]}')
        if digest(row['content']) != row['sha256'] or len(row['content']) != row['size_bytes']:
            raise MaintenanceError(f'数据库保存的源文件字节已损坏：{row["path"]}')
    if not documents:
        raise MaintenanceError('数据库未保存原始源文件。')
    return documents


def _table_fingerprints(conn: sqlite3.Connection) -> dict:
    """检测仍满足FK的关系丢失；指纹涵盖业务表结构、列值与完整行集合。"""
    excluded = {'schema_migrations', 'dataset_versions', 'source_documents', 'validation_runs'}
    result = {}
    for table in conn.execute("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
        name = table['name']
        if name in excluded:
            continue
        quoted = '"' + name.replace('"', '""') + '"'
        rows = []
        for row in conn.execute('SELECT * FROM ' + quoted):
            values = [{'blob': item.hex()} if isinstance(item, bytes) else item for item in row]
            rows.append(json_text(values))
        result[name] = digest(json_text({'schema': table['sql'], 'rows': sorted(rows)}).encode())
    return result


def _table_errors(conn: sqlite3.Connection, metadata: dict) -> list[str]:
    recorded = json.loads(metadata['metadata_json']).get('_table_fingerprints')
    if recorded is None:
        return ['旧维护库缺少业务表指纹，请从规范源 rebuild。']
    actual = _table_fingerprints(conn)
    changed = sorted(name for name in set(recorded) | set(actual) if recorded.get(name) != actual.get(name))
    return ['数据库业务表内容或结构已变：' + ', '.join(changed)] if changed else []


def _validate(conn: sqlite3.Connection, adapter: ModuleType, *, current_sources: bool = True, domain: bool = True) -> dict:
    schema_state(conn, adapter)
    metadata = _identity(conn, adapter)
    errors = _structural_errors(conn) + _table_errors(conn, metadata)
    documents = _persisted_sources(conn)
    stored_fingerprint = fingerprint(documents)
    if stored_fingerprint != metadata['source_fingerprint']:
        errors.append('数据库源清单指纹与版本记录不一致。')
    stale = None
    if current_sources:
        actual = source_snapshot(adapter)
        stale = fingerprint(actual) != metadata['source_fingerprint']
        if stale:
            old = {row['path']: row['sha256'] for row in documents}
            new = {row['path']: row['sha256'] for row in actual}
            changed = sorted(key for key in set(old) | set(new) if old.get(key) != new.get(key))
            errors.append('数据库已过期，请重建；变更规范源：' + ', '.join(changed[:12]) + (' …' if len(changed) > 12 else ''))
    if domain:
        errors.extend(adapter.validate(conn))
    return {'project': adapter.PROJECT_ID, 'ok': not errors, 'errors': errors, 'stale': stale,
            'source_files': len(documents), 'source_fingerprint': metadata['source_fingerprint'],
            'imported_at': metadata['imported_at']}


def check(adapter: ModuleType, path: Path) -> dict:
    try:
        with connect(path, readonly=True) as conn:
            return _validate(conn, adapter)
    except (MaintenanceError, sqlite3.Error, OSError, ValueError, KeyError) as exc:
        return {'project': adapter.PROJECT_ID, 'ok': False, 'errors': [str(exc)]}


def _backup(adapter: ModuleType, path: Path, destination: Path | None = None) -> Path:
    if destination is None:
        directory = path.parent.parent / 'backups' / adapter.PROJECT_ID
        directory.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')
        destination = directory / f'{stamp}-{uuid.uuid4().hex[:10]}.sqlite'
    destination = Path(destination).resolve()
    if destination.exists() or destination == path.resolve():
        raise MaintenanceError(f'备份目标已存在或等于原数据库：{destination}')
    if destination.suffix.lower() not in {'.sqlite', '.sqlite3', '.db'}:
        raise MaintenanceError('备份文件须使用 .sqlite、.sqlite3 或 .db 后缀。')
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with connect(path, readonly=True) as source:
            _identity(source, adapter)
            errors = _structural_errors(source)
            if errors:
                raise MaintenanceError('原数据库完整性异常，拒绝生成普通备份：' + '; '.join(errors))
            target = sqlite3.connect(destination)
            try:
                source.backup(target)
            finally:
                target.close()
    except BaseException:
        destination.unlink(missing_ok=True)
        raise
    return destination


def backup(adapter: ModuleType, path: Path, destination: Path | None = None) -> dict:
    with operation_lock(path):
        result = _backup(adapter, path, destination)
    return {'project': adapter.PROJECT_ID, 'backup': str(result)}


def _new_staging(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.' + path.stem + '-rebuild-', suffix='.sqlite', dir=path.parent)
    os.close(fd)
    return Path(name)


def rebuild(adapter: ModuleType, path: Path, *, only_if_missing: bool = False) -> dict:
    path = Path(path).resolve()
    with operation_lock(path):
        if only_if_missing and path.exists():
            report = check(adapter, path)
            if not report['ok']:
                raise MaintenanceError('; '.join(report['errors']))
            return {**report, 'operation': 'init', 'created': False}
        documents = source_snapshot(adapter)
        original_fingerprint = fingerprint(documents)
        previous = _backup(adapter, path) if path.exists() else None
        staging = _new_staging(path)
        try:
            conn = connect(staging)
            try:
                conn.execute('BEGIN IMMEDIATE')
                applied = _apply_migrations(conn, adapter)
                conn.executemany('INSERT INTO source_documents(path,sha256,size_bytes,content) VALUES (:path,:sha256,:size_bytes,:content)', documents)
                counts = adapter.populate(conn)
                version_metadata = {**counts, '_table_fingerprints': _table_fingerprints(conn)}
                conn.execute('INSERT INTO dataset_versions VALUES (1,?,?,?,?)', (adapter.PROJECT_ID, original_fingerprint, now(), json_text(version_metadata)))
                report = _validate(conn, adapter)
                if fingerprint(source_snapshot(adapter)) != original_fingerprint:
                    raise MaintenanceError('导入期间规范源发生变化，原数据库保持不变，请重试。')
                if not report['ok']:
                    raise MaintenanceError('; '.join(report['errors']))
                conn.execute('INSERT INTO validation_runs(operation,status,checked_at,details_json) VALUES (?,?,?,?)', ('rebuild', 'passed', now(), json_text(report)))
                conn.commit()
            except BaseException:
                conn.rollback()
                raise
            finally:
                conn.close()
            os.replace(staging, path)
            return {**report, 'operation': 'init' if only_if_missing else 'rebuild', 'created': True,
                    'database': str(path), 'backup': str(previous) if previous else None,
                    'migrations': applied, 'counts': counts}
        finally:
            staging.unlink(missing_ok=True)
            Path(str(staging) + '-journal').unlink(missing_ok=True)


def migrate(adapter: ModuleType, path: Path) -> dict:
    with operation_lock(path):
        with connect(path, readonly=True) as source:
            metadata = _identity(source, adapter)
            errors = _structural_errors(source) + _table_errors(source, metadata)
            if fingerprint(_persisted_sources(source)) != metadata['source_fingerprint']:
                errors.append('数据库源清单指纹与版本记录不一致。')
            if errors:
                raise MaintenanceError('; '.join(errors))
            pending = schema_state(source, adapter, require_current=False)
        if not pending:
            return {'project': adapter.PROJECT_ID, 'migrations': [], 'backup': None}
        previous = _backup(adapter, path)
        conn = connect(path)
        try:
            conn.execute('BEGIN IMMEDIATE')
            applied = _apply_migrations(conn, adapter)
            errors = _structural_errors(conn) + adapter.validate(conn)
            if errors:
                raise MaintenanceError('; '.join(errors))
            version_metadata = json.loads(_identity(conn, adapter)['metadata_json'])
            version_metadata['_table_fingerprints'] = _table_fingerprints(conn)
            conn.execute('UPDATE dataset_versions SET metadata_json=? WHERE id=1', (json_text(version_metadata),))
            conn.execute('INSERT INTO validation_runs(operation,status,checked_at,details_json) VALUES (?,?,?,?)', ('migrate', 'passed', now(), json_text({'migrations': applied})))
            conn.commit()
            return {'project': adapter.PROJECT_ID, 'migrations': applied, 'backup': str(previous)}
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()


def restore(adapter: ModuleType, path: Path, source_path: Path) -> dict:
    source_path = Path(source_path).resolve()
    path = Path(path).resolve()
    if source_path == path:
        raise MaintenanceError('恢复输入不能与当前数据库相同。')
    with operation_lock(path):
        staging = _new_staging(path)
        try:
            with connect(source_path, readonly=True) as source:
                source.execute('BEGIN')
                report = _validate(source, adapter, current_sources=False, domain=False)
                if not report['ok']:
                    raise MaintenanceError('; '.join(report['errors']))
                target = sqlite3.connect(staging)
                try:
                    source.backup(target)
                finally:
                    target.close()
            # 验证将被替换的实际副本；既不信任文件名，也不只在替换后报告错误。
            with connect(staging, readonly=True) as copied:
                report = _validate(copied, adapter, current_sources=False, domain=False)
                if not report['ok']:
                    raise MaintenanceError('; '.join(report['errors']))
            previous = _backup(adapter, path) if path.exists() else None
            os.replace(staging, path)
        finally:
            staging.unlink(missing_ok=True)
        report = check(adapter, path)
        # 恢复旧数据可以成功，但绝不能把过期库报告为当前版本。
        return {'project': adapter.PROJECT_ID, 'restored': True, 'backup': str(previous) if previous else None,
                'current_check': report}


def export_sources(adapter: ModuleType, path: Path, destination: Path) -> dict:
    destination = Path(destination).resolve()
    if destination.exists():
        raise MaintenanceError('导出目录必须尚不存在，避免覆盖规范源或其他文件。')
    if destination == Path(adapter.ROOT).resolve() or Path(adapter.ROOT).resolve().is_relative_to(destination):
        raise MaintenanceError('导出目标不能包含当前项目源码。')
    with connect(path, readonly=True) as conn:
        schema_state(conn, adapter)
        metadata = _identity(conn, adapter)
        documents = _persisted_sources(conn)
        if fingerprint(documents) != metadata['source_fingerprint']:
            raise MaintenanceError('数据库源清单指纹与版本记录不一致，拒绝导出混合版本。')
    destination.mkdir(parents=True, exist_ok=False)
    for row in documents:
        target = destination / row['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(row['content'])
    return {'project': adapter.PROJECT_ID, 'destination': str(destination), 'files': len(documents), 'source_fingerprint': fingerprint(documents)}


def stats(adapter: ModuleType, path: Path) -> dict:
    with connect(path, readonly=True) as conn:
        schema_state(conn, adapter)
        metadata = _identity(conn, adapter)
        tables = {}
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
            name = row['name']
            quoted = '"' + name.replace('"', '""') + '"'
            tables[name] = conn.execute('SELECT COUNT(*) FROM ' + quoted).fetchone()[0]
        public_metadata = {key: value for key, value in metadata.items() if key != 'metadata_json'}
        public_metadata['metadata'] = {key: value for key, value in json.loads(metadata['metadata_json']).items() if not key.startswith('_')}
        return {'project': adapter.PROJECT_ID, 'schema': [row[0] for row in conn.execute('SELECT version FROM schema_migrations')],
                'dataset': public_metadata, 'tables': tables, 'summary': adapter.summary(conn)}


def query(adapter: ModuleType, path: Path, sql: str, *, limit: int = 200) -> dict:
    if not 1 <= limit <= 10000:
        raise MaintenanceError('查询返回行数须为 1–10000。')
    if not sql.strip() or len(sql) > 1000000:
        raise MaintenanceError('SQL 为空或过长。')
    with connect(path, readonly=True) as conn:
        _identity(conn, adapter)
        allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION}
        if hasattr(sqlite3, 'SQLITE_RECURSIVE'):
            allowed.add(sqlite3.SQLITE_RECURSIVE)
        def authorize(action, one, two, database, trigger):
            if action == sqlite3.SQLITE_FUNCTION and str(two).lower() in {'load_extension', 'writefile', 'readfile'}:
                return sqlite3.SQLITE_DENY
            return sqlite3.SQLITE_OK if action in allowed else sqlite3.SQLITE_DENY
        conn.set_authorizer(authorize)
        if hasattr(conn, 'setlimit'):
            conn.setlimit(sqlite3.SQLITE_LIMIT_LENGTH, 8 * 1024 * 1024)
            conn.setlimit(sqlite3.SQLITE_LIMIT_SQL_LENGTH, 1024 * 1024)
            conn.setlimit(sqlite3.SQLITE_LIMIT_COLUMN, 1000)
            conn.setlimit(sqlite3.SQLITE_LIMIT_EXPR_DEPTH, 100)
        # 约一千万 VM 指令后中断，避免无限递归/巨大笛卡尔积阻塞维护。
        budget = [10000]
        def progress():
            budget[0] -= 1
            return budget[0] <= 0
        conn.set_progress_handler(progress, 1000)
        cursor = conn.execute(sql)
        if cursor.description is None:
            raise MaintenanceError('只接受返回结果集的 SELECT 查询。')
        rows = cursor.fetchmany(limit + 1)
        def value(item):
            if isinstance(item, bytes):
                return {'type': 'blob', 'bytes': len(item), 'sha256': digest(item)}
            return item
        return {'project': adapter.PROJECT_ID, 'read_only': True, 'columns': [item[0] for item in cursor.description],
                'rows': [[value(cell) for cell in row] for row in rows[:limit]], 'truncated': len(rows) > limit}
