/* Shared, dependency-free archive filtering. Dates remain source text. */
(function (root) {
  'use strict';
  const eras = [
    {id:'ancient', min:-Infinity, max:1499, en:'Antiquity & Middle Ages', range:{en:'BCE — 1499'}},
    {id:'scientific', min:1500, max:1699, en:'Scientific Revolution', range:{en:'1500 — 1699'}},
    {id:'enlightenment', min:1700, max:1799, en:'The classical foundations', range:{en:'1700 — 1799'}},
    {id:'nineteenth', min:1800, max:1899, en:'A century of discovery', range:{en:'1800 — 1899'}},
    {id:'modern', min:1900, max:Infinity, en:'Into the modern era', range:{en:'1900 onwards'}}
  ];
  const domains = [
    {id:'history',en:'Natural philosophy & history',pattern:/natural philosophy|history of (?:physics|science)/i},
    {id:'mechanics',en:'Classical mechanics & fluids',pattern:/classical mechanics|fluid|elastic|continuum|celestial mechanics/i},
    {id:'light',en:'Optics & electromagnetism',pattern:/electromag|optic|spectroscop|magnet|electric|photonics/i},
    {id:'heat',en:'Heat & statistical physics',pattern:/therm|statistic|cryogen|heat/i},
    {id:'quantum',en:'Quantum, atomic & molecular',pattern:/quantum|atomic|molecular/i},
    {id:'matter',en:'Condensed matter & materials',pattern:/condensed|solid.state|semiconductor|superconduct|crystal|material|mesoscopic/i},
    {id:'particle',en:'Particles, nuclei & fields',pattern:/particle|nuclear|field theory|high.energy|accelerator/i},
    {id:'cosmos',en:'Astrophysics, cosmos & gravity',pattern:/astrophys|astronom|cosmolog|gravit|relativ/i},
    {id:'methods',en:'Mathematical & experimental',pattern:/mathemat|computation|experiment|instrument|metrolog|measurement|detector/i}
  ];
  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`·.,;:()\[\]{}\-–—_/]/g,' ').replace(/\s+/g,' ').trim();
  }
  function eraOf(person) { return eras.find(era => person.sortYear >= era.min && person.sortYear <= era.max); }
  function searchText(person) { return normalize([person.names.en,...person.fields.en].join(' ')); }
  function filterPeople(people, state) {
    const tokens = normalize(state.query).split(' ').filter(Boolean);
    const domain = domains.find(item => item.id === state.field);
    return people.filter(person => (!state.era || state.era === 'all' || eraOf(person).id === state.era)
      && (!domain || (Array.isArray(person.browseDomains) ? person.browseDomains.includes(domain.id) : person.fields.en.some(field => domain.pattern.test(field))))
      && tokens.every(token => searchText(person).includes(token)));
  }
  const api = Object.freeze({eras,domains,normalize,eraOf,searchText,filterPeople});
  root.ArchiveCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
