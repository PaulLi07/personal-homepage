/* 分类视图只操作传入容器，导航、焦点和关闭沿用共用详情生命周期。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const formatter = new Intl.DateTimeFormat("en", {year: "numeric", month: "long", day: "numeric", timeZone: "UTC"});
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function state(title, message) {
    const panel = node("div", "publication-library__state");
    panel.append(node("h4", "", title), node("p", "", message));
    return panel;
  }
  function external(entry, kind, text, url) {
    const link = node("a", "publication-library__link", text);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.publicationLink = kind;
    link.setAttribute("aria-label", "Open " + kind.toUpperCase() + " for " + entry.identifier);
    return link;
  }
  api.createPublicationsView = function ({categories = api.getPublicationCategories, onNavigate} = {}) {
    let active = null;
    return {
      render({host, route = null, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A publications host is required.");
        active?.abort();
        if (signal?.aborted) return;
        const controller = new AbortController();
        active = controller;
        const dispose = () => {
          controller.abort();
          signal?.removeEventListener("abort", dispose);
          if (active === controller) active = null;
        };
        controller.signal.addEventListener("abort", () => {
          signal?.removeEventListener("abort", dispose);
          if (active === controller) active = null;
        }, {once: true});
        signal?.addEventListener("abort", dispose, {once: true});
        const navigate = category => { if (typeof onNavigate === "function") onNavigate(category); };
        const section = node("section", "publication-library");
        section.setAttribute("aria-label", "Publication library");
        let items;
        try { items = typeof categories === "function" ? categories() : categories; }
        catch (_) { items = null; }
        const selected = Array.isArray(items) ? items.find(item => item.id === route) : null;
        const isDirectory = route === null || route === "";
        const header = node("header", "publication-library__header");
        const title = node("h3", "", selected ? selected.label : "Publication library");
        title.tabIndex = -1;
        title.setAttribute("data-view-heading", "");
        header.append(node("p", "publication-library__eyebrow", isDirectory ? "Publications · Collections" : "Publications · Category"), title);
        if (!isDirectory) {
          const back = node("button", "publication-library__back", "← All categories");
          back.type = "button";
          back.setAttribute("data-publication-back", "");
          back.addEventListener("click", () => navigate(null), {signal: controller.signal});
          header.append(back);
        }
        section.append(header);
        if (!Array.isArray(items)) {
          section.dataset.publicationView = "unavailable";
          section.append(state("Publications unavailable", "Please return to the page and try again later."));
        } else if (isDirectory) {
          section.dataset.publicationView = "directory";
          section.append(node("p", "publication-library__intro", "Browse internal notes, preprints, and journal publications."));
          const directory = node("div", "publication-library__directory");
          items.forEach((category, index) => {
            const card = node("button", "publication-library__category");
            card.type = "button";
            card.dataset.publicationCategory = category.id;
            card.setAttribute("aria-label", "Browse " + category.label);
            card.append(node("span", "publication-library__number", String(index + 1).padStart(2, "0")));
            const copy = node("span", "publication-library__category-copy");
            copy.append(node("span", "publication-library__category-label", category.label),
              node("span", "publication-library__category-description", category.description),
              node("span", "publication-library__count", category.entries.length ? category.entries.length + (category.entries.length === 1 ? " record" : " records") : "No entries yet"));
            const arrow = node("span", "publication-library__arrow", "→");
            arrow.setAttribute("aria-hidden", "true");
            card.append(copy, arrow);
            card.addEventListener("click", () => navigate(category.id), {signal: controller.signal});
            directory.append(card);
          });
          section.append(directory);
        } else if (!selected) {
          section.dataset.publicationView = "not-found";
          section.append(state("Category not found", "Return to the publication library to choose a category."));
        } else {
          section.dataset.publicationView = "category";
          section.dataset.publicationCategory = selected.id;
          section.append(node("p", "publication-library__intro", selected.description));
          if (!selected.entries.length) section.append(state(selected.emptyTitle, selected.emptyMessage));
          else {
            const list = node("div", "publication-library__list");
            [...selected.entries].sort((left, right) => right.date.localeCompare(left.date)).forEach(entry => {
              const article = node("article", "publication-library__entry");
              article.dataset.publicationId = entry.id;
              const title = node("h4", "publication-library__title", entry.title);
              if (entry.titleTex) api.math?.renderText(title, entry.titleTex, {fallback: entry.title});
              article.append(title, node("p", "publication-library__authors", entry.authors));
              const metadata = node("p", "publication-library__metadata");
              const date = node("time", "", formatter.format(new Date(entry.date + "T00:00:00Z")));
              date.dateTime = entry.date;
              metadata.append(node("span", "", entry.identifier), date);
              const links = node("div", "publication-library__links");
              links.append(external(entry, "abstract", "Abstract ↗", entry.abstractUrl));
              if (entry.pdfUrl) links.append(external(entry, "pdf", "PDF ↗", entry.pdfUrl));
              article.append(metadata, links);
              list.append(article);
            });
            section.append(list);
          }
        }
        host.replaceChildren(section);
        return dispose;
      }
    };
  };
})();
