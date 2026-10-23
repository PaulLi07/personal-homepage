/* 人物动作导演：只处理片段抽取、时间与地面位移，不依赖 DOM 或浏览器时钟。 */
(function () {
  "use strict";
  const scene = window.Homepage.academicExploration;
  const character = scene.character;
  const defaults = Object.freeze({
    speedPxPerSecond: 24,
    stepDurationMs: 850,
    durationScale: 1,
    turnDurationMs: 900,
    weights: Object.freeze({ walk: 45, idle: 12, look: 16, think: 12, stretch: 9, wave: 6 })
  });
  const actionIds = Object.keys(defaults.weights);
  const fallbackDurations = { walk: [3200, 5200], idle: [1800, 2800], look: [2200, 3400],
    think: [2400, 3800], stretch: [2200, 3200], wave: [1800, 2800] };
  const epsilon = 0.01;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const finite = (value, fallback, low, high) => Number.isFinite(value) && value > 0
    ? clamp(value, low, high) : fallback;
  const validWidth = value => Number.isFinite(value) ? Math.max(0, value) : 0;
  // 两端的一阶、二阶导数均为零；静止片段和转身与步行端点自然衔接。
  const ease = progress => progress * progress * progress * (10 + progress * (-15 + progress * 6));
  // 积分步态素材的15%起落幅度，根位移与迈步同时起步、收步，中段匀速。
  const walkEase = progress => {
    const edge = 0.15;
    const integral = value => value ** 4 * (2.5 + value * (-3 + value));
    const area = progress < edge ? edge * integral(progress / edge)
      : progress > 1 - edge ? 1 - edge - edge * integral((1 - progress) / edge)
        : progress - edge / 2;
    return area / (1 - edge);
  };

  character.createDirector = function ({ width = 0, config = {}, random = Math.random } = {}) {
    config = config && typeof config === "object" ? config : {};
    let pathWidth = validWidth(width);
    let anchor = pathWidth * 0.42;
    let facing = 1;
    let current;
    let lastAction = null;
    let stationaryCount = 0;
    const speed = finite(config.speedPxPerSecond, defaults.speedPxPerSecond, 1, 120);
    const stepMs = finite(config.stepDurationMs, defaults.stepDurationMs, 200, 4000);
    const durationScale = finite(config.durationScale, defaults.durationScale, 0.25, 4);
    const turnMs = finite(config.turnDurationMs, defaults.turnDurationMs, 300, 5000);
    const weights = {};
    actionIds.forEach(id => {
      const supplied = config.weights && config.weights[id];
      weights[id] = Number.isFinite(supplied) && supplied >= 0
        ? Math.min(supplied, 1e6) : defaults.weights[id];
    });
    if (!Object.values(weights).some(Boolean)) Object.assign(weights, defaults.weights);

    function draw() {
      let value;
      try { value = typeof random === "function" ? random() : 0.5; } catch (_) { value = 0.5; }
      return Number.isFinite(value) ? clamp(value, 0, 1 - Number.EPSILON) : 0.5;
    }
    function durationFor(id) {
      const entry = character.clips.find(clip => clip.id === id);
      const range = entry && Array.isArray(entry.duration) ? entry.duration : fallbackDurations[id];
      const low = finite(range && range[0], fallbackDurations[id][0], 500, 20000);
      const high = Math.max(low, finite(range && range[1], fallbackDurations[id][1], 500, 20000));
      return (low + (high - low) * draw()) * durationScale;
    }
    function available() { return facing >= 0 ? pathWidth - anchor : anchor; }
    function canWalk() { return pathWidth > epsilon; }
    function start(id) {
      if (id === "walk" && available() <= epsilon) id = canWalk() ? "turn" : "idle";
      const clip = { id, elapsed: 0, duration: 0, fromX: anchor, toX: anchor,
        fromFacing: facing, toFacing: facing, rootStartProgress: 0, cycles: 1 };
      if (id === "turn") {
        clip.duration = turnMs;
        clip.toFacing = facing >= 0 ? -1 : 1;
      } else if (id === "walk") {
        const requested = durationFor("walk");
        const distance = Math.min(available(), requested * speed / 1000);
        // 狭窄手机路径减慢整段，避免一步内撞到边界再闪回。
        clip.duration = Math.max(1000, distance / speed * 1000);
        clip.toX = anchor + Math.sign(facing) * distance;
        clip.cycles = Math.max(1, Math.round(clip.duration / stepMs));
      } else {
        clip.duration = durationFor(id);
      }
      current = clip;
    }
    function chooseNext() {
      if (lastAction === "turn") {
        // 转身期间若布局收缩到脚下，先站定；避免响应式重排触发连续反向转身。
        start(canWalk() && available() > epsilon ? "walk" : "idle");
        return;
      }
      if (canWalk() && stationaryCount >= 2) { start("walk"); return; }
      const candidates = actionIds.filter(id => id !== lastAction && weights[id] > 0
        && (id !== "walk" || canWalk()));
      if (!candidates.length) {
        // 配置只启用一种动作时仍遵守不连续重复；零权重不阻止必要的衔接片段。
        start(lastAction === "idle" ? (canWalk() ? "walk" : "look") : "idle");
        return;
      }
      let remaining = draw() * candidates.reduce((sum, id) => sum + weights[id], 0);
      let next = candidates[candidates.length - 1];
      for (const id of candidates) {
        remaining -= weights[id];
        if (remaining < 0) { next = id; break; }
      }
      start(next);
    }
    function getFrame() {
      const progress = clamp(current.elapsed / current.duration, 0, 1);
      const eased = ease(progress);
      const positionEase = current.id === "walk" ? walkEase : ease;
      const origin = positionEase(current.rootStartProgress);
      const travel = origin < 1 ? clamp((positionEase(progress) - origin) / (1 - origin), 0, 1) : 1;
      return {
        pose: character.sampleClip(current.id, progress, { cycles: current.cycles }),
        x: clamp(current.fromX + (current.toX - current.fromX) * travel, 0, pathWidth),
        facing: current.fromFacing + (current.toFacing - current.fromFacing) * eased,
        action: current.id,
        progress
      };
    }
    function advance(deltaMs) {
      // 巨大的外部时间差最多推进一分钟；防止后台恢复或坏输入引起无界循环。
      let remaining = Number.isFinite(deltaMs) ? clamp(deltaMs, 0, 60000) : 0;
      let transitions = 0;
      while (remaining > 0 && transitions < 256) {
        const consumed = Math.min(remaining, current.duration - current.elapsed);
        current.elapsed += consumed;
        remaining -= consumed;
        if (current.elapsed < current.duration) break;
        anchor = current.toX;
        facing = current.toFacing;
        lastAction = current.id;
        stationaryCount = lastAction === "walk" ? 0 : stationaryCount + 1;
        chooseNext();
        transitions += 1;
      }
      return getFrame();
    }
    function resize(nextWidth) {
      const frame = getFrame();
      pathWidth = validWidth(nextWidth);
      anchor = clamp(frame.x, 0, pathWidth);
      // 保留片段相位与人物朝向，只在布局变窄时重定余下轨迹；不重新抽取动作。
      if (frame.x > pathWidth || current.toX > pathWidth || current.toX < 0) {
        current.fromX = anchor;
        current.toX = clamp(current.toX, 0, pathWidth);
        current.rootStartProgress = frame.progress;
      }
      return getFrame();
    }
    start(canWalk() ? "walk" : "idle");
    return Object.freeze({ advance, getFrame, resize });
  };
})();
