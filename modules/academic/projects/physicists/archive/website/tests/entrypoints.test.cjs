'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'website/site');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const load=name=>{const ctx={};vm.runInNewContext(fs.readFileSync(path.join(site,'data',name),'utf8'),ctx);return ctx;};

test('the copied archive entry preserves query and fragment while opening the local website',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),redirects=[];
  const location={search:'?source=entry-check',hash:'#lang=en&year=1964&person=peter-higgs',replace:url=>redirects.push(url)};
  for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))vm.runInNewContext(script,{location});
  assert.deepEqual(redirects,['website/site/index.html'+location.search+location.hash]);
});

test('the English standalone page loads its scripts and styles from the copied module',()=>{
  const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
  assert.match(html,/<html\b[^>]*lang="en"/);
  assert.match(html,/id="people-list"/);assert.match(html,/id="axis-wrap"/);
  assert.doesNotMatch(html,/design-review|\.\.\/dist\/|data-language=|id="sheet-language"/);
  // All static visible text, alternative text and accessibility labels are English.
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g,''),/[\u3400-\u9fff]/);
  const refs=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/gi)].map(m=>m[1]);
  for(const required of ['app.js','styles.css','data/archive.js','data/breakthrough-data.js'])assert.ok(refs.includes(required),required);
  for(const ref of refs){
    assert.doesNotMatch(ref,/^(?:[a-z]+:|\/)/i,ref);
    const file=path.resolve(site,decodeURIComponent(ref.split(/[?#]/)[0]));
    assert.ok(file.startsWith(root+path.sep),ref);
    assert.ok(fs.statSync(file).isFile(),ref);
  }
  const app=fs.readFileSync(path.join(site,'app.js'),'utf8');
  assert.doesNotMatch(app,/\/Users\/|file:\/\/|127\.0\.0\.1|localhost|design-review|\.\.\/dist\//);
});

test('the archive returns directly to the homepage Projects directory without an intermediate project page',()=>{
  const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
  const match=html.match(/<a\b[^>]*href="([^"]*#academic\/projects)"[^>]*>/);
  assert.ok(match,'Missing homepage return link');
  const target=new URL(match[1],'https://example.test/personal-homepage/modules/academic/projects/physicists/archive/website/site/index.html');
  assert.equal(target.pathname,'/personal-homepage/index.html');
  assert.equal(target.hash,'#academic/projects');
  assert.match(html, /title="Back to Projects"/);
  assert.match(html, /aria-hidden="true">←<\/span> Projects<\/a>/);
  assert.doesNotMatch(html, /#academic\/projects\/physicists/);
});

test('all721 independent local portraits retain their audited original bytes and rights notices',()=>{
  const archive=load('archive.js').PHYSICS_ARCHIVE;
  const sources=JSON.parse(fs.readFileSync(path.join(root,'en/data/physicists.json'),'utf8'));
  const byId=new Map(sources.people.map(p=>[p.id,p]));
  assert.equal(archive.count,721);assert.equal(archive.people.length,archive.count);
  const kinds={},rights={};
  for(const p of archive.people){
    const file=path.resolve(site,p.portrait.path),source=byId.get(p.id).portrait;
    assert.equal(file,path.resolve(root,source.local_path),p.id);
    assert.ok(file.startsWith(path.join(root,'portraits')+path.sep),p.id);
    assert.ok(fs.statSync(file).isFile(),p.id);assert.equal(fs.lstatSync(file).isSymbolicLink(),false,p.id);
    assert.equal(hash(file),source.sha256,p.id);
    assert.equal(p.portrait.rightsStatus,source.rights_status||'source_license_recorded',p.id);
    kinds[p.portrait.kind]=(kinds[p.portrait.kind]||0)+1;
    rights[p.portrait.rightsStatus]=(rights[p.portrait.rightsStatus]||0)+1;
  }
  assert.deepEqual(kinds,{portrait:672,posthumous_depiction:29,context_image:20});
  assert.equal(rights.permission_required,62);
});

test('all691 achievement records, complete navigation and English help are packaged with the archive',()=>{
  const archive=load('archive.js').PHYSICS_ARCHIVE;
  const ledger=load('breakthrough-data.js').BREAKTHROUGH_ARCHIVE;
  assert.equal(ledger.events.length,691);assert.equal(new Set(ledger.events.map(e=>e.id)).size,691);
  for(const name of ['events.json','yearly-index.json','navigation-estimates.json','coverage.json','sensitivity.json','method.en.md'])assert.ok(fs.statSync(path.join(site,'data',name)).isFile(),name);
  const annual=JSON.parse(fs.readFileSync(path.join(site,'data/yearly-index.json'),'utf8'));
  assert.equal(annual.methodVersion,'3.0');assert.equal(annual.counts.totalPeople,archive.count);
  assert.equal(annual.counts.navigablePeople,721);assert.equal(Object.keys(ledger.anchors).length,721);
  for(const p of archive.people)assert.ok(ledger.anchors[p.id],p.id);
});
