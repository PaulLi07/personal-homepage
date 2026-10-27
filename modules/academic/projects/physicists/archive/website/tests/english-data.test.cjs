/* English-only migration invariants, captured before the approved architecture refactor. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),ctx={};
for(const name of ['archive','breakthrough-data'])vm.runInNewContext(fs.readFileSync(path.join(root,'website/site/data/'+name+'.js'),'utf8'),ctx);
const record=JSON.parse(fs.readFileSync(path.join(root,'data/english-transition.json'),'utf8'));
const added=new Set(['browseDomains','navigationFields','navigationYearClues','navigationSourceUrls','lastKnownYear']);
function normalized(value){
  if(Array.isArray(value))return Array.from(value,normalized);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(key=>key!=='zh'&&!added.has(key)).sort().map(key=>[key,typeof value[key]==='string'&&key==='title'?value[key].replace(/（[^（）]*[\u3400-\u9fff][^（）]*）|\([^()]*[\u3400-\u9fff][^()]*\)/g,'').trim():normalized(value[key])]));
  return value;
}
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function assertEnglishKeys(value){
  if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){assert.notEqual(key,'zh');assert.ok(!key.endsWith('_zh'));assertEnglishKeys(item);}
}
test('one English edition is maintained and generated; no translated corpus or selector remains',()=>{
  assert.equal(fs.existsSync(path.join(root,'zh')),false);
  assertEnglishKeys(ctx.PHYSICS_ARCHIVE);assertEnglishKeys(ctx.BREAKTHROUGH_ARCHIVE);
  for(const name of fs.readdirSync(path.join(root,'data/breakthrough')).filter(name=>name.endsWith('.json')))assertEnglishKeys(JSON.parse(fs.readFileSync(path.join(root,'data/breakthrough',name),'utf8')));
  const report=JSON.parse(fs.readFileSync(path.join(root,'website/site/build-report.json'),'utf8'));
  assert.deepEqual(report.sourceLanguages,['en']);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'website/site/app.js'),'utf8'),/\bzh\s*:|lang\s*===\s*['"]zh/);
});
test('the English archive, event science, date models, source URLs, order and floating values match the pre-refactor baseline',()=>{
  for(const name of ['PHYSICS_ARCHIVE','BREAKTHROUGH_ARCHIVE'])assert.equal(digest(normalized(ctx[name])),record.semanticDigests[name],name);
});
test('reviewed browse-domain membership stays identical after removing translated fields',()=>{
  const core=require('../src/core.js');
  const memberships=core.domains.map(domain=>[domain.id,Array.from(core.filterPeople(ctx.PHYSICS_ARCHIVE.people,{query:'',field:domain.id}),person=>person.id)]);
  assert.equal(digest(memberships),record.semanticDigests.browseDomains);
});
