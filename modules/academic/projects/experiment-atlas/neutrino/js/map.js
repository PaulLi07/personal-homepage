/* Same geographic paths, projection, labels and styling as the supplied EN map. */
const NS='http://www.w3.org/2000/svg';
const node=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
export async function createWorldMap(container,{onSelect=()=>{}}={}){
 const urls=['../assets/world-map.svg','../data/map-labels.json','../assets/europe-outline.json'];
 const responses=await Promise.all(urls.map(p=>fetch(new URL(p,import.meta.url))));
 if(responses.some(r=>!r.ok))throw new Error('The local world map could not be loaded.');
 const [source,definitions,geometry]=await Promise.all([responses[0].text(),responses[1].json(),responses[2].json()]);
 const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
 const svg=document.importNode(parsed.documentElement,true);svg.setAttribute('viewBox','0 0 1000 500');svg.setAttribute('aria-label','Neutrino experiments by country');
 const sourceTitle=svg.querySelector(':scope > title');if(sourceTitle)sourceTitle.textContent='Neutrino experiments by country';
 const countries=[...svg.querySelectorAll('path[data-iso]')];
 for(const p of countries){p.setAttribute('class','nw-country');p.setAttribute('role','button');}
 const outline=node('svg',{class:'nw-europe-outline',viewBox:'0 0 1000 500','aria-hidden':'true',hidden:''});outline.append(node('path',{d:geometry.path}));
 const labels=node('svg',{class:'nw-region-labels',viewBox:'0 0 1000 500',role:'group','aria-label':'Country shortcuts'});
 const rendered=definitions.map(r=>{
  const g=node('g',{class:'nw-region-label','data-region':r.iso});if(r.line)g.append(node('polyline',{points:r.line,class:'nw-label-leader'}));
  const t=node('text',{x:r.x,y:r.y,'text-anchor':r.align||'middle','dominant-baseline':'middle',role:'button',tabindex:'0','data-region':r.iso});
  const name=node('tspan',{class:'nw-label-name'});name.textContent=r.name;
  const count=node('tspan',{class:'nw-label-count',dx:5});t.append(name,count);g.append(t);labels.append(g);t.addEventListener('click',()=>onSelect(r.iso));t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.iso);}});return{...r,g,count,text:t};
 });
 container.replaceChildren(svg,outline,labels);
 let state={counts:{},selected:'ALL',regions:[]};
 const isoFor=p=>p.dataset.iso;
 const choose=p=>{const iso=isoFor(p);if((state.counts[iso]||0)>0||state.selected===iso)onSelect(iso);};
 for(const p of countries){p.addEventListener('click',()=>choose(p));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(p);}});}
 const viewport=container.parentElement;
 const resize=()=>viewport.classList.toggle('is-scrollable',viewport.scrollWidth>viewport.clientWidth+1);
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(viewport);resize();
 function update(next){
  state={...state,...next};const byId=new Map(state.regions.map(r=>[r.id,r]));
  countries.forEach(p=>{
   const iso=isoFor(p),n=state.counts[iso]||0,label=byId.get(iso)?.label||p.dataset.iso;
   p.classList.toggle('has-data',n>0);p.classList.toggle('selected',iso===state.selected);
   p.style.fillOpacity=n?(n<5?.22:n<10?.45:n<20?.65:.9):1;
   p.setAttribute('tabindex',n>0||state.selected===iso?'0':'-1');p.setAttribute('aria-pressed',String(iso===state.selected));
   p.setAttribute('aria-label',`${label}: ${n} ${n===1?'experiment':'experiments'}`);
   let title=p.querySelector('title');if(!title){title=node('title');p.append(title);}title.textContent=`${label}: ${n} ${n===1?'experiment':'experiments'}`;
  });
  for(const r of rendered){const n=state.counts[r.iso]||0;r.count.textContent=n;r.text.setAttribute('aria-label',`${byId.get(r.iso)?.label||r.name}: ${n} ${n===1?'experiment':'experiments'}`);r.g.classList.toggle('is-empty',!n);r.g.classList.toggle('is-selected',state.selected===r.iso);}
  outline.toggleAttribute('hidden',state.selected!=='EUROPE');
 }
 return {update,resetView:()=>{viewport.scrollLeft=0;},destroy:()=>{observer?.disconnect();container.replaceChildren();}};
}
