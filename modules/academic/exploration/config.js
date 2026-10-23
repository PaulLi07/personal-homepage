/* 场景参数：轮播与人物独立配置；动作时长范围见 character/clips.js。 */
(function () {
  "use strict";
  window.Homepage.academicExploration = {
    config: Object.freeze({
      intervalMs: 5000,
      walker: Object.freeze({
        heightPx: 60,
        speedPxPerSecond: 24,
        stepDurationMs: 850,
        durationScale: 1,
        turnDurationMs: 900,
        weights: Object.freeze({ walk: 45, idle: 12, look: 16, think: 12, stretch: 9, wave: 6 })
      })
    })
  };
})();
