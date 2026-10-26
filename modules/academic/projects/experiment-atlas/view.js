/* Physics Maps项目只渲染自己的地图目录，地图保留普通链接与独立页面。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const dateFormatter = new Intl.DateTimeFormat("en", {year: "numeric", month: "short", day: "numeric", timeZone: "UTC"});
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function mapCard(map, index) {
    const link = node("a", "experiment-atlas__card");
    link.href = map.href;
    link.dataset.experimentMap = map.id;
    link.setAttribute("aria-label", "Open " + map.title);
    const preview = node("div", "experiment-atlas__preview");
    const image = node("img", "experiment-atlas__map");
    image.src = map.thumbnail;
    image.alt = "World map preview for " + map.title.toLowerCase();
    image.loading = "lazy";
    image.decoding = "async";
    const number = node("span", "experiment-atlas__number", String(index + 1).padStart(2, "0"));
    number.setAttribute("aria-hidden", "true");
    preview.append(image, number);
    const copy = node("div", "experiment-atlas__copy");
    copy.append(node("h4", "experiment-atlas__title", map.title), node("p", "experiment-atlas__description", map.description));
    const metadata = node("p", "experiment-atlas__metadata");
    if (Number.isSafeInteger(map.recordCount) && map.recordCount >= 0) {
      metadata.append(node("span", "experiment-atlas__count", map.recordCount.toLocaleString("en") + (map.recordCount === 1 ? " experiment" : " experiments")));
    }
    if (map.updated) {
      const date = new Date(map.updated + "T00:00:00Z");
      if (Number.isFinite(date.getTime())) {
        const time = node("time", "", "Updated " + dateFormatter.format(date));
        time.dateTime = map.updated;
        metadata.append(time);
      }
    }
    if (metadata.childNodes.length) copy.append(metadata);
    const action = node("span", "experiment-atlas__action", "Open map");
    const arrow = node("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    action.append(arrow);
    copy.append(action);
    link.append(preview, copy);
    return link;
  }

  api.createExperimentAtlasView = function ({maps = api.getExperimentMaps} = {}) {
    let activeCleanup = null;
    return {
      render({host, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A projects host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const root = node("div", "experiment-atlas__project");
        const atlas = node("section", "experiment-atlas");
        atlas.setAttribute("aria-label", "Physics Maps");
        const header = node("header", "experiment-atlas__heading");
        const heading = node("h3", "", "Physics Maps");
        heading.tabIndex = -1;
        heading.setAttribute("data-view-heading", "");
        header.append(node("p", "experiment-atlas__eyebrow", "Interactive research maps"), heading);
        atlas.append(header, node("p", "experiment-atlas__intro", "A growing collection of interactive maps for exploring experiments, techniques, and the questions they investigate."));
        let records;
        try { records = typeof maps === "function" ? maps() : maps; }
        catch (_) { records = null; }
        if (Array.isArray(records) && records.length) {
          const grid = node("div", "experiment-atlas__grid");
          records.forEach((map, index) => grid.append(mapCard(map, index)));
          atlas.append(grid);
        } else atlas.append(node("p", "experiment-atlas__empty", "Maps are temporarily unavailable. Please return to this page later."));
        root.append(atlas);
        host.replaceChildren(root);
        let disposed = false;
        const dispose = () => {
          if (disposed) return;
          disposed = true;
          signal?.removeEventListener("abort", dispose);
          if (root.parentNode === host) root.remove();
          if (activeCleanup === dispose) activeCleanup = null;
        };
        activeCleanup = dispose;
        signal?.addEventListener("abort", dispose, {once: true});
        return dispose;
      }
    };
  };
})();
