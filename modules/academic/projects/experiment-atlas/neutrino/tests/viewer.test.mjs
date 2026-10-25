import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createArchiveViewer, createRelatedResolver, physicsLabels,
  siteDescription, siteCoordinates, statusLabel, statusEvidence,
} from '../js/viewer.js';

const site = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('data/catalog.json', site), 'utf8'));
const records = new Map(await Promise.all(catalog.records.map(async row => [row.id,
  JSON.parse(await readFile(new URL(row.record_path, site), 'utf8')),
])));

// Minimal DOM only for rendering/data assertions; browser QA covers native dialog,
// focus trapping, layout and pointer/keyboard interactions.
class Node {
  constructor(tag = '') { this.tagName = tag; this.children = []; this.events = {}; this.attributes = {}; this.dataset = {}; this.open = false; this._text = ''; }
  set textContent(value) { this.children = []; this._text = String(value ?? ''); }
  get textContent() { return this._text + this.children.map(n => n.textContent).join(''); }
  append(...nodes) { for (let n of nodes) { if (typeof n === 'string') { const text = new Node('#text'); text.textContent = n; n = text; } n.parentNode = this; this.children.push(n); } }
  replaceChildren(...nodes) { for (const n of this.children) n.parentNode = null; this.children = []; this._text = ''; this.append(...nodes); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; delete this[key]; }
  addEventListener(type, callback) { (this.events[type] ??= []).push(callback); }
  async fire(type, detail = {}) { for (const callback of this.events[type] ?? []) await callback({ target: this, preventDefault() {}, ...detail }); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() { document.activeElement = this; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); this.parentNode = null; }
  get isConnected() { return this === document.body || !!this.parentNode?.isConnected; }
  querySelector(selector) { return descendants(this).find(n => selector[0] === '.' ? (n.className || '').split(' ').includes(selector.slice(1)) : n.tagName === selector) || null; }
}
function descendants(root) { return root.children.flatMap(child => [child, ...descendants(child)]); }
function findClass(name) { return descendants(document.body).filter(n => (n.className || '').split(' ').includes(name)); }
function installDOM(fetchRecord) {
  const body = new Node('body');
  globalThis.document = { body, baseURI: 'https://example.test/Neutrino_World_Map/', activeElement: body,
    createElement: tag => new Node(tag), createTextNode: value => { const n = new Node('#text'); n.textContent = value; return n; },
    getElementById: id => descendants(body).find(n => n.id === id) || null, querySelectorAll: () => [],
  };
  globalThis.fetch = fetchRecord || (async url => {
    const id = new URL(url).pathname.match(/archive\/([^/]+)\/record\.json$/)?.[1];
    return { ok: records.has(id), status: records.has(id) ? 200 : 404, json: async () => records.get(id) };
  });
}

test('curated status labels preserve cancellations and partial programmes', () => {
  assert.equal(statusLabel(records.get('sox').status), 'Cancelled / never operated');
  assert.equal(statusLabel(records.get('watchman').status), 'Historical proposal / full-scale realization unverified');
  assert.equal(statusLabel(records.get('faser').status), 'Run 3 exposure complete / analysis and future preparations');
  assert.equal(statusLabel({ code: 'completed' }), 'Completed');
  assert.equal(statusLabel('stage_not_reverified'), 'Status not established');
  assert.equal(statusLabel('Completed historical phases'), 'Completed historical phases');
});

test('every physics category remains visible in the dossier', () => {
  const categories = Object.fromEntries(catalog.categories.map(c => [c.id, c.label]));
  const seen = new Set();
  for (const record of records.values()) {
    const expected = [...new Set(record.physics_categories)].map(id => categories[id]);
    assert.deepEqual(physicsLabels(record, categories), expected, record.id);
    assert.ok(expected.every(Boolean), `${record.id}: unknown category`);
    for (const id of record.physics_categories) seen.add(id);
  }
  assert.equal(seen.size, 13);
});

test('related navigation resolves canonical IDs and rejects ambiguous HERON aliases', () => {
  for (const rows of [catalog.records, [...catalog.records].reverse()]) {
    const resolve = createRelatedResolver(rows);
    assert.equal(resolve('heron').name, 'HERON (radio)');
    assert.equal(resolve('heron-helium').name, 'HERON (superfluid helium)');
    assert.equal(resolve('HERON'), null, 'a shared acronym must not depend on catalog order');
    assert.equal(resolve('  HERON solar  ').id, 'heron-helium');
    assert.equal(resolve('HERON radio').id, 'heron');
    for (const record of records.values()) for (const target of record.related_experiments) {
      assert.ok(resolve(target), `${record.id}: unresolved relation ${target}`);
    }
  }
});

test('location text avoids repetition and unknown coordinates remain undisplayed', () => {
  assert.equal(siteDescription({ name: 'France; Mediterranean seabed off Toulon', country: 'France', location: 'France; Mediterranean seabed off Toulon' }), '');
  assert.equal(siteDescription({ name: 'Kamioka', country: 'Japan', location: 'Kamioka' }), 'Japan');
  assert.equal(siteDescription({ name: 'Detector', country: 'Japan', location: 'Kamioka, Japan' }), 'Kamioka, Japan');
  assert.equal(siteCoordinates({ latitude: 36.4, longitude: 137.3, precision: 'not_verified' }), '');
  assert.equal(siteCoordinates({ latitude: null, longitude: null, precision: 'approximate_site' }), '');
  assert.equal(siteCoordinates({ latitude: 91, longitude: 20, precision: 'approximate_site' }), '');
  assert.equal(siteCoordinates({ latitude: 36.4, longitude: 137.3, precision: 'approximate_site' }), 'Approximate site: 36.4°, 137.3°');
});

test('only exact archival status boilerplate is hidden', () => {
  const generic = 'The cited publication documents this stage; its publication date is distinct from the data-taking period.';
  assert.equal(statusEvidence(generic), '');
  assert.equal(statusEvidence(`${generic} The proposal was cancelled.`), `${generic} The proposal was cancelled.`);
  assert.equal(statusEvidence(records.get('sox').status.evidence), records.get('sox').status.evidence);
});

test('all canonical dossiers render, cite phases, resolve images and download independent files', async () => {
  installDOM();
  const viewer = createArchiveViewer({ catalog });
  for (const row of catalog.records) {
    assert.equal(await viewer.open(row.id, { updateHistory: false }), true, row.id);
    const record = records.get(row.id);
    assert.equal(findClass('dm-viewer-eyebrow')[0].textContent, 'NEUTRINO · EXPERIMENT DOSSIER');
    assert.equal(findClass('dm-status')[0].textContent, record.status.label);
    const image = findClass('dm-representative-image')[0];
    const media = record.media.find(m => m.local_path);
    assert.equal(image.src, new URL(media.local_path, new URL(row.record_path, document.baseURI)).href, row.id);
    const download = findClass('dm-action-link').find(n => n.download);
    assert.equal(download.href, new URL(row.record_path, document.baseURI).href);
    assert.equal(download.download, `${row.id}.en.json`);
    for (const ref of findClass('dm-source-ref')) {
      const number = ref.textContent.slice(1, -1);
      assert.ok(findClass('dm-paper-reference').some(n => n.id.endsWith(`-reference-${number}`)), `${row.id}: broken reference ${number}`);
    }
    const phaseCards = findClass('dm-phase-card');
    record.phases.forEach((phase, i) => {
      if (phase.source_ids?.length) assert.ok(phaseCards[i].querySelector('.dm-source-ref'), `${row.id}: uncited phase ${phase.name}`);
    });
    const resolve = createRelatedResolver(catalog.records);
    const relatedButtons = findClass('dm-related-link');
    const expectedRelated = record.related_experiments.map(resolve).filter(target => target && target.id !== row.id).map(target => target.name);
    assert.deepEqual(relatedButtons.map(n => n.textContent), expectedRelated, row.id);
  }
  viewer.destroy();
  assert.equal(document.body.children.length, 0);
});

test('enlarging and dismissing an image keeps the dossier open', async () => {
  installDOM();
  const viewer = createArchiveViewer({ catalog });
  await viewer.open('sox');
  const photo = findClass('dm-photo-button')[0];
  await photo.fire('click');
  const lightbox = findClass('dm-image-dialog')[0];
  assert.equal(lightbox.open, true);
  assert.match(findClass('dm-image-original')[0].src, /archive\/sox\/images\//);
  await lightbox.fire('cancel');
  assert.equal(lightbox.open, false);
  assert.equal(viewer.isOpen(), true);
  assert.equal(document.activeElement, photo);
  viewer.close();
  assert.equal(viewer.isOpen(), false);
  viewer.destroy();
});

test('related buttons show experiment names and navigate to the correct HERON dossier', async () => {
  installDOM();
  const routes = [];
  const viewer = createArchiveViewer({ catalog, onNavigate: id => routes.push(id) });
  await viewer.open('heron');
  const helium = findClass('dm-related-link').find(n => n.textContent === 'HERON (superfluid helium)');
  assert.ok(helium);
  await helium.fire('click');
  assert.equal(viewer.currentId(), 'heron-helium');
  assert.equal(findClass('dm-viewer-heading')[0].querySelector('h2').textContent, 'HERON (superfluid helium)');
  assert.deepEqual(routes, ['heron', 'heron-helium']);
  viewer.close();
  assert.deepEqual(routes, ['heron', 'heron-helium', null]);
  viewer.destroy();
});

test('a failed request offers a working retry without duplicating navigation', async () => {
  let calls = 0;
  const routes = [];
  installDOM(async () => ++calls === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => records.get('sox') });
  const viewer = createArchiveViewer({ catalog, onNavigate: id => routes.push(id) });
  assert.equal(await viewer.open('sox'), false);
  assert.equal(viewer.isOpen(), true);
  assert.equal(findClass('dm-viewer-error').length, 1);
  const retry = findClass('dm-action-link').find(n => n.textContent === 'Retry');
  await retry.fire('click');
  assert.equal(findClass('dm-viewer-error').length, 0);
  assert.equal(findClass('dm-status')[0].textContent, 'Cancelled / never operated');
  assert.deepEqual(routes, ['sox']);
  viewer.destroy();
});

test('a late response cannot overwrite a newer dossier or reopen a closed dialog', async () => {
  const pending = new Map();
  installDOM(url => new Promise(resolve => pending.set(new URL(url).pathname.match(/archive\/([^/]+)\//)[1], resolve)));
  const viewer = createArchiveViewer({ catalog });
  const response = id => ({ ok: true, json: async () => records.get(id) });
  const first = viewer.open('heron');
  const second = viewer.open('heron-helium');
  pending.get('heron-helium')(response('heron-helium'));
  assert.equal(await second, true);
  pending.get('heron')(response('heron'));
  assert.equal(await first, false);
  assert.equal(viewer.currentId(), 'heron-helium');
  assert.equal(findClass('dm-viewer-heading')[0].querySelector('h2').textContent, 'HERON (superfluid helium)');
  const third = viewer.open('sox');
  viewer.close();
  pending.get('sox')(response('sox'));
  assert.equal(await third, false);
  assert.equal(viewer.isOpen(), false);
  viewer.destroy();
});
