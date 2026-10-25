import {loadCatalog,filterRecords,countRegions} from './data.js';
import {createWorldMap} from './map.js';
import {createArchiveViewer} from './viewer.js';
import {createDossierNavigation,readExperimentId} from './navigation.js';
const $=id=>document.getElementById(id);
const defaults={query:'',category:'all',technology:'all',status:'all',region:'ALL'};
let filters={...defaults},catalog,map,viewer,navigation,timer;
const buttons={category:new Map(),technology:new Map(),region:new Map()};
const labels={all:'All physics categories'};
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
const node=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
function makeButton(group,id,label){
 const b=node('button',label,'btn');b.type='button';b.dataset.value=id;b.setAttribute('aria-pressed','false');
 b.addEventListener('click',()=>{flushSearch();filters[group]=id;if(group!=='region'&&filters.status==='future'){$('status-filter').value='all';filters.status='all';}persist();render();});
 buttons[group].set(id,b);return b;
}
function setup(){
 $('methodology-total').textContent=catalog.record_count;
 const updated=$('catalog-updated');
 if(/^\d{4}-\d{2}-\d{2}$/.test(catalog.updated)){updated.dateTime=catalog.updated;updated.textContent=new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${catalog.updated}T00:00:00Z`));}
 $('nw-filters').append(makeButton('category','all','All physics categories'));
 for(const c of catalog.categories){labels[c.id]=c.label;$('nw-filters').append(makeButton('category',c.id,c.label));}
 $('nw-tech-filters').append(makeButton('technology','all','All technologies'));
 for(const t of catalog.technologies){labels[t.id]=t.label;$('nw-tech-filters').append(makeButton('technology',t.id,t.label));}
 const oldZeros=[['UKR','Ukraine'],['BEL','Belgium'],['GRC','Greece']];
 for(const[id,label]of oldZeros)if(!catalog.regions.some(r=>r.id===id))catalog.regions.push({id,label,label_en:label,kind:'country'});
 const order=['EUROPE','USA','CHN','JPN','KOR','CAN','RUS','UKR','FRA','ITA','DEU','CHE','ESP','BEL','GBR','GRC','BRA','SWE','IND','GRL','ARG','ATA','AUT','AUS','CHL','MEX','NAM','NZL','SPACE','GLOBAL','UNSITED'];
 $('nw-country-buttons').append(makeButton('region','ALL','All countries and regions'));
 for(const id of new Set([...order,...catalog.regions.map(r=>r.id)])){const r=catalog.regions.find(x=>x.id===id);if(r)$('nw-country-buttons').append(makeButton('region',id,r.label));}
 $('status-filter').append(new Option('All statuses','all'),new Option('Under construction / future','future'));
 for(const s of catalog.statuses)$('status-filter').append(new Option(s.label,s.id));
 $('search').addEventListener('input',()=>{clearTimeout(timer);filters.query=$('search').value.trim();timer=setTimeout(()=>{timer=null;persist({replace:true});render();},120);});
 $('status-filter').addEventListener('change',e=>{const next=e.target.value;flushSearch();filters.status=next;persist();render();});
 $('sort-order').addEventListener('change',()=>{flushSearch();persist();renderList();});
 $('nw-future').addEventListener('click',()=>{flushSearch();filters.status=filters.status==='future'?'all':'future';filters.category='all';filters.technology='all';$('status-filter').value=filters.status;persist();render();});
 $('reset-filters').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!viewer.isOpen()&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();$('methodology').open=true;$('search').focus();}});
 syncControls();
}
function restore(){const p=new URLSearchParams(location.search);filters={query:p.get('q')||'',category:p.get('category')||'all',technology:p.get('technology')||'all',status:p.get('status')||'all',region:p.get('region')||'ALL'};$('sort-order').value=p.get('sort')==='year'?'year':'name';}
function syncControls(){
 for(const k of ['category','technology','region'])if(!buttons[k].has(filters[k]))filters[k]=defaults[k];
 if(!Array.from($('status-filter').options).some(o=>o.value===filters.status))filters.status='all';
 $('search').value=filters.query;$('status-filter').value=filters.status;
 if(filters.query||!['all','future'].includes(filters.status)||$('sort-order').value==='year')$('methodology').open=true;
}
function persist({replace=false}={}){const url=new URL(location.href);for(const [k,param]of Object.entries({query:'q',category:'category',technology:'technology',status:'status',region:'region'})){if(filters[k]===defaults[k])url.searchParams.delete(param);else url.searchParams.set(param,filters[k]);}if($('sort-order').value==='year')url.searchParams.set('sort','year');else url.searchParams.delete('sort');if(url.href!==location.href)history[replace?'replaceState':'pushState'](history.state,'',url);}
function flushSearch(){if(timer){clearTimeout(timer);timer=null;const url=new URL(location.href);if(filters.query)url.searchParams.set('q',filters.query);else url.searchParams.delete('q');if(url.href!==location.href)history.replaceState(history.state,'',url);render();}}
function reset(){clearTimeout(timer);timer=null;filters={...defaults};$('search').value='';$('status-filter').value='all';$('sort-order').value='name';persist();render();}
function render(){
 const base=filterRecords(catalog.records,{...filters,region:'ALL'}),counts=countRegions(base,catalog.regions);
 for(const group of ['category','technology'])for(const [id,b]of buttons[group])b.setAttribute('aria-pressed',String(filters[group]===id));
 for(const[id,b]of buttons.region){const label=id==='ALL'?'All countries and regions':catalog.regions.find(r=>r.id===id)?.label||id;b.textContent=`${label} ${counts[id]||0}`;b.setAttribute('aria-pressed',String(filters.region===id));}
 $('nw-future').setAttribute('aria-pressed',String(filters.status==='future'));
 $('nw-total').textContent=`${base.length} distinct ${filters.status==='future'?'future-project':'catalog'} entries`;
 map?.update({counts,selected:filters.region,regions:catalog.regions});renderList();
}
function renderList(){
 const focusedId=document.activeElement?.dataset?.experiment;
 const rows=filterRecords(catalog.records,filters).sort((a,b)=>$('sort-order').value==='year'?(b.year||0)-(a.year||0)||collator.compare(a.name,b.name):collator.compare(a.name,b.name));
 const region=catalog.regions.find(r=>r.id===filters.region)?.label||'All countries and regions';
 const category=filters.category==='all'?'All physics categories':labels[filters.category];
 const tech=filters.technology==='all'?'All technologies':labels[filters.technology];
 $('nw-name').textContent=`${region} · ${rows.length} ${rows.length===1?'experiment':'experiments'} · ${category} · ${tech}`;
 const fragment=document.createDocumentFragment();
 for(const row of rows){const b=node('button',row.name,'nw-experiment-row');b.type='button';b.dataset.experiment=row.id;b.setAttribute('aria-label',`${row.name}: open experiment dossier`);b.addEventListener('click',()=>{flushSearch();viewer.open(row.id);});fragment.append(b);}
 $('nw-list').replaceChildren(fragment);$('nw-list').scrollTop=0;$('empty-state').hidden=rows.length>0;
 if(focusedId&&!viewer.isOpen())([...$('nw-list').children].find(b=>b.dataset.experiment===focusedId)||$('nw-name')).focus({preventScroll:true});
}
function navigate(id){$('route-notice').hidden=true;if(id)navigation.open(id);else navigation.close();}
function applyHash(){
 $('route-notice').hidden=true;
 if(!location.hash.startsWith('#experiment=')){viewer?.close({updateHistory:false});return;}
 const id=readExperimentId(location.hash);
 if(id&&catalog.records.some(r=>r.id===id)){navigation.normalize();if(!viewer.isOpen()||viewer.currentId()!==id)viewer.open(id,{updateHistory:false});}
 else{viewer.close({updateHistory:false});$('route-notice').hidden=false;}
}
async function boot(){
 if(location.protocol==='file:')return;
 try{
  restore();catalog=await loadCatalog();navigation=createDossierNavigation({history,getURL:()=>location.href,isKnown:id=>catalog.records.some(r=>r.id===id)});viewer=createArchiveViewer({catalog,onNavigate:navigate});setup();
  $('filters').hidden=false;$('atlas-content').hidden=false;$('loading-message').hidden=true;render();
  map=await createWorldMap($('world-map'),{onSelect:id=>{flushSearch();filters.region=id;persist();render();}});render();
  window.addEventListener('hashchange',applyHash);
  window.addEventListener('popstate',()=>{clearTimeout(timer);timer=null;restore();syncControls();render();applyHash();});
  applyHash();document.documentElement.dataset.ready='true';
 }catch(e){$('loading-message').hidden=true;$('load-error').hidden=false;$('error-message').textContent=`The map could not be loaded. Check your connection and select Retry. ${e.message}`;console.error(e);}
}
$('retry-load').addEventListener('click',()=>location.reload());boot();
