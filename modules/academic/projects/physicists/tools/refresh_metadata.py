"""从本模块的本地构建产物生成人物项目摘要，不读取外部项目。"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'archive'


def metadata():
    records = json.loads((ARCHIVE / 'en/data/physicists.json').read_text())
    report = json.loads((ARCHIVE / 'website/site/build-report.json').read_text())
    summary = json.loads((ARCHIVE / 'website/site/data/build-summary.json').read_text())
    people = {p['id']: p for p in records['people']}
    assert report['people'] == records['count'] == summary['counts']['totalPeople']
    preview = []
    for identity in ['isaac-newton', 'marie-curie', 'albert-einstein']:
        person = people[identity]
        preview.append({'id': identity, 'name': person['name'], 'src': 'modules/academic/projects/physicists/archive/' + person['portrait']['local_path'], 'alt': person['portrait']['alt']})
    return {'title': 'Physics Pioneers', 'peopleCount': report['people'], 'milestoneCount': summary['counts']['events'], 'reviewed': summary['asOf'], 'biographiesReviewed': records['as_of'], 'href': 'modules/academic/projects/physicists/archive/website/site/index.html', 'portraits': preview}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = '/* 从本地人物档案和成果构建摘要生成，运行 tools/refresh_metadata.py 更新。 */\nwindow.Homepage.registerData("physicists:archive", ' + json.dumps(metadata(), ensure_ascii=False, indent=2) + ');\n'
    target = ROOT / 'metadata.js'
    if args.check:
        if not target.is_file() or target.read_text() != content:
            raise SystemExit('Physicists metadata is stale; run tools/refresh_metadata.py.')
        print('Physicists metadata is current.')
    else:
        target.write_text(content)
        print('Updated Physicists metadata.')


if __name__ == '__main__':
    main()
