import test from 'node:test';
import assert from 'node:assert/strict';
import { createDossierNavigation, readExperimentId } from '../js/navigation.js';

function browser(initialURL = 'https://example.test/map/?region=ITA', state = null) {
  const entries = [{ url: initialURL, state }];
  let index = 0;
  const history = {
    get state() { return entries[index].state; },
    get length() { return entries.length; },
    replaceState(state, _, url) { entries[index] = { url: String(url), state }; },
    pushState(state, _, url) {
      entries.splice(index + 1);
      entries.push({ url: String(url), state });
      index++;
    },
    go(offset) { index = Math.max(0, Math.min(entries.length - 1, index + offset)); },
    back() { this.go(-1); },
    forward() { this.go(1); },
  };
  const getURL = () => entries[index].url;
  const nav = createDossierNavigation({ history, getURL, isKnown: id => ['a', 'b', 'project-20k'].includes(id) });
  return { nav, history, getURL, entries, get index() { return index; } };
}

test('route decoding rejects absent, empty and malformed experiment fragments', () => {
  for (const hash of ['', '#overview', '#experiment=', '#experiment=%', '#experiment=%20', null]) {
    assert.equal(readExperimentId(hash), null);
  }
  assert.equal(readExperimentId('#experiment=project%2D20k'), 'project-20k');
});

test('an initial deep link closes to its filtered list and remains reversible', () => {
  const b = browser('https://example.test/map/?region=ITA&q=axion#experiment=a', { parent: 'keep-on-base' });
  assert.equal(b.nav.normalize(), 'a');
  assert.equal(b.history.length, 2);
  assert.equal(b.entries[0].url, 'https://example.test/map/?region=ITA&q=axion');
  assert.deepEqual(b.entries[0].state, { parent: 'keep-on-base' });
  assert.deepEqual(b.history.state, { dmViewer: 'a', dmViewerDepth: 1 });
  b.nav.close();
  assert.equal(b.index, 0);
  assert.equal(new URL(b.getURL()).hash, '');
  b.history.forward();
  assert.equal(readExperimentId(new URL(b.getURL()).hash), 'a');
  assert.equal(b.nav.normalize(), 'a');
  assert.equal(b.history.length, 2, 'forward must not normalize the same route twice');
  b.history.back();
  assert.equal(b.index, 0);
});

test('invalid deep links can open a valid dossier without retaining an invalid base', () => {
  for (const hash of ['#experiment=missing', '#experiment=%', '#experiment=']) {
    const b = browser(`https://example.test/map/?category=direct_detection${hash}`);
    assert.equal(b.nav.normalize(), null);
    assert.equal(b.history.length, 1);
    assert.equal(b.nav.open('a'), true);
    assert.equal(b.entries[0].url, 'https://example.test/map/?category=direct_detection');
    assert.equal(b.history.length, 2);
    b.nav.close();
    assert.equal(b.index, 0);
    assert.equal(new URL(b.getURL()).hash, '');
  }
});

test('closing a related-experiment chain returns to the list in one action', () => {
  const b = browser();
  b.nav.open('a');
  b.nav.open('b');
  assert.deepEqual(b.history.state, { dmViewer: 'b', dmViewerDepth: 2 });
  b.nav.close();
  assert.equal(b.index, 0);
  assert.equal(b.getURL(), 'https://example.test/map/?region=ITA');
  b.history.forward();
  assert.equal(readExperimentId(new URL(b.getURL()).hash), 'a');
  b.history.forward();
  assert.equal(readExperimentId(new URL(b.getURL()).hash), 'b');
  b.history.back();
  assert.equal(readExperimentId(new URL(b.getURL()).hash), 'a');
  b.nav.close();
  assert.equal(b.index, 0, 'restoring an earlier dossier retains its own chain depth');
});

test('one open and close leaves exactly one list entry', () => {
  const b = browser('https://example.test/map/', { unrelated: true });
  b.nav.open('a');
  b.nav.open('a');
  assert.equal(b.history.length, 2, 'opening the same dossier twice must be idempotent');
  assert.deepEqual(b.history.state, { dmViewer: 'a', dmViewerDepth: 1 });
  b.nav.close();
  assert.equal(b.index, 0);
  assert.equal(b.entries.filter(e => !new URL(e.url).hash).length, 1);
  assert.deepEqual(b.history.state, { unrelated: true });
});

test('opening a different dossier from an unowned deep link creates a clean base', () => {
  const b = browser('https://example.test/map/?status=future#experiment=a');
  b.nav.open('b');
  assert.equal(b.entries[0].url, 'https://example.test/map/?status=future');
  assert.deepEqual(b.history.state, { dmViewer: 'b', dmViewerDepth: 1 });
  b.nav.close();
  assert.equal(b.index, 0);
});

test('same-id unowned deep links normalize once and unknown IDs do not mutate history', () => {
  const b = browser('https://example.test/map/#experiment=a');
  b.nav.open('a');
  assert.equal(b.history.length, 2);
  assert.equal(b.nav.open('missing'), false);
  assert.equal(b.history.length, 2);
  b.nav.normalize();
  assert.equal(b.history.length, 2);
});

test('fallback close clears an unowned fragment without creating another entry', () => {
  const b = browser('https://example.test/map/?sort=year#experiment=%', { parent: true });
  b.nav.close();
  assert.equal(b.getURL(), 'https://example.test/map/?sort=year');
  assert.equal(b.history.length, 1);
  assert.deepEqual(b.history.state, { parent: true });
  b.nav.close();
  assert.equal(b.history.length, 1);
});
