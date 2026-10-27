/* 学术场景离线回归：使用内存 DOM、时钟与服务夹具，不访问浏览器、网络或真实文章。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourceRoot = path.resolve(__dirname, "../..", "modules", "academic", "exploration");
const keys = ["experience", "publications", "notes", "projects"];
let assertions = 0;
const results = [];
function equal(actual, expected, message) { assert.deepStrictEqual(actual, expected, message); assertions += 1; }
function ok(value, message) { assert.ok(value, message); assertions += 1; }
function test(name, task) {
  const before = assertions;
  task();
  results.push({ name, assertions: assertions - before });
}

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options) {
    const list = this.listeners.get(type) || [];
    list.push({ fn, capture: typeof options === "boolean" ? options : Boolean(options?.capture) });
    this.listeners.set(type, list);
  }
  removeEventListener(type, fn, options) {
    const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
    this.listeners.set(type, (this.listeners.get(type) || [])
      .filter(item => item.fn !== fn || item.capture !== capture));
  }
  emit(type, event = {}) {
    (this.listeners.get(type) || []).slice().forEach(item => item.fn(event));
  }
  listenerCount() { return [...this.listeners.values()].reduce((sum, list) => sum + list.length, 0); }
}
class Element extends Target {
  constructor(dataset = {}) {
    super();
    this.dataset = dataset;
    this.attrs = {};
    this.textContent = "";
    this.disabled = false;
    this.hidden = false;
    this.focusVisible = false;
    this.box = { width: 800, height: 450, top: 100, left: 100, bottom: 550, right: 900 };
    this.classes = new Set();
    this.children = [];
    this.classList = { toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name) };
  }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; }
  contains(node) { return node === this || this.children.includes(node); }
  matches(selector) { return selector === ":focus-visible" && this.focusVisible; }
  getBoundingClientRect() { return this.box; }
}

function fixture({ intervalMs, intersectionObserver = true, legacyPreference = false, mount = true } = {}) {
  const buttons = keys.map(key => new Element({ academic: key }));
  const images = keys.map(key => new Element({ preview: key }));
  const steps = keys.map(key => new Element({ sceneStep: key }));
  const fields = Object.fromEntries(["title", "description", "index", "explore", "open"]
    .map(key => [key, new Element()]));
  const featured = { link: new Element(), title: new Element(), metadata: new Element() };
  const root = new Element();
  root.querySelectorAll = selector => ({
    "[data-academic]": buttons, "[data-preview]": images, "[data-scene-step]": steps
  })[selector] || [];
  root.querySelector = selector => ({
    "#academic-featured-publication": featured.link,
    "#academic-publication-title": featured.title,
    "#academic-publication-meta": featured.metadata
  })[selector] || fields[selector.slice("[data-scene-".length, -1)] || null;
  let box = { width: 1000, height: 600, top: 0, left: 0, bottom: 600, right: 1000 };
  root.getBoundingClientRect = () => box;

  const document = new Target();
  document.hidden = false;
  document.activeElement = null;
  const preference = new Target();
  preference.matches = false;
  if (legacyPreference) {
    preference.addEventListener = undefined;
    preference.addListener = fn => Target.prototype.addEventListener.call(preference, "change", fn);
    preference.removeListener = fn => Target.prototype.removeEventListener.call(preference, "change", fn);
  }
  const window = new Target();
  window.Homepage = {};
  window.location = { hash: "#academic" };
  window.matchMedia = () => preference;
  window.innerWidth = 1440;
  window.innerHeight = 900;
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  const microtasks = [];
  window.setTimeout = (fn, ms) => {
    const id = ++timerId;
    timers.set(id, { fn, at: now + ms });
    return id;
  };
  window.clearTimeout = id => timers.delete(id);
  window.queueMicrotask = fn => microtasks.push(fn);
  const observers = [];
  if (intersectionObserver) window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const environment = vm.createContext({ window, document });
  function load(name) {
    const filename = path.join(sourceRoot, name + ".js");
    vm.runInContext(fs.readFileSync(filename, "utf8"), environment, { filename });
  }
  ["config", "gallery", "navigation"].forEach(load);
  const api = window.Homepage.academicExploration;
  const opens = [];
  const selections = new Set();
  const details = {
    getItem(group, key) {
      if (group !== "academic" || !keys.includes(key)) return null;
      return { label: key[0].toUpperCase() + key.slice(1), subtitle: "Description " + key };
    },
    onSelect(group, callback) {
      if (group !== "academic") throw new Error("Unexpected group");
      selections.add(callback);
      return () => selections.delete(callback);
    },
    open(group, key, args) {
      opens.push({ group, key, args });
      window.location.hash = "#" + group + "/" + key;
      selections.forEach(callback => callback(key));
      document.emit("focusin");
    }
  };
  let gallery;
  let cleanupPair;
  if (mount) {
    gallery = api.createGallery({ root, details, config: intervalMs === undefined ? api.config : { intervalMs }, reducedMotion: preference });
    const releaseNavigation = api.createNavigation({ root, details, gallery });
    const unsubscribe = details.onSelect("academic", gallery.select);
    cleanupPair = () => { unsubscribe(); releaseNavigation(); gallery.destroy(); };
  }
  function tick(ms) {
    const end = now + ms;
    let iterations = 0;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      if (++iterations > 10000) throw new Error("Unbounded timer loop");
      now = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
    }
    now = end;
  }
  function visible(active, ratio = active ? 1 : 0) {
    if (!intersectionObserver) throw new Error("Observer disabled in this fixture");
    observers[0].callback([{ target: root, isIntersecting: active, intersectionRatio: ratio }]);
  }
  function focus(element, { keyboard = true } = {}) {
    const old = document.activeElement;
    if (element) element.focusVisible = keyboard;
    if (old === element) return;
    old?.emit("focusout", { relatedTarget: element });
    if (old) old.focusVisible = false;
    document.activeElement = element;
    element?.emit("focus");
    document.emit("focusin");
  }
  function flushMicrotasks() { while (microtasks.length) microtasks.shift()(); }
  function closeDetail(hash = "#academic") {
    document.emit("close");
    window.location.hash = hash;
    flushMicrotasks();
  }
  function click(element, modifiers = {}) {
    const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...modifiers };
    element.emit("click", event);
    return event;
  }
  function listenerCount() {
    return [window, document, preference, ...buttons, ...Object.values(fields)]
      .reduce((sum, target) => sum + target.listenerCount(), 0);
  }
  return {
    api, root, buttons, images, steps, fields, featured, document, window, preference, observers,
    details, opens, selections, timers, gallery, load, tick, visible, focus, closeDetail, click,
    flushMicrotasks, listenerCount, cleanup: () => cleanupPair?.(),
    setBox(value) { box = value; }
  };
}

try {
  test("公开配置与初始栏目", () => {
    const f = fixture();
    ok(Object.isFrozen(f.api.config));
    equal(f.api.config.intervalMs, 5000);
    equal(f.gallery.getKey(), "experience");
    equal(f.timers.size, 0);
    equal(f.root.querySelector("[data-scene-toggle]"), null);
    equal(f.root.dataset.scenePlayback, "held");
    equal(f.fields.title.textContent, "Experience");
    equal(f.fields.description.textContent, "Description experience");
    equal(f.fields.index.textContent, "01 / 04");
    equal(f.fields.explore.textContent, "Explore ↗");
    equal(f.fields.open.attrs["aria-label"], "Open Experience");
    equal(f.buttons[0].attrs["aria-current"], "true");
    equal(f.images[0].attrs["aria-hidden"], "false");
    equal(f.steps.filter(step => step.classes.has("is-active")).length, 1);
    f.cleanup();
  });

  test("轮播周期、循环、可配置间隔与无效键", () => {
    const f = fixture({ intervalMs: 7000 });
    f.visible(true);
    equal(f.timers.size, 1);
    f.tick(6999); equal(f.gallery.getKey(), "experience");
    f.tick(1); equal(f.gallery.getKey(), "publications");
    equal(f.fields.index.textContent, "02 / 04");
    equal(f.buttons[0].attrs["aria-current"], undefined);
    equal(f.images[1].attrs["aria-hidden"], "false");
    f.tick(21000); equal(f.gallery.getKey(), "experience");
    f.gallery.select("unknown"); equal(f.gallery.getKey(), "experience");
    equal(f.timers.size, 1);
    f.cleanup();
  });

  test("鼠标逐行预览与移出后的完整等待", () => {
    const f = fixture(); f.visible(true);
    f.buttons[3].emit("pointerenter", { pointerType: "mouse" });
    equal(f.gallery.getKey(), "projects"); equal(f.timers.size, 0);
    f.tick(20000); equal(f.gallery.getKey(), "projects");
    f.buttons[3].emit("pointerleave", { pointerType: "mouse" });
    f.tick(4999); equal(f.gallery.getKey(), "projects");
    f.tick(1); equal(f.gallery.getKey(), "experience");
    f.fields.open.emit("pointerenter", { pointerType: "pen" });
    f.tick(20000); equal(f.gallery.getKey(), "experience");
    f.fields.open.emit("pointercancel", { pointerType: "pen" });
    equal(f.timers.size, 1);
    f.cleanup();
  });

  test("键盘焦点优先于其他行悬停，点击仍能打开指定入口", () => {
    const f = fixture(); f.visible(true);
    f.focus(f.buttons[0]);
    f.buttons[3].emit("pointerenter", { pointerType: "mouse" });
    equal(f.gallery.getKey(), "experience");
    f.tick(20000); equal(f.gallery.getKey(), "experience");
    f.focus(null); equal(f.gallery.getKey(), "projects");
    f.buttons[3].emit("pointerleave", { pointerType: "mouse" });
    f.focus(f.fields.open);
    f.buttons[1].emit("pointerenter", { pointerType: "mouse" });
    equal(f.gallery.getKey(), "projects");
    f.click(f.fields.open);
    equal(f.opens.at(-1).key, "projects");
    equal(f.opens.at(-1).args.source, f.images[3]);
    f.closeDetail(); f.focus(f.buttons[0]);
    f.click(f.buttons[1]);
    equal(f.opens.at(-1).key, "publications");
    equal(f.opens.at(-1).args.trigger, f.buttons[1]);
    equal(f.opens.at(-1).args.source, f.images[1]);
    f.cleanup();
  });

  test("焦点在按钮内部移动不恢复轮播；触摸不触发悬停", () => {
    const f = fixture(); f.visible(true);
    f.focus(f.buttons[2]); equal(f.gallery.getKey(), "notes");
    const child = new Element(); f.buttons[2].children.push(child);
    f.buttons[2].emit("focusout", { relatedTarget: child });
    equal(f.timers.size, 0);
    f.focus(null); equal(f.timers.size, 1);
    f.buttons[3].emit("pointerenter", { pointerType: "touch" });
    equal(f.gallery.getKey(), "notes"); equal(f.timers.size, 1);
    f.click(f.buttons[3]); equal(f.opens.at(-1).key, "projects");
    f.cleanup();
  });

  test("鼠标获得的焦点不阻止其他路牌行悬停预览", () => {
    const f = fixture(); f.visible(true);
    f.focus(f.buttons[0], { keyboard: false });
    f.buttons[3].emit("pointerenter", { pointerType: "mouse" });
    equal(f.gallery.getKey(), "projects");
    f.buttons[3].emit("pointerleave", { pointerType: "mouse" });
    f.focus(f.fields.open, { keyboard: false });
    f.buttons[1].emit("pointerenter", { pointerType: "mouse" });
    equal(f.gallery.getKey(), "publications");
    f.click(f.fields.open); equal(f.opens.at(-1).key, "publications");
    f.cleanup();
  });

  test("图片仅在视口相交时作为详情过渡起点", () => {
    const f = fixture(); f.visible(true);
    f.click(f.buttons[2]); equal(f.opens.at(-1).args.source, f.images[2]);
    f.closeDetail();
    f.images[2].box = { width: 800, height: 450, top: -600, left: 100, bottom: -150, right: 900 };
    f.click(f.buttons[2]); equal(f.opens.at(-1).args.source, undefined);
    f.cleanup();
  });

  test("详情路由、原生关闭、历史与深链接暂停恢复", () => {
    const f = fixture(); f.visible(true);
    f.click(f.fields.open); equal(f.timers.size, 0);
    f.tick(20000); equal(f.gallery.getKey(), "experience");
    f.closeDetail(); equal(f.timers.size, 1);
    f.window.location.hash = "#life/moments";
    f.window.emit("hashchange"); equal(f.timers.size, 0);
    f.closeDetail("#life"); equal(f.timers.size, 1);
    f.window.location.hash = "#academic/notes";
    f.window.emit("popstate"); equal(f.timers.size, 0);
    f.window.location.hash = "#academic";
    f.document.emit("focusin"); equal(f.timers.size, 1);
    f.window.location.hash = "#academic/experience/author";
    f.window.emit("hashchange"); equal(f.timers.size, 0);
    f.closeDetail(); f.tick(4999); equal(f.gallery.getKey(), "experience");
    f.tick(1); equal(f.gallery.getKey(), "publications");
    f.cleanup();
  });

  test("视口与后台页面暂停，恢复后重新完整计时", () => {
    const f = fixture();
    // threshold:0 的边缘相交可报告 ratio:0，不能永远等候另一次阈值回调。
    f.visible(true, 0); equal(f.timers.size, 1);
    f.tick(4500);
    f.visible(false); equal(f.timers.size, 0);
    f.tick(10000); equal(f.gallery.getKey(), "experience");
    f.visible(true); f.tick(4999); equal(f.gallery.getKey(), "experience");
    f.tick(1); equal(f.gallery.getKey(), "publications");
    f.document.hidden = true; f.document.emit("visibilitychange");
    equal(f.timers.size, 0);
    f.document.hidden = false; f.document.emit("visibilitychange");
    equal(f.timers.size, 1);
    f.cleanup();
  });

  test("无播放控件仍按五秒循环，动态偏好实时暂停并完整恢复计时", () => {
    const f = fixture(); f.visible(true);
    equal(f.root.dataset.scenePlayback, "playing");
    f.tick(5000); equal(f.gallery.getKey(), "publications");
    f.tick(4000);
    f.preference.matches = true; f.preference.emit("change");
    equal(f.timers.size, 0);
    equal(f.root.dataset.scenePlayback, "reduced");
    f.tick(20000); equal(f.gallery.getKey(), "publications");
    f.preference.matches = false; f.preference.emit("change"); equal(f.timers.size, 1);
    equal(f.root.dataset.scenePlayback, "playing");
    f.tick(4999); equal(f.gallery.getKey(), "publications");
    f.tick(1); equal(f.gallery.getKey(), "notes");
    f.buttons[0].emit("pointerenter", { pointerType: "mouse" });
    equal(f.root.dataset.scenePlayback, "held");
    f.preference.matches = true; f.preference.emit("change");
    f.preference.matches = false; f.preference.emit("change"); equal(f.timers.size, 0);
    equal(f.root.dataset.scenePlayback, "held");
    f.buttons[0].emit("pointerleave", { pointerType: "mouse" });
    equal(f.timers.size, 1);
    equal(f.root.dataset.scenePlayback, "playing");
    f.tick(5000); equal(f.gallery.getKey(), "publications");
    f.cleanup();
  });

  test("无 IntersectionObserver 与旧式动态偏好监听的降级", () => {
    const f = fixture({ intersectionObserver: false, legacyPreference: true, intervalMs: 0 });
    equal(f.timers.size, 1);
    f.tick(4999); equal(f.gallery.getKey(), "experience");
    f.tick(1); equal(f.gallery.getKey(), "publications");
    f.setBox({ width: 1000, height: 600, top: 1000, bottom: 1600, left: 0, right: 1000 });
    f.window.emit("scroll"); equal(f.timers.size, 0);
    f.setBox({ width: 1000, height: 600, top: 0, bottom: 600, left: 0, right: 1000 });
    f.window.emit("resize"); equal(f.timers.size, 1);
    f.preference.matches = true; f.preference.emit("change"); equal(f.timers.size, 0);
    f.cleanup(); equal(f.listenerCount(), 0);
  });

  test("重复卸载与已排队关闭微任务不会留下监听或定时器", () => {
    const f = fixture(); f.visible(true);
    f.document.emit("close");
    f.cleanup(); f.cleanup(); f.flushMicrotasks();
    equal(f.timers.size, 0);
    equal(f.observers[0].disconnected, true);
    equal(f.listenerCount(), 0);
    equal(f.selections.size, 0);
    f.gallery.select("notes"); equal(f.gallery.getKey(), "experience");
  });

  test("精选论文优先 arXiv、原生修饰键与详情分类入口", () => {
    const f = fixture({ mount: false }); f.load("featured");
    f.window.Homepage.getPublicationCategories = () => [
      { id: "published", entries: [{ title: "Published title", identifier: "DOI:fixture", authors: "Published authors" }] },
      { id: "arxiv", entries: [{ title: "A <literal> & title", identifier: "arXiv:fixture", authors: "Fixture authors" }] }
    ];
    f.api.mountFeaturedPublication({ root: f.root, details: f.details });
    equal(f.featured.link.hidden, false);
    equal(f.featured.title.textContent, "A <literal> & title");
    equal(f.featured.metadata.textContent, "arXiv:fixture · Fixture authors");
    equal(f.featured.link.href, "#academic/publications/arxiv");
    for (const modifiers of [{ metaKey: true }, { ctrlKey: true }, { altKey: true }, { shiftKey: true }, { button: 1 }, { defaultPrevented: true }]) {
      const event = f.click(f.featured.link, modifiers);
      equal(event.defaultPrevented, Boolean(modifiers.defaultPrevented));
      equal(f.opens.length, 0);
    }
    const event = f.click(f.featured.link);
    equal(event.defaultPrevented, true);
    equal(f.opens.at(-1).key, "publications");
    equal(f.opens.at(-1).args.route, "arxiv");
  });

  test("精选数据缺失、全空、异常与首个非空分类回退", () => {
    const cases = [
      { getter: undefined, hidden: true },
      { getter: () => null, hidden: true },
      { getter: () => [], hidden: true },
      { getter: () => [{ id: "arxiv", entries: [] }], hidden: true },
      { getter: () => { throw new Error("Fixture unavailable"); }, hidden: true },
      { getter: () => [
        { id: "arxiv", entries: [] },
        { id: "internal-note", entries: [{ title: "Note", identifier: "Note fixture", authors: "Author" }] }
      ], hidden: false }
    ];
    for (const item of cases) {
      const f = fixture({ mount: false }); f.load("featured");
      f.window.Homepage.getPublicationCategories = item.getter;
      f.api.mountFeaturedPublication({ root: f.root, details: f.details });
      equal(f.featured.link.hidden, item.hidden);
      if (!item.hidden) equal(f.featured.link.href, "#academic/publications/internal-note");
    }
  });

  test("实际场景胶水订阅栏目选择并一次性清理三个组件", () => {
    const f = fixture({ mount: false });
    let gallery;
    let walkerDestroyed = 0;
    const createGallery = f.api.createGallery;
    f.api.createGallery = options => { gallery = createGallery(options); return gallery; };
    f.api.mountWalker = () => ({ destroy() { walkerDestroyed += 1; } });
    f.load("scene");
    const cleanup = f.api.mountScene({ root: f.root, details: f.details, reducedMotion: f.preference });
    equal(f.selections.size, 1);
    f.selections.forEach(callback => callback("notes")); equal(gallery.getKey(), "notes");
    f.visible(true); equal(f.timers.size, 1);
    cleanup(); cleanup();
    equal(f.selections.size, 0); equal(f.timers.size, 0);
    equal(f.listenerCount(), 0); equal(walkerDestroyed, 1);
  });

  console.log(JSON.stringify({ suite: "academic-scene", workflows: results.length, assertions, results,
    limitations: "离线逻辑夹具；不代表浏览器布局、真机、系统动态偏好或线上部署实测。" }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
