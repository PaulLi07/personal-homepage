/* 本地数学服务离线回归：使用真实 KaTeX 和内存 DOM，不启动浏览器、不联网。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
let assertions = 0;
const checks = [];
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const equal = (value, expected, message) => { assert.deepStrictEqual(value, expected, message); assertions += 1; };
function test(name, task) { const before = assertions; task(); checks.push({name, assertions: assertions - before}); }

class Element {
  constructor(tagName, document) {
    this.tagName = tagName;
    this.ownerDocument = document;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.className = "";
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  appendChild(child) {
    if (child.tagName === "#fragment") this.children.push(...child.children);
    else this.children.push(child);
    return child;
  }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  set textContent(text) {
    this.children = text === "" ? [] : [{tagName: "#text", textContent: String(text)}];
  }
  get textContent() { return this.children.map(child => child.textContent).join(""); }
  set innerHTML(_) { throw new Error("Raw HTML assignment is forbidden in this test."); }
}
function fixture({library = true} = {}) {
  const document = {
    compatMode: "CSS1Compat",
    createElement(tag) { return new Element(tag, this); },
    createElementNS(namespace, tag) { const node = this.createElement(tag); node.namespaceURI = namespace; return node; },
    createTextNode(text) { return {tagName: "#text", textContent: String(text)}; },
    createDocumentFragment() { return this.createElement("#fragment"); }
  };
  const window = {Homepage: {}};
  const context = vm.createContext({window, document, URL, AbortController});
  const load = filename => vm.runInContext(fs.readFileSync(path.join(root, filename), "utf8"), context, {filename, timeout: 1000});
  if (library) { load("shared/math/vendor/katex.min.js"); window.katex = context.katex; }
  load("shared/math/render.js");
  return {window, document, load, host: document.createElement("h4")};
}
function nodes(element) { return [element, ...(element.children || []).flatMap(nodes)]; }
function classNodes(element, name) { return nodes(element).filter(node => node.className?.split(" ").includes(name)); }
function publications(environment) {
  const data = new Map();
  Object.assign(environment.window.Homepage, {
    registerData(key, value) { data.set(key, value); },
    getData(key) { return data.get(key); }
  });
  ["data.js", "internal-note/data.js", "arxiv/data.js", "published/data.js"].forEach(file => environment.load("modules/academic/publications/" + file));
  return environment.window.Homepage.getPublicationCategories();
}

test("真实排版保留数学斜体、上下标、反粒子横线及辅助 MathML", () => {
  const f = fixture();
  equal(f.window.katex.version, "0.19.0");
  const categories = publications(f);
  const entry = categories.find(item => item.id === "arxiv").entries[0];
  equal(f.window.Homepage.math.renderText(f.host, entry.titleTex, {fallback: entry.title}), true);
  equal(f.host.getAttribute("data-math-rendered"), "true");
  equal(classNodes(f.host, "math-inline").length, 2);
  equal(classNodes(f.host, "katex-mathml").length, 2);
  ok(classNodes(f.host, "mathnormal").some(node => node.textContent === "K"));
  ok(nodes(f.host).some(node => node.tagName === "msub"));
  ok(nodes(f.host).some(node => node.tagName === "msubsup"));
  ok(nodes(f.host).some(node => node.tagName === "mover"));
  ok(classNodes(f.host, "mathrm").some(node => node.textContent === "c.c."));
  ok(classNodes(f.host, "katex-base").length >= 6, "两个衰变式分别可在关系符和加号后折行");
  equal(f.host.children[0].textContent, "Observation of ");
  equal(f.host.children[2].textContent, " and improved measurements of ");
});

test("普通文本保持文本节点，禁止原始 HTML 注入", () => {
  const f = fixture();
  const source = '<img src=x onerror="alert(1)"> \\(x^2\\)';
  equal(f.window.Homepage.math.renderText(f.host, source), true);
  equal(f.host.children[0].tagName, "#text");
  ok(f.host.children[0].textContent.startsWith("<img "));
  equal(nodes(f.host).filter(node => ["img", "script", "iframe"].includes(node.tagName)).length, 0);
  equal(f.window.Homepage.math.renderText(f.host, "A normal title"), false);
  equal(f.host.textContent, "A normal title");
  equal(f.host.getAttribute("data-math-rendered"), null);
});

test("缺库、坏公式和资源/HTML 指令全部恢复纯文本", () => {
  const missing = fixture({library: false});
  equal(missing.window.Homepage.math.renderText(missing.host, "Test \\(x\\)", {fallback: "Test x"}), false);
  equal(missing.host.textContent, "Test x");
  const f = fixture();
  const inputs = ["x \\(\\badcommand\\)", "x \\(x", "x \\(\\)", "x \\(x \\( y\\)",
    "x \\(\\href{javascript:alert(1)}{x}\\)", "x \\(\\includegraphics{https://example.com/a.png}\\)",
    "x \\(\\htmlStyle{position:fixed}{x}\\)", "x \\(\\url{https://example.com}\\)", "x".repeat(2401),
    "x \\(\\def\\a{\\a}\\a\\)"];
  for (const input of inputs) {
    equal(f.window.Homepage.math.renderText(f.host, input, {fallback: "Readable fallback"}), false);
    equal(f.host.textContent, "Readable fallback");
    equal(f.host.children.length, 1);
    equal(f.host.children[0].tagName, "#text");
  }
  equal(f.window.Homepage.math.renderText(f.host, "A \\(x\\) B \\(\\badcommand\\)", {fallback: "Whole title"}), false);
  equal(f.host.textContent, "Whole title", "后一个公式失败不留下半条渲染题名");
});

test("宏隔离、尺寸限制与重复渲染", () => {
  const f = fixture();
  equal(f.window.Homepage.math.renderText(f.host, "\\(\\gdef\\secret{x}\\secret\\)"), true);
  equal(f.window.Homepage.math.renderText(f.host, "\\(\\secret\\)", {fallback: "x"}), false);
  equal(f.host.textContent, "x");
  equal(f.window.Homepage.math.renderText(f.host, "\\(\\rule{500em}{500em}\\)"), true);
  ok(!nodes(f.host).some(node => Object.values(node.style || {}).some(value => String(value).includes("500em"))));
  equal(f.window.Homepage.math.renderText(f.host, "\\(a\\)"), true);
  equal(f.window.Homepage.math.renderText(f.host, "\\(b\\)"), true);
  equal(classNodes(f.host, "math-inline").length, 1);
  ok(!classNodes(f.host, "mathnormal").some(node => node.textContent === "a"));
});

test("可选 titleTex 字段兼容纯文本旧记录并执行长度/类型校验", () => {
  const f = fixture();
  const categories = publications(f);
  const entry = categories.find(item => item.id === "arxiv").entries[0];
  ok(entry.titleTex.includes("\\chi_{cJ}"));
  ok(entry.title.startsWith("Observation of χcJ"));
  categories[1].entries[0].titleTex = "mutated";
  ok(f.window.Homepage.getPublicationCategories()[1].entries[0].titleTex !== "mutated");
  for (const bad of ["", " ", 9, null, "x".repeat(1601)]) {
    const g = fixture();
    Object.assign(g.window.Homepage, {getData() {}, registerData() {}});
    g.load("modules/academic/publications/data.js");
    assert.throws(() => g.window.Homepage.registerPublicationCategory({
      ...categories[0], id: "published", entries: [{...entry, titleTex: bad}]
    }), /Invalid publication metadata/);
    assertions += 1;
  }
  const old = fixture();
  const data = new Map();
  Object.assign(old.window.Homepage, {registerData: (key, value) => data.set(key, value), getData: key => data.get(key)});
  old.load("modules/academic/publications/data.js");
  const legacy = {...entry}; delete legacy.titleTex;
  old.window.Homepage.registerPublicationCategory({...categories[0], entries: [legacy]});
  equal(data.get("publications.internal-note").entries[0].title, legacy.title);
  equal(data.get("publications.internal-note").entries[0].titleTex, undefined);
});

test("Publications 和 Academic 精选入口使用同一公开公式服务", () => {
  const f = fixture();
  publications(f);
  f.load("modules/academic/publications/view.js");
  f.window.Homepage.createPublicationsView().render({host: f.host, route: "arxiv"});
  const title = classNodes(f.host, "publication-library__title")[0];
  equal(classNodes(title, "math-inline").length, 2);
  const link = f.document.createElement("a");
  const featuredTitle = f.document.createElement("span");
  const metadata = f.document.createElement("span");
  f.window.Homepage.academicExploration = {};
  f.load("modules/academic/exploration/featured.js");
  f.window.Homepage.academicExploration.mountFeaturedPublication({
    root: {querySelector: selector => ({"#academic-featured-publication": link, "#academic-publication-title": featuredTitle, "#academic-publication-meta": metadata})[selector]},
    details: {open() {}}
  });
  equal(link.hidden, false);
  equal(link.href, "#academic/publications/arxiv");
  equal(classNodes(featuredTitle, "math-inline").length, 2);
  equal(metadata.textContent, "arXiv:2610.11981 · BESIII Collaboration");
});

test("本地资源完整、字体引用不出目录、加载时不访问 DOM", () => {
  const vendor = path.join(root, "shared/math/vendor");
  const css = fs.readFileSync(path.join(vendor, "katex.min.css"), "utf8");
  const references = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].replace(/["']/g, ""));
  equal(references.length, 20);
  ok(references.every(reference => /^fonts\/KaTeX_[A-Za-z0-9-]+\.woff2$/.test(reference)));
  ok(references.every(reference => fs.existsSync(path.join(vendor, reference))));
  ok(fs.readFileSync(path.join(vendor, "LICENSE"), "utf8").includes("The MIT License"));
  const window = {Homepage: {}};
  const context = vm.createContext({window});
  vm.runInContext(fs.readFileSync(path.join(vendor, "katex.min.js"), "utf8"), context, {timeout: 1000});
  vm.runInContext(fs.readFileSync(path.join(root, "shared/math/render.js"), "utf8"), context, {timeout: 1000});
  equal(typeof window.Homepage.math.renderText, "function");
});

console.log(JSON.stringify({status: "passed", assertions, checks}, null, 2));
