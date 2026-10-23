/* 人物生命周期胶水：连接独立骨架与动作导演，暂停不推进动作时钟。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;
  const mounted = new WeakMap();
  const finite = (value, fallback, minimum, maximum) => Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value)) : fallback;

  api.mountWalker = function ({ root, config = {}, reducedMotion } = {}) {
    const walker = root?.querySelector("[data-scene-walker]");
    const path = root?.querySelector("[data-scene-walkway]");
    if (!walker || !path) return { destroy() {} };
    mounted.get(walker)?.destroy();
    const settings = config.walker || {};
    const height = finite(settings.heightPx, 60, 32, 72);
    const width = height * 40 / 46;
    const previousStyles = new Map();
    function setStyle(node, property, value) {
      previousStyles.set(property, [node, node.style.getPropertyValue(property)]);
      node.style.setProperty(property, value);
    }
    setStyle(walker, "--academic-character-height", height + "px");
    setStyle(walker, "--academic-character-width", width + "px");
    setStyle(path, "min-height", (height + 6) + "px");
    setStyle(walker, "left", "0px");
    const pathWidth = () => Math.max(0, path.clientWidth - width);
    const director = api.character.createDirector({ width: pathWidth(), config: settings });
    const figure = api.character.createFigure();
    const fallback = walker.querySelector("[data-walker-fallback]");
    const fallbackHidden = fallback?.hidden;
    if (fallback) fallback.hidden = true;
    walker.appendChild(figure.element);
    const media = reducedMotion && typeof reducedMotion === "object"
      ? reducedMotion : window.matchMedia("(prefers-reduced-motion: reduce)");
    const listeners = [];
    let intersecting = false;
    let paused = true;
    let pageSuspended = false;
    let destroyed = false;
    let frameId = null;
    let lastTimestamp = null;

    function listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      listeners.push(() => target.removeEventListener(event, handler, options));
    }
    function render() {
      const frame = director.getFrame();
      const left = frame.x + "px";
      // 静态片段不重复写布局样式，避免唤醒外围的样式观察器。
      if (walker.style.getPropertyValue("left") !== left) walker.style.setProperty("left", left);
      if (walker.dataset.walkAction !== frame.action) walker.dataset.walkAction = frame.action;
      walker.dataset.walkProgress = frame.progress.toFixed(4);
      figure.render(frame);
    }
    function stopClock() {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
      lastTimestamp = null;
    }
    function tick(timestamp) {
      frameId = null;
      if (destroyed || paused) return;
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      // 每秒最多绘制30次；大卡顿不让人物跳过整段动作。
      if (elapsed >= 1000 / 30) {
        director.advance(Math.min(elapsed, 80));
        render();
        lastTimestamp = timestamp;
      }
      frameId = window.requestAnimationFrame(tick);
    }
    function updatePause() {
      if (destroyed) return;
      const reduced = reducedMotion === true || Boolean(media.matches);
      const detailOpen = /^#[a-z]+\/[a-z]/.test(window.location.hash);
      const next = pageSuspended || reduced || !intersecting || document.hidden || detailOpen;
      walker.dataset.walkReduced = String(reduced);
      walker.dataset.walkPaused = String(next);
      if (next) stopClock();
      else if (paused || frameId === null) {
        lastTimestamp = null;
        frameId = window.requestAnimationFrame(tick);
      }
      paused = next;
    }
    const schedulePause = () => window.queueMicrotask(updatePause);
    function measureVisibility() {
      const box = root.getBoundingClientRect();
      intersecting = box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0
        && box.top < window.innerHeight && box.left < window.innerWidth;
      updatePause();
    }
    function resize() {
      if (destroyed) return;
      director.resize(pathWidth());
      render();
    }
    const observer = typeof window.IntersectionObserver === "function"
      ? new window.IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === root);
        if (entry) intersecting = entry.isIntersecting;
        updatePause();
      }, { threshold: 0 }) : null;
    observer?.observe(root);
    if (!observer) {
      listen(window, "scroll", measureVisibility, { passive: true });
      listen(window, "resize", measureVisibility);
      measureVisibility();
    }
    const resizeObserver = typeof window.ResizeObserver === "function"
      ? new window.ResizeObserver(resize) : null;
    resizeObserver?.observe(path);
    if (!resizeObserver) listen(window, "resize", resize);
    listen(document, "visibilitychange", updatePause);
    listen(document, "focusin", schedulePause);
    listen(document, "close", schedulePause, true);
    listen(window, "hashchange", updatePause);
    listen(window, "popstate", updatePause);
    // 往返缓存恢复不补算离开期间的时间。
    listen(window, "pagehide", () => { pageSuspended = true; updatePause(); });
    listen(window, "pageshow", () => { pageSuspended = false; lastTimestamp = null; updatePause(); });
    if (media.addEventListener) listen(media, "change", updatePause);
    else if (media.addListener) {
      media.addListener(updatePause);
      listeners.push(() => media.removeListener(updatePause));
    }
    render();
    updatePause();
    const instance = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        stopClock();
        observer?.disconnect();
        resizeObserver?.disconnect();
        listeners.splice(0).forEach(remove => remove());
        figure.destroy?.();
        figure.element.remove();
        if (fallback) fallback.hidden = fallbackHidden;
        ["walkPaused", "walkReduced", "walkAction", "walkProgress"].forEach(key => { delete walker.dataset[key]; });
        previousStyles.forEach(([node, value], property) => {
          if (value) node.style.setProperty(property, value);
          else node.style.removeProperty(property);
        });
        mounted.delete(walker);
      }
    };
    mounted.set(walker, instance);
    return instance;
  };
})();
