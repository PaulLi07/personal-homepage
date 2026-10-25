#!/usr/bin/env python3
"""从本地图目录内的独立英文档案重建浏览索引，不读取项目外文件。"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CJK = re.compile(r'[\u3400-\u9fff]')


def normalized(value):
    value = unicodedata.normalize('NFKC', str(value)).casefold()
    return ' '.join(''.join(' ' if unicodedata.category(c)[0] in 'PS' else c for c in value).split())


def assert_english(value, context):
    if isinstance(value, str) and CJK.search(value):
        raise ValueError(f'Non-English CJK text: {context}')
    if isinstance(value, dict):
        for key, item in value.items():
            assert_english(item, f'{context}.{key}')
    elif isinstance(value, list):
        for i, item in enumerate(value):
            assert_english(item, f'{context}[{i}]')


def validate_image(path, media):
    resolved = (path.parent / media['local_path']).resolve()
    if not resolved.is_relative_to(path.parent.resolve()) or not resolved.is_file():
        raise ValueError(f'Missing or unsafe image: {path.parent.name}')
    actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
    if actual != media.get('sha256'):
        raise ValueError(f'Image SHA256 does not match current web bytes: {path.parent.name}')
    return resolved


def build():
    schema = json.loads((ROOT / 'data/catalog-schema.json').read_text(encoding='utf-8'))
    categories = {row['id']: row['label'] for row in schema['categories']}
    technologies = {row['id']: row['label'] for row in schema['technologies']}
    regions = {row['id']: row['label_en'] for row in schema['regions']}
    alias_path = ROOT / 'data/search-aliases.json'
    aliases = json.loads(alias_path.read_text(encoding='utf-8')) if alias_path.is_file() else {}
    rows = []
    for path in sorted((ROOT / 'archive').glob('*/record.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        ident = record['id']
        if ident != path.parent.name or not re.fullmatch(r'[a-z0-9][a-z0-9-]*', ident):
            raise ValueError(f'Invalid independent dossier ID: {path}')
        assert_english(record, ident)
        nav = record['map_navigation']
        codes = nav['regions']
        groups = nav['technology_groups']
        physics = record.get('physics_categories', [record['category']])
        if not codes or any(code not in regions for code in codes):
            raise ValueError(f'Unknown or empty reviewed region set: {ident}')
        if len(codes) != len(set(codes)):
            raise ValueError(f'Duplicate region assignment: {ident}')
        if not groups or any(group not in technologies for group in groups):
            raise ValueError(f'Unknown or empty technology family: {ident}')
        if any(category not in categories for category in physics):
            raise ValueError(f'Unknown physics category: {ident}')
        for media in record.get('media', []):
            if media.get('local_path'):
                validate_image(path, media)
        representative = next((m for m in record.get('media', []) if m.get('local_path')), None)
        if not representative:
            raise ValueError(f'Missing representative image: {ident}')
        status = record['status']
        as_of = status.get('as_of')
        years = re.findall(r'(?<!\d)(?:19|20)\d{2}(?!\d)', str(as_of or ''))
        terms = [aliases.get(ident, ''), ident, record['name'], record.get('full_name', ''), *record.get('aliases', []), record.get('summary', ''), *record.get('technologies', []), *record.get('physics_targets', []), *physics, *(categories[k] for k in physics), *groups, *(technologies[k] for k in groups), *codes, *(regions[k] for k in codes)]
        for site in record.get('sites', []):
            terms.extend(site.get(k, '') or '' for k in ['name', 'country', 'country_code', 'location'])
        relative = path.relative_to(ROOT).as_posix()
        row = {k: record.get(k, [] if k == 'aliases' else '') for k in ['id', 'name', 'full_name', 'aliases', 'category', 'role', 'summary', 'technologies', 'physics_targets']}
        if 'physics_categories' in record:
            row['physics_categories'] = record['physics_categories']
        if 'technology_tags' in record:
            row['technology_tags'] = record['technology_tags']
        if 'nobel_prize_years' in record:
            row['nobel_prize_years'] = record['nobel_prize_years']
        row.update({'status': status['code'], 'status_label': status.get('label', ''), 'status_as_of': as_of, 'tech_groups': groups, 'regions': codes, 'search_text': normalized(' '.join(terms)), 'record_path': relative, 'english_record_path': relative, 'image_path': (path.parent.relative_to(ROOT) / representative['local_path']).as_posix(), 'year': int(years[-1]) if years else None})
        if 'is_europe' in nav:
            row['is_europe'] = 'EUROPE' in codes
        rows.append(row)
    if not rows:
        raise ValueError('No local English dossiers found')
    rows.sort(key=lambda row: normalized(row['name']))
    catalog = {**schema, 'record_count': len(rows), 'records': rows}
    if ROOT.name == 'dark-matter':
        catalog['english_record_count'] = len(rows)
    assert_english({k: v for k, v in catalog.items() if k != 'records'}, 'catalog')
    for row in rows:
        assert_english({k: v for k, v in row.items() if k != 'search_text'}, row['id'])
    notes_path = ROOT / 'data/geography-notes.json'
    notes = json.loads(notes_path.read_text(encoding='utf-8'))
    notes['updated'] = schema['updated']
    notes['methodology'] = schema['methodology']
    counts = collections.Counter({code: 0 for code in regions})
    counts.update(code for row in rows for code in row['regions'])
    notes['counts']['records'] = len(rows)
    notes['counts']['regions'] = dict(counts)
    return catalog, notes



def preview_svg(catalog):
    # 复用原地图几何，仅为入口缩略图着色；不影响可交互地图。
    namespace = 'http://www.w3.org/2000/svg'
    ET.register_namespace('', namespace)
    root = ET.fromstring((ROOT / 'assets/world-map.svg').read_text(encoding='utf-8'))
    root.set('role', 'img')
    name = 'Neutrino' if ROOT.name == 'neutrino' else 'Dark Matter'
    root.set('aria-label', f'{name} experiments world map preview')
    title = root.find(f'{{{namespace}}}title')
    if title is not None:
        title.text = f'{name} experiments world map preview'
    counts = collections.Counter(code for row in catalog['records'] for code in set(row['regions']))
    palette = ['#587fa9', '#7599c3', '#9ab7dc'] if ROOT.name == 'neutrino' else ['#786a99', '#9a88ba', '#bba9d6']
    for path in root.iter(f'{{{namespace}}}path'):
        count = counts[path.get('data-iso')]
        color = '#454c57' if not count else palette[2 if count >= 20 else 1 if count >= 10 else 0]
        path.set('fill', color)
        path.set('stroke', '#22262e')
        path.set('stroke-width', '0.6')
        path.set('stroke-linejoin', 'round')
    return ET.tostring(root, encoding='unicode') + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='只读比较已保存索引与本地档案')
    args = parser.parse_args()
    catalog, notes = build()
    for name, value in [('catalog.json', catalog), ('geography-notes.json', notes)]:
        path = ROOT / 'data' / name
        text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if not path.is_file() or path.read_text(encoding='utf-8') != text:
                raise SystemExit(f'Data needs rebuilding: {path.name}')
        else:
            path.write_text(text, encoding='utf-8')
    path = ROOT / 'assets/preview.svg'
    text = preview_svg(catalog)
    if args.check:
        if not path.is_file() or path.read_text(encoding='utf-8') != text:
            raise SystemExit('Preview needs rebuilding: assets/preview.svg')
    else:
        path.write_text(text, encoding='utf-8')
    print(json.dumps({'map': ROOT.name, 'records': catalog['record_count'], 'images': catalog['record_count'], 'check': args.check}))


if __name__ == '__main__':
    main()
