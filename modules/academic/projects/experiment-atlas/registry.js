/* 地图入口只登记展示资料；数量与日期来自随源码发布的本地目录元数据。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const base = "modules/academic/projects/experiment-atlas/";
  const maps = Object.freeze([
    Object.freeze({
      id: "neutrino",
      title: "Neutrino experiments",
      description: "Explore neutrino experiments worldwide by region, science category, and detection technique.",
      href: base + "neutrino/",
      thumbnail: base + "neutrino/assets/preview.svg"
    }),
    Object.freeze({
      id: "dark-matter",
      title: "Dark matter experiments",
      description: "Discover dark matter searches worldwide, from direct detection to indirect searches and colliders.",
      href: base + "dark-matter/",
      thumbnail: base + "dark-matter/assets/preview.svg"
    })
  ]);

  api.getExperimentMaps = function () {
    const metadata = api.getData("experiment-atlas:catalogs") || {};
    return Object.freeze(maps.map(map => {
      const catalog = metadata[map.id] || {};
      const recordCount = Number.isSafeInteger(catalog.recordCount) && catalog.recordCount >= 0 ? catalog.recordCount : null;
      const updated = typeof catalog.updated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(catalog.updated) &&
        Number.isFinite(Date.parse(catalog.updated + "T00:00:00Z")) ? catalog.updated : null;
      return Object.freeze({...map, recordCount, updated});
    }));
  };
})();
