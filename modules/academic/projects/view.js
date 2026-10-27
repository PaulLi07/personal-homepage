/* 项目目录委托各项目呈现视觉入口，并管理导航与子视图生命周期。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function heading(title, eyebrow) {
    const header = node("header", "project-directory__section-heading");
    const label = node("h3", "", title);
    label.tabIndex = -1;
    label.setAttribute("data-view-heading", "");
    header.append(node("p", "project-directory__eyebrow", eyebrow), label);
    return header;
  }
  function state(title, message) {
    const section = node("section", "project-directory__state");
    section.append(heading(title, "Projects"), node("p", "project-directory__intro", message));
    return section;
  }
  function readableProjects(items) {
    if (!Array.isArray(items)) return false;
    const seen = new Set();
    return items.every(item => {
      if (!item || typeof item.id !== "string" || seen.has(item.id)
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)
        || typeof item.title !== "string" || !item.title.trim()
        || typeof item.description !== "string" || typeof item.summary !== "string") return false;
      seen.add(item.id);
      return true;
    });
  }
  function publicLink(url) {
    try {
      const parsed = new URL(url);
      return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch (_) { return false; }
  }
  function projectLinks(content) {
    if (!content?.link?.url || !publicLink(content.link.url)) return null;
    const footer = node("footer", "project-directory__links");
    const link = node("a", "project-directory__github", content.link.label);
    link.href = content.link.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    footer.append(link);
    return footer;
  }
  function basicCard(project, index, navigate, signal) {
    const card = node("button", "project-directory__card");
    card.type = "button";
    card.dataset.academicProject = project.id;
    card.setAttribute("aria-label", "Open " + project.title);
    const number = node("span", "project-directory__number", String(index + 1).padStart(2, "0"));
    number.setAttribute("aria-hidden", "true");
    const copy = node("span", "project-directory__copy");
    copy.append(node("span", "project-directory__title", project.title), node("span", "project-directory__description", project.description));
    if (project.summary) copy.append(node("span", "project-directory__summary", project.summary));
    const arrow = node("span", "project-directory__arrow", "→");
    arrow.setAttribute("aria-hidden", "true");
    card.append(number, copy, arrow);
    card.addEventListener("click", () => navigate(project.id), {signal});
    return card;
  }

  api.createProjectsView = function ({projects = api.getAcademicProjects, viewFor = api.getAcademicProjectView, content, onNavigate} = {}) {
    let activeCleanup = null;
    return {
      render({host, route = null, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A projects host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const controller = new AbortController();
        const root = node("div", "project-directory");
        let childCleanup = null;
        const entryRenders = [];
        let childController = null;
        let disposed = false;
        const dispose = () => {
          if (disposed) return;
          disposed = true;
          controller.abort();
          childController?.abort();
          entryRenders.forEach(entry => {
            entry.controller.abort();
            try { entry.cleanup?.(); } catch (_) { /* 单入口清理不阻断其余项目。 */ }
          });
          try { childCleanup?.(); }
          catch (_) { /* 子项目清理故障不阻断父目录恢复。 */ }
          finally {
            signal?.removeEventListener("abort", dispose);
            if (root.parentNode === host) root.remove();
            if (activeCleanup === dispose) activeCleanup = null;
          }
        };
        activeCleanup = dispose;
        signal?.addEventListener("abort", dispose, {once: true});
        const navigate = next => { if (!controller.signal.aborted && typeof onNavigate === "function") onNavigate(next); };
        let items;
        try { items = typeof projects === "function" ? projects() : projects; }
        catch (_) { items = null; }
        if (!readableProjects(items)) items = null;
        const directory = route === null || route === "";
        const selected = items?.find(item => item.id === route);
        if (!directory) {
          const back = node("button", "project-directory__back", "← All projects");
          back.type = "button";
          back.setAttribute("data-project-back", "");
          back.addEventListener("click", () => navigate(null), {signal: controller.signal});
          root.append(back);
          root.dataset.projectId = route;
        }
        if (!items) {
          root.dataset.projectView = "unavailable";
          root.append(state("Projects unavailable", "Please return to this page and try again later."));
        } else if (directory) {
          root.dataset.projectView = "directory";
          const section = node("section", "project-directory__projects");
          section.setAttribute("aria-label", "Academic projects");
          section.append(heading("Project directory", "Research & tools"),
            node("p", "project-directory__intro", "Explore each project and its resources."));
          const list = node("div", "project-directory__list");
          items.forEach((project, index) => {
            const entryHost = node("div", "project-directory__entry");
            entryHost.dataset.projectEntryHost = project.id;
            list.append(entryHost);
            const entry = {controller: new AbortController(), cleanup: null};
            entryRenders.push(entry);
            try {
              const view = typeof viewFor === "function" ? viewFor(project.id) : null;
              if (typeof view?.renderEntry === "function") {
                const cleanup = view.renderEntry({host: entryHost, signal: entry.controller.signal, navigate});
                if (typeof cleanup === "function") entry.cleanup = cleanup;
              } else entryHost.append(basicCard(project, index, navigate, entry.controller.signal));
            } catch (_) {
              entry.controller.abort();
              entryHost.replaceChildren(state(project.title, "This project is temporarily unavailable. Please try again later."));
            }
          });
          if (!items.length) section.append(state("No projects yet", "Projects will appear here when they are ready."));
          else section.append(list);
          let links;
          try { links = typeof content === "function" ? content() : content; }
          catch (_) { links = null; }
          root.append(section);
          const footer = projectLinks(links);
          if (footer) root.append(footer);
        } else if (!selected) {
          root.dataset.projectView = "not-found";
          root.append(state("Project not found", "Return to the project directory to choose an available project."));
        } else {
          root.dataset.projectView = "project";
          const child = node("div", "project-directory__project-host");
          root.append(child);
          host.replaceChildren(root);
          childController = new AbortController();
          try {
            const view = typeof viewFor === "function" ? viewFor(selected.id) : null;
            if (!view || typeof view.render !== "function") throw new Error("A project view is required.");
            const cleanup = view.render({host: child, signal: childController.signal});
            if (typeof cleanup === "function") childCleanup = cleanup;
          } catch (_) {
            childController.abort();
            root.dataset.projectView = "unavailable";
            child.replaceChildren(state("Project unavailable", "Return to the project directory and try again later."));
          }
          return dispose;
        }
        host.replaceChildren(root);
        return dispose;
      }
    };
  };
})();
