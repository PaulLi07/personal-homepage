#!/usr/bin/env python3
"""从本模块地图目录生成入口统计，不读取站点外的数据。"""
import argparse
import datetime
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def generated():
    metadata = {}
    for path in sorted(ROOT.glob("*/data/catalog.json")):
        catalog = json.loads(path.read_text(encoding="utf-8"))
        records = catalog.get("records")
        if not isinstance(records, list) or len(records) != catalog.get("record_count"):
            raise ValueError(f"索引条数不一致：{path.relative_to(ROOT)}")
        updated = catalog.get("updated", "")
        datetime.date.fromisoformat(updated)
        metadata[path.parent.parent.name] = {"recordCount": len(records), "updated": updated}
    if not metadata:
        raise ValueError("没有找到可用地图索引。")
    return ("/* 从各地图本地索引生成，维护时运行 tools/refresh_metadata.py。 */\n"
            "window.Homepage.registerData(\"experiment-atlas:catalogs\", "
            + json.dumps(metadata, ensure_ascii=False, indent=2) + ");\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="只读检查，不修改文件")
    args = parser.parse_args()
    result = generated()
    target = ROOT / "metadata.js"
    if args.check:
        if not target.is_file() or target.read_text(encoding="utf-8") != result:
            raise SystemExit("地图入口统计已过期，请运行 tools/refresh_metadata.py。")
        print("地图入口统计检查通过。")
    else:
        target.write_text(result, encoding="utf-8")
        print("已从本地地图索引更新入口统计。")


if __name__ == "__main__":
    main()
