"""只用临时规范源与数据库，覆盖真实事务、约束、备份及失败边界。"""
import hashlib
import json
from pathlib import Path
import sqlite3
import tempfile
from types import SimpleNamespace
import unittest

from maintenance import engine

INITIAL = '''
CREATE TABLE people (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE links (id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES people(id));
'''


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.source = self.root / 'project'
        self.source.mkdir()
        self.migrations = self.source / 'database/migrations'
        self.migrations.mkdir(parents=True)
        (self.migrations / '001_initial.sql').write_text(INITIAL)
        self.document = self.source / 'records.json'
        # 空白、非 ASCII 和键顺序必须逐字节保留，不是 json.dumps 往返。
        self.document.write_bytes('{ "people": [{"id":"p1","name":"René"}], "optional": null }\n'.encode())
        self.adapter = SimpleNamespace(PROJECT_ID='fixture', ROOT=self.source, MIGRATIONS=self.migrations,
            source_files=lambda: [self.document], populate=self.populate,
            validate=lambda conn: [] if conn.execute('SELECT COUNT(*) FROM people').fetchone()[0] else ['人物为空'],
            summary=lambda conn: {'people': conn.execute('SELECT COUNT(*) FROM people').fetchone()[0]})
        self.database = self.root / '.maintenance/databases/fixture.sqlite'

    def tearDown(self):
        self.directory.cleanup()

    def populate(self, conn):
        data = json.loads(self.document.read_bytes())
        for person in data['people']:
            conn.execute('INSERT INTO people VALUES (?,?)', (person['id'], person['name']))
            conn.execute('INSERT INTO links VALUES (?,?)', ('link-' + person['id'], person['id']))
        return {'people': len(data['people'])}

    def initialize(self):
        return engine.rebuild(self.adapter, self.database, only_if_missing=True)

    def test_initialize_check_stats_idempotent(self):
        result = self.initialize()
        self.assertTrue(result['ok'])
        self.assertTrue(result['created'])
        self.assertEqual(result['migrations'], ['base:001', 'project:001_initial'])
        self.assertTrue(engine.check(self.adapter, self.database)['ok'])
        original = self.database.read_bytes()
        again = engine.rebuild(self.adapter, self.database, only_if_missing=True)
        self.assertFalse(again['created'])
        self.assertEqual(original, self.database.read_bytes())
        self.assertEqual(engine.stats(self.adapter, self.database)['summary'], {'people': 1})
        with engine.connect(self.database, readonly=True) as conn:
            self.assertEqual(conn.execute('PRAGMA foreign_keys').fetchone()[0], 1)
            self.assertEqual(conn.execute('SELECT content FROM source_documents').fetchone()[0], self.document.read_bytes())

    def test_export_exact_and_refuse_overwrite(self):
        self.initialize()
        output = self.root / 'export'
        result = engine.export_sources(self.adapter, self.database, output)
        self.assertEqual(result['files'], 1)
        self.assertEqual((output / 'records.json').read_bytes(), self.document.read_bytes())
        with self.assertRaises(engine.MaintenanceError):
            engine.export_sources(self.adapter, self.database, output)
        with self.assertRaises(engine.MaintenanceError):
            engine.export_sources(self.adapter, self.database, self.source)

    def test_query_readonly_and_limits(self):
        self.initialize()
        original = self.database.read_bytes()
        for sql in ["UPDATE people SET name='Changed'", 'DROP TABLE people', "ATTACH DATABASE ':memory:' AS other", 'PRAGMA user_version=8', 'VACUUM', 'BEGIN', 'SELECT 1; DELETE FROM people', "SELECT load_extension('missing')"]:
            with self.subTest(sql=sql), self.assertRaises((sqlite3.Error, engine.MaintenanceError)):
                engine.query(self.adapter, self.database, sql)
        result = engine.query(self.adapter, self.database, 'WITH samples(n) AS (VALUES (1),(2),(3)) SELECT n FROM samples', limit=2)
        self.assertTrue(result['truncated'])
        self.assertEqual(result['rows'], [[1], [2]])
        self.assertEqual(original, self.database.read_bytes())
        with self.assertRaises(engine.MaintenanceError):
            engine.query(self.adapter, self.database, 'SELECT 1', limit=0)
        with self.assertRaises(sqlite3.Error):
            engine.query(self.adapter, self.database, 'WITH RECURSIVE x(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM x) SELECT SUM(n) FROM x')

    def test_backup_restore_and_stale_reporting(self):
        self.initialize()
        first = engine.backup(self.adapter, self.database)['backup']
        self.document.write_text('{"people":[{"id":"p2","name":"Newton"}]}')
        self.assertFalse(engine.check(self.adapter, self.database)['ok'])
        rebuilt = engine.rebuild(self.adapter, self.database)
        self.assertIsNotNone(rebuilt['backup'])
        self.assertEqual(engine.query(self.adapter, self.database, 'SELECT id FROM people')['rows'], [['p2']])
        restored = engine.restore(self.adapter, self.database, Path(first))
        self.assertTrue(restored['restored'])
        self.assertFalse(restored['current_check']['ok'])
        self.assertTrue(restored['current_check']['stale'])
        self.assertEqual(engine.query(self.adapter, self.database, 'SELECT id FROM people')['rows'], [['p1']])
        self.assertIsNotNone(restored['backup'])

    def test_restore_corrupt_and_wrong_project_preserves_database(self):
        self.initialize()
        old = self.database.read_bytes()
        corrupt = self.root / 'corrupt.sqlite'
        corrupt.write_bytes(b'not a sqlite database')
        with self.assertRaises(sqlite3.Error):
            engine.restore(self.adapter, self.database, corrupt)
        self.assertEqual(old, self.database.read_bytes())
        other = engine.backup(self.adapter, self.database)['backup']
        with sqlite3.connect(other) as conn:
            conn.execute("UPDATE dataset_versions SET project_id='someone-else'")
        with self.assertRaises(engine.MaintenanceError):
            engine.restore(self.adapter, self.database, Path(other))
        self.assertEqual(old, self.database.read_bytes())

    def test_restore_rejects_logically_corrupt_relationships(self):
        self.initialize()
        original = self.database.read_bytes()
        copied = Path(engine.backup(self.adapter, self.database)['backup'])
        with sqlite3.connect(copied) as conn:
            conn.execute('DELETE FROM links')
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertEqual(conn.execute('PRAGMA foreign_key_check').fetchall(), [])
        with self.assertRaises(engine.MaintenanceError):
            engine.restore(self.adapter, self.database, copied)
        self.assertEqual(original, self.database.read_bytes())

    def test_source_parent_symlink_rejected(self):
        nested = self.source / 'canonical'
        nested.mkdir()
        (nested / 'data.json').write_text('{}')
        linked = self.source / 'linked'
        try:
            linked.symlink_to(nested, target_is_directory=True)
        except OSError:
            self.skipTest('当前平台没有符号链接权限')
        self.adapter.source_files = lambda: [linked / 'data.json']
        with self.assertRaises(engine.MaintenanceError):
            self.initialize()

    def test_constraints_failed_rebuild_is_atomic(self):
        self.initialize()
        original = self.database.read_bytes()
        self.document.write_text('{"people":[{"id":"p1","name":"One"},{"id":"p1","name":"Two"}]}')
        with self.assertRaises(sqlite3.IntegrityError):
            engine.rebuild(self.adapter, self.database)
        self.assertEqual(self.database.read_bytes(), original)
        self.adapter.populate = lambda conn: conn.execute("INSERT INTO links VALUES ('bad','missing')")
        with self.assertRaises(sqlite3.IntegrityError):
            engine.rebuild(self.adapter, self.database)
        self.assertEqual(self.database.read_bytes(), original)
        self.assertEqual(list(self.database.parent.glob('.*-rebuild-*')), [])

    def test_successful_migration_and_failed_migration_rollback(self):
        self.initialize()
        (self.migrations / '002_extra.sql').write_text('CREATE TABLE extra (id TEXT PRIMARY KEY); INSERT INTO extra VALUES (\'one\');')
        self.assertFalse(engine.check(self.adapter, self.database)['ok'])
        result = engine.migrate(self.adapter, self.database)
        self.assertEqual(result['migrations'], ['project:002_extra'])
        self.assertTrue(Path(result['backup']).is_file())
        self.assertTrue(engine.check(self.adapter, self.database)['ok'])
        (self.migrations / '003_failure.sql').write_text('CREATE TABLE rolled_back (id INTEGER); INSERT INTO does_not_exist VALUES (1);')
        with self.assertRaises(sqlite3.Error):
            engine.migrate(self.adapter, self.database)
        with engine.connect(self.database, readonly=True) as conn:
            self.assertFalse(conn.execute("SELECT 1 FROM sqlite_master WHERE name='rolled_back'").fetchone())
            self.assertFalse(conn.execute("SELECT 1 FROM schema_migrations WHERE version='project:003_failure'").fetchone())
            self.assertEqual(conn.execute('SELECT * FROM extra').fetchone()[0], 'one')

    def test_edited_migration_rejected(self):
        self.initialize()
        (self.migrations / '001_initial.sql').write_text(INITIAL + '\n-- changed\n')
        result = engine.check(self.adapter, self.database)
        self.assertFalse(result['ok'])
        self.assertIn('已应用迁移被修改', result['errors'][0])
        with self.assertRaises(engine.MaintenanceError):
            engine.migrate(self.adapter, self.database)

    def test_migrate_and_export_reject_mixed_source_snapshot(self):
        self.initialize()
        payload = b'{}'
        with engine.connect(self.database) as conn:
            conn.execute('INSERT INTO source_documents VALUES (?,?,?,?)', ('extra.json', engine.digest(payload), len(payload), payload))
        (self.migrations / '002_extra.sql').write_text('CREATE TABLE extra (id INTEGER);')
        with self.assertRaises(engine.MaintenanceError):
            engine.migrate(self.adapter, self.database)
        # export 首先要求结构最新，因此暂移尚未应用的迁移，单独检查源版本指纹。
        (self.migrations / '002_extra.sql').unlink()
        with self.assertRaises(engine.MaintenanceError):
            engine.export_sources(self.adapter, self.database, self.root / 'mixed-export')
        self.assertFalse((self.root / 'mixed-export').exists())

    def test_persisted_source_corruption_and_unsafe_export(self):
        self.initialize()
        with engine.connect(self.database) as conn:
            conn.execute("UPDATE source_documents SET content=x'00'")
        self.assertFalse(engine.check(self.adapter, self.database)['ok'])
        with self.assertRaises(engine.MaintenanceError):
            engine.export_sources(self.adapter, self.database, self.root / 'bad-export')
        with engine.connect(self.database) as conn:
            conn.execute('UPDATE source_documents SET content=?,path=?', (self.document.read_bytes(), '../escape.json'))
        with self.assertRaises(engine.MaintenanceError):
            engine.export_sources(self.adapter, self.database, self.root / 'escape-export')

    def test_corrupt_database_and_missing_database_checks(self):
        result = engine.check(self.adapter, self.database)
        self.assertFalse(result['ok'])
        self.assertFalse(self.database.exists())
        self.database.parent.mkdir(parents=True)
        self.database.write_bytes(b'broken')
        self.assertFalse(engine.check(self.adapter, self.database)['ok'])

    def test_source_changes_during_import_preserve_old_database(self):
        self.initialize()
        original = self.database.read_bytes()
        def unstable(conn):
            counts = self.populate(conn)
            self.document.write_text('{"people":[{"id":"p9","name":"Later"}]}')
            return counts
        self.adapter.populate = unstable
        with self.assertRaises(engine.MaintenanceError):
            engine.rebuild(self.adapter, self.database)
        self.assertEqual(self.database.read_bytes(), original)

    def test_domain_validation_failure_is_atomic(self):
        self.initialize()
        original = self.database.read_bytes()
        self.adapter.validate = lambda conn: ['模拟领域校验失败']
        with self.assertRaises(engine.MaintenanceError):
            engine.rebuild(self.adapter, self.database)
        self.assertEqual(self.database.read_bytes(), original)

    def test_duplicate_and_escaped_source_paths_rejected(self):
        self.adapter.source_files = lambda: [self.document, self.document]
        with self.assertRaises(engine.MaintenanceError):
            self.initialize()
        outsider = self.root / 'outside.json'
        outsider.write_text('{}')
        self.adapter.source_files = lambda: [outsider]
        with self.assertRaises(engine.MaintenanceError):
            self.initialize()

    def test_mutation_lock_prevents_overlapping_maintenance(self):
        self.initialize()
        with engine.operation_lock(self.database):
            with self.assertRaises(engine.MaintenanceError):
                engine.backup(self.adapter, self.database)


if __name__ == '__main__':
    unittest.main()
