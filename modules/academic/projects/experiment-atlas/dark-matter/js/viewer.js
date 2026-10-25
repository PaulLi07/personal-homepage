/** Illustrated English dossiers. Full records remain independent per experiment. */
const STATUS={operating:'Operating / data analysis',completed:'Completed',construction:'Under construction',commissioning:'Commissioning',planned:'Planned',proposed:'Proposed',research_development:'Research and development',mixed:'Multiple stages',unknown:'Status not established'};
const ROLE={dedicated:'Dedicated search',multipurpose:'Multipurpose facility',proposal:'Proposal',technology_demonstrator:'Technology demonstrator'};
const KIND={photograph:'Photograph',design_diagram:'Design / apparatus diagram',paper_figure:'Figure from a publication or report'};
const arr=v=>Array.isArray(v)?v:[];
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const btn=(label,cls,click)=>{const n=el('button',label,cls);n.type='button';if(click)n.addEventListener('click',click);return n;};
function webURL(s){try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
function link(label,url,cls=''){const n=el('a',label,cls);const safe=webURL(url);if(safe){n.href=safe;n.target='_blank';n.rel='noopener noreferrer';}return n;}
function p(parent,text,cls=''){if(text)parent.append(el('p',text,cls));}
function chips(parent,values){if(!arr(values).length)return;const wrap=el('div','','dm-chips');for(const v of values)wrap.append(el('span',v,'dm-chip'));parent.append(wrap);}
function displayCredit(value){
 // Keep authors and institutions; archival review commentary stays in the JSON.
 const audit=/\b(?:no (?:individual|separate)|(?:provides|has) no separate|does not (?:identify|name)|names no individual|is not identified|original photographer not identified|without a separate photographer|photographer credit follows|see the (?:original media page|source) for)\b/i;
 return String(value||'').split(/\s*;\s*|\.\s+(?=(?:No (?:individual|separate)|See the source)\b)/i)
  .filter(clause=>!audit.test(clause))
  .map(clause=>clause
   .replace(/,\s*(?:explicitly |as )?credited (?:for Image_13\.JPG in the official gallery|in the MPP image alternative text|on the official page|in the official IPMU article)\.?$/i,'')
   .replace(/,\s*original image-caption credit$/i,'')
   .replace(/\bthe page credits adaptation from\b/i,'adapted from')
   .replace(/^Source-paper authors$/i,'Authors of the cited publication')
   .replace(/^Original paper\/report authors and collaboration$/i,'Authors of the cited publication and collaboration')
   .replace(/[.\s]+$/,''))
  .filter(Boolean).join('; ');
}
function displayCaption(value){return String(value||'')
 .replace(/\s*Source PDF p\.\s*\d+\.?\s*$/i,'')
 .replace(/, extracted from a 2024 archive of an author's university webpage\.?$/i,'.').trim();}
let instance=0;
export function createArchiveViewer({catalog,onNavigate}={}){
 const prefix=`dm-dossier-${++instance}`,byId=new Map(catalog.records.map(r=>[r.id,r]));
 const names=new Map();for(const r of catalog.records)for(const n of [r.name,r.full_name,r.id,...arr(r.aliases)])names.set(n.toLowerCase(),r.id);
 const categories=Object.fromEntries(catalog.categories.map(c=>[c.id,c.label]));
 const cache=new Map();let aborter,turn=0,current=null,focusBefore=null,openerId=null,imageFocus=null,destroyed=false;
 const dialog=el('dialog','','dm-archive-dialog');dialog.setAttribute('aria-labelledby',`${prefix}-title`);
 const header=el('header','','dm-viewer-header'),heading=el('div','','dm-viewer-heading');
 const title=el('h2');title.id=`${prefix}-title`;const subtitle=el('p','','dm-viewer-subtitle');
 heading.append(el('p','DARK MATTER · EXPERIMENT DOSSIER','dm-viewer-eyebrow'),title,subtitle);
 const closeButton=btn('×','dm-viewer-close',()=>close());closeButton.setAttribute('aria-label','Close experiment dossier');closeButton.title='Close (Esc)';header.append(heading,closeButton);
 const nav=el('nav','','dm-viewer-nav');nav.setAttribute('aria-label','Dossier sections');
 const body=el('div','','dm-viewer-body'),live=el('div','','dm-visually-hidden');live.setAttribute('role','status');live.setAttribute('aria-live','polite');dialog.append(header,nav,body,live);
 const lightbox=el('dialog','','dm-image-dialog');lightbox.setAttribute('aria-label','Representative image, enlarged');
 const lightHead=el('div','','dm-image-header'),lightTitle=el('strong'),lightClose=btn('×','dm-viewer-close',closeImage);lightClose.setAttribute('aria-label','Close enlarged image');lightHead.append(lightTitle,lightClose);
 const lightImage=el('img','','dm-image-original'),lightCaption=el('p','','dm-image-caption');lightbox.append(lightHead,lightImage,lightCaption);document.body.append(dialog,lightbox);
 const originalURL=row=>new URL(row.record_path,document.baseURI);
 const englishURL=row=>new URL(row.english_record_path||`data/experiments/${row.id}.en.json`,document.baseURI);
 const jumpTo=target=>target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 function restoreFocus(){const fallback=[...document.querySelectorAll('#nw-list [data-experiment]')].find(b=>b.dataset.experiment===openerId)||document.getElementById('nw-name');const target=focusBefore?.isConnected&&focusBefore!==document.body?focusBefore:fallback;target?.focus({preventScroll:true});}
 function closeImage(){if(lightbox.open)lightbox.close();lightImage.removeAttribute('src');if(imageFocus?.isConnected)imageFocus.focus({preventScroll:true});}
 function expand(url,media,name,trigger){imageFocus=trigger;lightTitle.textContent=`${name} · Representative image`;lightImage.src=url.href;lightImage.alt=displayCaption(media.caption)||`${name} detector`;lightCaption.textContent=displayCaption(media.caption);lightbox.showModal();lightClose.focus({preventScroll:true});}
 for(const [d,handler]of [[lightbox,closeImage],[dialog,()=>lightbox.open?closeImage():close()]]){
  d.addEventListener('cancel',e=>{e.preventDefault();handler();});
  d.addEventListener('click',e=>{if(e.target!==d)return;const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)handler();});
 }
 function render(record,row){
  title.textContent=record.name;subtitle.textContent=record.full_name!==record.name?record.full_name:'';body.replaceChildren();nav.replaceChildren();live.textContent=`${record.name} dossier loaded`;
  const layout=el('div','','dm-dossier-layout'),aside=el('aside','','dm-photo-column'),dossier=el('div','','dm-dossier-content');
  aside.setAttribute('aria-label','Representative detector image');
  const references=[],refByURL=new Map(),refById=new Map();
  function addRef(url,title,date=null){const safe=webURL(url);if(!safe)return null;if(refByURL.has(safe))return refByURL.get(safe);const n=references.length+1;references.push({n,url:safe,title,date});refByURL.set(safe,n);return n;}
  for(const s of arr(record.sources)){const n=addRef(s.url,s.title,s.source_date);if(n)refById.set(s.id,n);}
  const media=arr(record.media).find(m=>m.local_path);
  const imageCredit=media?displayCredit(media.credit):'';
  const imageRef=media?addRef(media.source_url,`Representative image: ${record.name}${imageCredit?`. ${imageCredit}`:''}`,null):null;
  if(imageRef&&imageCredit){const ref=references[imageRef-1];if(!ref.title.includes(imageCredit))ref.title+=`. Image: ${imageCredit}`;}
  for(const url of arr(record.resources?.publication_links))addRef(url,`Additional collaboration publication or report (${new URL(url).hostname})`);
  function citeNumbers(numbers){const unique=[...new Set(numbers.filter(Boolean))];if(!unique.length)return null;const span=el('span','','dm-source-refs');
   for(const n of unique){const b=btn(`[${n}]`,'dm-source-ref',()=>{const target=document.getElementById(`${prefix}-reference-${n}`);jumpTo(target);target?.focus({preventScroll:true});});b.setAttribute('aria-label',`Reference ${n}`);span.append(b);}return span;
  }
  function cite(parent,ids){const c=citeNumbers(arr(ids).map(id=>refById.get(id)));if(c)parent.append(c);}
  function section(id,label){const s=el('section','','dm-dossier-section');s.id=`${prefix}-${id}`;s.append(el('h3',label));dossier.append(s);nav.append(btn(label,'dm-section-jump',()=>jumpTo(s)));return s;}
  function fact(parent,key,value){if(value===null||value===undefined||value==='')return;const r=el('div','','dm-fact');r.append(el('dt',key),el('dd',String(value)));parent.append(r);}
  if(media){
   const url=new URL(media.local_path,originalURL(row)),figure=el('figure','','dm-representative'),imageButton=btn('','dm-photo-button');imageButton.setAttribute('aria-label',`Enlarge ${record.name} image`);
   const image=el('img','','dm-representative-image');image.src=url.href;image.alt=displayCaption(media.caption)||`${record.name} detector`;image.decoding='async';if(media.width)image.width=media.width;if(media.height)image.height=media.height;
   imageButton.append(image,el('span','⤢ Enlarge','dm-expand-hint'));imageButton.addEventListener('click',()=>expand(url,media,record.name,imageButton));
   image.addEventListener('error',()=>{imageButton.disabled=true;imageButton.replaceChildren(el('span','The image could not be loaded.','dm-image-error'));});
   const caption=el('figcaption');caption.append(el('span',KIND[media.kind]||'Representative image','dm-media-kind'));p(caption,displayCaption(media.caption),'dm-photo-caption');
   const c=citeNumbers([imageRef]);if(c)(caption.querySelector('.dm-photo-caption')||caption).append(c);figure.append(imageButton,caption);aside.append(figure);
  }
  const actions=el('div','','dm-archive-actions');
  if(webURL(record.resources?.official_website))actions.append(link('Project website ↗',record.resources.official_website,'dm-action-link dm-action-primary'));
  const copy=btn('Copy dossier link','dm-action-link',async()=>{const u=new URL(location.href);u.hash=`experiment=${record.id}`;try{await navigator.clipboard.writeText(u.href);copy.textContent='Link copied';}catch{const input=el('input','','dm-copy-field');input.value=u.href;input.readOnly=true;input.setAttribute('aria-label','Dossier link');copy.replaceWith(input);input.focus();input.select();}});
  const download=el('a','Download data ↓','dm-action-link');download.href=englishURL(row).href;download.download=`${record.id}.en.json`;actions.append(copy,download);aside.append(actions);

  const overview=section('overview','Overview');p(overview,record.summary,'dm-record-summary');
  const badges=el('div','','dm-chips');badges.append(el('span',STATUS[record.status?.code]||'Status not established',`dm-chip dm-status dm-status-${record.status?.code||'unknown'}`));if(ROLE[record.role])badges.append(el('span',ROLE[record.role],'dm-chip'));overview.append(badges);
  const facts=el('dl','','dm-facts');fact(facts,'Full name',record.full_name);if(arr(record.aliases).length)fact(facts,'Also known as',record.aliases.join(' / '));fact(facts,'Search approach',categories[record.category]);if(record.status?.as_of)fact(facts,'Status as of',record.status.as_of);overview.append(facts);
  if(record.status?.evidence){const status=el('div','','dm-status-evidence');p(status,record.status.evidence);cite(status,record.status.source_ids);overview.append(status);}
  overview.append(el('h4','Location'));
  for(const s of arr(record.sites)){const site=el('div','','dm-site-card');site.append(el('strong',s.name));p(site,[s.country,s.location&&s.location!==s.name?s.location:null].filter(Boolean).join(' · '));
   if(typeof s.latitude==='number'&&typeof s.longitude==='number'&&!/unverified|not_verified|unknown/i.test(s.precision||''))p(site,`${s.latitude}°, ${s.longitude}°`,'dm-site-note');overview.append(site);}
  if(record.collaboration?.name||arr(record.collaboration?.lead_institutions).length){overview.append(el('h4','Collaboration'));p(overview,record.collaboration?.name);chips(overview,record.collaboration?.lead_institutions);}

  const science=section('science','Detector and science');science.append(el('h4','Physics targets'));chips(science,record.physics_targets);science.append(el('h4','How the experiment works'));p(science,record.detection_principle);science.append(el('h4','Detector technologies'));chips(science,record.technologies);
  if(record.science_scope){science.append(el('h4','Dark-matter connection'));p(science,record.science_scope);}
  if(arr(record.key_parameters).length){science.append(el('h4','Key parameters'));const params=el('dl','','dm-parameters');for(const k of record.key_parameters){const item=el('div','','dm-parameter');item.append(el('dt',k.name),el('dd',k.value));cite(item,k.source_ids);params.append(item);}science.append(params);}
  const hasProgramme=arr(record.phases).length||arr(record.timeline).length||arr(record.results).length||arr(record.related_experiments).length||arr(record.resources?.data_links).length;
  if(hasProgramme){
   const programme=section('programme','Programme and results');
   if(arr(record.phases).length){programme.append(el('h4','Phases and subprojects'));for(const ph of record.phases){const card=el('article','','dm-phase-card');card.append(el('strong',ph.name),el('span',STATUS[ph.status]||(ph.status==='stage_not_reverified'?'Status not established':ph.status),'dm-phase-status'));p(card,ph.description);programme.append(card);}}
   function chronology(entries,field,label){if(!arr(entries).length)return;programme.append(el('h4',label));const ol=el('ol','','dm-timeline');for(const e of entries){const li=el('li');if(e.date)li.append(el('div',e.date,'dm-date'));p(li,e[field]);cite(li,e.source_ids);ol.append(li);}programme.append(ol);}
   chronology(record.timeline,'event','Milestones');chronology(record.results,'summary','Selected results');
   if(arr(record.related_experiments).length){programme.append(el('h4','Related experiments'));const related=el('div','','dm-chips');for(const n of record.related_experiments){const id=names.get(n.toLowerCase());related.append(id&&id!==record.id?btn(n,'dm-chip dm-related-link',()=>open(id)):el('span',n,'dm-chip'));}programme.append(related);}
   if(arr(record.resources?.data_links).length){programme.append(el('h4','Data and software'));const ul=el('ul','','dm-resource-list');for(const url of record.resources.data_links){const item=el('li');item.append(link(new URL(url).hostname,url));ul.append(item);}programme.append(ul);}
  }
  const refs=section('references','References'),ol=el('ol','','dm-paper-references');
  for(const r of references){const li=el('li','','dm-paper-reference');li.id=`${prefix}-reference-${r.n}`;li.tabIndex=-1;li.append(el('span',`[${r.n}]`,'dm-reference-number'));
   const content=el('span');content.append(link(r.title,r.url));if(r.date)content.append(document.createTextNode(` (${r.date}).`));li.append(content);ol.append(li);}
  refs.append(ol);layout.append(aside,dossier);body.append(layout);body.scrollTop=0;
 }
 function renderError(row,error){nav.replaceChildren();body.replaceChildren();const box=el('div','','dm-viewer-error');box.setAttribute('role','alert');box.append(el('h3','This dossier could not be loaded'));p(box,'Check your connection and try again.');box.append(btn('Retry','dm-action-link dm-action-primary',()=>open(row.id,{updateHistory:false})));p(box,error.message,'dm-error-detail');body.append(box);live.textContent='Dossier loading failed';}
 async function open(id,{updateHistory=true}={}){
  if(destroyed||!byId.has(id))return false;const row=byId.get(id);aborter?.abort();aborter=new AbortController();const signal=aborter.signal,number=++turn;current=id;
  if(lightbox.open)closeImage();if(!dialog.open){focusBefore=document.activeElement;openerId=focusBefore?.dataset.experiment||id;dialog.showModal();}closeButton.focus({preventScroll:true});title.textContent=row.name;subtitle.textContent=row.full_name;nav.replaceChildren();body.replaceChildren(el('div','Loading experiment dossier…','dm-viewer-loading'));
  if(updateHistory)onNavigate?.(id);
  try{let record=cache.get(id);if(!record){const response=await fetch(englishURL(row),{signal,cache:'no-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);record=await response.json();if(record.id!==id)throw new Error('The dossier identifier does not match the catalog.');cache.set(id,record);}if(number!==turn||signal.aborted||!dialog.open)return false;render(record,row);return true;}
  catch(e){if(number!==turn||signal.aborted||e.name==='AbortError')return false;renderError(row,e);return false;}
 }
 function close({updateHistory=true}={}){if(!dialog.open)return;aborter?.abort();turn++;closeImage();dialog.close();current=null;if(updateHistory)onNavigate?.(null);restoreFocus();}
 function destroy(){close({updateHistory:false});destroyed=true;dialog.remove();lightbox.remove();cache.clear();}
 return{open,close,isOpen:()=>dialog.open,currentId:()=>current,destroy};
}
