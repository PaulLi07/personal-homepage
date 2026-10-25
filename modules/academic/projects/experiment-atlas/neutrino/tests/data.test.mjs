import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { filterRecords, countRegions, normalizeText } from '../js/data.js';

const site = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('data/catalog.json', site), 'utf8'));
const mapLabels = JSON.parse(await readFile(new URL('data/map-labels.json', site), 'utf8'));
const geographicNotes = JSON.parse(await readFile(new URL('data/geography-notes.json', site), 'utf8'));
const schema = JSON.parse(await readFile(new URL('data/catalog-schema.json', site), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('data/import-manifest.json', site), 'utf8'));
const canonicalIndex = { ...schema, total_records: manifest.record_count, records: manifest.records };
const rows = catalog.records;
const byId = Object.fromEntries(rows.map(row => [row.id, row]));

test('all 252 entries load independent canonical English dossiers and verified local images', async () => {
  assert.equal(rows.length, 252);
  assert.equal(catalog.record_count, 252);
  assert.equal(canonicalIndex.total_records, 252);
  assert.equal(new Set(rows.map(row => row.id)).size, 252);
  assert.deepEqual(new Set(rows.map(row => row.id)), new Set(canonicalIndex.records.map(row => row.id)));
  await Promise.all(rows.map(async row => {
    assert.equal(row.english_record_path, row.record_path, 'already-English canonical data must not drift into a second copy');
    assert(row.record_path.startsWith('archive/'));
    const recordURL = new URL(row.record_path, site);
    const source = await readFile(recordURL, 'utf8');
    const record = JSON.parse(source);
    assert.equal(record.id, row.id);
    for (const field of ['name', 'full_name', 'aliases', 'category', 'physics_categories', 'technology_tags', 'summary']) {
      assert.deepEqual(row[field], record[field], `${row.id}.${field}`);
    }
    assert.deepEqual(row.tech_groups, record.technology_tags);
    assert.equal(row.status, record.status.code);
    assert.equal(row.status_as_of, record.status.as_of);
    assert(!/[\u3400-\u9fff]/u.test(source), `${row.id} must be English`);
    assert(record.sources.length > 0);
    const media = record.media.find(item => item.local_path);
    assert(media, `${row.id} has a representative image`);
    assert.equal(new URL(media.local_path, recordURL).href, new URL(row.image_path, site).href);
    const image = await readFile(new URL(row.image_path, site));
    assert(image.byteLength > 0);
    assert.equal(createHash('sha256').update(image).digest('hex'), media.sha256, `${row.id} image remains the reviewed file`);
    assert(row.tech_groups.length > 0);
    assert(row.regions.length > 0);
    for (const fullField of ['sources', 'media', 'key_parameters', 'timeline', 'results', 'collaboration']) {
      assert(!(fullField in row), `the index must not inline ${row.id}'s complete ${fullField}`);
    }
  }));
});

test('the website does not duplicate the canonical complete dossier files', async () => {
  const files = await readdir(new URL('data/', site));
  if (files.includes('experiments')) {
    const copies = await readdir(new URL('data/experiments/', site));
    assert.equal(copies.filter(name => name.endsWith('.json')).length, 0);
  }
});

test('all archive physics and technology categories remain available and valid', () => {
  assert.equal(catalog.categories.length, 13);
  assert.equal(catalog.technologies.length, 15);
  assert.deepEqual(catalog.categories.map(row => row.id), canonicalIndex.categories.map(row => row.id));
  assert.deepEqual(catalog.technologies, canonicalIndex.technologies);
  for (const row of rows) {
    assert(row.physics_categories.includes(row.category));
    for (const id of row.physics_categories) assert(catalog.categories.some(c => c.id === id));
    for (const id of row.tech_groups) assert(catalog.technologies.some(c => c.id === id));
  }
  assert(filterRecords(rows, { category: 'reactor' }).some(row => row.id === 'juno'), 'secondary reactor membership is retained');
  assert(filterRecords(rows, { category: 'doublebeta' }).some(row => row.id === 'sno-plus'), 'SNO+ is also a double-beta programme');
  assert(filterRecords(rows, { technology: 'acoustic' }).some(row => row.id === 'acorne'));
});

test('aliases support case, full-width text and punctuation differences', () => {
  assert.equal(normalizeText('Ｂｕｇｅｙ—３'), 'bugey 3');
  for (const query of ['Bugey-3', 'ＢＵＧＥＹ－３', 'bugey 4']) {
    assert(filterRecords(rows, { query }).some(row => row.id === 'bugey'));
  }
  assert(filterRecords(rows, { query: 'nuSol' }).some(row => row.id === 'snappy'));
  assert(filterRecords(rows, { query: 'MINI BINGO' }).some(row => row.id === 'bingo'));
  assert(filterRecords(rows, { query: '7 foot bubble chamber' }).some(row => row.id === 'bnl-e-0427'));
});

test('query, every selected facet and multiple physics memberships are conjunctive', () => {
  const matched = filterRecords(rows, {
    query: 'JUNO China', category: 'reactor', technology: 'scintillator',
    status: 'operating', region: 'CHN',
  });
  assert.deepEqual(matched.map(row => row.id), ['juno', 'tao'], 'TAO legitimately includes JUNO in its full name and also satisfies every facet');
  assert.equal(filterRecords([byId.juno], { query: 'JUNO', region: 'USA' }).length, 0);
  assert.equal(filterRecords([byId.juno], { technology: 'lar' }).length, 0);
  assert.equal(filterRecords(rows, { query: 'JUNO nonexistent_token_91827' }).length, 0);
  const sterileT2K = filterRecords(rows, { query: 'T2K Japan', category: 'sterile', technology: 'gas', region: 'JPN', status: 'operating' });
  assert.deepEqual(sterileT2K.map(row => row.id), ['t2k']);
});

test('future selection includes proposals and construction but preserves mixed stages', () => {
  const future = new Set(filterRecords(rows, { status: 'future' }).map(row => row.id));
  assert(future.has('dune'));
  assert(future.has('hunter'));
  assert(!future.has('katrin'));
  assert(!future.has('trinity'));
  assert(!future.has('juno'));
  assert(filterRecords(rows, { status: 'mixed' }).some(row => row.id === 'katrin'));
});

test('facilities, remote interaction targets, balloons and unselected sites remain distinct', () => {
  assert.deepEqual(byId.snappy.regions, ['SPACE']);
  assert.deepEqual(byId.poemma.regions, ['SPACE']);
  assert.deepEqual(byId.forte.regions, ['SPACE', 'GRL']);
  assert.deepEqual(byId.anita.regions, ['ATA']);
  assert.deepEqual(byId.pueo.regions, ['ATA']);
  assert.deepEqual(byId['euso-spb2'].regions, ['NZL']);
  assert.deepEqual(byId.hunter.regions, ['UNSITED']);
  assert.deepEqual(byId['heron-helium'].regions, ['UNSITED']);
  assert.deepEqual(byId.taroge.regions, ['TWN']);
  assert(!byId.taroge.regions.includes('CHN'));
  assert(byId.grand.regions.includes('CHN') && byId.grand.regions.includes('ARG') && byId.grand.regions.includes('FRA') && byId.grand.regions.includes('GLOBAL'));
  assert.deepEqual(byId.dstau.regions, ['FRA', 'EUROPE']);
  assert(!byId.dstau.regions.includes('CHE'), 'CERN membership does not replace the actual North Area site country');
  assert(!byId['baikal-gvd'].regions.includes('EUROPE'));
  assert(!byId['rno-g'].regions.includes('EUROPE'));
});

test('regional counts de-duplicate multi-site programmes and use the same Europe membership as filters', () => {
  const full = countRegions(rows, catalog.regions);
  assert.equal(full.ALL, 252);
  assert.equal(full.EUROPE, 90);
  assert.equal(full.SPACE, 3);
  assert.equal(full.UNSITED, 7);
  assert.equal(full.TWN, 1);
  const europe = catalog.regions.find(row => row.id === 'EUROPE');
  assert.deepEqual(europe.members, catalog.europe_members);
  for (const id of ['FIN', 'NLD', 'BEL', 'GRC', 'UKR']) assert(europe.members.includes(id));
  assert(!europe.members.includes('RUS') && !europe.members.includes('GRL'));
  for (const row of rows) assert.equal(row.is_europe, row.regions.includes('EUROPE'));
  const icarus = countRegions([byId.icarus], catalog.regions);
  assert.equal(icarus.ALL, 1);
  assert.equal(icarus.USA, 1);
  assert.equal(icarus.ITA, 1);
  assert.equal(icarus.EUROPE, 1);
  const reactor = filterRecords(rows, { category: 'reactor', region: null });
  assert.equal(reactor.length, 50);
  const counts = countRegions(reactor, catalog.regions);
  assert.equal(counts.ALL, 50);
  for (const region of catalog.regions) {
    assert.equal(filterRecords(reactor, { region: region.id }).length, counts[region.id] || 0, `${region.id} count and filter must agree`);
  }
  assert.equal(rows.length, 252, 'filtering must not mutate its input');
});

test('every clickable template country is a named restorable region, including empty entries', () => {
  const regions = new Map(catalog.regions.map(region => [region.id, region]));
  assert.equal(regions.size, catalog.regions.length, 'region IDs stay unique');
  const counts = countRegions(rows, catalog.regions);
  for (const label of mapLabels) {
    const region = regions.get(label.iso);
    assert(region, `${label.iso} map selection must be resolvable in the catalog`);
    assert(region.label && region.label_en, `${label.iso} must retain a country name in the heading and buttons`);
    assert.equal(filterRecords(rows, { region: label.iso }).length, counts[label.iso], `${label.iso} map and country filter counts must agree`);
  }
  const emptyRegions = geographicNotes.template_zero_record_regions;
  assert.deepEqual(emptyRegions.map(region => region.id), ['AUT', 'CHL', 'NAM']);
  for (const { id, name, note } of emptyRegions) {
    const region = regions.get(id);
    assert.equal(region.label, name);
    assert.match(note, /shared world-map template/i);
    assert.match(region.note, /No experiment in the current archive/i);
    assert.equal(filterRecords(rows, { region: id }).length, 0, `${id} must not acquire invented records`);
    assert.equal(counts[id], 0);
    assert.equal(geographicNotes.counts.regions[id], 0);
    assert(!rows.some(row => row.regions.includes(id)), `${id} must remain absent from all canonical record memberships`);
  }
  assert.equal(rows.length, 252);
  assert.equal(counts.EUROPE, 90, 'retaining template entries must not change experiment membership');
});

test('status evidence dates are preserved instead of being replaced by the catalog update', () => {
  assert.equal(byId.borexino.year, 2021);
  assert.equal(byId.kamland.year, 2024);
  assert.equal(byId.tgv.year, null);
  assert.equal(byId.tgv.status_as_of, null);
});
