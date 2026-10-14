/* 粒子核心离线回归：仅加载本地源码和内存夹具，无浏览器、网络、外部依赖或文件写入。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {performance} = require("node:perf_hooks");

const root = path.resolve(__dirname, "..");
const environment = vm.createContext({window: {Homepage: {}}, performance});
for (const name of ["config", "simulation"]) {
  const filename = path.join(root, "modules/particle-background", name + ".js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), environment, {filename});
}
const api = environment.window.Homepage;
const config = api.particleConfig;
let assertions = 0;
const results = [];

// 只通过这三个包装执行断言，最后的数字是实际成功断言数。
function ok(value, message) { assert.ok(value, message); assertions += 1; }
function equal(actual, expected, message) { assert.deepStrictEqual(actual, expected, message); assertions += 1; }
function rejects(task, message) { assert.throws(task, message); assertions += 1; }
function test(name, task) {
  const before = assertions;
  task();
  results.push({name, assertions: assertions - before});
}
function random(seed = 7) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}
function create(patch = {}, count = 400, width = 1440, height = 900, seed = 7) {
  return api.createDustSimulation({config: patch, count, width, height, random: random(seed)});
}
function snapshot(simulation) {
  // 正负零具有相同运动意义；避免把初始 -0 到 +0 当作漂移。
  return Object.fromEntries(["x", "y", "vx", "vy", "size", "alpha"]
    .map(key => [key, Array.from(simulation.particles[key], value => value === 0 ? 0 : value)]));
}
function advance(simulation, frames, pointer = null, start = 0) {
  for (let frame = 0; frame < frames; frame += 1) simulation.step(1 / 45, pointer, start + frame / 45);
}

try {
  test("配置类型、范围、冻结与合并", () => {
    ok(Object.isFrozen(config)); ok(Object.isFrozen(config.defaults)); ok(Object.isFrozen(config.normalize({})));
    equal(config.defaults.count, 4800); equal(config.defaults.mobileCount, 1400); equal(config.defaults.averageSpeed, 22);
    const patch = {opacity: 0.3}, base = {count: 700};
    const merged = config.normalize(patch, base);
    equal(merged.opacity, 0.3); equal(merged.count, 700); equal(merged.fps, 45);
    equal(patch, {opacity: 0.3}); equal(base, {count: 700});
    for (const invalid of [null, [], 3, "enabled", {unknown: 1}, {[Symbol("unknown")]: 1},
      {enabled: 1}, {adaptiveQuality: "true"}, {count: 3.5}, {mobileCount: 1.5}, {minSize: 2, maxSize: 1}]) {
      rejects(() => config.normalize(invalid));
    }
    const ranges = {
      count: [0, 12000], mobileCount: [0, 4000], averageSpeed: [0, 160],
      minSize: [0.15, 3], maxSize: [0.15, 3], opacity: [0, 1],
      interactionRadius: [20, 450], interactionStrength: [0, 5],
      alignment: [0, 3], cohesion: [0, 3], separation: [0, 3],
      flowScale: [50, 800], turbulence: [0, 3], fps: [15, 60], maxPixelRatio: [1, 2]
    };
    for (const [key, [minimum, maximum]] of Object.entries(ranges)) {
      for (const value of [NaN, Infinity, -Infinity, minimum - 1, maximum + 1, "1"]) {
        rejects(() => config.normalize({[key]: value}));
      }
    }
    equal(config.normalize({minSize: 0.15, maxSize: 3, count: 0, mobileCount: 0}).count, 0);
    equal(config.normalize({minSize: 3, maxSize: 3, count: 12000, mobileCount: 4000}).maxSize, 3);
    rejects(() => config.normalize({}, {unknown: 1}));
  });

  test("桌面密度、手机上限与明确关闭", () => {
    equal(config.effectiveCount(config.defaults, 1440, 900), 4800);
    equal(config.effectiveCount(config.defaults, 390, 844), 1400);
    equal(config.effectiveCount(config.defaults, 320, 780), 1400);
    equal(config.effectiveCount(config.defaults, 1440, 900, true), 1400);
    equal(config.effectiveCount(config.normalize({count: 12000}), 3000, 2000), 12000);
    equal(config.effectiveCount(config.normalize({count: 0}), 390, 844), 0);
    equal(config.effectiveCount(config.normalize({enabled: false}), 1440, 900), 0);
    equal(config.effectiveCount(config.normalize({mobileCount: 0}), 390, 844), 0);
    equal(config.effectiveCount(config.defaults, 0, 0), 0);
    for (const dimensions of [[-1, 900], [1440, NaN], [Infinity, 900]]) {
      rejects(() => config.effectiveCount(config.defaults, ...dimensions));
    }
  });

  test("固定种子与各视口的有限环绕", () => {
    for (const [width, height] of [[1440, 900], [390, 844], [320, 780], [1, 1], [99999, 2]]) {
      const a = create({}, 250, width, height), b = create({}, 250, width, height);
      for (let frame = 0; frame < 120; frame += 1) {
        const pointer = frame < 60 ? {x: width * 0.4, y: height * 0.6, vx: 700, vy: -400, active: true} : null;
        a.step(1 / 45, pointer, frame / 45); b.step(1 / 45, pointer, frame / 45);
      }
      equal(snapshot(a), snapshot(b)); ok(a.stats().finite); ok(a.stats().gridCells <= 65536);
      ok(Number.isFinite(a.stats().meanSpeed) && Number.isFinite(a.stats().maxSpeed));
      a.dispose(); b.dispose();
    }
    const a = create({}, 100, 1440, 900, 7), b = create({}, 100, 1440, 900, 8);
    ok(a.particles.x.some((position, index) => position !== b.particles.x[index]));
    a.dispose(); b.dispose();
  });

  test("三个局部聚合参数分别改变轨迹", () => {
    for (const parameter of ["alignment", "cohesion", "separation"]) {
      const plain = create({alignment: 0, cohesion: 0, separation: 0});
      const local = create({alignment: 0, cohesion: 0, separation: 0, [parameter]: 3});
      advance(plain, 30); advance(local, 30);
      ok(plain.particles.x.some((position, index) => Math.abs(position - local.particles.x[index]) > 0.001), parameter);
      ok(local.stats().finite); plain.dispose(); local.dispose();
    }
  });

  test("零速度静止、局部手势与释放恢复", () => {
    const still = create({averageSpeed: 0}), pointerView = create({averageSpeed: 0});
    const before = snapshot(still);
    advance(still, 60);
    equal(snapshot(still), before); equal(still.stats().meanSpeed, 0);
    const pointer = {x: 720, y: 450, vx: 800, vy: 500, active: true};
    still.step(0.05, null, 2); pointerView.step(0.05, pointer, 2);
    let insideMoved = 0, outsideMoved = 0, outside = 0;
    for (let index = 0; index < still.particles.count; index += 1) {
      const distance = Math.hypot(still.particles.x[index] - pointer.x, still.particles.y[index] - pointer.y);
      const moved = still.particles.x[index] !== pointerView.particles.x[index]
        || still.particles.y[index] !== pointerView.particles.y[index];
      if (distance < config.defaults.interactionRadius) { if (moved) insideMoved += 1; }
      else { outside += 1; if (moved) outsideMoved += 1; }
    }
    ok(insideMoved > 0); ok(outside > 0); equal(outsideMoved, 0); ok(pointerView.stats().meanSpeed > 0);
    advance(pointerView, 300, null, 3);
    ok(pointerView.stats().meanSpeed < 0.000001); ok(pointerView.stats().finite);
    const moving = create(); advance(moving, 30); moving.updateConfig({averageSpeed: 0});
    equal(moving.stats().meanSpeed, 0);
    const stopped = snapshot(moving); advance(moving, 6); equal(snapshot(moving), stopped);
    moving.updateConfig({averageSpeed: 22}); advance(moving, 180);
    ok(moving.stats().meanSpeed > 17 && moving.stats().meanSpeed < 27);
    moving.dispose(); still.dispose(); pointerView.dispose();
  });

  test("滚动偏移后屏幕坐标的局部指针作用、双向环绕与确定性", () => {
    // 单粒子且平均速度为零，把正常流场和邻域耦合排除；只改变公开数组中的内存夹具位置。
    const stationary = {averageSpeed: 0, interactionRadius: 20, alignment: 0, cohesion: 0, separation: 0};
    const cases = [
      {name: "跨多页纵向滚动", position: [150, 150], offset: [0, -1550], screen: [140, 100], logical: [140, 150], wrong: [140, 150]},
      {name: "视口内部", position: [150, 150], offset: [80, -60], screen: [220, 90], logical: [140, 150], wrong: [140, 150]},
      {name: "右侧与上侧环绕", position: [395, 5], offset: [20, -20], screen: [25, 285], logical: [405, 5], wrong: [385, 5]},
      {name: "左侧与下侧环绕", position: [5, 295], offset: [-20, 20], screen: [375, 15], logical: [-5, 295], wrong: [15, 295]}
    ];
    for (const fixture of cases) {
      const simulations = Array.from({length: 5}, () => create(stationary, 1, 400, 300));
      const [corrected, repeated, uncorrected, wrongScreen, logicalReference] = simulations;
      for (const simulation of simulations) {
        simulation.particles.x[0] = fixture.position[0]; simulation.particles.y[0] = fixture.position[1];
      }
      const initial = snapshot(corrected);
      const gesture = {vx: 600, vy: 300, active: true};
      const visiblePointer = {...gesture, x: fixture.screen[0], y: fixture.screen[1],
        offsetX: fixture.offset[0], offsetY: fixture.offset[1]};
      corrected.step(0.05, visiblePointer, 1); repeated.step(0.05, visiblePointer, 1);
      uncorrected.step(0.05, {...gesture, x: fixture.screen[0], y: fixture.screen[1]}, 1);
      wrongScreen.step(0.05, {...visiblePointer, x: fixture.wrong[0], y: fixture.wrong[1]}, 1);
      logicalReference.step(0.05, {...gesture, x: fixture.logical[0], y: fixture.logical[1]}, 1);
      ok(corrected.stats().meanSpeed > 0, fixture.name + "：可见位置附近受到扰动");
      ok(corrected.particles.x[0] !== initial.x[0] || corrected.particles.y[0] !== initial.y[0], fixture.name);
      equal(snapshot(corrected), snapshot(repeated), fixture.name + "：重复输入确定性");
      equal(snapshot(corrected), snapshot(logicalReference), fixture.name + "：等价的局部距离");
      equal(snapshot(uncorrected), initial, fixture.name + "：缺少屏幕坐标校正时没有假互动");
      equal(snapshot(wrongScreen), initial, fixture.name + "：不同屏幕位置不受扰动");
      ok(simulations.every(simulation => simulation.stats().finite), fixture.name + "：坐标与速度保持有限");
      simulations.forEach(simulation => simulation.dispose());
    }
  });

  test("缺省、undefined 和零滚动偏移保留旧指针行为", () => {
    const legacy = create({averageSpeed: 0}), omitted = create({averageSpeed: 0}), zero = create({averageSpeed: 0});
    const pointer = {x: 720, y: 450, vx: 800, vy: 500, active: true};
    advance(legacy, 45, pointer);
    advance(omitted, 45, {...pointer, offsetX: undefined, offsetY: undefined});
    advance(zero, 45, {...pointer, offsetX: 0, offsetY: 0});
    ok(legacy.stats().meanSpeed > 0);
    equal(snapshot(omitted), snapshot(legacy)); equal(snapshot(zero), snapshot(legacy));
    ok([legacy, omitted, zero].every(simulation => simulation.stats().finite));
    legacy.dispose(); omitted.dispose(); zero.dispose();
  });

  test("步长上限、最大参数与输入拒绝", () => {
    const a = create(), b = create(); a.step(1, null, 1); b.step(0.05, null, 1);
    equal(snapshot(a), snapshot(b));
    const before = snapshot(a); a.step(0, null, 2); equal(snapshot(a), before);
    for (const invalid of [NaN, Infinity, -1]) rejects(() => a.step(invalid));
    rejects(() => a.step(0.01, null, Infinity));
    const disabled = create({enabled: false}), idle = snapshot(disabled);
    disabled.step(0.05, {x: 720, y: 450, vx: 3000, vy: 1000, active: true}, 1);
    equal(snapshot(disabled), idle);
    const extreme = create({count: 12000, averageSpeed: 160, minSize: 0.15, maxSize: 3,
      interactionRadius: 450, interactionStrength: 5, alignment: 3, cohesion: 3,
      separation: 3, flowScale: 50, turbulence: 3}, 12000);
    advance(extreme, 80, {x: 720, y: 450, vx: 3000, vy: -3000, active: true});
    ok(extreme.stats().finite); equal(extreme.stats().count, 12000);
    ok(Number.isFinite(extreme.stats().meanSpeed) && Number.isFinite(extreme.stats().maxSpeed));
    const normal = create({}, 4800); advance(normal, 180);
    ok(normal.stats().meanSpeed > 17 && normal.stats().meanSpeed < 27);
    ok(normal.stats().finite);
    for (const dimensions of [[0, 900], [Infinity, 900], [1440, -1], [100001, 1]]) {
      rejects(() => create({}, 1, ...dimensions));
    }
    for (const count of [-1, 12001, 1.5]) rejects(() => create({}, count));
    rejects(() => api.createDustSimulation({width: 1, height: 1, random: 1}));
    rejects(() => api.createDustSimulation({width: 1, height: 1, random: () => NaN}));
    rejects(() => api.createDustSimulation({width: 1, height: 1, random: () => 1.1}));
    a.dispose(); b.dispose(); disabled.dispose(); extreme.dispose(); normal.dispose();
  });

  test("调整尺寸与数量、配置原子性、销毁", () => {
    const simulation = create();
    ok(Object.isFrozen(simulation)); ok(Object.isFrozen(simulation.particles)); ok(Object.isFrozen(simulation.stats()));
    for (const key of ["x", "y", "vx", "vy", "size", "alpha"]) {
      equal(Object.prototype.toString.call(simulation.particles[key]), "[object Float32Array]");
      equal(simulation.particles[key].length, 400);
    }
    const initial = snapshot(simulation);
    rejects(() => simulation.updateConfig({count: NaN})); equal(snapshot(simulation), initial);
    const beforeX = simulation.particles.x[0], beforeY = simulation.particles.y[0];
    simulation.resize(390, 844, 700);
    equal(simulation.particles.count, 700); equal(simulation.stats().width, 390); equal(simulation.stats().height, 844);
    ok(Math.abs(simulation.particles.x[0] - beforeX * 390 / 1440) < 0.001);
    ok(Math.abs(simulation.particles.y[0] - beforeY * 844 / 900) < 0.001); ok(simulation.stats().finite);
    simulation.resize(320, 780); equal(simulation.particles.count, 700);
    simulation.updateConfig({count: 900}); equal(simulation.particles.count, 700);
    simulation.updateConfig({minSize: 1, maxSize: 2});
    ok(simulation.particles.size.every(value => value >= 1 && value <= 2));
    simulation.resize(320, 780, 0); simulation.step(0.05, null, 1);
    equal(simulation.particles.count, 0); equal(simulation.stats().meanSpeed, 0); ok(simulation.stats().finite);
    simulation.resize(1440, 900, 50); equal(simulation.particles.count, 50); ok(simulation.stats().finite);
    const beforeInvalidResize = snapshot(simulation);
    rejects(() => simulation.resize(0, 900, 10)); equal(snapshot(simulation), beforeInvalidResize);
    const arrays = Object.values(simulation.particles).filter(ArrayBuffer.isView);
    simulation.dispose(); simulation.dispose();
    ok(arrays.every(array => array.every(value => value === 0)));
    equal(simulation.particles.count, 0); equal(simulation.stats().disposed, true); equal(simulation.stats().gridCells, 0);
    rejects(() => simulation.step(0.01)); rejects(() => simulation.resize(1, 1));
    rejects(() => simulation.updateConfig({opacity: 0.5}));
  });

  process.stdout.write(JSON.stringify({date: new Date().toISOString(), node: process.version,
    status: "通过", assertions, groups: results,
    scope: "离线配置与模拟核心；不验证浏览器绘制、页面兼容性或帧率。"}, null, 2) + "\n");
} catch (error) {
  process.stderr.write("粒子核心回归失败，已通过断言 " + assertions + " 项。\n" + error.stack + "\n");
  process.exitCode = 1;
}
