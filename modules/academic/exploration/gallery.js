/* 学术场景图窗：选择、轮播与暂停状态均限制在本场景内。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;

  api.createGallery = function ({ root, details, config = {}, reducedMotion }) {
    const buttons = Array.from(root.querySelectorAll("[data-academic]"));
    const images = Array.from(root.querySelectorAll("[data-preview]"));
    const steps = Array.from(root.querySelectorAll("[data-scene-step]"));
    const keys = buttons.map(button => button.dataset.academic)
      .filter(key => details.getItem("academic", key));
    const title = root.querySelector("[data-scene-title]");
    const description = root.querySelector("[data-scene-description]");
    const index = root.querySelector("[data-scene-index]");
    const explore = root.querySelector("[data-scene-explore]");
    const action = root.querySelector("[data-scene-open]");
    const toggle = root.querySelector("[data-scene-toggle]");
    const preference = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)");
    const configuredInterval = Number(config.intervalMs);
    const interval = Number.isFinite(configuredInterval) && configuredInterval >= 1000
      ? configuredInterval : 5000;
    const holds = new Set();
    const listeners = [];
    let selected = null;
    let timer = null;
    let visible = false;
    let manuallyPaused = false;
    let destroyed = false;
    let observer = null;

    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    }

    function isReduced() { return Boolean(preference.matches); }

    // 只读公开 URL，不查询共用详情弹窗的内部节点。
    function syncDetailHold() {
      if (/^#(?:academic|life)\//.test(window.location.hash)) holds.add("detail");
      else holds.delete("detail");
    }

    function canPlay() {
      return !destroyed && keys.length > 1 && visible && !document.hidden
        && !isReduced() && !manuallyPaused && holds.size === 0;
    }

    function updatePlayback() {
      root.dataset.scenePlayback = isReduced() ? "reduced"
        : manuallyPaused ? "paused" : canPlay() ? "playing" : "held";
      if (!toggle) return;
      toggle.disabled = isReduced();
      toggle.textContent = isReduced() ? "Paused" : manuallyPaused ? "Play" : "Pause";
      toggle.setAttribute("aria-pressed", String(isReduced() || manuallyPaused));
      toggle.setAttribute("aria-label", isReduced()
        ? "Automatic previews are off while reduced motion is enabled"
        : manuallyPaused ? "Play automatic previews" : "Pause automatic previews");
    }

    function schedule() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (destroyed) return;
      syncDetailHold();
      updatePlayback();
      if (!canPlay()) return;
      timer = window.setTimeout(() => {
        timer = null;
        syncDetailHold();
        if (!canPlay()) { updatePlayback(); return; }
        const next = (keys.indexOf(selected) + 1) % keys.length;
        select(keys[next]);
      }, interval);
    }

    function select(key) {
      if (destroyed || !keys.includes(key)) return;
      const item = details.getItem("academic", key);
      if (!item) return;
      selected = key;
      images.forEach(image => {
        const active = image.dataset.preview === key;
        image.classList.toggle("is-active", active);
        image.setAttribute("aria-hidden", String(!active));
      });
      buttons.forEach(button => {
        const active = button.dataset.academic === key;
        button.classList.toggle("is-selected", active);
        if (active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
      steps.forEach(step => step.classList.toggle("is-active", step.dataset.sceneStep === key));
      if (title) title.textContent = item.label;
      if (description) description.textContent = item.subtitle || "";
      if (index) index.textContent = String(keys.indexOf(key) + 1).padStart(2, "0")
        + " / " + String(keys.length).padStart(2, "0");
      if (explore) explore.textContent = "Explore " + item.label + " ↗";
      if (action) action.setAttribute("aria-label", "Open " + item.label);
      schedule();
    }

    function hold(reason, active) {
      if (destroyed) return;
      if (active) holds.add(reason);
      else holds.delete(reason);
      // 每次恢复都完整等待一个周期，避免移出路牌时马上跳图。
      schedule();
    }

    function measureVisibility() {
      const box = root.getBoundingClientRect();
      visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0
        && box.top < window.innerHeight && box.left < window.innerWidth;
      schedule();
    }

    if (toggle) listen(toggle, "click", () => {
      if (isReduced()) return;
      manuallyPaused = !manuallyPaused;
      schedule();
    });
    listen(document, "visibilitychange", schedule);
    listen(window, "hashchange", schedule);
    listen(window, "popstate", schedule);
    // pushState / replaceState 不触发 hashchange；详情打开及关闭恢复焦点时同步。
    listen(document, "focusin", schedule);
    // 原生 close 事件先于关闭函数的 replaceState，微任务中再核对公开 URL。
    listen(document, "close", () => {
      window.queueMicrotask(schedule);
    }, true);
    if (typeof preference.addEventListener === "function") {
      listen(preference, "change", schedule);
    } else if (typeof preference.addListener === "function") {
      preference.addListener(schedule);
      listeners.push(() => preference.removeListener(schedule));
    }
    if (typeof window.IntersectionObserver === "function") {
      observer = new window.IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === root);
        if (!entry) return;
        // threshold:0 在刚触及边界时可能先报告 ratio:0，随后不再跨阈值。
        visible = entry.isIntersecting;
        schedule();
      }, { threshold: 0 });
      observer.observe(root);
    } else {
      listen(window, "scroll", measureVisibility);
      listen(window, "resize", measureVisibility);
      measureVisibility();
    }
    select(keys.includes("experience") ? "experience" : keys[0]);

    return {
      select,
      hold,
      getKey() { return selected; },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        observer?.disconnect();
        listeners.splice(0).forEach(remove => remove());
        holds.clear();
      }
    };
  };
})();
