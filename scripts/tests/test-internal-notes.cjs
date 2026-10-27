/* 内部材料离线回归：真实 KaTeX、内存 DOM 与临时数据，不访问浏览器、凭据或网络。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
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
  set textContent(value) { this.replaceChildren(...(value === "" ? [] : [this.ownerDocument.createTextNode(String(value))])); }
  get textContent() { return this.children.map(child => child.textContent).join(""); }
  set innerHTML(_) { throw new Error("Raw HTML assignment is forbidden."); }
  click() { this.dispatchEvent(new Event("click")); }
}
function fixture({math = true, records = true} = {}) {
  const data = new Map();
  const document = {
    compatMode: "CSS1Compat",
    createElement(tag) { return new Element(tag, this); },
    createElementNS(namespace, tag) { const node = this.createElement(tag); node.namespaceURI = namespace; return node; },
    createTextNode(text) { return {tagName: "#text", textContent: String(text), parentNode: null}; },
    createDocumentFragment() { return this.createElement("#fragment"); }
  };
  const window = {Homepage: {registerData: (key, value) => data.set(key, value), getData: key => data.get(key)}};
  const context = vm.createContext({window, document, URL, AbortController});
  const load = name => vm.runInContext(fs.readFileSync(path.join(ROOT, name), "utf8"), context, {filename: name, timeout: 1000});
  if (math) { load("shared/math/vendor/katex.min.js"); window.katex = context.katex; load("shared/math/render.js"); }
  load("modules/academic/publications/internal-note/groups.js");
  if (records) load("modules/academic/publications/internal-note/besiii/data.js");
  load("modules/academic/publications/internal-note/view.js");
  return {data, window, document, load, host: document.createElement("div")};
}
const nodes = element => [element, ...(element.children || []).flatMap(nodes)];
const byData = (element, key, value) => nodes(element).filter(item => item.dataset && Object.hasOwn(item.dataset, key) && (value === undefined || item.dataset[key] === value));
const byClass = (element, name) => nodes(element).filter(item => item.className?.split(" ").includes(name));
const validEntry = () => ({id: "sample", identifier: "SAMPLE", title: "A research note", authors: "A. Author", summary: [{text: "Research summary."}], url: "https://example.org/record.pdf"});
const validGroup = () => ({id: "sample-group", label: "Sample group", description: "A research group.", entries: [validEntry()]});

test("两篇 BESIII 记录、作者顺序、原始内部链接与缺日期契约", () => {
  const f = fixture(); const groups = f.window.Homepage.getInternalNoteGroups();
  equal(groups.length, 1); equal(groups[0].id, "besiii"); equal(groups[0].label, "BESIII");
  equal(plain(groups[0].entries.map(entry => entry.id)), ["bam1027", "bam1089"]);
  const [first, second] = groups[0].entries;
  for (const entry of groups[0].entries) {
    equal(entry.authors, "Li Yuhong, Ma Hailong, Zhao Minggang");
    equal(Object.hasOwn(entry, "date"), false); ok(entry.summary.length > 0);
  }
  equal(first.url, "https://docbes3.ihep.ac.cn/DocDB/0016/001613/020/MEMO_final.pdf");
  equal(second.url, "https://docbes3.ihep.ac.cn/DocDB/0017/001747/005/MEMO_chicJ_SigmaXiK_v2.3.pdf");
  const categoryData = new Map();
  Object.assign(f.window.Homepage, {registerPublicationCategory: item => categoryData.set(item.id, item)});
  f.load("modules/academic/publications/arxiv/data.js");
  equal(first.title, categoryData.get("arxiv").entries[0].title);
  equal(first.titleTex, categoryData.get("arxiv").entries[0].titleTex);
});

test("简介保留六组与十二组测量值及物理结论", () => {
  const f = fixture(); const [first, second] = f.window.Homepage.getInternalNoteGroups()[0].entries;
  const values = entry => entry.summary.map(part => part.text).join(" ").replace(/\s/g, "");
  const a = values(first), b = values(second);
  for (const value of ["1.13±0.13±0.13", "0.74±0.08±0.07", "1.16±0.11±0.14", "1.90±0.08±0.16", "1.40±0.05±0.11", "1.95±0.07±0.15"]) ok(a.includes(value), value);
  for (const value of ["1.52±0.10±0.16", "0.86±0.07±0.09", "1.01±0.07±0.08", "0.80±0.14±0.19", "0.36±0.08±0.12", "0.66±0.14±0.14", "3.06±0.17±0.29", "1.94±0.14±0.20", "2.21±0.14±0.24", "1.59±0.08±0.12", "0.98±0.06±0.08", "1.16±0.07±0.13"]) ok(b.includes(value), value);
  for (const value of ["2.712±0.014", "5σ", "2.25GeV/c²", "1.83GeV/c²", "isospinsymmetry"]) ok(b.includes(value), value);
  ok(b.includes("firstuncertaintiesarestatisticalandthesecondaresystematic"));
});

test("注册数据与返回值各自独立，未知字段不进入网页数据", () => {
  const f = fixture({records: false}); const input = validGroup();
  input.internal = "ignore"; input.entries[0].internal = "ignore"; input.entries[0].summary[0].internal = "ignore";
  f.window.Homepage.registerInternalNoteGroup(input);
  input.entries[0].title = "changed input"; input.entries[0].summary[0].text = "changed input";
  const copy = f.window.Homepage.getInternalNoteGroups();
  equal(copy[0].entries[0].title, "A research note"); equal(copy[0].entries[0].summary[0].text, "Research summary.");
  equal(Object.hasOwn(copy[0], "internal"), false); equal(Object.hasOwn(copy[0].entries[0], "internal"), false); equal(Object.hasOwn(copy[0].entries[0].summary[0], "internal"), false);
  copy[0].entries[0].summary[0].text = "changed output"; copy[0].entries.push(validEntry());
  equal(f.window.Homepage.getInternalNoteGroups()[0].entries[0].summary[0].text, "Research summary."); equal(f.window.Homepage.getInternalNoteGroups()[0].entries.length, 1);
  const other = validGroup(); other.id = "other-group"; f.window.Homepage.registerInternalNoteGroup(other);
  equal(f.window.Homepage.getInternalNoteGroups().length, 2, "不同课题组允许相同的本地记录标识");
});

test("重复标识、字段边界与不安全链接拒绝登记", () => {
  const register = group => fixture({records: false}).window.Homepage.registerInternalNoteGroup(group);
  for (const url of ["javascript:alert(1)", "http://example.org/", "https://user:pass@example.org/", "../note.pdf", " https://example.org/", "https://example.org/with space"]) { const g = validGroup(); g.entries[0].url = url; throws(() => register(g), /Invalid internal note/); }
  for (const patch of [{id: "Bad ID"}, {id: "a".repeat(65)}, {label: ""}, {description: ""}, {entries: null}, {entries: Array(501).fill(validEntry())}]) throws(() => register({...validGroup(), ...patch}), /Invalid internal note/);
  for (const patch of [{title: ""}, {authors: ""}, {identifier: ""}, {titleTex: "x".repeat(1601)}, {summary: []}, {summary: [{text: "x", tex: "x".repeat(2401)}]}, {summary: [{text: ""}]}]) { const g = validGroup(); Object.assign(g.entries[0], patch); throws(() => register(g), /Invalid internal note/); }
  const duplicateNotes = validGroup(); duplicateNotes.entries.push(validEntry()); throws(() => register(duplicateNotes), /Invalid internal note/);
  const f = fixture({records: false}); f.window.Homepage.registerInternalNoteGroup(validGroup()); throws(() => f.window.Homepage.registerInternalNoteGroup(validGroup()), /Duplicate internal note group/);
  f.data.set("publications.internal-note.groups", {malformed: true}); throws(() => f.window.Homepage.getInternalNoteGroups(), /unavailable/);
});

test("课题组选择、详情返回、未知分组和空集合", () => {
  const f = fixture(); const routes = []; const view = f.window.Homepage.createInternalNotesView({onNavigate: route => routes.push(route)});
  view.render({host: f.host}); equal(byData(f.host, "internalNoteView", "groups").length, 1);
  byData(f.host, "internalNoteGroup", "besiii")[0].click(); equal(routes.pop(), "internal-note-besiii");
  view.render({host: f.host, route: "internal-note-besiii"}); equal(byData(f.host, "internalNoteId").length, 2);
  byData(f.host, "internalNoteBack", "groups")[0].click(); equal(routes.pop(), "internal-note");
  byData(f.host, "internalNoteBack", "categories")[0].click(); equal(routes.pop(), null);
  view.render({host: f.host, route: "internal-note-missing"}); equal(byData(f.host, "internalNoteView", "not-found").length, 1);
  equal(byData(f.host, "internalNoteId").length, 0);
  f.window.Homepage.createInternalNotesView({groups: []}).render({host: f.host}); ok(f.host.textContent.includes("No research groups yet"));
  f.window.Homepage.createInternalNotesView({groups: [{...validGroup(), entries: []}]}).render({host: f.host, route: "internal-note-sample-group"}); ok(f.host.textContent.includes("No internal notes yet"));
});

test("真实数学排版、外链保护属性与不下载内部文档", () => {
  const f = fixture(); f.window.Homepage.createInternalNotesView().render({host: f.host, route: "internal-note-besiii"});
  const articles = byData(f.host, "internalNoteId"); equal(articles.length, 2);
  for (const article of articles) {
    equal(byClass(article, "internal-notes__title")[0].getAttribute("data-math-rendered"), "true");
    ok(byClass(article, "katex-mathml").length > 10); ok(nodes(article).some(node => node.tagName === "mover")); ok(nodes(article).some(node => node.tagName === "msub"));
    const record = f.window.Homepage.getInternalNoteGroups()[0].entries.find(entry => entry.id === article.dataset.internalNoteId);
    const paragraphs = byClass(article, "internal-notes__summary-paragraph");
    record.summary.forEach((part, index) => { if (part.tex) equal(paragraphs[index].getAttribute("data-math-rendered"), "true", "声明的公式段必须通过共享服务完整渲染"); });
    const link = byData(article, "internalNoteLink")[0]; equal(link.target, "_blank"); equal(link.rel, "noopener noreferrer"); equal(link.getAttribute("download"), null);
    ok(article.textContent.includes("BESIII access required.")); equal(nodes(article).filter(node => ["iframe", "object", "embed"].includes(node.tagName)).length, 0);
  }
  equal(byClass(f.host, "katex-error").length, 0);
});

test("异常资料、缺数学服务与恶意文本均有可读回退", () => {
  const f = fixture({math: false}); const g = validGroup();
  g.entries[0].title = '<img src=x onerror="fail()">'; g.entries[0].titleTex = "Bad \\(x"; g.entries[0].summary[0] = {text: "<script>fail()</script>", tex: "Bad \\(x"};
  f.window.Homepage.createInternalNotesView({groups: [g]}).render({host: f.host, route: "internal-note-sample-group"});
  ok(f.host.textContent.includes('<img src=x onerror="fail()">')); ok(f.host.textContent.includes("<script>fail()</script>"));
  equal(nodes(f.host).filter(node => ["script", "img"].includes(node.tagName)).length, 0);
  for (const source of [() => { throw new Error("temporary"); }, null, [{...validGroup(), entries: [{...validEntry(), url: "javascript:fail()"}]}]]) {
    f.window.Homepage.createInternalNotesView({groups: source}).render({host: f.host}); equal(byData(f.host, "internalNoteView", "unavailable").length, 1); equal(byData(f.host, "internalNoteLink").length, 0);
  }
});

test("取消、重复挂载与幂等卸载不会留下可用旧导航", () => {
  const f = fixture(); const routes = []; const view = f.window.Homepage.createInternalNotesView({onNavigate: route => routes.push(route)});
  const firstSignal = new AbortController(); const cleanup = view.render({host: f.host, signal: firstSignal.signal});
  const stale = byData(f.host, "internalNoteGroup", "besiii")[0]; firstSignal.abort(); equal(f.host.children.length, 0); stale.click(); equal(routes.length, 0); cleanup(); cleanup();
  view.render({host: f.host}); const replaced = byData(f.host, "internalNoteGroup", "besiii")[0]; view.render({host: f.host}); equal(byData(f.host, "internalNoteView").length, 1); replaced.click(); equal(routes.length, 0);
  byData(f.host, "internalNoteGroup", "besiii")[0].click(); equal(routes.length, 1);
  const preAborted = new AbortController(); preAborted.abort(); view.render({host: f.host, signal: preAborted.signal}); equal(f.host.children.length, 0);
});

test("Publications 委托分组视图并按全部课题组计算数量", () => {
  const f = fixture(); f.load("modules/academic/publications/data.js");
  for (const name of ["internal-note/data.js", "arxiv/data.js", "published/data.js"]) f.load("modules/academic/publications/" + name);
  f.load("modules/academic/publications/view.js"); const routes = [];
  const view = f.window.Homepage.createPublicationsView({onNavigate: route => routes.push(route)});
  view.render({host: f.host}); const internal = byData(f.host, "publicationCategory", "internal-note")[0]; ok(internal.textContent.includes("2 records"));
  view.render({host: f.host, route: "internal-note"}); byData(f.host, "internalNoteGroup", "besiii")[0].click(); equal(routes.pop(), "internal-note-besiii");
  view.render({host: f.host, route: "internal-note-besiii"}); equal(byData(f.host, "internalNoteId").length, 2);
  view.render({host: f.host, route: "arxiv"}); equal(byData(f.host, "internalNoteView").length, 0); equal(byData(f.host, "publicationId", "arxiv-2610-11981").length, 1);
  view.render({host: f.host, route: "published"}); ok(f.host.textContent.includes("No published papers yet"));
});
console.log(JSON.stringify({status: "passed", assertions, checks, limits: ["离线内存 DOM 与真实 KaTeX；不代替浏览器视觉、字体、焦点、历史或手机真机测试。", "未请求内部 PDF、未读取凭据、未写入远端。"]}, null, 2));
