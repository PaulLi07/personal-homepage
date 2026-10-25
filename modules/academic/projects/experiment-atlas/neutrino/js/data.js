/** Map/search data helpers. Full experiment records are fetched separately. */
export const FUTURE_STATUSES = Object.freeze([
  'proposed', 'planned', 'research_development', 'construction', 'commissioning',
]);

// Europe membership is assigned explicitly by the catalog builder from its documented country set.

/** Case, full-width forms and punctuation must not make aliases unsearchable. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function loadCatalog() {
  const response = await fetch(new URL('../data/catalog.json', import.meta.url));
  if (!response.ok) throw new Error(`Unable to read the experiment catalog (HTTP ${response.status}).`);
  const catalog = await response.json();
  if (!Array.isArray(catalog.records) || catalog.record_count !== catalog.records.length) {
    throw new Error('The catalog is incomplete: the record count does not match.');
  }
  return catalog;
}

function isAll(value) {
  return value == null || value === '' || String(value).toLowerCase() === 'all';
}

function matchesRegion(row, region) {
  if (isAll(region)) return true;
  const ids = row.regions ?? [];
  if (region === 'EUROPE') {
    return ids.includes('EUROPE');
  }
  return ids.includes(region);
}

/**
 * Apply all selected facets with AND semantics. Query words also use AND;
 * an individual word can match any indexed name, alias, location or method.
 * Pass region: null when computing facets independently of region selection.
 */
export function filterRecords(records, filters = {}) {
  const { query = '', category = 'all', technology = 'all', status = 'all', region = 'ALL' } = filters;
  const terms = normalizeText(query).split(' ').filter(Boolean);
  return records.filter(row => {
    if (!isAll(category) && !(row.physics_categories ?? [row.category]).includes(category)) return false;
    if (!isAll(technology) && !(row.tech_groups ?? []).includes(technology)) return false;
    if (!isAll(status)) {
      if (status === 'future') {
        if (!FUTURE_STATUSES.includes(row.status)) return false;
      } else if (row.status !== status) return false;
    }
    if (!matchesRegion(row, region)) return false;
    if (terms.length) {
      const searchable = normalizeText(row.search_text || [
        row.id, row.name, row.full_name, ...(row.aliases ?? []), row.summary,
        ...(row.technologies ?? []), ...(row.physics_targets ?? []),
      ].filter(Boolean).join(' '));
      if (!terms.every(term => searchable.includes(term))) return false;
    }
    return true;
  });
}

/** Count unique records per region. A multi-site row contributes once per bin. */
export function countRegions(records, regions = []) {
  const counts = Object.fromEntries(regions.map(region => [typeof region === 'string' ? region : region.id, 0]));
  counts.ALL = records.length;
  for (const row of records) {
    const ids = new Set(row.regions ?? []);
    for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
