/* Physics Maps入口只使用本项目公开地图摘要，沿用父目录的视觉卡片。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.createPhysicsMapsEntry = function ({maps = api.getExperimentMaps} = {}) {
    let activeCleanup = null;
    return {
      render({host, signal, navigate} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A maps entry host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const document = host.ownerDocument;
        const records = typeof maps === "function" ? maps() : maps;
        if (!Array.isArray(records) || !records.length) throw new Error("Maps are unavailable.");
        const preview = document.createElement("div");
        preview.className = "physics-maps-entry__preview";
        for (const map of records.slice(0, 2)) {
          if (!/^modules\/academic\/projects\/experiment-atlas\/[a-z0-9-]+\/assets\/preview\.svg$/.test(map.thumbnail || "")) continue;
          const figure = document.createElement("figure");
          figure.className = "physics-maps-entry__map";
          const image = document.createElement("img");
          image.src = map.thumbnail;
          image.alt = "World map preview for " + map.title.toLowerCase();
          image.loading = "lazy";
          image.decoding = "async";
          const caption = document.createElement("figcaption");
          caption.textContent = map.title;
          figure.append(image, caption);
          preview.append(figure);
        }
        const statistics = [records.length + (records.length === 1 ? " map" : " maps")];
        if (records.every(map => Number.isSafeInteger(map.recordCount) && map.recordCount >= 0)) {
          const total = records.reduce((sum, map) => sum + map.recordCount, 0);
          if (Number.isSafeInteger(total)) statistics.push(total.toLocaleString("en") + (total === 1 ? " experiment" : " experiments"));
        }
        const card = api.createAcademicProjectEntry({
          document, id: "physics-maps", title: "Physics Maps",
          description: "Explore experiments around the world through maps of neutrino and dark matter research.",
          href: "#academic/projects/physics-maps", preview, statistics, action: "Explore the maps", signal,
          onOpen: typeof navigate === "function" ? () => navigate("physics-maps") : undefined
        });
        host.replaceChildren(card);
        let disposed = false;
        const dispose = () => {
          if (disposed) return;
          disposed = true;
          signal?.removeEventListener("abort", dispose);
          if (card.parentNode === host) card.remove();
          if (activeCleanup === dispose) activeCleanup = null;
        };
        activeCleanup = dispose;
        signal?.addEventListener("abort", dispose, {once: true});
        return dispose;
      }
    };
  };
})();
