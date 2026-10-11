/* 渲染与生命周期独立于模拟；胶水只传主页面、偏好与详情根节点。 */
(function () {
  "use strict";
  const api = window.Homepage;
  let configuration = api.particleConfig.defaults;
  let current = null;
  let lastStats = {status: "disposed", count: 0, requestedCount: 0, frameCount: 0, running: false,
    reducedMotion: false, width: 0, height: 0, pixelRatio: 1, meanSpeed: 0, maxSpeed: 0,
    finite: true, stepMs: 0, frameMs: 0, pointerActive: false, adaptiveLevel: 1,
    renderedCount: 0, surfaceCount: 0};

  function mount({root, reducedMotion, dialog, config} = {}) {
    if (!root || root.ownerDocument !== document || typeof root.prepend !== "function") {
      throw new TypeError("A main page root is required for the particle background.");
    }
    const next = api.particleConfig.normalize(config || {}, configuration);
    current?.dispose();
    configuration = next;
    const signalController = new AbortController();
    const signal = signalController.signal;
    const media = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    // 按原生 change 事件维护偏好快照，绘制与诊断不重复查询媒体对象。
    let motionReduced = media.matches;
    const canvas = document.createElement("canvas");
    canvas.className = "particle-background__canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("role", "presentation");
    canvas.hidden = true;
    let context;
    try { context = canvas.getContext("2d", {alpha: true, desynchronized: true}); }
    catch (_) { context = null; }
    let alive = true, manualPause = false, unsupported = !context, animation = 0, maskPaint = 0;
    let width = 0, height = 0, pixelRatio = 1, simulation = null;
    let frameCount = 0, simulationTime = 0, lastFrame = 0, previousRender = 0;
    let frameMs = 0, adaptiveLevel = 1, slowFrames = 0, renderedCount = 0, surfaceCount = 0;
    const pointer = {x: 0, y: 0, vx: 0, vy: 0, active: false};
    let pointerTime = 0;
    root.prepend(canvas);
    const blocked = () => manualPause || document.hidden || Boolean(dialog?.open);
    const desiredCount = () => api.particleConfig.effectiveCount(configuration, width, height, coarse.matches);
    function stop() {
      if (animation) window.cancelAnimationFrame(animation);
      if (maskPaint) window.cancelAnimationFrame(maskPaint);
      animation = 0;
      maskPaint = 0;
      lastFrame = previousRender = 0;
      pointer.active = false;
      pointer.vx = pointer.vy = 0;
    }
    function resize() {
      if (!alive || unsupported) return;
      const nextWidth = Math.max(1, Math.round(window.innerWidth));
      const nextHeight = Math.max(1, Math.round(window.innerHeight));
      const ratio = Math.min(configuration.maxPixelRatio, Math.max(1, window.devicePixelRatio || 1));
      const changed = width !== nextWidth || height !== nextHeight || pixelRatio !== ratio;
      width = nextWidth; height = nextHeight; pixelRatio = ratio;
      const count = Math.round(desiredCount() * adaptiveLevel);
      if (changed) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      if (!simulation) simulation = api.createDustSimulation({width, height, count, config: configuration});
      else simulation.resize(width, height, count);
      if (!animation) draw();
    }
    function visibleRect(node, padding = 0) {
      const bounds = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return null;
      if (!bounds.width || !bounds.height) return null;
      const rect = {left: Math.max(0, bounds.left - padding), top: Math.max(0, bounds.top - padding),
        right: Math.min(width, bounds.right + padding), bottom: Math.min(height, bounds.bottom + padding)};
      return rect.right > rect.left && rect.bottom > rect.top ? rect : null;
    }
    function visibleMask() {
      const surfaces = [], images = new Set();
      root.querySelectorAll('[data-particle-surface="black"]').forEach(node => {
        const rect = visibleRect(node);
        if (!rect) return;
        const style = window.getComputedStyle(node);
        // 属性由区域所有者声明；同时核实本身是无背景图的、不透明纯黑色。
        if (style.backgroundColor !== "rgb(0, 0, 0)" || style.backgroundImage !== "none" || Number(style.opacity) !== 1) return;
        surfaces.push(rect);
        node.querySelectorAll("img").forEach(image => images.add(image));
      });
      document.querySelectorAll("[data-particle-exclude]").forEach(node => images.add(node));
      // 图片及公共遮挡区域多留一像素，防止圆边抗锯齿进入图片。
      const holes = Array.from(images, node => visibleRect(node, 1)).filter(Boolean);
      return {surfaces, holes};
    }
    function draw() {
      if (!alive || unsupported || !simulation) return;
      context.clearRect(0, 0, width, height);
      renderedCount = 0;
      const {surfaces, holes} = visibleMask();
      surfaceCount = surfaces.length;
      if (!surfaceCount) return;
      context.save();
      context.beginPath();
      surfaces.forEach(rect => context.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top));
      context.clip();
      holes.forEach(rect => {
        context.beginPath(); context.rect(0, 0, width, height);
        context.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
        context.clip("evenodd");
      });
      context.globalAlpha = configuration.opacity;
      context.fillStyle = "#fff";
      context.shadowBlur = 0;
      context.filter = "none";
      context.beginPath();
      const particles = simulation.particles;
      for (let i = 0; i < particles.count; i += 1) {
        const x = particles.x[i], y = particles.y[i], radius = particles.size[i], guard = radius + 1;
        if (!surfaces.some(rect => x - guard >= rect.left && x + guard <= rect.right
          && y - guard >= rect.top && y + guard <= rect.bottom)) continue;
        if (holes.some(rect => x + guard >= rect.left && x - guard <= rect.right
          && y + guard >= rect.top && y - guard <= rect.bottom)) continue;
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
        renderedCount += 1;
      }
      context.fill();
      context.restore();
    }
    function degrade() {
      if (!configuration.adaptiveQuality) { slowFrames = 0; return; }
      if (frameMs > 1000 / configuration.fps * .75) slowFrames += 1;
      else slowFrames = Math.max(0, slowFrames - 2);
      if (slowFrames >= 90 && adaptiveLevel > .55) {
        adaptiveLevel = Math.max(.55, adaptiveLevel * .8);
        slowFrames = 0;
        simulation.resize(width, height, Math.round(desiredCount() * adaptiveLevel));
      }
    }
    function frame(now) {
      animation = 0;
      if (!alive || unsupported || !configuration.enabled || motionReduced || blocked()) { sync(); return; }
      animation = window.requestAnimationFrame(frame);
      const interval = 1000 / configuration.fps;
      if (previousRender && now - previousRender < interval - .5) return;
      const start = performance.now();
      const dt = lastFrame ? Math.min(.05, (now - lastFrame) / 1000) : 1 / configuration.fps;
      lastFrame = previousRender = now;
      simulationTime += dt;
      if (pointer.active && now - pointerTime > 240) {
        pointer.vx *= Math.exp(-dt * 6); pointer.vy *= Math.exp(-dt * 6);
        if (now - pointerTime > 900) pointer.active = false;
      }
      try {
        const ratio = Math.min(configuration.maxPixelRatio, Math.max(1, window.devicePixelRatio || 1));
        if (width !== window.innerWidth || height !== window.innerHeight || pixelRatio !== ratio) resize();
        simulation.step(dt, pointer, simulationTime);
        draw();
        frameCount += 1;
        const elapsed = performance.now() - start;
        frameMs = frameMs ? frameMs * .92 + elapsed * .08 : elapsed;
        degrade();
      } catch (_) {
        unsupported = true;
        stop();
        canvas.hidden = true;
        root.classList.remove("has-particle-background");
      }
    }
    function sync() {
      if (!alive) return;
      if (unsupported || !configuration.enabled) {
        stop(); canvas.hidden = true; root.classList.remove("has-particle-background"); return;
      }
      root.classList.add("has-particle-background");
      canvas.hidden = Boolean(dialog?.open);
      if (blocked() || motionReduced) { stop(); if (!canvas.hidden) draw(); return; }
      if (!animation) {
        lastFrame = previousRender = 0;
        animation = window.requestAnimationFrame(frame);
      }
    }
    function configure(patch) {
      const normalized = api.particleConfig.normalize(patch, configuration);
      if (!alive) throw new Error("The particle background has been disposed.");
      configuration = normalized;
      adaptiveLevel = 1; slowFrames = 0;
      simulation?.updateConfig(configuration);
      resize(); sync();
      if (!unsupported && !canvas.hidden) draw();
      return configuration;
    }
    function stats() {
      const measured = simulation?.stats() || {count: 0, meanSpeed: 0, maxSpeed: 0, finite: true, lastStepMs: 0};
      return {...measured, stepMs: measured.lastStepMs, frameMs, frameCount, width, height, pixelRatio,
        requestedCount: width ? desiredCount() : 0, renderedCount, surfaceCount, adaptiveLevel, pointerActive: pointer.active,
        reducedMotion: motionReduced, running: Boolean(animation),
        status: !alive ? "disposed" : unsupported ? "unsupported" : !configuration.enabled ? "disabled"
          : blocked() ? "paused" : motionReduced ? "reduced" : "running"};
    }
    function dispose() {
      if (!alive) return;
      stop(); alive = false;
      lastStats = stats();
      signalController.abort(); observer?.disconnect(); maskObserver.disconnect();
      media.removeEventListener("change", onMotionChange);
      coarse.removeEventListener("change", onResize);
      simulation?.dispose(); simulation = null;
      canvas.remove(); root.classList.remove("has-particle-background");
      if (current === controller) current = null;
    }
    function onResize() { resize(); sync(); }
    function onMotionChange(event) { motionReduced = event.matches; sync(); }
    function onScroll() {
      if (!alive || unsupported || !configuration.enabled || document.hidden || dialog?.open) return;
      // 即时同步可见边界，静态模式不需要另起动画；不推动模拟或增加帧统计。
      try { draw(); }
      catch (_) {
        unsupported = true; stop(); canvas.hidden = true;
        root.classList.remove("has-particle-background");
      }
    }
    function onMaskChange() {
      if (!alive || unsupported || !configuration.enabled || document.hidden || dialog?.open || maskPaint) return;
      // 样式变更后的受控补绘；CSS 过渡结束时再确认最终遮罩，不推进粒子模拟。
      maskPaint = window.requestAnimationFrame(() => { maskPaint = 0; onScroll(); });
    }
    const maskSelector = '[data-particle-surface], [data-particle-exclude]';
    const maskObserver = new MutationObserver(records => {
      if (records.some(record => record.target instanceof Element
        && (record.target.closest(maskSelector) || record.type === "childList"
          || ["data-particle-surface", "data-particle-exclude"].includes(record.attributeName)))) onMaskChange();
    });
    maskObserver.observe(root, {subtree: true, childList: true, attributes: true,
      attributeFilter: ["style", "class", "data-particle-surface", "data-particle-exclude", "src"]});
    document.querySelectorAll("[data-particle-exclude]").forEach(node =>
      maskObserver.observe(node, {subtree: true, childList: true, attributes: true,
        attributeFilter: ["style", "class", "data-particle-exclude", "src"]}));
    for (const event of ["transitionend", "transitioncancel", "animationend"]) {
      document.addEventListener(event, event => {
        if (event.target instanceof Element && event.target.closest(maskSelector)) onMaskChange();
      }, {signal});
    }
    root.addEventListener("load", onMaskChange, {capture: true, signal});
    window.addEventListener("resize", onResize, {passive: true, signal});
    window.addEventListener("scroll", onScroll, {passive: true, signal});
    window.addEventListener("pointermove", event => {
      if (!alive || motionReduced || blocked() || !configuration.enabled || event.pointerType === "touch") return;
      const now = performance.now();
      const elapsed = pointerTime ? Math.max(.008, (now - pointerTime) / 1000) : .016;
      const vx = pointer.active ? (event.clientX - pointer.x) / elapsed : 0;
      const vy = pointer.active ? (event.clientY - pointer.y) / elapsed : 0;
      pointer.vx = Math.max(-1600, Math.min(1600, pointer.vx * .4 + vx * .6));
      pointer.vy = Math.max(-1600, Math.min(1600, pointer.vy * .4 + vy * .6));
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; pointerTime = now;
    }, {passive: true, signal});
    window.addEventListener("pointerout", event => { if (!event.relatedTarget) pointer.active = false; }, {passive: true, signal});
    document.addEventListener("visibilitychange", sync, {signal});
    window.addEventListener("pagehide", () => { stop(); manualPause = true; }, {signal});
    window.addEventListener("pageshow", event => { if (event.persisted) { manualPause = false; onResize(); } }, {signal});
    canvas.addEventListener("contextlost", () => { unsupported = true; sync(); }, {signal});
    media.addEventListener("change", onMotionChange);
    coarse.addEventListener("change", onResize);
    const observer = dialog ? new MutationObserver(sync) : null;
    observer?.observe(dialog, {attributes: true, attributeFilter: ["open"]});
    const controller = Object.freeze({configure, getConfig: () => configuration, getStats: stats, dispose,
      pause() { manualPause = true; sync(); }, resume() { manualPause = false; sync(); }});
    current = controller;
    try { resize(); sync(); }
    catch (_) { unsupported = true; sync(); }
    return controller;
  }
  api.particleBackground = Object.freeze({mount,
    configure(patch) {
      if (current) return current.configure(patch);
      configuration = api.particleConfig.normalize(patch, configuration);
      return configuration;
    },
    getConfig: () => configuration,
    getStats: () => current ? current.getStats() : {...lastStats},
    dispose() { current?.dispose(); }
  });
})();
