/** Keep dossier routes reversible without leaving duplicate list entries. */
const PREFIX = '#experiment=';

export function readExperimentId(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(PREFIX)) return null;
  try {
    const id = decodeURIComponent(hash.slice(PREFIX.length));
    return id && !/\s/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function createDossierNavigation({ history, getURL, isKnown }) {
  const currentURL = () => new URL(getURL());
  const ownedDepth = (url) => {
    const id = readExperimentId(url.hash);
    const state = history.state;
    return id && isKnown(id) && state?.dmViewer === id &&
      Number.isSafeInteger(state.dmViewerDepth) && state.dmViewerDepth > 0
      ? state.dmViewerDepth : 0;
  };
  const baseState = () => {
    const state = history.state;
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    const { dmViewer, dmViewerDepth, ...rest } = state;
    return Object.keys(rest).length ? rest : null;
  };
  function cleanBase(url) {
    const base = new URL(url);
    base.hash = '';
    history.replaceState(baseState(), '', base.href);
  }
  function push(url, id, depth) {
    history.pushState({ dmViewer: id, dmViewerDepth: depth }, '', url.href);
  }
  function normalize() {
    const url = currentURL(), id = readExperimentId(url.hash);
    if (!id || !isKnown(id)) return null;
    if (!ownedDepth(url)) {
      cleanBase(url);
      push(url, id, 1);
    }
    return id;
  }
  function open(id) {
    if (typeof id !== 'string' || !isKnown(id)) return false;
    const url = currentURL();
    if (readExperimentId(url.hash) === id) {
      normalize();
      return true;
    }
    const depth = ownedDepth(url);
    if (!depth && url.hash.startsWith(PREFIX)) cleanBase(url);
    url.hash = `${PREFIX}${encodeURIComponent(id)}`;
    push(url, id, depth + 1);
    return true;
  }
  function close() {
    const url = currentURL(), depth = ownedDepth(url);
    if (depth) history.go(-depth);
    else if (url.hash) cleanBase(url);
  }
  return { normalize, open, close };
}
