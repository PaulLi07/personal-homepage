/* 粒子背景公开接口与浏览器行为测试；只读源码、无外部网络及作者凭据。 */
"use strict";
const {AsyncLocalStorage} = require("node:async_hooks");
const assertionScopes = new AsyncLocalStorage();
const assert = new Proxy(require("node:assert/strict"), {get(target,name) {
  const method = target[name];
  return typeof method !== "function" ? method : (...args) => {
    const scope = assertionScopes.getStore(); if (scope) scope.assertions++;
    return method(...args);
  };
}});
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const {pathToFileURL} = require("node:url");
const ROOT = path.resolve(__dirname, ".."), PREFIX = "/personal-homepage/";
const ENGINES = ["chromium", "firefox", "webkit"];
const VIEWPORTS = [{width:1440,height:900},{width:390,height:844},{width:320,height:780}];
const CANVAS = "canvas.particle-background__canvas";
const MIME = {".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml", ".jpg":"image/jpeg", ".png":"image/png", ".webp":"image/webp"};
let playwright;
try { playwright = require(process.env.HOMEPAGE_PLAYWRIGHT_MODULE || "playwright"); }
catch { console.error("未找到 Playwright；请用 HOMEPAGE_PLAYWRIGHT_MODULE 指定已有维护环境。"); process.exit(1); }
const server = http.createServer(async (request,response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url,"http://localhost").pathname);
    if (!pathname.startsWith(PREFIX)) throw new Error("Invalid prefix");
    const relative = pathname.slice(PREFIX.length) || "index.html";
    if (relative.split("/").some(part => [".git",".private"].includes(part))) throw new Error("Invalid path");
    const filename = await fs.realpath(path.resolve(ROOT,relative));
    if (!filename.startsWith(ROOT+path.sep) || !MIME[path.extname(filename)]) throw new Error("Invalid file");
    response.writeHead(200,{"Content-Type":MIME[path.extname(filename)],"Cache-Control":"no-store"}); response.end(await fs.readFile(filename));
  } catch { response.writeHead(404); response.end("Not found"); }
});
async function setupContext(browser, options, url, unsupported = false) {
  const context = await browser.newContext(options), errors = [], blocked = [];
  await context.route("**/*", route => {
    const target = new URL(route.request().url());
    if (["file:","blob:"].includes(target.protocol) || target.origin === new URL(url).origin) return route.continue();
    blocked.push({method:route.request().method(),url:target.href}); return route.abort();
  });
  if (unsupported) await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === "2d" ? null : getContext.call(this,type,...args); };
  });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) errors.push(response.status()+" "+response.url()); });
  return {context,page,errors,blocked};
}
const stats = page => page.evaluate(() => window.Homepage.particleBackground.getStats());
const config = page => page.evaluate(() => window.Homepage.particleBackground.getConfig());
const configure = (page,patch) => page.evaluate(patch => window.Homepage.particleBackground.configure(patch),patch);
async function browserFrames(page,count=8) {
  await page.evaluate(count => new Promise(resolve => {
    const step = () => { if (--count <= 0) resolve(); else requestAnimationFrame(step); }; requestAnimationFrame(step);
  }),count);
}
async function particleFrames(page,count=6) {
  const before = (await stats(page)).frameCount;
  await page.waitForFunction(before => window.Homepage.particleBackground.getStats().frameCount >= before, before+count);
}
async function pixels(page) {
  return page.locator(CANVAS).evaluate(canvas => {
    const context = canvas.getContext("2d"), data = context.getImageData(0,0,canvas.width,canvas.height).data;
    let hash = 2166136261, visible = 0, different = 0;
    for (let index=0; index<data.length; index+=4) {
      hash = Math.imul(hash^data[index],16777619); hash = Math.imul(hash^data[index+1],16777619);
      hash = Math.imul(hash^data[index+2],16777619); hash = Math.imul(hash^data[index+3],16777619);
      if (data[index+3] && (data[index] || data[index+1] || data[index+2])) visible++;
      if (data[index]!==data[0] || data[index+1]!==data[1] || data[index+2]!==data[2] || data[index+3]!==data[3]) different++;
    }
    return {hash:hash>>>0,visible,different,width:canvas.width,height:canvas.height};
  });
}
function finiteStats(value) {
  for (const name of ["count","requestedCount","frameCount","width","height","pixelRatio","meanSpeed","maxSpeed","stepMs","frameMs","adaptiveLevel"]) {
    assert.equal(typeof value[name],"number","缺少stats字段："+name); assert.ok(Number.isFinite(value[name]),name+"不是有限数");
  }
  assert.equal(value.finite,true); assert.equal(typeof value.running,"boolean"); assert.equal(typeof value.pointerActive,"boolean");
}
async function layout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),true,"页面横向溢出");
  assert.equal(await page.evaluate(() => /[\u4e00-\u9fff]/.test(document.body.innerText)),false,"网页出现中文");
  assert.equal(await page.locator(CANVAS).count() <= 1,true,"重复Canvas实例");
}
async function hitTest(page,selector) {
  const target = page.locator(selector); await target.scrollIntoViewIfNeeded();
  assert.equal(await target.evaluate(node => {
    const rect=node.getBoundingClientRect(), hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
    return Boolean(hit && (node===hit || node.contains(hit)));
  }),true,"粒子层挡住交互目标："+selector);
}
async function shot(page,engine,viewport,name,screenshots) {
  if (engine!=="chromium" || ![1440,390].includes(viewport.width)) return;
  const filename="artifacts/screenshots/particles-"+viewport.width+"-"+name+".png";
  await page.screenshot({path:path.join(ROOT,filename),animations:"disabled"}); screenshots.push(filename);
}
async function mount(page) {
  await page.evaluate(() => {
    window.__particleTestController = window.Homepage.particleBackground.mount({root:document.querySelector("#main"),
      reducedMotion:matchMedia("(prefers-reduced-motion: reduce)"),dialog:document.querySelector("#detail-dialog")});
  });
}
async function runViewport(browser,engine,viewport,reducedMotion,url) {
  const scope={assertions:0};
  return assertionScopes.run(scope,async()=>{
  const environment = await setupContext(browser,{viewport,reducedMotion,hasTouch:viewport.width<700},url);
  const {context,page,errors,blocked}=environment, steps=[],screenshots=[],performance=[];
  const reduced = reducedMotion==="reduce";
  const step=async(name,task)=>{await task();await layout(page);steps.push({name,status:"通过"});};
  try {
    await page.goto(url+"#home");
    await page.waitForFunction(() => Boolean(window.Homepage?.particleBackground));
    await step("独立Canvas默认数量、语义、层级及参数接口",async()=>{
      const initial=await config(page); assert.equal(initial.count,4800); assert.equal(initial.mobileCount,1400); assert.equal(initial.averageSpeed,22);
      await configure(page,{adaptiveQuality:false});
      await page.locator(CANVAS).waitFor({state:"visible"});
      assert.equal(await page.locator("#main").evaluate(node=>node.classList.contains("has-particle-background")),true);
      assert.equal(await page.locator(CANVAS).getAttribute("aria-hidden"),"true");
      assert.equal(await page.locator(CANVAS).evaluate(node=>getComputedStyle(node).pointerEvents),"none");
      assert.equal(await page.locator(CANVAS).evaluate(node=>node.closest("#main")!==null),true);
      const state=await stats(page); finiteStats(state); assert.equal(state.count,viewport.width<700?1400:4800);
      assert.equal(state.reducedMotion,reduced); assert.equal(state.running,!reduced);
      await hitTest(page,'.navlinks a[href="#about"]');
      assert.equal(await page.locator("#main input[type=range]").count(),0,"额外前台参数表单");
    });
    await step("真实非空像素与运动/减少动态效果",async()=>{
      if (!reduced) await particleFrames(page,10); else await browserFrames(page);
      const first=await pixels(page); assert.ok(first.visible>0 && first.different>0,"Canvas没有实际粒子像素");
      if (!reduced) await particleFrames(page,6); else await browserFrames(page);
      const second=await pixels(page);
      assert.equal(first.hash===second.hash,reduced,"动画/静态像素行为不符");
      await shot(page,engine,viewport,reduced?"hero-reduce":"hero",screenshots);
    });
    await step("配置有限数、张数、大小与不透明度边界",async()=>{
      const before=await config(page);
      const rejected=await page.evaluate(()=>{
        const api=window.Homepage.particleBackground;
        return [{unknown:true},{count:1.5},{averageSpeed:NaN},{opacity:Infinity},{minSize:2,maxSize:1},{count:-1},{opacity:-1}]
          .map(patch=>{try{api.configure(patch);return false;}catch{return true;}});
      });
      assert.ok(rejected.every(Boolean)); assert.deepEqual(await config(page),before);
      await configure(page,{count:1200,mobileCount:300,minSize:.45,maxSize:1.2,opacity:.55});
      const state=await stats(page); assert.equal(state.count,viewport.width<700?300:1200); finiteStats(state);
      const next=await config(page); assert.equal(next.minSize,.45); assert.equal(next.maxSize,1.2); assert.equal(next.opacity,.55);
      await configure(page,{opacity:0});assert.equal((await pixels(page)).visible,0,"opacity=0没有作用于真实像素");
      await configure(page,{opacity:.55});assert.ok((await pixels(page)).visible>0);
      await configure(page,before);
    });
    await step("后台调速、静止与真实鼠标扰动",async()=>{
      await page.mouse.move(0,0); await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().pointerActive);
      await configure(page,{averageSpeed:0});
      if (!reduced) await particleFrames(page,12); else await browserFrames(page);
      const first=await pixels(page);
      if (!reduced) await particleFrames(page,6); else await browserFrames(page);
      const second=await pixels(page); assert.equal(first.hash,second.hash,"零速度无指针时没有静止");
      assert.ok((await stats(page)).meanSpeed<.01,"零平均速度仍有显著移动");
      await page.mouse.move(viewport.width*.25,viewport.height*.35); await page.mouse.move(viewport.width*.7,viewport.height*.55,{steps:12});
      if (!reduced) {
        const active=await stats(page); assert.equal(active.pointerActive,true);
        await particleFrames(page,4); const disturbed=await pixels(page);
        assert.notEqual(disturbed.hash,second.hash,"鼠标移动没有扰动零速粒子"); assert.ok((await stats(page)).meanSpeed>0);
      }
      await configure(page,{averageSpeed:22}); await page.mouse.move(0,0);
      await shot(page,engine,viewport,reduced?"mouse-reduce":"mouse-field",screenshots);
    });
    await step("触摸指针不激活扰动且不取消默认事件",async()=>{
      await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().pointerActive);
      const events=await page.evaluate(()=>[100,220].map(x=>{
        const event=new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerType:"touch",pointerId:7,clientX:x,clientY:250});
        return {allowed:document.querySelector("#main").dispatchEvent(event),prevented:event.defaultPrevented};
      }));
      assert.deepEqual(events,[{allowed:true,prevented:false},{allowed:true,prevented:false}]);
      assert.equal((await stats(page)).pointerActive,false);
      await browserFrames(page,4);assert.equal((await stats(page)).pointerActive,false);
    });
    await step("正文、照片和键盘导航不被Canvas遮挡",async()=>{
      await page.locator('.navlinks a[href="#about"]').focus(); await page.keyboard.press("Enter"); await page.waitForURL(url+"#about");
      await page.locator("#about").scrollIntoViewIfNeeded();
      const photos=page.locator("#about img");
      if(await photos.count()) { await photos.first().scrollIntoViewIfNeeded(); await page.waitForFunction(()=>Array.from(document.querySelectorAll("#about img")).every(image=>image.complete&&image.naturalWidth>0)); }
      await hitTest(page,'#about a[href="mailto:2310408@mail.nankai.edu.cn"]');
      await page.locator("#about-title").evaluate(node=>window.scrollTo({top:scrollY+node.getBoundingClientRect().top-95,behavior:"instant"}));
      await browserFrames(page,2);
      await shot(page,engine,viewport,reduced?"about-reduce":"about",screenshots);
      await hitTest(page,'[data-academic="publications"]'); await page.locator('[data-academic="publications"]').focus(); await page.keyboard.press("Enter");
      await page.waitForFunction(()=>document.getElementById("detail-dialog").open);
      await page.locator('.publication-library[data-publication-view="directory"]').waitFor({state:"visible"});
    });
    await step("详情暂停、指针清理及关闭恢复",async()=>{
      await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().running);
      const first=await stats(page); assert.equal(first.pointerActive,false); await browserFrames(page);
      assert.equal((await stats(page)).frameCount,first.frameCount,"详情打开后仍在绘制");
      await page.keyboard.press("Escape"); await page.waitForFunction(()=>!document.getElementById("detail-dialog").open);
      assert.equal((await stats(page)).running,!reduced);
      if (!reduced) await particleFrames(page,4);
    });
    await step("受控visibilitychange暂停与恢复",async()=>{
      await page.evaluate(()=>{
        Object.defineProperty(document,"hidden",{configurable:true,value:true});
        Object.defineProperty(document,"visibilityState",{configurable:true,value:"hidden"}); document.dispatchEvent(new Event("visibilitychange"));
      });
      const first=await stats(page); assert.equal(first.running,false); await browserFrames(page); assert.equal((await stats(page)).frameCount,first.frameCount);
      await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event("visibilitychange"));});
      assert.equal((await stats(page)).running,!reduced); if(!reduced)await particleFrames(page,4);
    });
    await step("resize、DPR上限及媒体偏好切换",async()=>{
      await page.setViewportSize({width:viewport.width+30,height:viewport.height+35});
      await page.waitForFunction(dimensions=>{const s=window.Homepage.particleBackground.getStats();return s.width===dimensions.width&&s.height===dimensions.height;},{width:viewport.width+30,height:viewport.height+35});
      const state=await stats(page), dimensions=await page.locator(CANVAS).evaluate(node=>({width:node.width,height:node.height}));
      assert.equal(dimensions.width,Math.round(state.width*state.pixelRatio)); assert.equal(dimensions.height,Math.round(state.height*state.pixelRatio));
      await page.setViewportSize(viewport);
      await page.evaluate(()=>{
        window.__particleMediaChanges=0;
        window.__particleMedia=matchMedia("(prefers-reduced-motion: reduce)");
        window.__particleMedia.addEventListener("change",()=>{window.__particleMediaChanges++;});
      });
      await page.emulateMedia({reducedMotion:reduced?"no-preference":"reduce"});
      await page.waitForFunction(value=>{const state=window.Homepage.particleBackground.getStats();return window.__particleMediaChanges>=1&&state.reducedMotion===value&&state.running===!value;},!reduced);
      assert.equal((await stats(page)).running,reduced); await page.emulateMedia({reducedMotion});
      await page.waitForFunction(value=>{const state=window.Homepage.particleBackground.getStats();return window.__particleMediaChanges>=2&&state.reducedMotion===value&&state.running===!value;},reduced);
    });
    await step("enabled关开、销毁重启与单实例",async()=>{
      await configure(page,{enabled:false}); assert.equal((await stats(page)).running,false);
      assert.equal(await page.locator("#main").evaluate(node=>node.classList.contains("has-particle-background")),false);
      await configure(page,{enabled:true}); assert.equal((await stats(page)).running,!reduced);
      await page.evaluate(()=>window.Homepage.particleBackground.dispose()); assert.equal(await page.locator(CANVAS).count(),0);
      assert.equal(await page.locator("#main").evaluate(node=>node.classList.contains("has-particle-background")),false);
      await mount(page);
      await page.evaluate(()=>{window.__particleDisposedController=window.__particleTestController;});
      await mount(page);assert.equal(await page.locator(CANVAS).count(),1);finiteStats(await stats(page));
      const disposed=await page.evaluate(()=>window.__particleDisposedController.getStats());
      assert.equal(disposed.status,"disposed");assert.equal(disposed.running,false);
      await browserFrames(page,4);
      assert.equal((await page.evaluate(()=>window.__particleDisposedController.getStats())).frameCount,disposed.frameCount);
      assert.equal(await page.evaluate(()=>{try{window.__particleDisposedController.configure({opacity:.5});return false;}catch{return true;}}),true);
      await page.evaluate(()=>window.__particleTestController.pause()); const first=await stats(page); assert.equal(first.running,false);
      await browserFrames(page); assert.equal((await stats(page)).frameCount,first.frameCount);
      await page.evaluate(()=>window.__particleTestController.resume()); assert.equal((await stats(page)).running,!reduced);
    });
    if(!reduced)await step("固定数量实测step/frame性能样本",async()=>{
      await configure(page,{adaptiveQuality:false}); await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().pointerActive);
      for(let index=0;index<10;index++){await particleFrames(page,2);const state=await stats(page);finiteStats(state);performance.push({count:state.count,frameCount:state.frameCount,stepMs:state.stepMs,frameMs:state.frameMs});}
    });
    assert.deepEqual(errors,[]); assert.deepEqual(blocked,[]);
    return {viewport,reducedMotion,status:"通过",assertions:scope.assertions,steps,screenshots,performance,stats:await stats(page),externalRequests:0,realWrites:0};
  } catch(error){console.error(engine+" "+viewport.width+" "+reducedMotion+"："+error.message.split("\n")[0]);return {viewport,reducedMotion,status:"失败",assertions:scope.assertions,steps,error:error.stack,stats:await stats(page),mediaChanges:await page.evaluate(()=>window.__particleMediaChanges),pageErrors:errors,blocked};}
  finally{await context.close();}
  });
}
async function extras(browser,engine,url){
  const scope={assertions:0};
  return assertionScopes.run(scope,async()=>{
  const results=[];
  for(const name of ["unsupported","dpr","file","adaptive"]){
    const beforeAssertions=scope.assertions;
    let adaptiveEvidence;
    const environment=await setupContext(browser,{viewport:VIEWPORTS[0],reducedMotion:name==="adaptive"?"no-preference":"reduce",deviceScaleFactor:name==="dpr"?2:1},url,name==="unsupported");
    const {context,page,errors,blocked}=environment;
    try{
      await page.goto(name==="file"?pathToFileURL(path.join(ROOT,"index.html")).href+"#home":url+"#home");
      await page.waitForFunction(()=>Boolean(window.Homepage?.particleBackground));
      if(name==="adaptive"){
        await page.evaluate(()=>{
          const api=window.Homepage,original=api.createDustSimulation;
          window.__particleSlowDelay=24;
          api.createDustSimulation=options=>{
            const simulation=original(options);
            return {...simulation,get particles(){return simulation.particles;},step(...args){
              simulation.step(...args);const started=performance.now();
              while(performance.now()-started<window.__particleSlowDelay) { /* 仅测试：注入慢帧 */ }
            }};
          };
          api.particleBackground.mount({root:document.querySelector("#main"),reducedMotion:matchMedia("(prefers-reduced-motion: reduce)"),dialog:document.querySelector("#detail-dialog"),config:{count:180,mobileCount:180,fps:60,adaptiveQuality:true}});
        });
        await page.waitForFunction(()=>{const s=window.Homepage.particleBackground.getStats();return s.frameCount>=90&&s.adaptiveLevel<1;},null,{timeout:15000});
        const degraded=await stats(page);finiteStats(degraded);
        assert.ok(degraded.count<degraded.requestedCount);assert.ok(degraded.adaptiveLevel>=.55);
        assert.equal((await config(page)).count,180,"降级改写了用户配置");
        await page.evaluate(()=>{window.__particleSlowDelay=0;});
        await configure(page,{adaptiveQuality:false});
        const restored=await stats(page);assert.equal(restored.adaptiveLevel,1);assert.equal(restored.count,restored.requestedCount);assert.equal(restored.count,180);
        adaptiveEvidence={degraded,restored};
        await particleFrames(page,4);
      }else if(name==="unsupported"){
        assert.equal(await page.locator("#main").evaluate(node=>node.classList.contains("has-particle-background")),false);
        assert.equal((await stats(page)).running,false);
        await page.locator('[data-academic="publications"]').click();await page.locator('.publication-library[data-publication-view="directory"]').waitFor({state:"visible"});
      }else{
        await page.locator(CANVAS).waitFor({state:"visible"});assert.ok((await pixels(page)).different>0);finiteStats(await stats(page));
        if(name==="dpr"){
          await configure(page,{maxPixelRatio:1.5});assert.equal((await stats(page)).pixelRatio,1.5);
          assert.equal(await page.locator(CANVAS).evaluate(node=>node.width),2160);
          await configure(page,{maxPixelRatio:1});assert.equal((await stats(page)).pixelRatio,1);
          assert.equal(await page.locator(CANVAS).evaluate(node=>node.width),1440);
        }
      }
      await layout(page);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);results.push({name,status:"通过",assertions:scope.assertions-beforeAssertions,stats:await stats(page),...(name==="adaptive"?{controlledSlowStepMs:24,performanceMeasurement:false,...adaptiveEvidence}:{})});
    }catch(error){results.push({name,status:"失败",assertions:scope.assertions-beforeAssertions,error:error.stack,pageErrors:errors,blocked});}
    finally{await context.close();}
  }
  return results;
  });
}
(async()=>{
  const files=["modules/author/config.js","modules/academic/experience/entries.js","modules/life/moments/posts.js","modules/life/relationship/encrypted.js"];
  const originals=await Promise.all(files.map(file=>fs.readFile(path.join(ROOT,file))));
  await fs.mkdir(path.join(ROOT,"artifacts/screenshots"),{recursive:true});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  try{
    const url="http://127.0.0.1:"+server.address().port+PREFIX;
    const browsers=await Promise.all(ENGINES.map(async engine=>{
      let browser;
      try{browser=await playwright[engine].launch({headless:true});const results=[];
        for(const viewport of VIEWPORTS)for(const motion of ["no-preference","reduce"]){const result=await runViewport(browser,engine,viewport,motion,url);results.push(result);console.log(engine+" "+viewport.width+"×"+viewport.height+" "+motion+"："+result.status+"。");}
        return {engine,version:browser.version(),results,extras:await extras(browser,engine,url)};
      }catch(error){return {engine,status:"未完成",error:error.stack};}finally{await browser?.close();}
    }));
    const sourceUnchanged=(await Promise.all(files.map(file=>fs.readFile(path.join(ROOT,file))))).every((bytes,index)=>bytes.equals(originals[index]));
    const passed=sourceUnchanged&&browsers.every(browser=>browser.results?.length===6&&browser.results.every(result=>result.status==="通过")&&browser.extras.every(result=>result.status==="通过"));
    const flows=browsers.reduce((sum,browser)=>sum+(browser.results||[]).reduce((n,result)=>n+result.steps.length,0)+(browser.extras||[]).length,0);
    const assertions=browsers.reduce((sum,browser)=>sum+(browser.results||[]).reduce((n,result)=>n+result.assertions,0)+(browser.extras||[]).reduce((n,result)=>n+result.assertions,0),0);
    const report={date:new Date().toISOString(),passed,sourceUnchanged,prefix:PREFIX,flows,assertions,browsers,limits:["桌面与手机视口/触屏模拟，不等于品牌浏览器版本或手机真机。","visibility使用document属性与事件受控模拟，未测试真实后台标签页功耗。","性能为当前Mac/headless环境的step/frame采样，不构成真机FPS保证；像素读取期间不采性能。","自适应降级通过180粒子与每帧人工24ms模拟；不计入真实性能样本。","不访问外网、不读取真实作者凭据、不修改正式配置、文章或密文。"]};
    await fs.writeFile(path.join(ROOT,"artifacts/particle-results.json"),JSON.stringify(report,null,2)+"\n");
    console.log("粒子背景测试"+(passed?"全部通过":"存在失败")+"；报告：artifacts/particle-results.json。");if(!passed)process.exitCode=1;
  }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
