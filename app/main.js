/* 胶水层仅装配入口、传递共享服务并启动，不承载模块的业务行为。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const modules = api.getSections();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transitions = api.createTransitions(reducedMotion);
  const groups = Object.fromEntries(modules.filter(module => module.detailGroup)
    .map(module => [module.detailGroup.id, module.detailGroup]));
  const details = api.createDetails({
    dialog: document.getElementById("detail-dialog"),
    content: api.getContent(), views: api.getDetailViews(), groups, transitions
  });
  transitions.start();
  modules.forEach(module => {
    const root = document.getElementById(module.id);
    if (root && module.init) {
      try { module.init({ root, details, reducedMotion }); }
      catch (error) { console.error("Unable to initialize section: " + module.id, error); }
    }
  });
  const roots = modules.map(module => document.getElementById(module.id)).filter(Boolean);
  api.createNavigation({
    root: document.querySelector(".navbar"),
    sections: roots
  });
  api.initReveals(roots);
  details.start();
})();
