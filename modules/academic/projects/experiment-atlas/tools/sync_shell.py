#!/usr/bin/env python3
"""根据地图登记同步独立页面的公共顶栏；--check只读检查生成物。"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


NAV_START = "<!-- atlas-nav:start -->"
NAV_END = "<!-- atlas-nav:end -->"
CSS_START = "<!-- atlas-shell-css:start -->"
CSS_END = "<!-- atlas-shell-css:end -->"
NODE_REGISTRY = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window: {Homepage: {getData() { return undefined; }}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8'), context, {timeout: 1000});
const getter = context.window.Homepage.getExperimentMaps;
if (typeof getter !== 'function') throw new Error('Missing getExperimentMaps().');
process.stdout.write(JSON.stringify(getter()));
"""


def relative(target: Path, directory: Path) -> str:
    """普通相对路径适配仓库子路径，不能使用本机绝对路径。"""
    return Path(os.path.relpath(target, directory)).as_posix()


def load_maps(atlas: Path, site: Path) -> list[dict[str, object]]:
    result = subprocess.run(
        ["node", "-e", NODE_REGISTRY, str(atlas / "registry.js")],
        capture_output=True, text=True, check=True, timeout=10,
    )
    records = json.loads(result.stdout)
    if not isinstance(records, list) or not records:
        raise ValueError("registry.js 必须返回非空地图数组。")
    identifiers: set[str] = set()
    pages: set[Path] = set()
    maps: list[dict[str, object]] = []
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("地图登记条目必须为对象。")
        identifier, title, href = (record.get(key) for key in ("id", "title", "href"))
        if not all(isinstance(value, str) and value.strip() for value in (identifier, title, href)):
            raise ValueError("地图登记必须包含非空 id、title 与 href。")
        if identifier in identifiers:
            raise ValueError(f"地图 id 重复：{identifier}")
        parsed = urlsplit(href)
        if (parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or
                parsed.path.startswith("/") or "\\" in parsed.path):
            raise ValueError(f"地图 href 必须是站点根相对本地入口：{href}")
        target = (site / unquote(parsed.path)).resolve()
        page = target / "index.html" if target.is_dir() or href.endswith("/") else target
        try:
            page.relative_to(atlas)
        except ValueError as exc:
            raise ValueError(f"地图入口必须位于地图集内：{href}") from exc
        if page.suffix.lower() != ".html" or not page.is_file():
            raise ValueError(f"地图页面不存在或不是 HTML：{href}")
        if page in pages:
            raise ValueError(f"地图页面重复：{href}")
        label = re.sub(r"\s+experiments?$", "", title, flags=re.IGNORECASE).strip()
        maps.append({"id": identifier, "label": label or title, "title": title, "page": page})
        identifiers.add(identifier)
        pages.add(page)
    return maps


def replace_block(source: str, start: str, end: str, block: str, pattern: str, *, before: bool) -> str:
    """区块存在时只替换区块；首次分别插入head末尾和body开头。"""
    if source.count(start) != source.count(end) or source.count(start) > 1:
        raise ValueError(f"生成区块标记不匹配或重复：{start}")
    if start in source:
        expression = re.escape(start) + r"[\s\S]*?" + re.escape(end)
        return re.sub(expression, lambda _: block, source, count=1)
    match = re.search(pattern, source, re.IGNORECASE)
    if not match:
        raise ValueError(f"无法定位HTML插入位置：{pattern}")
    if before:
        return source[:match.start()] + block + "\n" + source[match.start():]
    return source[:match.end()] + "\n" + block + source[match.end():]


def shell_html(current: dict[str, object], maps: list[dict[str, object]], site: Path) -> str:
    page = current["page"]
    assert isinstance(page, Path)
    back = relative(site / "index.html", page.parent) + "#academic/projects/physics-maps"
    lines = [
        NAV_START,
        '<nav class="atlas-shell" aria-label="Physics Maps navigation">',
        '  <div class="atlas-shell__inner">',
        f'    <a class="atlas-shell__back" href="{html.escape(back, quote=True)}">← Physics Maps</a>',
        '    <p class="atlas-shell__brand">Physics Maps</p>',
        '    <ul class="atlas-shell__maps" aria-label="Experiment maps">',
    ]
    for item in maps:
        target = item["page"]
        assert isinstance(target, Path)
        href = html.escape(relative(target, page.parent), quote=True)
        title = html.escape(str(item["title"]), quote=True)
        label = html.escape(str(item["label"]))
        selected = ' aria-current="page"' if item["id"] == current["id"] else ""
        lines.append(f'      <li><a class="atlas-shell__map" href="{href}" aria-label="Open {title}"{selected}>{label}</a></li>')
    lines.extend(['    </ul>', '  </div>', '</nav>', NAV_END])
    return "\n".join(lines)


def expected_page(current: dict[str, object], maps: list[dict[str, object]], atlas: Path, site: Path) -> tuple[str, str]:
    page = current["page"]
    assert isinstance(page, Path)
    source = page.read_text(encoding="utf-8")
    stylesheet = html.escape(relative(atlas / "map-shell.css", page.parent), quote=True)
    css = f'{CSS_START}\n<link rel="stylesheet" href="{stylesheet}">\n{CSS_END}'
    updated = replace_block(source, CSS_START, CSS_END, css, r"</head\s*>", before=True)
    updated = replace_block(updated, NAV_START, NAV_END, shell_html(current, maps, site), r"<body(?:\s[^>]*)?>", before=False)
    return source, updated


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent,
                        help="地图集目录，默认工具上级目录")
    parser.add_argument("--check", action="store_true", help="只读检查顶栏和样式引用是否最新")
    args = parser.parse_args()
    atlas = args.root.resolve()
    site = next((parent for parent in [atlas, *atlas.parents] if (parent / "app/site.json").is_file()), None)
    if site is None:
        print("无法定位含 app/site.json 的个人主页根目录。", file=sys.stderr)
        return 2
    try:
        if not (atlas / "map-shell.css").is_file():
            raise ValueError("缺少地图集 map-shell.css。")
        maps = load_maps(atlas, site)
        # 先全部校验，再写入，避免中途遇到格式错误而只更新一半地图。
        pending = [(item, *expected_page(item, maps, atlas, site)) for item in maps]
        stale = [(item, updated) for item, source, updated in pending if source != updated]
        if args.check:
            if stale:
                for item, _ in stale:
                    print(f"待同步顶栏：{item['page'].relative_to(site)}", file=sys.stderr)
                return 1
            print(f"地图顶栏检查通过：{len(maps)} 张地图，无需更新。")
            return 0
        for item, updated in stale:
            item["page"].write_text(updated, encoding="utf-8")
            print(f"已同步顶栏：{item['page'].relative_to(site)}")
        print(f"地图顶栏同步完成：登记 {len(maps)} 张，更新 {len(stale)} 张。")
        return 0
    except (OSError, ValueError, json.JSONDecodeError, subprocess.SubprocessError) as exc:
        message = exc.stderr.strip() if isinstance(exc, subprocess.CalledProcessError) and exc.stderr else str(exc)
        print("地图顶栏同步失败：" + message, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
