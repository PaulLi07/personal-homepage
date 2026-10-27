#!/usr/bin/env python3
"""保留原维护命令入口，实际实现归 scripts/tools。"""
from pathlib import Path
import runpy
if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).resolve().parent / "tools" / "assemble.py"), run_name="__main__")
