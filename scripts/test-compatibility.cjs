/* 实测公开行为；测试工具为可选维护依赖，不参与网站运行。 */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
let playwright;
try {
  playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright");
} catch {
  console.error("未找到 Playwright。请在维护环境安装它及测试浏览器，或通过 HOMEPAGE_PLAYWRIGHT_MODULE 指定模块路径。");
  process.exit(1);
}
const engines = ["chromium", "firefox", "webkit"];
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 780 }];
const routes = {
  academic: { experience: "Experience.", publications: "Publications.", notes: "Notes.", projects: "Projects." },
  life: { moments: "Moments.", travels: "Travels.", creations: "Creations.", relationship: "Relationship." }
};
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".json": "application/json" };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith("/personal-homepage/")) throw new Error("Invalid prefix");
    const relative = pathname.slice("/personal-homepage/".length) || "index.html";
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || relative.split("/").includes(".git")) throw new Error("Invalid path");
    const data = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": (mime[path.extname(file)] || "application/octet-stream") + "; charset=utf-8" });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

async function assertOpen(page, title) {
  await page.waitForFunction(() => document.getElementById("detail-dialog").open);
  assert.equal(await page.locator("#detail-title").textContent(), title);
  await page.waitForFunction(() => {
    const image = document.getElementById("detail-image");
    return image.complete && image.naturalWidth > 0;
  });
  assert.equal(await page.locator("#detail-image").evaluate(image => image.complete && image.naturalWidth > 0), true);
  if (title === "Moments.") {
    assert.equal(await page.locator('.moments-blog[data-blog-view="list"]').count(), 1);
    assert.equal(await page.getByText("No posts yet", {exact: true}).isVisible(), true);
  } else if (title === "Relationship.") {
    assert.equal(await page.getByText("Not configured yet.", {exact: true}).isVisible(), true);
  } else assert.equal(await page.locator("#detail-entries .empty-state").count(), 1);
}

async function assertLayout(page) {
  // 实际滚动触发原有懒加载，不把懒加载图片误判为未完成请求。
  const sections = await page.locator("main section[id]").all();
  for (const section of sections) await section.scrollIntoViewIfNeeded();
  if (sections.length) await sections[0].scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Array.from(document.images)
    .filter(image => image.getAttribute("src") && image.getAttribute("aria-hidden") !== "true" && !image.closest("dialog:not([open])"))
    .every(image => image.complete));
  assert.deepEqual(await page.evaluate(() => Array.from(document.images)
    .filter(image => image.getAttribute("src") && image.getAttribute("aria-hidden") !== "true" && !image.closest("dialog:not([open])") && !image.naturalWidth)
    .map(image => image.getAttribute("src"))), [], "图片加载失败");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, "页面水平溢出");
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)), false, "网页呈现中文");
}

async function runViewport(browser, engine, viewport, url) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", hasTouch: viewport.width < 700 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) errors.push(response.status() + " " + response.url()); });
  await page.goto(url);
  await assertLayout(page);
  assert.equal(await page.locator("#current-year").textContent(), String(new Date().getFullYear()));
  assert.equal(await page.locator('a[href="mailto:2310408@mail.nankai.edu.cn"]').count() >= 2, true);
  assert.equal(await page.locator(".loader").count(), 0, "减少动态效果时仍有加载动画");
  for (const id of ["about", "academic", "life", "contact"]) {
    await page.locator('.name[href="#home"]').click();
    await page.locator(`.navlinks a[href="#${id}"]`).click();
    await page.waitForURL("**/#" + id);
    await page.waitForFunction(id => document.querySelector(`.navlinks a[href="#${id}"]`).getAttribute("aria-current") === "location", id);
  }
  for (const id of ["about", "academic"]) {
    await page.locator('.name[href="#home"]').click();
    await page.locator(`#home .buttons a[href="#${id}"]`).click();
    await page.waitForURL("**/#" + id);
  }
  for (const id of ["home", "about", "academic", "life", "contact"]) {
    await page.locator("#" + id).scrollIntoViewIfNeeded();
    assert.equal(await page.locator("#" + id).isVisible(), true);
  }
  await page.locator('[data-academic="notes"]').focus();
  assert.equal(await page.locator("#preview-label").textContent(), "Notes");
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-preview="notes"]');
    return image.complete && image.naturalWidth > 0;
  });
  if (viewport.width > 700) {
    await page.locator('[data-academic="projects"]').hover();
    assert.equal(await page.locator("#preview-label").textContent(), "Projects");
  }
  for (const [group, items] of Object.entries(routes)) {
    for (const [key, title] of Object.entries(items)) {
      const button = page.locator(`[data-${group}="${key}"]`);
      if (viewport.width < 700 && engine !== "firefox") await button.tap();
      else await button.click();
      await assertOpen(page, title);
      assert.equal(new URL(page.url()).hash, `#${group}/${key}`);
      assert.equal(await page.locator("#detail-dialog").evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth + 1), true, "弹窗水平溢出");
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
      await page.waitForFunction(() => !location.hash.includes("/"));
      await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), `[data-${group}="${key}"]`);
      assert.equal(await button.evaluate(node => document.activeElement === node), true, "关闭后焦点未恢复");
    }
  }
  const experience = page.locator('[data-academic="experience"]');
  await experience.focus();
  await page.keyboard.press("Enter");
  await assertOpen(page, "Experience.");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator("#detail-dialog").evaluate(dialog => dialog.contains(document.activeElement)), true, "焦点离开模态区域");
  await page.locator("#close-detail").focus();
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.locator("#detail-dialog").evaluate(dialog => dialog.contains(document.activeElement)), true, "反向 Tab 焦点离开模态区域");
  await page.locator("#detail-tabs button", { hasText: "Publications" }).click();
  await assertOpen(page, "Publications.");
  assert.equal(await page.locator("#detail-tabs").getAttribute("aria-label"), "Academic sections");
  assert.equal(await page.locator("#preview-label").textContent(), "Publications");
  await page.goBack();
  await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
  await page.goForward();
  await assertOpen(page, "Publications.");
  await page.locator("#close-detail").click();
  await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
  await page.waitForFunction(() => !location.hash.includes("/"));
  for (const [group, items] of Object.entries(routes)) {
    for (const [key, title] of Object.entries(items)) {
      await page.goto(url + `#${group}/${key}`);
      await assertOpen(page, title);
      await page.reload();
      await assertOpen(page, title);
      await page.locator("#close-detail").click();
      await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
      assert.equal(new URL(page.url()).hash, "#" + group);
    }
  }
  await page.goto(url + "#academic/missing");
  assert.equal(await page.locator("#detail-dialog").evaluate(dialog => dialog.open), false);
  for (const [oldRoute, newRoute, title] of [
    ["academic/research", "academic/experience", "Experience."],
    ["life/places", "life/travels", "Travels."],
    ["life/notes", "life/creations", "Creations."],
    ["life/outside", "life/relationship", "Relationship."]
  ]) {
    await page.goto(url + "#" + oldRoute);
    await assertOpen(page, title);
    assert.equal(new URL(page.url()).hash, "#" + newRoute);
  }
  await page.goto(url + "#home");
  await page.locator('[data-life="moments"]').scrollIntoViewIfNeeded();
  const pageY = await page.evaluate(() => window.scrollY);
  await page.locator('[data-life="moments"]').click();
  await assertOpen(page, "Moments.");
  await page.locator("#close-detail").click();
  await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
  assert.equal(Math.abs(await page.evaluate(() => window.scrollY) - pageY) < 3, true, "从生活区关闭时跳回首屏");
  await page.goto(url + "credits.html");
  await assertLayout(page);
  assert.equal(await page.locator("h1").textContent(), "Image credits.");
  await page.locator('a[href="index.html#contact"]').click();
  await page.waitForURL("**/index.html#contact");
  assert.deepEqual(errors, [], "脚本或资源请求出错");
  await context.close();
  return { viewport, status: "通过", touch: viewport.width < 700 && engine !== "firefox" ? "触摸模拟" : "鼠标与键盘；窄屏为视口模拟" };
}

async function runEngine(engine, url) {
  const browser = await playwright[engine].launch({ headless: true });
  try {
    const results = [];
    for (const viewport of viewports) {
      try { results.push(await runViewport(browser, engine, viewport, url)); }
      catch (error) { error.message = `${engine} ${viewport.width}×${viewport.height}: ${error.message}`; throw error; }
    }
    const context = await browser.newContext({ viewport: viewports[0], reducedMotion: "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.classList.contains("is-ready") && !document.querySelector(".loader"));
    await page.locator('[data-academic="experience"]').click();
    await assertOpen(page, "Experience.");
    await page.waitForFunction(() => !document.querySelector(".transition-columns"));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#life").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-life]"))
      .every(node => !node.style.getPropertyValue("--drift")));
    assert.equal(await page.locator("[data-life]").evaluateAll(nodes => nodes.every(node => !node.style.getPropertyValue("--drift"))), true);
    assert.deepEqual(errors, []);
    await context.close();
    const fileContext = await browser.newContext({ viewport: viewports[0], reducedMotion: "reduce" });
    const local = await fileContext.newPage();
    const fileErrors = [];
    local.on("pageerror", error => fileErrors.push(error.message));
    await local.goto(pathToFileURL(path.join(root, "index.html")).href + "#life/moments");
    await assertOpen(local, "Moments.");
    await local.locator("#close-detail").click();
    await local.waitForFunction(() => !document.getElementById("detail-dialog").open);
    assert.deepEqual(fileErrors, []);
    await fileContext.close();
    const faultContext = await browser.newContext({ viewport: viewports[0], reducedMotion: "reduce" });
    const faultPage = await faultContext.newPage();
    const uncaught = [];
    let isolated = false;
    faultPage.on("pageerror", error => uncaught.push(error.message));
    faultPage.on("console", message => {
      if (message.type() === "error" && message.text().includes("Unable to initialize section: life")) isolated = true;
    });
    await faultPage.route("**/modules/life/module.js", async route => {
      const source = await fs.readFile(path.join(root, "modules/life/module.js"), "utf8");
      await route.fulfill({ contentType: "text/javascript", body: source.replace("init({ root, details, reducedMotion }) {", 'init({ root, details, reducedMotion }) { throw new Error("Module isolation fixture");') });
    });
    await faultPage.route("**/modules/contact/module.js", async route => {
      const source = await fs.readFile(path.join(root, "modules/contact/module.js"), "utf8");
      await route.fulfill({ contentType: "text/javascript", body: source.replace("init({ root }) {", 'init({ root }) { root.dataset.initialized = "true";') });
    });
    await faultPage.goto(url);
    assert.equal(await faultPage.locator("#contact").getAttribute("data-initialized"), "true", "单模块异常阻断后续模块");
    await faultPage.locator('[data-academic="experience"]').click();
    await assertOpen(faultPage, "Experience.");
    await faultPage.locator("#close-detail").click();
    await faultPage.waitForFunction(() => !document.getElementById("detail-dialog").open);
    assert.equal(isolated, true);
    assert.deepEqual(uncaught, []);
    await faultContext.close();
    const result = { engine, version: browser.version(), results, motion: "正常与减少动态效果通过", file: "直接文件打开及详情通过", isolation: "单模块初始化故障隔离通过" };
    console.log(`${engine} ${result.version}：三个视口、八栏目、路由、键盘、动画和文件打开通过。`);
    return result;
  } finally { await browser.close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/personal-homepage/`;
    const completed = await Promise.allSettled(engines.map(engine => runEngine(engine, url)));
    const failure = completed.find(result => result.status === "rejected");
    if (failure) throw failure.reason;
    const browsers = completed.map(result => result.value);
    const report = { date: new Date().toISOString(), prefix: "/personal-homepage/", browsers, limits: ["手机为视口或触摸模拟，未测试手机真机。", "引擎实测不等于各版本 Chrome、Edge、Safari 品牌浏览器实测。"] };
    await fs.mkdir(path.join(root, "artifacts"), { recursive: true });
    await fs.writeFile(path.join(root, "artifacts/compatibility-results.json"), JSON.stringify(report, null, 2) + "\n");
    console.log("兼容性测试全部通过；报告：artifacts/compatibility-results.json。");
  } finally { server.close(); }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
