"""Physicists 英文规范资料的只读导入适配器；不参与网页科学计算。"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sqlite3

PROJECT_ID = 'physicists'
ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = Path(__file__).resolve().parent / 'migrations'
PEOPLE_SOURCE = 'archive/en/data/physicists.json'
EVENT_ROOT = 'archive/data/breakthrough'
PATCH_STAGES = ('existing-source-patches.json', 'event-assessments.json', 'editorial-event-patches.json')
FIELD_IDS = ('history', 'mechanics', 'light', 'heat', 'quantum', 'matter', 'particle', 'cosmos', 'methods')


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True)


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def source_files():
    return [ROOT / PEOPLE_SOURCE, *sorted((ROOT / EVENT_ROOT).glob('*.json'))]


def _sources(connection, rows, table, owner_column, owner):
    for ordinal, source in enumerate(rows):
        payload = encoded(source)
        ident = hashlib.sha256(payload.encode()).hexdigest()
        if not source.get('title') or not source.get('url', '').startswith(('https://', 'http://')):
            raise ValueError(f'Invalid source: {owner}')
        connection.execute('INSERT OR IGNORE INTO sources VALUES (?, ?, ?, ?)', (ident, source['url'], source['title'], payload))
        connection.execute(f'INSERT INTO {table} ({owner_column}, source_id, ordinal) VALUES (?, ?, ?)', (owner, ident, ordinal))


def _asset(person):
    portrait = person['portrait']
    file = ROOT / 'archive' / portrait['local_path']
    canonical = ROOT / 'archive/portraits'
    if canonical.is_symlink() or file.is_symlink() or not file.resolve().is_relative_to(canonical.resolve()) or not file.is_file():
        raise ValueError(f'Unsafe or missing portrait: {person["id"]}')
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    if digest != portrait['sha256']:
        raise ValueError(f'Portrait SHA256 differs: {person["id"]}')
    return (person['id'], file.relative_to(ROOT).as_posix(), digest, file.stat().st_size,
            portrait['kind'], portrait.get('rights_status', 'source_license_recorded'), encoded(portrait))


def populate(connection):
    dataset = read(PEOPLE_SOURCE)
    if dataset['language'] != 'en' or dataset['count'] != len(dataset['people']):
        raise ValueError('Invalid English people dataset')
    connection.executemany('INSERT INTO fields VALUES (?)', [(key,) for key in FIELD_IDS])
    for person in dataset['people']:
        ident = person['id']
        connection.execute('INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', (
            ident, person['order'], person['name'], person['sort_year'], encoded(person['birth']),
            encoded(person['death']) if person.get('death') is not None else None,
            person['death_status'], PEOPLE_SOURCE, encoded(person)))
        for role, key in [('browse', 'browse_domains'), ('navigation', 'navigation_fields')]:
            connection.executemany('INSERT INTO person_fields VALUES (?, ?, ?, ?)',
                                   [(ident, field, role, ordinal) for ordinal, field in enumerate(person[key])])
        _sources(connection, person['sources'], 'person_sources', 'person_id', ident)
        connection.execute('INSERT INTO media_assets VALUES (?, ?, ?, ?, ?, ?, ?)', _asset(person))
    for file in sorted((ROOT / EVENT_ROOT).glob('events-*.json')):
        relative = file.relative_to(ROOT).as_posix()
        for ordinal, event in enumerate(read(relative)):
            ident = event['id']
            dates = {key: event[key] for key in ('year', 'precision', 'dateRange', 'dateModel', 'timelineDates') if key in event}
            connection.execute('INSERT INTO events_raw VALUES (?, ?, ?, ?, ?, ?, ?)',
                               (ident, relative, ordinal, event['title']['en'], encoded(dates), event['type'], encoded(event)))
            for table, key in [('event_people', 'people'), ('event_represented_people', 'representedBy')]:
                connection.executemany(f'INSERT INTO {table} VALUES (?, ?, ?)',
                                       [(ident, person, i) for i, person in enumerate(event.get(key, []))])
            _sources(connection, event.get('sources', []), 'event_sources', 'event_id', ident)
    patch_id = 0
    for stage, name in enumerate(PATCH_STAGES, 1):
        relative = EVENT_ROOT + '/' + name
        for ordinal, patch in enumerate(read(relative)):
            patch_id += 1
            connection.execute('INSERT INTO event_patches VALUES (?, ?, ?, ?, ?, ?)',
                               (patch_id, stage, ordinal, patch['eventId'], relative, encoded(patch)))
            for role, key in [('participant', 'people'), ('represented', 'representedBy')]:
                connection.executemany('INSERT INTO patch_people VALUES (?, ?, ?, ?)',
                                       [(patch_id, person, role, i) for i, person in enumerate(patch.get(key, []))])
            _sources(connection, patch.get('sources', []), 'patch_sources', 'patch_id', patch_id)
    return summary(connection)


def summary(connection):
    counts = {key: connection.execute(f'SELECT count(*) FROM {table}').fetchone()[0]
              for key, table in [('people', 'people'), ('events', 'events_raw'), ('patches', 'event_patches'),
                                 ('portraits', 'media_assets'), ('sources', 'sources')]}
    counts['patchStages'] = {str(stage): count for stage, count in connection.execute('SELECT stage, count(*) FROM event_patches GROUP BY stage ORDER BY stage')}
    counts['languages'] = ['en']
    def saved_document(path):
        row = connection.execute('SELECT content FROM source_documents WHERE path=?', (path,)).fetchone()
        if row is None:
            raise ValueError('Missing database source snapshot: ' + path)
        return json.loads(row[0])

    counts['biographiesReviewed'] = saved_document(PEOPLE_SOURCE)['as_of']
    counts['eventsReviewed'] = saved_document(EVENT_ROOT + '/index-config.json')['reviewedAt']
    return counts


def _rows(connection, table, owner_column, owner):
    return [row[0] for row in connection.execute(f'SELECT source_id FROM {table} WHERE {owner_column} = ? ORDER BY ordinal', (owner,))]


def _expected_sources(rows):
    return [hashlib.sha256(encoded(source).encode()).hexdigest() for source in rows]


def validate(connection):
    errors = []
    try:
        people = read(PEOPLE_SOURCE)['people']
        actual = [tuple(row) for row in connection.execute('SELECT id,ordinal,name,sort_year,birth_json,death_json,death_status,source_path,payload_json FROM people ORDER BY ordinal')]
        expected_people = [(p['id'],p['order'],p['name'],p['sort_year'],encoded(p['birth']),encoded(p['death']) if p.get('death') is not None else None,p['death_status'],PEOPLE_SOURCE,encoded(p)) for p in people]
        if expected_people != actual:
            errors.append('People payload/order differs from canonical English source')
        if [p['order'] for p in people] != list(range(1, len(people) + 1)):
            errors.append('Non-contiguous people order')
        for person in people:
            ident = person['id']
            if connection.execute('SELECT * FROM media_assets WHERE id=?', (ident,)).fetchone() is None:
                errors.append('Missing portrait: ' + ident)
            else:
                asset = tuple(connection.execute('SELECT id,path,sha256,size_bytes,kind,rights_status,payload_json FROM media_assets WHERE id=?', (ident,)).fetchone())
                if asset != _asset(person):
                    errors.append('Portrait metadata differs: ' + ident)
            for role, key in [('browse', 'browse_domains'), ('navigation', 'navigation_fields')]:
                fields = [r[0] for r in connection.execute('SELECT field_id FROM person_fields WHERE person_id=? AND role=? ORDER BY ordinal', (ident, role))]
                if fields != person[key]:
                    errors.append('Field assignments differ: ' + ident + '/' + role)
            if _rows(connection, 'person_sources', 'person_id', ident) != _expected_sources(person['sources']):
                errors.append('Person sources differ: ' + ident)
        expected_events = []
        for file in sorted((ROOT / EVENT_ROOT).glob('events-*.json')):
            relative = file.relative_to(ROOT).as_posix()
            for ordinal, event in enumerate(read(relative)):
                dates = {key: event[key] for key in ('year', 'precision', 'dateRange', 'dateModel', 'timelineDates') if key in event}
                expected_events.append((event['id'], relative, ordinal, event['title']['en'], encoded(dates), event['type'], encoded(event)))
                for table, key in [('event_people', 'people'), ('event_represented_people', 'representedBy')]:
                    linked = [r[0] for r in connection.execute(f'SELECT person_id FROM {table} WHERE event_id=? ORDER BY ordinal', (event['id'],))]
                    if linked != event.get(key, []):
                        errors.append('Event people differ: ' + event['id'] + '/' + key)
                if _rows(connection, 'event_sources', 'event_id', event['id']) != _expected_sources(event.get('sources', [])):
                    errors.append('Event sources differ: ' + event['id'])
        actual_events = [tuple(row) for row in connection.execute('SELECT id,source_path,ordinal,title,date_json,event_type,payload_json FROM events_raw ORDER BY source_path,ordinal')]
        if expected_events != actual_events:
            errors.append('Raw event payload/source/order differs')
        expected_patches = []
        for stage, name in enumerate(PATCH_STAGES, 1):
            relative = EVENT_ROOT + '/' + name
            for ordinal, patch in enumerate(read(relative)):
                expected_patches.append((stage, ordinal, patch['eventId'], relative, encoded(patch)))
        actual_patches = [tuple(row) for row in connection.execute('SELECT stage,ordinal,event_id,source_path,payload_json FROM event_patches ORDER BY stage,ordinal')]
        if expected_patches != actual_patches:
            errors.append('Patch payload/application order differs')
        for row in connection.execute('SELECT id,payload_json FROM event_patches ORDER BY stage,ordinal'):
            patch = json.loads(row[1])
            for role, key in [('participant', 'people'), ('represented', 'representedBy')]:
                linked = [r[0] for r in connection.execute('SELECT person_id FROM patch_people WHERE patch_id=? AND role=? ORDER BY ordinal', (row[0], role))]
                if linked != patch.get(key, []):
                    errors.append('Patch people differ: ' + str(row[0]))
            if _rows(connection, 'patch_sources', 'patch_id', row[0]) != _expected_sources(patch.get('sources', [])):
                errors.append('Patch sources differ: ' + str(row[0]))
        for row in connection.execute('SELECT id,url,title,payload_json FROM sources'):
            source = json.loads(row[3])
            if row[0] != hashlib.sha256(encoded(source).encode()).hexdigest() or row[1:3] != (source['url'], source['title']):
                errors.append('Source payload/hash differs: ' + row[0])
        if [row[0] for row in connection.execute('SELECT id FROM fields ORDER BY id')] != sorted(FIELD_IDS):
            errors.append('Field vocabulary differs')
        for row in connection.execute('PRAGMA foreign_key_check'):
            errors.append('Foreign key violation: ' + str(tuple(row)))
    except (ValueError, OSError, KeyError, sqlite3.Error) as error:
        errors.append(str(error))
    return errors
