"""Package the static source without Git metadata or local artifacts."""

import argparse
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_DIRS = {".git", "node_modules", ".cache", ".private", "__pycache__", "artifacts", "dist", "build"}


def include(path):
    relative = path.relative_to(ROOT)
    return (
        path.is_file()
        and not path.is_symlink()
        and not any(part in EXCLUDED_DIRS for part in relative.parts[:-1])
        and path.name != ".DS_Store"
        and not path.name.startswith("._")
        and not (path.name.startswith(".env") and path.name != ".env.example")
        and path.suffix.lower() not in {".zip", ".log", ".pyc", ".pyo", ".swp", ".swo"}
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", type=Path,
        default=ROOT.parent / "outputs" / "personal-homepage-source.zip",
        help="Destination ZIP (default: ../outputs/personal-homepage-source.zip)",
    )
    destination = parser.parse_args().output.expanduser().resolve()
    if destination.suffix.lower() != ".zip":
        raise SystemExit("Destination must use a .zip extension.")
    files = [path for path in source_files() if path.resolve() != destination]
    if ROOT / "index.html" not in files:
        raise SystemExit("Missing index.html; package was not created.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, Path("personal-homepage") / path.relative_to(ROOT))
    with ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise SystemExit("ZIP integrity check failed.")
    print(f"Packaged {len(files)} files: {destination}")


if __name__ == "__main__":
    main()
