// Static-site checks only; no packages, build step, network access, or file writes.
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const html = new Map();
const fail = message => errors.push(message);
const name = path => relative(root, path).split(sep).join("/");
const external = value => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const string = value => typeof value === "string" && value.trim().length > 0;
const simpleAnchor = value => /^[a-z][\w:-]*$/i.test(value);

function attributes(tag) {
  const result = new Map();
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), (match[2] ?? match[3] ?? match[4]).replaceAll("&amp;", "&"));
  }
  return result;
}

async function localReference(value, from, { image = false, anchors = false } = {}) {
  if (!string(value)) return;
  if (external(value)) {
    if (image) fail(`${name(from)}: 图片必须是本地相对路径：${value}`);
    return;
  }
  if (value.startsWith("/")) {
    fail(`${name(from)}: 请使用相对路径，GitHub Pages 仓库路径不支持 ${value}`);
    return;
  }
  let decoded;
  try { decoded = decodeURI(value); }
  catch { fail(`${name(from)}: URL 编码无效：${value}`); return; }
  const [beforeHash, fragment] = decoded.split("#", 2);
  const pathname = beforeHash.split("?", 1)[0];
  const target = pathname ? resolve(dirname(from), pathname) : from;
  const withinRoot = relative(root, target);
  if (withinRoot === ".." || withinRoot.startsWith(".." + sep)) {
    fail(`${name(from)}: 资源超出项目目录：${value}`);
    return;
  }
  if (pathname) {
    try {
      const resource = await stat(target);
      if (image && !resource.isFile()) fail(`${name(from)}: 图片路径不是文件：${value}`);
    }
    catch { fail(`${name(from)}: 本地资源不存在：${value}`); return; }
  }
  if (image && !pathname) fail(`${name(from)}: 图片缺少本地文件路径：${value}`);
  if (anchors && target === from && fragment && simpleAnchor(fragment)) {
    if (!html.get(from)?.ids.has(fragment)) fail(`${name(from)}: 同页锚点不存在：#${fragment}`);
  }
}

async function inspectFiles() {
  for (const file of await readdir(root)) {
    if (extname(file) !== ".html") continue;
    const path = join(root, file);
    const source = (await readFile(path, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
    const tags = [...source.matchAll(/<[^>]+>/g)].map(match => attributes(match[0]));
    const ids = new Set();
    for (const tag of tags) {
      if (!tag.has("id")) continue;
      const id = tag.get("id");
      if (ids.has(id)) fail(`${name(path)}: 重复 id="${id}"`);
      ids.add(id);
    }
    html.set(path, { tags, ids });
  }
  for (const [path, page] of html) {
    for (const tag of page.tags) {
      for (const key of ["src", "href"]) {
        if (tag.has(key)) await localReference(tag.get(key), path, { anchors: key === "href" });
      }
    }
  }
  for (const file of await readdir(join(root, "css"))) {
    if (extname(file) !== ".css") continue;
    const path = join(root, "css", file);
    const source = (await readFile(path, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
      await localReference(match[1] ?? match[2] ?? match[3], path);
    }
  }
  for (const file of await readdir(join(root, "js"))) {
    if (extname(file) !== ".js") continue;
    const path = join(root, "js", file);
    const checked = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    if (checked.error || checked.status !== 0) {
      fail(`${name(path)}: JavaScript 语法检查失败\n${checked.error?.message || checked.stderr.trim()}`);
    }
  }
}

function requireString(value, label) {
  if (!string(value)) fail(`${label}: 必须是非空字符串`);
}

async function inspectContent() {
  const path = join(root, "js/content.js");
  let content;
  try {
    const context = vm.createContext({ window: {} }, { codeGeneration: { strings: false, wasm: false } });
    vm.runInContext(await readFile(path, "utf8"), context, { filename: name(path), timeout: 100 });
    // Serialize inside the bounded context, then validate plain data outside it.
    content = JSON.parse(vm.runInContext("JSON.stringify(window.HOMEPAGE_CONTENT)", context, { timeout: 100 }));
  } catch (error) { fail(`js/content.js: 无法读取 HOMEPAGE_CONTENT：${error.message}`); return; }
  if (!object(content)) { fail("HOMEPAGE_CONTENT 必须是对象"); return; }
  const homepage = html.get(join(root, "index.html"));
  if (!homepage) { fail("缺少 index.html"); return; }
  const fields = ["title", "label", "kicker", "subtitle", "image", "imageAlt", "credit", "source", "listTitle", "emptyMessage"];
  for (const group of ["academic", "life"]) {
    if (!object(content[group])) { fail(`content.${group}: 必须是栏目对象`); continue; }
    const keys = Object.keys(content[group]);
    for (const key of keys) {
      const label = `content.${group}.${key}`;
      if (!/^[a-z]+$/.test(key)) fail(`${label}: 现有详情路由只支持小写英文字母栏目键`);
      const item = content[group][key];
      if (!object(item)) { fail(`${label}: 必须是对象`); continue; }
      fields.forEach(field => requireString(item[field], `${label}.${field}`));
      await localReference(item.image, join(root, "index.html"), { image: true });
      await localReference(item.source, join(root, "index.html"));
      if (!Array.isArray(item.description)) fail(`${label}.description: 必须是字符串数组`);
      else item.description.forEach((value, i) => requireString(value, `${label}.description[${i}]`));
      if (item.facts !== undefined) {
        if (!Array.isArray(item.facts)) fail(`${label}.facts: 必须是数组`);
        else item.facts.forEach((fact, i) => {
          if (!object(fact)) { fail(`${label}.facts[${i}]: 必须是对象`); return; }
          for (const field of ["label", "value"]) requireString(fact[field], `${label}.facts[${i}].${field}`);
        });
      }
      if (item.link !== undefined) {
        if (!object(item.link)) fail(`${label}.link: 必须是对象`);
        else {
          for (const field of ["label", "url"]) requireString(item.link[field], `${label}.link.${field}`);
          await localReference(item.link.url, join(root, "index.html"));
        }
      }
      if (!Array.isArray(item.entries)) fail(`${label}.entries: 必须是数组`);
      else for (const [i, entry] of item.entries.entries()) {
        const entryLabel = `${label}.entries[${i}]`;
        if (!object(entry)) { fail(`${entryLabel}: 必须是对象`); continue; }
        requireString(entry.title, `${entryLabel}.title`);
        for (const field of ["meta", "description", "url"]) {
          if (entry[field] !== undefined) requireString(entry[field], `${entryLabel}.${field}`);
        }
        if (entry.url !== undefined) await localReference(entry.url, join(root, "index.html"));
      }
    }
    const markers = group === "academic" ? ["data-academic", "data-preview"] : ["data-life"];
    for (const marker of markers) {
      const actual = new Set(homepage.tags.filter(tag => tag.has(marker)).map(tag => tag.get(marker)));
      keys.filter(key => !actual.has(key)).forEach(key => fail(`index.html: 缺少 ${marker}="${key}"`));
      [...actual].filter(key => !keys.includes(key)).forEach(key => fail(`index.html: ${marker}="${key}" 在 content.${group} 中不存在`));
    }
  }
}

try {
  await inspectFiles();
  await inspectContent();
} catch (error) { fail(`检查无法完成：${error.message}`); }
if (errors.length) {
  console.error(`检查失败（${errors.length} 项）：\n${errors.map(error => "- " + error).join("\n")}`);
  process.exitCode = 1;
} else console.log("检查通过：JavaScript 语法、HTML/CSS 本地资源、锚点、内容数据与栏目映射。");
