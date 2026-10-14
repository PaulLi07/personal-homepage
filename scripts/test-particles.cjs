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
const BLACK_SECTIONS = ["about", "academic", "life"];
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
  await context.addInitScript(() => {
    const prototype=CanvasRenderingContext2D.prototype,originals={};
    window.__particlePaintTrace={arc:0,fill:0,drawImage:0,gradient:0,blur:0,nonWhiteFill:0,minRadius:Infinity,maxRadius:0};
    for(const name of ["arc","fill","drawImage","createRadialGradient","createLinearGradient","createConicGradient"]){
      const original=prototype[name];if(typeof original!=="function")continue;
      originals[name]=original;
      prototype[name]=function(...args){
        if(this.canvas.classList.contains("particle-background__canvas")){
          const trace=window.__particlePaintTrace;
          if(name==="arc"){trace.arc++;trace.minRadius=Math.min(trace.minRadius,args[2]);trace.maxRadius=Math.max(trace.maxRadius,args[2]);}
          else if(name==="fill"){trace.fill++;if(!["#ffffff","white","rgb(255, 255, 255)"].includes(this.fillStyle))trace.nonWhiteFill++;}
          else if(name==="drawImage")trace.drawImage++;else trace.gradient++;
          if(this.shadowBlur>0 || /blur\(/i.test(this.filter||""))trace.blur++;
        }
        return original.apply(this,args);
      };
    }
    window.__restoreParticlePaintMethods=()=>{for(const [name,method]of Object.entries(originals))prototype[name]=method;};
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
async function settleScroll(page) {
  await page.evaluate(() => new Promise(resolve => {
    let previous=scrollY,stable=0;
    const sample=()=>{stable=scrollY===previous?stable+1:0;previous=scrollY;
      if(stable>=8)resolve();else requestAnimationFrame(sample);};
    requestAnimationFrame(sample);
  }));
}
async function rememberScrollPixels(page) {
  return page.evaluate(()=>{
    const canvas=document.querySelector(".particle-background__canvas");
    const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
    const surfaces=Array.from(document.querySelectorAll('[data-particle-surface="black"]')).map(rect);
    const holes=Array.from(document.querySelectorAll('[data-particle-surface="black"] img, [data-particle-exclude]')).map(rect);
    window.__particleScrollSnapshot={data:canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data,
      width:canvas.width,height:canvas.height,ratio:canvas.width/innerWidth,scrollY,surfaces,holes};
    return scrollY;
  });
}
async function compareScrollPixels(page) {
  return page.evaluate(()=>{
    const old=window.__particleScrollSnapshot,canvas=document.querySelector(".particle-background__canvas");
    const next=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;
    const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
    const surfaces=Array.from(document.querySelectorAll('[data-particle-surface="black"]')).map(rect);
    const holes=Array.from(document.querySelectorAll('[data-particle-surface="black"] img, [data-particle-exclude]')).map(rect);
    const contains=(r,x,y,pad)=>x>=r.left+pad&&x<r.right-pad&&y>=r.top+pad&&y<r.bottom-pad;
    const drawable=(areas,excluded,x,y)=>areas.some(r=>contains(r,x,y,5))&&!excluded.some(r=>contains(r,x,y,-5));
    const delta=scrollY-old.scrollY,shift=Math.round(delta*old.ratio);
    let compared=0,matched=0,missing=0,maxAlphaDelta=0;
    for(let y=5;y<old.height-5;y++){
      const targetY=y-shift;if(targetY<5||targetY>=old.height-5)continue;
      for(let x=5;x<old.width-5;x++){
        const alpha=old.data[(y*old.width+x)*4+3];if(alpha<32)continue;
        const cssX=(x+.5)/old.ratio,cssY=(y+.5)/old.ratio;
        if(!drawable(old.surfaces,old.holes,cssX,cssY)||!drawable(surfaces,holes,cssX,cssY-delta))continue;
        compared++;
        const nextAlpha=next[(targetY*old.width+x)*4+3],difference=Math.abs(nextAlpha-alpha);
        // WebKit 路径平移后边缘 alpha 有小幅栅格化差异；位置仍须同一像素且不缺点。
        if(difference<=16)matched++;
        if(nextAlpha===0)missing++;
        maxAlphaDelta=Math.max(maxAlphaDelta,difference);
      }
    }
    return {scrollDelta:delta,compared,matched,missing,maxAlphaDelta,paintScroll:window.Homepage.particleBackground.getStats().scrollY,actualScroll:scrollY};
  });
}
async function surfacePixels(page,selector) {
  return page.evaluate(({canvasSelector,selector})=>{
    const canvas=document.querySelector(canvasSelector),context=canvas.getContext("2d"),ratio=canvas.width/innerWidth;
    const rect=node=>{const value=node.getBoundingClientRect();return {left:value.left,top:value.top,right:value.right,bottom:value.bottom};};
    const surfaces=Array.from(document.querySelectorAll('[data-particle-surface="black"]')).filter(node=>{
      const bounds=node.getBoundingClientRect(),style=getComputedStyle(node);
      return bounds.width>0&&bounds.height>0&&bounds.left<innerWidth&&bounds.right>0&&bounds.top<innerHeight&&bounds.bottom>0
        &&style.display!=="none"&&style.visibility!=="hidden"&&style.backgroundColor==="rgb(0, 0, 0)"
        &&style.backgroundImage==="none"&&Number(style.opacity)===1;
    }).map(rect);
    const images=Array.from(document.querySelectorAll('[data-particle-surface="black"] img')).map(rect);
    const excludes=Array.from(document.querySelectorAll("[data-particle-exclude]")).map(rect);
    const target=selector?rect(document.querySelector(selector)):null;
    const contains=(box,x,y,margin=0)=>x>=box.left+margin&&x<box.right-margin&&y>=box.top+margin&&y<box.bottom-margin;
    const data=context.getImageData(0,0,canvas.width,canvas.height).data;
    let visible=0,outsideSurface=0,imagePixels=0,excludedPixels=0,targetPixels=0,nonWhite=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const index=(y*canvas.width+x)*4;if(!data[index+3])continue;
      const cssX=(x+.5)/ratio,cssY=(y+.5)/ratio;visible++;
      if(!surfaces.some(box=>contains(box,cssX,cssY,-1/ratio)))outsideSurface++;
      if(images.some(box=>contains(box,cssX,cssY,1/ratio)))imagePixels++;
      if(excludes.some(box=>contains(box,cssX,cssY,1/ratio)))excludedPixels++;
      if(target&&contains(target,cssX,cssY,1/ratio))targetPixels++;
      if(data[index]!==255||data[index+1]!==255||data[index+2]!==255)nonWhite++;
    }
    const background=getComputedStyle(document.querySelector(selector||"#about"));
    return {visible,outsideSurface,imagePixels,excludedPixels,targetPixels,nonWhite,surfaces,images,
      background:background.backgroundColor,backgroundImage:background.backgroundImage,opacity:Number(background.opacity)};
  },{canvasSelector:CANVAS,selector});
}
async function scrollSection(page,id) {
  await page.locator("#"+id).evaluate(node=>{
    const rect=node.getBoundingClientRect();
    window.scrollTo({top:scrollY+rect.top+Math.max(0,(rect.height-innerHeight)/2),behavior:"instant"});
  });
  await browserFrames(page,4);
}
async function settleGeometry(page) {
  await page.evaluate(async()=>{
    for(let round=0;round<4;round++){
      const nodes=document.querySelectorAll('[data-particle-surface="black"], [data-particle-exclude]');
      const animations=Array.from(new Set(Array.from(nodes).flatMap(node=>node.getAnimations({subtree:true}))))
        .filter(animation=>animation.playState==="running"&&Number.isFinite(animation.effect?.getComputedTiming().endTime));
      if(!animations.length)break;
      await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));
    }
  });
  await browserFrames(page,2);
}
async function heroReady(page) {
  await page.waitForFunction(()=>document.documentElement.classList.contains("is-ready")&&!document.querySelector(".loader"));
  await page.waitForFunction(()=>{const image=document.querySelector(".hero-backdrop img");return image?.complete&&image.naturalWidth>0;});
  await page.locator("#home-title").waitFor({state:"visible"});
  assert.equal(await page.locator(".hero-backdrop img").evaluate(node=>getComputedStyle(node).visibility!=="hidden"&&Number(getComputedStyle(node).opacity)>0),true);
  assert.match(await page.locator("#home-title").innerText(),/Yuhong Li/);
}
async function visibleImagesReady(page,id) {
  await page.waitForFunction(id=>Array.from(document.querySelectorAll("#"+id+" img")).every(image=>{
    const bounds=image.getBoundingClientRect();
    return image.getAttribute("aria-hidden")==="true"||bounds.right<=0||bounds.left>=innerWidth||bounds.bottom<=0||bounds.top>=innerHeight
      ||image.complete&&image.naturalWidth>0;
  }),id);
  await browserFrames(page,2);
}
async function assertBlackSurface(page,id="about") {
  // 有限CSS过渡结束后对齐当前矩形与Canvas，避免把合成中间帧当成固定几何。
  await settleGeometry(page);
  const value=await surfacePixels(page,"#"+id);
  assert.equal(value.background,"rgb(0, 0, 0)");assert.equal(value.backgroundImage,"none");assert.equal(value.opacity,1);
  assert.ok(value.targetPixels>0,id+"纯黑背景未画出粒子");
  assert.equal(value.outsideSurface,0,"粒子画到纯黑surface之外");
  assert.equal(value.imagePixels,0,"粒子画到黑区照片或封面内");
  assert.equal(value.excludedPixels,0,"粒子画到公共排除区域内");
  assert.equal(value.nonWhite,0,"粒子实际像素不是纯白");
  const state=await stats(page);assert.ok(state.renderedCount>0&&state.renderedCount<state.count,"当帧黑区绘制数未与全模拟数量区分");
  assert.equal(state.surfaceCount,value.surfaces.length,"可见纯黑区域数量不符");
  return value;
}
async function assertRejectedSurface(page,id="about") {
  await settleGeometry(page);
  const value=await surfacePixels(page,"#"+id),state=await stats(page);
  assert.equal(value.targetPixels,0,"不合格或已移除标记的"+id+"仍画出粒子");
  assert.equal(value.outsideSurface,0);assert.equal(value.imagePixels,0);assert.equal(value.excludedPixels,0);
  assert.equal(state.surfaceCount,value.surfaces.length,"相邻黑区的真实可见数量不符");
  if(!value.surfaces.length){assert.equal(value.visible,0);assert.equal(state.renderedCount,0);}
}
async function pointerPath(page) {
  return page.evaluate(()=>{
    const surface=document.querySelector('[data-particle-surface="black"]').getBoundingClientRect();
    const images=Array.from(document.querySelectorAll('[data-particle-surface="black"] img'),node=>node.getBoundingClientRect());
    const allowed=(x,y)=>x>surface.left&&x<surface.right&&y>surface.top&&y<surface.bottom&&!images.some(box=>x>box.left&&x<box.right&&y>box.top&&y<box.bottom);
    for(const y of [.82,.6,.35,.2,.95].map(value=>value*innerHeight))for(const pair of [[.18,.8],[.73,.95]]){
      const x1=innerWidth*pair[0],x2=innerWidth*pair[1];
      if([x1,(x1+x2)/2,x2].every(x=>allowed(x,y)))return {from:{x:x1,y},to:{x:x2,y}};
    }
    throw new Error("No visible black area for the pointer fixture.");
  });
}
function finiteStats(value) {
  for (const name of ["count","requestedCount","renderedCount","surfaceCount","frameCount","width","height","pixelRatio","meanSpeed","maxSpeed","stepMs","frameMs","adaptiveLevel","scrollX","scrollY"]) {
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
  await settleGeometry(page);
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
  let rendering,scrollFollow;
  const reduced = reducedMotion==="reduce";
  const step=async(name,task)=>{await task();await layout(page);steps.push({name,status:"通过"});};
  try {
    await page.goto(url+"#home");
    await page.waitForFunction(() => Boolean(window.Homepage?.particleBackground));
    await step("独立Canvas默认数量、语义、层级及参数接口",async()=>{
      const initial=await config(page); assert.equal(initial.count,4800); assert.equal(initial.mobileCount,1400); assert.equal(initial.averageSpeed,22);
      assert.equal(initial.minSize,.4);assert.equal(initial.maxSize,.85);assert.equal(initial.opacity,.85);
      assert.equal("parallaxDistance" in initial,false);assert.equal("parallaxResponse" in initial,false);
      await configure(page,{adaptiveQuality:false});
      await heroReady(page);
      await page.locator(CANVAS).waitFor({state:"visible"});
      assert.equal(await page.locator("#main").evaluate(node=>node.classList.contains("has-particle-background")),true);
      assert.equal(await page.locator(CANVAS).getAttribute("aria-hidden"),"true");
      assert.equal(await page.locator(CANVAS).evaluate(node=>getComputedStyle(node).pointerEvents),"none");
      assert.equal(await page.locator(CANVAS).evaluate(node=>getComputedStyle(node).filter),"none","Canvas本身被CSS滤镜模糊");
      assert.equal(await page.locator(CANVAS).evaluate(node=>node.closest("#main")!==null),true);
      const state=await stats(page); finiteStats(state); assert.equal(state.count,viewport.width<700?1400:4800);
      assert.equal(state.reducedMotion,reduced); assert.equal(state.running,!reduced);
      await hitTest(page,'.navlinks a[href="#about"]');
      assert.equal(await page.locator("#main input[type=range]").count(),0,"额外前台参数表单");
    });
    await step("Home/Contact图片透明与三个纯黑栏目白色实心圆点",async()=>{
      assert.deepEqual(await page.locator('[data-particle-surface="black"]').evaluateAll(nodes=>nodes.map(node=>node.id)),BLACK_SECTIONS);
      for(const id of ["academic","life"])assert.equal(await page.locator("#"+id+" .section-background").count(),0,id+"整区背景图仍保留");
      const heroFile=await fs.readFile(path.join(ROOT,"modules/home/images/hero.jpg"));
      assert.equal(heroFile.equals(await fs.readFile(path.join(ROOT,"modules/about/images/portrait.jpg"))),true,"Home未复制About原山水图");
      const contactFile=await fs.readFile(path.join(ROOT,"modules/contact/images/background.png"));
      assert.equal(contactFile.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),true,"Contact资源不是PNG");
      assert.equal(await page.locator("#contact .section-background img").getAttribute("src"),"modules/contact/images/background.png");
      await scrollSection(page,"home");await settleGeometry(page);
      const home=await surfacePixels(page,"#home");assert.equal(home.targetPixels,0,"首页图片上仍有粒子");assert.equal(home.outsideSurface,0);
      assert.equal((await stats(page)).surfaceCount,home.surfaces.length);
      await shot(page,engine,viewport,reduced?"hero-reduce":"hero",screenshots);
      await scrollSection(page,"contact");await settleGeometry(page);
      const contactImage=page.locator("#contact .section-background img");await contactImage.waitFor({state:"visible"});
      await contactImage.evaluate(image=>image.complete&&image.naturalWidth>0||new Promise((resolve,reject)=>{image.onload=()=>resolve(true);image.onerror=reject;}));
      const contact=await surfacePixels(page,"#contact");assert.equal(contact.targetPixels,0,"Contact图片上仍有粒子");assert.equal(contact.outsideSurface,0);
      await shot(page,engine,viewport,reduced?"contact-reduce":"contact",screenshots);
      const sections={};
      for(const id of BLACK_SECTIONS){
        await scrollSection(page,id);await visibleImagesReady(page,id);
        sections[id]=await assertBlackSurface(page,id);
        if(id!=="about")await shot(page,engine,viewport,id+(reduced?"-reduce":""),screenshots);
      }
      await scrollSection(page,"about");const surface=await assertBlackSurface(page);
      const trace=await page.evaluate(()=>window.__particlePaintTrace);
      assert.ok(trace.arc>0&&trace.fill>0,"未实际使用圆弧填充");assert.equal(trace.drawImage,0,"粒子仍使用模糊sprite");
      assert.equal(trace.gradient,0);assert.equal(trace.blur,0);assert.equal(trace.nonWhiteFill,0);
      assert.ok(trace.minRadius>=.4-.00001&&trace.maxRadius<=.85+.00001,"默认半径超出微小圆点范围");
      const painted=await stats(page);
      rendering={surface,sections,home,contact,trace,simulationCount:painted.count,renderedCount:painted.renderedCount,geometryBoundaryToleranceDevicePixels:1};
      await page.evaluate(()=>window.__restoreParticlePaintMethods());
    });
    await step("学术封面切换和生活白框叠层、四卡键盘交互",async()=>{
      for(const [key,label]of [["experience","Experience"],["publications","Publications"],["notes","Notes"],["projects","Projects"]]){
        const button=page.locator('[data-academic="'+key+'"]');await button.scrollIntoViewIfNeeded();await button.focus();
        assert.equal(await page.locator("#preview-label").textContent(),label);
        const active=page.locator('.preview-stack img.is-active');assert.equal(await active.count(),1);
        assert.equal(await active.getAttribute("data-preview"),key);assert.equal(await active.getAttribute("aria-hidden"),"false");
        await page.waitForFunction(key=>{const image=document.querySelector('[data-preview="'+key+'"]');return image.complete&&image.naturalWidth>0;},key);
        await assertBlackSurface(page,"academic");await hitTest(page,'[data-academic="'+key+'"]');
      }
      if(viewport.width>700){await page.locator('[data-academic="notes"]').hover();assert.equal(await page.locator("#preview-label").textContent(),"Notes");}
      await scrollSection(page,"life");
      const frame=await page.locator(".life-frame").evaluate(node=>{
        const style=getComputedStyle(node),layer=getComputedStyle(node,"::before"),rect=node.getBoundingClientRect();
        return {width:rect.width,height:rect.height,foreground:node.hasAttribute("data-particle-foreground"),excluded:node.hasAttribute("data-particle-exclude"),
          border:style.borderTopWidth,color:style.borderTopColor,borderStyle:style.borderTopStyle,
          layerContent:layer.content,layerBorder:layer.borderTopWidth,layerColor:layer.borderTopColor,layerPosition:layer.position,
          layerInset:[layer.top,layer.right,layer.bottom,layer.left]};
      });
      assert.ok(frame.width>0&&frame.height>0);assert.equal(frame.foreground,true);assert.equal(frame.excluded,false,"生活整框被排除，框内没有粒子");
      assert.ok(parseFloat(frame.border)>=1);assert.equal(frame.borderStyle,"solid");assert.match(frame.color,/rgba?\(255, 255, 255(?:\)|,)/);
      assert.ok(!["none","normal"].includes(frame.layerContent));assert.ok(parseFloat(frame.layerBorder)>0);
      assert.match(frame.layerColor,/rgba?\(255, 255, 255(?:\)|,)/);assert.equal(frame.layerPosition,"absolute");
      assert.ok(frame.layerInset.some(value=>parseFloat(value)!==0),"生活第二轮廓未偏移");
      for(const [key,title]of [["moments","Moments."],["travels","Travels."],["creations","Creations."],["relationship","Relationship."]]){
        const selector='[data-life="'+key+'"]',button=page.locator(selector);await button.scrollIntoViewIfNeeded();
        await page.waitForFunction(selector=>{const image=document.querySelector(selector+" img");return image.complete&&image.naturalWidth>0;},selector);
        await hitTest(page,selector);await button.focus();await page.keyboard.press("Enter");
        await page.waitForFunction(()=>document.getElementById("detail-dialog").open);
        assert.equal(new URL(page.url()).hash,"#life/"+key);assert.equal(await page.locator("#detail-title").textContent(),title);
        assert.equal((await stats(page)).running,false);
        await page.keyboard.press("Escape");await page.waitForFunction(()=>!document.getElementById("detail-dialog").open);
        await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
        assert.equal((await stats(page)).running,!reduced);await assertBlackSurface(page,"life");
      }
      rendering.lifeFrame=frame;await scrollSection(page,"about");await assertBlackSurface(page);
    });
    await step("非纯黑、渐变或半透明surface拒绝绘制",async()=>{
      for(const patch of [{backgroundColor:"rgb(1, 1, 1)"},{backgroundImage:"linear-gradient(#000, #000)"},{opacity:"0.5"}]){
        await page.evaluate(patch=>{
          const node=document.querySelector("#about");window.__particleSurfaceStyle=node.getAttribute("style");
          Object.assign(node.style,patch);window.scrollBy({top:2,behavior:"instant"});
        },patch);
        await browserFrames(page,4);await assertRejectedSurface(page);
        await page.evaluate(()=>{
          const node=document.querySelector("#about");
          if(window.__particleSurfaceStyle===null)node.removeAttribute("style");else node.setAttribute("style",window.__particleSurfaceStyle);
          window.scrollBy({top:-2,behavior:"instant"});
        });
        await browserFrames(page,4);await assertBlackSurface(page);
      }
      const beforeStaticChange=await stats(page);
      await page.evaluate(()=>{
        const node=document.querySelector("#about");window.__particleSurfaceStyle=node.getAttribute("style");
        node.style.backgroundColor="rgb(1, 1, 1)";
      });
      await browserFrames(page,4);await assertRejectedSurface(page);
      if(reduced)assert.equal((await stats(page)).frameCount,beforeStaticChange.frameCount,"样式刷新推动了静态模拟");
      await page.evaluate(()=>{
        const node=document.querySelector("#about");
        if(window.__particleSurfaceStyle===null)node.removeAttribute("style");else node.setAttribute("style",window.__particleSurfaceStyle);
      });
      await browserFrames(page,4);await assertBlackSurface(page);
      await page.evaluate(()=>document.querySelector("#about").removeAttribute("data-particle-surface"));
      await browserFrames(page,4);await assertRejectedSurface(page);
      await page.evaluate(()=>document.querySelector("#about").setAttribute("data-particle-surface","black"));
      await browserFrames(page,4);await assertBlackSurface(page);
    });
    await step("纯黑区域真实像素运动与减少动态效果静止",async()=>{
      if (!reduced) await particleFrames(page,10); else await browserFrames(page);
      const first=await pixels(page); assert.ok(first.visible>0 && first.different>0,"Canvas没有实际粒子像素");
      if (!reduced) await particleFrames(page,6); else await browserFrames(page);
      const second=await pixels(page);
      assert.equal(first.hash===second.hash,reduced,"动画/静态像素行为不符");
      await assertBlackSurface(page);
    });
    await step("配置有限数、张数、大小与不透明度边界",async()=>{
      const before=await config(page);
      const rejected=await page.evaluate(()=>{
        const api=window.Homepage.particleBackground;
        return [{unknown:true},{count:1.5},{averageSpeed:NaN},{opacity:Infinity},{minSize:2,maxSize:1},{count:-1},{opacity:-1},
          {parallaxDistance:40},{parallaxResponse:8}]
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
    await step("真实滚轮与键盘使零速粒子跟随页面、返回复原及图片裁剪",async()=>{
      const before=await config(page);
      await scrollSection(page,"life");await visibleImagesReady(page,"life");await settleGeometry(page);
      await configure(page,{averageSpeed:0,interactionStrength:0});
      await page.mouse.move(2,Math.round(viewport.height*.4));await settleGeometry(page);
      const initial=await pixels(page),startY=await page.evaluate(()=>scrollY),frame=(await stats(page)).frameCount;
      await page.mouse.move(viewport.width-2,Math.round(viewport.height*.4));await browserFrames(page,4);
      assert.equal((await pixels(page)).hash,initial.hash,"移动指针仍使整层粒子发生视差");
      await rememberScrollPixels(page);await page.evaluate(()=>{window.__particleScrollOrigin=window.__particleScrollSnapshot;});
      scrollFollow={samples:[]};
      for(const amount of [160,-160]){
        const previousY=await rememberScrollPixels(page);
        await page.mouse.wheel(0,amount);
        await page.waitForFunction(({previousY,amount})=>(scrollY-previousY)*Math.sign(amount)>60,{previousY,amount});
        await settleScroll(page);await settleGeometry(page);
        const evidence=await compareScrollPixels(page);
        assert.ok(evidence.compared>100,"滚动前后共同黑区的粒子像素不足");
        assert.ok(evidence.matched/evidence.compared>.98,"粒子没有按页面实际滚动距离同向平移："+JSON.stringify(evidence));
        assert.equal(evidence.missing,0,"页面平移后预期位置缺少粒子像素");
        assert.ok(Math.abs(evidence.scrollDelta)>=60);assert.equal(evidence.paintScroll,evidence.actualScroll);
        const mask=await assertBlackSurface(page,"life");
        scrollFollow.samples.push({...evidence,imagePixels:mask.imagePixels,outsideSurface:mask.outsideSurface});
      }
      assert.ok(Math.abs(await page.evaluate(()=>scrollY)-startY)<1,"反向滚轮没有返回起点");
      // 导航随滚动方向显隐，遮罩可不同；在共同可见的黑区核对粒子复原。
      await page.evaluate(()=>{window.__particleScrollSnapshot=window.__particleScrollOrigin;});
      const returned=await compareScrollPixels(page);
      assert.ok(returned.compared>100);assert.equal(returned.scrollDelta,0);
      assert.equal(returned.matched,returned.compared,"回到同一页面位置后粒子没有复原");
      assert.equal(returned.maxAlphaDelta,0,"返回相同页面位置后像素强度未复原");
      scrollFollow.returned=returned;
      await page.evaluate(()=>document.activeElement?.blur());
      const previousY=await rememberScrollPixels(page);
      // 持续按键跨过浏览器滚动帧；WebKit 瞬时 down/up 可能不启动原生滚动。
      await page.keyboard.down("ArrowDown");await page.waitForTimeout(180);await page.keyboard.up("ArrowDown");
      await page.waitForFunction(y=>scrollY>y+5,previousY);
      await settleScroll(page);await settleGeometry(page);
      const keyboard=await compareScrollPixels(page);
      assert.ok(keyboard.compared>100);assert.ok(keyboard.matched/keyboard.compared>.98,"键盘滚动未同步粒子");
      assert.equal(keyboard.missing,0,"键盘滚动后预期位置缺少粒子像素");
      scrollFollow.keyboard=keyboard;await assertBlackSurface(page,"life");
      await page.waitForTimeout(150);const stationary=await pixels(page);await browserFrames(page,4);
      assert.equal((await pixels(page)).hash,stationary.hash,"停止滚动后零速粒子仍漂移");
      assert.ok((await stats(page)).meanSpeed<.01);
      if(reduced)assert.equal((await stats(page)).frameCount,frame,"减少动态效果下滚动启动了自主模拟");
      await configure(page,before);await scrollSection(page,"about");
    });
    await step("后台调速、静止与真实鼠标扰动",async()=>{
      const before=await config(page);
      await page.mouse.move(0,0); await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().pointerActive);
      await configure(page,{averageSpeed:0});
      if (!reduced) await particleFrames(page,12); else await browserFrames(page);
      const first=await pixels(page);
      if (!reduced) await particleFrames(page,6); else await browserFrames(page);
      const second=await pixels(page); assert.equal(first.hash,second.hash,"零速度无指针时没有静止");
      assert.ok((await stats(page)).meanSpeed<.01,"零平均速度仍有显著移动");
      const path=await pointerPath(page);
      await page.mouse.move(path.from.x,path.from.y);await page.mouse.move(path.to.x,path.to.y,{steps:12});
      if (!reduced) {
        const active=await stats(page); assert.equal(active.pointerActive,true);
        await particleFrames(page,4); const disturbed=await pixels(page);
        assert.notEqual(disturbed.hash,second.hash,"鼠标移动没有扰动零速粒子"); assert.ok((await stats(page)).meanSpeed>0);
      }
      await configure(page,before); await page.mouse.move(0,0);
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
      await scrollSection(page,"about");await assertBlackSurface(page);
      await page.evaluate(()=>{
        window.__particleMediaChanges=0;
        window.__particleMedia=matchMedia("(prefers-reduced-motion: reduce)");
        window.__particleMedia.addEventListener("change",()=>{window.__particleMediaChanges++;});
      });
      await page.emulateMedia({reducedMotion:reduced?"no-preference":"reduce"});
      await page.waitForFunction(value=>{const state=window.Homepage.particleBackground.getStats();return window.__particleMediaChanges>=1&&state.reducedMotion===value&&state.running===!value;},!reduced);
      assert.equal((await stats(page)).running,reduced); await page.emulateMedia({reducedMotion});
      await page.waitForFunction(value=>{const state=window.Homepage.particleBackground.getStats();return window.__particleMediaChanges>=2&&state.reducedMotion===value&&state.running===!value;},reduced);
      await assertBlackSurface(page);
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
      await scrollSection(page,"about");await assertBlackSurface(page);
    });
    if(!reduced)await step("固定数量实测step/frame性能样本",async()=>{
      await configure(page,{adaptiveQuality:false}); await page.waitForFunction(()=>!window.Homepage.particleBackground.getStats().pointerActive);
      for(let index=0;index<10;index++){await particleFrames(page,2);const state=await stats(page);finiteStats(state);performance.push({count:state.count,frameCount:state.frameCount,stepMs:state.stepMs,frameMs:state.frameMs});}
    });
    assert.deepEqual(errors,[]); assert.deepEqual(blocked,[]);
    return {viewport,reducedMotion,status:"通过",assertions:scope.assertions,steps,screenshots,performance,rendering,scrollFollow,stats:await stats(page),externalRequests:0,realWrites:0};
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
      await heroReady(page);
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
        await scrollSection(page,"about");await assertBlackSurface(page);
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
    const report={date:new Date().toISOString(),passed,sourceUnchanged,prefix:PREFIX,flows,assertions,browsers,limits:["桌面与手机视口/触屏模拟，不等于品牌浏览器版本或手机真机。","visibility使用document属性与事件受控模拟，未测试真实后台标签页功耗。","像素与公共排除矩形在有限CSS过渡结束后比较；合成过渡中的矩形与Canvas可能相差一帧，不代表图片覆盖。","性能为当前Mac/headless环境的step/frame采样，不构成真机FPS保证；像素读取与绘制观察期间不采性能，观察方法在采样前恢复原生。","自适应降级通过180粒子与每帧人工24ms模拟；不计入真实性能样本。","不访问外网、不读取真实作者凭据、不修改正式配置、文章或密文。"]};
    await fs.writeFile(path.join(ROOT,"artifacts/particle-results.json"),JSON.stringify(report,null,2)+"\n");
    console.log("粒子背景测试"+(passed?"全部通过":"存在失败")+"；报告：artifacts/particle-results.json。");if(!passed)process.exitCode=1;
  }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
