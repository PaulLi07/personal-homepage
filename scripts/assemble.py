#!/usr/bin/env python3
"""装配功能模块，生成可直接上传的静态页面；--check 只读检查同步状态。"""

import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent


def local_file(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"装配文件不存在或超出项目目录：{relative}")
    return path


def read(relative):
    return local_file(relative).read_text(encoding="utf-8")


def tags(paths, kind):
    for path in paths:
        local_file(path)
    if kind == "styles":
        return "\n".join(f'  <link rel="stylesheet" href="{path}">' for path in paths)
    if kind == "images":
        return "\n".join(f'  <link rel="preload" href="{path}" as="image">' for path in paths)
    return "\n".join(f'  <script defer src="{path}"></script>' for path in paths)


def render(template, replacements):
    def replace(match):
        key = match.group(1)
        if key not in replacements:
            raise ValueError(f"模板存在未声明的装配入口：{key}")
        return replacements[key]
    return re.sub(r"\{\{([a-z]+)\}\}", replace, read(template))


def pages():
    config = json.loads(read("app/site.json"))
    sections = config["sections"]
    styles = config["sharedStyles"] + [path for module in sections for path in module["styles"]] + config.get("afterStyles", [])
    scripts = config["sharedScripts"] + [path for module in sections for path in module["scripts"]] + ["app/main.js"]
    assembled = []
    container = None
    for module in sections:
        next_container = module.get("container")
        if next_container != container:
            if container:
                assembled.append("    </div>")
            if next_container:
                assembled.append(f'    <div class="{next_container}">')
            container = next_container
        assembled.append(read(module["view"]).rstrip())
    if container:
        assembled.append("    </div>")
    fragments = {"sections": "\n".join(assembled)}
    fragments.update({
        "preloads": tags([path for module in sections for path in module.get("preloadImages", [])], "images"),
        "styles": tags(styles, "styles"),
        "scripts": tags(scripts, "scripts"),
        "navigation": read("shared/navigation/view.html").rstrip(),
        "details": read("shared/details/view.html").rstrip(),
    })
    credits = config["credits"]
    return {
        "index.html": render("app/index.template.html", fragments),
        "credits.html": render("app/credits.template.html", {
            "styles": tags(["shared/base.css"] + credits["styles"], "styles"),
            "scripts": tags(credits.get("scripts", []), "scripts"),
            "credits": read(credits["view"]).rstrip(),
        }),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="只读检查生成页面是否与模块源码同步")
    args = parser.parse_args()
    try:
        generated = pages()
    except (ValueError, KeyError, TypeError) as error:
        raise SystemExit(f"装配失败：{error}") from error
    stale = []
    for name, source in generated.items():
        path = ROOT / name
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != source:
                stale.append(name)
        else:
            path.write_text(source, encoding="utf-8")
    if stale:
        raise SystemExit(f"生成页面未同步：{', '.join(stale)}。请运行 npm run assemble。")
    print("装配检查通过。" if args.check else "已装配 index.html 与 credits.html。")


if __name__ == "__main__":
    main()
