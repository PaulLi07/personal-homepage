"""验证源码/发布包隔离及静态资源闭合，不启动浏览器或写规范资料。"""
from pathlib import Path
import importlib.util
import json
import re
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("homepage_package", ROOT / "scripts/tools/package.py")
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class DistributionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = set(packager.source_files())
        cls.publish = {p for p in cls.source if packager.publish_file(p)}

    def test_source_contains_rebuild_inputs(self):
        for path in ("maintenance/engine.py", "scripts/data.py",
                     "modules/academic/projects/physicists/archive/en/data/physicists.json",
                     "modules/academic/projects/experiment-atlas/database/migrations/001_initial.sql",
                     "modules/academic/projects/physicists/database/migrations/001_initial.sql"):
            self.assertIn(ROOT / path, self.source)

    def test_local_database_and_secrets_excluded_even_without_git(self):
        # 直接测提取源码后的独立排除规则，不依赖Git忽略生效。
        with tempfile.TemporaryDirectory(dir=ROOT, prefix="maintenance-layout-fixture-") as temporary:
            directory = Path(temporary)
            schema = directory / "allowed.sql"
            schema.touch()
            self.assertTrue(packager.include(schema))
            for name in (".maintenance/databases/a.sqlite", ".maintenance/backups/a.sqlite",
                         ".private/example.json", "nested/db.sqlite-wal", "nested/db.sqlite-shm",
                         "nested/db.db", "nested/db.db-journal", ".env"):
                path = directory / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.touch()
                self.assertFalse(packager.include(path), name)
        self.assertFalse(any(".maintenance" in p.parts or ".private" in p.parts for p in self.source))

    def test_publish_excludes_maintenance_but_keeps_runtime_dossiers(self):
        for path in self.publish:
            rel = path.relative_to(ROOT)
            self.assertNotIn(rel.parts[0], {"docs", "maintenance", "scripts"})
            self.assertFalse(any(p in {"tools", "tests", "database", "migrations"} for p in rel.parts))
            self.assertNotIn(path.suffix, {".sqlite", ".py", ".sql", ".cjs"})
        for path in ("index.html", "credits.html", "app/main.js",
                     "modules/academic/projects/experiment-atlas/neutrino/archive/juno/record.json",
                     "modules/academic/projects/experiment-atlas/dark-matter/data/catalog.json",
                     "modules/academic/projects/physicists/archive/website/site/data/archive.js",
                     "modules/academic/projects/physicists/archive/website/site/help/method.en.md"):
            self.assertIn(ROOT / path, self.publish)
        self.assertNotIn(ROOT / "modules/academic/projects/physicists/archive/en/data/physicists.json", self.publish)
        self.assertNotIn(ROOT / "modules/about/section.html", self.publish)

    def check_reference(self, origin, value):
        if not value or value.startswith(("#", "data:")):
            return
        url = urlsplit(value)
        if url.scheme or url.netloc:
            return
        path = unquote(url.path)
        if not path:
            return
        self.assertFalse(path.startswith("/"), (origin, value))
        resolved = (origin.parent / path).resolve()
        self.assertTrue(resolved.is_relative_to(ROOT), (origin, value))
        if resolved.is_dir():
            resolved /= "index.html"
        self.assertIn(resolved, self.publish, (str(origin.relative_to(ROOT)), value))

    def test_publish_html_css_and_module_references_closed(self):
        for path in sorted(self.publish):
            if path.suffix not in {".html", ".css", ".js"}:
                continue
            text = path.read_text(encoding="utf-8")
            if path.suffix == ".html":
                for value in re.findall(r'(?:src|href)\s*=\s*[\"\']([^\"\']+)[\"\']', text):
                    self.check_reference(path, value)
            elif path.suffix == ".css":
                for value in re.findall(r'url\(\s*[\"\']?([^\"\')\s]+)', text):
                    self.check_reference(path, value)
            else:
                for value in re.findall(r'new URL\(\s*[\"\']([^\"\']+)[\"\']\s*,\s*import.meta.url', text):
                    self.check_reference(path, value)
                for value in re.findall(r'(?:import|export)\s+[^;]*?from\s*[\"\'](\.[^\"\']+)[\"\']', text):
                    self.check_reference(path, value)

    def test_legacy_script_entrypoints_remain(self):
        package = json.loads((ROOT / "package.json").read_text())
        for path in ("scripts/assemble.py", "scripts/check.mjs", "scripts/package.py", "scripts/relationship.cjs"):
            self.assertIn(ROOT / path, self.source)
        for path in (ROOT / "scripts/tests").glob("test-*.cjs"):
            self.assertIn(ROOT / "scripts" / path.name, self.source)
        self.assertEqual(package["scripts"]["check"], "node scripts/check.mjs")


if __name__ == "__main__":
    (ROOT / "artifacts").mkdir(exist_ok=True)
    unittest.main()
