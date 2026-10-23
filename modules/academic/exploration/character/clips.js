/* 动作素材只计算关节，不操作时间、位置或页面；所有片段从同一站姿平滑进出。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;
  const character = api.character || (api.character = {});
  const neutral = {
    hip: [0, -19], shoulder: [0, -30], head: [0, -37],
    elbowBack: [-3.4, -25], handBack: [-4.2, -20.5],
    elbowFront: [3.2, -25], handFront: [4, -20],
    kneeBack: [-2, -9.5], footBack: [-3, 0],
    kneeFront: [2, -9.5], footFront: [3, 0]
  };
  Object.values(neutral).forEach(Object.freeze);
  character.neutralPose = Object.freeze(neutral);
  character.clips = Object.freeze([
    { id: "walk", weight: 45, duration: [5000, 8500] },
    { id: "idle", weight: 12, duration: [1600, 2800] },
    { id: "look", weight: 16, duration: [2600, 3800] },
    { id: "think", weight: 12, duration: [2600, 4000] },
    { id: "stretch", weight: 9, duration: [3000, 4200] },
    { id: "wave", weight: 6, duration: [2200, 3200] },
    { id: "turn", weight: 0, duration: [900, 900] }
  ].map(clip => Object.freeze({ ...clip, duration: Object.freeze(clip.duration) })));

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const fresh = () => Object.fromEntries(Object.entries(neutral).map(([key, point]) => [key, [...point]]));
  // 五次缓动在两端的一、二阶导数都为零，避免切换片段时突然起步或收手。
  function ease(value) {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function envelope(progress, edge = .2) {
    return ease(progress / edge) * ease((1 - progress) / edge);
  }
  function blend(pose, target, amount) {
    Object.entries(target).forEach(([joint, point]) => {
      pose[joint][0] += (point[0] - pose[joint][0]) * amount;
      pose[joint][1] += (point[1] - pose[joint][1]) * amount;
    });
    return pose;
  }

  // 双段腿以脚落点解膝盖；摆动腿只在前摆半周离地，另一条腿仍与地面接触。
  function knee(hip, foot) {
    const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
    const distance = Math.max(.001, Math.hypot(dx, dy));
    const bend = Math.sqrt(Math.max(0, 10.5 * 10.5 - distance * distance / 4));
    return [(hip[0] + foot[0]) / 2 + bend * dy / distance,
      (hip[1] + foot[1]) / 2 - bend * dx / distance];
  }
  function walking(pose, progress, options) {
    const requested = options && options.cycles;
    const cycles = Number.isFinite(requested) && Number.isInteger(requested)
      ? clamp(requested, 1, 24) : 6;
    const phase = progress * Math.PI * 2 * cycles;
    const hip = [0, -19 + .4 * Math.sin(phase) ** 2];
    const shoulder = [.55, -30 - .5 * Math.sin(phase) ** 2];
    const feet = [phase + Math.PI, phase].map(angle => [
      6 * Math.cos(angle), -3.2 * Math.min(0, Math.sin(angle)) ** 2
    ]);
    const swing = 4.7 * Math.cos(phase);
    return blend(pose, {
      hip, shoulder, head: [1.2, shoulder[1] - 7],
      elbowBack: [1.2 + swing * .5, -25], handBack: [1.2 + swing, -20.5],
      elbowFront: [.4 - swing * .5, -24.8], handFront: [.4 - swing, -20],
      footBack: feet[0], kneeBack: knee(hip, feet[0]),
      footFront: feet[1], kneeFront: knee(hip, feet[1])
    }, envelope(progress, .15));
  }

  character.sampleClip = function (id, progress, options = {}) {
    const p = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
    const pose = fresh();
    // 显式返回相同端点，消除三角函数浮点误差，未知动作也安全落到站姿。
    if (p === 0 || p === 1 || id === "turn") return pose;
    const amount = envelope(p);
    switch (id) {
      case "walk": return walking(pose, p, options);
      case "idle": {
        const breath = Math.sin(p * Math.PI) ** 2 * amount;
        return blend(pose, {
          hip: [0, -19.1], shoulder: [0, -30.55], head: [0, -37.55],
          elbowBack: [-3.5, -25.2], handBack: [-4.4, -20.6],
          elbowFront: [3.3, -25.2], handFront: [4.2, -20.1]
        }, breath);
      }
      case "look": return blend(pose, {
        hip: [.25, -19], shoulder: [.65, -30.2], head: [2.6, -38],
        elbowBack: [-3, -25], handBack: [-3.7, -20.5],
        elbowFront: [3.9, -25], handFront: [4.5, -20]
      }, amount);
      case "think": return blend(pose, {
        shoulder: [.4, -30], head: [1.15, -36.7],
        elbowFront: [6.5, -27], handFront: [2.8, -33.5],
        elbowBack: [-4, -25], handBack: [-3, -21.3]
      }, amount);
      case "stretch": return blend(pose, {
        hip: [0, -19.3], shoulder: [0, -31], head: [0, -38.2],
        elbowBack: [-8, -37], handBack: [-5, -43],
        elbowFront: [8, -37], handFront: [5, -43]
      }, amount);
      case "wave": return blend(pose, {
        shoulder: [.3, -30], head: [.6, -37.2],
        elbowFront: [7.2, -31.5],
        handFront: [9.4 + 2 * Math.sin(p * Math.PI * 6), -39 + .45 * Math.cos(p * Math.PI * 6)]
      }, amount);
      default: return pose;
    }
  };
})();
