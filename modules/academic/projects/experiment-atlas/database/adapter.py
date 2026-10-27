"""Physics Maps 本地维护数据库适配器；不会改写网页或规范资料。"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sqlite3

PROJECT_ID = "physics-maps"
ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = Path(__file__).resolve().parent / "migrations"


def _json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def _load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def _maps():
    return sorted(path.parent.parent for path in ROOT.glob("*/data/catalog-schema.json"))


def source_files():
    """完整输入快照；目录索引是生成物，不成为另一份规范资料。"""
    files = []
    for directory in _maps():
        files.extend(sorted((directory / "archive").glob("*/record.json")))
        files.extend(path for path in sorted((directory / "data").glob("*.json"))
                     if path.name != "catalog.json")
        files.extend(sorted((directory / "assets").glob("*.json")))
    return sorted(files)


def _records(directory):
    return [(path, _load(path)) for path in sorted((directory / "archive").glob("*/record.json"))]


def _citations(value, pointer=""):
    if isinstance(value, dict):
        for key, item in value.items():
            path = pointer + "/" + key.replace("~", "~0").replace("/", "~1")
            if key == "source_ids":
                yield from ((path, ordinal, source) for ordinal, source in enumerate(item))
            else:
                yield from _citations(item, path)
    elif isinstance(value, list):
        for ordinal, item in enumerate(value):
            yield from _citations(item, pointer + "/" + str(ordinal))


def _local_media(record_path, media):
    local = media.get("local_path")
    if not local:
        return None, None, None
    candidate = record_path.parent / local
    resolved = candidate.resolve()
    if (candidate.is_symlink() or not resolved.is_relative_to(record_path.parent.resolve())
            or not resolved.is_file()):
        raise ValueError(f"Missing or unsafe image: {record_path.relative_to(ROOT)}: {local}")
    if any(part.is_symlink() for part in [candidate, *candidate.parents]
           if part.is_relative_to(ROOT)):
        raise ValueError(f"Symlink image path: {candidate}")
    actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
    if actual != media.get("sha256"):
        raise ValueError(f"Image SHA256 mismatch: {record_path.relative_to(ROOT)}: {local}")
    return resolved.relative_to(ROOT).as_posix(), actual, resolved.stat().st_size


def populate(conn: sqlite3.Connection):
    """事务由共用维护引擎管理，全部关系来自现有显式资料。"""
    for directory in _maps():
        map_id = directory.name
        schema = _load(directory / "data/catalog-schema.json")
        conn.execute("INSERT INTO maps VALUES (?, ?, ?)",
                     (map_id, schema.get("updated"), _json(schema)))
        for n, row in enumerate(schema["regions"]):
            conn.execute("INSERT INTO regions VALUES (?, ?, ?, ?, ?)",
                         (map_id, row["id"], n, row.get("label_en", row.get("label", row["id"])), _json(row)))
        for row in schema["regions"]:
            for n, member in enumerate(row.get("members", [])):
                conn.execute("INSERT INTO region_members VALUES (?, ?, ?, ?)",
                             (map_id, row["id"], member, n))
        for key, table in [("categories", "categories"), ("technologies", "technologies")]:
            for n, row in enumerate(schema[key]):
                conn.execute(f"INSERT INTO {table} VALUES (?, ?, ?, ?)",
                             (map_id, row["id"], n, _json(row)))
        records = _records(directory)
        ids = {record["id"] for _, record in records}
        for n, (path, record) in enumerate(records):
            if record["id"] != path.parent.name:
                raise ValueError(f"Record ID differs from directory: {path.relative_to(ROOT)}")
            nav = record["map_navigation"]
            europe = int(nav["is_europe"]) if "is_europe" in nav else None
            status = record["status"]
            conn.execute("INSERT INTO experiments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                         (map_id, record["id"], path.relative_to(ROOT).as_posix(), n,
                          record["name"], record["category"], status["code"], status.get("as_of"),
                          europe, _json(record)))
            for values, table in [
                (nav["regions"], "experiment_regions"),
                (record.get("physics_categories", [record["category"]]), "experiment_categories"),
                (nav["technology_groups"], "experiment_technologies"),
            ]:
                if not values:
                    raise ValueError(f"Empty reviewed relation set: {map_id}/{record['id']}: {table}")
                for ordinal, value in enumerate(values):
                    conn.execute(f"INSERT INTO {table} VALUES (?, ?, ?, ?)",
                                 (map_id, record["id"], value, ordinal))
            for ordinal, source in enumerate(record.get("sources", [])):
                conn.execute("INSERT INTO experiment_sources VALUES (?, ?, ?, ?, ?, ?)",
                             (map_id, record["id"], source["id"], ordinal,
                              source.get("url", ""), _json(source)))
            for pointer, ordinal, source_id in _citations(record):
                conn.execute("INSERT INTO source_citations VALUES (?, ?, ?, ?, ?)",
                             (map_id, record["id"], pointer, ordinal, source_id))
            for ordinal, site in enumerate(record.get("sites", [])):
                conn.execute("INSERT INTO experiment_sites VALUES (?, ?, ?, ?, ?, ?, ?)",
                             (map_id, record["id"], ordinal, site.get("country_code"),
                              site.get("latitude"), site.get("longitude"), _json(site)))
            for ordinal, media in enumerate(record.get("media", [])):
                relative, sha256, size = _local_media(path, media)
                conn.execute("INSERT INTO media_assets VALUES (?, ?, ?, ?, ?, ?, ?)",
                             (map_id, record["id"], ordinal, relative, sha256, size, _json(media)))
        # 先插完同图所有记录，再建立真正的本地外键；未收录的关联只保留引用文字。
        for _, record in records:
            for ordinal, reference in enumerate(record.get("related_experiments", [])):
                local = reference if reference in ids else None
                conn.execute("INSERT INTO related_experiments VALUES (?, ?, ?, ?, ?, ?)",
                             (map_id, record["id"], ordinal, reference,
                              "local" if local else "external-reference", local))
    return summary(conn)


def _ordered(conn, query, args=()):
    return [tuple(row) for row in conn.execute(query, args)]


def validate(conn: sqlite3.Connection):
    """对照规范输入检查载荷、索引、顺序、已审地区和图片字节。"""
    errors = []
    expected_records = []
    expected_tables = {name: [] for name in ["maps", "regions", "region_members", "categories", "technologies",
                       "experiment_regions", "experiment_categories", "experiment_technologies",
                       "experiment_sources", "source_citations", "experiment_sites", "related_experiments", "media_assets"]}
    for directory in _maps():
        map_id = directory.name
        schema = _load(directory / "data/catalog-schema.json")
        expected_tables["maps"].append((map_id, schema.get("updated"), _json(schema)))
        for n, row in enumerate(schema["regions"]):
            expected_tables["regions"].append((map_id, row["id"], n, row.get("label_en", row.get("label", row["id"])), _json(row)))
            for ordinal, member in enumerate(row.get("members", [])):
                expected_tables["region_members"].append((map_id, row["id"], member, ordinal))
        for key in ["categories", "technologies"]:
            expected_tables[key].extend((map_id, row["id"], n, _json(row)) for n, row in enumerate(schema[key]))
        records = _records(directory)
        ids = {record["id"] for _, record in records}
        for n, (path, record) in enumerate(records):
            nav = record["map_navigation"]
            status = record["status"]
            expected_records.append((map_id, record["id"], path.relative_to(ROOT).as_posix(), n,
                                     record["name"], record["category"], status["code"], status.get("as_of"),
                                     int(nav["is_europe"]) if "is_europe" in nav else None, _json(record)))
            for values, table in [
                (nav["regions"], "experiment_regions"),
                (record.get("physics_categories", [record["category"]]), "experiment_categories"),
                (nav["technology_groups"], "experiment_technologies"),
            ]:
                expected_tables[table].extend((map_id, record["id"], value, ordinal)
                                               for ordinal, value in enumerate(values))
            expected_tables["experiment_sources"].extend(
                (map_id, record["id"], source["id"], ordinal, source.get("url", ""), _json(source))
                for ordinal, source in enumerate(record.get("sources", [])))
            expected_tables["source_citations"].extend(
                (map_id, record["id"], pointer, ordinal, source_id)
                for pointer, ordinal, source_id in _citations(record))
            expected_tables["experiment_sites"].extend(
                (map_id, record["id"], ordinal, site.get("country_code"), site.get("latitude"),
                 site.get("longitude"), _json(site))
                for ordinal, site in enumerate(record.get("sites", [])))
            for ordinal, media in enumerate(record.get("media", [])):
                try:
                    relative, sha256, size = _local_media(path, media)
                    expected_tables["media_assets"].append((map_id, record["id"], ordinal, relative, sha256, size, _json(media)))
                except ValueError as exc:
                    errors.append(str(exc))
            for ordinal, reference in enumerate(record.get("related_experiments", [])):
                local = reference if reference in ids else None
                expected_tables["related_experiments"].append((map_id, record["id"], ordinal, reference,
                                                             "local" if local else "external-reference", local))
    expected_tables["experiments"] = expected_records
    # repr 排序仅用于无序集合比较，不替代网页原排序；每个 ordinal 均纳入逐字段比较。
    for table, expected in expected_tables.items():
        actual = _ordered(conn, f"SELECT * FROM {table}")
        if sorted(actual, key=repr) != sorted(expected, key=repr):
            errors.append(f"Canonical data/index mismatch: {table} (database {len(actual)}, source {len(expected)})")
    return errors


def summary(conn: sqlite3.Connection):
    counts = {table: conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
              for table in ["maps", "experiments", "regions", "categories", "technologies",
                            "experiment_sources", "source_citations", "experiment_sites", "media_assets", "related_experiments"]}
    counts["records_by_map"] = dict(conn.execute("SELECT map_id, count(*) FROM experiments GROUP BY map_id ORDER BY map_id"))
    counts["shared_experiment_ids"] = conn.execute(
        "SELECT count(*) FROM (SELECT experiment_id FROM experiments GROUP BY experiment_id HAVING count(*) > 1)"
    ).fetchone()[0]
    counts["local_images"] = conn.execute("SELECT count(*) FROM media_assets WHERE path IS NOT NULL").fetchone()[0]
    counts["local_relations"] = conn.execute("SELECT count(*) FROM related_experiments WHERE relation_kind = 'local'").fetchone()[0]
    counts["external_relations"] = counts["related_experiments"] - counts["local_relations"]
    return counts
