/* 作者会话离线回归：只读服务源码，随机夹具仅在内存中；fetch 与存储完全模拟，不访问网络。 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../modules/author/session.js'), 'utf8');
const password = crypto.randomBytes(24).toString('base64');
const salt = crypto.randomBytes(16);
const config = {version:1,iterations:600000,salt:salt.toString('base64'),verifier:crypto.pbkdf2Sync(password,salt,600000,32,'sha256').toString('base64'),owner:'PaulLi07',repo:'personal-homepage'};
const key = 'personal-homepage:author-connection:v1';
const repo = '/repos/PaulLi07/personal-homepage';
const file = repo + '/contents/modules/life/moments/posts.js';
const experience = repo + '/contents/modules/academic/experience/entries.js';
const candidate = 'temporary-random-token-' + crypto.randomBytes(18).toString('hex');
let checks = 0;
function test(name, task) { return task().then(() => {checks++; process.stdout.write('通过：' + name + '\n');}); }
function deferred() { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; }
/* 用超时约束挂起请求测试，故障时不让测试无限等待。 */
async function waitForRequest(environment) {
  const deadline = Date.now() + 5000;
  while (environment.requests.length === 0) {
    if (Date.now() > deadline) throw new Error('等待模拟请求超时。');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
function environment(store=new Map(), options={}) {
  const requests=[];
  const events={};
  let mode='owner';
  let pending=null;
  const storage={getItem:k => {if(options.storageFailure) throw Error('blocked'); return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(options.storageFailure)throw Error('blocked');store.set(k,v);},removeItem:k=>{if(options.storageFailure)throw Error('blocked');store.delete(k);}};
  const Homepage={authorConfig:options.config||{...config}};
  const window={Homepage,localStorage:storage,crypto:options.noCrypto?null:crypto.webcrypto,addEventListener:(type,cb)=>{events[type]=cb;}};
  const response=data=>({ok:true,status:200,json:async()=>data});
  const fetch=async(url,settings)=>{
    const path=url.slice('https://api.github.com'.length);
    requests.push({path,settings});
    if(pending) {const paused=pending;pending=null;await paused.promise;}
    if(mode==='network') throw new Error(candidate);
    if(mode==='unauthorized')return {ok:false,status:401,json:async()=>({message:candidate})};
    if(path==='/user') return response({login:mode==='wrong-owner'?'OtherUser':'PaulLi07'});
    if(path===repo) return response({owner:{login:mode==='wrong-repo'?'OtherUser':'PaulLi07'},permissions:{push:mode!=='no-push'}});
    return response({type:'file',sha:'mock-current-sha',content:'W10='});
  };
  vm.runInNewContext(source,{window,fetch,TextEncoder,TextDecoder,Uint8Array,Set,Map,AbortController,DOMException,btoa,atob}, {filename:'session.js'});
  return {session:Homepage.authorSession,store,requests,events,setMode:value=>{mode=value;},pause:value=>{pending=value;}};
}
(async()=>{
  await test('锁定状态拒绝请求，订阅立即返回不含凭据的状态',async()=>{
    const env=environment();let snapshot;const unsubscribe=env.session.subscribe(state=>{snapshot=state;});
    assert.equal(snapshot.unlocked,false);assert.equal(snapshot.connected,false);assert.equal(Object.isFrozen(snapshot),true);
    assert.equal(Object.values(snapshot).some(v=>v===candidate),false);
    await assert.rejects(env.session.request('/user'),/Connect the author/);
    await assert.rejects(env.session.connect(candidate),/Unlock the author/);unsubscribe();assert.equal(env.requests.length,0);
  });
  await test('错误密码不能解锁或触发 GitHub 请求',async()=>{
    const env=environment();await assert.rejects(env.session.unlock('temporary-wrong-password'),/password is incorrect/);
    assert.equal(env.session.isUnlocked(),false);assert.equal(env.requests.length,0);
  });
  await test('缺少 Web Crypto 或配置无效时明确报错',async()=>{
    await assert.rejects(environment(new Map(),{noCrypto:true}).session.unlock(password),/requires Web Crypto/);
    await assert.rejects(environment(new Map(),{config:{...config,owner:'OtherUser'}}).session.unlock(password),/configured correctly/);
  });
  const sharedStore=new Map();const env=environment(sharedStore);
  await test('解锁仅保留内存状态，完成后统一通知一次',async()=>{
    const events=[];env.session.subscribe(state=>events.push(state.event));
    const result=await env.session.unlock(password);assert.equal(result.unlocked,true);assert.equal(result.connected,false);
    assert.equal(sharedStore.size,0);assert.deepEqual(events,[undefined,'unlocked']);
  });
  await test('连接必须通过账号、仓库所有者和写权限校验',async()=>{
    for(const mode of ['wrong-owner','wrong-repo','no-push','unauthorized']){
      env.setMode(mode);await assert.rejects(env.session.connect(candidate));assert.equal(env.session.isConnected(),false);assert.equal(sharedStore.size,0);
    }env.setMode('owner');
  });
  let firstVault;
  await test('记住连接仅存随机盐和 IV 的加密 JSON',async()=>{
    await env.session.connect(candidate,{remember:true});assert.equal(env.session.isConnected(),true);assert.equal(sharedStore.size,1);
    firstVault=JSON.parse(sharedStore.get(key));assert.deepEqual(Object.keys(firstVault).sort(),['ciphertext','iterations','iv','salt','version']);
    assert.equal(sharedStore.get(key).includes(candidate),false);assert.equal(sharedStore.get(key).includes(password),false);
    assert.equal(Buffer.from(firstVault.salt,'base64').length,16);assert.equal(Buffer.from(firstVault.iv,'base64').length,12);
    await env.session.connect(candidate,{remember:true});const next=JSON.parse(sharedStore.get(key));
    assert.notEqual(next.salt,firstVault.salt);assert.notEqual(next.iv,firstVault.iv);assert.notEqual(next.ciphertext,firstVault.ciphertext);
  });
  await test('独立 Web Crypto 实现可解密分域派生的令牌密文',async()=>{
    const vault=JSON.parse(sharedStore.get(key));
    const prefix=Buffer.from('personal-homepage:author:master:v1:');
    const masterBytes=crypto.pbkdf2Sync(password,Buffer.concat([prefix,salt]),600000,32,'sha256');
    const master=await crypto.webcrypto.subtle.importKey('raw',masterBytes,'HKDF',false,['deriveKey']);masterBytes.fill(0);
    const domain='personal-homepage:author:vault:v1:PaulLi07/personal-homepage';
    const aes=await crypto.webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:Buffer.from(vault.salt,'base64'),info:Buffer.from(domain)},master,{name:'AES-GCM',length:256},false,['decrypt']);
    const plain=await crypto.webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(vault.iv,'base64'),additionalData:Buffer.from(domain),tagLength:128},aes,Buffer.from(vault.ciphertext,'base64'));
    assert.equal(JSON.parse(Buffer.from(plain).toString()).token,candidate);assert.equal(aes.extractable,false);assert.equal(master.extractable,false);
  });
  await test('退出清除内存授权并保留选择保存的密文',async()=>{
    const text=sharedStore.get(key);env.session.signOut();assert.equal(env.session.isUnlocked(),false);assert.equal(env.session.isConnected(),false);assert.equal(sharedStore.get(key),text);
    await assert.rejects(env.session.request('/user'),/Connect the author/);
  });
  await test('刷新保持锁定，输入密码后恢复并重验 GitHub 权限',async()=>{
    const fresh=environment(sharedStore);assert.equal(fresh.session.isUnlocked(),false);assert.equal(fresh.session.isConnected(),false);
    const events=[];fresh.session.subscribe(state=>events.push(state.event));const result=await fresh.session.unlock(password);
    assert.equal(result.connected,true);assert.deepEqual(fresh.requests.map(r=>r.path),['/user',repo]);assert.deepEqual(events,[undefined,'unlocked']);
    fresh.session.signOut();
  });
  await test('缓存身份失效时保留解锁并要求重新连接',async()=>{
    const fresh=environment(sharedStore);fresh.setMode('unauthorized');const result=await fresh.session.unlock(password);
    assert.equal(result.unlocked,true);assert.equal(result.connected,false);assert.match(result.restoreError,/could not be restored/);
    assert.equal(result.restoreError.includes(candidate),false);assert.equal(sharedStore.has(key),true);
  });
  await test('篡改密文和无效格式均安全拒绝',async()=>{
    const original=sharedStore.get(key);const vault=JSON.parse(original);const bytes=Buffer.from(vault.ciphertext,'base64');bytes[0]^=1;vault.ciphertext=bytes.toString('base64');
    for(const text of [JSON.stringify(vault),'not-json',JSON.stringify({...JSON.parse(original),iterations:1}),JSON.stringify({...JSON.parse(original),token:candidate})]){
      const store=new Map([[key,text]]);const fresh=environment(store);const result=await fresh.session.unlock(password);
      assert.equal(result.unlocked,true);assert.equal(result.connected,false);assert.match(result.restoreError,/could not be restored/);assert.equal(fresh.requests.length,0);
    }
  });
  await test('不记住连接删除旧密文，忘记连接保留解锁',async()=>{
    await env.session.unlock(password);await env.session.connect(candidate,{remember:false});assert.equal(sharedStore.has(key),false);
    await env.session.connect(candidate,{remember:true});const result=env.session.forgetConnection();assert.equal(result.unlocked,true);assert.equal(result.connected,false);assert.equal(sharedStore.has(key),false);
  });
  await test('请求白名单限制 main 分支并保留远端 SHA',async()=>{
    await env.session.connect(candidate);await env.session.request(file);assert.equal(env.requests.at(-1).path,file+'?ref=main');
    await env.session.request(experience+'?ref=main');
    const count=env.requests.length;
    for(const bad of ['/user?token='+candidate,'https://api.github.com/user',repo+'/contents/README.md',file+'?ref=other',file+'/../posts.js'])await assert.rejects(env.session.request(bad));
    for(const method of ['DELETE','POST','PATCH','get'])await assert.rejects(env.session.request(file,{method}));
    const body={message:'test in memory',branch:'main',sha:'remote-sha-current',content:'W10='};
    await assert.rejects(env.session.request(file,{method:'PUT',body:{...body,branch:'other'}}));
    await assert.rejects(env.session.request(file,{method:'PUT',body:{...body,sha:''}}));
    await assert.rejects(env.session.request(file,{method:'PUT',body:{...body,token:candidate}}));
    assert.equal(env.requests.length,count);
    await env.session.request(experience,{method:'PUT',body});assert.equal(env.requests.at(-1).settings.credentials,'omit');
    assert.deepEqual(JSON.parse(env.requests.at(-1).settings.body),body);
  });
  await test('取消和退出阻止迟到的解锁、连接及请求结果',async()=>{
    const unlocked=environment();const promise=unlocked.session.unlock(password);unlocked.session.signOut();await assert.rejects(promise,error=>error.name==='AbortError');assert.equal(unlocked.session.isUnlocked(),false);
    const connected=environment();await connected.session.unlock(password);const pause=deferred();connected.pause(pause);const pending=connected.session.connect(candidate,{remember:true});connected.session.signOut();pause.resolve();await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(connected.session.isConnected(),false);assert.equal(connected.store.size,0);
    await connected.session.unlock(password);const abort=new AbortController();const pause2=deferred();connected.pause(pause2);const pending2=connected.session.connect(candidate,{signal:abort.signal,remember:true});abort.abort();pause2.resolve();await assert.rejects(pending2,error=>error.name==='AbortError');assert.equal(connected.session.isConnected(),false);assert.equal(connected.store.size,0);
    await connected.session.connect(candidate);const pause3=deferred();connected.pause(pause3);const pending3=connected.session.request(file);connected.session.signOut();pause3.resolve();await assert.rejects(pending3,error=>error.name==='AbortError');assert.equal(connected.session.isUnlocked(),false);
  });
  await test('忘记连接后挂起验证不能恢复旧连接',async()=>{
    const fresh=environment();await fresh.session.unlock(password);const pause=deferred();fresh.pause(pause);const pending=fresh.session.connect(candidate,{remember:true});fresh.session.forgetConnection();pause.resolve();await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(fresh.session.isUnlocked(),true);assert.equal(fresh.session.isConnected(),false);assert.equal(fresh.store.size,0);
  });
  await test('存储不可用时可仅用内存连接，离开页面后锁定',async()=>{
    const fresh=environment(new Map(),{storageFailure:true});const result=await fresh.session.unlock(password);assert.equal(result.unlocked,true);assert.match(result.restoreError,/storage is unavailable/);
    await assert.rejects(fresh.session.connect(candidate,{remember:true}),/could not save/);await fresh.session.connect(candidate);assert.equal(fresh.session.isConnected(),true);
    fresh.events.pagehide();assert.equal(fresh.session.isUnlocked(),false);assert.equal(fresh.session.isConnected(),false);
  });
  await test('缓存解密后取消操作不能激活会话',async()=>{
    const store=new Map();const setup=environment(store);await setup.session.unlock(password);await setup.session.connect(candidate,{remember:true});setup.session.signOut();
    const fresh=environment(store);const pause=deferred();fresh.pause(pause);const abort=new AbortController();const pending=fresh.session.unlock(password,{signal:abort.signal});
    await waitForRequest(fresh);
    abort.abort();pause.resolve();await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(fresh.session.isUnlocked(),false);assert.equal(fresh.session.isConnected(),false);
  });
  await test('恢复缓存时退出，忽略取消的模拟请求也不能激活会话',async()=>{
    const store=new Map();const setup=environment(store);await setup.session.unlock(password);await setup.session.connect(candidate,{remember:true});setup.session.signOut();
    const fresh=environment(store);const pause=deferred();fresh.pause(pause);const pending=fresh.session.unlock(password);
    await waitForRequest(fresh);
    fresh.session.signOut();pause.resolve();await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(fresh.session.isUnlocked(),false);assert.equal(fresh.session.isConnected(),false);
  });
  await test('订阅回调中退出不会与连接激活形成竞态',async()=>{
    const fresh=environment();await fresh.session.unlock(password);fresh.session.subscribe(state=>{if(state.event==='connecting')fresh.session.signOut();});
    await assert.rejects(fresh.session.connect(candidate,{remember:true}),error=>error.name==='AbortError');assert.equal(fresh.session.isUnlocked(),false);assert.equal(fresh.session.isConnected(),false);assert.equal(fresh.requests.length,0);assert.equal(fresh.store.size,0);
  });
  await test('请求返回 401 后保留解锁与密文，取消并发请求并允许重新连接',async()=>{
    const fresh=environment();await fresh.session.unlock(password);await fresh.session.connect(candidate,{remember:true});
    const ciphertext=fresh.store.get(key);let snapshot;fresh.session.subscribe(state=>{snapshot=state;});
    const pause=deferred();fresh.pause(pause);const pending=fresh.session.request(experience);
    fresh.setMode('unauthorized');
    await assert.rejects(fresh.session.request(file),error=>error.status===401 && !error.message.includes(candidate));
    assert.equal(fresh.session.isUnlocked(),true);assert.equal(fresh.session.isConnected(),false);
    assert.equal(snapshot.event,'connection-expired');assert.equal(snapshot.remembered,true);assert.match(snapshot.restoreError,/Connect again/);
    assert.equal(fresh.store.get(key),ciphertext);
    pause.resolve();await assert.rejects(pending,error=>error.name==='AbortError');
    const count=fresh.requests.length;await assert.rejects(fresh.session.request(file),/Connect the author/);assert.equal(fresh.requests.length,count);
    fresh.setMode('owner');await fresh.session.connect(candidate,{remember:true});assert.equal(fresh.session.isConnected(),true);
  });
  await test('忘记连接时存储删除失败如实保留缓存状态并提示',async()=>{
    const options={storageFailure:false};const fresh=environment(new Map(),options);
    await fresh.session.unlock(password);await fresh.session.connect(candidate,{remember:true});const ciphertext=fresh.store.get(key);
    options.storageFailure=true;const result=fresh.session.forgetConnection();
    assert.equal(result.unlocked,true);assert.equal(result.connected,false);assert.equal(result.remembered,true);
    assert.match(result.restoreError,/could not be cleared/);assert.equal(fresh.store.get(key),ciphertext);
  });
  process.stdout.write('作者会话离线测试：'+checks+' 项通过；GitHub 真实远端写入：0。\n');
})().catch(error=>{process.stderr.write('作者会话测试失败：'+error.name+'：'+error.message+'\n');process.exitCode=1;});
