#!/usr/bin/env python3
"""两个科研项目的本地数据库维护入口。"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from maintenance.cli import main

if __name__ == '__main__':
    raise SystemExit(main())
