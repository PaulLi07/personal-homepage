"""地图维护库的真实资料、关系约束和无损载荷测试。"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("maps_database_adapter", Path(__file__).with_name("adapter.py"))
adapter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(adapter)


class MapsDatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline = sqlite3.connect(":memory:")
        cls.baseline.execute("PRAGMA foreign_keys=ON")
        for migration in sorted(adapter.MIGRATIONS.glob("*.sql")):
            cls.baseline.executescript(migration.read_text(encoding="utf-8"))
        cls.stats = adapter.populate(cls.baseline)
        cls.baseline.commit()

    @classmethod
    def tearDownClass(cls):
        cls.baseline.close()

    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.baseline.backup(self.conn)
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.addCleanup(self.conn.close)

    def test_real_counts_and_cross_map_identity(self):
        self.assertEqual(self.stats["records_by_map"], {"dark-matter": 297, "neutrino": 252})
        self.assertEqual(self.stats["experiments"], 549)
        self.assertEqual(self.stats["shared_experiment_ids"], 38)
        self.assertEqual(self.stats["local_images"], 549)
        self.assertEqual(self.stats["source_citations"], 4724)
        self.assertEqual(self.conn.execute("SELECT count(*) FROM experiments WHERE experiment_id='icecube'").fetchone()[0], 2)

    def test_canonical_source_and_normalized_indices_match(self):
        self.assertEqual(adapter.validate(self.conn), [])
        self.assertEqual(self.conn.execute("PRAGMA foreign_key_check").fetchall(), [])
        self.assertEqual(self.conn.execute("PRAGMA integrity_check").fetchone()[0], "ok")
        for source, payload in self.conn.execute("SELECT source_path,payload_json FROM experiments"):
            self.assertEqual(json.loads(payload), json.loads((adapter.ROOT / source).read_text()))

    def test_source_inputs_exclude_generated_catalog(self):
        files = adapter.source_files()
        self.assertEqual(len(files), len(set(files)))
        self.assertEqual(len([path for path in files if path.name == "record.json"]), 549)
        self.assertFalse(any(path.name == "catalog.json" for path in files))
        self.assertTrue(all(path.is_relative_to(adapter.ROOT) and path.is_file() for path in files))

    def test_duplicate_within_map_is_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.conn.execute("INSERT INTO experiments SELECT * FROM experiments LIMIT 1")

    def test_unknown_region_and_source_are_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.conn.execute("INSERT INTO experiment_regions VALUES ('neutrino','icecube','BAD',999)")
        with self.assertRaises(sqlite3.IntegrityError):
            self.conn.execute("INSERT INTO source_citations VALUES ('neutrino','icecube','/test',0,'missing-source')")

    def test_external_references_are_preserved_without_invented_foreign_keys(self):
        rows = self.conn.execute("SELECT reference,local_experiment_id FROM related_experiments WHERE relation_kind='external-reference'").fetchall()
        self.assertEqual(len(rows), 630)
        self.assertTrue(all(reference and local is None for reference, local in rows))
        self.assertEqual(adapter.validate(self.conn), [])

    def test_region_aggregate_members_and_unsited_survive(self):
        for directory in adapter._maps():
            schema = json.loads((directory / "data/catalog-schema.json").read_text())
            for region in schema["regions"]:
                actual = [row[0] for row in self.conn.execute(
                    "SELECT member_region_id FROM region_members WHERE map_id=? AND region_id=? ORDER BY ordinal",
                    (directory.name, region["id"]))]
                self.assertEqual(actual, region.get("members", []))
        self.assertGreater(self.conn.execute("SELECT count(*) FROM experiment_regions WHERE region_id='UNSITED'").fetchone()[0], 0)

    def test_valid_but_wrong_relation_or_payload_is_detected(self):
        self.conn.execute("DELETE FROM experiment_regions WHERE rowid=(SELECT rowid FROM experiment_regions LIMIT 1)")
        self.conn.execute("UPDATE experiments SET payload_json='{}' WHERE rowid=(SELECT rowid FROM experiments LIMIT 1)")
        errors = adapter.validate(self.conn)
        self.assertTrue(any("experiment_regions" in error for error in errors))
        self.assertTrue(any("experiments" in error for error in errors))

    def test_media_ledger_tampering_is_detected(self):
        self.conn.execute("UPDATE media_assets SET sha256=? WHERE path IS NOT NULL AND rowid=(SELECT rowid FROM media_assets WHERE path IS NOT NULL LIMIT 1)", ("0" * 64,))
        self.assertTrue(any("media_assets" in error for error in adapter.validate(self.conn)))

    def test_media_bytes_hash_and_path_escape_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            directory = root / "test/archive/example"
            directory.mkdir(parents=True)
            image = directory / "image.jpg"
            image.write_bytes(b"temporary test image")
            record = directory / "record.json"
            with patch.object(adapter, "ROOT", root):
                with self.assertRaisesRegex(ValueError, "SHA256 mismatch"):
                    adapter._local_media(record, {"local_path": "image.jpg", "sha256": "0" * 64})
                with self.assertRaisesRegex(ValueError, "unsafe image"):
                    adapter._local_media(record, {"local_path": "../../../../outside.jpg", "sha256": "0" * 64})


if __name__ == "__main__":
    unittest.main()
