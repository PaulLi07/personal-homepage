/* 可选的真实页面功能测试：所有文章、口令和令牌均为临时测试数据，网络写入完全拦截。 */
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { encryptContent, registration } = require("./relationship.cjs");
const ROOT = path.resolve(__dirname, "..");
const PREFIX = "/personal-homepage/";
const REPORT = path.join(ROOT, "artifacts/feature-results.json");
const SCREENSHOTS = path.join(ROOT, "artifacts/screenshots");
const ENGINES = ["chromium", "firefox", "webkit"];
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 780 }];
const FILE_API = "/repos/PaulLi07/personal-homepage/contents/modules/life/moments/posts.js";
const password = crypto.randomBytes(32).toString("base64url");
const testToken = "feature-test-only-" + crypto.randomBytes(24).toString("hex");
const privateFixture = {
  title: "Private integration fixture",
  body: "Temporary encrypted integration data.\n<script>window.__privateFixtureExecuted = true</script>"
};
const fixtures = [
  { id: "feature-reading", title: "Integration test article", date: "2026-10-09",
    excerpt: "Temporary data for reader behaviour.",
    body: "First line.\n\n<script>window.__blogFixtureExecuted = true</script>\n<img src=x onerror=\"window.__blogFixtureExecuted=true\">",
    author: "Yuhong Li" },
  { id: "feature-newer", title: "Newer integration article", date: "2026-10-10",
    excerpt: "Temporary data for date ordering.", body: "A temporary second article.\nLine breaks stay visible.", author: "Yuhong Li" }
];
const blogSource = posts => "window.Homepage.registerBlogPosts(" + JSON.stringify(posts) + ");\n";
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json" };
let playwright;
try { playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright"); }
catch {
  console.error("未找到 Playwright。请使用维护环境已有的工具和浏览器，或通过 HOMEPAGE_PLAYWRIGHT_MODULE 指定模块路径。");
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(PREFIX)) throw new Error("Invalid prefix");
    const relative = pathname.slice(PREFIX.length) || "index.html";
    if (relative.split("/").some(part => part === ".git" || part === ".private")) throw new Error("Invalid path");
    const file = await fs.realpath(path.resolve(ROOT, relative));
    if (!file.startsWith(ROOT + path.sep) || !mime[path.extname(file)]) throw new Error("Invalid file");
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] + "; charset=utf-8", "Cache-Control": "no-store" });
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

async function waitText(page, selector, fragment) {
  await page.waitForFunction(({selector, fragment}) => document.querySelector(selector)?.textContent.includes(fragment), {selector, fragment});
}

async function assertLayout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "页面水平溢出");
  assert.equal(await page.locator("#detail-dialog").evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "详情水平溢出");
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)), false, "网页呈现中文");
}

async function assertNoLeaks(page, { locked = false } = {}) {
  const checks = await page.evaluate(({password, testToken, privateFixture, locked}) => {
    const values = [...Object.values(localStorage), ...Object.values(sessionStorage)];
    const persisted = values.join("\n") + document.cookie + JSON.stringify(history.state) + location.href;
    const text = document.body.textContent;
    return {
      emptyStorage: localStorage.length === 0 && sessionStorage.length === 0,
      credentialsAbsent: !persisted.includes(password) && !persisted.includes(testToken),
      privateAbsent: !locked || (!text.includes(privateFixture.title) && !text.includes(privateFixture.body)),
      noExecutedMarkup: !window.__blogFixtureExecuted && !window.__privateFixtureExecuted
    };
  }, { password, testToken, privateFixture, locked });
  assert.equal(checks.emptyStorage, true, "新增功能写入浏览器持久存储");
  assert.equal(checks.credentialsAbsent, true, "测试凭据被持久化或进入路由");
  assert.equal(checks.privateAbsent, true, "锁定后仍有私密正文 DOM");
  assert.equal(checks.noExecutedMarkup, true, "正文标签被执行");
}

async function nativeTabTo(page, selector) {
  await page.locator("#close-detail").focus();
  for (let count = 0; count < 40; count += 1) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("原生 Tab 无法到达输入框：" + selector);
}

function freshMock() {
  return { login: "another-account", canPush: true, mode: "conflict", reads: [], puts: [], calls: [],
    errors: [], blocked: [], remotePosts: fixtures.map(post => ({...post, unknownMetadata: "discard-this-remote-field"})), shaCounter: 0 };
}

async function intercept(context, origin, encryptedSource, mock) {
  // 单个兜底路由允许本地资源；所有远端请求都被模拟或阻断，不允许真实 GitHub 写入。
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === PREFIX + "modules/life/moments/posts.js") {
      return route.fulfill({ contentType: "text/javascript", body: blogSource(fixtures) });
    }
    if (url.origin === origin && url.pathname === PREFIX + "modules/life/relationship/encrypted.js") {
      return route.fulfill({ contentType: "text/javascript", body: encryptedSource });
    }
    if (url.origin === origin && url.pathname.startsWith(PREFIX)) return route.continue();
    if (url.origin !== "https://api.github.com") {
      mock.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
      return route.abort();
    }
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-GitHub-Api-Version", "Content-Type": "application/json" };
    const respond = (body, status = 200) => route.fulfill({status, headers, body: JSON.stringify(body)});
    if (request.method() === "OPTIONS") return route.fulfill({status: 204, headers});
    try {
      assert.equal(request.headers().authorization, "Bearer " + testToken, "GitHub 请求缺少测试授权头");
      mock.calls.push({ method: request.method(), path: url.pathname });
      if (request.method() === "GET" && url.pathname === "/user") return respond({ login: mock.login });
      if (request.method() === "GET" && url.pathname === "/repos/PaulLi07/personal-homepage") {
        return respond({ owner: { login: "PaulLi07" }, permissions: { push: mock.canPush } });
      }
      if (request.method() === "GET" && url.pathname === FILE_API) {
        assert.equal(url.searchParams.get("ref"), "main", "未从 main 读取博客最新内容");
        const source = blogSource(mock.remotePosts);
        const sha = "fresh-feature-sha-" + (++mock.shaCounter);
        mock.reads.push(sha);
        return respond({ type: "file", encoding: "base64", sha, size: Buffer.byteLength(source), content: Buffer.from(source).toString("base64") });
      }
      if (request.method() === "PUT" && url.pathname === FILE_API) {
        const body = request.postDataJSON();
        assert.equal(body.branch, "main", "发布分支不是 main");
        assert.equal(body.sha, mock.reads.at(-1), "PUT 没有使用本次读取的新鲜 SHA");
        assert.equal(typeof body.message, "string");
        assert.equal(typeof body.content, "string");
        const source = Buffer.from(body.content, "base64").toString("utf8");
        const match = source.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)?window\.Homepage\.registerBlogPosts\(\s*([\s\S]*)\s*\);?\s*$/);
        assert.ok(match, "PUT 内容不是可解析的博客注册数据");
        const posts = JSON.parse(match[1]);
        assert.equal(posts.length, fixtures.length + 1, "发布丢失已有文章或重复新增文章");
        for (const fixture of fixtures) assert.deepEqual(posts.find(post => post.id === fixture.id), fixture, "已有文章被覆盖或远端未知字段没有剥除");
        assert.equal(posts.some(post => Object.hasOwn(post, "unknownMetadata")), false, "远端未知字段进入下一次发布");
        const post = posts.find(post => !fixtures.some(fixture => fixture.id === post.id));
        assert.equal(post.author, "Yuhong Li");
        assert.equal(post.body, "A temporary publication fixture.\n<script>window.__blogFixtureExecuted=true</script>");
        mock.puts.push({ branch: body.branch, sha: body.sha, postIds: posts.map(post => post.id), result: mock.mode });
        if (mock.mode === "conflict") return respond({message: "Simulated SHA conflict"}, 409);
        mock.remotePosts = posts;
        return respond({ commit: { sha: "feature-test-published-commit" } }, 201);
      }
      throw new Error("未预期的 GitHub 请求：" + request.method() + " " + url.pathname);
    } catch (error) {
      mock.errors.push(error.message.replaceAll(testToken, "[测试令牌]"));
      return respond({message: "Feature mock validation failed"}, 500);
    }
  });
}

async function runViewport(browser, engine, viewport, url, encryptedSource) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", hasTouch: viewport.width < 700 });
  const mock = freshMock();
  await intercept(context, new URL(url).origin, encryptedSource, mock);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  const errors = [];
  const steps = [];
  const screenshots = [];
  page.on("pageerror", error => errors.push(error.message));
  async function step(name, callback) {
    try { await callback(); steps.push({name, status: "通过"}); }
    catch (error) { steps.push({name, status: "失败"}); throw error; }
  }
  async function screenshot(name) {
    if (engine !== "chromium" || ![1440, 390].includes(viewport.width)) return;
    await page.locator("#detail-dialog").evaluate(dialog => { dialog.scrollTop = 0; });
    const filename = `features-${engine}-${viewport.width}-${name}.png`;
    await page.screenshot({path: path.join(SCREENSHOTS, filename), animations: "disabled"});
    screenshots.push("artifacts/screenshots/" + filename);
  }
  async function authorSignIn() {
    await nativeTabTo(page, '.moments-author input[name="token"]');
    await page.keyboard.insertText(testToken);
    await page.getByRole("button", {name: "Verify author", exact: true}).click();
  }
  async function unlock() {
    await nativeTabTo(page, 'input[name="relationship-password"]');
    await page.keyboard.insertText(password);
    await page.getByRole("button", {name: "Unlock", exact: true}).click();
    await page.locator(".relationship-body").waitFor({state: "visible"});
    assert.equal(await page.locator(".relationship-body").textContent(), privateFixture.body);
    assert.equal(await page.locator(".relationship-security script, .relationship-security img").count(), 0);
    await assertNoLeaks(page);
  }
  try {
    await step("博客列表、阅读、纯文本和返回", async () => {
      await page.goto(url + "#life/moments");
      await page.locator(".moments-blog__card").first().waitFor({state: "visible"});
      assert.equal(await page.locator(".moments-blog__card").count(), 2);
      assert.equal(await page.locator(".moments-blog__card h4").first().textContent(), fixtures[1].title);
      await assertLayout(page);
      await screenshot("blog-list");
      await page.getByRole("button", {name: "Read " + fixtures[0].title, exact: true}).click();
      await page.waitForURL(url + "#life/moments/" + fixtures[0].id);
      assert.equal(await page.locator(".moments-blog__body").textContent(), fixtures[0].body);
      assert.equal(await page.locator(".moments-blog__title").evaluate(node => document.activeElement === node), true, "文章打开后焦点没有到正文标题");
      assert.equal(await page.locator(".moments-blog__body script, .moments-blog__body img").count(), 0);
      await assertNoLeaks(page);
      await assertLayout(page);
      await screenshot("blog-article");
      await page.locator(".moments-blog__back").click();
      await page.waitForURL(url + "#life/moments");
      assert.equal(await page.locator(".moments-blog__card").count(), 2);
      assert.equal(await page.locator(".moments-blog [data-view-heading]").evaluate(node => document.activeElement === node), true, "返回列表后焦点未恢复到列表标题");
    });
    await step("文章直达、刷新、历史和未找到", async () => {
      await page.goto(url + "#life/moments/" + fixtures[0].id);
      await page.locator(".moments-blog__body").waitFor({state: "visible"});
      await page.reload();
      assert.equal(await page.locator(".moments-blog__body").textContent(), fixtures[0].body);
      await page.locator(".moments-blog__back").click();
      await page.waitForURL(url + "#life/moments");
      await page.goBack();
      await page.waitForURL(url + "#life/moments/" + fixtures[0].id);
      assert.equal(await page.locator(".moments-blog__body").textContent(), fixtures[0].body);
      await page.goForward();
      await page.waitForURL(url + "#life/moments");
      await page.goto(url + "#life/moments/missing-feature-post");
      await waitText(page, ".moments-blog__state", "Post not found");
      await page.locator(".moments-blog__back").click();
      await page.waitForURL(url + "#life/moments");
    });
    await step("非作者与无推送权限账号拒绝", async () => {
      await page.locator("[data-blog-author]").click();
      await page.waitForURL(url + "#life/moments/author");
      await page.getByRole("button", {name: "Verify author", exact: true}).click();
      await waitText(page, ".moments-author__status", "Enter your GitHub token");
      assert.equal(mock.calls.length, 0, "空令牌发送了 API 请求");
      await authorSignIn();
      await waitText(page, ".moments-author__status", "Access is limited to PaulLi07");
      assert.equal(await page.locator('.moments-author input[name="token"]').inputValue(), "");
      assert.equal(await page.locator('.moments-author input[name="title"]').count(), 0);
      assert.equal(mock.calls.some(call => call.path === "/repos/PaulLi07/personal-homepage"), false);
      await assertNoLeaks(page);
      mock.login = "PaulLi07";
      mock.canPush = false;
      await authorSignIn();
      await waitText(page, ".moments-author__status", "cannot publish");
      assert.equal(await page.locator('.moments-author input[name="title"]').count(), 0);
      assert.equal(mock.reads.length, 0);
      assert.equal(mock.puts.length, 0);
    });
    await step("作者验证、冲突不覆盖和草稿保留", async () => {
      mock.canPush = true;
      await authorSignIn();
      await page.locator('.moments-author input[name="title"]').waitFor({state: "visible"});
      assert.equal(mock.reads.length, 1);
      assert.equal(await page.locator(".moments-author [data-view-heading]").evaluate(node => document.activeElement === node), true, "作者验证后标题未获得焦点");
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await waitText(page, ".moments-author__status", "Invalid or duplicate post address");
      assert.equal(mock.reads.length, 1, "无效草稿发送了发布读取请求");
      await page.locator('.moments-author input[name="title"]').fill("Publishing fixture");
      await page.locator('.moments-author input[name="id"]').fill("feature-published-" + viewport.width);
      await page.locator('.moments-author input[name="date"]').fill("2026-10-10");
      await page.locator('.moments-author textarea[name="excerpt"]').fill("A temporary publication check.");
      await page.locator('.moments-author textarea[name="body"]').fill("A temporary publication fixture.\n<script>window.__blogFixtureExecuted=true</script>");
      await assertLayout(page);
      await screenshot("author-editor");
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await waitText(page, ".moments-author__status", "Nothing was overwritten");
      assert.equal(mock.reads.length, 2);
      assert.equal(mock.puts.length, 1);
      assert.equal(mock.remotePosts.length, fixtures.length);
      assert.equal(await page.locator('.moments-author input[name="title"]').inputValue(), "Publishing fixture");
      assert.equal(await page.locator('.moments-author textarea[name="body"]').inputValue(), "A temporary publication fixture.\n<script>window.__blogFixtureExecuted=true</script>");
      await assertNoLeaks(page);
    });
    await step("发布重新读取 SHA、保留文章并展示新正文", async () => {
      mock.mode = "success";
      await page.getByRole("button", {name: "Publish to GitHub", exact: true}).click();
      await page.waitForURL(url + "#life/moments/feature-published-" + viewport.width);
      assert.equal(await page.locator(".moments-blog__title").textContent(), "Publishing fixture");
      assert.equal(mock.reads.length, 3);
      assert.equal(mock.puts.length, 2);
      assert.notEqual(mock.puts[0].sha, mock.puts[1].sha);
      assert.equal(mock.remotePosts.length, fixtures.length + 1);
      assert.equal(await page.locator(".moments-author").count(), 0);
      assert.equal(await page.locator(".moments-blog__body script").count(), 0);
      await assertNoLeaks(page);
    });
    await step("作者切栏目与关闭清除视图和凭据", async () => {
      await page.locator("[data-blog-author]").click();
      await authorSignIn();
      await page.locator('.moments-author input[name="title"]').waitFor({state: "visible"});
      await page.getByRole("button", {name: "Sign out", exact: true}).click();
      assert.equal(await page.locator(".moments-author [data-view-heading]").evaluate(node => document.activeElement === node), true, "Sign out 后作者标题未获得焦点");
      assert.equal(await page.locator('.moments-author input[name="token"]').inputValue(), "");
      const previous = await page.locator(".moments-author").elementHandle();
      await page.locator('.moments-author input[name="token"]').fill(testToken);
      await page.locator("#detail-tabs").getByRole("button", {name: "Travels", exact: true}).click();
      assert.equal(await previous.evaluate(node => !node.isConnected && node.childElementCount === 0), true);
      await page.locator("#detail-tabs").getByRole("button", {name: "Moments", exact: true}).click();
      await page.locator("[data-blog-author]").click();
      assert.equal(await page.locator('.moments-author input[name="token"]').inputValue(), "");
      const closing = await page.locator(".moments-author").elementHandle();
      await page.locator('.moments-author input[name="token"]').fill(testToken);
      await page.locator("#close-detail").click();
      assert.equal(await closing.evaluate(node => !node.isConnected && node.childElementCount === 0), true);
      assert.equal(await page.locator(".moments-author").count(), 0);
      await page.locator('[data-life="moments"]').click();
      await page.locator("[data-blog-author]").click();
      assert.equal(await page.locator('.moments-author input[name="token"]').inputValue(), "");
      await assertNoLeaks(page);
    });
    await step("关系内容锁定、错误口令及正确解密", async () => {
      await page.locator("#detail-tabs").getByRole("button", {name: "Relationship", exact: true}).click();
      await page.locator('input[name="relationship-password"]').waitFor({state: "visible"});
      await assertNoLeaks(page, {locked: true});
      await assertLayout(page);
      await screenshot("relationship-locked");
      await page.getByRole("button", {name: "Unlock", exact: true}).click();
      await waitText(page, ".relationship-status", "Enter a password to continue");
      await nativeTabTo(page, 'input[name="relationship-password"]');
      await page.keyboard.insertText("incorrect-feature-password");
      await page.getByRole("button", {name: "Unlock", exact: true}).click();
      await waitText(page, ".relationship-status", "Unable to unlock");
      assert.equal(await page.locator('input[name="relationship-password"]').inputValue(), "");
      assert.equal(await page.locator('input[name="relationship-password"]').getAttribute("aria-invalid"), "true");
      await assertNoLeaks(page, {locked: true});
      await unlock();
      await assertLayout(page);
    });
    await step("主动锁定、切栏目重入和关闭重开均重新上锁", async () => {
      await page.getByRole("button", {name: "Lock this section", exact: true}).click();
      await page.locator('input[name="relationship-password"]').waitFor({state: "visible"});
      await assertNoLeaks(page, {locked: true});
      await unlock();
      await page.locator("#detail-tabs").getByRole("button", {name: "Travels", exact: true}).click();
      await assertNoLeaks(page, {locked: true});
      await page.locator("#detail-tabs").getByRole("button", {name: "Relationship", exact: true}).click();
      assert.equal(await page.locator('input[name="relationship-password"]').inputValue(), "");
      await assertNoLeaks(page, {locked: true});
      await unlock();
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
      await assertNoLeaks(page, {locked: true});
      await page.locator('[data-life="relationship"]').click();
      assert.equal(await page.locator('input[name="relationship-password"]').inputValue(), "");
      await assertNoLeaks(page, {locked: true});
      await assertLayout(page);
    });
    await step("页面手动滚动打开与关闭恢复位置", async () => {
      await page.locator("#close-detail").click();
      await page.goto(url + "#home");
      await page.evaluate(() => window.scrollTo({top: document.querySelector("#life").offsetTop + 125, behavior: "instant"}));
      await page.waitForTimeout(50);
      const position = await page.evaluate(() => ({x: scrollX, y: scrollY}));
      await page.locator('[data-life="moments"]').click();
      await page.locator(".moments-blog").waitFor({state: "visible"});
      await page.locator("#close-detail").click();
      await page.waitForFunction(position => Math.abs(scrollX - position.x) <= 1 && Math.abs(scrollY - position.y) <= 1, position);
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-life="moments"]'));
      await assertNoLeaks(page, {locked: true});
    });
    assert.deepEqual(mock.errors, [], "GitHub 模拟接口校验失败");
    assert.deepEqual(mock.blocked, [], "页面触发未预期外部请求，已阻断");
    assert.deepEqual(errors, [], "页面脚本异常");
    return { viewport, status: "通过", steps, screenshots, api: { userRequests: mock.calls.filter(call => call.path === "/user").length,
      repositoryPermissionRequests: mock.calls.filter(call => call.path === "/repos/PaulLi07/personal-homepage").length,
      freshReads: mock.reads.length, mockedPuts: mock.puts.length, realWrites: 0 } };
  } catch (error) {
    return { viewport, status: "失败", steps, screenshots,
      error: String(error.stack || error).replaceAll(password, "[测试口令]").replaceAll(testToken, "[测试令牌]"),
      mockErrors: mock.errors, blockedRequests: mock.blocked, pageErrors: errors };
  } finally { await context.close(); }
}

async function runEngine(engine, url, encryptedSource) {
  let browser;
  try {
    browser = await playwright[engine].launch({headless: true});
    const results = [];
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, engine, viewport, url, encryptedSource));
      console.log(`${engine} ${viewport.width}×${viewport.height}：${results.at(-1).status}。`);
    }
    return { engine, version: browser.version(), results };
  } catch (error) {
    return {engine, status: "未完成", error: String(error.message)};
  } finally { if (browser) await browser.close(); }
}

(async () => {
  await fs.mkdir(SCREENSHOTS, {recursive: true});
  const encryptedSource = registration(await encryptContent(privateFixture, password));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}${PREFIX}`;
    const browsers = await Promise.all(ENGINES.map(engine => runEngine(engine, url, encryptedSource)));
    const passed = browsers.every(browser => browser.results?.length === VIEWPORTS.length && browser.results.every(result => result.status === "通过"));
    const report = { date: new Date().toISOString(), prefix: PREFIX, passed, browsers,
      limits: ["文章、口令、令牌和 GitHub API 响应均为临时测试数据，未发布真实文章或执行远端写入。",
        "浏览器测试内核与模拟视口不等于品牌浏览器各版本或手机真机。",
        "存储与 DOM 清除断言不能证明浏览器堆内存或密码管理器中的物理清除。"] };
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");
    console.log(`功能集成测试${passed ? "全部通过" : "存在失败"}；报告：artifacts/feature-results.json。`);
    if (!passed) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
