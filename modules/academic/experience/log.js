/* 学术日志只渲染自己的容器，路由与作者功能通过明确回调连接。 */
"use strict";
window.Homepage.createAcademicLogView = function ({ entries, onNavigate, onAuthorRequested } = {}) {
  const api = window.Homepage;
  const formatter = new Intl.DateTimeFormat("en", {year: "numeric", month: "long", day: "numeric", timeZone: "UTC"});
  let activeRender = null;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, className, action, signal) => {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", action, {signal});
    return node;
  };
  function records() {
    try {
      const source = typeof entries === "function" ? entries() : entries;
      return api.normalizeAcademicLogs(source === undefined ? [] : source)
        .sort((left, right) => right.date.localeCompare(left.date));
    } catch { return null; }
  }
  function meta(entry) {
    const line = element("p", "academic-log__meta");
    const date = element("time", "", formatter.format(new Date(entry.date + "T00:00:00Z")));
    date.dateTime = entry.date;
    line.append(date, element("span", "academic-log__kind", entry.kind), element("span", "", "By " + entry.author));
    return line;
  }
  function reference(entry) {
    const link = element("a", "academic-log__reference", "Reference ↗");
    link.href = entry.reference;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Open reference for " + entry.title);
    return link;
  }
  function state(title, message) {
    const panel = element("div", "academic-log__state");
    panel.append(element("h4", "", title), element("p", "", message));
    return panel;
  }

  return {
    render({host, route = null, signal} = {}) {
      if (!host || typeof host.replaceChildren !== "function") throw new TypeError("An academic log host is required.");
      if (activeRender) activeRender.abort();
      if (signal && signal.aborted) return;
      const controller = new AbortController();
      activeRender = controller;
      if (signal) {
        const abort = () => controller.abort();
        signal.addEventListener("abort", abort, {once: true});
        controller.signal.addEventListener("abort", () => signal.removeEventListener("abort", abort), {once: true});
      }
      const navigate = slug => { if (typeof onNavigate === "function") onNavigate(slug); };
      const section = element("section", "academic-log");
      section.setAttribute("aria-label", "Academic log");
      const header = element("header", "academic-log__header");
      const heading = element("div", "");
      const title = element("h3", "", "Academic log");
      title.tabIndex = -1;
      heading.append(element("p", "academic-log__eyebrow", "Experience · Working notes"), title);
      header.append(heading);
      if (typeof onAuthorRequested === "function") {
        const author = button("Author sign in", "academic-log__button academic-log__author", () => onAuthorRequested(), controller.signal);
        author.setAttribute("data-academic-author", "");
        header.append(author);
      }
      section.append(header);
      const items = records();
      if (items === null) {
        section.dataset.logView = "unavailable";
        section.append(state("Academic log unavailable", "Please return to the page and try again later."));
      } else if (route !== null && route !== "") {
        const entry = typeof route === "string" ? items.find(item => item.id === route) : null;
        section.dataset.logView = entry ? "article" : "not-found";
        section.append(button("← All entries", "academic-log__back", () => navigate(null), controller.signal));
        if (!entry) section.append(state("Entry not found", "This entry may have moved or has not been published."));
        else {
          const article = element("article", "academic-log__article");
          const entryTitle = element("h4", "academic-log__title", entry.title);
          entryTitle.tabIndex = -1;
          entryTitle.setAttribute("data-view-heading", "");
          article.append(entryTitle, meta(entry));
          const body = element("div", "academic-log__body", entry.body.replace(/\r\n?/g, "\n"));
          article.append(body);
          if (entry.reference) article.append(reference(entry));
          section.append(article);
        }
      } else {
        section.dataset.logView = "list";
        if (!items.length) section.append(state("No entries yet", "Research updates, learning notes, and milestones will appear here."));
        else {
          const list = element("div", "academic-log__list");
          items.forEach(entry => {
            const card = element("article", "academic-log__card");
            card.append(element("h4", "", entry.title), meta(entry), element("p", "academic-log__excerpt", entry.excerpt));
            const actions = element("div", "academic-log__actions");
            const read = button("Read entry →", "academic-log__button", () => navigate(entry.id), controller.signal);
            read.setAttribute("aria-label", "Read " + entry.title);
            actions.append(read);
            if (entry.reference) actions.append(reference(entry));
            card.append(actions);
            list.append(card);
          });
          section.append(list);
        }
      }
      if (!section.querySelector("[data-view-heading]")) title.setAttribute("data-view-heading", "");
      host.replaceChildren(section);
    }
  };
};
