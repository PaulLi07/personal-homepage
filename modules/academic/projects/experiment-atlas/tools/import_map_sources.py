#!/usr/bin/env python3
"""一次性导入两张英文地图；日常维护直接编辑本模块独立档案，无需原目录。"""
from __future__ import annotations
import argparse
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image, ImageOps

ATLAS = Path(__file__).resolve().parents[1]
MAPS = {'neutrino': 'Neutrino', 'dark-matter': 'Dark_Matter'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def safe_file(base, relative):
    path = (base / relative).resolve()
    if not path.is_relative_to(base.resolve()) or not path.is_file():
        raise ValueError(f'Missing or unsafe source file: {relative}')
    return path


def import_map(source_root, slug, family):
    original = source_root / f'{family}_World_Map'
    dest = ATLAS / slug
    if (dest / 'archive').exists():
        raise ValueError(f'Archive already exists; refusing to overwrite maintained data: {slug}')
    dest.mkdir(parents=True, exist_ok=True)
    for name in ['index.html', 'reference.css', 'styles.css', 'viewer.css', 'map.css']:
        if (original / name).is_file():
            shutil.copyfile(original / name, dest / name)
    for name in ['js', 'assets', 'tests']:
        shutil.copytree(original / name, dest / name, dirs_exist_ok=True)
    (dest / 'data').mkdir(exist_ok=True)
    for name in ['map-labels.json', 'geography-notes.json']:
        shutil.copyfile(original / 'data' / name, dest / 'data' / name)
    catalog = json.loads((original / 'data/catalog.json').read_text())
    schema = {k: deepcopy(v) for k, v in catalog.items() if k not in {'records', 'record_count', 'english_record_count'}}
    schema['methodology']['details'] = 'Navigation summaries are built from independent English dossiers and images stored inside this map. Each dossier is loaded only when opened; no external archive directory is required.'
    write_json(dest / 'data/catalog-schema.json', schema)
    import re
    aliases = {row['id']: row['search_text'] for row in catalog['records'] if re.search(r'[\u3400-\u9fff]', row.get('search_text', ''))}
    if aliases:
        write_json(dest / 'data/search-aliases.json', aliases)
    manifest = {'imported': '2026-10-25', 'catalog_updated': catalog['updated'], 'source_map': original.name, 'record_count': len(catalog['records']), 'records': []}
    for row in catalog['records']:
        source_record = safe_file(source_root, str((original / row.get('english_record_path', row['record_path'])).relative_to(source_root)))
        image_record_base = (original / row['record_path']).resolve().parent
        record = json.loads(source_record.read_text())
        ident = record['id']
        if ident != row['id'] or '/' in ident or '..' in ident:
            raise ValueError(f'Invalid record ID: {ident}')
        folder = dest / 'archive' / ident
        folder.mkdir(parents=True)
        entry = {'id': ident, 'source_record': str(source_record.relative_to(source_root)), 'source_record_sha256': digest(source_record), 'images': []}
        for media in record.get('media', []):
            if not media.get('local_path'):
                continue
            source_image = safe_file(image_record_base, media['local_path'])
            source_hash = digest(source_image)
            if source_hash != media.get('sha256'):
                raise ValueError(f'Source image hash differs from reviewed record: {slug}/{ident}')
            relative = Path(media['local_path'])
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(source_image) as image:
                image.load()
                width, height = image.size
                image = ImageOps.exif_transpose(image)
                resized = max(image.size) > 1920
                large = source_image.stat().st_size > 400_000
                if resized or large:
                    image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
                    relative = relative.with_suffix('.webp')
                    target = folder / relative
                    image.save(target, format='WEBP', quality=90, method=6)
                    media['local_path'] = relative.as_posix()
                    media['source_sha256'] = source_hash
                    media['source_dimensions'] = {'width': width, 'height': height}
                    media['derivation'] = 'Web copy resized to a maximum edge of 1920 pixels and encoded as WebP (quality 90). Scientific captions, credits and source links are retained.'
                    media['width'], media['height'] = image.size
                    media['mime_type'] = 'image/webp'
                else:
                    shutil.copyfile(source_image, target)
                media['sha256'] = digest(target)
            entry['images'].append({'source_path': str(source_image.relative_to(source_root)), 'source_sha256': source_hash, 'local_path': media['local_path'], 'sha256': media['sha256'], 'bytes': target.stat().st_size, 'derived': source_hash != media['sha256']})
        record['map_navigation'] = {'regions': row['regions'], 'technology_groups': row['tech_groups']}
        if 'technology_tags' in row:
            record['map_navigation']['technology_tags'] = row['technology_tags']
        if 'is_europe' in row:
            record['map_navigation']['is_europe'] = row['is_europe']
        write_json(folder / 'record.json', record)
        entry['record_path'] = f'archive/{ident}/record.json'
        manifest['records'].append(entry)
    write_json(dest / 'data/import-manifest.json', manifest)
    html = (dest / 'index.html').read_text()
    import re
    html = re.sub(r'<div class="dm-notice" id="file-notice" hidden>.*?</div>', '<div class="dm-notice" id="file-notice" hidden><p>This interactive map loads local data files. Open it through the homepage website or its local web preview, then reload the page.</p></div>', html)
    (dest / 'index.html').write_text(html)
    app = (dest / 'js/app.js').read_text().replace('The catalog could not be loaded. Please start the local web service and keep the archive beside this project.', 'The map could not be loaded. Check your connection and select Retry.')
    (dest / 'js/app.js').write_text(app)
    viewer = (dest / 'js/viewer.js').read_text().replace('Check that the local web service is running, then try again.', 'Check your connection and try again.').replace('The local image could not be loaded.', 'The image could not be loaded.')
    (dest / 'js/viewer.js').write_text(viewer)
    print(json.dumps({'map': slug, 'records': len(manifest['records']), 'images': sum(len(r['images']) for r in manifest['records']), 'image_bytes': sum(i['bytes'] for r in manifest['records'] for i in r['images']), 'derived_images': sum(i['derived'] for r in manifest['records'] for i in r['images'])}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='包含原两张地图及Archive的Web目录，仅初次迁入时使用')
    args = parser.parse_args()
    source = args.source.resolve()
    for slug, family in MAPS.items():
        import_map(source, slug, family)
