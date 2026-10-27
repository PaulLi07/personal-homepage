/* 简介相册离线回归：内存 DOM、图片解码与时钟，不打开浏览器或访问真实资料。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const filename = path.resolve(__dirname, "../../modules/about/gallery/gallery.js");
const source = fs.readFileSync(filename, "utf8");
const results = [];
let assertions = 0;
function equal(actual, expected, message) { assert.deepStrictEqual(actual, expected, message); assertions += 1; }
function ok(value, message) { assert.ok(value, message); assertions += 1; }
async function test(name, run) {
  const before = assertions;
  await run();
  results.push({ name, assertions: assertions - before });
}

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler, options) {
    const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
    this.listeners.set(type, [...(this.listeners.get(type) || []), { handler, capture }]);
  }
  removeEventListener(type, handler, options) {
    const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item.handler !== handler || item.capture !== capture));
  }
  emit(type, event = {}) { (this.listeners.get(type) || []).slice().forEach(item => item.handler(event)); }
  listenerCount() { return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.length, 0); }
}
class Element extends Target {
  constructor(tag = "div") {
    super();
    this.tag = tag;
    this.attrs = new Map();
    this.dataset = {};
    this.children = [];
    this.parent = null;
    this.style = {};
    this.textContent = "";
    this.classes = new Set();
    this.complete = false;
    this.naturalWidth = 0;
    this.decode = () => Promise.resolve();
    this.box = { width: 800, height: 530, left: 0, right: 800, top: 100, bottom: 630 };
    this.classList = {
      add: name => this.classes.add(name),
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name)
    };
  }
  set innerHTML(_) { throw new Error("相册不可插入 HTML 字符串"); }
  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    if (name === "class") this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
    if (name === "src") { this.complete = false; this.naturalWidth = 0; }
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
  }
  getAttribute(name) {
    if (name === "class") return this.classes.size ? [...this.classes].join(" ") : null;
    if (name.startsWith("data-")) return this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null;
    return this.attrs.get(name) ?? null;
  }
  removeAttribute(name) {
    this.attrs.delete(name);
    if (name === "class") this.classes.clear();
    if (name === "style") this.style = {};
    if (name.startsWith("data-")) delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
  }
  get hidden() { return this.attrs.has("hidden"); }
  set hidden(value) { value ? this.attrs.set("hidden", "") : this.attrs.delete("hidden"); }
  get disabled() { return this.attrs.has("disabled"); }
  set disabled(value) { value ? this.attrs.set("disabled", "") : this.attrs.delete("disabled"); }
  append(node) { this.children.push(node); node.parent = this; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  getBoundingClientRect() { return this.box; }
  closest(selector) {
    const isForm = /input|textarea|select|contenteditable|textbox/.test(selector);
    if (isForm && (this.tag === "input" || this.tag === "textarea" || this.tag === "select" || this.editable)) return this;
    if (/button, a/.test(selector) && (this.tag === "button" || this.tag === "a")) return this;
    return this.parent?.closest(selector) || null;
  }
}

function fixture({ count = 3, intervalMs = 6000, intersectionObserver = true, legacyPreference = false, config, mount = true, cached = false, reduced = false } = {}) {
  const root = new Element();
  const container = new Element();
  const fallback = new Element("img");
  fallback.setAttribute("class", "static-photo");
  fallback.setAttribute("src", "modules/about/gallery/images/photo-0.jpg?v=fixture");
  fallback.setAttribute("alt", "Static first photo");
  if (cached) { fallback.complete = true; fallback.naturalWidth = 1200; }
  const fields = Object.fromEntries(["prev", "next", "toggle", "index", "announcement", "credit"].map(name => [name, new Element(["prev", "next", "toggle"].includes(name) ? "button" : name === "credit" ? "a" : "span")]));
  [fields.prev, fields.next, fields.toggle].forEach(button => { button.hidden = true; });
  fields.toggle.textContent = "Ⅱ";
  fields.index.textContent = "1 / 03";
  fields.credit.setAttribute("href", "credits.html");
  container.append(fallback);
  root.append(container);
  Object.values(fields).forEach(field => root.append(field));
  root.querySelector = selector => selector === "[data-gallery-slides]" ? container
    : selector === "[data-gallery-fallback]" ? fallback
    : fields[selector.slice("[data-gallery-".length, -1)] || null;
  const document = new Target();
  document.hidden = false;
  document.activeElement = null;
  const generated = [];
  document.createElement = tag => { const element = new Element(tag); generated.push(element); return element; };
  const preference = new Target();
  preference.matches = reduced;
  if (legacyPreference) {
    preference.addEventListener = undefined;
    preference.addListener = handler => Target.prototype.addEventListener.call(preference, "change", handler);
    preference.removeListener = handler => Target.prototype.removeEventListener.call(preference, "change", handler);
  }
  const window = new Target();
  window.Homepage = {};
  window.location = { hash: "#about" };
  window.innerHeight = 900;
  window.innerWidth = 1440;
  window.matchMedia = () => preference;
  const microtasks = [];
  window.queueMicrotask = task => microtasks.push(task);
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  window.setTimeout = (task, ms) => { const id = ++nextId; timers.set(id, { task, at: now + ms }); return id; };
  window.clearTimeout = id => timers.delete(id);
  const observers = [];
  if (intersectionObserver) window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const environment = vm.createContext({ window, document });
  vm.runInContext(source, environment, { filename });
  const api = window.Homepage.aboutGallery;
  const photos = Array.from({ length: count }, (_, i) => ({
    id: "photo-" + i, src: "modules/about/gallery/images/photo-" + i + ".jpg?v=fixture",
    alt: "Photo " + i, width: 1200, height: 800, position: "50% 50%", credit: "Fixture credit " + i
  }));
  api.config = config || { intervalMs, photos };
  let handle;
  function start(options = {}) { handle = api.mount({ root, reducedMotion: preference, ...options }); return handle; }
  if (mount) start();
  function tick(ms) {
    const until = now + ms;
    let passes = 0;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      if (++passes > 10000) throw new Error("定时器未收敛");
      now = next[1].at;
      timers.delete(next[0]);
      next[1].task();
    }
    now = until;
  }
  async function flush() {
    for (let i = 0; i < 5; i += 1) {
      while (microtasks.length) microtasks.shift()();
      await Promise.resolve();
    }
  }
  function images() { return [fallback, ...generated.filter(element => element.parent === container)]; }
  async function load(position, { fail = false } = {}) {
    const image = images()[position];
    image.complete = true;
    image.naturalWidth = fail ? 0 : 1200;
    image.emit(fail ? "error" : "load");
    await flush();
  }
  async function loadAll() { for (let i = 0; i < images().length; i += 1) await load(i); }
  function visible(value, ratio = value ? 1 : 0) {
    observers.at(-1).callback([{ target: root, isIntersecting: value, intersectionRatio: ratio }]);
  }
  function click(name) { fields[name].emit("click", { target: fields[name] }); }
  function key(key, target = root, modifiers = {}) {
    const event = { key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...modifiers };
    root.emit("keydown", event); return event;
  }
  async function focus(target) {
    document.activeElement = target;
    root.emit(target && root.contains(target) ? "focusin" : "focusout", { relatedTarget: target });
    document.emit("focusin", { target });
    await flush();
  }
  function swipe(dx, dy, target = fallback, pointer = 1) {
    root.emit("pointerdown", { target, pointerType: "touch", pointerId: pointer, clientX: 200, clientY: 200, isPrimary: true });
    window.emit("pointerup", { pointerId: pointer, clientX: 200 + dx, clientY: 200 + dy });
  }
  function listenerCount() { return [root, window, document, preference, fallback, ...generated, ...Object.values(fields)].reduce((sum, target) => sum + target.listenerCount(), 0); }
  return { api, root, container, fallback, fields, preference, document, window, observers, timers,
    start, tick, flush, load, loadAll, images, visible, click, key, focus, swipe, listenerCount,
    destroy() { handle?.destroy(); } };
}

(async () => {
  await test("顶层登记不读取 DOM，无配置保留静态回退", async () => {
    const environment = { window: { Homepage: {} } };
    Object.defineProperty(environment, "document", { get() { throw new Error("顶层 DOM 访问"); } });
    vm.runInNewContext(source, environment, { filename });
    equal(typeof environment.window.Homepage.aboutGallery.mount, "function");
    const f = fixture({ config: { photos: [] } });
    equal(f.container.children.length, 1);
    equal(f.fallback.getAttribute("alt"), "Static first photo");
    equal(f.listenerCount(), 0);
    equal(f.timers.size, 0);
    f.destroy();
  });

  await test("首图无缝接管，等待图片解码并保持单一定时器", async () => {
    const f = fixture();
    equal(f.root.dataset.galleryState, "held");
    equal(f.fields.index.textContent, "1 / 03");
    equal(f.fields.next.hidden, true);
    equal(f.fallback.classes.has("is-active"), true);
    f.visible(true, 0); await f.loadAll();
    equal(f.fields.next.hidden, false);
    equal(f.root.dataset.galleryState, "playing");
    equal(f.timers.size, 1);
    equal(f.fields.credit.getAttribute("href"), "credits.html");
    equal(f.fields.credit.getAttribute("aria-label"), "Photo credit: Fixture credit 0");
    f.tick(5999); equal(f.root.dataset.galleryIndex, "0");
    f.tick(1); equal(f.root.dataset.galleryIndex, "1");
    equal(f.fields.index.textContent, "2 / 03");
    equal(f.fields.announcement.textContent, "");
    equal(f.timers.size, 1);
    equal(f.images().filter(image => image.classes.has("is-active")).length, 1);
    f.tick(12000); equal(f.root.dataset.galleryIndex, "0");
    f.destroy();
  });

  await test("已缓存首图和自定义间隔；非法间隔回到六秒", async () => {
    const f = fixture({ cached: true, intervalMs: 8000 });
    f.visible(true); await f.flush(); await f.load(1); await f.load(2);
    f.tick(7999); equal(f.root.dataset.galleryIndex, "0");
    f.tick(1); equal(f.root.dataset.galleryIndex, "1");
    f.destroy();
    const g = fixture({ intervalMs: -1 }); g.visible(true); await g.loadAll();
    g.tick(5999); equal(g.root.dataset.galleryIndex, "0");
    g.tick(1); equal(g.root.dataset.galleryIndex, "1"); g.destroy();
  });

  await test("手动左右循环、完整重计时以及只宣布手动切换", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    f.tick(5500); f.click("prev"); equal(f.root.dataset.galleryIndex, "2");
    equal(f.fields.announcement.textContent, "Photo 3 of 3: Photo 2");
    equal(f.images()[0].getAttribute("aria-hidden"), "true");
    equal(f.images()[2].getAttribute("aria-hidden"), "false");
    f.tick(5999); equal(f.root.dataset.galleryIndex, "2");
    f.tick(1); equal(f.root.dataset.galleryIndex, "0");
    f.click("next"); equal(f.root.dataset.galleryIndex, "1");
    f.destroy();
  });

  await test("解码未完成与坏图跳过，当前图不会先变空白", async () => {
    const f = fixture(); f.visible(true);
    let decoded;
    f.images()[1].decode = () => new Promise(resolve => { decoded = resolve; });
    await f.load(0); await f.load(1);
    equal(f.fields.next.hidden, true);
    f.click("next"); equal(f.root.dataset.galleryIndex, "0");
    equal(f.fallback.classes.has("is-active"), true);
    await f.load(2, { fail: true });
    equal(f.fields.index.textContent, "1 / 02");
    decoded(); await f.flush();
    equal(f.fields.next.hidden, false);
    f.click("prev"); equal(f.root.dataset.galleryIndex, "1");
    equal(f.fields.index.textContent, "2 / 02");
    f.tick(6000); equal(f.root.dataset.galleryIndex, "0");
    f.destroy();
  });

  await test("解码拒绝、首图失败与全部失败保持静态兜底", async () => {
    const f = fixture(); f.visible(true);
    f.images()[1].decode = () => Promise.reject(new Error("Fixture decode rejected"));
    await f.load(0, { fail: true }); await f.load(1); await f.load(2);
    equal(f.root.dataset.galleryIndex, "2");
    equal(f.fields.index.textContent, "1 / 01");
    equal(f.fields.next.hidden, true); equal(f.fields.toggle.hidden, true);
    equal(f.timers.size, 0); f.destroy();
    const g = fixture(); g.visible(true);
    for (let i = 0; i < 3; i += 1) await g.load(i, { fail: true });
    equal(g.fallback.classes.has("is-active"), true);
    equal(g.fields.next.hidden, true); equal(g.timers.size, 0);
    equal(g.container.children.length, 3); g.destroy();
    equal(g.container.children.length, 1);
  });

  await test("悬停与聚焦独立暂停，触摸不会触发悬停", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    f.root.emit("pointerenter", { pointerType: "mouse" });
    equal(f.root.dataset.galleryState, "held"); equal(f.timers.size, 0);
    await f.focus(f.fields.next);
    f.root.emit("pointerleave", { pointerType: "mouse" }); equal(f.timers.size, 0);
    await f.focus(f.fields.prev); equal(f.timers.size, 0);
    await f.focus(null); equal(f.timers.size, 1);
    f.root.emit("pointerenter", { pointerType: "touch" }); equal(f.timers.size, 1);
    f.tick(5999); equal(f.root.dataset.galleryIndex, "0");
    f.tick(1); equal(f.root.dataset.galleryIndex, "1");
    f.destroy();
  });

  await test("手动暂停不会被移出、焦点与后台恢复覆盖", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    f.click("toggle"); equal(f.root.dataset.galleryState, "paused");
    equal(f.fields.toggle.getAttribute("aria-label"), "Play slideshow");
    f.root.emit("pointerenter", { pointerType: "mouse" });
    f.root.emit("pointerleave", { pointerType: "mouse" });
    await f.focus(f.fields.next); await f.focus(null);
    f.document.hidden = true; f.document.emit("visibilitychange");
    f.document.hidden = false; f.document.emit("visibilitychange");
    equal(f.root.dataset.galleryState, "paused"); equal(f.timers.size, 0);
    f.click("next"); equal(f.root.dataset.galleryIndex, "1");
    equal(f.root.dataset.galleryState, "paused");
    f.click("toggle"); equal(f.root.dataset.galleryState, "playing");
    equal(f.fields.toggle.getAttribute("aria-label"), "Pause slideshow");
    equal(f.timers.size, 1); f.destroy();
  });

  await test("明确播放立即放开已有悬停和焦点，仍遵守新的进入与外部暂停", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    f.root.emit("pointerenter", { pointerType: "mouse" });
    await f.focus(f.fields.toggle);
    f.click("toggle"); equal(f.root.dataset.galleryState, "paused");
    f.click("toggle"); equal(f.root.dataset.galleryState, "playing");
    equal(f.timers.size, 1);
    f.tick(6000); equal(f.root.dataset.galleryIndex, "1");
    await f.focus(f.fields.next); equal(f.root.dataset.galleryState, "held");
    equal(f.timers.size, 0);
    f.click("toggle"); f.click("toggle"); equal(f.timers.size, 1);
    f.visible(false); equal(f.timers.size, 0);
    f.click("toggle"); f.click("toggle"); equal(f.timers.size, 0);
    f.visible(true); equal(f.timers.size, 1);
    f.document.hidden = true; f.document.emit("visibilitychange");
    f.click("toggle"); f.click("toggle"); equal(f.timers.size, 0);
    f.document.hidden = false; f.document.emit("visibilitychange");
    f.window.location.hash = "#academic/notes"; f.window.emit("hashchange");
    f.click("toggle"); f.click("toggle"); equal(f.timers.size, 0);
    f.destroy();
  });

  await test("离屏、后台与详情公开路由均暂停；恢复完整等待", async () => {
    const f = fixture(); f.visible(true); await f.loadAll(); f.tick(5000);
    f.visible(false); equal(f.timers.size, 0);
    f.tick(20000); equal(f.root.dataset.galleryIndex, "0");
    f.visible(true); f.tick(5999); equal(f.root.dataset.galleryIndex, "0");
    f.tick(1); equal(f.root.dataset.galleryIndex, "1");
    f.document.hidden = true; f.document.emit("visibilitychange"); equal(f.timers.size, 0);
    f.document.hidden = false; f.document.emit("visibilitychange"); equal(f.timers.size, 1);
    f.window.location.hash = "#academic/experience/author";
    f.document.emit("focusin"); equal(f.timers.size, 0);
    f.document.emit("close"); f.window.location.hash = "#about"; await f.flush(); equal(f.timers.size, 1);
    f.window.location.hash = "#life/moments"; f.window.emit("hashchange"); equal(f.timers.size, 0);
    f.window.location.hash = "#life"; f.window.emit("popstate"); equal(f.timers.size, 1);
    f.destroy();
  });

  await test("减少动态效果保留手动翻页；偏好变化和旧监听可清理", async () => {
    const f = fixture({ reduced: true, legacyPreference: true }); f.visible(true); await f.loadAll();
    equal(f.root.dataset.galleryState, "reduced");
    equal(f.fields.toggle.hidden, true); equal(f.fields.toggle.disabled, true);
    equal(f.fields.next.hidden, false); equal(f.timers.size, 0);
    f.click("next"); equal(f.root.dataset.galleryIndex, "1");
    f.preference.matches = false; f.preference.emit("change");
    equal(f.root.dataset.galleryState, "playing"); equal(f.fields.toggle.hidden, false);
    f.tick(6000); equal(f.root.dataset.galleryIndex, "2");
    f.preference.matches = true; f.preference.emit("change"); equal(f.timers.size, 0);
    f.destroy(); equal(f.listenerCount(), 0);
  });

  await test("键盘作用域、编辑控件及修饰键不劫持", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    const event = f.key("ArrowRight"); equal(event.defaultPrevented, true);
    equal(f.root.dataset.galleryIndex, "1");
    f.key("ArrowLeft", f.fields.next); equal(f.root.dataset.galleryIndex, "0");
    const input = new Element("input");
    f.root.append(input);
    equal(f.key("ArrowRight", input).defaultPrevented, false);
    equal(f.key("ArrowRight", f.root, { ctrlKey: true }).defaultPrevented, false);
    equal(f.key("ArrowRight", new Element()).defaultPrevented, false);
    equal(f.key("ArrowRight", f.root, { defaultPrevented: true }).defaultPrevented, true);
    equal(f.root.dataset.galleryIndex, "0"); f.destroy();
  });

  await test("水平触摸翻页不取消纵向滚动，控件触摸不重复切图", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    f.swipe(-90, 12); equal(f.root.dataset.galleryIndex, "1");
    f.swipe(90, -8); equal(f.root.dataset.galleryIndex, "0");
    f.swipe(45, 110); equal(f.root.dataset.galleryIndex, "0");
    f.swipe(25, 0); equal(f.root.dataset.galleryIndex, "0");
    f.swipe(-90, 0, f.fields.next); equal(f.root.dataset.galleryIndex, "0");
    f.root.emit("pointerdown", { target: f.fallback, pointerType: "touch", pointerId: 8, clientX: 200, clientY: 200 });
    f.window.emit("pointercancel");
    f.window.emit("pointerup", { pointerId: 8, clientX: 50, clientY: 200 });
    equal(f.root.dataset.galleryIndex, "0"); f.destroy();
  });

  await test("无观察器可见性降级及 BFCache 不积累时间", async () => {
    const f = fixture({ intersectionObserver: false }); await f.loadAll();
    equal(f.timers.size, 1);
    f.root.box = { width: 800, height: 530, left: 0, right: 800, top: 1000, bottom: 1530 };
    f.window.emit("scroll"); equal(f.timers.size, 0);
    f.root.box.top = 100; f.root.box.bottom = 630;
    f.window.emit("resize"); equal(f.timers.size, 1);
    f.tick(5500); f.window.emit("pagehide", { persisted: true }); equal(f.timers.size, 0);
    f.tick(30000); equal(f.root.dataset.galleryIndex, "0");
    f.window.emit("pageshow", { persisted: true });
    f.tick(5999); equal(f.root.dataset.galleryIndex, "0");
    f.tick(1); equal(f.root.dataset.galleryIndex, "1");
    f.destroy(); equal(f.listenerCount(), 0);
  });

  await test("真正离开页面完整销毁，不由 pageshow 重新激活", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    equal(f.timers.size, 1);
    f.window.emit("pagehide", { persisted: false });
    equal(f.listenerCount(), 0); equal(f.timers.size, 0);
    equal(f.observers[0].disconnected, true);
    equal(f.container.children.length, 1);
    equal(f.fallback.getAttribute("alt"), "Static first photo");
    f.window.emit("pageshow", { persisted: false });
    equal(f.timers.size, 0); equal(f.root.dataset.galleryState, undefined);
    f.destroy();
  });

  await test("重复挂载卸载、排队微任务和迟到解码不会污染新实例", async () => {
    const f = fixture(); f.visible(true); await f.loadAll();
    const firstObserver = f.observers[0];
    f.document.emit("close");
    f.start();
    equal(firstObserver.disconnected, true);
    equal(f.container.children.length, 3);
    f.visible(true); await f.loadAll();
    equal(f.timers.size, 1);
    let decoded;
    const nextImage = f.images()[1];
    nextImage.complete = false; nextImage.naturalWidth = 0;
    // 独立挂载时制造未完成的 decode，随后销毁。
    f.destroy(); f.start();
    f.images()[1].decode = () => new Promise(resolve => { decoded = resolve; });
    await f.load(1);
    f.document.emit("close"); f.destroy(); f.destroy();
    decoded(); await f.flush();
    equal(f.container.children.length, 1);
    equal(f.fallback.getAttribute("alt"), "Static first photo");
    equal(f.fallback.getAttribute("class"), "static-photo");
    equal(f.fields.prev.hidden, true); equal(f.fields.toggle.hidden, true);
    equal(f.root.dataset.galleryState, undefined);
    equal(f.listenerCount(), 0); equal(f.timers.size, 0);
    ok(f.observers.every(observer => observer.disconnected));
  });

  await test("非法路径和重复条目拒绝，英文文本按字面处理", async () => {
    const valid = { id: "valid", src: "modules/about/gallery/images/photo-0.jpg?v=fixture", alt: "A <literal> & portrait", credit: "Fixture <credit>", position: "url(javascript:fixture)" };
    const f = fixture({ config: { photos: [
      valid, { ...valid }, { ...valid, id: "remote", src: "https://example.com/photo.jpg" },
      { ...valid, id: "traversal", src: "modules/about/../life/photo.jpg" },
      { ...valid, id: "empty", alt: "" }
    ] } });
    await f.load(0); f.visible(true);
    equal(f.container.children.length, 1); equal(f.fallback.getAttribute("alt"), valid.alt);
    equal(f.fallback.style.objectPosition, "50% 50%");
    equal(f.fields.credit.getAttribute("aria-label"), "Photo credit: Fixture <credit>");
    equal(f.fields.index.textContent, "1 / 01");
    equal(f.fields.prev.hidden, true); equal(f.timers.size, 0); f.destroy();
  });

  console.log(JSON.stringify({ suite: "about-gallery", workflows: results.length, assertions, results,
    limitations: "离线内存 DOM、图片与时钟夹具；不代表浏览器布局、真实触摸、真机、原生动态偏好或线上部署实测。" }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
