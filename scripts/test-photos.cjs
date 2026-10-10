/* 照片测试只使用内存图片、随机密码与全拦截 GitHub，不改正式内容或写入远端。 */
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const zlib = require("node:zlib");
const ROOT = path.resolve(__dirname, "..");
const PREFIX = "/personal-homepage/";
const REPO = "/repos/PaulLi07/personal-homepage";
const ENGINES = ["chromium", "firefox", "webkit"];
const VIEWPORTS = [{width: 1440, height: 900}, {width: 390, height: 844}, {width: 320, height: 780}];
const REPORT = path.join(ROOT, "artifacts/photo-results.json");
const password = crypto.randomBytes(32).toString("base64url");
const token = "photos-test-only-" + crypto.randomBytes(24).toString("hex");
const salt = crypto.randomBytes(16);
const configSource = "window.Homepage.authorConfig = " + JSON.stringify({version: 1, iterations: 600000,
  salt: salt.toString("base64"), verifier: crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("base64"),
  owner: "PaulLi07", repo: "personal-homepage"}) + ";\n";
const redact = value => String(value).replaceAll(password, "[测试密码]").replaceAll(token, "[测试令牌]");
const collections = {
  moments: {route: "#life/moments", file: "modules/life/moments/posts.js", registration: "registerBlogPosts", documents: "modules/life/moments/documents/posts/",
    images: "modules/life/moments/images/posts/", root: ".moments-blog", body: ".moments-blog__body"},
  experience: {route: "#academic/experience", file: "modules/academic/experience/entries.js", registration: "registerAcademicLogs", documents: "modules/academic/experience/documents/posts/",
    images: "modules/academic/experience/images/posts/", root: ".academic-log", body: ".academic-log__body"}
};
const registration = (name, records) => "window.Homepage." + collections[name].registration + "(" + JSON.stringify(records) + ");\n";
const digest = value => crypto.createHash("sha1").update(value).digest("hex");
const blobSHA = bytes => digest(Buffer.concat([Buffer.from("blob " + bytes.length + "\0"), bytes]));
let fixtureImages;
const fileAPI = name => REPO + "/contents/" + collections[name].file;
const photoPath = (name, id, index = 1) => collections[name].images + id + "/" + "a".repeat(24) + "-" + index + ".jpg";
const documentPath = (name, id, index = 1) => collections[name].documents + id + "/" + "b".repeat(24) + "-" + index + ".pdf";
const pdfBytes = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n", "utf8");
const pdfFile = index => ({name: "temporary-document-" + index + ".pdf", mimeType: "application/pdf", buffer: pdfBytes});
const fixtures = Object.fromEntries(Object.keys(collections).map(name => [name, [{
  id: "temporary-" + name, title: "Temporary " + name + " with a photograph", date: "2026-10-09",
  excerpt: "A temporary photo reader fixture.", body: "An independent temporary article.\n\nSecond paragraph.", author: "Yuhong Li",
  ...(name === "experience" ? {kind: "Research", reference: "https://example.org/temporary-academic-reference"} : {}),
  photos: [{src: photoPath(name, "temporary-" + name), alt: "A temporary landscape",
    caption: "Temporary caption <img src=x onerror=window.__photoExecuted=true>"}],
  attachments: [{src: documentPath(name, "temporary-" + name), title: "Temporary PDF <img src=x onerror=window.__photoExecuted=true>", size: pdfBytes.length}]
}]]));

function parseRecords(source, name) {
  const text = source.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
  const match = text.match(new RegExp("^\\s*window\\.Homepage\\." + collections[name].registration + "\\(\\s*([\\s\\S]*)\\s*\\);?\\s*$"));
  assert.ok(match, "数据文件必须是纯 JSON 数组登记");
  const records = JSON.parse(match[1]);
  assert.ok(Array.isArray(records));
  return records;
}

function inspectJPEG(bytes) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length >= 4);
  assert.equal(bytes.readUInt16BE(0), 0xffd8, "输出不是 JPEG");
  assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9, "JPEG 没有结束标记");
  const markers = [];
  let width = 0, height = 0, offset = 2, entropy = false;
  while (offset + 4 <= bytes.length) {
    if (entropy) {
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) { offset++; continue; }
        const following = bytes[offset + 1];
        if (following === 0 || (following >= 0xd0 && following <= 0xd7)) { offset += 2; continue; }
        if (following === 0xff) { offset++; continue; }
        entropy = false; break;
      }
      if (offset + 4 > bytes.length) break;
    }
    assert.equal(bytes[offset], 0xff);
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    const length = bytes.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= bytes.length);
    markers.push(marker);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      height = bytes.readUInt16BE(offset + 3);
      width = bytes.readUInt16BE(offset + 5);
    }
    offset += length;
    if (marker === 0xda) entropy = true;
  }
  assert.ok(width > 0 && height > 0, "JPEG 没有尺寸信息");
  return {width, height, markers, bytes: bytes.length};
}
function metadataJPEG(bytes) {
  const payload = Buffer.from("Exif\0\0Temporary private metadata", "utf8");
  const app1 = Buffer.alloc(payload.length + 4);
  app1.writeUInt16BE(0xffe1); app1.writeUInt16BE(payload.length + 2, 2); payload.copy(app1, 4);
  return Buffer.concat([bytes.subarray(0, 2), app1, bytes.subarray(2)]);
}
const crcTable = Array.from({length: 256}, (_, byte) => {
  let value = byte;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function readZIP(bytes) {
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, "下载不是完整 ZIP");
  assert.equal(bytes.readUInt16LE(end + 4), 0);
  assert.equal(bytes.readUInt16LE(end + 6), 0);
  const count = bytes.readUInt16LE(end + 10);
  const files = new Map();
  let offset = bytes.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const flags = bytes.readUInt16LE(offset + 8), method = bytes.readUInt16LE(offset + 10);
    const checksum = bytes.readUInt32LE(offset + 16), compressed = bytes.readUInt32LE(offset + 20);
    const size = bytes.readUInt32LE(offset + 24), length = bytes.readUInt16LE(offset + 28);
    const extra = bytes.readUInt16LE(offset + 30), comment = bytes.readUInt16LE(offset + 32);
    const local = bytes.readUInt32LE(offset + 42), name = bytes.subarray(offset + 46, offset + 46 + length).toString("utf8");
    assert.equal(flags & 1, 0, "ZIP 不应加密");
    assert.ok(!name.startsWith("/") && !name.split("/").some(part => part === ".." || part === ".git" || part === ".private"));
    assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const encoded = bytes.subarray(start, start + compressed);
    assert.ok(method === 0 || method === 8);
    const decoded = method === 0 ? encoded : zlib.inflateRawSync(encoded);
    assert.equal(decoded.length, size); assert.equal(crc32(decoded), checksum);
    assert.equal(files.has(name), false, "ZIP 路径重复");
    files.set(name, decoded);
    offset += 46 + length + extra + comment;
  }
  assert.equal(offset, end, "ZIP 中央目录不一致");
  return files;
}
function freshMock() {
  return {head: digest("initial-photo-head"), baseTree: digest("initial-photo-tree"), mode: null,
    records: structuredClone(fixtures), blobs: new Map(), trees: new Map(), commits: new Map(), photos: new Map(), documents: new Map(),
    calls: [], reads: [], blobWrites: [], treeWrites: [], commitWrites: [], patches: [], puts: [], errors: [], blocked: []};
}

let playwright;
try { playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright"); }
catch { console.error("未找到 Playwright；请用 HOMEPAGE_PLAYWRIGHT_MODULE 指定已有维护环境。"); process.exit(1); }
const mime = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf", ".json": "application/json"};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(PREFIX)) throw new Error("Invalid prefix");
    const relative = pathname.slice(PREFIX.length) || "index.html";
    if (relative.split("/").some(part => [".git", ".private"].includes(part))) throw new Error("Invalid path");
    const file = await fs.realpath(path.resolve(ROOT, relative));
    if (!file.startsWith(ROOT + path.sep) || !mime[path.extname(file)]) throw new Error("Invalid file");
    response.writeHead(200, {"Content-Type": mime[path.extname(file)], "Cache-Control": "no-store"});
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404); response.end("Not found"); }
});

async function intercept(context, origin, mock) {
  // 所有非本地请求兜底拦截；未知 API 也不会真实外发。
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.protocol === "blob:") return route.continue();
    if (url.origin === origin) {
      if (url.pathname === PREFIX + "modules/author/config.js") return route.fulfill({contentType: "text/javascript", body: configSource});
      for (const [name, item] of Object.entries(collections)) {
        if (url.pathname === PREFIX + item.file) return route.fulfill({contentType: "text/javascript", body: registration(name, fixtures[name])});
      }
      const relative = url.pathname.slice(PREFIX.length);
      if (mock.photos.has(relative)) return route.fulfill({contentType: "image/jpeg", body: mock.photos.get(relative)});
      if (mock.documents.has(relative)) return route.fulfill({contentType: "application/pdf", body: mock.documents.get(relative)});
      if (url.pathname.startsWith(PREFIX)) return route.continue();
    }
    if (url.origin !== "https://api.github.com") { mock.blocked.push({method: request.method(), path: url.pathname}); return route.abort(); }
    const headers = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-GitHub-Api-Version", "Content-Type": "application/json"};
    const respond = (data, status = 200) => route.fulfill({status, headers, body: JSON.stringify(data)});
    if (request.method() === "OPTIONS") return route.fulfill({status: 204, headers});
    try {
      assert.equal(request.headers().authorization, "Bearer " + token);
      const method = request.method(), api = url.pathname, body = method === "GET" ? null : request.postDataJSON();
      mock.calls.push({method, path: api});
      if (method === "GET" && api === "/user") return respond({login: "PaulLi07"});
      if (method === "GET" && api === REPO) return respond({owner: {login: "PaulLi07"}, permissions: {push: true}});
      if (method === "GET" && api === REPO + "/git/ref/heads/main") return respond({ref: "refs/heads/main", object: {type: "commit", sha: mock.mode === "ref-malformed" ? "invalid" : mock.head}});
      if (method === "GET" && api === REPO + "/git/commits/" + mock.head) return respond({sha: mock.head, tree: {sha: mock.baseTree}});
      const name = Object.keys(collections).find(name => api === fileAPI(name));
      if (name && method === "GET") {
        const ref = url.searchParams.get("ref");
        assert.ok(ref === "main" || ref === mock.head, "Contents 没有绑定当前提交");
        const source = registration(name, mock.records[name]), bytes = Buffer.from(source);
        mock.reads.push({name, ref, sha: blobSHA(bytes)});
        return respond({type: "file", encoding: "base64", sha: blobSHA(bytes), size: bytes.length, content: bytes.toString("base64")});
      }
      if (name && method === "PUT") {
        assert.equal(body.branch, "main"); assert.equal(body.sha, mock.reads.at(-1).sha);
        assert.equal(mock.reads.at(-1).ref, "main");
        const records = parseRecords(Buffer.from(body.content, "base64").toString("utf8"), name);
        assert.ok(mock.records[name].every(record => records.some(next => next.id === record.id)), "纯文发布丢失旧记录");
        mock.records[name] = records; mock.puts.push({name, branch: body.branch, ids: records.map(record => record.id)});
        mock.head = digest("text-publish-" + mock.puts.length);
        return respond({commit: {sha: mock.head}}, 201);
      }
      if (api === REPO + "/git/blobs" && method === "POST") {
        if (mock.mode === "blob-500") return respond({message: "Temporary blob failure"}, 500);
        if (mock.mode === "blob-401") return respond({message: "Temporary expired connection"}, 401);
        if (mock.mode === "blob-malformed") return respond({sha: "invalid"}, 201);
        assert.deepEqual(Object.keys(body).sort(), ["content", "encoding"]);
        assert.ok(body.encoding === "base64" || body.encoding === "utf-8");
        const bytes = Buffer.from(body.content, body.encoding === "base64" ? "base64" : "utf8"), sha = blobSHA(bytes);
        mock.blobs.set(sha, bytes); mock.blobWrites.push({sha, bytes: bytes.length});
        return respond({sha}, 201);
      }
      if (api === REPO + "/git/trees" && method === "POST") {
        if (mock.mode === "tree-500") return respond({message: "Temporary tree failure"}, 500);
        assert.equal(body.base_tree, mock.baseTree, "没有保留当前基树"); assert.ok(Array.isArray(body.tree));
        const dataEntries = body.tree.filter(entry => Object.values(collections).some(item => item.file === entry.path));
        assert.equal(dataEntries.length, 1, "原子提交应只含当前集合的数据文件");
        const currentName = Object.keys(collections).find(name => collections[name].file === dataEntries[0].path);
        const records = parseRecords(mock.blobs.get(dataEntries[0].sha).toString("utf8"), currentName);
        for (const record of mock.records[currentName]) {
          assert.deepEqual(records.find(next => next.id === record.id), JSON.parse(JSON.stringify(record)), "原子发布改写或丢失旧记录");
        }
        const added = records.filter(record => !mock.records[currentName].some(old => old.id === record.id));
        assert.equal(added.length, 1);
        const photos = added[0].photos || [], attachments = added[0].attachments || [];
        assert.ok(photos.length + attachments.length >= 1); assert.ok(photos.length <= 9 && attachments.length <= 3);
        const assetEntries = body.tree.filter(entry => entry.path !== dataEntries[0].path);
        assert.deepEqual(assetEntries.map(entry => entry.path).sort(), [...photos, ...attachments].map(asset => asset.src).sort());
        assert.equal(body.tree.length, photos.length + attachments.length + 1); assert.ok(body.tree.length <= 13);
        for (const entry of body.tree) {
          assert.equal(entry.mode, "100644"); assert.equal(entry.type, "blob"); assert.ok(mock.blobs.has(entry.sha));
          if (entry.path === dataEntries[0].path) continue;
          const bytes = mock.blobs.get(entry.sha);
          if (entry.path.endsWith(".jpg")) {
            assert.ok(new RegExp("^" + collections[currentName].images + added[0].id + "/[a-f0-9]{24}-[1-9]\\.jpg$").test(entry.path));
            const info = inspectJPEG(bytes); assert.ok(Math.max(info.width, info.height) <= 1920 && info.bytes <= 2 * 1024 * 1024);
            assert.equal(info.markers.includes(0xe1) || info.markers.includes(0xed), false, "发布 JPEG 残留私人元数据");
          } else {
            assert.ok(new RegExp("^" + collections[currentName].documents + added[0].id + "/[a-f0-9]{24}-[1-3]\\.pdf$").test(entry.path));
            assert.ok(bytes.equals(pdfBytes), "发布 PDF 原始字节被更改");
            assert.equal(attachments.find(asset => asset.src === entry.path).size, bytes.length);
          }
        }
        const sha = digest(JSON.stringify(body));
        mock.trees.set(sha, {name: currentName, records, entries: body.tree});
        mock.treeWrites.push({name: currentName, sha, baseTree: body.base_tree, paths: body.tree.map(entry => entry.path)});
        return respond({sha}, 201);
      }
      if (api === REPO + "/git/commits" && method === "POST") {
        if (mock.mode === "commit-500") return respond({message: "Temporary commit failure"}, 500);
        assert.deepEqual(body.parents, [mock.head]); assert.ok(mock.trees.has(body.tree)); assert.ok(typeof body.message === "string" && body.message);
        const sha = digest(JSON.stringify(body)); mock.commits.set(sha, {head: mock.head, tree: mock.trees.get(body.tree)});
        mock.commitWrites.push({sha, tree: body.tree, parents: body.parents}); return respond({sha}, 201);
      }
      if (api === REPO + "/git/refs/heads/main" && method === "PATCH") {
        assert.equal(body.force, false); assert.deepEqual(Object.keys(body).sort(), ["force", "sha"]);
        const commit = mock.commits.get(body.sha); assert.ok(commit); assert.equal(commit.head, mock.head);
        const status = mock.mode === "patch-409" ? 409 : mock.mode === "patch-422" ? 422 : mock.mode === "patch-network" ? "unknown" : 200;
        mock.patches.push({sha: body.sha, head: commit.head, name: commit.tree.name, force: body.force, status});
        if (status === "unknown") return route.abort("failed");
        if (status !== 200) { mock.head = digest("concurrent-head-" + mock.patches.length); mock.baseTree = digest("concurrent-tree-" + mock.patches.length); return respond({message: "Temporary branch conflict"}, status); }
        mock.records[commit.tree.name] = commit.tree.records;
        for (const entry of commit.tree.entries) if (entry.path.endsWith(".jpg")) mock.photos.set(entry.path, mock.blobs.get(entry.sha));
        for (const entry of commit.tree.entries) if (entry.path.endsWith(".pdf")) mock.documents.set(entry.path, mock.blobs.get(entry.sha));
        mock.head = body.sha; mock.baseTree = digest("tree-after-" + body.sha);
        return respond({ref: "refs/heads/main", object: {type: "commit", sha: body.sha}});
      }
      throw new Error("访问了未声明的 GitHub 路径或方法：" + method + " " + api);
    } catch (error) { mock.errors.push(redact(error.message)); return respond({message: "Photo mock validation failed"}, 500); }
  });
}

async function navigate(page, url, hash) { await page.evaluate(hash => { location.hash = hash; }, hash); await page.waitForURL(url + hash); }
async function author(page, url, name) { await navigate(page, url, collections[name].route + "/author"); await page.locator(".author-workspace").waitFor({state: "visible"}); }
async function nativeTabTo(page, selector) {
  await page.locator("#close-detail").focus();
  for (let count = 0; count < 100; count++) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("原生 Tab 无法到达照片输入字段");
}
async function signIn(page) {
  await page.locator('[name="author-password"]').fill(password);
  await page.getByRole("button", {name: "Sign in", exact: true}).click();
  await page.waitForFunction(() => window.Homepage.authorSession.isUnlocked());
  await page.locator('.author-workspace [name="title"]').waitFor({state: "visible"});
}
async function connect(page) {
  if (await page.evaluate(() => window.Homepage.authorSession.isConnected())) return;
  await page.locator('.author-workspace [name="token"]').fill(token);
  await page.getByRole("button", {name: "Connect GitHub", exact: true}).click();
  await page.waitForFunction(() => window.Homepage.authorSession.isConnected());
}
async function draft(page, name, suffix) {
  const record = {id: name + "-" + suffix, title: "Temporary " + name + " photo entry", date: "2026-10-10",
    excerpt: "Temporary photo publishing fixture.", body: "Temporary independent " + name + " article.", author: "Yuhong Li",
    ...(name === "experience" ? {kind: "Seminar", reference: "https://example.org/temporary-photo-reference"} : {})};
  for (const field of ["title", "id", "date", "excerpt", "body"]) await page.locator('.author-workspace [name="' + field + '"]').fill(record[field]);
  if (name === "experience") { await page.locator('[name="kind"]').selectOption(record.kind); await page.locator('[name="reference"]').fill(record.reference); }
  return record;
}
async function layout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "页面横向溢出");
  assert.equal(await page.locator("#detail-dialog").evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "详情横向溢出");
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)), false, "网页出现中文");
}
async function cleanState(page) {
  const state = await page.evaluate(({password, token}) => {
    const persistent = Object.values(localStorage).join("\n") + Object.values(sessionStorage).join("\n") + document.cookie + location.href + JSON.stringify(history.state);
    return {safe: !persistent.includes(password) && !persistent.includes(token), executed: Boolean(window.__photoExecuted)};
  }, {password, token});
  assert.equal(state.safe, true); assert.equal(state.executed, false);
}
async function makeImages(page) {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 2600; canvas.height = 1400;
    const ctx = canvas.getContext("2d"), gradient = ctx.createLinearGradient(0, 0, 2600, 1400);
    gradient.addColorStop(0, "#22344e"); gradient.addColorStop(1, "#ecaa62"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 2600, 1400);
    ctx.fillStyle = "#eaf0fa"; ctx.fillRect(130, 120, 450, 600);
    return ["image/jpeg", "image/png", "image/webp"].map(type => ({type, url: canvas.toDataURL(type, 0.92)}));
  });
  return encoded.map((item, index) => {
    assert.ok(item.url.startsWith("data:" + item.type + ";base64,"), "浏览器未支持输入图片编码");
    const bytes = Buffer.from(item.url.split(",")[1], "base64");
    return {name: "temporary-" + index + "." + ["jpg", "png", "webp"][index], mimeType: item.type,
      buffer: index === 0 ? metadataJPEG(bytes) : bytes};
  });
}
async function choose(page, files) {
  await page.locator(".article-photo-picker__input").setInputFiles(files);
  await page.waitForFunction(() => !document.querySelector(".article-photo-picker")?.textContent.includes("Processing photos"));
}
async function fillPhotos(page, alts) {
  const items = page.locator(".article-photo-picker__item");
  await items.last().waitFor({state: "visible"}); assert.equal(await items.count(), alts.length);
  for (let index = 0; index < alts.length; index++) {
    await items.nth(index).locator('[name="photo-alt"]').fill(alts[index]);
    await items.nth(index).locator('[name="photo-caption"]').fill("Temporary caption " + index + " <img src=x onerror=window.__photoExecuted=true>");
  }
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".article-photo-picker__preview")).every(image => image.complete && image.naturalWidth > 0));
}
async function photoAlts(page) { return page.locator('.article-photo-picker__item [name="photo-alt"]').evaluateAll(nodes => nodes.map(node => node.value)); }
async function chooseDocuments(page, files) {
  await page.locator('.article-document-picker input[type="file"]').setInputFiles(files);
  await page.waitForFunction(() => !document.querySelector(".article-document-picker")?.textContent.includes("Preparing PDF documents"));
}
async function fillDocuments(page, titles) {
  const items = page.locator(".article-document-picker__item"); assert.equal(await items.count(), titles.length);
  for (const [index, title] of titles.entries()) await items.nth(index).locator('[name="document-title"]').fill(title);
}
async function readerDocuments(page, name, record, count) {
  const items = page.locator(".article-documents__item"); assert.equal(await items.count(), count);
  assert.equal(await page.locator(".article-documents iframe, .article-documents object, .article-documents embed").count(), 0);
  for (let index = 0; index < count; index++) {
    const item = items.nth(index), source = record.attachments[index].src;
    assert.equal(await item.locator(".article-documents__title").textContent(), record.attachments[index].title);
    assert.equal(await item.locator(".article-documents__title img").count(), 0);
    for (const selector of [".article-documents__open", ".article-documents__download"]) {
      const anchor = item.locator(selector), href = await anchor.getAttribute("href");
      assert.equal(new URL(href, page.url()).pathname, PREFIX + source);
      assert.ok((await anchor.getAttribute("rel")).includes("noopener"));
      if (selector.endsWith("__open")) assert.equal(await anchor.getAttribute("target"), "_blank");
      else assert.ok(await anchor.getAttribute("download"));
    }
    assert.ok(source.startsWith(collections[name].documents));
  }
}
async function waitPublishIdle(page) {
  await page.waitForFunction(() => {
    const label = window.Homepage.authorSession.isConnected() ? "Publish to GitHub" : "Connect GitHub";
    const button = Array.from(document.querySelectorAll(".author-workspace button")).find(button => button.textContent === label);
    return button && !button.disabled;
  });
}
async function downloadZIP(page, name, record, photoCount = 2, documentCount = 0) {
  const promise = page.waitForEvent("download"); await page.getByRole("button", {name: "Download update", exact: true}).click();
  const download = await promise; assert.equal(download.suggestedFilename(), record.id + "-update.zip");
  const files = readZIP(await fs.readFile(await download.path())); assert.ok(files.has(collections[name].file));
  const records = parseRecords(files.get(collections[name].file).toString("utf8"), name), added = records.find(entry => entry.id === record.id);
  assert.ok(added); assert.equal((added.photos || []).length, photoCount); assert.equal((added.attachments || []).length, documentCount);
  assert.equal(files.size, photoCount + documentCount + 1);
  assert.ok(fixtures[name].every(entry => records.some(next => next.id === entry.id)), "下载丢失旧文");
  for (const photo of added.photos || []) { assert.ok(files.has(photo.src)); const info = inspectJPEG(files.get(photo.src)); assert.ok(Math.max(info.width, info.height) <= 1920); }
  for (const attachment of added.attachments || []) { assert.ok(files.has(attachment.src)); assert.ok(files.get(attachment.src).equals(pdfBytes)); assert.equal(attachment.size, pdfBytes.length); }
  for (const [file, bytes] of files) { assert.equal(bytes.includes(Buffer.from(password)) || bytes.includes(Buffer.from(token)), false); assert.ok(file.startsWith(collections[name].images) || file.startsWith(collections[name].documents) || file === collections[name].file); }
  return added;
}
async function loadedGallery(page, mock, count) {
  const images = page.locator(".article-photos__image");
  assert.equal(await images.count(), count);
  for (let index = 0; index < count; index++) {
    const image = images.nth(index); await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(index => {
      const image = document.querySelectorAll(".article-photos__image")[index];
      return image && image.complete && image.naturalWidth > 0;
    }, index);
    const dimensions = await image.evaluate(async image => {
      await image.decode(); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const rect = image.getBoundingClientRect(), style = getComputedStyle(image);
      return {src: image.src, width: image.naturalWidth, height: image.naturalHeight,
        renderedWidth: rect.width, renderedHeight: rect.height,
        borderWidth: parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
        borderHeight: parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth),
        maxHeight: parseFloat(style.maxHeight)};
    });
    const relative = new URL(dimensions.src).pathname.slice(PREFIX.length), bytes = mock.photos.get(relative);
    assert.ok(bytes, "图库不是本次夹具或同提交上传的图片");
    const expected = inspectJPEG(bytes);
    assert.deepEqual([dimensions.width, dimensions.height], [expected.width, expected.height], "图库没有解码真实发布 JPEG");
    const idealHeight = (dimensions.renderedWidth - dimensions.borderWidth) * expected.height / expected.width + dimensions.borderHeight;
    const displayedHeight = Number.isFinite(dimensions.maxHeight) ? Math.min(idealHeight, dimensions.maxHeight) : idealHeight;
    assert.ok(dimensions.renderedWidth > 0 && Math.abs(dimensions.renderedHeight - displayedHeight) <= 2, "图库图片显示比例与发布尺寸不符");
  }
  await page.locator(".article-photos__figure").first().scrollIntoViewIfNeeded();
}
async function screenshot(page, engine, viewport, name, results) {
  if (engine !== "chromium" || ![1440, 390].includes(viewport.width)) return;
  const selector = name === "picker" ? ".article-photo-picker__item" : name === "pdf-picker" ? ".article-document-picker__item"
    : name === "pdf-reader" ? ".article-documents__item" : ".article-photos__figure";
  for (const image of await page.locator(selector + " img").all()) {
    await image.scrollIntoViewIfNeeded(); await image.evaluate(image => image.decode());
  }
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForFunction(selector => Array.from(document.querySelectorAll(selector + " img")).every(image => image.complete && image.naturalWidth > 0), selector);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const file = "artifacts/screenshots/photos-" + viewport.width + "-" + name + ".png";
  await page.screenshot({path: path.join(ROOT, file), animations: "disabled"}); results.push(file);
}

async function runViewport(browser, engine, viewport, url) {
  const context = await browser.newContext({viewport, reducedMotion: "reduce", hasTouch: viewport.width < 700, acceptDownloads: true});
  const mock = freshMock(); await intercept(context, new URL(url).origin, mock);
  await context.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    window.__photoURLs = new Set();
    URL.createObjectURL = blob => { const url = create(blob); window.__photoURLs.add(url); return url; };
    URL.revokeObjectURL = url => { window.__photoURLs.delete(url); return revoke(url); };
  });
  const page = await context.newPage(); page.setDefaultTimeout(18000);
  const steps = [], errors = [], screenshots = [], jpegOutputs = []; let images;
  page.on("pageerror", error => errors.push(error.message));
  const step = async (name, callback) => {
    try { await callback(); await cleanState(page); steps.push({name, status: "通过"}); }
    catch (error) { steps.push({name, status: "失败"}); console.error(engine + " " + viewport.width + "：" + name + "；" + redact(error.message).split("\n")[0]); throw error; }
  };
  try {
    await page.goto(url + collections.moments.route); images = fixtureImages;
    for (const name of Object.keys(collections)) {
      mock.photos.set(fixtures[name][0].photos[0].src, images[0].buffer);
      mock.documents.set(fixtures[name][0].attachments[0].src, pdfBytes);
    }
    await step("三种输入转无元数据 JPEG、尺寸上限与中止", async () => {
      const results = await page.evaluate(async files => {
        const api = window.Homepage.articlePhotos; if (!api) throw new Error("articlePhotos is unavailable");
        const fileFor = item => new File([Uint8Array.from(atob(item.base64), ch => ch.charCodeAt(0))], item.name, {type: item.type});
        const prepared = [];
        for (const file of files) {
          const item = await api.prepare(fileFor(file), {});
          const blobBytes = new Uint8Array(await item.blob.arrayBuffer());
          prepared.push({bytes: Array.from(item.bytes), width: item.width, height: item.height, type: item.blob.type, size: item.blob.size,
            blobSame: blobBytes.length === item.bytes.length && blobBytes.every((byte, index) => byte === item.bytes[index])});
        }
        const denied = [];
        for (const file of [new File(["<svg></svg>"], "temporary.svg", {type: "image/svg+xml"}),
          new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", {type: "image/jpeg"}),
          new File([new Uint8Array([255, 216, 255, 217])], "broken.jpg", {type: "image/jpeg"})]) {
          try { await api.prepare(file, {}); denied.push(false); } catch { denied.push(true); }
        }
        const controller = new AbortController(); const pending = api.prepare(fileFor(files[0]), {signal: controller.signal}); controller.abort();
        let aborted = false; try { await pending; } catch (error) { aborted = error.name === "AbortError"; }
        return {prepared, denied, aborted};
      }, images.map(image => ({name: image.name, type: image.mimeType, base64: image.buffer.toString("base64")})));
      for (const [index, result] of results.prepared.entries()) {
        const info = inspectJPEG(Buffer.from(result.bytes)); assert.equal(result.type, "image/jpeg");
        assert.equal(result.size, info.bytes); assert.deepEqual([result.width, result.height], [info.width, info.height]);
        assert.equal(result.blobSame, true, "预览 Blob 与发布 JPEG 字节不同");
        assert.deepEqual([info.width, info.height], [1920, 1034], "没有按真实原图尺寸缩放");
        assert.ok(Math.max(info.width, info.height) <= 1920 && info.bytes <= 2 * 1024 * 1024);
        assert.equal(info.markers.includes(0xe1) || info.markers.includes(0xed), false,
          images[index].mimeType + " 转码仍有 APP1 / APP13；markers=" + info.markers.map(marker => marker.toString(16)).join(","));
        jpegOutputs.push({inputType: images[index].mimeType, width: info.width, height: info.height, bytes: info.bytes,
          markers: info.markers.map(marker => "0x" + marker.toString(16))});
      }
      assert.ok(results.denied.every(Boolean)); assert.equal(results.aborted, true);
      await page.waitForFunction(() => window.__photoURLs.size === 0);
    });
    await step("照片路径、alt、数量与跨模块白名单", async () => {
      const result = await page.evaluate(({valid, images, id}) => {
        const api = window.Homepage.articlePhotos, good = {src: valid, alt: "A valid photo", caption: "A caption", privateMetadata: "discard"};
        const normalized = api.normalize([good], "moments", id);
        const bad = [
          [{...good, src: "https://example.org/photo.jpg"}], [{...good, src: "javascript:alert(1)"}],
          [{...good, src: "../" + valid}], [{...good, src: valid.replace(id, "another-entry")}],
          [{...good, src: valid.replace("life/moments", "academic/experience")}], [{...good, src: valid + "?secret=1"}],
          [{...good, src: valid.replace("a".repeat(24), "A".repeat(24))}], [{...good, alt: " "}],
          [{...good, alt: "x".repeat(301)}], [{...good, caption: "x".repeat(601)}], [{...good, caption: {unsafe: true}}],
          [good, good],
          Array.from({length: 10}, (_, index) => ({...good, src: images + id + "/" + "a".repeat(24) + "-" + (index + 1) + ".jpg"}))
        ].map(photos => { try { api.normalize(photos, "moments", id); return false; } catch { return true; } });
        return {normalized, empty: api.normalize(undefined, "moments", id), bad};
      }, {valid: fixtures.moments[0].photos[0].src, images: collections.moments.images, id: fixtures.moments[0].id});
      assert.deepEqual(result.empty, []); assert.deepEqual(Object.keys(result.normalized[0]).sort(), ["alt", "caption", "src"]);
      assert.ok(result.bad.every(Boolean)); assert.equal(mock.calls.length, 0);
    });
    await step("PDF 原字节、基础格式、大小、中止与字段路径白名单", async () => {
      const result = await page.evaluate(async ({base64, valid, size, id, prefix}) => {
        const api = window.Homepage.articleDocuments, bytes = Uint8Array.from(atob(base64), ch => ch.charCodeAt(0));
        const prepared = await api.prepare(new File([bytes], "temporary.pdf", {type: "application/pdf"}), {});
        const blobBytes = new Uint8Array(await prepared.blob.arrayBuffer());
        const denied = [];
        const large = new Uint8Array(10 * 1024 * 1024 + 1); large.set(bytes.subarray(0, 10)); large.set(new TextEncoder().encode("%%EOF\n"), large.length - 6);
        for (const file of [
          new File([bytes], "wrong.png", {type: "image/png"}), new File(["not-a-pdf\n%%EOF\n"], "header.pdf", {type: "application/pdf"}),
          new File(["%PDF-1.7\nno eof"], "eof.pdf", {type: "application/pdf"}),
          new File([bytes, "malicious trailing bytes"], "trailing.pdf", {type: "application/pdf"}),
          new File([large], "large.pdf", {type: "application/pdf"})
        ]) { try { await api.prepare(file, {}); denied.push(false); } catch { denied.push(true); } }
        const controller = new AbortController(); const pending = api.prepare(new File([bytes], "cancel.pdf", {type: "application/pdf"}), {signal: controller.signal}); controller.abort();
        let aborted = false; try { await pending; } catch (error) { aborted = error.name === "AbortError"; }
        const good = {src: valid, title: "Temporary PDF title", size, privateMetadata: "discard"};
        const bad = [
          [{...good, src: "https://example.org/test.pdf"}], [{...good, src: "javascript:alert(1)"}], [{...good, src: "../" + valid}],
          [{...good, src: valid.replace(id, "another-entry")}], [{...good, src: valid.replace("life/moments", "academic/experience")}],
          [{...good, src: valid + "?secret=1"}], [{...good, src: valid.replace("b".repeat(24), "B".repeat(24))}],
          [{...good, title: " "}], [{...good, title: "x".repeat(161)}], [{...good, title: {unsafe: true}}],
          [{...good, size: 0}], [{...good, size: -1}], [{...good, size: 1.5}], [{...good, size: "143"}],
          [{...good, size: 10 * 1024 * 1024 + 1}], [good, good],
          Array.from({length: 4}, (_, index) => ({...good, src: prefix + id + "/" + "b".repeat(24) + "-" + (index + 1) + ".pdf"}))
        ].map(items => { try { api.normalize(items, "moments", id); return false; } catch { return true; } });
        return {bytes: Array.from(prepared.bytes), blobBytes: Array.from(blobBytes), blobType: prepared.blob.type, denied, aborted, bad,
          normalized: api.normalize([good], "moments", id), empty: api.normalize(undefined, "moments", id)};
      }, {base64: pdfBytes.toString("base64"), valid: fixtures.moments[0].attachments[0].src, size: pdfBytes.length,
        id: fixtures.moments[0].id, prefix: collections.moments.documents});
      assert.ok(Buffer.from(result.bytes).equals(pdfBytes)); assert.deepEqual(result.blobBytes, result.bytes); assert.equal(result.blobType, "application/pdf");
      assert.ok(result.denied.every(Boolean)); assert.equal(result.aborted, true); assert.ok(result.bad.every(Boolean));
      assert.deepEqual(result.empty, []); assert.deepEqual(Object.keys(result.normalized[0]).sort(), ["size", "src", "title"]); assert.equal(mock.calls.length, 0);
    });
    await step("两栏图片阅读、纯文本 caption、直达与刷新", async () => {
      for (const [name, item] of Object.entries(collections)) {
        await navigate(page, url, item.route + "/" + fixtures[name][0].id);
        await page.locator(item.body).waitFor({state: "visible"});
        await loadedGallery(page, mock, 1);
        assert.equal(await page.locator(".article-photos__figure").count(), 1);
        assert.equal(await page.locator(".article-photos__image").getAttribute("alt"), "A temporary landscape");
        assert.equal(await page.locator(".article-photos__caption").textContent(), fixtures[name][0].photos[0].caption);
        assert.equal(await page.locator(".article-photos__caption img").count(), 0); await layout(page);
        await readerDocuments(page, name, fixtures[name][0], 1);
        await page.reload(); await page.locator(".article-photos__figure").waitFor({state: "visible"}); await loadedGallery(page, mock, 1);
      }
      assert.equal(mock.calls.length, 0);
    });
    await author(page, url, "moments"); await signIn(page); const moment = await draft(page, "moments", "photo-update");
    await step("九张照片合法、第十张拒绝及失败批次回滚", async () => {
      await page.locator(".article-photo-picker__input").setInputFiles(Array.from({length: 9}, (_, index) => ({...images[index % 3], name: "temporary-nine-" + index + "." + ["jpg", "png", "webp"][index % 3]})));
      assert.equal(await page.getByRole("button", {name: "Download update", exact: true}).isDisabled(), true);
      await page.waitForFunction(() => !document.querySelector(".article-photo-picker")?.textContent.includes("Processing photos"));
      const items = page.locator(".article-photo-picker__item"); assert.equal(await items.count(), 9);
      await fillPhotos(page, Array.from({length: 9}, (_, index) => "Temporary photo " + (index + 1)));
      await choose(page, [images[0]]); assert.equal(await items.count(), 9, "第十张未被拒绝");
      await downloadZIP(page, "moments", moment, 9);
      await items.last().getByRole("button", {name: /remove.*photo/i}).click();
      await items.last().getByRole("button", {name: /remove.*photo/i}).click();
      const prior = await photoAlts(page);
      await choose(page, [images[0], {name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from([255, 216, 255, 217])}]);
      assert.deepEqual(await photoAlts(page), prior, "失败批次改变已有照片");
      while (await items.count()) await items.last().getByRole("button", {name: /remove.*photo/i}).click();
      await page.waitForFunction(() => window.__photoURLs.size === 0);
      assert.equal(await page.getByRole("button", {name: "Download update", exact: true}).isDisabled(), false);
      assert.equal(mock.calls.length, 0);
    });
    await step("选择预览及必填 alt 拒绝无效导出", async () => {
      await choose(page, images); await fillPhotos(page, ["", "Temporary PNG landscape", "Temporary WebP landscape"]);
      await page.getByRole("button", {name: "Download update", exact: true}).click();
      await page.locator(".author-workspace__status").filter({hasText: /alt|description/i}).waitFor({state: "visible"});
      assert.equal(mock.calls.length, 0); assert.equal(await page.locator(".article-photo-picker__item").count(), 3);
      await page.locator('.article-photo-picker__item [name="photo-alt"]').first().fill("Temporary JPEG landscape"); await layout(page);
    });
    await step("键盘排序、移除与九张上限", async () => {
      const items = page.locator(".article-photo-picker__item");
      await items.first().getByRole("button", {name: /move.*down/i}).click();
      assert.deepEqual(await photoAlts(page), ["Temporary PNG landscape", "Temporary JPEG landscape", "Temporary WebP landscape"]);
      await items.nth(2).getByRole("button", {name: /move.*up/i}).focus(); await page.keyboard.press("Enter");
      assert.deepEqual(await photoAlts(page), ["Temporary PNG landscape", "Temporary WebP landscape", "Temporary JPEG landscape"]);
      assert.equal(await items.nth(1).getByRole("button", {name: /move.*up/i}).evaluate(button => button === document.activeElement), true, "排序后键盘焦点丢失");
      await items.nth(2).getByRole("button", {name: /remove.*photo/i}).click();
      assert.deepEqual(await photoAlts(page), ["Temporary PNG landscape", "Temporary WebP landscape"]);
      await choose(page, Array.from({length: 8}, (_, index) => ({...images[0], name: "extra-" + index + ".jpg"})));
      assert.equal(await items.count(), 2, "超出九张后仍加入图片");
      await nativeTabTo(page, '.article-photo-picker__item [name="photo-alt"]'); await layout(page);
      await screenshot(page, engine, viewport, "picker", screenshots);
    });
    await step("带图 ZIP 真路径、JPEG 与独立数据完整性", async () => {
      const added = await downloadZIP(page, "moments", moment);
      assert.deepEqual(added.photos.map(photo => photo.alt), ["Temporary PNG landscape", "Temporary WebP landscape"]);
      assert.equal(mock.calls.length, 0);
    });
    await connect(page);
    await step("已连接发布仍拒绝缺失 alt 且无新增 API", async () => {
      const calls = mock.calls.length, field = page.locator('.article-photo-picker__item [name="photo-alt"]').first();
      const alt = await field.inputValue(); await field.fill("");
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.locator(".author-workspace__status").filter({hasText: /alt|description/i}).waitFor({state: "visible"});
      assert.equal(mock.calls.length, calls); await field.fill(alt);
    });
    for (const failure of ["ref-malformed", "blob-malformed", "blob-500", "tree-500", "commit-500", "patch-409", "patch-422", "blob-401", "patch-network"]) {
      await step("原子发布失败保留草稿及照片：" + failure, async () => {
        const patches = mock.patches.length, before = mock.calls.length; mock.mode = failure;
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
        await page.waitForFunction(() => !document.querySelector(".author-workspace__status")?.textContent.includes("Publishing to GitHub"));
        await waitPublishIdle(page);
        assert.ok(mock.calls.length > before); assert.equal(page.url(), url + collections.moments.route + "/author");
        assert.equal(await page.locator('.author-workspace [name="body"]').inputValue(), moment.body);
        assert.deepEqual(await photoAlts(page), ["Temporary PNG landscape", "Temporary WebP landscape"]);
        assert.equal((await page.locator(".author-workspace__status").textContent()).includes("Published to GitHub"), false);
        assert.equal(mock.patches.length - patches, failure.startsWith("patch-") ? 1 : 0, "中途失败仍更新了分支");
        mock.mode = null;
        if (failure === "blob-401") { assert.equal(await page.evaluate(() => window.Homepage.authorSession.isConnected()), false); await connect(page); }
      });
    }
    await step("同提交照片与正文、保留远端旧文且两栏独立", async () => {
      const other = JSON.stringify(mock.records.experience);
      mock.records.moments.push({...fixtures.moments[0], id: "concurrent-moment", title: "A concurrent temporary article", photos: undefined, attachments: undefined});
      const head = mock.head, patches = mock.patches.length;
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + collections.moments.route + "/" + moment.id);
      assert.equal(mock.patches.length, patches + 1); assert.equal(mock.patches.at(-1).head, head); assert.equal(mock.patches.at(-1).force, false);
      assert.ok(mock.records.moments.some(record => record.id === "concurrent-moment")); assert.equal(JSON.stringify(mock.records.experience), other);
      await page.locator(".article-photos__image").last().waitFor({state: "visible"});
      assert.deepEqual(await page.locator(".article-photos__image").evaluateAll(images => images.map(image => image.alt)), ["Temporary PNG landscape", "Temporary WebP landscape"]);
      await loadedGallery(page, mock, 2);
      await page.waitForFunction(() => window.__photoURLs.size === 0); await layout(page);
      await screenshot(page, engine, viewport, "moments-gallery", screenshots);
    });
    await step("Experience 独立带图导出、原子发布与阅读", async () => {
      const other = JSON.stringify(mock.records.moments); await author(page, url, "experience");
      const entry = await draft(page, "experience", "photo-update"); await choose(page, images.slice(0, 2));
      await fillPhotos(page, ["Temporary academic photograph", "Temporary seminar photograph"]);
      await downloadZIP(page, "experience", entry);
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + collections.experience.route + "/" + entry.id);
      assert.equal(mock.patches.at(-1).name, "experience"); assert.equal(JSON.stringify(mock.records.moments), other);
      await loadedGallery(page, mock, 2); await layout(page);
      await screenshot(page, engine, viewport, "experience-gallery", screenshots);
    });
    await step("纯文字继续 Contents PUT 并保留已有照片", async () => {
      await author(page, url, "moments"); const entry = await draft(page, "moments", "text-update");
      const blobs = mock.blobWrites.length, patches = mock.patches.length, puts = mock.puts.length;
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + collections.moments.route + "/" + entry.id);
      assert.equal(mock.puts.length, puts + 1); assert.equal(mock.blobWrites.length, blobs); assert.equal(mock.patches.length, patches);
      assert.equal(mock.records.moments.find(record => record.id === moment.id).photos.length, 2);
    });
    await step("发布事务绑定拒绝外部对象、旧 blob 与取消后的请求", async () => {
      const before = mock.calls.length;
      const result = await page.evaluate(async ({repo, foreign, data, photo, photoPath}) => {
        const session = window.Homepage.authorSession, rejected = [];
        const deny = async action => { try { await action(); rejected.push(false); } catch { rejected.push(true); } };
        const foreignCommit = () => session.request(repo + "/git/commits", {method: "POST", body: {message: "Temporary", tree: foreign, parents: [foreign]}});
        const foreignRef = () => session.request(repo + "/git/refs/heads/main", {method: "PATCH", body: {sha: foreign, force: false}});
        await deny(foreignCommit); await deny(foreignRef);
        const begin = async signal => {
          const ref = await session.request(repo + "/git/ref/heads/main", {signal});
          return session.request(repo + "/git/commits/" + ref.object.sha, {signal});
        };
        const commit = await begin();
        const dataBlob = await session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: data}});
        const photoBlob = await session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: photo}});
        const tree = [
          {path: "modules/life/moments/posts.js", mode: "100644", type: "blob", sha: dataBlob.sha},
          {path: photoPath, mode: "100644", type: "blob", sha: photoBlob.sha}
        ];
        const createTree = (base, nodes = tree) => session.request(repo + "/git/trees", {method: "POST", body: {base_tree: base, tree: nodes}});
        await deny(() => createTree(foreign));
        await deny(() => createTree(commit.tree.sha, [tree[0], {...tree[1], sha: foreign}]));
        await deny(foreignCommit); await deny(foreignRef);
        const refreshed = await begin();
        await deny(() => createTree(refreshed.tree.sha));
        const controller = new AbortController(); await begin(controller.signal); controller.abort();
        await deny(() => session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: photo}}));
        await deny(foreignCommit); await deny(foreignRef);
        return {rejected, connected: session.isConnected()};
      }, {repo: REPO, foreign: digest("external-photo-object"),
        data: Buffer.from(registration("moments", mock.records.moments)).toString("base64"),
        photo: images[0].buffer.toString("base64"), photoPath: photoPath("moments", "transaction-bound")});
      assert.ok(result.rejected.every(Boolean)); assert.equal(result.rejected.length, 10);
      assert.equal(result.connected, true); assert.equal(mock.calls.length, before + 8, "外部或已取消的事务请求到达 GitHub 层");
    });
    await step("禁止跨模块、遍历和其他分支 Git 请求", async () => {
      const before = mock.calls.length;
      const rejected = await page.evaluate(async ({repo, data, photo}) => {
        const session = window.Homepage.authorSession;
        const ref = await session.request(repo + "/git/ref/heads/main"), head = ref.object.sha;
        const commit = await session.request(repo + "/git/commits/" + head), base = commit.tree.sha;
        const dataBlob = await session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: data}});
        const photoBlob = await session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: photo}});
        const sha = photoBlob.sha;
        const badTree = entry => session.request(repo + "/git/trees", {method: "POST", body: {base_tree: base, tree: [
          {path: "modules/life/moments/posts.js", mode: "100644", type: "blob", sha: dataBlob.sha}, entry]}});
        const operations = [
          () => session.request(repo + "/git/refs/heads/other", {method: "PATCH", body: {sha, force: false}}),
          () => session.request(repo + "/git/refs/heads/main", {method: "PATCH", body: {sha, force: true}}),
          () => badTree({path: "../README.md", mode: "100644", type: "blob", sha}),
          () => badTree({path: "modules/life/relationship/encrypted.js", mode: "100644", type: "blob", sha}),
          () => badTree({path: "modules/academic/experience/images/posts/entry/" + "a".repeat(24) + "-1.jpg", mode: "100644", type: "blob", sha}),
          () => badTree({path: "modules/life/moments/documents/posts/../" + "b".repeat(24) + "-1.pdf", mode: "100644", type: "blob", sha}),
          () => badTree({path: "modules/academic/experience/documents/posts/entry/" + "b".repeat(24) + "-1.pdf", mode: "100644", type: "blob", sha}),
          () => session.request(repo + "/git/refs/heads/main", {method: "PATCH", body: {sha: "A".repeat(40), force: false}}),
          () => session.request(repo + "/git/blobs", {method: "POST", body: {encoding: "base64", content: "not$$base64"}}),
          () => session.request(repo + "/git/commits", {method: "POST", body: {message: "Temporary", tree: sha, parents: [sha, sha]}}),
          () => session.request(repo + "/git/trees", {method: "POST", body: {base_tree: base, tree: [
            {path: "modules/life/moments/posts.js", mode: "100644", type: "blob", sha: dataBlob.sha},
            {path: "modules/academic/experience/entries.js", mode: "100644", type: "blob", sha: dataBlob.sha}]}})
        ];
        return Promise.all(operations.map(async action => { try { await action(); return false; } catch { return true; } }));
      }, {repo: REPO, data: Buffer.from(registration("moments", mock.records.moments)).toString("base64"), photo: images[0].buffer.toString("base64")});
      assert.ok(rejected.every(Boolean)); assert.equal(mock.calls.length, before + 4, "非法请求到达 GitHub 层");
    });
    await step("九张照片 ZIP 及同提交发布完整保留九条路径", async () => {
      await author(page, url, "moments"); const record = await draft(page, "moments", "nine-photos");
      await choose(page, Array.from({length: 9}, (_, index) => ({...images[index % 3], name: "nine-publish-" + index + "." + ["jpg", "png", "webp"][index % 3]})));
      await fillPhotos(page, Array.from({length: 9}, (_, index) => "Temporary ninth-photo test " + (index + 1)));
      const added = await downloadZIP(page, "moments", record, 9);
      assert.ok(added.photos[8].src.endsWith("-9.jpg"));
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + collections.moments.route + "/" + record.id);
      assert.equal(mock.treeWrites.at(-1).paths.length, 10); await loadedGallery(page, mock, 9); await layout(page);
    });
    await step("PDF 标题、三份上限、键盘排序删除及失败批次回滚", async () => {
      await author(page, url, "moments"); await draft(page, "moments", "pdf-validation");
      await chooseDocuments(page, [pdfFile(0), pdfFile(1), pdfFile(2)]);
      const items = page.locator(".article-document-picker__item"); assert.equal(await items.count(), 3);
      await fillDocuments(page, ["Temporary first PDF", "Temporary second PDF", "Temporary third PDF"]);
      await chooseDocuments(page, [pdfFile(3)]); assert.equal(await items.count(), 3, "第四份 PDF 未被拒绝");
      const before = mock.calls.length;
      await items.first().locator('[name="document-title"]').fill("");
      await page.getByRole("button", {name: "Download update", exact: true}).click();
      await page.locator(".author-workspace__status").filter({hasText: /title/i}).waitFor({state: "visible"}); assert.equal(mock.calls.length, before);
      await items.first().locator('[name="document-title"]').fill("Temporary first PDF");
      await items.nth(2).getByRole("button", {name: /move.*up/i}).focus(); await page.keyboard.press("Enter");
      assert.equal(await items.nth(1).getByRole("button", {name: /move.*up/i}).evaluate(node => node === document.activeElement), true);
      assert.deepEqual(await items.locator('[name="document-title"]').evaluateAll(nodes => nodes.map(node => node.value)), ["Temporary first PDF", "Temporary third PDF", "Temporary second PDF"]);
      await nativeTabTo(page, '.article-document-picker__item [name="document-title"]'); await layout(page);
      await screenshot(page, engine, viewport, "pdf-picker", screenshots);
      await items.last().getByRole("button", {name: /remove.*document/i}).click();
      await items.last().getByRole("button", {name: /remove.*document/i}).click();
      await chooseDocuments(page, [pdfFile(1), {name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nmissing end")}]);
      assert.equal(await items.count(), 1); assert.equal(await items.first().locator('[name="document-title"]').inputValue(), "Temporary first PDF");
      await page.locator("#close-detail").click(); await author(page, url, "moments"); assert.equal(await items.count(), 0);
    });
    for (const name of Object.keys(collections)) {
      await step(name + " PDF-only ZIP 与原子发布，保留旧图及 PDF", async () => {
        const otherName = name === "moments" ? "experience" : "moments", other = JSON.stringify(mock.records[otherName]);
        await author(page, url, name); const record = await draft(page, name, "pdf-only");
        await chooseDocuments(page, [pdfFile(0), pdfFile(1), pdfFile(2)]);
        await fillDocuments(page, ["Temporary PDF <img src=x onerror=window.__photoExecuted=true>", "Temporary supporting PDF", "Temporary final PDF"]);
        const added = await downloadZIP(page, name, record, 0, 3), puts = mock.puts.length;
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click(); await page.waitForURL(url + collections[name].route + "/" + record.id);
        assert.equal(mock.puts.length, puts); assert.equal(mock.treeWrites.at(-1).paths.length, 4); assert.equal(JSON.stringify(mock.records[otherName]), other);
        assert.deepEqual(mock.records[name].find(item => item.id === fixtures[name][0].id), fixtures[name][0]);
        await readerDocuments(page, name, added, 3); assert.equal(await page.locator(".article-photos__image").count(), 0); await layout(page);
        if (name === "moments") await screenshot(page, engine, viewport, "pdf-reader", screenshots);
      });
      await author(page, url, name); const mixed = await draft(page, name, "mixed-assets"), count = name === "experience" ? 9 : 2;
      await choose(page, Array.from({length: count}, (_, index) => ({...images[index % 3], name: "mixed-" + index + "." + ["jpg", "png", "webp"][index % 3]})));
      await fillPhotos(page, Array.from({length: count}, (_, index) => "Temporary mixed photograph " + (index + 1)));
      await chooseDocuments(page, [pdfFile(0), pdfFile(1), pdfFile(2)]); await fillDocuments(page, ["Temporary mixed PDF one", "Temporary mixed PDF two", "Temporary mixed PDF three"]);
      if (name === "moments") for (const failure of ["blob-500", "patch-409", "blob-401"]) {
        await step("混合附件失败保留 PDF 与照片：" + failure, async () => {
          const patches = mock.patches.length; mock.mode = failure;
          await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
          await page.waitForFunction(() => !document.querySelector(".author-workspace__status")?.textContent.includes("Publishing to GitHub")); await waitPublishIdle(page);
          assert.equal(page.url(), url + collections[name].route + "/author");
          assert.equal(await page.locator('.author-workspace [name="body"]').inputValue(), mixed.body);
          assert.equal(await page.locator(".article-photo-picker__item").count(), count); assert.equal(await page.locator(".article-document-picker__item").count(), 3);
          assert.equal(mock.patches.length - patches, failure === "patch-409" ? 1 : 0); mock.mode = null;
          if (failure === "blob-401") { assert.equal(await page.evaluate(() => window.Homepage.authorSession.isConnected()), false); await connect(page); }
        });
      }
      await step(name + " 混合附件 ZIP 与同提交照片/PDF/数据原子发布", async () => {
        const added = await downloadZIP(page, name, mixed, count, 3), other = JSON.stringify(mock.records[name === "moments" ? "experience" : "moments"]), puts = mock.puts.length;
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click(); await page.waitForURL(url + collections[name].route + "/" + mixed.id);
        assert.equal(mock.treeWrites.at(-1).paths.length, count + 4); assert.equal(mock.puts.length, puts);
        assert.equal(JSON.stringify(mock.records[name === "moments" ? "experience" : "moments"]), other);
        await loadedGallery(page, mock, count); await readerDocuments(page, name, added, 3); await layout(page);
      });
    }
    await step("详情关闭、中止处理、预览释放与重新打开", async () => {
      await author(page, url, "moments"); await draft(page, "moments", "cleanup"); await choose(page, images.slice(0, 2));
      await fillPhotos(page, ["Temporary cleanup photo one", "Temporary cleanup photo two"]);
      await chooseDocuments(page, [pdfFile(0)]); await fillDocuments(page, ["Temporary cleanup PDF"]);
      assert.ok(await page.evaluate(() => window.__photoURLs.size > 0));
      await page.locator("#close-detail").click(); await page.waitForFunction(() => !document.getElementById("detail-dialog").open && window.__photoURLs.size === 0);
      await author(page, url, "moments"); assert.equal(await page.locator(".article-photo-picker__item").count(), 0); assert.equal(await page.locator(".article-document-picker__item").count(), 0);
      await page.locator(".article-photo-picker__input").setInputFiles(images);
      await page.locator("#close-detail").click(); await page.waitForFunction(() => !document.getElementById("detail-dialog").open && window.__photoURLs.size === 0);
      await author(page, url, "experience"); assert.equal(await page.locator(".article-photo-picker__item").count(), 0);
      await page.getByRole("button", {name: "Sign out", exact: true}).click();
      assert.equal(await page.locator(".article-photo-picker__input").count(), 0); await layout(page);
    });
    assert.deepEqual(mock.errors, []); assert.deepEqual(mock.blocked, []); assert.deepEqual(errors, []);
    return {viewport, status: "通过", steps, screenshots, jpegOutputs, api: {requests: mock.calls.length, contentsReads: mock.reads,
      blobWrites: mock.blobWrites, treeWrites: mock.treeWrites, commitWrites: mock.commitWrites, refUpdates: mock.patches,
      mockedPuts: mock.puts, realWrites: 0}};
  } catch (error) { return {viewport, status: "失败", steps, error: redact(error.stack || error), mockErrors: mock.errors, blockedRequests: mock.blocked, pageErrors: errors}; }
  finally { await context.close(); }
}
async function runEngine(engine, url) {
  let browser;
  try {
    browser = await playwright[engine].launch({headless: true}); const results = [];
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, engine, viewport, url));
      console.log(engine + " " + viewport.width + "×" + viewport.height + "：" + results.at(-1).status + "。");
    }
    return {engine, version: browser.version(), results};
  } catch (error) { return {engine, status: "未完成", error: redact(error.message)}; }
  finally { if (browser) await browser.close(); }
}
(async () => {
  const protectedFiles = ["modules/author/config.js", "modules/life/relationship/encrypted.js", ...Object.values(collections).map(item => item.file)];
  const originals = await Promise.all(protectedFiles.map(file => fs.readFile(path.join(ROOT, file))));
  await fs.mkdir(path.join(ROOT, "artifacts/screenshots"), {recursive: true});
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = "http://127.0.0.1:" + server.address().port + PREFIX;
    // WebKit 能解码 WebP，但不保证 canvas 可编码 WebP；统一生成真实三格式输入再跨内核验证解码。
    const fixtureBrowser = await playwright.chromium.launch({headless: true});
    try { const fixturePage = await fixtureBrowser.newPage(); fixtureImages = await makeImages(fixturePage); }
    finally { await fixtureBrowser.close(); }
    const browsers = await Promise.all(ENGINES.map(engine => runEngine(engine, url)));
    const sourceUnchanged = (await Promise.all(protectedFiles.map(file => fs.readFile(path.join(ROOT, file)))))
      .every((bytes, index) => bytes.equals(originals[index]));
    const passed = sourceUnchanged && browsers.every(browser => browser.results?.length === VIEWPORTS.length && browser.results.every(result => result.status === "通过"));
    const report = {date: new Date().toISOString(), prefix: PREFIX, passed, sourceUnchanged, browsers,
      limits: ["照片、密码、令牌与文章均为临时内存夹具；GitHub 请求全部拦截，真实远端写入为 0。",
        "HTTP 替换随机密码配置及数据，不改正式 config.js、entries.js 或 posts.js。",
        "三内核与手机模拟视口不等于品牌版本、手机真机、真实授权或线上部署验证。",
        "元数据检查覆盖重新编码 JPEG 的 APP1 / APP13；DOM 与 URL 释放不能证明堆内存物理清除。"]};
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");
    console.log("照片集成测试" + (passed ? "全部通过" : "存在失败") + "；报告：artifacts/photo-results.json。");
    if (!passed) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
