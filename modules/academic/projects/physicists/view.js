/* 项目占位只处理所属宿主；具体内容留待站主后续提供。 */
(function () {
  "use strict";
  const api = window.Homepage;

  api.createPhysicistsView = function () {
    let activeCleanup = null;
    return {
      render({host, signal} = {}) {
        if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A physicists project host is required.");
        activeCleanup?.();
        if (signal?.aborted) return;
        const document = host.ownerDocument;
        const root = document.createElement("section");
        root.className = "physicists-project";
        root.setAttribute("data-physicists-project", "");
        root.setAttribute("aria-label", "Physicists project");
        const heading = document.createElement("h3");
        heading.className = "physicists-project__heading";
        heading.textContent = "Physicists";
        heading.tabIndex = -1;
        heading.setAttribute("data-view-heading", "");
        const panel = document.createElement("div");
        panel.className = "physicists-project__panel";
        const status = document.createElement("p");
        status.className = "physicists-project__status";
        status.textContent = "In preparation";
        const description = document.createElement("p");
        description.className = "physicists-project__description";
        description.textContent = "Project details will be added here.";
        panel.append(status, description);
        root.append(heading, panel);
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
