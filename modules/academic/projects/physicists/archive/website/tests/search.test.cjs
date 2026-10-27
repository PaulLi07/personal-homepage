/* Source-grounded regression checks; no browser or third-party dependencies. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const core = require('../src/core.js');
const archiveSource = fs.readFileSync(path.join(root, 'website/site/data/archive.js'), 'utf8');
const archiveContext = {};
vm.runInNewContext(archiveSource, archiveContext);
const archive = archiveContext.PHYSICS_ARCHIVE;
const people = archive.people;
const byId = new Map(people.map(p => [p.id, p]));
const ids = rows => Array.from(rows, p => p.id);
const find = (query = '', field = 'all', era = 'all') => core.filterPeople(people, {query, field, era});
const contains = (rows, ...expected) => expected.forEach(id => assert.ok(ids(rows).includes(id), `Missing ${id}`));

test('Packaged biographies remain distinct and retain their source birth order', () => {
  assert.equal(people.length, 721);
  assert.equal(byId.size, people.length);
  assert.deepEqual(ids(find()), ids(people));
  assert.equal(people[0].id, 'thales');
  assert.equal(people.at(-1).id, 'konstantin-novoselov');
  assert.ok(people.every((p, i) => !i || p.sortYear >= people[i - 1].sortYear));
});

test('English names ignore case, accents and surrounding whitespace', () => {
  contains(find('  eINsTeIn  '), 'albert-einstein');
  contains(find('Chen Ning Yang'), 'chen-ning-yang');
  contains(find('Schrodinger'), 'erwin-schrodinger');
  assert.deepEqual(ids(find('Schrodinger')), ids(find('Schrödinger')));
});

test('Similar surnames do not merge independent records', () => {
  contains(find('Wolfgang Paul'), 'wolfgang-paul', 'wolfgang-pauli');
  contains(find('Bell'), 'john-stewart-bell', 'jocelyn-bell-burnell');
  assert.notEqual(byId.get('wolfgang-paul').birth.date, byId.get('wolfgang-pauli').birth.date);
});

test('English research fields and multiword queries combine', () => {
  contains(find('gas discharge'), 'francis-hauksbee');
  contains(find('Quantum field theory'), 'nima-arkani-hamed');
  contains(find('condensed matter'), 'shirley-ann-jackson');
  contains(find('Einstein relativity'), 'albert-einstein');
  assert.equal(find('Einstein gas discharge').length, 0);
});

test('No results and markup-like input are inert', () => {
  assert.equal(find('zzzz-physics-no-match-9173').length, 0);
  assert.equal(find('<script>alert(1)</script>').length, 0);
});

test('Era boundaries are inclusive, non-overlapping and cover BCE', () => {
  const boundaries = [[-624, 'ancient'], [1499, 'ancient'], [1500, 'scientific'], [1699, 'scientific'],
    [1700, 'enlightenment'], [1799, 'enlightenment'], [1800, 'nineteenth'], [1899, 'nineteenth'], [1900, 'modern'], [1974, 'modern']];
  for (const [sortYear, expected] of boundaries) assert.equal(core.eraOf({sortYear}).id, expected);
  const joined = core.eras.flatMap(era => ids(find('', 'all', era.id)));
  assert.deepEqual(joined, ids(people));
});

test('Domain, era and name filters combine rather than override one another', () => {
  contains(find('Einstein', 'cosmos', 'nineteenth'), 'albert-einstein');
  assert.equal(find('Einstein', 'cosmos', 'modern').length, 0);
  contains(find('Majorana', 'particle', 'modern'), 'ettore-majorana');
  assert.equal(find('Majorana', 'heat', 'modern').length, 0);
  for (const [domain, person] of [['history', 'thales'], ['mechanics', 'isaac-newton'], ['light', 'michael-faraday'],
    ['heat', 'ludwig-boltzmann'], ['quantum', 'erwin-schrodinger'], ['matter', 'john-bardeen'],
    ['particle', 'georgy-flerov'], ['cosmos', 'edwin-hubble'], ['methods', 'george-green']]) contains(find('', domain), person);
});

test('Source uncertainty, image classification and complete English content survive packaging', () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, 'en/data/physicists.json'), 'utf8')).people;
  for (const english of en) {
    const p = byId.get(english.id);
    assert.equal(p.biography.en, english.biography, english.id);
    assert.deepEqual(Array.from(p.contributions.en), english.contributions, english.id);
    assert.deepEqual(Array.from(p.notes.en), english.notes, english.id);
    assert.deepEqual(Array.from(p.fields.en), english.fields, english.id);
    assert.equal(p.birth.display.en, english.birth.display, english.id);
    assert.equal(p.birth.precision, english.birth.precision, english.id);
    assert.equal(p.death?.date ?? null, english.death?.date ?? null, english.id);
    assert.equal(p.death?.display.en ?? null, english.death?.display ?? null, english.id);
    assert.equal(p.deathStatus, english.death_status, english.id);
    assert.equal(p.portrait.kind, english.portrait.kind, english.id);
    assert.equal(p.portrait.note.en, english.portrait.depiction_note, english.id);
    assert.deepEqual(Array.from(p.sources.en, s => [s.title, s.url]), english.sources.map(s => [s.title, s.url]), english.id);
    assert.equal(Object.hasOwn(p.biography,'zh'),false,english.id);
  }
  assert.equal(byId.get('ettore-majorana').death, null);
  assert.equal(byId.get('ettore-majorana').deathStatus, 'unknown');
  assert.equal(byId.get('nima-arkani-hamed').deathStatus, 'alive');
  assert.equal(byId.get('francis-hauksbee').portrait.kind, 'context_image');
  assert.equal(byId.get('georgy-flerov').portrait.kind, 'posthumous_depiction');
  assert.equal(byId.get('shirley-ann-jackson').portrait.rightsStatus, 'permission_required');
});
