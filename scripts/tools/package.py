"""生成可维护源码包或静态发布包，保持公开资源相对路径。"""

import argparse
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED_DIRS = {".git", "node_modules", ".cache", ".private", ".maintenance", "__pycache__", "artifacts", "dist", "build"}
SITE = json.loads((ROOT / "app/site.json").read_text(encoding="utf-8"))
STANDALONE = {page for module in SITE.get("sections", []) + SITE.get("services", [])
              for page in module.get("standalonePages", [])}


def include(path):
    relative = path.relative_to(ROOT)
    return (
        path.is_file()
        and not path.is_symlink()
        and not any(part in EXCLUDED_DIRS for part in relative.parts[:-1])
        and path.name != ".DS_Store"
        and not path.name.startswith("._")
        and not (path.name.startswith(".env") and path.name != ".env.example")
        and path.suffix.lower() not in {".zip", ".log", ".pyc", ".pyo", ".swp", ".swo", ".sqlite", ".sqlite3", ".db"}
        and not path.name.endswith(("-wal", "-shm", "-journal"))
    )


def source_files():
    # Use Git's ignore rules in a checkout; an extracted source folder works too.
    if (ROOT / ".git").exists():
        result = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
            cwd=ROOT, check=True, capture_output=True,
        )
        candidates = {ROOT / name.decode("utf-8") for name in result.stdout.split(b"\0") if name}
    else:
        candidates = set(ROOT.rglob("*"))
    return sorted(path for path in candidates if include(path))


def publish_file(path):
    """按功能范围选择运行副本；地图档案JSON和页面内帮助也属于运行资源。"""
    relative = path.relative_to(ROOT)
    parts = relative.parts
    if len(parts) == 1:
        return path.name in {"index.html", "credits.html", ".nojekyll", "CNAME"}
    if parts[0] == "app":
        return relative.as_posix() == "app/main.js"
    if parts[0] not in {"modules", "shared"}:
        return False
    if path.suffix.lower() == ".html" and relative.as_posix() not in STANDALONE:
        return False
    if any(part in {"tools", "tests", "database", "migrations"} for part in parts):
        return False
    person = "modules/academic/projects/physicists/"
    name = relative.as_posix()
    if name.startswith(person + "archive/"):
        return (name == person + "archive/index.html"
                or name.startswith(person + "archive/website/site/")
                or name.startswith(person + "archive/portraits/"))
    if path.suffix.lower() in {".md", ".py", ".cjs", ".sql", ".toml"}:
        return False
    return path.name not in {"package.json", "package-lock.json", "import-manifest.json"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("source", "publish"), default="source",
                        help="source含维护源码；publish只含静态运行资源")
    parser.add_argument(
        "--output", type=Path,
        default=None,
        help="Destination ZIP (default: ../outputs/personal-homepage-source.zip)",
    )
    args = parser.parse_args()
    destination = (args.output or ROOT.parent / "outputs" / f"personal-homepage-{args.mode}.zip").expanduser().resolve()
    if destination.suffix.lower() != ".zip":
        raise SystemExit("Destination must use a .zip extension.")
    files = [path for path in source_files() if path.resolve() != destination
             and (args.mode == "source" or publish_file(path))]
    if ROOT / "index.html" not in files:
        raise SystemExit("Missing index.html; package was not created.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, Path("personal-homepage") / path.relative_to(ROOT))
    with ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise SystemExit("ZIP integrity check failed.")
    print(f"已生成{args.mode}包，{len(files)}份文件：{destination}")


if __name__ == "__main__":
    main()
