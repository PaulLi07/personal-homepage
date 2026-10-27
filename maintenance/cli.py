"""本地维护命令；根入口只负责选择项目与协调公共设施。"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import sqlite3
import sys

from . import engine

REPOSITORY = Path(__file__).resolve().parents[1]
PROJECTS = {
    'physics-maps': Path('modules/academic/projects/experiment-atlas/database/adapter.py'),
    'physicists': Path('modules/academic/projects/physicists/database/adapter.py'),
}


def load_adapter(project: str):
    path = REPOSITORY / PROJECTS[project]
    if not path.is_file():
        raise engine.MaintenanceError(f'项目数据库适配器不存在：{path}')
    spec = importlib.util.spec_from_file_location('homepage_database_' + project.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    required = ('PROJECT_ID', 'ROOT', 'MIGRATIONS', 'source_files', 'populate', 'validate', 'summary')
    if any(not hasattr(module, name) for name in required) or module.PROJECT_ID != project:
        raise engine.MaintenanceError(f'项目数据库适配器契约无效：{path}')
    return module


def parser():
    result = argparse.ArgumentParser(description='本地维护库；JSON 为唯一可编辑资料源，网页不读取 SQLite。')
    result.add_argument('operation', choices=['init', 'rebuild', 'check', 'stats', 'query', 'migrate', 'backup', 'restore', 'export', 'diagnose'])
    result.add_argument('project', choices=[*PROJECTS, 'all'])
    result.add_argument('--database-dir', type=Path, default=REPOSITORY / '.maintenance/databases', help='数据库目录，仅用于明确选择其他维护副本')
    result.add_argument('--sql', help='query 使用的单条只读 SELECT/WITH 查询')
    result.add_argument('--limit', type=int, default=200, help='query 最多返回行数，1–10000，默认 200')
    result.add_argument('--output', type=Path, help='export 的新目录，或 backup 的新 SQLite 文件')
    result.add_argument('--input', type=Path, help='restore 的备份 SQLite 文件')
    return result


def main(argv=None):
    arguments = parser().parse_args(argv)
    if arguments.operation in {'query', 'restore', 'export'} and arguments.project == 'all':
        parser().error('query、restore、export 必须指定单个项目。')
    if arguments.operation == 'query' and not arguments.sql:
        parser().error('query 需要 --sql。')
    if arguments.operation == 'export' and not arguments.output:
        parser().error('export 需要 --output 指定尚不存在的新目录。')
    if arguments.operation == 'restore' and not arguments.input:
        parser().error('restore 需要 --input 指定备份文件。')
    if arguments.operation == 'backup' and arguments.project == 'all' and arguments.output:
        parser().error('批量 backup 使用各项目自动命名，不能指定同一个 --output。')
    projects = list(PROJECTS) if arguments.project == 'all' else [arguments.project]
    results = []
    success = True
    for project in projects:
        try:
            adapter = load_adapter(project)
            path = arguments.database_dir.expanduser().resolve() / (project + '.sqlite')
            operation = arguments.operation
            if operation in {'init', 'rebuild'}:
                result = engine.rebuild(adapter, path, only_if_missing=operation == 'init')
            elif operation == 'check':
                result = engine.check(adapter, path)
            elif operation == 'stats':
                result = engine.stats(adapter, path)
            elif operation == 'query':
                result = engine.query(adapter, path, arguments.sql, limit=arguments.limit)
            elif operation == 'migrate':
                result = engine.migrate(adapter, path)
            elif operation == 'backup':
                result = engine.backup(adapter, path, arguments.output.expanduser() if arguments.output else None)
            elif operation == 'restore':
                result = engine.restore(adapter, path, arguments.input.expanduser())
            elif operation == 'export':
                result = engine.export_sources(adapter, path, arguments.output.expanduser())
            else:
                result = {'project': project, 'sqlite_version': sqlite3.sqlite_version, 'database': str(path),
                          'check': engine.check(adapter, path)}
                result['ok'] = result['check']['ok']
                if result['ok']:
                    result['stats'] = engine.stats(adapter, path)
            if result.get('ok') is False:
                success = False
            results.append(result)
        except (engine.MaintenanceError, sqlite3.Error, OSError, ValueError, KeyError, ImportError) as exc:
            success = False
            results.append({'project': project, 'ok': False, 'error': str(exc)})
    print(json.dumps(results if arguments.project == 'all' else results[0], ensure_ascii=False, indent=2))
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
