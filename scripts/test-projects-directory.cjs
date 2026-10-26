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
  click() { this.dispatchEvent(new Event("click")); }
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
  load("registry.js"); load("content.js");
  if (registered) {
    for (const name of ["experiment-atlas/metadata.js", "experiment-atlas/registry.js", "experiment-atlas/view.js", "experiment-atlas/integration.js", "physicists/view.js", "physicists/integration.js"]) load(name);
  }
  load("view.js");
  return {api, data, content, document, load, host: document.createElement("div")};
}
const nodes = element => [element, ...(element.children || []).flatMap(nodes)];
const byData = (element, key, value) => nodes(element).filter(item => item.dataset && Object.hasOwn(item.dataset, key) && (value === undefined || item.dataset[key] === value));
const byClass = (element, name) => nodes(element).filter(item => item.className?.split(" ").includes(name));
const render = (f, options = {}) => f.api.createProjectsView({content: () => f.content.academic.projects}).render({host: f.host, ...options});
const sample = () => ({id: "sample", title: "Sample", description: "A project.", summary: "In preparation"});

test("两个项目独立登记，返回元信息冻结且没有泄露实现字段", () => {
  const f = fixture(), projects = f.api.getAcademicProjects();
  equal(plain(projects.map(item => item.id)), ["physics-maps", "physicists"]);
  equal(plain(projects.map(item => item.title)), ["Physics Maps", "Physicists"]);
  equal(plain(projects.map(item => item.summary)), ["2 maps", "In preparation"]);
  ok(Object.isFrozen(projects)); ok(projects.every(Object.isFrozen));
  throws(() => { projects[0].title = "Changed"; }, TypeError);
  equal(f.api.getAcademicProjects()[0].title, "Physics Maps");
  for (const project of projects) { equal(Object.hasOwn(project, "render"), false); equal(typeof f.api.getAcademicProjectView(project.id).render, "function"); }
  equal(f.api.getAcademicProjectView("missing"), null);
});

test("登记拒绝歧义路由与重复标识，统计从地图getter动态读取并隔离故障", () => {
  const f = fixture({registered: false}), view = {render() {}};
  for (const patch of [{id: "Bad ID"}, {id: "a/b"}, {id: "a".repeat(65)}, {title: ""}, {description: ""}, {summary: ""}, {summary: "x".repeat(121)}]) throws(() => f.api.registerAcademicProject({...sample(), ...patch}, view), /Invalid academic project/);
  throws(() => f.api.registerAcademicProject(sample(), {}), /Invalid academic project/);
  const descriptor = {...sample(), internal: "not public"}; f.api.registerAcademicProject(descriptor, view); descriptor.title = "Changed input";
  equal(f.api.getAcademicProjects()[0].title, "Sample"); equal(Object.hasOwn(f.api.getAcademicProjects()[0], "internal"), false);
  throws(() => f.api.registerAcademicProject(sample(), view), /Duplicate academic project/);
  const real = fixture(); real.api.getExperimentMaps = () => [{id: "one"}]; equal(real.api.getAcademicProjects()[0].summary, "1 map");
  real.api.getExperimentMaps = () => { throw new Error("unavailable"); }; equal(real.api.getAcademicProjects()[0].summary, ""); equal(real.api.getAcademicProjects()[1].summary, "In preparation");
});

test("Projects父目录只有两个项目入口，BESIII与GitHub属于独立合作组区", () => {
  const f = fixture(), routes = [];
  f.api.createProjectsView({content: () => f.content.academic.projects, onNavigate: route => routes.push(route)}).render({host: f.host});
  equal(byData(f.host, "projectView", "directory").length, 1);
  equal(byData(f.host, "academicProject").length, 2); equal(byData(f.host, "experimentMap").length, 0);
  equal(byClass(f.host, "project-directory__collaboration").length, 1);
  const links = nodes(f.host).filter(node => node.tagName === "a");
  ok(links.some(link => link.href === "http://bes3.ihep.ac.cn/")); ok(links.some(link => link.href === "https://github.com/PaulLi07"));
  byData(f.host, "academicProject", "physics-maps")[0].click(); equal(routes.pop(), "physics-maps");
  byData(f.host, "academicProject", "physicists")[0].click(); equal(routes.pop(), "physicists");
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

test("Physicists只有明确占位，不混入地图、人员数据或无效入口", () => {
  const f = fixture(); render(f, {route: "physicists"});
  equal(byData(f.host, "projectId", "physicists").length, 1); equal(byData(f.host, "physicistsProject").length, 1);
  ok(f.host.textContent.includes("In preparation")); ok(f.host.textContent.includes("Project details will be added here."));
  equal(byData(f.host, "experimentMap").length, 0); equal(byClass(f.host, "project-directory__collaboration").length, 0);
  const project = byData(f.host, "physicistsProject")[0]; equal(nodes(project).filter(node => ["img", "a", "iframe"].includes(node.tagName)).length, 0);
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
  const stale = byData(f.host, "academicProject")[0]; firstSignal.abort(); equal(f.host.children.length, 0); stale.click(); equal(routes.length, 0); cleanup(); cleanup();
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
