/* 轻量项目入口只读取所属摘要；完整档案在独立页面中打开。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.createPhysicistsView = function ({archive = () => api.getData("physicists:archive")} = {}) {
    let activeCleanup = null;
    return {
      render({host, signal, entryOnly = false} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A physicists project host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const document = host.ownerDocument;
        const node = (tag, className, text) => {
          const element = document.createElement(tag);
          if (className) element.className = className;
          if (text !== undefined) element.textContent = text;
          return element;
        };
        const root = node("section", "physicists-project");
        root.setAttribute("data-physicists-project", "");
        root.setAttribute("aria-label", "Physicists project");
        const heading = node("h3", "physicists-project__heading", "Physicists");
        heading.tabIndex = -1;
        heading.setAttribute("data-view-heading", "");
        if (!entryOnly) root.append(node("p", "physicists-project__eyebrow", "Physics · History · People"), heading,
          node("p", "physicists-project__intro", "An interactive archive of the people and milestones that have shaped physics."));
        let data;
        try { data = typeof archive === "function" ? archive() : archive; } catch (_) { data = null; }
        if (data && Number.isSafeInteger(data.peopleCount) && data.peopleCount > 0 && Number.isSafeInteger(data.milestoneCount) && data.milestoneCount >= 0) {
          const portraits = node("div", "physicists-project__portraits");
          for (const portrait of (Array.isArray(data.portraits) ? data.portraits : []).slice(0, 3)) {
            if (!/^modules\/academic\/projects\/physicists\/archive\/portraits\/[a-z\d.-]+\.(?:jpe?g|png|webp|gif)$/.test(portrait.src || "")) continue;
            const figure = node("figure", "physicists-project__portrait");
            const image = node("img", "");
            image.src = portrait.src;
            image.alt = portrait.alt;
            image.loading = "lazy";
            image.decoding = "async";
            figure.append(image, node("figcaption", "", portrait.name));
            portraits.append(figure);
          }
          const link = api.createAcademicProjectEntry({
            document, id: "physicists", title: "Physicists",
            description: "Follow a timeline of contributions, explore research fields, and open detailed biographies with their sources.",
            href: "modules/academic/projects/physicists/archive/website/site/index.html",
            preview: portraits,
            statistics: [data.peopleCount.toLocaleString("en") + " physicists", data.milestoneCount.toLocaleString("en") + " milestones"],
            action: "Explore the archive", signal
          });
          link.setAttribute("data-physicists-open", "");
          root.append(link);
        } else root.append(node("p", "physicists-project__empty", "The archive is temporarily unavailable. Please return to this page later."));
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
