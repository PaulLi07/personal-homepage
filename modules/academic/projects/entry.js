/* 两个项目共用的视觉入口；资源与目的地仍由所属项目提供。 */
(function () {
  "use strict";
  window.Homepage.createAcademicProjectEntry = function ({document, id, title, description, href, preview, statistics = [], action = "Explore", onOpen, signal} = {}) {
    if (!document || typeof document.createElement !== "function" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || "")
      || typeof title !== "string" || !title.trim() || typeof description !== "string"
      || typeof href !== "string" || !/^(?:#[a-z0-9/-]+|modules\/[a-zA-Z0-9/_.-]+)$/.test(href)
      || href.split("/").includes("..") || !preview) throw new TypeError("A local project entry is required.");
    const node = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const card = node("a", "project-entry");
    card.href = href;
    card.dataset.academicProject = id;
    card.setAttribute("aria-label", "Open " + title);
    preview.classList ? preview.classList.add("project-entry__preview") : preview.className += " project-entry__preview";
    const copy = node("div", "project-entry__copy");
    copy.append(node("h4", "project-entry__title", title), node("p", "project-entry__description", description));
    if (Array.isArray(statistics) && statistics.length) {
      const facts = node("p", "project-entry__statistics");
      statistics.filter(value => typeof value === "string" && value.trim()).forEach(value => facts.append(node("span", "", value)));
      copy.append(facts);
    }
    const call = node("span", "project-entry__action", action);
    const arrow = node("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    call.append(arrow);
    copy.append(call);
    card.append(preview, copy);
    if (typeof onOpen === "function") card.addEventListener("click", event => {
      if (signal?.aborted || event.defaultPrevented || (event.button !== undefined && event.button !== 0)
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onOpen();
    }, {signal});
    return card;
  };
})();
