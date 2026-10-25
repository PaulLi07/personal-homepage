/* 生活照片堆离线回归：内存DOM模拟真实输入顺序，不读写文章、凭据或网络。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const moduleRoot = path.resolve(__dirname, "..", "modules", "life");
const keys = ["moments", "travels", "creations", "relationship"];
const results = [];
let assertions = 0;
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
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item.fn !== fn || item.capture !== capture));
  }
  emit(type, event = {}) { (this.listeners.get(type) || []).slice().forEach(item => item.fn(event)); }
  count() { return [...this.listeners.values()].reduce((sum, list) => sum + list.length, 0); }
}
class Element extends Target {
  constructor(doc, dataset = {}) {
    super();
    this.ownerDocument = doc;
    this.dataset = dataset;
    this.attributes = new Map();
    this.textContent = "";
    this.children = [];
    this.classes = new Set();
    this.classList = {
      contains: name => this.classes.has(name),
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name)
    };
    this.properties = new Map();
    this.style = {
      getPropertyValue: name => this.properties.get(name)?.value || "",
      getPropertyPriority: name => this.properties.get(name)?.priority || "",
      setProperty: (name, value, priority = "") => this.properties.set(name, { value, priority }),
      removeProperty: name => this.properties.delete(name)
    };
  }
  dataKey(name) { return name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
  setAttribute(name, value) {
    if (name.startsWith("data-")) this.dataset[this.dataKey(name)] = String(value);
    else this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return name.startsWith("data-") ? this.dataset[this.dataKey(name)] ?? null : this.attributes.get(name) ?? null;
  }
  removeAttribute(name) {
    if (name.startsWith("data-")) delete this.dataset[this.dataKey(name)];
    else this.attributes.delete(name);
  }
  contains(node) { return node === this || this.children.includes(node); }
  querySelector(selector) { return selector === "img" ? this.image || null : null; }
}
function fixture({ config, legacy = false, mount = true, preferenceValue = false, missingTitle = false } = {}) {
  const doc = new Target();
  doc.activeElement = null;
  const preference = new Target();
  preference.matches = preferenceValue;
  if (legacy) {
    preference.addEventListener = undefined;
    preference.addListener = fn => Target.prototype.addEventListener.call(preference, "change", fn);
    preference.removeListener = fn => Target.prototype.removeEventListener.call(preference, "change", fn);
  }
  const win = new Target();
  const sections = [];
  win.Homepage = { registerSection: section => sections.push(section) };
  win.matchMedia = () => preference;
  const root = new Element(doc, { selected: "moments", reducedMotion: "false" });
  const title = new Element(doc);
  title.textContent = "Moments";
  const description = new Element(doc);
  description.textContent = "Static description";
  const buttons = keys.map(key => {
    const button = new Element(doc, { life: key });
    button.image = new Element(doc);
    button.children.push(button.image);
    return button;
  });
  root.children.push(...buttons, title, description);
  root.querySelectorAll = selector => selector === "[data-life]" ? buttons : [];
  root.querySelector = selector => ({ "[data-life-title]": missingTitle ? null : title, "[data-life-description]": description })[selector] || null;
  const sectionRoot = new Element(doc);
  sectionRoot.querySelector = selector => selector === "[data-life-stack]" ? root : null;
  const opens = [];
  const details = { open: (group, key, args) => opens.push({ group, key, args }) };
  const context = vm.createContext({ window: win, document: doc });
  function load(relative) {
    const filename = path.join(moduleRoot, relative);
    vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  }
  load("stack/config.js");
  load("stack/controller.js");
  const api = win.Homepage.lifeStack;
  const options = { root, details, reducedMotion: preference, ...(config === undefined ? {} : { config }) };
  const handle = mount ? api.mount(options) : null;
  function button(key) { return buttons.find(item => item.dataset.life === key); }
  function focus(key) {
    const target = key ? button(key) : null;
    const previous = doc.activeElement;
    if (previous && previous !== target) previous.emit("focusout", { relatedTarget: target });
    doc.activeElement = target;
    if (target) target.emit("focusin", { relatedTarget: previous });
  }
  function hover(key, type = "mouse") { button(key).emit("pointerenter", { pointerType: type }); }
  function down(key, type = "mouse", pointerButton = 0) {
    const event = { pointerType: type, button: pointerButton };
    doc.emit("pointerdown", event);
    button(key).emit("pointerdown", event);
  }
  function click(key, { detail = 1, pointerType } = {}) {
    let prevented = false;
    button(key).emit("click", { detail, pointerType, preventDefault() { prevented = true; } });
    return prevented;
  }
  function tap(key, type = "touch") {
    hover(key, type);
    down(key, type);
    focus(key);
    button(key).emit("pointerup", { pointerType: type });
    return click(key, { detail: 1, pointerType: type });
  }
  function keyboard(key, keyName = "Enter") {
    doc.emit("keydown", { key: keyName });
    button(key).emit("keydown", { key: keyName });
  }
  function listenerCount() { return [doc, win, preference, root, ...buttons].reduce((sum, item) => sum + item.count(), 0); }
  return { api, root, title, description, buttons, button, doc, preference, win, sections, sectionRoot, details, options,
    opens, handle, load, focus, hover, down, click, tap, keyboard, listenerCount };
}

test("默认照片、英文标题与有限层级", () => {
  const f = fixture();
  equal(f.root.dataset.selected, "moments");
  equal(f.title.textContent, "Moments");
  equal(f.button("moments").style.getPropertyValue("--stack-order"), "4");
  equal(f.buttons.map(item => item.getAttribute("aria-pressed")), ["true", "false", "false", "false"]);
  equal(f.buttons.filter(item => item.classList.contains("is-active")).length, 1);
  equal(f.opens.length, 0);
  f.handle.destroy();
});
test("鼠标悬停置顶，离开保留最后选择，多次切换不累积无限层级", () => {
  const f = fixture();
  f.hover("travels");
  equal(f.root.dataset.selected, "travels");
  equal(f.title.textContent, "Travels");
  equal(f.button("travels").style.getPropertyValue("--stack-order"), "4");
  f.button("travels").emit("pointerleave", { pointerType: "mouse" });
  equal(f.root.dataset.selected, "travels");
  for (let index = 0; index < 4000; index += 1) f.hover(keys[index % keys.length]);
  equal(f.buttons.map(item => Number(item.style.getPropertyValue("--stack-order"))).sort(), [1, 2, 3, 4]);
  equal(f.opens.length, 0);
  f.handle.destroy();
});
test("鼠标原生点击打开正确栏目，并保留原按钮与图像过渡源", () => {
  const f = fixture();
  keys.forEach(key => {
    f.hover(key);
    f.down(key);
    f.focus(key);
    f.click(key, { pointerType: "mouse" });
    const record = f.opens.at(-1);
    equal(record.group, "life");
    equal(record.key, key);
    equal(record.args.trigger, f.button(key));
    equal(record.args.source, f.button(key).image);
  });
  equal(f.opens.length, 4);
  f.handle.destroy();
});
test("键盘焦点优先于鼠标经过，离开焦点后恢复鼠标选择", () => {
  const f = fixture();
  f.doc.emit("keydown", { key: "Tab" });
  f.focus("creations");
  equal(f.root.dataset.selected, "creations");
  f.hover("travels");
  equal(f.root.dataset.selected, "creations");
  f.keyboard("creations");
  f.click("creations", { detail: 0 });
  equal(f.opens[0].key, "creations");
  f.focus(null);
  f.hover("travels");
  equal(f.root.dataset.selected, "travels");
  f.handle.destroy();
});
test("Space与辅助技术零detail点击直接打开，不依赖鼠标事件", () => {
  const f = fixture();
  f.focus("relationship");
  f.keyboard("relationship", " ");
  f.click("relationship", { detail: 0 });
  equal(f.opens.length, 1);
  equal(f.opens[0].key, "relationship");
  equal(f.opens[0].args.trigger, f.button("relationship"));
  f.handle.destroy();
});
test("触摸pointerenter→pointerdown→focusin→click首次只置顶，第二次进入", () => {
  const f = fixture();
  f.hover("travels", "touch");
  equal(f.root.dataset.selected, "moments", "触摸预进入事件不能抢先选中");
  equal(f.tap("travels"), true, "首次触摸点击被控制器消费");
  equal(f.root.dataset.selected, "travels");
  equal(f.title.textContent, "Travels");
  equal(f.opens.length, 0);
  equal(f.tap("travels"), false);
  equal(f.opens.length, 1);
  equal(f.opens[0].key, "travels");
  equal(f.opens[0].args.source, f.button("travels").image);
  f.handle.destroy();
});
test("当前正面的Moments首次触摸直接进入，切换其他照片仍需两次", () => {
  const f = fixture();
  f.tap("moments");
  equal(f.opens.length, 1);
  f.tap("relationship");
  equal(f.opens.length, 1);
  equal(f.root.dataset.selected, "relationship");
  f.tap("relationship");
  equal(f.opens.length, 2);
  equal(f.opens[1].key, "relationship");
  f.handle.destroy();
});
test("笔输入遵循两次轻点，触摸之后鼠标无需再点两次", () => {
  const f = fixture();
  f.hover("creations", "pen");
  equal(f.root.dataset.selected, "moments");
  f.tap("creations", "pen");
  equal(f.opens.length, 0);
  f.tap("creations", "pen");
  equal(f.opens.length, 1);
  f.down("travels", "mouse");
  f.focus("travels");
  f.click("travels", { pointerType: "mouse" });
  equal(f.opens.length, 2);
  equal(f.opens[1].key, "travels");
  f.handle.destroy();
});
test("取消触摸没有打开；随后键盘可立即进入且不残留触摸状态", () => {
  const f = fixture();
  f.down("relationship", "touch");
  f.button("relationship").emit("pointercancel", { pointerType: "touch" });
  equal(f.opens.length, 0);
  f.focus("relationship");
  f.keyboard("relationship");
  f.click("relationship", { detail: 0 });
  equal(f.opens.length, 1);
  equal(f.opens[0].key, "relationship");
  f.handle.destroy();
});
test("现代与旧式动态偏好均同步并正确移除监听", () => {
  [false, true].forEach(legacy => {
    const f = fixture({ legacy });
    equal(f.root.dataset.reducedMotion, "false");
    f.preference.matches = true;
    f.preference.emit("change");
    equal(f.root.dataset.reducedMotion, "true");
    f.preference.matches = false;
    f.preference.emit("change");
    equal(f.root.dataset.reducedMotion, "false");
    f.handle.destroy();
    equal(f.preference.count(), 0);
  });
});
test("销毁幂等且恢复DOM，无按钮或全局残留监听", () => {
  const f = fixture();
  ok(f.listenerCount() > 0);
  f.hover("relationship");
  f.handle.destroy();
  f.handle.destroy();
  equal(f.listenerCount(), 0);
  equal(f.root.dataset.selected, "moments");
  equal(f.title.textContent, "Moments");
  equal(f.description.textContent, "Static description");
  equal(f.buttons.map(button => button.getAttribute("aria-pressed")), [null, null, null, null]);
  equal(f.buttons.map(button => button.style.getPropertyValue("--stack-order")), ["", "", "", ""]);
  f.hover("travels");
  f.click("travels");
  equal(f.opens.length, 0);
  equal(f.root.dataset.selected, "moments");
});
test("重复挂载先清理旧实例，一次点击只打开一次", () => {
  const f = fixture();
  const previousCount = f.listenerCount();
  const next = f.api.mount(f.options);
  equal(f.listenerCount(), previousCount);
  f.down("travels");
  f.click("travels");
  equal(f.opens.length, 1);
  f.handle.destroy();
  equal(f.root.dataset.selected, "travels", "旧handle不影响新实例");
  next.destroy();
  equal(f.listenerCount(), 0);
});
test("局部配置覆盖、无效配置回退与缺少可选文案节点", () => {
  const f = fixture({ config: { defaultKey: "travels", entries: [{ key: "travels", title: "On the road", description: "Elsewhere." }, { key: "moments", title: "" }] } });
  equal(f.root.dataset.selected, "travels");
  equal(f.title.textContent, "On the road");
  equal(f.description.textContent, "Elsewhere.");
  f.hover("moments");
  equal(f.title.textContent, "Moments");
  f.handle.destroy();
  const fallback = fixture({ config: { defaultKey: "missing", entries: "invalid" }, missingTitle: true });
  equal(fallback.root.dataset.selected, "moments");
  fallback.hover("creations");
  equal(fallback.root.dataset.selected, "creations");
  fallback.handle.destroy();
  const blank = fixture({ mount: false });
  equal(typeof blank.api.mount().destroy, "function");
  blank.root.querySelectorAll = () => [];
  equal(typeof blank.api.mount(blank.options).destroy, "function");
  equal(blank.listenerCount(), 0);
});
test("缺少详情服务安全退化，显式false动态偏好不被matchMedia覆盖", () => {
  const f = fixture({ mount: false, preferenceValue: true });
  const mounted = f.api.mount({ root: f.root, reducedMotion: false });
  equal(f.root.dataset.reducedMotion, "false");
  f.down("travels");
  f.click("travels");
  equal(f.root.dataset.selected, "travels");
  equal(f.opens.length, 0);
  mounted.destroy();
  equal(f.listenerCount(), 0);
});
test("分区胶水保留路由别名，往返缓存保留实例，真正离开与重复初始化均清理", () => {
  const f = fixture({ mount: false });
  f.load("module.js");
  equal(f.sections.length, 1);
  equal(f.sections[0].id, "life");
  equal(JSON.stringify(f.sections[0].detailGroup.aliases), JSON.stringify({ places: "travels", notes: "creations", outside: "relationship" }));
  const options = { root: f.sectionRoot, details: f.details, reducedMotion: f.preference };
  const first = f.sections[0].init(options);
  const count = f.listenerCount();
  equal(f.win.count(), 1);
  f.win.emit("pagehide", { persisted: true });
  equal(f.listenerCount(), count);
  const second = f.sections[0].init(options);
  equal(f.listenerCount(), count);
  first();
  equal(f.listenerCount(), count);
  f.win.emit("pagehide", { persisted: false });
  equal(f.listenerCount(), 0);
  second();
  equal(f.listenerCount(), 0);
});
console.log(JSON.stringify({ workflows: results.length, assertions, results }, null, 2));
