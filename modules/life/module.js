/* Life入口只注册分区与挂接照片堆；内容、输入和清理各由所属模块负责。 */
(function () {
  "use strict";
  const mounted = new WeakMap();
  window.Homepage.registerSection({
    id: "life",
    detailGroup: { id: "life", label: "Life sections", descriptionTitle: "The story", aliases: { places: "travels", notes: "creations", outside: "relationship" } },
    init({ root, details, reducedMotion }) {
      mounted.get(root)?.();
      const stack = root.querySelector("[data-life-stack]");
      if (!stack || !window.Homepage.lifeStack?.mount) return;
      const handle = window.Homepage.lifeStack.mount({ root: stack, details, reducedMotion });
      let destroyed = false;
      const onPageHide = event => { if (!event.persisted) destroy(); };
      function destroy() {
        if (destroyed) return;
        destroyed = true;
        handle.destroy();
        window.removeEventListener("pagehide", onPageHide);
        if (mounted.get(root) === destroy) mounted.delete(root);
      }
      window.addEventListener("pagehide", onPageHide);
      mounted.set(root, destroy);
      return destroy;
    }
  });
})();
