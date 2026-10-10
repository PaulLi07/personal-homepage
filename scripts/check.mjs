// 只读检查源码、模块接口与已提交的页面产物；不安装依赖、不联网、不写文件。
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
const routeId = value => typeof value === "string" && /^[a-z]+$/.test(value);
const ignored = new Set([".git", "node_modules", ".cache", ".private", "__pycache__", "artifacts", "dist", "build"]);
const javascript = new Set([".js", ".mjs", ".cjs"]);
const sitePage = join(root, "index.html");

function requireString(value, label) {
  if (!string(value)) fail(`${label}: 必须是非空字符串`);
}

function attributes(tag) {
  const result = new Map();
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), (match[2] ?? match[3] ?? match[4]).replaceAll("&amp;", "&"));
  }
  return result;
}

function insideRoot(path) {
  const part = relative(root, path);
  return part !== ".." && !part.startsWith(".." + sep);
}

async function localReference(value, from, { image = false, anchors = false, base = dirname(from) } = {}) {
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
  const target = pathname ? resolve(base, pathname) : from;
  if (!insideRoot(target)) { fail(`${name(from)}: 资源超出项目目录：${value}`); return; }
  if (pathname) {
    try {
      const resource = await stat(target);
      if (image && !resource.isFile()) fail(`${name(from)}: 图片路径不是文件：${value}`);
    } catch { fail(`${name(from)}: 本地资源不存在：${value}`); return; }
  }
  if (image && !pathname) fail(`${name(from)}: 图片缺少本地文件路径：${value}`);
  if (anchors && target === from && fragment && simpleAnchor(fragment)) {
    if (!html.get(from)?.ids.has(fragment)) fail(`${name(from)}: 同页锚点不存在：#${fragment}`);
  }
}

async function filesWithin(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesWithin(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

async function inspectFiles() {
  const files = await filesWithin(root);
  // 模板和模块片段以站点根为资源基准；只有完整根页面独立校验锚点与重复 ID。
  for (const path of files.filter(path => extname(path) === ".html" && dirname(path) === root)) {
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
  for (const path of files.filter(path => extname(path) === ".html" && dirname(path) !== root)) {
    const source = (await readFile(path, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
    for (const match of source.matchAll(/<[^>]+>/g)) {
      const tag = attributes(match[0]);
      for (const key of ["src", "href"]) {
        if (tag.has(key)) await localReference(tag.get(key), path, { base: root });
      }
    }
  }
  for (const path of files) {
    if (extname(path) === ".css") {
      const source = (await readFile(path, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
      for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
        await localReference(match[1] ?? match[2] ?? match[3], path);
      }
    } else if (javascript.has(extname(path))) {
      const checked = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
      if (checked.error || checked.status !== 0) {
        fail(`${name(path)}: JavaScript 语法检查失败\n${checked.error?.message || checked.stderr.trim()}`);
      }
    }
  }
}

async function manifestPath(value, label, directory = false) {
  requireString(value, label);
  if (!string(value)) return;
  const path = resolve(root, value);
  if (external(value) || value.startsWith("/") || !insideRoot(path)) {
    fail(`${label}: 必须使用项目内的本地相对路径`);
    return;
  }
  try {
    const resource = await stat(path);
    if (directory ? !resource.isDirectory() : !resource.isFile()) fail(`${label}: 类型错误：${value}`);
  } catch { fail(`${label}: 文件或目录不存在：${value}`); }
}

async function inspectModuleDocs(folder, id, label) {
  if (string(folder)) await manifestPath(`${folder}/README.md`, `${label} 模块说明`);
  if (!string(id) || !/^[a-z]+(?:-[a-z]+)?$/.test(id)) return;
  const doc = `docs/modules/${id}.md`;
  await manifestPath(doc, `${label} 兼容性记录`);
  try {
    const text = await readFile(join(root, doc), "utf8");
    if (!/兼容/.test(text) || !/环境|浏览器|视口/.test(text) || !/结果|未测试|未覆盖|待验证/.test(text)) {
      fail(`${doc}: 缺少兼容性测试环境、结果或未覆盖项记录`);
    }
  } catch { /* 文件缺失已记录。 */ }
}

async function inspectManifest() {
  const manifest = JSON.parse(await readFile(join(root, "app/site.json"), "utf8"));
  if (!object(manifest)) throw new Error("app/site.json 必须是对象");
  const pathList = async (value, label) => {
    if (!Array.isArray(value)) { fail(`${label}: 必须是相对路径数组`); return; }
    for (const [i, path] of value.entries()) await manifestPath(path, `${label}[${i}]`);
  };
  await pathList(manifest.sharedStyles, "site.sharedStyles");
  await pathList(manifest.afterStyles, "site.afterStyles");
  await pathList(manifest.sharedScripts, "site.sharedScripts");
  if (!Array.isArray(manifest.sections)) { fail("site.sections: 必须是模块数组"); manifest.sections = []; }
  if (!Array.isArray(manifest.services ?? [])) { fail("site.services: 必须是服务模块数组"); manifest.services = []; }
  const ids = new Set();
  const groups = new Set();
  const modules = [...(manifest.services || []).map(module => ({...module, service: true})), ...manifest.sections, { ...manifest.credits, id: "credits" }];
  if (!object(manifest.credits)) fail("site.credits: 必须是模块对象");
  for (const [i, module] of modules.entries()) {
    if (!object(module)) { fail(`site.sections[${i}]: 必须是模块对象`); continue; }
    const label = `site.${module.id || i}`;
    if (!routeId(module.id)) fail(`${label}.id: 现有注册接口只支持小写英文字母模块标识`);
    if (ids.has(module.id)) fail(`${label}: 重复模块 id`);
    ids.add(module.id);
    await manifestPath(module.folder, `${label}.folder`, true);
    if (!module.service) await manifestPath(module.view, `${label}.view`);
    await pathList(module.styles, `${label}.styles`);
    await pathList(module.scripts, `${label}.scripts`);
    if (module.preloadImages !== undefined) await pathList(module.preloadImages, `${label}.preloadImages`);
    if (module.detailGroup !== undefined) {
      if (!routeId(module.detailGroup)) fail(`${label}.detailGroup: 详情路由只支持小写英文字母`);
      if (groups.has(module.detailGroup)) fail(`${label}: 重复 detailGroup`);
      groups.add(module.detailGroup);
    }
    await inspectModuleDocs(module.folder, module.id, label);
  }
  await manifestPath("app/index.template.html", "首页模板");
  await manifestPath("app/credits.template.html", "署名页模板");
  const assembled = spawnSync("python3", [join(root, "scripts/assemble.py"), "--check"], { cwd: root, encoding: "utf8" });
  if (assembled.error || assembled.status !== 0) {
    fail(`页面汇总产物检查失败\n${assembled.error?.message || assembled.stderr.trim() || assembled.stdout.trim()}`);
  }
  return { modules, groups };
}

async function readRegistrations(modules) {
  const context = vm.createContext({ window: {addEventListener() {}, removeEventListener() {}}, TextEncoder, TextDecoder, AbortController }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(`window.__registrations = { sections: [], details: [], views: [], data: [] };
    window.Homepage = {
      registerSection(module) { window.__registrations.sections.push({ source: window.__source, module, initType: typeof module?.init }); },
      registerDetail(group, key, content) { window.__registrations.details.push({ source: window.__source, group, key, content }); },
      registerDetailView(group, key, view) { window.__registrations.views.push({source: window.__source, group, key, renderType: typeof view?.render}); },
      registerData(key, value) { window.__registrations.data.push({source: window.__source, key, value}); },
      getData(key) { return window.__registrations.data.slice().reverse().find(entry => entry.key === key)?.value; }
    };`, context, { timeout: 100 });
  for (const module of modules.filter(object)) {
    for (const script of Array.isArray(module.scripts) ? module.scripts : []) {
      if (!string(script) || external(script) || !insideRoot(resolve(root, script))) continue;
      try {
        context.window.__source = script;
        vm.runInContext(await readFile(join(root, script), "utf8"), context, { filename: script, timeout: 100 });
      } catch (error) { fail(`${script}: 无法静态读取模块注册；将 DOM 操作放入 init：${error.message}`); }
    }
  }
  return JSON.parse(vm.runInContext("JSON.stringify(window.__registrations)", context, { timeout: 100 }));
}

async function inspectDetails(modules, groups) {
  const registrations = await readRegistrations(modules);
  const sections = new Set(modules.filter(module => object(module) && !module.service).map(module => module.id));
  const owners = new Map();
  for (const module of modules.filter(object)) {
    for (const script of Array.isArray(module.scripts) ? module.scripts : []) owners.set(script, module);
  }
  const registeredSections = new Set();
  for (const { source, module, initType } of registrations.sections) {
    if (!object(module) || !sections.has(module.id)) { fail(`${source}: registerSection id 未在清单中声明`); continue; }
    const owner = owners.get(source);
    if (owner?.id !== module.id) fail(`${source}: registerSection id 与所属清单模块不一致`);
    if (initType !== "undefined" && initType !== "function") fail(`${source}: registerSection("${module.id}").init 必须是函数`);
    if (owner?.detailGroup !== undefined) {
      if (!object(module.detailGroup) || module.detailGroup.id !== owner.detailGroup) {
        fail(`${source}: 注册的 detailGroup 与清单不一致`);
      } else for (const field of ["label", "descriptionTitle"]) {
        requireString(module.detailGroup[field], `${source}: detailGroup.${field}`);
      }
    } else if (module.detailGroup !== undefined) fail(`${source}: detailGroup 未在清单中声明`);
    if (registeredSections.has(module.id)) fail(`${source}: 重复 registerSection("${module.id}")`);
    registeredSections.add(module.id);
  }
  for (const module of modules.filter(object)) {
    if (!module.service && module.id !== "credits" && !html.get(sitePage)?.ids.has(module.id)) {
      fail(`index.html: 缺少模块根元素 id="${module.id}"`);
    }
    if (!module.service && module.id !== "credits" && module.scripts?.length && !registeredSections.has(module.id)) {
      fail(`site.${module.id}: 脚本未 registerSection 对应模块`);
    }
  }
  const fields = ["title", "label", "kicker", "subtitle", "image", "imageAlt", "credit", "source", "listTitle", "emptyMessage"];
  const detailKeys = new Map([...groups].map(group => [group, new Set()]));
  for (const { source, group, key, content: item } of registrations.details) {
    const label = `${source}: detail.${group}.${key}`;
    if (!routeId(group) || !routeId(key)) fail(`${label}: 详情路由的分组与栏目键只支持小写英文字母`);
    if (routeId(group) && routeId(key)) await inspectModuleDocs(dirname(source), `${group}-${key}`, label);
    if (!groups.has(group)) { fail(`${label}: detailGroup 未在清单中声明`); continue; }
    if (owners.get(source)?.detailGroup !== group) fail(`${label}: 分组与所属模块的 detailGroup 不一致`);
    const keys = detailKeys.get(group);
    if (keys.has(key)) fail(`${label}: 重复 registerDetail`);
    keys.add(key);
    if (!object(item)) { fail(`${label}: 内容必须是对象`); continue; }
    fields.forEach(field => requireString(item[field], `${label}.${field}`));
    await localReference(item.image, sitePage, { image: true });
    await localReference(item.source, sitePage);
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
        await localReference(item.link.url, sitePage);
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
      if (entry.url !== undefined) await localReference(entry.url, sitePage);
    }
  }
  const homepage = html.get(sitePage);
  const viewKeys = new Set();
  for (const {source, group, key, renderType} of registrations.views) {
    const id = group + "/" + key;
    if (!detailKeys.get(group)?.has(key) || owners.get(source)?.detailGroup !== group
      || renderType !== "function" || viewKeys.has(id)) fail(`${source}: 自定义详情视图无效或重复：${id}`);
    viewKeys.add(id);
  }
  for (const {source, key, value} of registrations.data) {
    if (key === "relationship.encrypted" && value !== null) {
      const validation = spawnSync(process.execPath, [join(root, "scripts/relationship.cjs"), "--check"], {cwd: root, encoding: "utf8"});
      if (validation.error || validation.status !== 0) fail(`${source}: 密文配置检查失败`);
    }
  }
  if (!homepage) { fail("缺少 index.html"); return; }
  for (const [group, keys] of detailKeys) {
    const markers = group === "academic" ? [`data-${group}`, "data-preview"] : [`data-${group}`];
    for (const marker of markers) {
      const actual = new Set(homepage.tags.filter(tag => tag.has(marker)).map(tag => tag.get(marker)));
      [...keys].filter(key => !actual.has(key)).forEach(key => fail(`index.html: 缺少 ${marker}="${key}"`));
      [...actual].filter(key => !keys.has(key)).forEach(key => fail(`index.html: ${marker}="${key}" 没有对应 registerDetail`));
    }
  }
}

try {
  const trackedPrivate = spawnSync("git", ["ls-files", "--", ".private"], {cwd: root, encoding: "utf8"});
  if (trackedPrivate.status === 0 && trackedPrivate.stdout.trim()) fail(".private 明文目录不得被 Git 跟踪；请先移出公开版本库。");
  await inspectFiles();
  const { modules, groups } = await inspectManifest();
  await inspectDetails(modules, groups);
} catch (error) { fail(`检查无法完成：${error.message}`); }
if (errors.length) {
  console.error(`检查失败（${errors.length} 项）：\n${errors.map(error => "- " + error).join("\n")}`);
  process.exitCode = 1;
} else console.log("检查通过：页面汇总产物、模块清单与说明、脚本语法、资源、锚点和详情注册映射。");
