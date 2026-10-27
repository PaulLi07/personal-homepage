#!/usr/bin/env python3
"""检查 Physicists 的源码、图片、运行资源与独立重建，不读取原工程。"""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit

MODULE = Path(__file__).resolve().parents[1]
ARCHIVE = MODULE / 'archive'
SITE = ARCHIVE / 'website/site'


def require(value: bool, message: str) -> None:
    if not value:
        raise ValueError(message)


def sha256(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def snapshot(file: Path, name: str) -> dict:
    raw = file.read_text(encoding='utf-8')
    match = re.search(r'globalThis\.' + re.escape(name) + r'\s*=\s*', raw)
    require(bool(match), f'找不到数据快照：{file.name}')
    data, end = json.JSONDecoder().raw_decode(raw[match.end():])
    require(raw[match.end()+end:].strip() in ('', ';'), f'数据快照有额外执行内容：{file.name}')
    return data


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[str] = []
        self.links: list[str] = []
        self.language = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs = dict(attrs)
        if tag == 'html':
            self.language = attrs.get('lang')
        if tag in ('script', 'img', 'source', 'iframe') and attrs.get('src'):
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('href'):
            self.assets.append(attrs['href'])
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])


def local_file(ref: str, base: Path, *, allow_outside: bool = False) -> Path | None:
    parsed = urlsplit(ref)
    if parsed.scheme == 'data':
        return None
    require(not parsed.scheme and not parsed.netloc, f'运行资源必须本地提供：{ref}')
    require(not parsed.path.startswith('/'), f'运行资源不得依赖域名根目录：{ref}')
    if not parsed.path:
        return None
    target = (base / unquote(parsed.path)).resolve()
    if not allow_outside:
        require(target.is_relative_to(MODULE), f'运行资源越出 Physicists：{ref}')
    require(target.is_file(), f'运行资源不存在：{ref}')
    return target


def verify(import_snapshot: bool = False) -> dict:
    require(SITE.is_dir(), '缺少 website/site，请先运行本模块的 build_website.py')
    files = sorted(p for p in MODULE.rglob('*') if p.is_file())
    for file in MODULE.rglob('*'):
        require(not file.is_symlink(), f'模块不能包含符号链接：{file.relative_to(MODULE)}')
        require(file.name != '.git', f'不能嵌套 Git 工程：{file.relative_to(MODULE)}')
    source = json.loads((ARCHIVE / 'en/data/physicists.json').read_text())
    runtime = snapshot(SITE / 'data/archive.js', 'PHYSICS_ARCHIVE')
    ledger = snapshot(SITE / 'data/breakthrough-data.js', 'BREAKTHROUGH_ARCHIVE')
    require(runtime['count'] == source['count'] == len(runtime['people']) == len(source['people']), '人物统计不一致')
    require([p['id'] for p in runtime['people']] == [p['id'] for p in source['people']], '人物标识或顺序丢失')
    require(len({p['id'] for p in source['people']}) == source['count'], '人物标识重复')
    images, image_kinds, rights = set(), {}, {}
    references = set()
    for original, person in zip(source['people'], runtime['people']):
        portrait = original['portrait']
        file = local_file(person['portrait']['path'], SITE)
        require(file == (ARCHIVE / portrait['local_path']).resolve(), f"图片必须引用模块内唯一副本：{person['id']}")
        require(sha256(file) == portrait['sha256'], f"图片字节与资料校验值不同：{person['id']}")
        require(bool(person['biography']['en']) and bool(person['contributions']['en']) and bool(person['sources']['en']), f"人物英文资料不完整：{person['id']}")
        require(person['portrait']['rightsStatus'] == (portrait.get('rights_status') or 'source_license_recorded'), f"图片许可提示丢失：{person['id']}")
        images.add(file)
        references.add(file)
        image_kinds[portrait['kind']] = image_kinds.get(portrait['kind'], 0) + 1
        rights[person['portrait']['rightsStatus']] = rights.get(person['portrait']['rightsStatus'], 0) + 1
    event_ids = {event['id'] for event in ledger['events']}
    require(len(event_ids) == len(ledger['events']) == ledger['counts']['events'], '成果标识重复或统计不一致')
    source_events = []
    for file in sorted((ARCHIVE / 'data/breakthrough').glob('events-*.json')):
        source_events.extend(json.loads(file.read_text()))
    require(event_ids == {e['id'] for e in source_events}, '成果源记录未完整保留')
    require(ledger['counts']['totalPeople'] == ledger['counts']['navigablePeople'] == len(runtime['people']), '人物导航覆盖不完整')
    for person in runtime['people']:
        require(person['id'] in ledger['anchors'], f"人物缺少时间轴锚点：{person['id']}")
    for event in ledger['events']:
        require(bool(event['title']['en']) and bool(event.get('sources')), f"成果缺少英文标题或来源：{event['id']}")
    html_text = (SITE / 'index.html').read_text()
    html = References()
    html.feed(html_text)
    require(html.language == 'en', '独立页面初始语言必须英文')
    require(not re.search(r'[\u3400-\u9fff]', re.sub(r'<!--[\s\S]*?-->', '', html_text)), '独立页面仍有中文静态界面')
    require('data-language=' not in html_text and 'id="sheet-language"' not in html_text, '英文站不保留切换中文控件')
    app = (SITE / 'app.js').read_text()
    require(bool(re.search(r'\blang\s*:\s*[\'"]en[\'"]', app)), '应用初始语言未固定为英文')
    require('function setLanguage' not in app, '英文站不能切换到中文界面')
    return_links = [link for link in html.links if link.endswith('#academic/projects')]
    require(len(return_links) == 1, '缺少唯一的 Projects 返回入口')
    homepage = (MODULE.parents[3] / 'index.html').resolve()
    require((SITE / urlsplit(return_links[0]).path).resolve() == homepage, 'Projects 返回链接的层级错误')
    require(homepage.is_file(), '缺少主页返回目标')
    for ref in html.assets:
        file = local_file(ref, SITE)
        if file:
            references.add(file)
    for file in SITE.rglob('*'):
        if not file.is_file() or file.suffix not in ('.html', '.css', '.js', '.svg'):
            continue
        raw = file.read_text()
        # 科学引用与合法外链可以保留；禁止本机地址、路径及运行时网络装载。
        require(not re.search(r'(?:/Users/|file:///|https?://(?:localhost|127\.0\.0\.1)|HEP/Web/)', raw), f'运行文件引用原工作目录：{file.relative_to(SITE)}')
        if file.suffix == '.css':
            for match in re.finditer(r'url\(\s*[\'\"]?([^\)\'\"\s]+)', raw):
                asset = local_file(match[1], file.parent)
                if asset:
                    references.add(asset)
        if file.suffix == '.js' and '/data/' not in file.as_posix():
            require(not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(', raw), f'运行源码包含网络装载：{file.name}')
    for name in ['events.json','yearly-index.json','navigation-estimates.json','coverage.json','sensitivity.json','method.en.md']:
        require((SITE / 'data' / name).is_file(), f'生成资料缺失：{name}')
    unchanged = 0
    transformed = 0
    retired = 0
    require(not (ARCHIVE / 'zh').exists(), 'Physicists 不再维护中文数据副本')
    if import_snapshot:
        manifest = json.loads((ARCHIVE / 'import-manifest.json').read_text())
        transition = json.loads((ARCHIVE / 'data/english-transition.json').read_text())
        changed = {row['path']: row for row in transition['changedSources']}
        removed = {row['path']: row for row in transition['removedFiles']}
        for record in manifest['files']:
            rel = record['path']
            if rel.startswith(('portraits/', 'en/data/', 'zh/data/')) or (rel.startswith('data/breakthrough/') and rel.endswith('.json')):
                file = ARCHIVE / rel
                if rel in removed:
                    require(removed[rel]['sha256'] == record['sha256'] and not file.exists(), f'退役中文副本与原导入追溯不符：{rel}')
                    retired += 1
                elif rel in changed:
                    require(changed[rel]['beforeSha256'] == record['sha256'], f'英文迁移前哈希与原导入不符：{rel}')
                    require(file.is_file() and sha256(file) == changed[rel]['afterSha256'], f'英文迁移后的源资料变化：{rel}')
                    transformed += 1
                else:
                    require(file.is_file() and sha256(file) == record['sha256'], f'导入源资料有变化：{rel}')
                    unchanged += 1
    return {'people': runtime['count'], 'milestones': len(event_ids), 'portraits': len(images), 'imageKinds': image_kinds, 'permissionUnverified': rights.get('permission_required', 0), 'localResourceReferences': len(references), 'moduleFiles': len(files), 'importSnapshotFiles': unchanged, 'englishTransitionFiles': transformed, 'retiredEditionFiles': retired}


def rebuild_in_copy() -> dict:
    with tempfile.TemporaryDirectory(prefix='physicists-portable-') as directory:
        independent_root = Path(directory) / 'homepage'
        independent_module = independent_root / 'modules/academic/projects/physicists'
        shutil.copytree(MODULE, independent_module, ignore=shutil.ignore_patterns('__pycache__', '.DS_Store', 'artifacts'))
        independent_root.mkdir(parents=True, exist_ok=True)
        (independent_root / 'index.html').write_text('<!doctype html><html lang="en"><title>Independent homepage target</title></html>\n')
        env = {k: v for k, v in os.environ.items() if k not in ('PYTHONPATH', 'NODE_PATH')}
        commands = [
            [sys.executable, str(independent_module / 'archive/scripts/build_website.py')],
            ['node', '--test', *[str(file) for file in sorted((independent_module / 'archive/website/tests').glob('*.test.cjs'))]],
            [sys.executable, str(independent_module / 'tools/verify_portable.py'), '--import-snapshot'],
        ]
        results = []
        for command in commands:
            result = subprocess.run(command, cwd=independent_root, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
            require(result.returncode == 0, '隔离副本执行失败：' + command[0] + '\n' + result.stdout[-12000:])
            results.append(result.stdout)
        test_summary = '\n'.join(line for line in results[1].splitlines() if re.match(r'[#ℹ] (tests|pass|fail|suites)\b', line))
        return {'rebuild': 'passed', 'tests': test_summary, 'verification': json.loads(results[2])}


def main() -> None:
    parser = argparse.ArgumentParser(description='离线核对 Physicists 资源闭合与可迁移性')
    parser.add_argument('--import-snapshot', action='store_true', help='额外核对首次导入的未改动资料与图片')
    parser.add_argument('--rebuild-in-copy', action='store_true', help='复制模块到临时目录，运行独立构建、测试及资源检查')
    args = parser.parse_args()
    result = verify(args.import_snapshot)
    if args.rebuild_in_copy:
        result['independentCopy'] = rebuild_in_copy()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print('检查失败：' + str(error), file=sys.stderr)
        sys.exit(1)
