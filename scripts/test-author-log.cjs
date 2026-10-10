/* 真实页面测试仅使用随机密码、临时双集合及全拦截 GitHub；不改正式配置或执行远端写入。 */
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const PREFIX = "/personal-homepage/";
const REPO = "/repos/PaulLi07/personal-homepage";
const VAULT = "personal-homepage:author-connection:v1";
const REPORT = path.join(ROOT, "artifacts/author-log-results.json");
const ENGINES = ["chromium", "firefox", "webkit"];
const VIEWPORTS = [{width: 1440, height: 900}, {width: 390, height: 844}, {width: 320, height: 780}];
const password = crypto.randomBytes(32).toString("base64url");
const token = "author-log-test-only-" + crypto.randomBytes(24).toString("hex");
const salt = crypto.randomBytes(16);
const config = {version: 1, iterations: 600000, salt: salt.toString("base64"),
  verifier: crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("base64"),
  owner: "PaulLi07", repo: "personal-homepage"};
const configSource = "window.Homepage.authorConfig = " + JSON.stringify(config) + ";\n";
assert.equal(configSource.includes(password), false);
const collections = {
  moments: {route: "#life/moments", file: "modules/life/moments/posts.js", registration: "registerBlogPosts",
    root: ".moments-blog", card: ".moments-blog__card", title: ".moments-blog__title",
    body: ".moments-blog__body", back: ".moments-blog__back", author: "[data-blog-author]"},
  experience: {route: "#academic/experience", file: "modules/academic/experience/entries.js", registration: "registerAcademicLogs",
    root: ".academic-log", card: ".academic-log__card", title: ".academic-log__title",
    body: ".academic-log__body", back: ".academic-log__back", author: "[data-academic-author]"}
};
const markup = "\n<script>window.__authorLogExecuted = true</script>\n<img src=x onerror=\"window.__authorLogExecuted=true\">";
const fixtures = {
  moments: [{id: "temporary-moment", title: "A temporary life article", date: "2026-10-09",
    excerpt: "Temporary reader fixture.", body: "Life article first line.\n\nSecond paragraph." + markup, author: "Yuhong Li"},
  {id: "temporary-newer-moment", title: "Another temporary life article", date: "2026-10-10",
    excerpt: "A newer temporary article.", body: "Independent life collection.", author: "Yuhong Li"}],
  experience: ["Research", "Learning", "Seminar", "Milestone"].map((kind, index) => ({
    id: "temporary-" + kind.toLowerCase(), title: "Temporary " + kind.toLowerCase() + " log",
    date: "2026-10-0" + (index + 6), excerpt: "Temporary academic reader fixture.",
    body: "Independent academic log.\n\nSecond paragraph." + markup, author: "Yuhong Li", kind,
    ...(index === 0 ? {reference: "https://example.org/academic-reference?kind=research"} : {})
  }))
};
const registration = (name, records) => "window.Homepage." + collections[name].registration + "(" + JSON.stringify(records) + ");\n";
const fileAPI = name => REPO + "/contents/" + collections[name].file;
function parseRecords(source, name) {
  const text = source.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
  const match = text.match(new RegExp("^\\s*window\\.Homepage\\." + collections[name].registration + "\\(\\s*([\\s\\S]*)\\s*\\);?\\s*$"));
  assert.ok(match, "更新文件不符合纯数据登记格式");
  const records = JSON.parse(match[1]);
  assert.ok(Array.isArray(records));
  return records;
}
function freshMock() {
  return {login: "PaulLi07", owner: "PaulLi07", canPush: true, userStatus: 200, mode: "success",
    calls: [], reads: [], puts: [], errors: [], blocked: [], sha: {}, raw: {}, contentsStatus: {},
    records: Object.fromEntries(Object.entries(fixtures).map(([name, records]) => [name,
      records.map(record => ({...record, unknownMetadata: "discard-this-field"}))]))};
}

let playwright;
try { playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright"); }
catch {
  console.error("未找到 Playwright；请用 HOMEPAGE_PLAYWRIGHT_MODULE 指定维护环境已有模块与浏览器。");
  process.exit(1);
}
const mime = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json"};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(PREFIX)) throw new Error("Invalid prefix");
    const relative = pathname.slice(PREFIX.length) || "index.html";
    if (relative.split("/").some(part => part === ".git" || part === ".private")) throw new Error("Invalid path");
    const file = await fs.realpath(path.resolve(ROOT, relative));
    if (!file.startsWith(ROOT + path.sep) || !mime[path.extname(file)]) throw new Error("Invalid file");
    response.writeHead(200, {"Content-Type": mime[path.extname(file)] + "; charset=utf-8", "Cache-Control": "no-store"});
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404); response.end("Not found"); }
});

async function intercept(context, origin, mock) {
  // 兜底拦截所有网络；仅站点本地资源继续，GitHub 全部响应模拟，其他远端一律中止。
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === PREFIX + "modules/author/config.js") {
      return route.fulfill({contentType: "text/javascript", body: configSource});
    }
    for (const [name, item] of Object.entries(collections)) {
      if (url.origin === origin && url.pathname === PREFIX + item.file) {
        return route.fulfill({contentType: "text/javascript", body: registration(name, fixtures[name])});
      }
    }
    if (url.origin === origin && url.pathname.startsWith(PREFIX)) return route.continue();
    if (url.origin !== "https://api.github.com") {
      mock.blocked.push({method: request.method(), origin: url.origin, path: url.pathname});
      return route.abort();
    }
    const headers = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-GitHub-Api-Version", "Content-Type": "application/json"};
    const respond = (data, status = 200) => route.fulfill({status, headers, body: JSON.stringify(data)});
    if (request.method() === "OPTIONS") return route.fulfill({status: 204, headers});
    try {
      assert.equal(request.headers().authorization, "Bearer " + token);
      mock.calls.push({method: request.method(), path: url.pathname});
      if (request.method() === "GET" && url.pathname === "/user") return respond({login: mock.login}, mock.userStatus);
      if (request.method() === "GET" && url.pathname === REPO) return respond({owner: {login: mock.owner}, permissions: {push: mock.canPush}});
      const name = Object.keys(collections).find(key => url.pathname === fileAPI(key));
      assert.ok(name, "访问了集合外 GitHub 路径");
      if (request.method() === "GET") {
        if (mock.contentsStatus[name]) return respond({message: "Temporary expired connection"}, mock.contentsStatus[name]);
        assert.equal(url.searchParams.get("ref"), "main");
        const sha = "author-log-" + name + "-" + (mock.reads.length + 1);
        mock.sha[name] = sha;
        mock.reads.push({name, sha});
        const source = mock.raw[name] || registration(name, mock.records[name]);
        return respond({type: "file", encoding: "base64", sha, size: Buffer.byteLength(source), content: Buffer.from(source).toString("base64")});
      }
      assert.equal(request.method(), "PUT");
      const body = request.postDataJSON();
      assert.equal(body.branch, "main");
      assert.equal(body.sha, mock.sha[name], "发布使用了旧 SHA");
      assert.equal(mock.reads.at(-1)?.name, name, "发布未重新读取当前集合");
      const records = parseRecords(Buffer.from(body.content, "base64").toString("utf8"), name);
      assert.ok(records.every(record => !Object.hasOwn(record, "unknownMetadata")), "发布包含未声明字段");
      assert.ok(mock.records[name].every(record => records.some(next => next.id === record.id)), "发布丢失远端记录");
      const other = name === "moments" ? "experience" : "moments";
      assert.ok(records.every(record => !fixtures[other].some(fixture => fixture.id === record.id)), "两集合混写");
      mock.puts.push({name, sha: body.sha, branch: body.branch, ids: records.map(record => record.id), status: mock.mode === "conflict" ? 409 : 201});
      if (mock.mode === "conflict") return respond({message: "Temporary conflict"}, 409);
      mock.records[name] = records;
      return respond({content: {sha: "updated-" + name}, commit: {sha: "temporary-commit"}}, 201);
    } catch (error) {
      mock.errors.push(String(error.message).replaceAll(token, "[测试令牌]"));
      return respond({message: "Author log mock validation failed"}, 500);
    }
  });
}

async function state(page) {
  return page.evaluate(() => ({unlocked: window.Homepage.authorSession.isUnlocked(), connected: window.Homepage.authorSession.isConnected()}));
}
async function leaks(page) {
  const result = await page.evaluate(({password, token}) => {
    const persisted = Object.values(localStorage).join("\n") + Object.values(sessionStorage).join("\n")
      + document.cookie + JSON.stringify(history.state) + location.href;
    return {plainAbsent: !persisted.includes(password) && !persisted.includes(token),
      inputsClear: Array.from(document.querySelectorAll('input[name="author-password"], input[name="token"]')).every(input => input.value === ""),
      sessionEmpty: sessionStorage.length === 0, executed: Boolean(window.__authorLogExecuted)};
  }, {password, token});
  assert.equal(result.plainAbsent, true, "明文凭据进入持久数据或路由");
  assert.equal(result.inputsClear, true, "作者凭据输入未清空");
  assert.equal(result.sessionEmpty, true, "作者服务使用了 sessionStorage");
  assert.equal(result.executed, false, "数据中的脚本被执行");
}
async function layout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  assert.equal(await page.locator("#detail-dialog").evaluate(node => node.scrollWidth <= node.clientWidth + 1), true);
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)), false);
}
async function nativeTabTo(page, selector) {
  await page.locator("#close-detail").focus();
  for (let count = 0; count < 45; count += 1) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("原生 Tab 无法到达作者输入框");
}
async function navigate(page, url, hash) {
  await page.evaluate(hash => { location.hash = hash; }, hash);
  await page.waitForURL(url + hash);
}
async function author(page, url, name) {
  await navigate(page, url, collections[name].route + "/author");
  await page.locator(".author-workspace").waitFor({state: "visible"});
}
async function signIn(page) {
  await nativeTabTo(page, '.author-workspace input[name="author-password"]');
  await page.keyboard.insertText(password);
  await page.getByRole("button", {name: "Sign in", exact: true}).click();
  await page.waitForFunction(() => window.Homepage.authorSession.isUnlocked());
  await page.locator('.author-workspace [name="title"]').waitFor({state: "visible"});
}
async function connect(page, remember) {
  await nativeTabTo(page, '.author-workspace input[name="token"]');
  await page.keyboard.insertText(token);
  await page.locator('.author-workspace [name="remember"]').setChecked(remember);
  await page.getByRole("button", {name: "Connect GitHub", exact: true}).click();
  await page.waitForFunction(() => window.Homepage.authorSession.isConnected());
}
async function draft(page, name, suffix) {
  const record = {id: name + "-" + suffix, title: "Temporary " + name + " update", date: "2026-10-10",
    excerpt: "Temporary editor fixture.", body: "Updated independent " + name + " content." + markup, author: "Yuhong Li",
    ...(name === "experience" ? {kind: "Seminar", reference: "https://example.org/new-academic-reference"} : {})};
  for (const field of ["id", "title", "date", "excerpt", "body"]) await page.locator('.author-workspace [name="' + field + '"]').fill(record[field]);
  if (name === "experience") {
    await page.locator('.author-workspace [name="kind"]').selectOption(record.kind);
    await page.locator('.author-workspace [name="reference"]').fill(record.reference);
  } else assert.equal(await page.locator('.author-workspace [name="kind"], .author-workspace [name="reference"]').count(), 0);
  return record;
}
async function waitMock(predicate) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 15000) throw new Error("模拟接口等待超时");
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
async function screenshot(page, engine, viewport, name, list) {
  if (engine !== "chromium" || ![1440, 390].includes(viewport.width)) return;
  const relative = "artifacts/screenshots/author-log-" + viewport.width + "-" + name + ".png";
  await page.screenshot({path: path.join(ROOT, relative), animations: "disabled"});
  list.push(relative);
}

async function runViewport(browser, engine, viewport, url) {
  const context = await browser.newContext({viewport, reducedMotion: "reduce", hasTouch: viewport.width < 700, acceptDownloads: true});
  const mock = freshMock();
  await intercept(context, new URL(url).origin, mock);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], steps = [], screenshots = [];
  page.on("pageerror", error => errors.push(error.message));
  async function step(name, callback) {
    try { await callback(); await leaks(page); steps.push({name, status: "通过"}); }
    catch (error) { steps.push({name, status: "失败"}); throw error; }
  }
  try {
    await page.goto(url + collections.experience.route);
    await step("两集合阅读、学术类型与安全参考链接", async () => {
      for (const [name, item] of Object.entries(collections)) {
        await navigate(page, url, item.route);
        await page.locator(item.card).first().waitFor({state: "visible"});
        assert.equal(await page.locator(item.card).count(), fixtures[name].length);
        if (name === "experience") {
          assert.deepEqual((await page.locator(".academic-log__kind").allTextContents()).sort(), ["Research", "Learning", "Seminar", "Milestone"].sort());
          const reference = page.locator(".academic-log__reference").first();
          assert.equal(await reference.getAttribute("href"), fixtures.experience[0].reference);
          assert.equal(await reference.getAttribute("target"), "_blank");
          assert.ok((await reference.getAttribute("rel")).includes("noopener"));
          assert.ok((await reference.getAttribute("rel")).includes("noreferrer"));
          assert.equal(await page.evaluate(record => {
            try { window.Homepage.normalizeAcademicLogs([{...record, reference: "javascript:window.__authorLogExecuted=true"}]); return false; }
            catch { return true; }
          }, fixtures.experience[0]), true);
          await screenshot(page, engine, viewport, "experience-list", screenshots);
        }
        await page.getByRole("button", {name: "Read " + fixtures[name][0].title, exact: true}).click();
        await page.waitForURL(url + item.route + "/" + fixtures[name][0].id);
        assert.equal(await page.locator(item.body).textContent(), fixtures[name][0].body);
        await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), item.title);
        assert.equal(await page.locator(item.body + " script, " + item.body + " img").count(), 0);
        await layout(page);
        await page.reload();
        await page.locator(item.body).waitFor({state: "visible"});
        assert.equal(await page.locator(item.body).textContent(), fixtures[name][0].body);
        await page.locator(item.back).click();
        await page.waitForURL(url + item.route);
        await page.waitForFunction(selector => document.activeElement === document.querySelector(selector + " [data-view-heading]"), item.root);
        await page.goBack();
        await page.waitForURL(url + item.route + "/" + fixtures[name][0].id);
        await page.goForward();
        await page.waitForURL(url + item.route);
      }
      assert.equal(mock.calls.length, 0, "访客阅读触发 GitHub 请求");
    });
    await step("未登录不可编辑及错误密码零 API", async () => {
      for (const name of Object.keys(collections)) {
        await author(page, url, name);
        assert.equal(await page.locator('.author-workspace [name="title"]').count(), 0);
        await nativeTabTo(page, '.author-workspace input[name="author-password"]');
        await page.keyboard.insertText("incorrect-temporary-author-password");
        await page.getByRole("button", {name: "Sign in", exact: true}).click();
        await page.locator(".author-workspace__status").filter({hasText: /password.*incorrect|incorrect.*password/i}).waitFor({state: "visible"});
        assert.deepEqual(await state(page), {unlocked: false, connected: false});
        assert.equal(await page.locator('.author-workspace input[name="author-password"]').inputValue(), "");
      }
      const denied = await page.evaluate(async () => {
        try { await window.Homepage.authorSession.request("/user"); return false; } catch { return true; }
      });
      assert.equal(denied, true);
      assert.equal(mock.calls.length, 0);
    });
    await step("正确密码编辑与未连接下载", async () => {
      await signIn(page);
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      const record = await draft(page, "experience", "download");
      const downloaded = page.waitForEvent("download");
      await page.getByRole("button", {name: "Download update", exact: true}).click();
      const download = await downloaded;
      assert.equal(download.suggestedFilename(), "entries.js");
      const records = parseRecords(await fs.readFile(await download.path(), "utf8"), "experience");
      assert.deepEqual(records.find(entry => entry.id === record.id), record);
      assert.ok(fixtures.experience.every(entry => records.some(next => next.id === entry.id)));
      assert.equal(mock.calls.length, 0);
      await layout(page);
      await screenshot(page, engine, viewport, "experience-editor", screenshots);
    });
    await step("401、非作者、仓库所有者及无推送权限拒绝", async () => {
      for (const changes of [{userStatus: 401}, {login: "another-account"}, {owner: "another-owner"}, {canPush: false}]) {
        Object.assign(mock, {login: "PaulLi07", owner: "PaulLi07", canPush: true, userStatus: 200}, changes);
        const denied = await page.evaluate(async token => {
          try { await window.Homepage.authorSession.connect(token, {remember: false}); return false; } catch { return true; }
        }, token);
        assert.equal(denied, true);
        assert.deepEqual(await state(page), {unlocked: true, connected: false});
        assert.equal(await page.evaluate(() => localStorage.length), 0);
      }
      Object.assign(mock, {login: "PaulLi07", owner: "PaulLi07", canPush: true, userStatus: 200});
    });
    await step("首次连接与跨栏目关闭复用会话", async () => {
      await connect(page, false);
      assert.equal(await page.evaluate(() => localStorage.length), 0, "未选择记住却保存连接");
      const identityReads = mock.calls.filter(call => call.path === "/user" || call.path === REPO).length;
      await author(page, url, "moments");
      assert.equal(await page.locator('.author-workspace input[name="author-password"]').count(), 0);
      assert.deepEqual(await state(page), {unlocked: true, connected: true});
      await page.locator("#close-detail").click();
      await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
      assert.deepEqual(await state(page), {unlocked: true, connected: true});
      await author(page, url, "experience");
      assert.equal(await page.locator('.author-workspace [name="title"]').count(), 1);
      assert.equal(mock.calls.filter(call => call.path === "/user" || call.path === REPO).length, identityReads);
    });
    await step("未记住刷新上锁及主动加密保存连接", async () => {
      await page.reload();
      await page.locator('.author-workspace input[name="author-password"]').waitFor({state: "visible"});
      assert.deepEqual(await state(page), {unlocked: false, connected: false});
      await signIn(page);
      await connect(page, true);
      const saved = await page.evaluate(key => localStorage.getItem(key), VAULT);
      const vault = JSON.parse(saved);
      assert.deepEqual(Object.keys(vault).sort(), ["ciphertext", "iterations", "iv", "salt", "version"]);
      assert.equal(vault.iterations, 600000);
      assert.equal(vault.version, 1);
      assert.ok(vault.ciphertext && vault.iv && vault.salt);
      assert.equal(await page.evaluate(() => localStorage.length), 1);
    });
    await step("Contents 401 保留草稿、清连接并可重连发布", async () => {
      await author(page, url, "moments");
      const record = await draft(page, "moments", "reconnected");
      const puts = mock.puts.length;
      mock.contentsStatus.moments = 401;
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForFunction(() => window.Homepage.authorSession.isUnlocked() && !window.Homepage.authorSession.isConnected());
      await page.locator('.author-workspace input[name="token"]').waitFor({state: "visible"});
      assert.equal(await page.locator('.author-workspace [name="title"]').inputValue(), record.title);
      assert.equal(await page.locator('.author-workspace [name="body"]').inputValue(), record.body);
      assert.equal(mock.puts.length, puts);
      delete mock.contentsStatus.moments;
      await connect(page, true);
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + collections.moments.route + "/" + record.id);
      assert.equal(await page.locator(collections.moments.body).textContent(), record.body);
      assert.equal(mock.puts.at(-1).name, "moments");
    });
    await step("学术编辑器拒绝非 HTTPS 参考且不请求 API", async () => {
      await author(page, url, "experience");
      await draft(page, "experience", "invalid-reference");
      await page.locator('.author-workspace [name="reference"]').fill("javascript:window.__authorLogExecuted=true");
      const calls = mock.calls.length;
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.locator(".author-workspace__status").filter({hasText: "HTTPS"}).waitFor({state: "visible"});
      assert.equal(mock.calls.length, calls);
    });
    for (const name of Object.keys(collections)) {
      await step(name + " 冲突保草稿、最新 SHA 与集合独立发布", async () => {
        await author(page, url, name);
        const record = await draft(page, name, "published");
        const other = name === "moments" ? "experience" : "moments";
        const unrelated = JSON.stringify(mock.records[other]);
        const putCount = mock.puts.length;
        mock.mode = "conflict";
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
        await waitMock(() => mock.puts.length === putCount + 1);
        await page.locator(".author-workspace__status").filter({hasText: "Nothing was overwritten"}).waitFor({state: "visible"});
        assert.equal(await page.locator('.author-workspace [name="body"]').inputValue(), record.body);
        assert.equal(JSON.stringify(mock.records[other]), unrelated);
        const conflictSHA = mock.puts.at(-1).sha;
        mock.records[name].push({...fixtures[name][0], id: name + "-concurrent", title: "A concurrent temporary record"});
        mock.mode = "success";
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
        await page.waitForURL(url + collections[name].route + "/" + record.id);
        await page.locator(collections[name].body).waitFor({state: "visible"});
        assert.equal(await page.locator(collections[name].body).textContent(), record.body);
        assert.notEqual(mock.puts.at(-1).sha, conflictSHA);
        assert.equal(mock.puts.at(-1).name, name);
        assert.ok(mock.puts.at(-1).ids.includes(name + "-concurrent"));
        assert.equal(JSON.stringify(mock.records[other]), unrelated);
      });
    }
    await step("远端登记只解析 JSON 不执行及请求范围限制", async () => {
      for (const name of Object.keys(collections)) {
        await author(page, url, name);
        await draft(page, name, "unsafe-remote");
        const count = mock.puts.length;
        mock.raw[name] = "window.Homepage." + collections[name].registration + "((window.__authorLogExecuted = true, []));\n";
        const reads = mock.reads.length;
        await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
        await waitMock(() => mock.reads.length > reads);
        await page.waitForFunction(() => Array.from(document.querySelectorAll(".author-workspace button"))
          .find(button => button.textContent === "Publish to GitHub")?.disabled === false);
        assert.equal(mock.puts.length, count);
        assert.equal(await page.evaluate(() => Boolean(window.__authorLogExecuted)), false);
        delete mock.raw[name];
      }
      const before = mock.calls.length;
      const blocked = await page.evaluate(async ({repo, file}) => {
        const session = window.Homepage.authorSession;
        const requests = [() => session.request("https://example.org/"), () => session.request(repo + "/contents/other.js"),
          () => session.request(file + "?ref=other"), () => session.request(file, {method: "DELETE"}),
          () => session.request(file, {method: "PUT", body: {message: "Temporary", branch: "other", sha: "current", content: "W10="}})];
        return Promise.all(requests.map(async run => { try { await run(); return false; } catch { return true; } }));
      }, {repo: REPO, file: fileAPI("moments")});
      assert.ok(blocked.every(Boolean));
      assert.equal(mock.calls.length, before);
    });
    await step("Sign out 同时锁定两处并保留加密连接", async () => {
      await page.getByRole("button", {name: "Sign out", exact: true}).click();
      await page.locator('.author-workspace input[name="author-password"]').waitFor({state: "visible"});
      assert.deepEqual(await state(page), {unlocked: false, connected: false});
      assert.equal(await page.locator('.author-workspace [name="title"]').count(), 0);
      await author(page, url, "moments");
      assert.equal(await page.locator('.author-workspace [name="title"]').count(), 0);
      await author(page, url, "experience");
      assert.equal(await page.locator('.author-workspace [name="title"]').count(), 0);
      assert.equal(await page.evaluate(key => Boolean(localStorage.getItem(key)), VAULT), true);
    });
    await step("缓存刷新必须密码恢复并重新 GET 身份权限", async () => {
      const before = mock.calls.length;
      await page.reload();
      await page.locator('.author-workspace input[name="author-password"]').waitFor({state: "visible"});
      assert.deepEqual(await state(page), {unlocked: false, connected: false});
      assert.equal(mock.calls.length, before, "刷新在密码前自动使用缓存令牌");
      await page.locator('.author-workspace input[name="author-password"]').fill("incorrect-temporary-author-password");
      await page.getByRole("button", {name: "Sign in", exact: true}).click();
      await page.locator(".author-workspace__status").filter({hasText: /password.*incorrect|incorrect.*password/i}).waitFor({state: "visible"});
      assert.equal(mock.calls.length, before);
      await signIn(page);
      await page.waitForFunction(() => window.Homepage.authorSession.isConnected());
      assert.ok(mock.calls.slice(before).some(call => call.path === "/user"));
      assert.ok(mock.calls.slice(before).some(call => call.path === REPO));
      assert.equal(await page.locator('.author-workspace input[name="token"]').isVisible(), false, "密码恢复后仍要求再次输入令牌");
    });
    await step("已连接 Forget 立即移除缓存与授权", async () => {
      const saved = await page.evaluate(key => localStorage.getItem(key), VAULT);
      await page.getByRole("button", {name: "Forget saved connection", exact: true}).click();
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      assert.equal(await page.evaluate(() => localStorage.length), 0);
      await connect(page, true);
      assert.deepEqual(await state(page), {unlocked: true, connected: true});
      assert.notEqual(await page.evaluate(key => localStorage.getItem(key), VAULT), saved, "重新保存复用了旧密文盐或 IV");
    });
    await step("缓存恢复身份变化拒绝连接", async () => {
      mock.login = "another-account";
      await page.reload();
      await page.locator('.author-workspace input[name="author-password"]').waitFor({state: "visible"});
      await signIn(page);
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      await page.locator('.author-workspace input[name="token"]').waitFor({state: "visible"});
      mock.login = "PaulLi07";
    });
    await step("篡改密文拒绝恢复且 Forget 清缓存与连接", async () => {
      await page.evaluate(key => {
        const payload = JSON.parse(localStorage.getItem(key));
        const bytes = Uint8Array.from(atob(payload.ciphertext), character => character.charCodeAt(0));
        bytes[0] ^= 1;
        payload.ciphertext = btoa(String.fromCharCode(...bytes));
        localStorage.setItem(key, JSON.stringify(payload));
      }, VAULT);
      const before = mock.calls.length;
      await page.reload();
      await page.locator('.author-workspace input[name="author-password"]').waitFor({state: "visible"});
      await signIn(page);
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      assert.equal(mock.calls.length, before, "篡改密文被解开并发送 GitHub 请求");
      await page.getByRole("button", {name: "Forget saved connection", exact: true}).click();
      assert.equal(await page.evaluate(() => localStorage.length), 0);
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      await author(page, url, "moments");
      assert.deepEqual(await state(page), {unlocked: true, connected: false});
      await page.getByRole("button", {name: "Sign out", exact: true}).click();
      assert.deepEqual(await state(page), {unlocked: false, connected: false});
      await layout(page);
    });
    assert.deepEqual(mock.errors, []);
    assert.deepEqual(mock.blocked, [], "出现未预期外部请求，已全部阻断");
    assert.deepEqual(errors, []);
    return {viewport, status: "通过", steps, screenshots,
      api: {userRequests: mock.calls.filter(call => call.path === "/user").length,
        repositoryPermissionRequests: mock.calls.filter(call => call.path === REPO).length,
        freshReads: mock.reads, mockedPuts: mock.puts, realWrites: 0}};
  } catch (error) {
    return {viewport, status: "失败", steps, screenshots,
      error: String(error.stack || error).replaceAll(password, "[测试密码]").replaceAll(token, "[测试令牌]"),
      mockErrors: mock.errors, blockedRequests: mock.blocked, pageErrors: errors};
  } finally { await context.close(); }
}

async function runEngine(engine, url) {
  let browser;
  try {
    browser = await playwright[engine].launch({headless: true});
    const results = [];
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, engine, viewport, url));
      console.log(engine + " " + viewport.width + "×" + viewport.height + "：" + results.at(-1).status + "。");
    }
    return {engine, version: browser.version(), results};
  } catch (error) { return {engine, status: "未完成", error: String(error.message)}; }
  finally { if (browser) await browser.close(); }
}

(async () => {
  const protectedFiles = ["modules/author/config.js", ...Object.values(collections).map(item => item.file)];
  const originals = await Promise.all(protectedFiles.map(file => fs.readFile(path.join(ROOT, file))));
  await fs.mkdir(path.join(ROOT, "artifacts/screenshots"), {recursive: true});
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = "http://127.0.0.1:" + server.address().port + PREFIX;
    const browsers = await Promise.all(ENGINES.map(engine => runEngine(engine, url)));
    const sourceUnchanged = (await Promise.all(protectedFiles.map(file => fs.readFile(path.join(ROOT, file)))))
      .every((value, index) => value.equals(originals[index]));
    const passed = sourceUnchanged && browsers.every(browser => browser.results?.length === VIEWPORTS.length
      && browser.results.every(result => result.status === "通过"));
    const report = {date: new Date().toISOString(), prefix: PREFIX, passed, sourceUnchanged, browsers,
      limits: ["密码、令牌、文章与 GitHub 响应均为临时夹具；所有 GitHub 请求拦截，真实远端写入为 0。",
        "测试配置与数据只替换 HTTP 响应，不修改正式文件；报告不包含明文凭据。",
        "三内核与模拟视口不等于品牌版本、手机真机或线上部署实测。",
        "DOM / 存储断言不能证明浏览器堆内存或密码管理器的物理清除。"]};
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");
    console.log("统一作者与学术日志测试" + (passed ? "全部通过" : "存在失败") + "；报告：artifacts/author-log-results.json。");
    if (!passed) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => {
  console.error(String(error.message).replaceAll(password, "[测试密码]").replaceAll(token, "[测试令牌]"));
  process.exitCode = 1;
});
