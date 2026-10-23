/* 人物动作离线验证：关节素材、随机编排、边界转身、响应式重定位与 SVG 渲染。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sourceRoot = path.resolve(__dirname, "..", "modules", "academic", "exploration", "character");
let assertions = 0;
const results = [];
const equal = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const near = (actual, expected, tolerance = 1e-8, message = "") =>
  ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} ≈ ${expected}`);
const plain = value => JSON.parse(JSON.stringify(value));
function test(name, task) {
  const before = assertions;
  task();
  results.push({ name, assertions: assertions - before });
}
class SvgNode {
  constructor(name) { this.name = name; this.attributes = {}; this.children = []; this.removed = false; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  appendChild(child) { this.children.push(child); }
  remove() { this.removed = true; }
}
function fixture() {
  const window = { Homepage: { academicExploration: {} } };
  const document = { createElementNS: (_, name) => new SvgNode(name) };
  const context = vm.createContext({ window, document });
  ["clips", "director", "figure"].forEach(name => {
    const filename = path.join(sourceRoot, name + ".js");
    vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  });
  return window.Homepage.academicExploration.character;
}
function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
}
function finish(director) {
  const before = director.getFrame();
  const after = director.advance(0.125);
  if (after.action !== before.action) return after;
  const duration = 0.125 / (after.progress - before.progress);
  return director.advance((1 - after.progress) * duration + 0.01);
}
function validFrame(frame, width) {
  return Number.isFinite(frame.x) && frame.x >= 0 && frame.x <= width
    && Number.isFinite(frame.facing) && Math.abs(frame.facing) <= 1
    && Number.isFinite(frame.progress) && frame.progress >= 0 && frame.progress <= 1
    && Object.values(frame.pose).every(point => point.length === 2 && point.every(Number.isFinite));
}
function distance(a, b) {
  return Math.max(...Object.keys(a).map(key => Math.hypot(a[key][0] - b[key][0], a[key][1] - b[key][1])));
}

try {
  test("素材登记、端点站姿、无共享坐标突变与异常输入回退", () => {
    const api = fixture();
    equal(plain(api.clips.map(clip => clip.id)), ["walk", "idle", "look", "think", "stretch", "wave", "turn"]);
    ok(Object.isFrozen(api.clips));
    for (const clip of api.clips) {
      ok(clip.duration.every(value => Number.isFinite(value) && value > 0));
      equal(plain(api.sampleClip(clip.id, 0)), plain(api.neutralPose));
      equal(plain(api.sampleClip(clip.id, 1)), plain(api.neutralPose));
      ok(distance(api.sampleClip(clip.id, 0.0001), api.neutralPose) < 1e-5, clip.id + " smooth entry");
      ok(distance(api.sampleClip(clip.id, 0.9999), api.neutralPose) < 1e-5, clip.id + " smooth exit");
    }
    const mutated = api.sampleClip("wave", 0);
    mutated.head[0] = 999;
    equal(api.neutralPose.head[0], 0);
    equal(plain(api.sampleClip("unknown", 0.5)), plain(api.neutralPose));
    for (const progress of [NaN, Infinity, -Infinity, -1, 2]) {
      equal(plain(api.sampleClip("walk", progress)), plain(api.neutralPose));
    }
  });

  test("全部动作连续采样有限、脚不穿地、静态片段脚底不滑", () => {
    const api = fixture();
    const failures = [];
    let grounded = true;
    let stationary = true;
    let moving = true;
    for (const clip of api.clips) {
      let changes = 0;
      for (let index = 0; index <= 240; index += 1) {
        const p = index / 240;
        const pose = api.sampleClip(clip.id, p, { cycles: 7 });
        if (!Object.values(pose).every(point => point.length === 2 && point.every(Number.isFinite))) failures.push(clip.id);
        grounded &&= pose.footBack[1] <= 1e-9 && pose.footFront[1] <= 1e-9
          && Math.max(pose.footBack[1], pose.footFront[1]) >= -1e-9;
        if (clip.id !== "walk") stationary &&= distance({ footBack: pose.footBack, footFront: pose.footFront },
          { footBack: api.neutralPose.footBack, footFront: api.neutralPose.footFront }) === 0;
        if (distance(pose, api.neutralPose) > 0.05) changes += 1;
      }
      if (clip.id !== "turn") moving &&= changes > 50;
    }
    equal(failures, []);
    ok(grounded, "at least one foot contacts ground and no foot penetrates it");
    ok(stationary, "all stationary actions retain their original planted feet");
    ok(moving, "each ordinary action visibly changes its pose");
  });

  test("初始位置、步态整数周期、配置速度与平滑起停", () => {
    const api = fixture();
    const calls = [];
    const sample = api.sampleClip;
    api.sampleClip = (id, progress, options) => { calls.push({ id, progress, cycles: options.cycles }); return sample(id, progress, options); };
    const director = api.createDirector({ width: 1000, random: () => 0 });
    const start = director.getFrame();
    equal(start.action, "walk"); equal(start.progress, 0); near(start.x, 420); equal(start.facing, 1);
    equal(plain(start.pose), plain(api.neutralPose));
    const first = director.advance(1);
    ok(first.x - start.x < 0.00001, "walk begins with negligible velocity");
    director.advance(2498);
    const middle = director.getFrame();
    const middleNext = director.advance(1);
    near((middleNext.x - middle.x) * 1000, 24 / 0.85, 0.001, "cruise velocity matches the gait envelope");
    director.advance(2499);
    const last = director.getFrame();
    const next = director.advance(1);
    near(next.x, 540, 1e-7, "configured average speed moves 120 px over five seconds");
    ok(next.x - last.x < 0.00001, "walk ends at rest");
    ok(next.action !== "walk");
    equal(plain(next.pose), plain(api.neutralPose));
    ok(calls.filter(call => call.id === "walk").every(call => Number.isInteger(call.cycles) && call.cycles >= 1));
    const fast = api.createDirector({ width: 1000, config: { speedPxPerSecond: 48 }, random: () => 0 });
    near(fast.advance(5000).x, 660, 1e-7);
    const slow = api.createDirector({ width: 1000, config: { durationScale: 2 }, random: () => 0 });
    near(slow.advance(5000).progress, 0.5);
  });

  test("手机短路径收步后显式转身，再反向行走", () => {
    const api = fixture();
    const director = api.createDirector({ width: 16, random: () => 0 });
    const before = director.advance(999);
    ok(before.x < 16); equal(before.action, "walk"); equal(before.facing, 1);
    const rest = director.advance(1);
    equal(rest.action, "idle"); near(rest.x, 16); equal(rest.facing, 1);
    const turnStart = director.advance(1600);
    equal(turnStart.action, "turn"); near(turnStart.x, 16); equal(turnStart.facing, 1);
    equal(plain(turnStart.pose), plain(api.neutralPose));
    const turnMiddle = director.advance(450);
    equal(turnMiddle.action, "turn"); near(turnMiddle.x, 16); near(turnMiddle.facing, 0);
    equal(plain(turnMiddle.pose), plain(api.neutralPose));
    const resumed = director.advance(450);
    equal(resumed.action, "walk"); near(resumed.x, 16); equal(resumed.facing, -1);
    equal(plain(resumed.pose), plain(api.neutralPose));
    const left = director.advance(500);
    ok(left.x < resumed.x); equal(left.facing, -1);
    const seen = new Set();
    for (let index = 0; index < 100; index += 1) { seen.add(director.getFrame().action); finish(director); }
    ok(seen.has("idle"), "narrow paths keep the stationary library, rather than only walking and turning");
    ok(seen.has("turn") && seen.has("walk"));
  });

  test("每种静态动作保持地面锚点，并经共同站姿接回步行", () => {
    const api = fixture();
    for (const id of ["idle", "look", "think", "stretch", "wave"]) {
      const weights = Object.fromEntries(["walk", "idle", "look", "think", "stretch", "wave"].map(key => [key, key === id ? 1 : 0]));
      const director = api.createDirector({ width: 1000, config: { weights }, random: () => 0 });
      const entered = finish(director);
      equal(entered.action, id);
      const initialX = entered.x;
      const range = api.clips.find(clip => clip.id === id).duration;
      const middle = director.advance(range[0] * 0.5);
      equal(middle.action, id); near(middle.x, initialX);
      equal(plain(middle.pose.footBack), plain(api.neutralPose.footBack));
      equal(plain(middle.pose.footFront), plain(api.neutralPose.footFront));
      const next = finish(director);
      ok(next.action !== id);
      near(next.x, initialX, 1e-7);
      ok(distance(next.pose, api.neutralPose) < 1e-7);
    }
  });

  test("权重抽样不连续重复，至多两个静态片段后恢复步行", () => {
    const api = fixture();
    const director = api.createDirector({ width: 5000, config: { weights: {
      walk: 0, idle: 0, look: 0, think: 0, stretch: 0, wave: 1
    } }, random: () => 0 });
    const sequence = [director.getFrame().action];
    for (let index = 0; index < 6; index += 1) sequence.push(finish(director).action);
    equal(sequence, ["walk", "wave", "idle", "walk", "wave", "idle", "walk"]);
    const varied = api.createDirector({ width: 800, random: seeded(187) });
    const seen = new Set();
    let previous = null;
    let staticStreak = 0;
    let compliant = true;
    for (let index = 0; index < 160; index += 1) {
      const frame = varied.getFrame();
      seen.add(frame.action);
      compliant &&= previous !== frame.action;
      if (frame.action === "walk" || frame.action === "turn") staticStreak = 0;
      else staticStreak += 1;
      compliant &&= staticStreak <= 2;
      previous = frame.action;
      finish(varied);
    }
    equal([...seen].sort(), ["idle", "look", "stretch", "think", "turn", "walk", "wave"].sort());
    ok(compliant);
  });

  test("片段接点位置与姿态连续，长时钟无瞬移或反向翻面", () => {
    const api = fixture();
    const director = api.createDirector({ width: 64, random: seeded(47) });
    let previous = director.getFrame();
    let valid = true;
    let safeDisplacement = true;
    let safeFacing = true;
    let neutralSwitch = true;
    let lastProgress = previous.progress;
    for (let tick = 0; tick < 36000; tick += 1) {
      const frame = director.advance(50);
      valid &&= validFrame(frame, 64);
      safeDisplacement &&= Math.abs(frame.x - previous.x) <= 24 / .85 * .05 + 1e-6;
      safeFacing &&= frame.facing === previous.facing || frame.action === "turn" || previous.action === "turn";
      if (frame.action !== previous.action) {
        // 50ms跨接点的姿态应接近共同站姿，不能直接跳到下一动作中间。
        neutralSwitch &&= distance(frame.pose, api.neutralPose) < 1;
        ok(frame.progress < .057, "transition never begins in the middle of a clip");
      } else if (frame.progress < lastProgress) {
        valid = false;
      }
      previous = frame;
      lastProgress = frame.progress;
    }
    ok(valid); ok(safeDisplacement); ok(safeFacing); ok(neutralSwitch);
  });

  test("缩放保留动作相位、姿态和朝向，必要时重定剩余位移", () => {
    const api = fixture();
    const director = api.createDirector({ width: 500, random: () => 0 });
    const before = director.advance(2000);
    const wider = director.resize(800);
    near(wider.x, before.x); equal(wider.progress, before.progress);
    equal(plain(wider.pose), plain(before.pose)); equal(wider.facing, before.facing);
    const width = before.x + 10;
    const narrower = director.resize(width);
    near(narrower.x, before.x); equal(narrower.progress, before.progress);
    equal(plain(narrower.pose), plain(before.pose));
    let bounded = true;
    for (let index = 0; index < 500; index += 1) bounded &&= validFrame(director.advance(20), width);
    ok(bounded);
    const zero = director.resize(0);
    equal(zero.x, 0); ok(validFrame(zero, 0));
    for (let index = 0; index < 20; index += 1) ok(validFrame(director.advance(1000), 0));
    director.resize(30);
    let hasWalk = false;
    for (let index = 0; index < 200; index += 1) hasWalk ||= director.advance(100).action === "walk";
    ok(hasWalk, "expanding a zero-width path eventually permits walking again");
  });

  test("无效随机源、配置与路径宽度安全降级，超大时间差有界", () => {
    const api = fixture();
    for (const random of [() => NaN, () => Infinity, () => -Infinity, () => -8, () => 9, () => { throw new Error("fixture"); }, null]) {
      for (const width of [0, .001, 16, 64, 500, NaN, Infinity, -20]) {
        const director = api.createDirector({ width, random, config: {
          speedPxPerSecond: NaN, stepDurationMs: -1, durationScale: Infinity, turnDurationMs: 0,
          weights: { walk: 0, idle: 0, look: 0, think: 0, stretch: 0, wave: 0 }
        } });
        const expectedWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
        for (const delta of [-1, NaN, Infinity, 0, 1000, 1e15]) ok(validFrame(director.advance(delta), expectedWidth));
      }
    }
    const director = api.createDirector({ width: 64, random: seeded(7) });
    const initial = plain(director.getFrame());
    director.advance(NaN); director.advance(-1); director.advance(Infinity);
    equal(plain(director.getFrame()), initial);
    ok(validFrame(director.resize(Infinity), 0));
  });

  test("SVG骨架渲染、连续朝向、坏坐标回退与幂等卸载", () => {
    const api = fixture();
    const figure = api.createFigure();
    equal(figure.element.attributes.viewBox, "-20 -46 40 46");
    equal(figure.element.attributes["aria-hidden"], "true");
    equal(figure.element.attributes.focusable, "false");
    const head = figure.element.children.find(node => node.attributes["data-character-part"] === "head");
    const pose = api.sampleClip("look", .5);
    figure.render({ pose, facing: 1 }); const right = Number(head.attributes.cx);
    figure.render({ pose, facing: .5 }); near(Number(head.attributes.cx), right * .5);
    figure.render({ pose, facing: -1 }); near(Number(head.attributes.cx), -right);
    figure.render({ pose: { head: [NaN, Infinity] }, facing: NaN });
    ok(figure.element.children.every(node => Object.values(node.attributes).every(value => !/NaN|Infinity|undefined/.test(value))));
    const snapshot = JSON.stringify(figure.element.attributes);
    figure.destroy(); figure.destroy(); figure.render({ pose, facing: 1 });
    equal(figure.element.removed, true);
    equal(JSON.stringify(figure.element.attributes), snapshot);
  });

  console.log(JSON.stringify({ suite: "walker-actions", workflows: results.length, assertions, results,
    limitations: "Node VM离线夹具；不代表浏览器布局、动画观感、真机或系统动态偏好实测。" }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
