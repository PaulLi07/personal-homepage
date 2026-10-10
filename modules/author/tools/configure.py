#!/usr/bin/env python3
"""隐藏输入作者口令，只生成公开的加盐校验配置；不读取或保存 GitHub 令牌。"""
import base64
import getpass
import hashlib
import json
from pathlib import Path
import secrets
import sys

CONFIG = Path(__file__).resolve().parents[1] / "config.js"


def main():
    if not sys.stdin.isatty():
        raise SystemExit("请在交互终端运行，口令不通过命令参数、管道或文件传入。")
    password = getpass.getpass("新的作者口令（隐藏输入，至少 8 字符）：")
    if len(password) < 8 or len(password) > 4096:
        raise SystemExit("口令须为 8 至 4096 字符。")
    confirmation = getpass.getpass("再次输入确认（隐藏输入）：")
    if password != confirmation:
        raise SystemExit("两次输入不同，配置未修改。")
    salt = secrets.token_bytes(16)
    verifier = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000, 32)
    config = {
        "version": 1, "iterations": 600000,
        "salt": base64.b64encode(salt).decode("ascii"),
        "verifier": base64.b64encode(verifier).decode("ascii"),
        "owner": "PaulLi07", "repo": "personal-homepage"
    }
    password = confirmation = ""
    CONFIG.write_text("/* 作者入口只存加盐派生校验值；实际发布仍由 GitHub 授权。 */\n"
        + "window.Homepage.authorConfig = " + json.dumps(config, indent=2) + ";\n", encoding="utf-8")
    print("已更新作者口令校验配置。重新装配、检查并上传完整更新后生效；旧浏览器连接需清除后重新连接。")


if __name__ == "__main__":
    try:
        main()
    except (EOFError, KeyboardInterrupt):
        raise SystemExit("已取消，配置未修改。")
