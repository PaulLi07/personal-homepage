/* Projects 目录只渲染传入host；地图使用普通链接进入独立页面。 */
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

  function collaborations(content) {
    const section = node("section", "project-directory__collaborations");
    section.setAttribute("aria-label", "Research collaborations");
    const header = node("header", "project-directory__section-heading");
    header.append(node("p", "project-directory__eyebrow", "Research network"), node("h3", "", "Research collaborations"));
    section.append(header);
    const entries = Array.isArray(content?.entries) ? content.entries : [];
    if (!entries.length) section.append(node("p", "project-directory__intro", content?.emptyMessage || "Collaboration information will be added here."));
    entries.forEach(entry => {
      const article = node("article", "project-directory__collaboration");
      const title = node("h4", "");
      if (entry.url) {
        const link = node("a", "project-directory__external", entry.title + " ↗");
        link.href = entry.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        title.append(link);
      } else title.textContent = entry.title;
      article.append(title);
      if (entry.meta) article.append(node("p", "project-directory__collaboration-meta", entry.meta));
      if (entry.description) article.append(node("p", "project-directory__intro", entry.description));
      section.append(article);
    });
    if (content?.link?.url) {
      const link = node("a", "project-directory__github", content.link.label);
      link.href = content.link.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      section.append(link);
    }
    return section;
  }

  api.createProjectsView = function ({maps = api.getExperimentMaps, content} = {}) {
    let activeCleanup = null;
    return {
      render({host, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A projects host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const root = node("div", "project-directory");
        const atlas = node("section", "experiment-atlas");
        atlas.setAttribute("aria-label", "Experiment Atlas");
        const header = node("header", "project-directory__section-heading");
        const heading = node("h3", "", "Experiment Atlas");
        heading.tabIndex = -1;
        heading.setAttribute("data-view-heading", "");
        header.append(node("p", "project-directory__eyebrow", "Interactive research maps"), heading);
        atlas.append(header, node("p", "project-directory__intro", "A growing collection of interactive maps for exploring experiments, techniques, and the questions they investigate."));
        let records;
        try { records = typeof maps === "function" ? maps() : maps; }
        catch (_) { records = null; }
        if (Array.isArray(records) && records.length) {
          const grid = node("div", "experiment-atlas__grid");
          records.forEach((map, index) => grid.append(mapCard(map, index)));
          atlas.append(grid);
        } else atlas.append(node("p", "project-directory__empty", "Maps are temporarily unavailable. Please return to this page later."));
        let projects;
        try { projects = typeof content === "function" ? content() : content; }
        catch (_) { projects = null; }
        root.append(atlas, collaborations(projects));
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
