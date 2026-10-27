/* 项目目录离线回归：内存DOM与正式登记，不打开浏览器、不联网或读取凭据。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "..");
const BASE = "modules/academic/projects/";
let assertions = 0;
const checks = [];
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const equal = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); assertions += 1; };
const throws = (task, pattern) => { assert.throws(task, pattern); assertions += 1; };
const plain = value => JSON.parse(JSON.stringify(value));
function test(name, task) { const before = assertions; task(); checks.push({name, assertions: assertions - before}); }
class Element extends EventTarget {
  constructor(tagName, document) {
    super(); Object.assign(this, {tagName, ownerDocument: document, children: [], attributes: {}, dataset: {}, style: {}, className: "", parentNode: null});
  }
  get childNodes() { return this.children; }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name.startsWith("data-")) delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())];
  }
  appendChild(child) {
    if (child.tagName === "#fragment") { [...child.children].forEach(item => this.appendChild(item)); child.children = []; }
    else { child.remove?.(); child.parentNode = this; this.children.push(child); }
    return child;
  }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  replaceChildren(...children) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; this.append(...children); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null;
  }
  contains(child) { return this === child || this.children.some(item => item.contains?.(child)); }
  set textContent(value) { this.replaceChildren(...(value === "" ? [] : [this.ownerDocument.createTextNode(String(value))])); }
  get textContent() { return this.children.map(child => child.textContent).join(""); }
  set innerHTML(_) { throw new Error("Raw HTML assignment is forbidden."); }
  click(options = {}) {
    const event = new Event("click", {cancelable: true});
    Object.assign(event, {button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false}, options);
    this.dispatchEvent(event);
    return event;
  }
}
function fixture({registered = true} = {}) {
  const data = new Map(), content = {};
  const document = {
    createElement(tag) { return new Element(tag, this); },
    createTextNode(text) { return {tagName: "#text", textContent: String(text), parentNode: null}; },
    createDocumentFragment() { return this.createElement("#fragment"); }
  };
  const api = {registerData: (key, value) => data.set(key, value), getData: key => data.get(key),
    registerDetail(group, key, value) { (content[group] ||= {})[key] = value; }, getContent: () => content};
  const window = {Homepage: api};
  const context = vm.createContext({window, document, URL, AbortController});
  const load = name => vm.runInContext(fs.readFileSync(path.join(ROOT, BASE + name), "utf8"), context, {filename: BASE + name, timeout: 1000});
  load("registry.js"); load("entry.js"); load("content.js");
  if (registered) {
    for (const name of ["experiment-atlas/metadata.js", "experiment-atlas/registry.js", "experiment-atlas/view.js", "experiment-atlas/entry.js", "experiment-atlas/integration.js", "physicists/metadata.js", "physicists/view.js", "physicists/integration.js"]) load(name);
  }
  load("view.js");
  return {api, data, content, document, load, host: document.createElement("div")};
}
const nodes = element => [element, ...(element.children || []).flatMap(nodes)];
const byData = (element, key, value) => nodes(element).filter(item => item.dataset && Object.hasOwn(item.dataset, key) && (value === undefined || item.dataset[key] === value));
const entryLink = (element, title) => nodes(element).find(node => node.tagName === "a" && node.getAttribute("aria-label") === "Open " + title);
const byClass = (element, name) => nodes(element).filter(item => item.className?.split(" ").includes(name));
const render = (f, options = {}) => f.api.createProjectsView({content: () => f.content.academic.projects}).render({host: f.host, ...options});
const sample = () => ({id: "sample", title: "Sample", description: "A project.", summary: "In preparation"});

test("两个项目独立登记，返回元信息冻结且没有泄露实现字段", () => {
  const f = fixture(), projects = f.api.getAcademicProjects();
  equal(plain(projects.map(item => item.id)), ["physics-maps", "physicists"]);
  equal(plain(projects.map(item => item.title)), ["Physics Maps", "Physicists"]);
  equal(plain(projects.map(item => item.summary)), ["2 maps", "721 physicists"]);
  ok(Object.isFrozen(projects)); ok(projects.every(Object.isFrozen));
  throws(() => { projects[0].title = "Changed"; }, TypeError);
  equal(f.api.getAcademicProjects()[0].title, "Physics Maps");
  for (const project of projects) {
    equal(Object.hasOwn(project, "render"), false); equal(Object.hasOwn(project, "renderEntry"), false);
    const view = f.api.getAcademicProjectView(project.id);
    equal(typeof view.render, "function"); equal(typeof view.renderEntry, "function"); ok(Object.isFrozen(view));
  }
  equal(f.api.getAcademicProjectView("missing"), null);
});

test("登记拒绝歧义路由与重复标识，两项目统计动态读取并隔离故障", () => {
  const f = fixture({registered: false}), view = {render() {}};
  for (const patch of [{id: "Bad ID"}, {id: "a/b"}, {id: "a".repeat(65)}, {title: ""}, {description: ""}, {summary: ""}, {summary: "x".repeat(121)}]) throws(() => f.api.registerAcademicProject({...sample(), ...patch}, view), /Invalid academic project/);
  throws(() => f.api.registerAcademicProject(sample(), {}), /Invalid academic project/);
  throws(() => f.api.registerAcademicProject(sample(), {render() {}, renderEntry: "not callable"}), /Invalid academic project/);
  const descriptor = {...sample(), internal: "not public"}; f.api.registerAcademicProject(descriptor, view); descriptor.title = "Changed input";
  equal(f.api.getAcademicProjects()[0].title, "Sample"); equal(Object.hasOwn(f.api.getAcademicProjects()[0], "internal"), false);
  throws(() => f.api.registerAcademicProject(sample(), view), /Duplicate academic project/);
  const real = fixture(); real.api.getExperimentMaps = () => [{id: "one"}]; equal(real.api.getAcademicProjects()[0].summary, "1 map");
  real.api.getExperimentMaps = () => { throw new Error("unavailable"); }; equal(real.api.getAcademicProjects()[0].summary, ""); equal(real.api.getAcademicProjects()[1].summary, "721 physicists");
  const independent = fixture(), getData = independent.api.getData;
  independent.api.getData = key => key === "physicists:archive" ? {peopleCount: 12} : getData(key);
  equal(independent.api.getAcademicProjects()[1].summary, "12 physicists"); equal(independent.api.getAcademicProjects()[0].summary, "2 maps");
  independent.api.getData = key => { if (key === "physicists:archive") throw new Error("archive metadata unavailable"); return getData(key); };
  equal(independent.api.getAcademicProjects()[1].summary, ""); equal(independent.api.getAcademicProjects()[0].summary, "2 maps");
});

test("Projects直接展示两张独立视觉入口，保留GitHub且移除BESIII合作组入口", () => {
  const f = fixture(), routes = [];
  f.api.createProjectsView({content: () => f.content.academic.projects, onNavigate: route => routes.push(route)}).render({host: f.host});
  equal(byData(f.host, "projectView", "directory").length, 1);
  equal(byData(f.host, "academicProject").length, 2); equal(byData(f.host, "experimentMap").length, 0);
  equal(byClass(f.host, "project-directory__collaboration").length, 0);
  const links = nodes(f.host).filter(node => node.tagName === "a");
  equal(links.some(link => link.href === "http://bes3.ihep.ac.cn/"), false);
  ok(!f.host.textContent.includes("Research collaborations")); ok(!f.host.textContent.includes("BESIII Collaboration"));
  const github = links.find(link => link.href === "https://github.com/PaulLi07"); ok(github);
  equal(github.target, "_blank"); equal(github.rel, "noopener noreferrer");
  const maps = entryLink(f.host, "Physics Maps"), people = entryLink(f.host, "Physicists"); ok(maps); ok(people);
  equal(maps.href, "#academic/projects/physics-maps"); equal(people.href, BASE + "physicists/archive/website/site/index.html");
  equal(byClass(f.host, "project-entry").length, 2);
  ok(people.textContent.includes("721 physicists")); ok(people.textContent.includes("691 milestones"));
  ok(maps.textContent.includes("2 maps")); ok(maps.textContent.includes("549 experiments"));
  equal(nodes(people).filter(node => node.tagName === "img").length, 3);
  equal(nodes(maps).filter(node => node.tagName === "img").length, 2);
  equal(nodes(f.host).filter(node => ["iframe", "script"].includes(node.tagName)).length, 0);
  const records = f.data.get("physicists:archive"); equal(records.people, undefined);
  for (const image of nodes(f.host).filter(node => node.tagName === "img")) ok(fs.statSync(path.join(ROOT, image.src)).isFile());
});

test("人物入口一次原生跳转，地图入口保留普通导航与修饰键行为", () => {
  const f = fixture(), routes = [];
  f.api.createProjectsView({onNavigate: route => routes.push(route)}).render({host: f.host});
  const maps = entryLink(f.host, "Physics Maps"), people = entryLink(f.host, "Physicists");
  const personClick = people.click(); equal(personClick.defaultPrevented, false); equal(routes.length, 0);
  equal(new URL(people.href, "https://example.test/personal-homepage/index.html").pathname,
    "/personal-homepage/" + BASE + "physicists/archive/website/site/index.html");
  for (const option of [{ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}]) {
    equal(maps.click(option).defaultPrevented, false); equal(routes.length, 0);
  }
  equal(maps.click().defaultPrevented, true); equal(routes.pop(), "physics-maps");
});

test("可选视觉入口向后兼容未提供入口视图的项目", () => {
  const f = fixture({registered: false}), routes = [];
  f.api.registerAcademicProject(sample(), {render() {}});
  f.api.createProjectsView({onNavigate: route => routes.push(route)}).render({host: f.host});
  const buttons = byData(f.host, "academicProject", "sample"); equal(buttons.length, 1);
  ok(f.host.textContent.includes("Sample")); ok(f.host.textContent.includes("In preparation"));
  equal(f.api.getAcademicProjectView("sample").renderEntry, undefined);
  buttons[0].click(); equal(routes.pop(), "sample");
});

test("入口渲染故障与取消仅清理所属入口，不污染兄弟项目", () => {
  const f = fixture(), signals = {}, routes = [], cleanupCounts = {}, entryButtons = {};
  const entryView = id => ({render() {}, renderEntry({host, signal, navigate}) {
    signals[id] = signal;
    if (id === "physics-maps") { host.append(f.document.createElement("iframe")); throw new Error("entry unavailable"); }
    const button = f.document.createElement("button"); button.textContent = "Surviving entry";
    button.addEventListener("click", () => navigate(id), {signal}); entryButtons[id] = button; host.append(button);
    return () => { cleanupCounts[id] = (cleanupCounts[id] || 0) + 1; host.replaceChildren(); };
  }});
  const view = f.api.createProjectsView({viewFor: entryView, onNavigate: route => routes.push(route)});
  const outer = new AbortController(), cleanup = view.render({host: f.host, signal: outer.signal});
  equal(byData(f.host, "projectView", "directory").length, 1);
  equal(nodes(f.host).filter(node => node.tagName === "iframe").length, 0);
  ok(f.host.textContent.includes("Surviving entry")); ok(signals["physics-maps"].aborted); equal(signals.physicists.aborted, false);
  entryButtons.physicists.click(); equal(routes.pop(), "physicists");
  outer.abort(); equal(f.host.children.length, 0); ok(signals.physicists.aborted); equal(cleanupCounts.physicists, 1);
  entryButtons.physicists.click(); equal(routes.length, 0); cleanup(); cleanup(); equal(cleanupCounts.physicists, 1);
});

test("Physics Maps下才显示两张地图，原统计与本地普通链接保留", () => {
  const f = fixture(), routes = [];
  f.api.createProjectsView({onNavigate: route => routes.push(route)}).render({host: f.host, route: "physics-maps"});
  equal(byData(f.host, "projectView", "project").length, 1); equal(byData(f.host, "projectId", "physics-maps").length, 1);
  const maps = byData(f.host, "experimentMap"); equal(maps.length, 2); equal(maps[0].dataset.experimentMap, "neutrino"); equal(maps[1].dataset.experimentMap, "dark-matter");
  equal(maps[0].href, BASE + "experiment-atlas/neutrino/"); equal(maps[1].href, BASE + "experiment-atlas/dark-matter/");
  ok(maps[0].textContent.includes("252 experiments")); ok(maps[1].textContent.includes("297 experiments"));
  equal(nodes(f.host).filter(node => node.tagName === "time").length, 2);
  equal(byClass(f.host, "project-directory__collaboration").length, 0); equal(byData(f.host, "academicProject").length, 0);
  byData(f.host, "projectBack")[0].click(); equal(routes.pop(), null);
});

test("Physicists展示本地档案入口与真实统计，只加载三幅缩略图而不嵌套应用", () => {
  const f = fixture(); render(f, {route: "physicists"});
  equal(byData(f.host, "projectId", "physicists").length, 1); equal(byData(f.host, "physicistsProject").length, 1);
  ok(f.host.textContent.includes("721 physicists")); ok(f.host.textContent.includes("691 milestones"));
  ok(!f.host.textContent.includes("In preparation"));
  equal(byData(f.host, "experimentMap").length, 0); equal(byClass(f.host, "project-directory__collaboration").length, 0);
  const project = byData(f.host, "physicistsProject")[0], anchors = nodes(project).filter(node => node.tagName === "a");
  equal(anchors.length, 1); equal(anchors[0].getAttribute("aria-label"), "Open Physicists");
  equal(anchors[0].href, BASE + "physicists/archive/website/site/index.html");
  ok(fs.statSync(path.join(ROOT, anchors[0].href)).isFile());
  equal(nodes(project).filter(node => ["iframe", "script"].includes(node.tagName)).length, 0);
  const portraits = nodes(project).filter(node => node.tagName === "img"); equal(portraits.length, 3);
  for (const image of portraits) {
    ok(image.src.startsWith(BASE + "physicists/archive/portraits/"));
    ok(fs.statSync(path.join(ROOT, image.src)).isFile()); ok(typeof image.alt === "string" && image.alt.length > 0);
  }
  equal(f.data.get("physicists:archive").people, undefined);
});

test("人物摘要失效时保留可读外壳与返回，错误图片路径不会成为网页资源", () => {
  const f = fixture(), view = f.api.createPhysicistsView({archive: () => { throw new Error("unavailable"); }});
  view.render({host: f.host}); ok(f.host.textContent.includes("The archive is temporarily unavailable"));
  equal(byData(f.host, "physicistsOpen").length, 0); equal(byData(f.host, "physicistsProject").length, 1);
  for (const archive of [null, {peopleCount: 0, milestoneCount: 0}, {peopleCount: 1, milestoneCount: -1}]) {
    f.api.createPhysicistsView({archive}).render({host: f.host});
    equal(byData(f.host, "physicistsOpen").length, 0); ok(f.host.textContent.includes("temporarily unavailable"));
  }
  const valid = f.data.get("physicists:archive").portraits[0];
  const supplied = {peopleCount: 721, milestoneCount: 691, href: "javascript:alert(1)", portraits: [
    {...valid, src: "https://example.invalid/portrait.jpg"}, {...valid, src: BASE + "physicists/archive/portraits/../../../../../outside.jpg"}, valid
  ]};
  const before = JSON.stringify(supplied);
  f.api.createPhysicistsView({archive: supplied}).render({host: f.host});
  const images = nodes(f.host).filter(node => node.tagName === "img"); equal(images.length, 1); equal(images[0].src, valid.src);
  equal(byData(f.host, "physicistsOpen")[0].href, BASE + "physicists/archive/website/site/index.html");
  equal(JSON.stringify(supplied), before);
  const routes = []; f.api.getData = () => { throw new Error("metadata unavailable"); };
  f.api.createProjectsView({onNavigate: route => routes.push(route)}).render({host: f.host, route: "physicists"});
  ok(f.host.textContent.includes("temporarily unavailable")); byData(f.host, "projectBack")[0].click(); equal(routes.pop(), null);
});

test("人物项目重复挂载和取消只清理所属根节点，切换地图不残留档案入口", () => {
  const f = fixture(), view = f.api.createPhysicistsView(), controller = new AbortController();
  const outside = f.document.createElement("aside"); outside.textContent = "Other module";
  const first = view.render({host: f.host}), previous = byData(f.host, "physicistsProject")[0];
  const second = view.render({host: f.host, signal: controller.signal});
  equal(previous.parentNode, null); equal(byData(f.host, "physicistsProject").length, 1);
  first(); equal(byData(f.host, "physicistsProject").length, 1);
  controller.abort(); equal(f.host.children.length, 0); second(); second(); equal(f.host.children.length, 0);
  equal(outside.textContent, "Other module");
  const aborted = new AbortController(); aborted.abort(); view.render({host: f.host, signal: aborted.signal}); equal(f.host.children.length, 0);
  const parent = f.api.createProjectsView(); parent.render({host: f.host, route: "physicists"});
  equal(byData(f.host, "physicistsOpen").length, 1); parent.render({host: f.host, route: "physics-maps"});
  equal(byData(f.host, "physicistsProject").length, 0); equal(byData(f.host, "physicistsOpen").length, 0);
  equal(byData(f.host, "experimentMap").length, 2);
});

test("未知或故障项目提供可用返回，失败子视图的取消不影响父导航", () => {
  const f = fixture(), routes = [];
  const normal = f.api.createProjectsView({onNavigate: route => routes.push(route)});
  normal.render({host: f.host, route: "missing"}); equal(byData(f.host, "projectView", "not-found").length, 1); ok(f.host.textContent.includes("Project not found"));
  byData(f.host, "projectBack")[0].click(); equal(routes.pop(), null);
  let childSignal;
  const failing = f.api.createProjectsView({onNavigate: route => routes.push(route), viewFor: () => ({render({host, signal}) { childSignal = signal; host.append(f.document.createElement("iframe")); throw new Error("temporary"); }})});
  failing.render({host: f.host, route: "physicists"}); equal(byData(f.host, "projectView", "unavailable").length, 1); ok(f.host.textContent.includes("Project unavailable")); ok(childSignal.aborted);
  equal(nodes(f.host).filter(node => node.tagName === "iframe").length, 0); byData(f.host, "projectBack")[0].click(); equal(routes.pop(), null);
  f.api.createProjectsView({projects: () => { throw new Error("temporary"); }}).render({host: f.host}); equal(byData(f.host, "projectView", "unavailable").length, 1);
});

test("重复挂载、取消与幂等清理隔离子视图，旧导航不能继续触发", () => {
  const f = fixture(), routes = [], view = f.api.createProjectsView({onNavigate: route => routes.push(route)});
  const firstSignal = new AbortController(), cleanup = view.render({host: f.host, signal: firstSignal.signal});
  const stale = entryLink(f.host, "Physics Maps"); firstSignal.abort(); equal(f.host.children.length, 0); stale.click(); equal(routes.length, 0); cleanup(); cleanup();
  let disposals = 0, childSignal;
  const custom = f.api.createProjectsView({viewFor: () => ({render({host, signal}) { childSignal = signal; host.textContent = "Temporary child"; return () => { disposals += 1; host.replaceChildren(); }; }})});
  const first = custom.render({host: f.host, route: "physicists"}); custom.render({host: f.host}); equal(disposals, 1); ok(childSignal.aborted); first(); equal(disposals, 1);
  equal(byData(f.host, "projectView", "directory").length, 1);
  const preAborted = new AbortController(); preAborted.abort(); custom.render({host: f.host, signal: preAborted.signal}); equal(f.host.children.length, 0);
  const other = f.document.createElement("aside"); other.textContent = "Other module"; render(f, {route: "physics-maps"}); equal(other.textContent, "Other module");
});

test("地图资料不可用时保留项目外壳，地图子视图可独立重复卸载", () => {
  const f = fixture();
  f.api.createExperimentAtlasView({maps: () => { throw new Error("temporary"); }}).render({host: f.host});
  ok(f.host.textContent.includes("Maps are temporarily unavailable")); equal(byData(f.host, "experimentMap").length, 0);
  const view = f.api.createExperimentAtlasView(), controller = new AbortController();
  const cleanup = view.render({host: f.host, signal: controller.signal}); equal(byData(f.host, "experimentMap").length, 2); controller.abort(); equal(f.host.children.length, 0); cleanup(); cleanup();
  const person = f.api.createPhysicistsView(), cancel = new AbortController(); person.render({host: f.host, signal: cancel.signal}); cancel.abort(); equal(f.host.children.length, 0);
});

console.log(JSON.stringify({status: "passed", assertions, checks, limits: ["离线内存DOM与正式项目登记，不代替浏览器布局、焦点、历史、字体或手机真机测试。", "未请求地图网络资源、未读取凭据、未改写正式数据或远端。"]}, null, 2));
