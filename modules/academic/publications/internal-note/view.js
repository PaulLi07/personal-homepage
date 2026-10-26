/* 内部材料只负责所属课题组与记录视图；历史、焦点和关闭由父详情管理。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const rootRoute = "internal-note";
  const prefix = rootRoute + "-";
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const countLabel = count => count + (count === 1 ? " note" : " notes");

  function state(title, message) {
    const panel = node("div", "internal-notes__state");
    panel.append(node("h4", "", title), node("p", "", message));
    return panel;
  }

  function mathText(host, source, fallback) {
    host.textContent = fallback;
    if (!source || typeof api.math?.renderText !== "function") return;
    try { api.math.renderText(host, source, {fallback}); }
    catch (_) { host.textContent = fallback; }
  }

  function safeLink(value) {
    if (typeof value !== "string" || value !== value.trim()) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }

  function readableGroups(source) {
    if (!Array.isArray(source)) return false;
    return source.every(group => group && typeof group.id === "string" && typeof group.label === "string"
      && typeof group.description === "string" && Array.isArray(group.entries)
      && group.entries.every(entry => entry && typeof entry.id === "string" && typeof entry.identifier === "string"
        && typeof entry.title === "string" && typeof entry.authors === "string" && safeLink(entry.url)
        && Array.isArray(entry.summary) && entry.summary.every(part => part && typeof part.text === "string")));
  }

  function noteCard(entry, group) {
    const article = node("article", "internal-notes__entry");
    article.dataset.internalNoteId = entry.id;
    const title = node("h4", "internal-notes__title");
    mathText(title, entry.titleTex, entry.title);
    article.append(node("p", "internal-notes__identifier", entry.identifier), title,
      node("p", "internal-notes__authors", entry.authors));
    const summary = node("div", "internal-notes__summary");
    entry.summary.forEach(part => {
      const paragraph = node("p", "internal-notes__summary-paragraph");
      mathText(paragraph, part.tex, part.text);
      summary.append(paragraph);
    });
    article.append(summary);
    const footer = node("div", "internal-notes__entry-footer");
    const link = node("a", "internal-notes__link", "Open internal note ↗");
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("data-internal-note-link", "");
    link.setAttribute("aria-label", "Open internal note " + entry.identifier);
    footer.append(link, node("span", "internal-notes__access", group.label + " access required."));
    article.append(footer);
    return article;
  }

  api.createInternalNotesView = function ({groups = api.getInternalNoteGroups, onNavigate} = {}) {
    let activeCleanup = null;
    return {
      render({host, route = rootRoute, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("An internal notes host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const controller = new AbortController();
        let disposed = false;
        const section = node("section", "publication-library internal-notes__library");
        section.setAttribute("aria-label", "Internal notes");
        section.dataset.publicationView = "category";
        section.dataset.publicationCategory = rootRoute;
        const dispose = () => {
          if (disposed) return;
          disposed = true;
          controller.abort();
          signal?.removeEventListener("abort", dispose);
          if (section.parentNode === host) section.remove();
          if (activeCleanup === dispose) activeCleanup = null;
        };
        activeCleanup = dispose;
        signal?.addEventListener("abort", dispose, {once: true});
        const navigate = next => { if (typeof onNavigate === "function") onNavigate(next); };
        let items;
        try { items = typeof groups === "function" ? groups() : groups; }
        catch (_) { items = null; }
        if (!readableGroups(items)) items = null;
        const directory = route === rootRoute;
        const groupId = typeof route === "string" && route.startsWith(prefix) ? route.slice(prefix.length) : null;
        const selected = items?.find(group => group.id === groupId);
        const header = node("header", "internal-notes__header");
        const title = node("h3", "internal-notes__heading", selected ? selected.label + " internal notes" : "Internal note");
        title.tabIndex = -1;
        title.setAttribute("data-view-heading", "");
        header.append(node("p", "internal-notes__eyebrow", directory ? "Publications · Research groups" : "Publications · Internal note"), title);
        const navigation = node("div", "internal-notes__navigation");
        const categoriesBack = node("button", "internal-notes__back", "← All categories");
        categoriesBack.type = "button";
        categoriesBack.dataset.internalNoteBack = "categories";
        categoriesBack.setAttribute("data-publication-back", "");
        categoriesBack.addEventListener("click", () => navigate(null), {signal: controller.signal});
        if (!directory) {
          const groupsBack = node("button", "internal-notes__back", "← Research groups");
          groupsBack.type = "button";
          groupsBack.dataset.internalNoteBack = "groups";
          groupsBack.addEventListener("click", () => navigate(rootRoute), {signal: controller.signal});
          navigation.append(groupsBack);
        }
        navigation.append(categoriesBack);
        header.append(navigation);
        section.append(header);
        if (!items) {
          section.dataset.internalNoteView = "unavailable";
          section.append(state("Internal notes unavailable", "Please return to the publication library and try again later."));
        } else if (directory) {
          section.dataset.internalNoteView = "groups";
          section.append(node("p", "internal-notes__intro", "Choose a research group to browse its internal notes."));
          const total = items.reduce((sum, group) => sum + group.entries.length, 0);
          section.append(node("p", "internal-notes__total", items.length + (items.length === 1 ? " research group · " : " research groups · ") + countLabel(total)));
          if (!items.length) section.append(state("No research groups yet", "Research groups will appear here when notes are available."));
          else {
            const list = node("div", "internal-notes__groups");
            items.forEach((group, index) => {
              const card = node("button", "internal-notes__group");
              card.type = "button";
              card.dataset.internalNoteGroup = group.id;
              card.setAttribute("aria-label", "Browse " + group.label + " internal notes");
              const copy = node("span", "internal-notes__group-copy");
              copy.append(node("span", "internal-notes__group-label", group.label),
                node("span", "internal-notes__group-description", group.description),
                node("span", "internal-notes__count", countLabel(group.entries.length)));
              const arrow = node("span", "internal-notes__arrow", "→");
              arrow.setAttribute("aria-hidden", "true");
              card.append(node("span", "internal-notes__number", String(index + 1).padStart(2, "0")), copy, arrow);
              card.addEventListener("click", () => navigate(prefix + group.id), {signal: controller.signal});
              list.append(card);
            });
            section.append(list);
          }
        } else if (!selected) {
          section.dataset.internalNoteView = "not-found";
          section.append(state("Research group not found", "Return to the research groups to choose an available collection."));
        } else {
          section.dataset.internalNoteView = "group";
          section.dataset.internalNoteGroup = selected.id;
          section.append(node("p", "internal-notes__intro", selected.description),
            node("p", "internal-notes__total", countLabel(selected.entries.length)));
          if (!selected.entries.length) section.append(state("No internal notes yet", "Internal notes for this group will appear here when available."));
          else {
            const list = node("div", "internal-notes__list");
            selected.entries.forEach(entry => list.append(noteCard(entry, selected)));
            section.append(list);
          }
        }
        host.replaceChildren(section);
        return dispose;
      }
    };
  };
})();
