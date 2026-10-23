/* 简介相册：局部照片切换、单时钟与可释放的生命周期，不读取其他模块私有状态。 */
(function () {
  "use strict";
  const api = window.Homepage.aboutGallery = window.Homepage.aboutGallery || {};
  const mounted = new WeakMap();

  function photoList(config) {
    if (!Array.isArray(config?.photos)) return [];
    const ids = new Set();
    return config.photos.filter(photo => {
      if (!photo || typeof photo.id !== "string" || !/^[a-z0-9-]+$/.test(photo.id)
        || ids.has(photo.id) || typeof photo.alt !== "string" || !photo.alt.trim()
        || typeof photo.src !== "string"
        || !/^modules\/about\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp)(?:\?v=[a-zA-Z0-9-]+)?$/.test(photo.src)
        || photo.src.split("?")[0].split("/").includes("..")) return false;
      ids.add(photo.id);
      return true;
    }).map(photo => ({ ...photo }));
  }

  api.mount = function ({ root, reducedMotion, config = api.config } = {}) {
    if (!root || typeof root.querySelector !== "function") return { destroy() {} };
    mounted.get(root)?.destroy();
    const photos = photoList(config);
    const container = root.querySelector("[data-gallery-slides]");
    const fallback = root.querySelector("[data-gallery-fallback]");
    if (!container || !fallback || !photos.length) return { destroy() {} };
    const previous = root.querySelector("[data-gallery-prev]");
    const next = root.querySelector("[data-gallery-next]");
    const toggle = root.querySelector("[data-gallery-toggle]");
    const index = root.querySelector("[data-gallery-index]");
    const announcement = root.querySelector("[data-gallery-announcement]");
    const credit = root.querySelector("[data-gallery-credit]");
    const preference = reducedMotion || (typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false });
    const configuredInterval = Number(config?.intervalMs);
    const interval = Number.isFinite(configuredInterval) && configuredInterval >= 1000
      ? configuredInterval : 6000;
    const listeners = [];
    const holds = new Set();
    const created = [];
    const restorers = [];
    let selected = 0;
    let timer = null;
    let visible = false;
    let paused = false;
    let suspended = false;
    let destroyed = false;
    let observer = null;
    let swipe = null;
    let records = [];

    function remember(node, attributes) {
      if (!node) return;
      const saved = attributes.map(name => [name, node.getAttribute(name)]);
      restorers.push(() => saved.forEach(([name, value]) => {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }));
    }
    function rememberText(node) {
      if (!node) return;
      const text = node.textContent;
      restorers.push(() => { node.textContent = text; });
    }
    function listen(target, type, handler, options) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    }
    function queue(task) {
      if (typeof window.queueMicrotask === "function") window.queueMicrotask(task);
      else Promise.resolve().then(task);
    }
    function reduced() { return Boolean(preference.matches); }
    function readyRecords() { return records.filter(record => record.status === "ready"); }
    function liveRecords() { return records.filter(record => record.status !== "bad"); }
    function syncDetailHold() {
      if (/^#(?:academic|life)\//.test(window.location.hash)) holds.add("detail");
      else holds.delete("detail");
    }
    function canPlay() {
      return !destroyed && !suspended && !paused && !reduced() && visible
        && !document.hidden && holds.size === 0 && readyRecords().length > 1
        && records[selected]?.status === "ready";
    }
    function controls() {
      const multiple = readyRecords().length > 1;
      [previous, next].forEach(button => {
        if (!button) return;
        button.hidden = !multiple;
        button.disabled = !multiple;
      });
      if (toggle) {
        toggle.hidden = !multiple || reduced();
        toggle.disabled = !multiple || reduced();
        toggle.textContent = paused ? "▶" : "Ⅱ";
        toggle.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
        toggle.setAttribute("aria-pressed", String(paused));
      }
      const live = liveRecords();
      const rank = live.indexOf(records[selected]);
      if (index) index.textContent = String(Math.max(0, rank) + 1) + " / "
        + String(Math.max(1, live.length)).padStart(2, "0");
      root.dataset.galleryState = reduced() ? "reduced" : paused ? "paused"
        : canPlay() ? "playing" : "held";
      root.dataset.galleryIndex = String(selected);
    }
    function schedule() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (destroyed) return;
      syncDetailHold();
      controls();
      if (canPlay()) timer = window.setTimeout(() => {
        timer = null;
        syncDetailHold();
        if (canPlay()) advance(1, false);
        else controls();
      }, interval);
    }
    function show(target, manual) {
      if (destroyed || target?.status !== "ready") return;
      selected = records.indexOf(target);
      records.forEach(record => {
        const active = record === target;
        record.image.classList.toggle("is-active", active);
        record.image.setAttribute("aria-hidden", String(!active));
      });
      if (credit) {
        const text = typeof target.photo.credit === "string" ? target.photo.credit.trim() : "";
        credit.setAttribute("title", text || "Photo credits");
        credit.setAttribute("aria-label", text ? "Photo credit: " + text : "Photo credits");
      }
      if (manual && announcement) {
        const live = liveRecords();
        announcement.textContent = "Photo " + (live.indexOf(target) + 1) + " of "
          + live.length + ": " + target.photo.alt;
      }
      schedule();
    }
    function advance(direction, manual = true) {
      if (destroyed) return;
      for (let offset = 1; offset <= records.length; offset += 1) {
        const position = (selected + direction * offset + records.length) % records.length;
        if (position !== selected && records[position].status === "ready") {
          show(records[position], manual);
          return;
        }
      }
      schedule();
    }
    function finishLoad(record, success) {
      if (destroyed || record.status !== "loading") return;
      record.status = success ? "ready" : "bad";
      if (records[selected]?.status === "bad") {
        const replacement = readyRecords()[0];
        if (replacement) { show(replacement, false); return; }
      }
      if (record === records[selected] && success) { show(record, false); return; }
      schedule();
    }
    function loaded(record) {
      if (destroyed || record.status !== "loading" || record.decoding) return;
      if (!(record.image.naturalWidth > 0)) { finishLoad(record, false); return; }
      record.decoding = true;
      if (typeof record.image.decode !== "function") { finishLoad(record, true); return; }
      try {
        Promise.resolve(record.image.decode()).then(
          () => finishLoad(record, record.image.naturalWidth > 0),
          () => finishLoad(record, false)
        );
      } catch (_) { finishLoad(record, false); }
    }
    function hold(reason, active) {
      if (destroyed) return;
      if (active) holds.add(reason);
      else holds.delete(reason);
      schedule();
    }
    function measureVisibility() {
      if (destroyed) return;
      const box = root.getBoundingClientRect();
      visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0
        && box.top < window.innerHeight && box.left < window.innerWidth;
      schedule();
    }
    function editable(target) {
      return Boolean(target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']"));
    }

    remember(root, ["data-gallery-state", "data-gallery-index"]);
    remember(fallback, ["class", "aria-hidden", "src", "alt", "width", "height", "decoding", "draggable", "loading", "style"]);
    [previous, next, toggle].forEach(button => remember(button, ["hidden", "disabled", "aria-label", "aria-pressed"]));
    remember(credit, ["title", "aria-label"]);
    [index, toggle, announcement].forEach(rememberText);
    records = photos.map((photo, position) => {
      const image = position === 0 ? fallback : document.createElement("img");
      if (position !== 0) { created.push(image); container.append(image); }
      image.classList.add("about-gallery__slide");
      image.classList.toggle("is-active", position === 0);
      image.setAttribute("aria-hidden", String(position !== 0));
      image.setAttribute("alt", photo.alt);
      if (Number.isFinite(photo.width) && photo.width > 0) image.setAttribute("width", String(photo.width));
      if (Number.isFinite(photo.height) && photo.height > 0) image.setAttribute("height", String(photo.height));
      image.setAttribute("decoding", "async");
      image.setAttribute("draggable", "false");
      image.setAttribute("loading", "eager");
      const focal = typeof photo.position === "string" && /^\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.test(photo.position)
        ? photo.position : "50% 50%";
      image.style.objectPosition = focal;
      const record = { photo, image, status: "loading", decoding: false };
      listen(image, "load", () => loaded(record));
      listen(image, "error", () => finishLoad(record, false));
      if (image.getAttribute("src") !== photo.src) image.setAttribute("src", photo.src);
      return record;
    });
    // 已有静态首图可能来自缓存；在 records 完整建立后再处理同步 complete 状态。
    records.forEach(record => {
      if (record.image.complete) loaded(record);
    });

    listen(previous, "click", () => advance(-1));
    listen(next, "click", () => advance(1));
    listen(toggle, "click", () => {
      if (reduced() || readyRecords().length < 2) return;
      paused = !paused;
      // 明确点击 Play 要即时生效；新的进入或焦点移动会重新启用交互暂停。
      if (!paused) { holds.delete("hover"); holds.delete("focus"); }
      schedule();
    });
    listen(root, "pointerenter", event => {
      if (event.pointerType !== "touch") hold("hover", true);
    });
    listen(root, "pointerleave", event => {
      if (event.pointerType !== "touch") hold("hover", false);
    });
    listen(root, "pointercancel", () => {
      swipe = null; holds.delete("touch"); hold("hover", false);
    });
    listen(root, "focusin", () => hold("focus", true));
    listen(root, "focusout", () => queue(() => {
      if (!destroyed) hold("focus", root.contains(document.activeElement));
    }));
    listen(root, "keydown", event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
        || editable(event.target) || !root.contains(event.target)
        || readyRecords().length < 2) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        advance(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    listen(root, "pointerdown", event => {
      if (event.pointerType !== "touch" || event.isPrimary === false
        || event.target?.closest?.("button, a, input, textarea, select, [contenteditable]")) return;
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      hold("touch", true);
    }, { passive: true });
    listen(window, "pointerup", event => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      swipe = null;
      holds.delete("touch");
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) advance(dx < 0 ? 1 : -1);
      else schedule();
    }, { passive: true });
    listen(window, "pointercancel", () => { swipe = null; hold("touch", false); });
    listen(document, "visibilitychange", schedule);
    listen(window, "hashchange", schedule);
    listen(window, "popstate", schedule);
    listen(document, "focusin", schedule);
    listen(document, "close", () => queue(schedule), true);
    listen(window, "pagehide", event => {
      if (event.persisted === false) { handle.destroy(); return; }
      suspended = true; swipe = null; holds.delete("touch"); schedule();
    });
    listen(window, "pageshow", () => {
      suspended = false;
      if (!observer) measureVisibility();
      else schedule();
    });
    if (typeof preference.addEventListener === "function") listen(preference, "change", schedule);
    else if (typeof preference.addListener === "function") {
      preference.addListener(schedule);
      listeners.push(() => preference.removeListener(schedule));
    }
    if (typeof window.IntersectionObserver === "function") {
      observer = new window.IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === root);
        if (!entry || destroyed) return;
        visible = entry.isIntersecting;
        schedule();
      }, { threshold: 0 });
      observer.observe(root);
    } else {
      listen(window, "scroll", measureVisibility, { passive: true });
      listen(window, "resize", measureVisibility);
      measureVisibility();
    }
    if (root.contains(document.activeElement)) holds.add("focus");
    schedule();

    const handle = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        observer?.disconnect();
        listeners.splice(0).forEach(remove => remove());
        created.forEach(image => image.remove());
        restorers.splice(0).reverse().forEach(restore => restore());
        holds.clear();
        swipe = null;
        if (mounted.get(root) === handle) mounted.delete(root);
      }
    };
    mounted.set(root, handle);
    return handle;
  };
})();
