/* 人物生命周期离线夹具：只模拟时钟、公开事件及观察器，不读取浏览器或真实凭据。 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const filename = path.resolve(__dirname, "../modules/academic/exploration/walker.js");
const source = fs.readFileSync(filename, "utf8");
let assertions = 0;
const results = [];
function equal(actual, expected, message) { assertions += 1; assert.equal(actual, expected, message); }
function ok(value, message) { assertions += 1; assert.ok(value, message); }
function test(name, run) { run(); results.push(name); }

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  emit(type, event = {}) { [...(this.listeners.get(type) || [])].forEach(handler => handler(event)); }
  count() { return [...this.listeners.values()].reduce((sum, list) => sum + list.size, 0); }
}

class Element {
  constructor() {
    this.dataset = {};
    this.children = [];
    this.values = new Map();
    this.style = {
      getPropertyValue: name => this.values.get(name) || "",
      setProperty: (name, value) => this.values.set(name, String(value)),
      removeProperty: name => this.values.delete(name)
    };
  }
  appendChild(child) { this.children.push(child); child.parent = this; }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
    this.removed = true;
  }
}

function fixture({ intersection = true, resizing = true, legacyPreference = false,
  reduced = false, reducedBoolean = false, fallbackHidden = false,
  initialHash = "#academic", width = 300, mount = true } = {}) {
  const window = new Target();
  const document = new Target();
  const preference = new Target();
  preference.matches = reduced;
  document.hidden = false;
  window.innerWidth = 1440;
  window.innerHeight = 900;
  window.location = { hash: initialHash };
  window.matchMedia = () => preference;
  if (legacyPreference) {
    preference.addEventListener = undefined;
    preference.addListener = handler => Target.prototype.addEventListener.call(preference, "change", handler);
    preference.removeListener = handler => Target.prototype.removeEventListener.call(preference, "change", handler);
  }
  const root = new Element(), walkway = new Element(), walker = new Element(), fallback = new Element();
  fallback.hidden = fallbackHidden;
  walkway.clientWidth = width;
  walker.appendChild(fallback);
  walker.querySelector = selector => selector === "[data-walker-fallback]" ? fallback : null;
  root.querySelector = selector => ({ "[data-scene-walker]": walker, "[data-scene-walkway]": walkway })[selector] || null;
  let box = { width: 1000, height: 600, left: 0, right: 1000, top: 0, bottom: 600 };
  root.getBoundingClientRect = () => box;
  const callbacks = new Map(), canceled = [], microtasks = [], observers = [], resizeObservers = [];
  let frameId = 0;
  window.requestAnimationFrame = callback => { callbacks.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => { canceled.push(id); callbacks.delete(id); };
  window.queueMicrotask = callback => microtasks.push(callback);
  if (intersection) window.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  if (resizing) window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; resizeObservers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const directors = [], figures = [];
  const character = {
    createDirector(options) {
      const state = { options, advances: [], widths: [], phase: 0,
        frame: { x: options.width * .42, progress: 0, action: "walk", facing: 1, pose: {} } };
      const api = {
        getFrame: () => ({ ...state.frame }),
        advance(delta) {
          state.advances.push(delta); state.phase += delta;
          state.frame.progress = state.phase / 10000;
          state.frame.x += delta / 100;
          return this.getFrame();
        },
        resize(nextWidth) {
          state.widths.push(nextWidth);
          state.frame.x = Math.min(state.frame.x, nextWidth);
          return this.getFrame();
        }
      };
      state.api = api; directors.push(state); return api;
    },
    createFigure() {
      const state = { element: new Element(), renders: [], destroys: 0 };
      figures.push(state);
      return {
        element: state.element,
        render: frame => state.renders.push({ ...frame }),
        destroy() { state.destroys += 1; state.element.remove(); }
      };
    }
  };
  const api = { character };
  window.Homepage = { academicExploration: api };
  vm.runInContext(source, vm.createContext({ window, document }), { filename });
  let instance;
  function mountWalker(config = {}) {
    instance = api.mountWalker({ root, config,
      reducedMotion: reducedBoolean ? true : preference });
    return instance;
  }
  if (mount) mountWalker();
  return {
    api, window, document, preference, root, walkway, walker, fallback, callbacks, canceled,
    observers, resizeObservers, directors, figures, mount: mountWalker,
    get instance() { return instance; },
    frame(timestamp) {
      const pending = [...callbacks];
      callbacks.clear();
      pending.forEach(([, callback]) => callback(timestamp));
    },
    visible(active, ratio = active ? 1 : 0) {
      const observer = observers[observers.length - 1];
      observer.callback([{ target: root, isIntersecting: active, intersectionRatio: ratio }]);
    },
    resize(nextWidth) {
      walkway.clientWidth = nextWidth;
      if (resizing) resizeObservers[resizeObservers.length - 1].callback([{ target: walkway }]);
      else window.emit("resize");
    },
    flush() { while (microtasks.length) microtasks.shift()(); },
    setBox(next) { box = next; },
    listenerCount() { return window.count() + document.count() + preference.count(); }
  };
}

try {
  test("加载阶段不访问DOM；缺少挂载节点时安全返回", () => {
    const guard = new Proxy({}, { get() { throw new Error("Unexpected top-level DOM access"); } });
    const window = { Homepage: { academicExploration: {} } };
    vm.runInContext(source, vm.createContext({ window, document: guard }), { filename });
    equal(typeof window.Homepage.academicExploration.mountWalker, "function");
    const missing = window.Homepage.academicExploration.mountWalker({ root: { querySelector: () => null } });
    missing.destroy(); missing.destroy();
    ok(true);
  });

  test("首帧保持姿态、30帧节流和单一RAF链；大卡顿限制推进", () => {
    const f = fixture();
    equal(f.callbacks.size, 0); equal(f.walker.dataset.walkPaused, "true");
    equal(f.directors[0].options.width, 300 - 60 * 40 / 46);
    equal(f.figures[0].renders.length, 1); equal(f.fallback.hidden, true);
    f.visible(true, 0); equal(f.callbacks.size, 1);
    f.frame(0); equal(f.directors[0].advances.length, 0); equal(f.callbacks.size, 1);
    f.frame(20); equal(f.directors[0].advances.length, 0);
    f.frame(40); equal(f.directors[0].advances[0], 40); equal(f.callbacks.size, 1);
    f.window.emit("hashchange"); f.document.emit("visibilitychange");
    equal(f.callbacks.size, 1);
    f.frame(60); equal(f.directors[0].advances.length, 1);
    f.frame(80); equal(f.directors[0].advances[1], 40);
    f.frame(10000); equal(f.directors[0].advances[2], 80);
    equal(f.figures[0].renders.length, 4);
    equal(f.walker.dataset.walkProgress, "0.0160");
    f.instance.destroy(); equal(f.callbacks.size, 0);
  });

  test("离屏及后台暂停冻结片段相位，恢复时不计入隐藏时间", () => {
    const f = fixture(); f.visible(true); f.frame(0); f.frame(40);
    const director = f.directors[0];
    equal(director.phase, 40);
    f.visible(false); equal(f.callbacks.size, 0); equal(f.walker.dataset.walkPaused, "true");
    f.frame(50000); equal(director.phase, 40);
    f.visible(true); f.frame(100000); equal(director.phase, 40);
    f.frame(100040); equal(director.phase, 80);
    f.document.hidden = true; f.document.emit("visibilitychange"); equal(f.callbacks.size, 0);
    f.document.hidden = false; f.document.emit("visibilitychange");
    f.frame(200000); equal(director.phase, 80);
    f.frame(200040); equal(director.phase, 120);
    equal(f.walker.dataset.walkPaused, "false");
    f.instance.destroy();
  });

  test("详情hash、pushState焦点信号、原生关闭微任务及历史恢复", () => {
    const f = fixture(); f.visible(true); f.frame(0); f.frame(40);
    const director = f.directors[0];
    f.window.location.hash = "#academic/experience/author";
    f.document.emit("focusin"); f.flush(); equal(f.callbacks.size, 0);
    equal(director.phase, 40);
    f.document.emit("close");
    f.window.location.hash = "#academic";
    equal(f.callbacks.size, 0);
    f.flush(); equal(f.callbacks.size, 1);
    f.frame(100000); f.frame(100040); equal(director.phase, 80);
    f.window.location.hash = "#life/moments";
    f.window.emit("hashchange"); equal(f.callbacks.size, 0);
    f.window.location.hash = "#academic";
    f.window.emit("popstate"); equal(f.callbacks.size, 1);
    f.window.location.hash = "#academic/notes";
    f.window.emit("popstate"); equal(f.callbacks.size, 0);
    f.instance.destroy();
    const deep = fixture({ initialHash: "#academic/projects", intersection: false });
    equal(deep.callbacks.size, 0); equal(deep.walker.dataset.walkPaused, "true");
    deep.instance.destroy();
  });

  test("系统减少动态效果初始状态、实时变化和旧式监听", () => {
    for (const legacyPreference of [false, true]) {
      const f = fixture({ reduced: true, legacyPreference });
      f.visible(true); equal(f.callbacks.size, 0); equal(f.walker.dataset.walkReduced, "true");
      equal(f.directors[0].advances.length, 0);
      f.preference.matches = false; f.preference.emit("change"); equal(f.callbacks.size, 1);
      f.frame(0); f.frame(40); equal(f.directors[0].phase, 40);
      f.preference.matches = true; f.preference.emit("change"); equal(f.callbacks.size, 0);
      f.preference.matches = false; f.preference.emit("change");
      f.frame(100000); equal(f.directors[0].phase, 40);
      f.frame(100040); equal(f.directors[0].phase, 80);
      f.instance.destroy(); equal(f.listenerCount(), 0);
    }
    const forced = fixture({ reducedBoolean: true });
    forced.visible(true); equal(forced.callbacks.size, 0);
    equal(forced.walker.dataset.walkReduced, "true");
    forced.instance.destroy();
  });

  test("路径缩放保留相位；尺寸参数与窄路径边界", () => {
    const f = fixture(); f.visible(true); f.frame(0); f.frame(40);
    equal(f.resizeObservers[0].target, f.walkway);
    f.resize(220); equal(f.directors[0].widths.at(-1), 220 - 60 * 40 / 46);
    equal(f.directors[0].phase, 40); equal(f.callbacks.size, 1);
    f.resize(25); equal(f.directors[0].widths.at(-1), 0);
    equal(f.walker.style.getPropertyValue("left"), "0px");
    equal(f.walker.style.getPropertyValue("--academic-character-height"), "60px");
    equal(f.walker.style.getPropertyValue("--academic-character-width"), String(60 * 40 / 46) + "px");
    equal(f.walkway.style.getPropertyValue("min-height"), "66px");
    f.instance.destroy();
    const large = fixture({ mount: false });
    large.mount({ walker: { heightPx: 1000 } });
    equal(large.walker.style.getPropertyValue("--academic-character-height"), "72px");
    equal(large.walkway.style.getPropertyValue("min-height"), "78px");
    large.instance.destroy();
    const invalid = fixture({ mount: false });
    invalid.mount({ walker: { heightPx: NaN } });
    equal(invalid.walker.style.getPropertyValue("--academic-character-height"), "60px");
    invalid.instance.destroy();
  });

  test("无观察器时使用滚动和窗口缩放降级，仍保持单帧链", () => {
    const f = fixture({ intersection: false, resizing: false });
    equal(f.callbacks.size, 1); f.frame(0); f.frame(40);
    f.setBox({ width: 1000, height: 600, left: 0, right: 1000, top: 950, bottom: 1550 });
    f.window.emit("scroll"); equal(f.callbacks.size, 0);
    f.setBox({ width: 1000, height: 600, left: 0, right: 1000, top: 0, bottom: 600 });
    f.resize(200); equal(f.callbacks.size, 1);
    equal(f.directors[0].widths.at(-1), 200 - 60 * 40 / 46); equal(f.directors[0].phase, 40);
    f.frame(100000); equal(f.directors[0].phase, 40);
    f.instance.destroy(); equal(f.listenerCount(), 0);
  });

  test("往返缓存离开取消时钟；恢复不补算页面离开时间", () => {
    const f = fixture(); f.visible(true); f.frame(0); f.frame(40);
    f.document.emit("focusin"); f.document.emit("close");
    f.window.emit("pagehide"); equal(f.callbacks.size, 0);
    equal(f.walker.dataset.walkPaused, "true");
    // pagehide与visibilitychange之间仍可能存在排队焦点微任务或观察器回调。
    f.flush(); equal(f.callbacks.size, 0);
    f.resize(240); f.visible(true); f.document.emit("visibilitychange");
    f.window.emit("hashchange"); equal(f.callbacks.size, 0);
    equal(f.directors[0].phase, 40);
    f.window.emit("pageshow"); equal(f.callbacks.size, 1);
    f.document.emit("visibilitychange"); f.visible(true); equal(f.callbacks.size, 1);
    f.frame(500000); equal(f.directors[0].phase, 40);
    f.frame(500040); equal(f.directors[0].phase, 80);
    f.instance.destroy();
  });

  test("重复卸载、迟到回调、重挂载和原始回退/内联样式恢复", () => {
    const f = fixture({ mount: false, fallbackHidden: true });
    f.walker.style.setProperty("--academic-character-height", "44px");
    f.walker.style.setProperty("--academic-character-width", "38px");
    f.walker.style.setProperty("left", "11px");
    f.walkway.style.setProperty("min-height", "71px");
    const first = f.mount(); f.visible(true); f.frame(0); f.frame(40);
    const lateFrame = [...f.callbacks.values()][0];
    const second = f.mount();
    equal(f.figures[0].destroys, 1); equal(f.observers[0].disconnected, true);
    equal(f.resizeObservers[0].disconnected, true); equal(f.callbacks.size, 0);
    equal(f.walker.children.length, 2); first.destroy();
    equal(f.figures[1].destroys, 0); equal(f.fallback.hidden, true);
    f.visible(true); equal(f.callbacks.size, 1);
    f.document.emit("close"); second.destroy(); second.destroy(); f.flush();
    lateFrame(900000); f.observers[1].callback([{ target: f.root, isIntersecting: true }]);
    f.resizeObservers[1].callback([{ target: f.walkway }]);
    equal(f.callbacks.size, 0); equal(f.listenerCount(), 0);
    equal(f.figures[1].destroys, 1); equal(f.walker.children.length, 1);
    equal(f.fallback.hidden, true);
    equal(f.walker.style.getPropertyValue("--academic-character-height"), "44px");
    equal(f.walker.style.getPropertyValue("--academic-character-width"), "38px");
    equal(f.walker.style.getPropertyValue("left"), "11px");
    equal(f.walkway.style.getPropertyValue("min-height"), "71px");
    equal(Object.keys(f.walker.dataset).length, 0);
    const visibleFallback = fixture(); visibleFallback.instance.destroy();
    equal(visibleFallback.fallback.hidden, false);
    equal(visibleFallback.walker.style.getPropertyValue("left"), "");
    equal(visibleFallback.walkway.style.getPropertyValue("min-height"), "");
    ok(f.canceled.length >= 2);
  });

  console.log(JSON.stringify({ suite: "walker-lifecycle", workflows: results.length, assertions, results,
    limitations: "Node VM离线事件和时钟夹具；不代表真实浏览器、手机、系统动态偏好、SVG观感或线上部署实测。" }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
