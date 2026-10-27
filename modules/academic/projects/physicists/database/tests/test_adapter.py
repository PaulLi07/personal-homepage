"""人物关系库真实语料及约束测试；只在临时内存库工作。"""
import importlib.util
import hashlib
import json
from pathlib import Path
import sqlite3
import unittest

ADAPTER_FILE = Path(__file__).resolve().parents[1] / 'adapter.py'
spec = importlib.util.spec_from_file_location('physicists_adapter_test', ADAPTER_FILE)
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


class PhysicistsDatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline = sqlite3.connect(':memory:')
        cls.baseline.execute('PRAGMA foreign_keys=ON')
        cls.baseline.execute('CREATE TABLE source_documents (path TEXT PRIMARY KEY,sha256 TEXT,size_bytes INTEGER,content BLOB)')
        cls.baseline.executescript((adapter.MIGRATIONS / '001_initial.sql').read_text())
        for file in adapter.source_files():
            raw = file.read_bytes()
            cls.baseline.execute('INSERT INTO source_documents VALUES (?,?,?,?)',
                                 (file.relative_to(adapter.ROOT).as_posix(),hashlib.sha256(raw).hexdigest(),len(raw),raw))
        cls.counts = adapter.populate(cls.baseline)
        cls.baseline.commit()

    @classmethod
    def tearDownClass(cls):
        cls.baseline.close()

    def setUp(self):
        self.connection = sqlite3.connect(':memory:')
        self.baseline.backup(self.connection)
        self.connection.execute('PRAGMA foreign_keys=ON')
        self.connection.row_factory = sqlite3.Row

    def tearDown(self):
        self.connection.close()

    def test_complete_corpus_and_source_order(self):
        self.assertEqual(self.counts['people'],721)
        self.assertEqual(self.counts['events'],691)
        self.assertEqual(self.counts['portraits'],721)
        self.assertEqual(self.counts['patchStages'],{'1':42,'2':390,'3':8})
        self.assertEqual(adapter.validate(self.connection),[])
        self.assertEqual(self.connection.execute('PRAGMA integrity_check').fetchone()[0],'ok')

    def test_raw_payload_and_original_bytes_round_trip(self):
        for row in self.connection.execute('SELECT path,sha256,size_bytes,content FROM source_documents'):
            self.assertEqual(row['content'],(adapter.ROOT/row['path']).read_bytes())
            self.assertEqual(hashlib.sha256(row['content']).hexdigest(),row['sha256'])
            self.assertEqual(len(row['content']),row['size_bytes'])
        raw = json.loads(self.connection.execute('SELECT payload_json FROM events_raw WHERE id=?',('early-democritus-atomism',)).fetchone()[0])
        self.assertIsNone(raw['year'])
        self.assertEqual(raw['precision'],'range')

    def test_historical_negative_and_unknown_dates_are_not_sql_dates(self):
        row=self.connection.execute("SELECT sort_year,birth_json FROM people WHERE id='thales'").fetchone()
        self.assertEqual(row['sort_year'],-624)
        self.assertEqual(json.loads(row['birth_json'])['date'],'-0624')
        row=self.connection.execute("SELECT death_json,death_status FROM people WHERE id='ettore-majorana'").fetchone()
        self.assertIsNone(row['death_json'])
        self.assertEqual(row['death_status'],'unknown')

    def test_foreign_keys_reject_nonexistent_participant(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("INSERT INTO event_people VALUES ('early-democritus-atomism','missing-person',99)")

    def test_unique_identity_and_patch_stage_order_are_enforced(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE people SET id='thales' WHERE ordinal=2")
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute('UPDATE event_patches SET stage=0 WHERE id=1')

    def test_changed_normalized_column_or_missing_link_is_detected(self):
        self.connection.execute("UPDATE people SET name='Altered' WHERE id='thales'")
        self.assertIn('People payload/order differs from canonical English source',adapter.validate(self.connection))
        self.connection.rollback()
        self.connection.execute("DELETE FROM person_fields WHERE person_id='isaac-newton'")
        self.assertTrue(any('Field assignments differ: isaac-newton' in e for e in adapter.validate(self.connection)))

    def test_stats_review_dates_come_from_saved_snapshot_not_current_files(self):
        documents = [(adapter.PEOPLE_SOURCE, 'as_of', '2025-01-02'),
                     (adapter.EVENT_ROOT + '/index-config.json', 'reviewedAt', '2025-02-03')]
        for path, key, date in documents:
            payload = json.loads(self.connection.execute('SELECT content FROM source_documents WHERE path=?', (path,)).fetchone()[0])
            payload[key] = date
            self.connection.execute('UPDATE source_documents SET content=? WHERE path=?', (json.dumps(payload).encode(), path))
        counts = adapter.summary(self.connection)
        self.assertEqual(counts['biographiesReviewed'], '2025-01-02')
        self.assertEqual(counts['eventsReviewed'], '2025-02-03')
        self.assertNotEqual(counts['biographiesReviewed'], adapter.read(adapter.PEOPLE_SOURCE)['as_of'])
        self.assertNotEqual(counts['eventsReviewed'], adapter.read(adapter.EVENT_ROOT + '/index-config.json')['reviewedAt'])

    def test_each_normalized_person_and_event_column_is_checked_against_source(self):
        changes = [('people', 'thales', 'name', 'Changed'),
                   ('people', 'thales', 'sort_year', -623),
                   ('people', 'thales', 'birth_json', '{}'),
                   ('people', 'thales', 'death_json', '{}'),
                   ('people', 'thales', 'death_status', 'unknown'),
                   ('people', 'thales', 'source_path', adapter.EVENT_ROOT + '/index-config.json'),
                   ('events_raw', 'early-democritus-atomism', 'title', 'Changed'),
                   ('events_raw', 'early-democritus-atomism', 'date_json', '{}'),
                   ('events_raw', 'early-democritus-atomism', 'event_type', 'method')]
        for table, identity, column, changed in changes:
            with self.subTest(table=table, column=column):
                original_payload = self.connection.execute(f'SELECT payload_json FROM {table} WHERE id=?', (identity,)).fetchone()[0]
                self.connection.execute(f'UPDATE {table} SET {column}=? WHERE id=?', (changed, identity))
                self.assertEqual(self.connection.execute(f'SELECT payload_json FROM {table} WHERE id=?', (identity,)).fetchone()[0], original_payload)
                self.assertEqual(list(self.connection.execute('PRAGMA foreign_key_check')), [])
                self.assertTrue(adapter.validate(self.connection))
                self.connection.rollback()

    def test_media_hash_and_source_payload_mutation_are_detected(self):
        self.connection.execute("UPDATE media_assets SET sha256=? WHERE id='thales'",('0'*64,))
        self.assertTrue(any('Portrait metadata differs: thales' in e for e in adapter.validate(self.connection)))
        self.connection.rollback()
        self.connection.execute("UPDATE sources SET title='Altered' WHERE id=(SELECT id FROM sources LIMIT 1)")
        self.assertTrue(any('Source payload/hash differs:' in e for e in adapter.validate(self.connection)))


if __name__=='__main__':
    unittest.main()
