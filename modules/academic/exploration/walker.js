/* 装饰人物独立处理步态、暂停与清理；不读取详情弹窗或其他模块的内部结构。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;
  const namespace = "http://www.w3.org/2000/svg";
  const mounted = new WeakMap();

  function element(name, attributes, children = []) {
    const node = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    children.forEach(child => node.appendChild(child));
    return node;
  }

  function limb(className, path) {
    return element("g", { class: className }, [element("path", { d: path })]);
  }

  function createFigure() {
    return element("svg", {
      class: "academic-walker-art", viewBox: "0 0 32 42", "aria-hidden": "true", focusable: "false",
      fill: "none", stroke: "currentColor", "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round"
    }, [element("g", { class: "academic-walker-body" }, [
      limb("academic-walker-arm academic-walker-arm--back", "M17 14 L15 20 L13 24"),
      limb("academic-walker-leg academic-walker-leg--back", "M16 23 L15 31 L17 40 L20 40"),
      element("circle", { cx: "17.5", cy: "6", r: "3.2" }),
      element("path", { d: "M17 11.5 L16 23" }),
      limb("academic-walker-arm academic-walker-arm--front", "M17 14 L20 20 L22 23"),
      limb("academic-walker-leg academic-walker-leg--front", "M16 23 L18 31 L17 40 L20 40")
    ])]);
  }

  function duration(value, fallback, minimum, maximum) {
    return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  }

  api.mountWalker = function ({ root, config = {}, reducedMotion } = {}) {
    const walker = root?.querySelector("[data-scene-walker]");
    if (!walker) return { destroy() {} };
    mounted.get(walker)?.destroy();

    const figure = createFigure();
    const fallback = walker.querySelector("[data-walker-fallback]");
    const fallbackHidden = fallback?.hidden;
    if (fallback) fallback.hidden = true;
    walker.appendChild(figure);
    walker.style.setProperty("--academic-walk-duration", duration(config.walkDurationMs, 16000, 4000, 120000) + "ms");
    walker.style.setProperty("--academic-step-duration", duration(config.stepDurationMs, 850, 300, 4000) + "ms");

    const media = reducedMotion && typeof reducedMotion === "object"
      ? reducedMotion : window.matchMedia("(prefers-reduced-motion: reduce)");
    let intersecting = typeof window.IntersectionObserver !== "function";
    let destroyed = false;
    function updatePause() {
      if (destroyed) return;
      const reduced = reducedMotion === true || media.matches;
      const detailOpen = /^#[a-z]+\/[a-z]/.test(window.location.hash);
      walker.dataset.walkReduced = String(reduced);
      walker.dataset.walkPaused = String(reduced || !intersecting || document.hidden || detailOpen);
    }
    // 原生弹窗的焦点/关闭事件只作为刷新信号；关闭后等待其拥有者先恢复路由。
    const schedulePause = () => queueMicrotask(updatePause);
    const observer = typeof window.IntersectionObserver === "function"
      ? new window.IntersectionObserver(entries => {
        intersecting = entries.some(entry => entry.isIntersecting);
        updatePause();
      }, { threshold: 0 }) : null;
    observer?.observe(root);
    document.addEventListener("visibilitychange", updatePause);
    document.addEventListener("focusin", schedulePause);
    document.addEventListener("close", schedulePause, true);
    window.addEventListener("hashchange", updatePause);
    window.addEventListener("popstate", updatePause);
    if (media.addEventListener) media.addEventListener("change", updatePause);
    else media.addListener?.(updatePause);
    updatePause();

    const instance = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        observer?.disconnect();
        document.removeEventListener("visibilitychange", updatePause);
        document.removeEventListener("focusin", schedulePause);
        document.removeEventListener("close", schedulePause, true);
        window.removeEventListener("hashchange", updatePause);
        window.removeEventListener("popstate", updatePause);
        if (media.removeEventListener) media.removeEventListener("change", updatePause);
        else media.removeListener?.(updatePause);
        figure.remove();
        if (fallback) fallback.hidden = fallbackHidden;
        delete walker.dataset.walkPaused;
        delete walker.dataset.walkReduced;
        walker.style.removeProperty("--academic-walk-duration");
        walker.style.removeProperty("--academic-step-duration");
        mounted.delete(walker);
      }
    };
    mounted.set(walker, instance);
    return instance;
  };
})();
