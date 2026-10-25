#!/usr/bin/env python3
"""只读检查地图发布副本的本地依赖；不访问原资料目录或网络。"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


RUNTIME_SUFFIXES = {".html", ".css", ".js", ".mjs", ".json", ".svg"}
RESOURCE_SUFFIXES = {
    ".html", ".css", ".js", ".mjs", ".json", ".svg", ".png", ".jpg",
    ".jpeg", ".webp", ".gif", ".avif", ".ico", ".woff", ".woff2", ".pdf",
}
FORBIDDEN = re.compile(
    r"file:/+|/Users/|(?:127\.0\.0\.1|localhost):8796|HEP[/\\]Web",
    re.IGNORECASE,
)
JS_STRING = re.compile(r"(?P<quote>['\"])(?P<value>(?:\\.|(?!\1)[^\\\r\n])*)\1")
JS_MODULE = re.compile(
    r"\b(?:import\s*(?:[^;\n]*?\sfrom\s*)?|export\s+[^;\n]*?\sfrom\s*)"
    r"(['\"])([^'\"\n]+)\1|\bimport\s*\(\s*(['\"])([^'\"\n]+)\3"
)
JS_URL = re.compile(r"new\s+URL\s*\(\s*(['\"])([^'\"\n]+)\1\s*,\s*import\.meta\.url")
JS_FETCH = re.compile(r"\bfetch\s*\(\s*(['\"])([^'\"\n]+)\1")
CSS_URL = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE)
CSS_IMPORT = re.compile(r"@import\s+(['\"])([^'\"]+)\1", re.IGNORECASE)
JS_CALL = re.compile(r"\bfetch\s*\(")


def inside(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


class HTMLReferences(HTMLParser):
    """仅收集实际资源/链接属性，忽略 SVG 命名空间。"""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, bool]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        for key, value in attrs:
            if not value:
                continue
            if key == "src" or (tag == "object" and key == "data") or key in {"poster", "xlink:href"}:
                self.references.append((value, True))
            elif key == "href":
                resource = tag != "a" and not (tag == "use" and value.startswith("#"))
                self.references.append((value, resource))
            elif key == "srcset":
                for entry in value.split(","):
                    candidate = entry.strip().split()
                    if candidate:
                        self.references.append((candidate[0], True))
        if tag == "base" and attributes.get("href"):
            self.references.append((attributes["href"], True))


class Verification:
    def __init__(self, root: Path, site_root: Path) -> None:
        self.root = root
        self.site_root = site_root
        self.errors: list[str] = []
        self.counts: Counter[str] = Counter()
        self.maps: dict[str, dict[str, int]] = {}
        self.json_cache: dict[Path, object] = {}
        self.checked_refs: dict[tuple[Path, str, bool], Path | None] = {}
        self.directory_names: dict[Path, set[str]] = {}
        self.images: set[Path] = set()

    def label(self, path: Path) -> str:
        try:
            return str(path.relative_to(self.site_root))
        except ValueError:
            return str(path)

    def error(self, origin: Path, message: str) -> None:
        self.errors.append(f"{self.label(origin)}：{message}")

    def local(self, value: object, base: Path, origin: Path, *, required: bool = True,
              runtime_resource: bool = True) -> Path | None:
        if not isinstance(value, str) or not value.strip():
            if required:
                self.error(origin, "本地路径为空或不是字符串")
            return None
        value = value.strip()
        reference = (base, value, runtime_resource)
        if reference in self.checked_refs:
            return self.checked_refs[reference]
        self.checked_refs[reference] = None
        decoded = unquote(value)
        if FORBIDDEN.search(decoded):
            self.error(origin, f"发现本机依赖：{value}")
            return None
        try:
            parsed = urlsplit(value)
        except ValueError as exc:
            self.error(origin, f"路径无法解析：{value} ({exc})")
            return None
        if parsed.scheme or parsed.netloc:
            if parsed.scheme in {"data", "mailto", "tel"}:
                return None
            if parsed.scheme in {"http", "https"} or parsed.netloc:
                self.counts["external_references"] += 1
                if runtime_resource:
                    self.error(origin, f"运行资源依赖外部地址：{value}")
                return None
            self.error(origin, f"不支持的资源协议：{value}")
            return None
        if not parsed.path:
            return None  # 页面内锚点。
        if parsed.path.startswith("/") or "\\" in parsed.path:
            self.error(origin, f"必须使用适配 GitHub Pages 子路径的相对路径：{value}")
            return None
        candidate = base / unquote(parsed.path)
        resolved = candidate.resolve()
        if not inside(resolved, self.site_root):
            self.error(origin, f"路径越出本站源码目录：{value}")
            return None
        self.counts["local_references"] += 1
        if not resolved.exists():
            self.error(origin, f"本地依赖不存在：{value}")
            return None
        if resolved.is_dir():
            resolved /= "index.html"
            candidate /= "index.html"
            if not resolved.is_file():
                self.error(origin, f"目录入口没有 index.html：{value}")
                return None
        if not resolved.is_file():
            self.error(origin, f"资源不是普通文件：{value}")
            return None
        # macOS 默认文件系统大小写不敏感；Pages 的路径却必须大小写一致。
        current = self.site_root
        try:
            lexical = Path(os.path.normpath(candidate))
            for segment in lexical.relative_to(self.site_root).parts:
                if current not in self.directory_names:
                    self.directory_names[current] = {child.name for child in current.iterdir()}
                if segment not in self.directory_names[current]:
                    self.error(origin, f"资源路径大小写与实际文件不一致：{value}")
                    return None
                current /= segment
        except (OSError, ValueError) as exc:
            self.error(origin, f"无法核对资源路径大小写：{value} ({exc})")
            return None
        try:
            if resolved.stat().st_size == 0:
                self.error(origin, f"本地资源为空：{value}")
        except OSError as exc:
            self.error(origin, f"本地资源无法读取：{value} ({exc})")
            return None
        self.checked_refs[reference] = resolved
        return resolved

    def read_json(self, path: Path) -> object | None:
        if path in self.json_cache:
            return self.json_cache[path]
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            self.error(path, f"JSON 无法读取：{exc}")
            return None
        self.json_cache[path] = value
        self.counts["json_files_read"] += 1
        return value

    def image(self, path: Path, origin: Path) -> None:
        if path in self.images:
            return
        try:
            with path.open("rb") as stream:
                head = stream.read(256)
        except OSError as exc:
            self.error(origin, f"图片无法读取：{self.label(path)} ({exc})")
            return
        known = (head.startswith(b"\x89PNG\r\n\x1a\n") or head.startswith(b"\xff\xd8\xff")
                 or head.startswith((b"GIF87a", b"GIF89a"))
                 or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")
                 or b"<svg" in head or (len(head) >= 12 and head[4:8] == b"ftyp"))
        if not known:
            self.error(origin, f"图片文件头无法识别：{self.label(path)}")
        self.images.add(path)

    def catalog(self, map_root: Path) -> None:
        catalog_path = map_root / "data/catalog.json"
        self.counts["maps"] += 1
        if not (map_root / "index.html").is_file():
            self.error(map_root, "缺少地图 index.html")
        catalog = self.read_json(catalog_path)
        if not isinstance(catalog, dict) or not isinstance(catalog.get("records"), list):
            self.error(catalog_path, "目录必须为包含 records 数组的 JSON 对象")
            return
        rows = catalog["records"]
        if catalog.get("record_count") != len(rows):
            self.error(catalog_path, "record_count 与 records 条目数量不一致")
        ids: set[str] = set()
        media_count = 0
        record_paths: set[Path] = set()
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
                self.error(catalog_path, "目录条目缺少非空 id")
                continue
            identifier = row["id"]
            if identifier in ids:
                self.error(catalog_path, f"重复目录 id：{identifier}")
            ids.add(identifier)
            paths: dict[str, Path | None] = {}
            for key in ("record_path", "english_record_path"):
                paths[key] = self.local(row.get(key), map_root, catalog_path)
            for key, value in row.items():
                if key.endswith("_path") and key not in paths and value:
                    paths[key] = self.local(value, map_root, catalog_path)
            original = paths.get("record_path")
            for key in ("record_path", "english_record_path"):
                record_path = paths.get(key)
                if record_path is None:
                    continue
                record = self.read_json(record_path)
                if not isinstance(record, dict):
                    self.error(record_path, f"{identifier} 的档案必须为 JSON 对象")
                    continue
                if record.get("id") != identifier:
                    self.error(record_path, f"档案 id 与目录 {identifier} 不一致")
                if record_path in record_paths:
                    continue
                record_paths.add(record_path)
                media = record.get("media", [])
                if not isinstance(media, list):
                    self.error(record_path, "media 必须为数组")
                    continue
                for item in media:
                    if not isinstance(item, dict):
                        self.error(record_path, "media 条目必须为对象")
                        continue
                    if item.get("local_path"):
                        # 读者用原档案 URL 解析英文档案的图片，而非英文副本所在目录。
                        image = self.local(item["local_path"], (original or record_path).parent, record_path)
                        if image:
                            self.image(image, record_path)
                            media_count += 1
            row_image = paths.get("image_path")
            if row_image:
                self.image(row_image, catalog_path)
        self.counts["catalog_records"] += len(rows)
        self.counts["record_json_files"] += len(record_paths)
        self.maps[map_root.name] = {"catalog_records": len(rows), "record_json_files": len(record_paths), "local_media": media_count}

    def references(self, path: Path, text: str) -> None:
        suffix = path.suffix.lower()
        if suffix in {".html", ".svg"}:
            parser = HTMLReferences()
            try:
                parser.feed(text)
                for value, resource in parser.references:
                    self.local(value, path.parent, path, required=False, runtime_resource=resource)
            except Exception as exc:
                self.error(path, f"HTML/SVG 引用无法解析：{exc}")
        if suffix == ".css":
            for match in CSS_URL.finditer(text):
                self.local(match[2].strip(), path.parent, path, required=False)
            for match in CSS_IMPORT.finditer(text):
                self.local(match[2], path.parent, path)
        if suffix in {".js", ".mjs"}:
            module_root = next((candidate for candidate in [path.parent, *path.parents]
                                if candidate.parent == self.root and (candidate / "index.html").is_file()), path.parent)
            for match in JS_MODULE.finditer(text):
                self.local(match[2] or match[4], path.parent, path)
            for match in JS_URL.finditer(text):
                self.local(match[2], path.parent, path)
            for match in JS_FETCH.finditer(text):
                self.local(match[2], module_root, path)
            self.counts["fetch_call_sites"] += len(JS_CALL.findall(text))
            # 还检查 new URL(p, import.meta.url) 所用的静态资源数组；不执行 JavaScript。
            for match in JS_STRING.finditer(text):
                value = match["value"]
                if "\\" in value or not value.startswith(("./", "../")):
                    continue
                if Path(urlsplit(value).path).suffix.lower() in RESOURCE_SUFFIXES:
                    self.local(value, path.parent, path)

    def scan(self) -> None:
        for directory, dirs, files in os.walk(self.root, followlinks=False):
            parent = Path(directory)
            for name in [*dirs, *files]:
                path = parent / name
                if path.is_symlink():
                    self.error(path, "发布目录禁止符号链接，必须复制所需文件")
            dirs[:] = [name for name in dirs if name not in {"__pycache__", ".git"} and not (parent / name).is_symlink()]
            # 工具/测试中的来源参数不是运行依赖，但其中的符号链接仍须发现。
            if {"tools", "tests"}.intersection(parent.relative_to(self.root).parts):
                continue
            for name in files:
                path = parent / name
                if path.is_symlink() or path.suffix.lower() not in RUNTIME_SUFFIXES:
                    continue
                self.counts["runtime_files_scanned"] += 1
                try:
                    text = path.read_text(encoding="utf-8")
                except (OSError, UnicodeError) as exc:
                    self.error(path, f"运行资源无法读取：{exc}")
                    continue
                for match in FORBIDDEN.finditer(text):
                    line = text.count("\n", 0, match.start()) + 1
                    self.error(path, f"第 {line} 行含本机地址或外部源目录依赖")
                self.references(path, text)

    def run(self) -> dict[str, object]:
        if not self.root.is_dir():
            self.error(self.root, "地图集目录不存在")
        names = {"neutrino", "dark-matter"}
        names.update(path.parent.parent.name for path in self.root.glob("*/data/catalog.json"))
        for name in sorted(names):
            self.catalog(self.root / name)
        self.scan()
        self.counts["unique_local_images"] = len(self.images)
        return {"ok": not self.errors, "maps": self.maps, "counts": dict(self.counts),
                "errors": self.errors,
                "limits": ["只做静态资源及 JSON 路径校验，不替代浏览器兼容性、图片内容和科学资料核实。",
                           "官方资料外链不访问网络；动态 fetch 的数据路径由目录和档案逐项校验。"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent,
                        help="地图集发布目录（默认本工具上级）")
    parser.add_argument("--json", action="store_true", help="以 JSON 输出结果，便于留存报告")
    args = parser.parse_args()
    root = args.root.absolute()
    site_root = next((path for path in [root, *root.parents] if (path / "app/site.json").is_file()), None)
    if site_root is None:
        print("无法定位包含 app/site.json 的主页源码根目录。", file=sys.stderr)
        return 2
    verifier = Verification(root, site_root.resolve())
    if root.is_symlink():
        verifier.error(root, "地图集根目录不能是符号链接")
    report = verifier.run()
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("地图集独立性检查：" + ("通过" if report["ok"] else "失败"))
        for name, stats in verifier.maps.items():
            print(f"- {name}：{stats['catalog_records']} 条目录，{stats['record_json_files']} 份档案，{stats['local_media']} 项本地图片")
        print(f"扫描 {verifier.counts['runtime_files_scanned']} 份运行文件；解析 {verifier.counts['local_references']} 项本地引用；图片 {len(verifier.images)} 份。")
        for error in verifier.errors:
            print("错误：" + error, file=sys.stderr)
        print("此结果不代表浏览器兼容性或资料内容已经验证。")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
