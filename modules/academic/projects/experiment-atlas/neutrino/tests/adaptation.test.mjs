import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { filterRecords, countRegions, normalizeText } from '../js/data.js';

const site = new URL('../', import.meta.url);
const template = new URL('../../dark-matter/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('data/catalog.json', site), 'utf8'));
const mapLabels = JSON.parse(await readFile(new URL('data/map-labels.json', site), 'utf8'));
const schema = JSON.parse(await readFile(new URL('data/catalog-schema.json', site), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('data/import-manifest.json', site), 'utf8'));
const sourceIndex = { ...schema, total_records: manifest.record_count, records: manifest.records };
const rows = catalog.records;
const byId = new Map(rows.map(row => [row.id, row]));
const canonical = new Map(await Promise.all(rows.map(async row => {
  const record = JSON.parse(await readFile(new URL(row.record_path, site), 'utf8'));
  return [record.id, record];
})));
const sortedIds = entries => entries.map(entry => entry.id).sort();

// Tests compare generated results with independent archival evidence, rather than
// copying the implementation's region/category lookup tables into expectations.
test('the atlas covers the complete archive without embedding detailed dossiers', async () => {
  assert.equal(catalog.record_count, sourceIndex.total_records);
  assert.equal(rows.length, sourceIndex.total_records);
  assert.equal(byId.size, rows.length);
  assert.deepEqual(sortedIds(rows), sortedIds(sourceIndex.records));
  await Promise.all(rows.map(async row => {
    const record = canonical.get(row.id);
    assert.equal(record.id, row.id);
    assert.equal(record.name, row.name);
    assert.deepEqual(row.physics_categories, record.physics_categories);
    assert.equal(row.status, record.status.code);
    assert.equal(row.status_as_of, record.status.as_of);
    assert(row.record_path.startsWith('archive/'));
    await access(new URL(row.image_path, site));
    for (const key of ['sources', 'media', 'key_parameters', 'results', 'timeline']) {
      assert(!(key in row), `${row.id}: ${key} belongs to the independent dossier`);
    }
  }));
});

test('physics and technology facets retain every multipurpose programme', () => {
  for (const category of sourceIndex.categories) {
    const expected = [...canonical.values()].filter(record => record.physics_categories.includes(category.id));
    assert.deepEqual(sortedIds(filterRecords(rows, { category: category.id })), sortedIds(expected), category.id);
  }
  for (const technology of sourceIndex.technologies) {
    const expected = [...canonical.values()].filter(record => record.technology_tags.includes(technology.id));
    assert.deepEqual(sortedIds(filterRecords(rows, { technology: technology.id })), sortedIds(expected), technology.id);
  }
  for (const category of ['solar', 'reactor', 'doublebeta', 'supernova']) {
    assert(filterRecords(rows, { category }).some(row => row.id === 'sno-plus'), `SNO+ / ${category}`);
  }
});

test('every recorded detector country is accessible through a distinct catalog region', () => {
  const available = new Set(catalog.regions.map(region => region.id));
  for (const record of canonical.values()) {
    for (const site of record.sites) {
      if (!site.country_code) continue;
      assert(available.has(site.country_code), `${record.id}: ${site.country_code} is absent from the region catalog`);
      assert(byId.get(record.id).regions.includes(site.country_code), `${record.id}: detector country missing from index`);
      assert(filterRecords(rows, { region: site.country_code }).some(row => row.id === record.id));
    }
  }
  for (const id of ['FIN', 'NLD', 'BHS', 'PER', 'TWN']) {
    assert(available.has(id));
    assert(filterRecords(rows, { region: id }).length > 0);
  }
  assert(filterRecords(rows, { region: 'TWN' }).some(row => row.id === 'taroge'));
  assert(!filterRecords([byId.get('taroge')], { region: 'CHN' }).length);
});

test('every map shortcut has a named, restorable region even when its count is zero', () => {
  const regions = new Map(catalog.regions.map(region => [region.id, region]));
  const counts = countRegions(rows, catalog.regions);
  const zeroShortcuts = [];
  for (const shortcut of mapLabels) {
    const region = regions.get(shortcut.iso);
    assert(region, `${shortcut.iso}: a clickable map label needs a catalog region`);
    assert(['country', 'special'].includes(region.kind), shortcut.iso);
    assert(region.label?.trim(), `${shortcut.iso}: the selected heading needs a country name`);
    const selected = filterRecords(rows, { region: shortcut.iso });
    assert.equal(counts[shortcut.iso], selected.length, shortcut.iso);
    if (!selected.length) zeroShortcuts.push(shortcut);

    // Region registration drives both the country buttons and app.syncControls().
    // A valid persisted shortcut must therefore remain registered after reload,
    // rather than being normalized to ALL and losing its named empty state.
    const route = new URL('https://example.test/Neutrino_World_Map/');
    route.searchParams.set('region', shortcut.iso);
    const restored = new URL(route.href).searchParams.get('region');
    assert.equal(regions.get(restored)?.id, shortcut.iso);
    assert.deepEqual(sortedIds(filterRecords(rows, { region: restored })), sortedIds(selected));
  }
  assert(zeroShortcuts.length > 0, 'exercise the zero-count map shortcut case');
  for (const shortcut of zeroShortcuts) {
    assert.equal(counts[shortcut.iso], 0);
    assert.equal(filterRecords(rows, { region: shortcut.iso }).length, 0);
    assert.notEqual(regions.get(shortcut.iso).label, 'All countries and regions');
  }
});

test('Europe counts a multisite programme once and excludes Russia and Greenland', () => {
  const europe = new Set(['AUT', 'BEL', 'CHE', 'DEU', 'ESP', 'FIN', 'FRA', 'GBR', 'GRC', 'ITA', 'NLD', 'SWE', 'UKR']);
  const expected = [...canonical.values()].filter(record => record.sites.some(site => europe.has(site.country_code)));
  const matched = filterRecords(rows, { region: 'EUROPE' });
  assert.deepEqual(sortedIds(matched), sortedIds(expected));
  assert.equal(countRegions(rows, catalog.regions).EUROPE, expected.length);
  for (const id of ['km3net', 'lena', 'bingo', 'igex']) {
    assert.equal(countRegions([byId.get(id)], catalog.regions).EUROPE, 1, id);
  }
  assert(!matched.some(row => row.id === 'baikal-gvd'));
  assert(!matched.some(row => row.id === 'rno-g'));
});

test('orbital experiments and unselected detector sites do not become host institutions', () => {
  for (const id of ['forte', 'snappy', 'poemma']) assert(byId.get(id).regions.includes('SPACE'), id);
  assert(byId.get('forte').regions.includes('GRL'));
  for (const id of ['hunter', 'moon', 'selena', 'zicos', 'darwin', 'xlzd', 'heron-helium']) {
    assert.deepEqual(byId.get(id).regions, ['UNSITED'], id);
  }
  assert(!byId.get('poemma').regions.includes('GLOBAL'));
});

test('combined search and facets remain conjunctive, normalized and non-mutating', () => {
  assert.equal(normalizeText('ＳＮＯ＋'), 'sno');
  const before = JSON.stringify(rows);
  const matched = filterRecords(rows, { query: 'ＳＮＯ＋', category: 'doublebeta', technology: 'scintillator', region: 'CAN' });
  assert(matched.some(row => row.id === 'sno-plus'));
  assert.equal(filterRecords([byId.get('sno-plus')], { category: 'doublebeta', region: 'USA' }).length, 0);
  assert.equal(filterRecords([byId.get('sno-plus')], { query: 'unmatchablewordabc' }).length, 0);
  const future = new Set(filterRecords(rows, { status: 'future' }).map(row => row.id));
  for (const row of rows) assert.equal(future.has(row.id), ['proposed', 'planned', 'research_development', 'construction', 'commissioning'].includes(row.status), row.id);
  assert.equal(JSON.stringify(rows), before);
});

test('the approved template design assets remain byte-identical', async () => {
  for (const name of ['reference.css', 'styles.css', 'viewer.css', 'assets/world-map.svg']) {
    const [actual, expected] = await Promise.all([readFile(new URL(name, site)), readFile(new URL(name, template))]);
    assert(actual.equals(expected), `${name} differs from the Dark Matter template`);
  }
});
