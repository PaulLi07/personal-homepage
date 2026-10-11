(function () {
  "use strict";
  const defaults = Object.freeze({
    enabled: true, count: 4800, mobileCount: 1400, averageSpeed: 22,
    minSize: 0.32, maxSize: 1.15, opacity: 0.6,
    interactionRadius: 170, interactionStrength: 1,
    alignment: 0.7, cohesion: 0.18, separation: 0.6,
    flowScale: 190, turbulence: 0.65, fps: 45,
    maxPixelRatio: 1.5, adaptiveQuality: true
  });
  const limits = Object.freeze({
    count: [0, 12000], mobileCount: [0, 4000], averageSpeed: [0, 160],
    minSize: [0.15, 3], maxSize: [0.15, 3], opacity: [0, 1],
    interactionRadius: [20, 450], interactionStrength: [0, 5],
    alignment: [0, 3], cohesion: [0, 3], separation: [0, 3],
    flowScale: [50, 800], turbulence: [0, 3], fps: [15, 60],
    maxPixelRatio: [1, 2]
  });

  function apply(target, patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new TypeError("Particle configuration must be an object.");
    }
    for (const key of Reflect.ownKeys(patch)) {
      if (typeof key !== "string" || !Object.prototype.hasOwnProperty.call(defaults, key)) {
        throw new TypeError("Unknown particle configuration option.");
      }
      const value = patch[key];
      if (key === "enabled" || key === "adaptiveQuality") {
        if (typeof value !== "boolean") throw new TypeError("Particle switches must be booleans.");
      } else {
        const range = limits[key];
        if (typeof value !== "number" || !Number.isFinite(value)
          || value < range[0] || value > range[1]
          || ((key === "count" || key === "mobileCount") && !Number.isInteger(value))) {
          throw new RangeError("Particle configuration is outside its supported range: " + key + ".");
        }
      }
      target[key] = value;
    }
  }

  function normalize(patch = {}, base) {
    const result = {...defaults};
    if (base !== undefined) apply(result, base);
    apply(result, patch);
    if (result.minSize > result.maxSize) throw new RangeError("Particle minimum size must not exceed its maximum.");
    return Object.freeze(result);
  }

  function effectiveCount(config, width, height, coarse = false) {
    const values = normalize(config);
    if (typeof width !== "number" || typeof height !== "number"
      || !Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0) {
      throw new RangeError("Particle viewport dimensions must be finite and nonnegative.");
    }
    if (!values.enabled || values.count === 0 || width === 0 || height === 0) return 0;
    const areaScale = Math.max(0.3, Math.min(1.4, width * height / (1440 * 900)));
    if (width <= 760 || coarse) {
      return Math.min(values.mobileCount, Math.round(values.count * Math.min(areaScale, 1)));
    }
    return Math.min(12000, Math.round(values.count * areaScale));
  }

  window.Homepage.particleConfig = Object.freeze({defaults, normalize, effectiveCount});
}());
