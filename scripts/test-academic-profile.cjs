/* 只读源码、临时浏览器内存夹具；外链请求全部拦截，不访问凭据或写远端。 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const ROOT = path.resolve(__dirname, ".."), PREFIX = "/personal-homepage/";
const ENGINES = ["chromium", "firefox", "webkit"];
const VIEWPORTS = [{width: 1440, height: 900}, {width: 390, height: 844}, {width: 320, height: 780}];
const ROUTE = "#academic/publications", ORCID = "https://orcid.org/0009-0005-6858-4000";
const TITLE = "Observation of χcJ → Λ K⁰S Ξ̄⁰ + c.c. and improved measurements of χcJ → Λ K⁻ Ξ̄⁺ + c.c.";
const TYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2"};
let playwright;
try { playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright"); }
catch { console.error("未找到 Playwright；请用 HOMEPAGE_PLAYWRIGHT_MODULE 指定已有维护环境。"); process.exit(1); }
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(PREFIX)) throw new Error("Invalid prefix");
    const relative = pathname.slice(PREFIX.length) || "index.html";
    if (relative.split("/").some(part => [".git", ".private"].includes(part))) throw new Error("Invalid file");
    const filename = await fs.realpath(path.resolve(ROOT, relative));
    if (!filename.startsWith(ROOT + path.sep) || !TYPES[path.extname(filename)]) throw new Error("Invalid file");
    response.writeHead(200, {"Content-Type": TYPES[path.extname(filename)], "Cache-Control": "no-store"});
    response.end(await fs.readFile(filename));
  } catch { response.writeHead(404); response.end("Not found"); }
});
async function navigate(page, url, hash) {
  await page.evaluate(hash => { location.hash = hash; }, hash); await page.waitForURL(url + hash);
}
async function directory(page) {
  await page.locator('.publication-library[data-publication-view="directory"]').waitFor({state: "visible"});
  assert.deepEqual(await page.locator("button[data-publication-category]").evaluateAll(nodes => nodes.map(node => node.dataset.publicationCategory)), ["internal-note", "arxiv", "published"]);
}
async function category(page, id) {
  if (id === "internal-note" || id === "internal-note-besiii") {
    await page.locator('[data-internal-note-view="' + (id === "internal-note" ? "groups" : "group") + '"]').waitFor({state: "visible"});
    return;
  }
  await page.locator('.publication-library[data-publication-view="category"][data-publication-category="' + id + '"]').waitFor({state: "visible"});
}
async function besiiiNotes(page) {
  assert.deepEqual(await page.locator("[data-internal-note-id]").evaluateAll(nodes => nodes.map(node => node.dataset.internalNoteId)), ["bam1027", "bam1089"]);
  const urls = ["https://docbes3.ihep.ac.cn/DocDB/0016/001613/020/MEMO_final.pdf", "https://docbes3.ihep.ac.cn/DocDB/0017/001747/005/MEMO_chicJ_SigmaXiK_v2.3.pdf"];
  for (const [index, id] of ["bam1027", "bam1089"].entries()) {
    const article = page.locator('[data-internal-note-id="' + id + '"]');
    assert.equal(await article.locator(".internal-notes__authors").textContent(), "Li Yuhong, Ma Hailong, Zhao Minggang");
    assert.ok(await article.locator(".internal-notes__title .katex-html").count() > 0);
    assert.ok(await article.locator(".internal-notes__summary p").count() >= 3);
    assert.ok(await article.locator(".internal-notes__summary .katex-html").count() > 0);
    const link = article.locator("[data-internal-note-link]");
    assert.equal(await link.getAttribute("href"), urls[index]);
    assert.equal(await link.getAttribute("target"), "_blank");
    assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
    assert.equal(await article.locator("time, iframe, object, embed").count(), 0);
  }
}
async function layout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "页面横向溢出");
  if (await page.locator("#detail-dialog").evaluate(node => node.open)) {
    assert.equal(await page.locator("#detail-dialog").evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "详情横向溢出");
  }
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)), false, "网页出现中文");
  assert.equal(await page.evaluate(() => Boolean(window.__academicExecuted)), false, "元信息被作为 HTML 执行");
}
async function keyboardTo(page, selector) {
  await page.locator("#close-detail").focus();
  for (let count = 0; count < 60; count++) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Tab 无法到达分类按钮");
}
async function screenshot(page, engine, viewport, name, screenshots) {
  if (engine !== "chromium" || ![1440, 390].includes(viewport.width)) return;
  const panel = page.locator(name === "arxiv" ? '[data-publication-id="arxiv-2610-11981"]' : ".publication-library__directory");
  await panel.scrollIntoViewIfNeeded();
  const filename = "artifacts/screenshots/academic-" + viewport.width + "-" + name + ".png";
  await page.screenshot({path: path.join(ROOT, filename), animations: "disabled"}); screenshots.push(filename);
}
async function runViewport(browser, engine, viewport, url) {
  const context = await browser.newContext({viewport, reducedMotion: "reduce", hasTouch: viewport.width < 700});
  const blocked = [], errors = [], steps = [], screenshots = [];
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    blocked.push(route.request().url()); return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(16000); page.on("pageerror", error => errors.push(error.message));
  const step = async (name, run) => { await run(); await layout(page); steps.push({name, status: "通过"}); };
  try {
    await page.goto(url + "#academic");
    await step("学术按钮打开三分类目录", async () => {
      await page.locator('[data-academic="publications"]').click(); await page.waitForURL(url + ROUTE); await directory(page);
      await screenshot(page, engine, viewport, "directory", screenshots);
    });
    await step("三分类、Internal note课题组与明确空状态", async () => {
      for (const id of ["internal-note", "arxiv", "published"]) {
        await page.locator('button[data-publication-category="' + id + '"]').click(); await page.waitForURL(url + ROUTE + "/" + id); await category(page, id);
        await page.waitForFunction(() => document.activeElement?.matches(".publication-library [data-view-heading]"));
        if (id === "internal-note") {
          const group = page.locator('button[data-internal-note-group="besiii"]');
          assert.ok((await group.innerText()).includes("2 notes"));
          await group.click(); await page.waitForURL(url + ROUTE + "/internal-note-besiii"); await category(page, "internal-note-besiii");
          await besiiiNotes(page);
          await page.locator('[data-internal-note-back="groups"]').click(); await category(page, "internal-note");
        } else if (id === "published") {
          assert.equal(await page.locator(".publication-library__entry").count(), 0);
          assert.ok((await page.locator(".publication-library__state").innerText()).includes("No published papers yet"));
        }
        await page.locator("button[data-publication-back]").click(); await page.waitForURL(url + ROUTE); await directory(page);
      }
    });
    await step("分类及BESIII分组直达、刷新与关闭按钮焦点", async () => {
      for (const id of ["internal-note", "internal-note-besiii", "arxiv", "published"]) {
        await page.goto(url + ROUTE + "/" + id); await category(page, id); await page.reload(); await category(page, id);
        await page.waitForFunction(() => document.activeElement?.id === "close-detail");
      }
    });
    await step("arXiv 真实元信息与安全外链", async () => {
      await navigate(page, url, ROUTE + "/arxiv"); await category(page, "arxiv");
      const article = page.locator('[data-publication-id="arxiv-2610-11981"]');
      assert.equal(await page.evaluate(() => window.Homepage.getPublicationCategories().find(category => category.id === "arxiv").entries[0].title), TITLE);
      assert.ok((await article.locator(".publication-library__title").textContent()).startsWith("Observation of "));
      assert.equal(await article.locator(".publication-library__title .math-inline").count(), 2);
      assert.equal(await article.locator(".publication-library__authors").textContent(), "BESIII Collaboration");
      assert.equal(await article.locator("time").getAttribute("datetime"), "2026-10-08");
      assert.ok((await article.innerText()).includes("arXiv:2610.11981"));
      for (const [kind, href] of [["abstract", "https://arxiv.org/abs/2610.11981"], ["pdf", "https://arxiv.org/pdf/2610.11981"]]) {
        const link = article.locator('[data-publication-link="' + kind + '"]'); assert.equal(await link.getAttribute("href"), href);
        assert.equal(await link.getAttribute("target"), "_blank"); assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
      }
      assert.equal(await article.locator("iframe, object, embed").count(), 0); await screenshot(page, engine, viewport, "arxiv", screenshots);
    });
    await step("分类历史后退/前进与未知分类回退", async () => {
      await page.locator("button[data-publication-back]").click(); await directory(page);
      await page.locator('button[data-publication-category="published"]').click(); await category(page, "published");
      await page.goBack(); await directory(page); await page.goForward(); await category(page, "published");
      await navigate(page, url, ROUTE + "/unknown"); await page.locator('.publication-library[data-publication-view="not-found"]').waitFor({state: "visible"});
      assert.ok((await page.locator(".publication-library__state").innerText()).includes("Category not found"));
      await page.locator("button[data-publication-back]").click(); await directory(page);
    });
    await step("原生键盘分类导航与 Escape 焦点恢复", async () => {
      await keyboardTo(page, 'button[data-publication-category="arxiv"]'); await page.keyboard.press("Enter"); await category(page, "arxiv");
      await page.locator("button[data-publication-back]").focus(); await page.keyboard.press("Enter"); await directory(page);
      await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.getElementById("detail-dialog").open);
      await page.locator('[data-academic="publications"]').focus(); await page.keyboard.press("Enter"); await directory(page);
      await page.keyboard.press("Escape"); await page.waitForFunction(() => document.activeElement?.matches('[data-academic="publications"]'));
    });
    await step("About/Contact ORCID 与 Projects BESIII 真实链接", async () => {
      const links = page.locator("[data-orcid-link]"); assert.equal(await links.count(), 2);
      for (const link of await links.all()) { assert.equal(await link.getAttribute("href"), ORCID); assert.equal(await link.getAttribute("target"), "_blank"); assert.equal(await link.getAttribute("rel"), "noopener noreferrer"); }
      await navigate(page, url, "#academic/projects"); const link = page.locator('.project-directory__collaboration a[href="http://bes3.ihep.ac.cn/"]'); await link.waitFor({state: "visible"});
      assert.ok((await link.locator("..").innerText()).includes("BESIII Collaboration")); assert.equal(await page.locator(".project-directory__collaboration").count(), 1);
    });
    await step("元信息纯文字及字段白名单，危险链接拒绝呈现", async () => {
      const malicious = 'Temporary title <img src=x onerror=window.__academicExecuted=true>';
      await page.evaluate(text => { const entry = window.Homepage.getData("publications.arxiv").entries[0]; entry.title = text; delete entry.titleTex; entry.authors = text; entry.privateMetadata = "discard"; }, malicious);
      await navigate(page, url, ROUTE + "/arxiv"); await category(page, "arxiv");
      assert.equal(await page.locator(".publication-library__title").textContent(), malicious); assert.equal(await page.locator(".publication-library__entry img").count(), 0);
      assert.equal(await page.evaluate(() => "privateMetadata" in window.Homepage.getPublicationCategories().find(category => category.id === "arxiv").entries[0]), false);
      for (const href of ["javascript:alert(1)", "http://example.org/insecure", "https://user:secret@example.org/", "../private.pdf"]) {
        await page.evaluate(href => { window.Homepage.getData("publications.arxiv").entries[0].abstractUrl = href; }, href);
        await navigate(page, url, ROUTE + "/arxiv");
        await navigate(page, url, ROUTE); await page.locator('.publication-library[data-publication-view="unavailable"]').waitFor({state: "visible"});
        assert.equal(await page.locator("[data-publication-link]").count(), 0);
      }
      await page.reload(); await directory(page);
    });
    assert.deepEqual(blocked, []); assert.deepEqual(errors, []);
    return {viewport, status: "通过", steps, screenshots, externalRequests: 0, realWrites: 0};
  } catch (error) { console.error(engine + " " + viewport.width + "：" + error.message.split("\n")[0]); return {viewport, status: "失败", steps, error: error.stack, blocked, pageErrors: errors}; }
  finally { await context.close(); }
}
(async () => {
  const files = ["modules/author/config.js", "modules/academic/experience/entries.js", "modules/life/moments/posts.js", "modules/life/relationship/encrypted.js"];
  const originals = await Promise.all(files.map(file => fs.readFile(path.join(ROOT, file))));
  await fs.mkdir(path.join(ROOT, "artifacts/screenshots"), {recursive: true}); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = "http://127.0.0.1:" + server.address().port + PREFIX;
    const browsers = await Promise.all(ENGINES.map(async engine => {
      let browser;
      try { browser = await playwright[engine].launch({headless: true}); const results = [];
        for (const viewport of VIEWPORTS) { const result = await runViewport(browser, engine, viewport, url); results.push(result); console.log(engine + " " + viewport.width + "×" + viewport.height + "：" + result.status + "。"); }
        return {engine, version: browser.version(), results};
      } catch (error) { return {engine, status: "未完成", error: error.message}; }
      finally { await browser?.close(); }
    }));
    const sourceUnchanged = (await Promise.all(files.map(file => fs.readFile(path.join(ROOT, file))))).every((bytes, index) => bytes.equals(originals[index]));
    const passed = sourceUnchanged && browsers.every(browser => browser.results?.length === VIEWPORTS.length && browser.results.every(result => result.status === "通过"));
    await fs.writeFile(path.join(ROOT, "artifacts/academic-profile-results.json"), JSON.stringify({date: new Date().toISOString(), passed, sourceUnchanged, browsers,
      limits: ["三内核与手机模拟视口，不等同品牌浏览器版本或手机真机。", "仅验证链接目标和安全属性；没有联网下载论文、访问 ORCID/BESIII 或验证线上部署。", "安全夹具仅修改临时页面内存，不改正式资料或读取任何凭据。"]}, null, 2) + "\n");
    console.log("学术资料测试" + (passed ? "全部通过" : "存在失败") + "；报告：artifacts/academic-profile-results.json。"); if (!passed) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
