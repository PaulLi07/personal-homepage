import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { filterRecords, countRegions, normalizeText } from '../js/data.js';

const site = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('data/catalog.json', site), 'utf8'));
const rows = catalog.records;
const byId = Object.fromEntries(rows.map(row => [row.id, row]));

test('every indexed experiment retains independently readable data and a real image', async () => {
  assert.equal(rows.length, 297);
  assert.equal(catalog.record_count, 297);
  assert.equal(new Set(rows.map(row => row.id)).size, 297);
  await Promise.all(rows.map(async row => {
    const recordURL = new URL(row.record_path, site);
    const record = JSON.parse(await readFile(recordURL, 'utf8'));
    assert.equal(record.id, row.id);
    assert.equal(row.name, record.name);
    assert.equal(row.status_as_of, record.status.as_of);
    await access(fileURLToPath(new URL(row.image_path, site)));
    assert(row.tech_groups.length > 0);
    assert(row.regions.length > 0);
    assert(!('sources' in row), 'full bibliography must stay in each independent record');
    assert(!('media' in row), 'full image metadata must stay in each independent record');
    assert(!('key_parameters' in row), 'detailed parameters must stay in each independent record');
  }));
});

test('aliases support case, full-width text and punctuation differences', () => {
  assert.equal(normalizeText('ＤａｒｋＳｉｄｅ—２０Ｋ'), 'darkside 20k');
  for (const query of ['darkside 20k', 'ＤＡＲＫＳＩＤＥ－２０ｋ', 'DS-20k']) {
    assert(filterRecords(rows, { query }).some(row => row.id === 'darkside'));
  }
  assert(filterRecords(rows, { query: 'HeRALD' }).some(row => row.id === 'tesseract'));
  assert(filterRecords(rows, { query: 'LAMPPOST' }).some(row => row.id === 'lamppost'));
});

test('search tokens and selected facets are all conjunctive', () => {
  const matched = filterRecords(rows, {
    query: 'XENON 意大利', category: 'direct_detection', technology: 'noble_liquid',
    status: 'operating', region: 'EUROPE',
  });
  assert.deepEqual(matched.map(row => row.id), ['xenon']);
  assert.equal(filterRecords([byId.xenon], { query: 'XENON', region: 'USA' }).length, 0);
  assert.equal(filterRecords([byId.xenon], { query: 'XENON', technology: 'bubble' }).length, 0);
  assert.equal(filterRecords(rows, { query: 'XENON 無此關鍵詞' }).length, 0);
});

test('future facet includes development but preserves mixed and unknown stages', () => {
  const future = new Set(filterRecords(rows, { status: 'future' }).map(row => row.id));
  assert(future.has('tesseract'));
  assert(future.has('cygnus'));
  assert(!future.has('darkside'));
  assert(!future.has('lamppost'));
  assert(filterRecords(rows, { status: 'mixed' }).some(row => row.id === 'darkside'));
});

test('geography distinguishes facilities, prototypes, space and unverified teams', () => {
  assert.deepEqual(byId.ams.regions, ['SPACE']);
  assert.deepEqual(byId.herd.regions, ['SPACE']);
  assert.deepEqual(byId.nasduck.regions, ['UNSITED']);
  assert.deepEqual(byId.windchime.regions, ['UNSITED']);
  assert.deepEqual(byId.lamppost.regions, ['UNSITED']);
  assert.deepEqual(byId.squad.regions, ['UNSITED']);
  assert.deepEqual(byId.bess.regions, ['ATA']);
  assert.deepEqual(byId.gnome.regions, ['GLOBAL']);
  assert(byId.cosi.regions.includes('SPACE') && byId.cosi.regions.includes('NZL'));
  assert(byId['apt-adapt'].regions.includes('SPACE') && byId['apt-adapt'].regions.includes('ATA'));
  assert(byId.grand.regions.includes('CHN') && byId.grand.regions.includes('FRA') && byId.grand.regions.includes('ARG'));
  assert(!byId['baikal-gvd'].regions.includes('EUROPE'));
  assert(byId.atlas.regions.includes('CHE'));
  assert(byId.cms.regions.includes('FRA'));
  assert(!byId.cms.regions.includes('CHE'));
});

test('regional counts de-duplicate multi-site series and respect supplied filters', () => {
  const full = countRegions(rows, catalog.regions);
  assert.equal(full.ALL, 297);
  assert.equal(full.EUROPE, 106);
  assert.equal(full.SPACE, 44);
  assert.equal(full.UNSITED, 15);
  const sabre = countRegions([byId.sabre], catalog.regions);
  assert.equal(sabre.ALL, 1);
  assert.equal(sabre.ITA, 1);
  assert.equal(sabre.AUS, 1);
  assert.equal(sabre.EUROPE, 1);
  const noRegion = filterRecords(rows, { category: 'direct_detection', region: null });
  assert.equal(noRegion.length, 68);
  assert.equal(countRegions(noRegion, catalog.regions).ALL, 68);
  assert.equal(rows.length, 297, 'filters must not mutate their input');
});

test('source evidence dates are not fabricated from the index update date', () => {
  assert.equal(byId['a1-mami'].year, 2014);
  assert.equal(byId.darkside.year, null);
  assert.equal(byId.darkside.status_as_of, null);
});
