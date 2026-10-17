const TRANSPARENT="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
function bu(id){return id&&window.__bu?window.__bu(id):TRANSPARENT}

const COLLARS=[
 {id:"red",name:"Червена",hex:"#d23c3c"},{id:"blue",name:"Синя",hex:"#2f6fd6"},{id:"green",name:"Зелена",hex:"#2e9d55"},
 {id:"yellow",name:"Жълта",hex:"#e2b714"},{id:"orange",name:"Оранжева",hex:"#e8782a"},{id:"purple",name:"Лилава",hex:"#8a4fd0"},
 {id:"pink",name:"Розова",hex:"#e0609a"},{id:"teal",name:"Тюркоазена",hex:"#1aa6a6"},{id:"navy",name:"Тъмносиня",hex:"#1f3a7a"},
 {id:"lime",name:"Лайм",hex:"#8bc34a"},{id:"brown",name:"Кафява",hex:"#8a5a36"},{id:"grey",name:"Сива",hex:"#8c8c8c"},
 {id:"black",name:"Черна",hex:"#222222"},{id:"white",name:"Бяла",hex:"#f4f4f4"}];
const collar=id=>COLLARS.find(c=>c.id===id)||{id:"",name:"Без каишка",hex:"#9aa",none:true};
const LOST_REASONS=["Недоразвито","Stillborn"];
const COATS=["Червено/бяло","Трицветно с червена глава","Трицветно с черна глава"];
const TAILS=["Дълга опашка","Боб тейл – къс","Боб тейл – 1/3","Боб тейл – 1/2","Боб тейл – 2/3"];
const optList=(arr,v)=>`<option value="" ${!v?"selected":""}>— избери —</option>`+arr.map(o=>`<option ${v===o?"selected":""}>${o}</option>`).join("");
const SPARE=["#6b7f99","#9b7a5a","#5f8f7d","#a07090","#7d7aa8","#8c8a4e","#b07a5c","#4f8aa0"];
function pc(p){const c=collar(p.collar);if(!c.none)return {hex:c.hex,none:false,name:c.name};return {hex:SPARE[((p.order||1)-1)%SPARE.length],none:true,name:"Без каишка"}}
function dotH(p,tag="span"){const c=pc(p);return c.none?`<${tag} class="dot nc" style="border-color:${c.hex}" title="Без каишка"></${tag}>`:`<${tag} class="dot" style="background:${c.hex}" title="${c.name} каишка"></${tag}>`}

const S={info:null,puppies:[],weights:[],loaded:{i:0,p:0,w:0},tab:"today",date:todayStr(),mode:"g",all:[],viewer:false,admin:true,isOwner:false,vdoc:null,vSel:null,viewerMsg:"",dzExisting:new Set(),dzLoaded:false,evLoaded:false,prof:{},accSearch:null,accRes:[],litterEdit:false,ownerOpen:null,ownerEdit:null,dossier:null,deworm:[],events:[],evType:"walk",evDate:null,dwSel:null,dwConfirm:null,open:new Set(),foldBA:true,fcEdit:false,dateAuto:true,drafts:{},bd:{},fcd:null,edit:null,confirmDel:null,canWrite:true,noDb:false};
let db=null,USER=null;

/* ---------- helpers ---------- */
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function shiftDate(s,n){const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dayDiff(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/864e5)}
function fmtDate(s){if(!s)return"—";const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}
function dateField(id,iso,attrs="",raw){return `<span class="dfield"><input id="${id}" type="text" inputmode="numeric" placeholder="дд/мм/гггг" value="${esc(raw!=null?raw:dmy(iso))}" ${attrs}><span class="cal" title="Избери от календар"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><input type="date" id="${id}_cal" data-for="${id}" value="${esc(iso||"")}" tabindex="-1" aria-label="Избери от календар" ${attrs.includes("disabled")?"disabled":""}></span></span>`}
function parseHM(t){t=String(t||"").trim();if(!t)return"";let m=t.match(/^(\d{1,2})[:.,\s](\d{1,2})$/)||t.match(/^(\d{1,2})(\d{2})$/);if(!m)return null;const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0")}
function timeField(id,v,attrs=""){return `<input id="${id}" class="tfield" type="text" inputmode="numeric" maxlength="5" placeholder="чч:мм" autocomplete="off" value="${esc(v||"")}" ${attrs}>`}
function dmy(s){return s?fmtDate(s):""}
function parseDMY(t){t=String(t||"").trim();if(!t)return"";const m=t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);if(!m)return null;let [_,d,mo,y]=m;if(y.length===2)y="20"+y;const iso=`${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;const dt=new Date(iso+"T12:00:00");return isNaN(dt)||dt.getDate()!==+d?null:iso}
const nf=new Intl.NumberFormat("bg-BG");
const money=n=>n==null||isNaN(n)?"—":new Intl.NumberFormat("bg-BG",{minimumFractionDigits:0,maximumFractionDigits:2}).format(n)+" €";
const g=n=>n==null||isNaN(n)?"—":nf.format(Math.round(n));
const pct=(n,d=1)=>n==null||isNaN(n)||!isFinite(n)?"—":(n>0?"+":"")+n.toFixed(d).replace(".",",")+"%";
const sg=n=>n==null||isNaN(n)?"—":(n>0?"+":n<0?"−":"")+nf.format(Math.abs(Math.round(n)));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sexL=s=>s==="f"?"♀ женско":s==="m"?"♂ мъжко":s==="u"?"неопределим":"—";
const dn=p=>p.petName||p.name||p.kennelName||"Кученце";
const sexS=s=>s==="f"?"♀":s==="m"?"♂":s==="u"?"–":"?";
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("on");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("on"),2600)}
async function write(fn){
  if(!db){toast("Записът не е достъпен в този изглед.");return false}
  try{await fn();return true}catch(e){
    const c=e&&e.code;
    if(c==="invalid_argument"){S.canWrite=false;toast("Нямаш права да записваш тук.");render()}
    else if(c==="quota_exceeded")toast("Хранилището е пълно — изтрий стари записи.");
    else toast("Не успях да запиша. Опитай пак.");
    return false}}

/* ---------- derived data ---------- */
function birthDate(){if(S.info&&S.info.birthDate)return S.info.birthDate;let m=null;S.weights.forEach(w=>{if(w.grams>0&&(!m||w.date<m))m=w.date});return m}
function puppyBirth(p){return p.birthDate||birthDate()}
function series(p){
  const b=puppyBirth(p);
  const pts=S.weights.filter(w=>w.puppyId===p.id&&w.grams>0).map(w=>({date:w.date,g:+w.grams}));
  if(p.birthWeight>0&&b&&!pts.some(x=>x.date===b))pts.push({date:b,g:+p.birthWeight,birth:true});
  pts.sort((a,c)=>a.date<c.date?-1:1);
  pts.forEach(x=>x.day=b?dayDiff(b,x.date):null);
  return pts.filter(x=>x.day==null||x.day>=0);
}
function stats(p){
  const pts=series(p),b=puppyBirth(p);
  const b0=pts.find(x=>x.day===0&&!x.birth);const bw=b0?b0.g:p.birthWeight>0?+p.birthWeight:(pts[0]&&pts[0].g)||null;
  const last=pts[pts.length-1]||null,prev=pts[pts.length-2]||null;
  let gain=null,gainPct=null,days=null;
  if(last&&prev){days=Math.max(1,(last.day??0)-(prev.day??0)||dayDiff(prev.date,last.date)||1);gain=last.g-prev.g;gainPct=gain/prev.g/days*100}
  const total=last&&bw?(last.g/bw-1)*100:null;
  const dbl=bw?pts.find(x=>x.g>=2*bw):null;
  const ageNow=b?dayDiff(b,todayStr()):null;
  const lastDay=last?last.day:null;
  const avg=last&&bw&&lastDay>0?(last.g-bw)/lastDay:null;
  const flags=[];
  if(last&&prev&&last.g<prev.g&&lastDay>3)flags.push({lv:"bad",t:"Губи тегло",d:`${sg(gain)} г спрямо предишното претегляне (${fmtDate(prev.date)}). Провери суче ли, температура, хидратация.`});
  if(last&&bw&&last.g<bw*0.9)flags.push({lv:"bad",t:"Под 90% от теглото при раждане",d:`${g(last.g)} г при рождено ${g(bw)} г. Загуба над 10% изисква внимание и консултация с ветеринар.`});
  if(last&&prev&&gainPct!=null&&gainPct>=0&&gainPct<5&&lastDay>2&&lastDay<=21)flags.push({lv:"warn",t:"Бавно наддаване",d:`${pct(gainPct)} на ден — ориентир за първите 3 седмици е 5–10% дневно. Помисли за поставяне на по-продуктивно зърно.`});
  if(bw&&lastDay!=null&&lastDay>=10&&!dbl)flags.push({lv:"warn",t:"Не е удвоило теглото",d:`Ден ${lastDay}: ${pct(total,0)} от рожденото. Повечето кученца удвояват теглото си до 7–10-ия ден.`});
  if(last&&prev&&last.g<prev.g&&lastDay<=3)flags.push({lv:"info",t:"Лека загуба в първите дни",d:"До 10% загуба в първите 2–3 дни е нормална, стига после да тръгне нагоре."});
  const lv=flags.some(f=>f.lv==="bad")?"bad":flags.some(f=>f.lv==="warn")?"warn":"ok";
  return {p,pts,bw,last,prev,gain,gainPct,days,total,dbl,avg,flags,lv,lastDay,ageNow};
}
function allStats(){return S.puppies.map(stats)}
function wFor(pid,date){return S.weights.find(w=>w.puppyId===pid&&w.date===date)}
function prevFor(p,date){const pts=series(p).filter(x=>x.date<date);return pts[pts.length-1]||null}
const statusLabel={ok:"Наред",warn:"Наблюдавай",bad:"Внимание"};

function briefFor(date){
  const st=allStats();if(!st.length)return "";
  const b=birthDate();const age=b?dayDiff(b,date):null;
  const weighed=S.puppies.filter(p=>wFor(p.id,date)).length;
  let mass=0,prevMass=0,both=0;
  S.puppies.forEach(p=>{const w=wFor(p.id,date);const pv=prevFor(p,date);if(w&&pv){mass+=+w.grams;prevMass+=pv.g;both++}});
  const totalNow=S.puppies.reduce((s,p)=>{const w=wFor(p.id,date);const pv=prevFor(p,date);return s+(w?+w.grams:pv?pv.g:0)},0);
  const day=st.filter(s=>{const w=wFor(s.p.id,date);return w}).map(s=>{const w=+wFor(s.p.id,date).grams,pv=prevFor(s.p,date);return pv?{s,pc:(w-pv.g)/pv.g/Math.max(1,dayDiff(pv.date,date))*100}:null}).filter(Boolean).sort((a,c)=>c.pc-a.pc);
  const parts=[];
  parts.push(`${age!=null?`<strong>Ден ${age}</strong>${age===0?" (раждане)":""}`:fmtDate(date)} · претеглени <strong>${weighed} от ${S.puppies.length}</strong>.`);
  if(both)parts.push(`Кучилото тежи общо <strong>${g(totalNow)} г</strong>${both===S.puppies.length?`, ${pct((mass/prevMass-1)*100)} спрямо предишното претегляне`:""}.`);
  if(day.length>1){parts.push(`Най-добро наддаване: <strong>${esc(dn(day[0].s.p))}</strong> (${pct(day[0].pc)}). Най-слабо: <strong>${esc(dn(day[day.length-1].s.p))}</strong> (${pct(day[day.length-1].pc)}).`)}
  const alarms=st.filter(s=>s.lv!=="ok");
  const evs=S.events.filter(e=>e.date===date).map(e=>`${evTitle(e).toLowerCase()}${e.note?" ("+esc(e.note)+")":""}${!e.puppies||e.puppies==="all"?"":" — "+e.puppies.map(id=>{const p=S.all.find(x=>x.id===id);return p?esc(dn(p)):""}).filter(Boolean).join(", ")}`);if(evs.length)parts.push(`Събития: ${evs.join("; ")}.`);
  const dblNow=st.filter(s=>s.dbl&&s.dbl.date===date);if(dblNow.length)parts.push(`Удвоиха теглото си днес (ден ${age}): ${dblNow.map(s=>`<strong>${esc(dn(s.p))}</strong>`).join(", ")}.`);
  if(alarms.length)parts.push(`За наблюдение: ${alarms.map(s=>`<strong>${esc(dn(s.p))}</strong> — ${s.flags.filter(f=>f.lv!=="info")[0].t.toLowerCase()}`).join("; ")}.`);
  else if(weighed)parts.push("Всички кученца наддават в нормата.");
  if(weighed<S.puppies.length){const miss=S.puppies.filter(p=>!wFor(p.id,date)).map(p=>esc(dn(p)));parts.push(`Остава: ${miss.join(", ")}.`)}
  return parts.join(" ");
}

/* ---------- render ---------- */
function render(){
  if(S.viewer){renderViewer();return}
  autoDate();scheduleSync();
  renderHead();renderBanner();{const ta=document.getElementById("tabAccess");if(ta)ta.hidden=!S.isOwner}
  document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===S.tab));
  const v=document.getElementById("view");
  const ae=document.activeElement;const f=ae&&ae.id&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)?{id:ae.id,s:ae.selectionStart,e:ae.selectionEnd,v:ae.value,keep:/^(bm|bw|bt|bd|bf|mn|mc|dw|ev|o|acc|fc_date|fc_time)_?/.test(ae.id)}:null;
  v.innerHTML=S.tab==="birth"?viewBirth():S.tab==="today"?viewToday():S.tab==="analysis"?viewAnalysis():S.tab==="dev"?viewDev():S.tab==="owners"?viewOwners():S.tab==="access"?viewAccess():viewPuppies();
  if(S.tab==="analysis")bindChart();
  const ds=document.getElementById("dayStrip");if(ds){const on=ds.querySelector('[aria-pressed="true"]');if(on)ds.scrollLeft=on.offsetLeft-ds.clientWidth/2+on.offsetWidth/2}
  if(f){const el=document.getElementById(f.id);if(el){if(f.keep&&el.value!==f.v)el.value=f.v;el.focus();try{if(f.s!=null)el.setSelectionRange(f.s,f.e)}catch(_){}}}
}
function renderHead(){
  const i=S.info||{};
  document.getElementById("hTitle").textContent=i.name?`Кучило „${i.name}“`:"Кучило";
  document.getElementById("hEyebrow").textContent="Carrot Cake Litter Diary"+(i.breed?` · ${i.breed}`:"");
  const m=S.puppies.filter(p=>p.sex==="m").length,f=S.puppies.filter(p=>p.sex==="f").length;
  const bits=[];
  if(i.birthDate)bits.push(`Родени на ${fmtDate(i.birthDate)}`);
  if(i.mother)bits.push(`майка ${i.mother}`);
  if(i.father)bits.push(`баща ${i.father}`);
  if(S.puppies.length)bits.push(`${S.puppies.length} кученца (${m} ♂, ${f} ♀)`);
  document.getElementById("hMeta").textContent=S.noDb?"Няма връзка с базата данни.":bits.join(" · ")||"Въведи данните за кучилото, за да започнеш.";
  {const hc=document.getElementById("hCover");if(i.cover){hc.hidden=false;const im=document.getElementById("hCoverImg");if(im.getAttribute("src")!==bu(i.cover))im.src=bu(i.cover)}else hc.hidden=true}
  const a=document.getElementById("hAge");
  if(i.birthDate){const n=dayDiff(i.birthDate,todayStr());a.hidden=false;document.getElementById("hAgeN").textContent=n;document.getElementById("hAgeW").textContent=n>=7?`${Math.floor(n/7)} седм. ${n%7} д.`:"от раждането"}else a.hidden=true;
}
function renderBanner(){
  const ex=S.puppies.some(p=>p.example)||S.weights.some(w=>w.example)||(S.info&&S.info.example);
  document.getElementById("banner").innerHTML=ex?`<div class="banner"><span><strong>Това са примерни данни</strong>, за да видиш как изглеждат отчетите. Изчисти ги и въведи своето кучило.</span><button class="btn" id="clearEx" ${S.canWrite?"":"disabled"}>Изчисти примерните</button></div>`:"";
}

function emptyState(){
  return `<div class="panel empty"><h2>Започни със своето кучило</h2><p>В раздел „Раждане“ запиши часа на първата контракция и всяко родено кученце с час, пол, тегло и отличителни белези. После записвай теглата всеки ден тук.</p><button class="btn primary" data-go="birth">Към раждането</button></div>`;
}

function dayStrip(){
  const b=birthDate();if(!b||!S.puppies.length)return"";const n=dayDiff(b,todayStr());if(n<0)return"";
  const N=S.puppies.length;let h="";
  for(let k=Math.max(0,n-59);k<=n;k++){const iso=shiftDate(b,k);const c=S.puppies.filter(p=>wFor(p.id,iso)).length;
    const st=c>=N?"full":c?"part":"none";const [y,m,d]=iso.split("-");
    h+=`<button type="button" class="daychip ${st}" data-setdate="${iso}" aria-pressed="${iso===S.date}"><b>${k===0?"Раждане":"Ден "+k}</b><span>${d}/${m}</span><small>${c}/${N}</small></button>`}
  return `<div class="daystrip" id="dayStrip" role="group" aria-label="Дни от раждането">${h}</div>`;
}
function autoDate(){
  if(!S.dateAuto||!S.loaded.p||!S.loaded.w||!S.loaded.i)return;S.dateAuto=false;
  const b=birthDate();if(!b||!S.puppies.length)return;const n=dayDiff(b,todayStr());
  for(let k=0;k<=n;k++){const iso=shiftDate(b,k);if(S.puppies.some(p=>!wFor(p.id,iso))){S.date=iso;return}}
}
function deltaH(pv,d,val,bw){const n=parseFloat(String(val).replace(",","."));
  if(!(n>0&&pv))return "<span class='muted'>—</span>";
  const dd=Math.max(1,dayDiff(pv.date,d));const diff=n-pv.g,pc=diff/pv.g/dd*100;
  return `<span class="${diff<0?"down":"up"}">${sg(diff)} г</span><small>${pct(pc)}${dd>1?` за ${dd} дни`:" за денонощие"}</small>${bw&&n>=2*bw?`<small class="dbl">✓ удвоено (×${(n/bw).toFixed(1).replace(".",",")})</small>`:""}`}
function refreshSaveAll(){const b=document.getElementById("saveAll");if(!b)return;const n=Object.keys(S.drafts).filter(k=>k.startsWith(S.date+"|")).length;b.disabled=!(n&&S.canWrite);b.textContent=n?`Запиши (${n})`:"Запиши всички"}
function viewToday(){
  if(!S.puppies.length)return emptyState();
  const d=S.date,b=birthDate(),age=b?dayDiff(b,d):null;
  const rows=S.puppies.map((p,i)=>{
    const c=collar(p.collar),w=wFor(p.id,d),pv=prevFor(p,d);
    const key=d+"|"+p.id;const isB=d===puppyBirth(p);const val=S.drafts[key]!=null?S.drafts[key]:(w?w.grams:(isB&&p.birthWeight?p.birthWeight:""));
    const dl=deltaH(pv,d,val,stats(p).bw);
    const saved=w&&S.drafts[key]==null;
    return `<div class="wrow">
      <div class="who">${dotH(p)}<div style="min-width:0"><div class="nm"><button type="button" class="linkbtn" data-dossier="${p.id}" title="Досие">${esc(dn(p))}</button> <span class="sex ${p.sex||""}">${sexS(p.sex)}</span></div><div class="mk">${esc([p.kennelName,p.markings||(c.none?"без каишка":c.name+" каишка")].filter(Boolean).join(" · "))}</div></div></div>
      <div class="prev">${pv?`${g(pv.g)}<span class="pu">г</span><small>${pv.birth?"при раждане":fmtDate(pv.date)}</small>`:`<span>—</span><small>${isB?"първо претегляне":"няма предишно"}</small>`}</div>
      <label class="gin${saved?" saved":""}" for="w_${p.id}"><input id="w_${p.id}" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(val)}" data-pid="${p.id}" data-idx="${i}" ${S.canWrite&&db?"":"disabled"} aria-label="Тегло на ${esc(dn(p))} в грамове"><span>г</span></label>
      <div class="delta" id="dl_${p.id}">${dl}</div><div class="wph">${thumbs(p,photosOf(p,"weigh",d),3)}${S.canWrite&&db?camBtn(p,"weigh",d,""):""}</div></div>`}).join("");
  const dirty=Object.keys(S.drafts).filter(k=>k.startsWith(d+"|")).length;
  const brief=briefFor(d);
  return `<div class="stack">
    <div class="sec-h"><h2>${age===0?"Претегляне при раждане":"Претегляне"}${age!=null?` · ден ${age}`:""}</h2>
      <div class="daybar"><button class="btn ghost" data-shift="-1" aria-label="Предишен ден">‹</button>${dateField("dpick",d,'aria-label="Дата (ден/месец/година)"')}<button class="btn ghost" data-shift="1" aria-label="Следващ ден">›</button>${d!==todayStr()?`<button class="btn" data-today>Днес</button>`:""}</div></div>
    ${dayStrip()}
    ${brief?`<div class="brief">${brief}</div>`:""}
    <div class="panel weigh">
      <div class="wrow head"><div>Кученце</div><div>Предишно</div><div>${age===0?"Тегло при раждане":"Тегло"}</div><div>Промяна</div><div>Снимка</div></div>
      ${rows}
      <div class="weigh-foot"><span class="small muted">Enter записва и минава на следващото кученце. Празно поле + запис изтрива претеглянето.</span><button class="btn primary" id="saveAll" ${dirty&&S.canWrite?"":"disabled"}>Запиши ${dirty?`(${dirty})`:"всички"}</button></div>
    </div>
    ${S.noDb?`<div class="notice">Няма връзка с базата данни. Провери интернета и презареди.</div>`:""}
  </div>`;
}

function viewAnalysis(){
  if(!S.puppies.length)return emptyState();
  const st=allStats();const b=birthDate();
  const last=st.map(s=>s.last).filter(Boolean);
  const mass=last.reduce((a,x)=>a+x.g,0);
  const gains=st.filter(s=>s.gainPct!=null).map(s=>s.gainPct);
  const avgG=gains.length?gains.reduce((a,x)=>a+x,0)/gains.length:null;
  const bws=st.filter(s=>s.bw).map(s=>s.bw);
  const avgBw=bws.length?bws.reduce((a,x)=>a+x,0)/bws.length:null;
  const doubled=st.filter(s=>s.dbl).length;
  const m=S.puppies.filter(p=>p.sex==="m").length,f=S.puppies.filter(p=>p.sex==="f").length;
  const flags=[];st.forEach(s=>s.flags.forEach(fl=>flags.push({s,fl})));
  flags.sort((a,c)=>({bad:0,warn:1,info:2}[a.fl.lv]-{bad:0,warn:1,info:2}[c.fl.lv]));
  const sexAvg=sx=>{const a=st.filter(s=>s.p.sex===sx&&s.last);return a.length?a.reduce((t,s)=>t+s.last.g,0)/a.length:null};
  const ranked=[...st].sort((a,c)=>(c.total??-1e9)-(a.total??-1e9));
  return `<div class="stack">
    ${birthAnalysisH()}
    <div class="sec-h" style="margin-bottom:-6px"><h2>Растеж</h2></div>
    <div class="brief">${briefFor(todayStr())}</div>
    <div class="tiles">
      <div class="panel tile"><div class="k">Кученца</div><div class="v num">${S.puppies.length}</div><div class="s">${m} ♂ · ${f} ♀</div></div>
      <div class="panel tile"><div class="k">Маса на кучилото</div><div class="v num">${g(mass)} г</div><div class="s">по последните претегляния</div></div>
      <div class="panel tile"><div class="k">Средно дневно</div><div class="v num">${pct(avgG)}</div><div class="s">ориентир 5–10% на ден</div></div>
      <div class="panel tile"><div class="k">Удвоили теглото</div><div class="v num">${doubled} / ${S.puppies.length}</div><div class="s">рождено средно ${g(avgBw)} г</div></div>
    </div>

    <div>
      <div class="sec-h"><h2>Сигнали</h2><span class="small muted">${flags.filter(x=>x.fl.lv!=="info").length?`${flags.filter(x=>x.fl.lv!=="info").length} за внимание`:"няма отклонения"}</span></div>
      <div class="alerts">${flags.length?flags.map(({s,fl})=>`<div class="alert ${fl.lv==="info"?"":fl.lv}">${dotH(s.p)}<div><b>${esc(dn(s.p))}${pc(s.p).none&&s.p.markings?` (${esc(s.p.markings)})`:""} — ${fl.t}</b><span class="small">${fl.d}</span></div></div>`).join(""):`<div class="alert"><span class="dot" style="background:var(--ok)"></span><div><b>Всички наддават нормално</b><span class="small muted">Няма загуба на тегло, бавно наддаване или изоставане.</span></div></div>`}</div>
    </div>

    <div class="panel">
      <div class="sec-h" style="padding:14px 16px 0;margin:0"><h2>Крива на растежа</h2>
        <div class="seg" role="group" aria-label="Мярка"><button data-mode="g" aria-pressed="${S.mode==="g"}">Грамове</button><button data-mode="p" aria-pressed="${S.mode==="p"}">% от рожденото</button></div></div>
      <div class="chart-wrap" id="chartWrap">${chartSVG(st)}<div class="tip" id="tip" hidden></div></div>
      <div class="legend">${st.map(s=>`<span>${dotH(s.p,"i")}${esc(dn(s.p))} ${sexS(s.p.sex)}${pc(s.p).none&&s.p.markings?` <span class="muted">· ${esc(s.p.markings)}</span>`:""}</span>`).join("")}</div>
    </div>

    <div>
      <div class="sec-h"><h2>По кученца</h2><span class="small muted">подредени по общо наддаване${sexAvg("m")&&sexAvg("f")?` · средно ♂ ${g(sexAvg("m"))} г, ♀ ${g(sexAvg("f"))} г`:""}</span></div>
      <div class="panel tscroll"><table>
        <thead><tr><th>№</th><th style="text-align:left">Кученце</th><th style="text-align:left">Статус</th><th>Последно</th><th>Общо</th><th>Последно наддаване</th><th>Средно г/ден</th><th>При раждане</th><th title="Ден, в който кученцето е удвоило теглото си при раждане">Удвоено</th></tr></thead>
        <tbody>${ranked.map(s=>`<tr><td class="num" style="text-align:left">${s.p.order||"—"}</td>
          <td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${dotH(s.p)}<button type="button" class="linkbtn" data-dossier="${s.p.id}"><b>${esc(dn(s.p))}</b></button> <span class="sex ${s.p.sex||""}">${sexS(s.p.sex)}</span>${s.p.deform?` <span class="pill warn" title="${esc(s.p.deformDesc||"")}">деф.</span>`:""}</span></td>
          <td style="text-align:left"><span class="pill ${s.lv}">${statusLabel[s.lv]}</span></td>
          <td class="num">${s.last?`${g(s.last.g)} г`:"—"}<br><span class="small muted">${s.last?`ден ${s.last.day??"—"}`:""}</span></td>
          <td class="num">${pct(s.total,0)}</td>
          <td class="num"><span class="${s.gain<0?"down":"up"}">${s.gain!=null?`${sg(s.gain)} г`:"—"}</span><br><span class="small muted">${pct(s.gainPct)}/ден</span></td>
          <td class="num">${s.avg!=null?g(s.avg):"—"}</td>
          <td class="num">${g(s.bw)} г</td>
          <td class="num">${s.dbl?`<span class="pill ok">✓ ден ${s.dbl.day}</span><br><span class="small muted">${fmtDate(s.dbl.date)}</span>`:(s.bw&&s.last?`<span class="dprog" title="${Math.round(s.last.g/s.bw*100)}% от рожденото тегло"><span class="dbar"><i style="width:${Math.min(100,Math.max(0,(s.last.g/s.bw-1)*100))}%"></i></span><span class="small muted">още не</span></span>`:`<span class="muted">—</span>`)}</td></tr>`).join("")}</tbody></table></div>
    </div>
  </div>`;
}

function niceStep(r){const raw=r/5;const p=Math.pow(10,Math.floor(Math.log10(raw)));const n=raw/p;return (n<1.5?1:n<3?2:n<7?5:10)*p}
let CH=null;
function chartSVG(st){
  const W=760,H=330,L=54,R=18,T=14,B=40;
  const val=(s,x)=>S.mode==="p"?(s.bw?x.g/s.bw*100:null):x.g;
  const ser=st.map(s=>({s,pts:s.pts.filter(x=>x.day!=null).map(x=>({day:x.day,v:val(s,x),g:x.g})).filter(x=>x.v!=null)}));
  const all=ser.flatMap(x=>x.pts);
  if(!all.length)return `<p class="muted small" style="padding:20px">Няма достатъчно данни за графика. Въведи дата на раждане и поне едно претегляне.</p>`;
  const maxD=Math.max(7,...all.map(x=>x.day));
  let lo=Math.min(...all.map(x=>x.v)),hi=Math.max(...all.map(x=>x.v));
  if(S.mode==="p"){lo=Math.min(lo,100);hi=Math.max(hi,200)}
  const step=niceStep(Math.max(1,hi-lo));lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;if(hi===lo)hi=lo+step;
  const x=d=>L+(d/maxD)*(W-L-R),y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Тегло по дни от раждането">`;
  for(let v=lo;v<=hi+1e-9;v+=step){s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11.5" fill="var(--muted)" font-family="var(--mono)">${nf.format(v)}${S.mode==="p"?"%":""}</text>`}
  const xs=maxD<=14?1:maxD<=35?7:14;
  for(let d=0;d<=maxD;d+=xs){s+=`<text x="${x(d)}" y="${H-B+18}" text-anchor="middle" font-size="11.5" fill="var(--muted)" font-family="var(--mono)">${d}</text>`}
  s+=`<text x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle" font-size="12" fill="var(--muted)">ден от раждането</text>`;
  s+=`<text x="12" y="${T+4}" font-size="12" fill="var(--muted)" transform="rotate(-90 12 ${T+4})" text-anchor="end">${S.mode==="p"?"% от рожденото":"грамове"}</text>`;
  if(S.mode==="p"){s+=`<line x1="${L}" x2="${W-R}" y1="${y(200)}" y2="${y(200)}" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W-R}" y="${y(200)-6}" text-anchor="end" font-size="11.5" fill="var(--accent)" font-weight="600">удвояване</text>`}
  eventsForChart().forEach(ev=>{if(ev.day<0||ev.day>maxD)return;s+=`<line x1="${x(ev.day)}" x2="${x(ev.day)}" y1="${T}" y2="${H-B}" stroke="${ev.c}" stroke-dasharray="2 4" stroke-width="1.5"/><text x="${x(ev.day)+4}" y="${T+10}" font-size="10.5" fill="${ev.c}" font-weight="600">${ev.label}</text>`});
  ser.forEach(({s:st0,pts})=>{if(!pts.length)return;const pcc=pc(st0.p),c=pcc.hex;const path=pts.map((p,i)=>(i?"L":"M")+x(p.day).toFixed(1)+" "+y(p.v).toFixed(1)).join(" ");
    const halo=["black","white","grey","navy"].includes(st0.p.collar);
    if(halo)s+=`<path d="${path}" fill="none" stroke="var(--muted)" stroke-opacity=".45" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    s+=`<path d="${path}" fill="none" stroke="${c}" stroke-width="2.4"${pcc.none?' stroke-dasharray="6 4"':""} stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p,i)=>{const end=i===pts.length-1;s+=`<circle cx="${x(p.day)}" cy="${y(p.v)}" r="${end?4.5:2.6}" fill="${c}" stroke="var(--surface)" stroke-width="${end?2:1}"/>`})});
  s+=`<line id="xh" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--ink)" stroke-opacity=".35" stroke-width="1" visibility="hidden"/>`;
  s+=`<rect id="hit" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent" style="cursor:crosshair"/></svg>`;
  CH={W,L,R,maxD,x,ser};
  return s;
}
function bindChart(){
  const hit=document.getElementById("hit");if(!hit||!CH)return;
  const wrap=document.getElementById("chartWrap"),tip=document.getElementById("tip"),xh=document.getElementById("xh"),svg=wrap.querySelector("svg");
  const move=e=>{const r=svg.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*CH.W;const d=Math.max(0,Math.min(CH.maxD,Math.round((sx-CH.L)/(CH.W-CH.L-CH.R)*CH.maxD)));
    const rows=CH.ser.map(({s,pts})=>({s,p:pts.find(q=>q.day===d)})).filter(r=>r.p).sort((a,c)=>c.p.g-a.p.g);
    if(!rows.length){tip.hidden=true;xh.setAttribute("visibility","hidden");return}
    xh.setAttribute("x1",CH.x(d));xh.setAttribute("x2",CH.x(d));xh.setAttribute("visibility","visible");
    tip.innerHTML=`<div class="t-h">Ден ${d}${birthDate()?` · ${fmtDate(shiftDate(birthDate(),d))}`:""}</div>`+rows.map(r=>`<div class="t-r"><span>${dotH(r.s.p,"i")}${esc(dn(r.s.p))}</span><b class="num">${g(r.p.g)} г${S.mode==="p"?` · ${Math.round(r.p.v)}%`:""}</b></div>`).join("");
    tip.hidden=false;const wr=wrap.getBoundingClientRect();let lx=CH.x(d)/CH.W*r.width+(r.left-wr.left)+14;if(lx+tip.offsetWidth>wr.width-8)lx=lx-tip.offsetWidth-28;tip.style.left=Math.max(4,lx)+"px";tip.style.top="18px"};
  hit.addEventListener("pointermove",move);hit.addEventListener("pointerdown",move);
  hit.addEventListener("pointerleave",()=>{tip.hidden=true;xh.setAttribute("visibility","hidden")});
}

function viewPuppies(){
  if(S.dossier){const p=S.all.find(x=>x.id===S.dossier);if(p)return viewDossier(p);S.dossier=null}
  const i=S.info||{};const ro=!(S.canWrite&&db);
  const litterSaved=S.info&&(S.info.name||S.info.birthDate)&&!S.litterEdit;
  const litter=litterSaved?`<div class="panel dz-owner"><div class="sec-h" style="margin:0"><h2>Кучилото</h2>${ro?"":`<button class="btn" data-litteredit>✎ Редактирай</button>`}</div>
    <div class="lit-row">${i.cover?`<img class="lit-img" src="${bu(i.cover)}" alt="Снимка на кучилото">`:""}<div class="row" style="gap:8px">${ro?"":`<button class="btn" data-litphoto>${CAM}<span>${i.cover?"Смени снимката":"Снимка на кучилото"}</span></button>${i.cover?`<button class="btn ghost" data-litphotodel style="color:var(--bad)">Махни снимката</button>`:""}`}</div></div><dl class="kv"><dt>Име</dt><dd><b>${esc(i.name)||"—"}</b></dd><dt>Порода</dt><dd>${esc(i.breed)||"—"}</dd><dt>Майка</dt><dd>${esc(i.mother)||"—"}</dd><dt>Баща</dt><dd>${esc(i.father)||"—"}</dd><dt>Дата на раждане</dt><dd>${i.birthDate?fmtDate(i.birthDate):"—"}</dd></dl></div>`:`<div class="panel"><div class="sec-h" style="padding:14px 16px 0;margin:0"><h2>Кучилото</h2></div>
    <form class="litter-form" id="litterForm">
      <div class="field"><label for="l_name">Име на кучилото</label><input id="l_name" value="${esc(i.name)}" placeholder="напр. А" ${ro?"disabled":""}></div>
      <div class="field"><label for="l_breed">Порода</label><input id="l_breed" value="${esc(i.breed)}" ${ro?"disabled":""}></div>
      <div class="field"><label for="l_mother">Майка</label><input id="l_mother" value="${esc(i.mother)}" ${ro?"disabled":""}></div>
      <div class="field"><label for="l_father">Баща</label><input id="l_father" value="${esc(i.father)}" ${ro?"disabled":""}></div>
      <div class="field"><label for="l_birth">Дата на раждане</label>${dateField("l_birth",i.birthDate,ro?"disabled":"")}</div>
      <div class="form-acts">${S.litterEdit?`<button type="button" class="btn ghost" data-litterclose>Отказ</button>`:""}<button class="btn primary" type="submit" ${ro?"disabled":""}>Запази кучилото</button></div>
    </form></div>`;
  const cards=S.puppies.map(p=>{const c=collar(p.collar);const s=stats(p);
    if(S.edit===p.id)return `<div class="panel" style="grid-column:1/-1">${puppyForm(p)}</div>`;
    return `<article class="panel pcard"><div class="collar${c.none?" nc":""}" style="${c.none?"":`background:${c.hex}`}"></div><div class="body">
      <div class="pc-top">${avatarH(p,"pc-av")}<h3>${esc(dn(p))} <span class="sex ${p.sex||""}">${sexS(p.sex)}</span>${s.lv!=="ok"?` <span class="pill ${s.lv}">${statusLabel[s.lv]}</span>`:""}</h3></div>
      <dl class="kv"><dt>Развъдно име</dt><dd>${esc(p.kennelName)||"—"}</dd>${p.petName?`<dt>В кучилото</dt><dd>${esc(p.name)}</dd>`:""}${p.owner&&p.owner.name?`<dt>Собственик</dt><dd><b>${esc(p.owner.name)}</b></dd>`:""}<dt>Пол</dt><dd>${sexL(p.sex)}</dd>${p.coat?`<dt>Цвят</dt><dd>${esc(p.coat)}</dd>`:""}${p.tail?`<dt>Опашка</dt><dd>${esc(p.tail)}</dd>`:""}${p.deform?`<dt>Деформация</dt><dd><span class="pill warn">Да</span> ${esc(p.deformDesc||"")}</dd>`:""}<dt>Каишка</dt><dd>${c.name}</dd><dt>Белези</dt><dd>${esc(p.markings)||"—"}${p.marks&&p.marks.strokes&&p.marks.strokes.length?`<div style="margin-top:6px">${marksSVG(p.marks)}</div>`:""}</dd>
      <dt>При раждане</dt><dd class="num">${p.birthWeight?g(p.birthWeight)+" г":"—"}${p.birthTime?` · ${esc(p.birthTime)} ч.`:""}${p.order?` · №${esc(p.order)}`:""}</dd>
      <dt>Сега</dt><dd class="num">${s.last?`${g(s.last.g)} г (${pct(s.total,0)})`:"—"}</dd>${MS.map(m=>{const v=msDate(p,m.k);return v?`<dt>${m.l}</dt><dd>ден ${dayDiff(puppyBirth(p),v)} · ${fmtDate(v)}</dd>`:""}).join("")}${dwFor(p).length?`<dt>Обезпаразитяване</dt><dd>${dwFor(p).map((d,i)=>`${i+1}. ден ${dayDiff(puppyBirth(p),d.date)}`).join(", ")}</dd>`:""}${(p.photos||[]).length?`<dt>Снимки</dt><dd>${thumbs(p,p.photos,6)}</dd>`:""}${p.devNote?`<dt>Развитие</dt><dd>${esc(p.devNote)}</dd>`:""}<dt>Удвоено</dt><dd>${s.dbl?`<span class="pill ok">✓ ден ${s.dbl.day} · ${fmtDate(s.dbl.date)}</span>`:"още не"}</dd>
      ${p.notes?`<dt>Бележки</dt><dd>${esc(p.notes)}</dd>`:""}</dl></div>
      ${ro?"":`<div class="acts"><button class="btn primary" data-dossier="${p.id}">Досие</button><button class="btn" data-edit="${p.id}">Редактирай</button><button class="btn" data-draw="${p.id}">✎ Белези</button>${S.confirmDel===p.id?`<button class="btn danger" data-del="${p.id}">Изтрий заедно с теглата</button><button class="btn ghost" data-nodel>Отказ</button>`:`<button class="btn ghost" data-askdel="${p.id}">Изтрий</button>`}</div>`}
    </article>`}).join("");
  const adding=S.edit==="new";
  return `<div class="stack">${litter}
    <div><div class="sec-h"><h2>Кученца</h2></div>
    ${adding?`<div class="panel" style="margin-bottom:12px">${puppyForm({})}</div>`:""}
    ${S.puppies.length?`<div class="pgrid">${cards}</div>`:adding?"":`<div class="notice">Кученцата се добавят автоматично от раздел „Раждане“ с „+ Роди се кученце“.</div>`}</div></div>`;
}
let PF={};
function puppyForm(p){
  PF={id:p.id||null,sex:p.sex||"",collar:p.collar||""};
  const used=new Set(S.puppies.filter(x=>x.id!==p.id).map(x=>x.collar));
  const nextOrder=p.order||S.puppies.length+1;
  return `<form class="pform" id="pupForm">
    <div class="field full"><h3 style="font-size:18px">${p.id?"Редакция: "+esc(dn(p)):"Ново кученце"}</h3></div>
    <div class="field"><label for="p_name">Работно име в кучилото</label><input id="p_name" value="${esc(p.name)}" placeholder="напр. Синьото момче"></div>
    <div class="field"><label for="p_kennel">Развъдно име</label><input id="p_kennel" value="${esc(p.kennelName)}" placeholder="напр. Aurora z Rodopi"></div>
    <div class="field"><label for="p_pet">Pet name (домашно име)</label><input id="p_pet" value="${esc(p.petName)}" placeholder="напр. Бъди"></div>
    <div class="field"><span class="flabel">Пол</span><div class="sexpick" role="group" aria-label="Пол"><button type="button" class="sxm" data-sex="m" aria-pressed="${PF.sex==="m"}">♂ Мъжко</button><button type="button" class="sxf" data-sex="f" aria-pressed="${PF.sex==="f"}">♀ Женско</button></div></div>
    <div class="field full"><span class="flabel">Цвят на каишката</span><div class="swatches" role="group" aria-label="Цвят на каишката"><button type="button" class="sw none" data-collar="" aria-pressed="${PF.collar===""}" title="Без каишка" aria-label="Без каишка"></button>${COLLARS.map(c=>`<button type="button" class="sw${used.has(c.id)?" used":""}" data-collar="${c.id}" style="background:${c.hex}" aria-pressed="${PF.collar===c.id}" title="${c.name}${used.has(c.id)?" (заета)":""}" aria-label="${c.name}"></button>`).join("")}</div></div>
    <div class="field"><label for="p_coat">Цвят</label><select id="p_coat">${optList(COATS,p.coat||"")}</select></div>
    <div class="field"><label for="p_tail">Опашка</label><select id="p_tail">${optList(TAILS,p.tail||"")}</select></div>
    <div class="field full"><label for="p_mark">Отличителни белези</label><textarea id="p_mark" placeholder="окраска, петна, бяла лапичка, звезда на гърдите…">${esc(p.markings)}</textarea></div>
    <div class="field"><label for="p_bw">Тегло при раждане (г) — първо претегляне</label><input id="p_bw" type="number" inputmode="decimal" min="0" value="${esc(p.birthWeight)}"></div>
    <div class="field"><label for="p_time">Час на раждане</label>${timeField("p_time",p.birthTime)}</div>
    <div class="field"><label for="p_order">Ред на раждане</label><input id="p_order" type="number" min="1" value="${esc(nextOrder)}"></div>
    <div class="field"><label for="p_bdate">Дата на раждане</label>${dateField("p_bdate",p.birthDate||birthDate()||"")}</div>
    <div class="field full"><label for="p_notes">Бележки</label><textarea id="p_notes" placeholder="раждане, суче ли добре, допълнително хранене…">${esc(p.notes)}</textarea></div>
    <div class="form-acts"><button type="button" class="btn ghost" data-cancel>Отказ</button><button class="btn primary" type="submit">${p.id?"Запази промените":"Добави кученцето"}</button></div>
  </form>`;
}

/* ---------- actions ---------- */
async function saveWeight(pid,date){
  const key=date+"|"+pid;const raw=S.drafts[key];if(raw==null)return true;
  const n=parseFloat(String(raw).replace(",","."));
  const ref=db.doc(`weights/${date}_${pid}`);
  const ok=await write(()=>n>0?ref.set({puppyId:pid,date,grams:Math.round(n*10)/10,ts:Date.now()}):ref.delete());
  if(ok)delete S.drafts[key];return ok;
}
document.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.tab){S.tab=t.dataset.tab;S.edit=null;render();return}
  if(t.dataset.bsex){bdraft(t.dataset.pid,"sex",t.dataset.bsex);t.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===t));return}
  if(t.id==="fcEdit"){S.fcEdit=true;render();document.getElementById("fc_time")?.focus();return}
  if(t.id==="fcNow"){const fd=document.getElementById("fc_date"),ft=document.getElementById("fc_time");fd.value=dmy(todayStr());ft.value=nowHM();S.fcd={date:fd.value,time:ft.value};markDirty();return}
  if(t.id==="expandAll"){S.all.forEach(p=>S.open.add(p.id));render();return}
  if(t.id==="collapseAll"){S.open.clear();render();return}
  if(t.dataset.addphoto){startPhoto(t.dataset.addphoto,t.dataset.stage,t.dataset.date);return}
  if(t.dataset.photo){openLB(t.dataset.photo,t.dataset.phid);return}
  if(t.dataset.dossier){S.dossier=t.dataset.dossier;S.tab="puppies";S.edit=null;render();window.scrollTo(0,0);return}
  if(t.dataset.otype){OT.type=OT.type===t.dataset.otype?"":t.dataset.otype;t.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.otype===OT.type));return}
  if(t.hasAttribute("data-litphoto")){startLitterPhoto();return}
  if(t.hasAttribute("data-litphotodel")){const old=S.info.cover;const r={...S.info};delete r.cover;if(await queue("litter",()=>write(()=>db.doc("meta/litter").set(r)))){try{const a=await assetsNS();a&&await a.delete(old)}catch(_){}toast("Снимката е махната")}return}
  if(t.id==="hCover"||t.closest&&t.closest("#hCover")){S.tab="puppies";S.dossier=null;render();return}
  if(t.hasAttribute("data-litteredit")){S.litterEdit=true;render();return}
  if(t.hasAttribute("data-litterclose")){S.litterEdit=false;render();return}
  if(t.dataset.vsel){S.vSel=t.dataset.vsel;render();return}
  if(t.dataset.accadd){S.accSearch=t.dataset.accadd;render();document.getElementById("acc_q")?.focus();return}
  if(t.dataset.eddel){await window.__roles.remove(t.dataset.eddel);toast("Editor-ът е премахнат");return}
  if(t.hasAttribute("data-accclose")){S.accSearch=null;render();return}
  if(false){const p=S.puppies.find(x=>x.id===t.dataset.pid);const acc=[...new Set([...(p.access||[]),t.dataset.acchit])];S.prof[t.dataset.acchit]=S.accRes.find(r=>r.id===t.dataset.acchit)||S.prof[t.dataset.acchit];if(await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({access:acc}))))toast("Достъпът е даден");S.accSearch=null;render();return}
  if(t.dataset.accdel){const p=S.puppies.find(x=>x.id===t.dataset.pid);const acc=(p.access||[]).filter(x=>x!==t.dataset.accdel);if(await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({access:acc}))))toast("Достъпът е махнат");return}
  if(t.dataset.goowner){S.tab="owners";S.dossier=null;render();setTimeout(()=>document.getElementById("ow_"+t.dataset.goowner)?.scrollIntoView({block:"start"}),50);return}
  if(t.dataset.owneropen){S.ownerOpen=S.ownerOpen===t.dataset.owneropen?null:t.dataset.owneropen;render();return}
  if(t.dataset.owneredit!=null){S.ownerEdit=t.dataset.owneredit||null;render();return}
  if(t.dataset.ownerclear){const pid=t.dataset.ownerclear;if(await queue(pid,()=>write(()=>db.doc("puppies/"+pid).update({owner:{__delete__:true}}))))toast("Собственикът е премахнат");S.ownerEdit=null;render();return}
  if(t.hasAttribute("data-closedossier")){S.dossier=null;render();return}
  if(t.dataset.msnow){await setMs(t.dataset.pid,t.dataset.msnow,todayStr());return}
  if(t.dataset.msclr){await setMs(t.dataset.pid,t.dataset.msclr,"");return}
  if(t.hasAttribute("data-dwall")){S.dwSel="all";render();return}
  if(t.dataset.dwp){let s2=S.dwSel==="all"?[]:[...S.dwSel];const id=t.dataset.dwp;s2=s2.includes(id)?s2.filter(x=>x!==id):[...s2,id];S.dwSel=s2.length?s2:"all";render();return}
  if(t.dataset.dwask){S.dwConfirm=t.dataset.dwask;render();return}
  if(t.hasAttribute("data-dwno")){S.dwConfirm=null;render();return}
  if(t.dataset.evdel){await write(()=>db.doc("events/"+t.dataset.evdel).delete());S.dwConfirm=null;toast("Събитието е изтрито");return}
  if(t.dataset.dwdel){await write(()=>db.doc("deworm/"+t.dataset.dwdel).delete());S.dwConfirm=null;toast("Записът е изтрит");return}
  if(t.dataset.setdate){S.date=t.dataset.setdate;render();return}
  if(t.dataset.draw){openDraw(t.dataset.draw);return}
  if(t.hasAttribute("data-foldba")){S.foldBA=!S.foldBA;render();return}
  if(t.dataset.bfold){S.open.delete(t.dataset.bfold);render();return}
  if(t.dataset.bdef!=null&&t.dataset.pid){bdraft(t.dataset.pid,"bdef",t.dataset.bdef==="1");render();return}
  if(t.dataset.bopen){S.open.add(t.dataset.bopen);render();return}
  if(t.dataset.bclose){delete S.bd[t.dataset.bclose];S.open.delete(t.dataset.bclose);render();return}
  if(t.dataset.savep){t.disabled=true;await savePuppy(t.dataset.savep);return}
  if(t.id==="saveBirth"){t.disabled=true;await saveBirth();return}
  if(t.id==="addBirth"){t.disabled=true;const order=Math.max(0,...S.all.map(p=>p.order||0))+1;const lastB=[...S.all].sort((x,y)=>(y.order||0)-(x.order||0))[0];let d=(lastB&&puppyBirth(lastB))||(S.info&&S.info.contractionDate)||todayStr();const live=d===todayStr()||d===shiftDate(todayStr(),-1);if(live)d=todayStr();const col="";
    const ref=db.collection("puppies").doc();S.open.add(ref.id);
    const ok=await write(()=>ref.set({name:`Кученце ${order}`,kennelName:"",petName:"",sex:"",collar:col,markings:"",birthWeight:null,birthTime:live?nowHM():"",order,birthDate:d,notes:""}));
    if(ok){await ensureLitterDate(d);toast(live?`Кученце №${order} е записано в ${nowHM()} ч.`:`Кученце №${order} е добавено към ${fmtDate(d)} — въведи часа`)}t.disabled=false;return}
  if(t.dataset.go){S.tab=t.dataset.go;render();return}
  if(t.dataset.shift){S.date=shiftDate(S.date,+t.dataset.shift);render();return}
  if(t.hasAttribute("data-today")){S.date=todayStr();render();return}
  if(t.dataset.mode){S.mode=t.dataset.mode;render();return}
  if(t.id==="saveAll"){t.disabled=true;const d=S.date;let n=0;for(const p of S.puppies){if(S.drafts[d+"|"+p.id]!=null){if(await saveWeight(p.id,d))n++}}if(n)toast(`Записани ${n} тегла`);render();return}
  if(t.dataset.edit){S.edit=t.dataset.edit;S.confirmDel=null;render();document.getElementById("p_name")?.focus();return}
  if(t.hasAttribute("data-cancel")){S.edit=null;render();return}
  if(t.dataset.sex){PF.sex=t.dataset.sex;t.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===t));return}
  if(t.dataset.collar!=null){PF.collar=t.dataset.collar;t.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===t));return}
  if(t.dataset.askdel){S.confirmDel=t.dataset.askdel;render();return}
  if(t.hasAttribute("data-nodel")){S.confirmDel=null;render();return}
  if(t.dataset.del){const id=t.dataset.del;t.disabled=true;for(const w of S.weights.filter(w=>w.puppyId===id)){await write(()=>db.doc("weights/"+w.id).delete())}await write(()=>db.doc("puppies/"+id).delete());S.confirmDel=null;delete S.bd[id];S.open.delete(id);toast("Кученцето е изтрито");return}
  if(t.id==="clearEx"){t.disabled=true;t.textContent="Изчистване…";
    for(const w of S.weights.filter(w=>w.example))await write(()=>db.doc("weights/"+w.id).delete());
    for(const p of S.puppies.filter(p=>p.example))await write(()=>db.doc("puppies/"+p.id).delete());
    if(S.info&&S.info.example)await write(()=>db.doc("meta/litter").delete());
    S.tab="puppies";toast("Примерните данни са изчистени");render();return}
});
document.addEventListener("input",e=>{
  const el=e.target;

  if(el.classList&&el.classList.contains("tfield")&&e.inputType&&!e.inputType.startsWith("delete")){let v=el.value.replace(/[^\d:]/g,"");if(!v.includes(":")){if(v.length===1&&+v>2)v=v+":";else if(v.length===2&&+v<=23)v=v+":";else if(v.length===3)v=+v[0]>2?v[0]+":"+v.slice(1):v.slice(0,2)+":"+v.slice(2);else if(v.length>=4)v=v.slice(0,2)+":"+v.slice(2,4)}el.value=v.slice(0,5)}
  if(el.id==="fc_date"||el.id==="fc_time"){S.fcd={date:document.getElementById("fc_date").value,time:document.getElementById("fc_time").value};markDirty()}
  {const bm=el.id&&el.id.match(/^(bd|bt|bw|bm|bf)_(.+)$/);if(bm&&!el.id.endsWith("_cal"))bdraft(bm[2],bm[1],el.value)}
  if(el.tagName==="INPUT"&&el.dataset&&el.dataset.pid){el.value=el.value.replace(/[^\d.,]/g,"");const key=S.date+"|"+el.dataset.pid;const w=wFor(el.dataset.pid,S.date);
    if(w&&String(w.grams)===el.value)delete S.drafts[key];else if(!w&&el.value==="")delete S.drafts[key];else S.drafts[key]=el.value;
    const p=S.puppies.find(x=>x.id===el.dataset.pid);const cell=document.getElementById("dl_"+el.dataset.pid);if(p&&cell)cell.innerHTML=deltaH(prevFor(p,S.date),S.date,el.value,stats(p).bw);
    el.closest(".gin")?.classList.remove("saved");refreshSaveAll()}
});
document.addEventListener("change",async e=>{const c=e.target;
  if(c.id==="importFile"&&c.files&&c.files[0]){const txt=await c.files[0].text();try{await window.__importLitter(JSON.parse(txt))}catch(err){toast("Импортът не успя: "+(err&&err.message||""))}c.value="";return}
  if(c.dataset&&c.dataset.msnote!=null&&c.dataset.pid){const pid=c.dataset.pid;await queue(pid,()=>write(()=>db.doc("puppies/"+pid).update({msNote:{[c.dataset.msnote]:c.value.trim()}})));toast("Коментарът е запазен");return}
  if(c.dataset&&c.dataset.mscomment!=null&&c.dataset.pid){const pid=c.dataset.pid;await queue(pid,()=>write(()=>db.doc("puppies/"+pid).update({devNote:c.value.trim()})));toast("Бележката е запазена");return}
  if(c.id==="ev_type"){S.evType=c.value;const vet=c.value==="vet";const n=document.getElementById("ev_note");n.rows=vet?4:1;n.placeholder=vet?"какво е прегледано, тегло, препоръки, следващ преглед…":"напр. препарат, доза, наблюдение";document.getElementById("ev_note_l").textContent=vet?"Коментар от прегледа":"Коментар";if(vet)n.focus();return}
  if(c.dataset&&c.dataset.ms&&c.value){await setMs(c.dataset.pid,c.dataset.ms,c.value);return}
  if(c.dataset&&c.dataset.msall&&c.value){const k=c.dataset.msall;let n=0;for(const p of S.puppies){if(!(p.ms&&p.ms[k])){if(await setMs(p.id,k,c.value))n++}}toast(n?`Записано за ${n} кученца`:"Всички вече имат дата");return}
if(c.dataset&&c.dataset.for){if(!c.value)return;const t=document.getElementById(c.dataset.for);t.value=dmy(c.value);if(c.dataset.for==="dpick"){S.date=c.value;render()}else if(c.dataset.for==="fc_date"){S.fcd={date:t.value,time:document.getElementById("fc_time").value};markDirty()}else if(c.dataset.for.startsWith("bd_"))bdraft(c.dataset.for.slice(3),"bd",t.value);return}
  if(c.id&&c.id.startsWith("bl_")){bdraft(c.id.slice(3),"lost",c.checked);render();return}
  if(c.id&&c.id.startsWith("br_")){bdraft(c.id.slice(3),"lr",c.value);return}
  if(c.id&&c.id.startsWith("bco_")){bdraft(c.id.slice(4),"bco",c.value);return}
  if(c.id&&c.id.startsWith("btl_")){bdraft(c.id.slice(4),"btl",c.value);return}
  if(c.id&&c.id.startsWith("bc_")){bdraft(c.id.slice(3),"bc",c.value);return}
  if(e.target.id==="dpick"){const iso=parseDMY(e.target.value);if(iso){S.date=iso;render()}else{toast("Въведи дата като ден/месец/година");e.target.value=dmy(S.date)}}});
document.addEventListener("keydown",async e=>{
  const el=e.target;if(e.key==="Enter"&&el.id==="dpick"){e.preventDefault();el.blur();return}if(e.key!=="Enter"||el.tagName!=="INPUT"||!el.dataset||!el.dataset.pid)return;e.preventDefault();
  const idx=+el.dataset.idx;const pid=el.dataset.pid;
  const ok=await saveWeight(pid,S.date);
  render();const next=S.puppies[idx+1];if(next)document.getElementById("w_"+next.id)?.focus();else if(ok)toast("Претеглянето е записано");
});
document.addEventListener("submit",async e=>{
  e.preventDefault();const f=e.target;
  if(f.id==="litterForm"){const v=id=>document.getElementById(id).value.trim();
    const lb=parseDMY(v("l_birth"));if(lb===null){toast("Датата на раждане трябва да е ден/месец/година");document.getElementById("l_birth").focus();return}
    const ok=await write(()=>db.doc("meta/litter").set({...(S.info||{}),name:v("l_name"),breed:v("l_breed"),mother:v("l_mother"),father:v("l_father"),birthDate:lb}));
    if(ok){S.litterEdit=false;toast("Кучилото е запазено");render()}return}
  if(f.dataset&&f.dataset.accform){const em=document.getElementById("acc_q").value.trim().toLowerCase();if(!em)return;const p=S.puppies.find(x=>x.id===f.dataset.accform);const acc=[...new Set([...(p.access||[]),em])];if(await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({access:acc}))))toast("Достъпът е даден");S.accSearch=null;render();return}
  if(f.id==="edForm"){const em=document.getElementById("ed_q").value.trim().toLowerCase();if(!em)return;await window.__roles.add(em);toast("Editor-ът е добавен");return}
  if(f.id==="ownerForm"){const v=id=>document.getElementById(id).value.trim();const pid=f.dataset.pid;const d=parseDMY(v("o_date"));if(d===null){toast("Датата трябва да е ден/месец/година");return}
    if(!v("o_name")){toast("Въведи име на собственика");document.getElementById("o_name").focus();return}
    const ck=id=>document.getElementById(id).checked;const owner={name:v("o_name"),phone:v("o_phone"),email:v("o_email"),city:v("o_city"),date:d||"",deal:v("o_price"),note:v("o_note"),deposit:ck("o_dep"),paid:ck("o_paid"),pedNat:ck("o_pn"),pedInt:ck("o_pi"),type:OT.type||"",price:parseFloat(v("o_amt").replace(",","."))||null,depositAmt:parseFloat(v("o_depamt").replace(",","."))||null};OT={type:""};
    const ok=await queue(pid,()=>write(()=>db.doc("puppies/"+pid).update({owner})));
    if(ok){S.ownerEdit=null;toast("Собственикът е запазен");render()}return}
  if(f.id==="evForm"){const v=id=>document.getElementById(id).value.trim();const d=parseDMY(v("ev_date"));if(!d){toast("Датата трябва да е ден/месец/година");return}
    const type=v("ev_type");S.evType=type;S.evDate=d;
    const ok=await write(()=>db.collection("events").doc().set({date:d,type,note:v("ev_note"),puppies:S.dwSel==="all"?"all":S.dwSel,ts:Date.now()}));
    if(ok){toast(`${evLabel(type)} е записано`);S.dwSel="all";render()}return}
  if(f.id==="dwForm"){const v=id=>document.getElementById(id).value.trim();const d=parseDMY(v("dw_date"));if(!d){toast("Датата трябва да е ден/месец/година");return}
    const ok=await write(()=>db.collection("deworm").doc().set({date:d,product:v("dw_prod"),dose:v("dw_dose"),note:v("dw_note"),puppies:S.dwSel==="all"?"all":S.dwSel}));
    if(ok){toast("Обезпаразитяването е записано");S.dwSel="all";render()}return}
  if(f.id==="pupForm"){const v=id=>document.getElementById(id).value.trim();
    if(!v("p_name")&&!v("p_kennel")&&!v("p_pet")){toast("Въведи поне едно име");document.getElementById("p_name").focus();return}
    if(!PF.sex){toast("Избери пол");return}
    const pt=parseHM(v("p_time"));if(pt===null){toast("Часът трябва да е чч:мм, напр. 14:35");document.getElementById("p_time").focus();return}
    const pbd=parseDMY(v("p_bdate"));if(pbd===null){toast("Датата на раждане трябва да е ден/месец/година");document.getElementById("p_bdate").focus();return}
    const data={name:v("p_name"),kennelName:v("p_kennel"),petName:v("p_pet"),coat:v("p_coat"),tail:v("p_tail"),sex:PF.sex,collar:PF.collar,markings:v("p_mark"),birthWeight:parseFloat(v("p_bw").replace(",","."))||null,birthTime:pt,order:parseInt(v("p_order"))||null,birthDate:pbd&&pbd!==birthDate()?pbd:null,notes:v("p_notes")};
    const ref=PF.id?db.doc("puppies/"+PF.id):db.collection("puppies").doc();
    const old=PF.id?S.puppies.find(p=>p.id===PF.id):null;if(old&&old.example)data.example=true;
    let ok=await write(()=>ref.set(data));
    const bd=pbd||birthDate();
    if(ok&&data.birthWeight&&bd)ok=await write(()=>db.doc(`weights/${bd}_${ref.id}`).set({puppyId:ref.id,date:bd,grams:data.birthWeight,ts:Date.now(),...(data.example?{example:true}:{})}));
    if(ok){toast(PF.id?"Промените са запазени":"Кученцето е добавено");S.edit=null;render()}}
});


/* ---------- birth ---------- */
function tsOf(d,t){if(!d||!t)return null;const x=Date.parse(`${d}T${t}:00`);return isNaN(x)?null:x}
function dur(ms){if(ms==null||isNaN(ms))return"—";const m=Math.round(ms/60000);const h=Math.floor(m/60);return (h?`${h} ч `:"")+`${m%60} мин`}
function nowHM(){const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
const BQ={};function queue(id,fn){BQ[id]=(BQ[id]||Promise.resolve()).then(fn,fn);return BQ[id]}
async function ensureLitterDate(d){if(d&&!(S.info&&S.info.birthDate))await queue("litter",()=>write(()=>db.doc("meta/litter").set({...(S.info||{}),birthDate:d})))}
function bdraft(pid,k,v){(S.bd[pid]=S.bd[pid]||{})[k]=v;markDirty()}
function dirtyCount(){return Object.keys(S.bd).filter(k=>Object.keys(S.bd[k]).length).length+(S.fcd?1:0)}
function markDirty(){
  document.querySelectorAll("[data-savep]").forEach(b=>{const d=S.bd[b.dataset.savep];const on=!!(d&&Object.keys(d).length);b.disabled=!on;b.closest(".brow")?.classList.toggle("dirty",on)});
  const all=document.getElementById("saveBirth");if(all){const n=dirtyCount();all.disabled=!n;all.textContent=n?`Запази раждане (${n})`:"Запази раждане"}
  const fs=document.getElementById("fcState");if(fs)fs.hidden=!S.fcd;
}
async function saveContraction(){
  if(!S.fcd)return true;
  const d=parseDMY(S.fcd.date),t=parseHM(S.fcd.time);
  if(d===null){toast("Първа контракция: датата трябва да е ден/месец/година");return false}
  if(t===null){toast("Първа контракция: часът трябва да е чч:мм");return false}
  const ok=await queue("litter",()=>write(()=>db.doc("meta/litter").set({...(S.info||{}),contractionDate:d||"",contractionTime:t||""})));
  if(ok){S.fcd=null;S.fcEdit=false}return ok;
}
async function savePuppy(pid,quiet){
  const p=S.all.find(x=>x.id===pid);const d=S.bd[pid];if(!p||!d||!db){delete S.bd[pid];return true}
  const no=`№${p.order||""}`;const up={};
  if(d.bd!=null){const iso=parseDMY(d.bd);if(iso===null){toast(`${no}: датата трябва да е ден/месец/година`);markDirty();return false}up.birthDate=iso||null}
  if(d.bt!=null){const t=parseHM(d.bt);if(t===null){toast(`${no}: часът трябва да е чч:мм`);markDirty();return false}up.birthTime=t}
  if(d.bw!=null)up.birthWeight=parseFloat(String(d.bw).replace(",","."))||null;
  if(d.bc!=null)up.collar=d.bc;
  if(d.bco!=null)up.coat=d.bco;
  if(d.btl!=null)up.tail=d.btl;
  if(d.bm!=null)up.markings=d.bm.trim();
  if(d.sex!=null)up.sex=d.sex;
  if(d.lost!=null)up.lost=!!d.lost;
  if(d.lr!=null)up.lostReason=d.lr;
  if(d.bdef!=null)up.deform=!!d.bdef;
  if(d.bf!=null)up.deformDesc=d.bf.trim();
  if(up.deform===false)up.deformDesc="";
  const isLost="lost" in up?up.lost:!!p.lost;
  if(!isLost&&p.lostReason)up.lostReason="";
  if(isLost){delete up.birthWeight;delete up.collar;delete up.markings;up.birthWeight=null;up.collar="";up.markings="";up.marks=null;up.lost=true}
  const oldD=puppyBirth(p),oldW=p.birthWeight||null;
  let ok=await queue(pid,()=>write(()=>db.doc("puppies/"+pid).update(up)));
  if(!ok){markDirty();return false}
  if(isLost){for(const w of S.weights.filter(w=>w.puppyId===pid))await write(()=>db.doc("weights/"+w.id).delete());await ensureLitterDate(("birthDate" in up?up.birthDate:p.birthDate)||birthDate());delete S.bd[pid];S.open.delete(pid);if(!quiet){toast(`${no} е записано като изгубено`);render()}return true}
  const newD=("birthDate" in up?up.birthDate:p.birthDate)||birthDate();
  const newW="birthWeight" in up?up.birthWeight:oldW;
  if(oldD&&oldW&&oldD!==newD)await write(()=>db.doc(`weights/${oldD}_${pid}`).delete());
  if(newD&&(newW!==oldW||newD!==oldD))await write(()=>newW?db.doc(`weights/${newD}_${pid}`).set({puppyId:pid,date:newD,grams:newW,ts:Date.now(),...(p.example?{example:true}:{})}):db.doc(`weights/${newD}_${pid}`).delete());
  await ensureLitterDate(newD);
  delete S.bd[pid];S.open.delete(pid);
  if(!quiet){toast(`Кученце ${no} е запазено`);render()}
  return true;
}
async function saveBirth(){
  let ok=await saveContraction();
  for(const pid of Object.keys(S.bd)){if(!(await savePuppy(pid,true)))ok=false}
  if(ok)toast("Раждането е запазено");render();
}
function birthTimelineV(fc,list){
  const ev=list.filter(x=>x.ts!=null).sort((a,c)=>a.ts-c.ts);
  const t2=t=>{const d=new Date(t);return {d:String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0"),h:String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}};
  let h="";let prevDay=null;
  const row=(t,mark,body,gap)=>{const q=t2(t);const day=q.d!==prevDay?q.d:"";prevDay=q.d;return `<li><div class="tv-t"><b class="num">${q.h}</b>${day?`<span class="num">${day}</span>`:""}</div><div class="tv-m">${mark}</div><div class="tv-b"><div class="tv-l">${body}</div>${gap?`<div class="tv-g">${gap}</div>`:""}</div></li>`};
  if(fc!=null)h+=row(fc,`<span class="tv-fc"></span>`,`<b>1-ва контракция</b>`,"");
  ev.forEach((x,k)=>{const p=x.p;const g=k?x.ts-ev[k-1].ts:(fc!=null?x.ts-fc:null);
    h+=row(x.ts,p.lost?`<span class="lostmark">✕</span>`:dotH(p),`<b${p.lost?' style="color:var(--bad)"':""}>№${p.order||"?"}</b> <span class="sex ${p.sex||""}">${p.sex==="m"?"♂ мъжко":p.sex==="f"?"♀ женско":p.sex==="u"?"неопределим":"? без пол"}</span> ${p.lost?`<span class="pill bad">Изгубено${p.lostReason?" · "+esc(p.lostReason):""}</span>`:""}${p.deform?` <span class="pill warn">Деформация</span>`:""}`,g!=null?`<span class="muted small">${k?"след предишното":"след контракцията"}</span> ${gapPill(g)}`:"")});
  return `<ol class="tv">${h}</ol>`;
}
function birthTimeline(fc,list){
  const pts=list.filter(x=>x.ts!=null);const all=[...pts.map(x=>x.ts),...(fc!=null?[fc]:[])];if(!all.length)return"";
  let a=Math.min(...all),b=Math.max(...all);if(b-a<3600e3)b=a+3600e3;const pad=(b-a)*.04;a-=pad;b+=pad;
  const W=760,H=96,L=14,R=14,y=50;const x=t=>L+(t-a)/(b-a)*(W-L-R);
  const hr=3600e3;let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Хронология на раждането"><line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="2"/>`;
  const span=b-a;const step=[1,2,3,6,12,24,48].map(h=>h*hr).find(st=>span/st<=10)||96*hr;
  const t0=new Date(a);t0.setMinutes(0,0,0);for(let t=t0.getTime()+hr;t<=b;t+=hr){const d=new Date(t);if(d.getHours()%(step/hr>=24?24:step/hr))continue;s+=`<line x1="${x(t)}" x2="${x(t)}" y1="${y-4}" y2="${y+4}" stroke="var(--muted)"/><text x="${x(t)}" y="${y+22}" text-anchor="middle" font-size="11.5" fill="var(--muted)" font-family="var(--mono)">${step>=24*hr?`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`:String(d.getHours()).padStart(2,"0")+":00"}</text>`}
  if(fc!=null)s+=`<line x1="${x(fc)}" x2="${x(fc)}" y1="${y-26}" y2="${y+6}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3"/><text x="${x(fc)}" y="${y-31}" text-anchor="${x(fc)<80?"start":"middle"}" font-size="11.5" fill="var(--accent)" font-weight="600">1-ва контракция</text>`;
  pts.forEach(({p,ts})=>{const q=pc(p),c=q.hex;s+=p.lost?`<circle cx="${x(ts)}" cy="${y}" r="8" fill="var(--sunk)" stroke="var(--muted)" stroke-width="2"/><path d="M${x(ts)-4} ${y-4} l8 8 M${x(ts)+4} ${y-4} l-8 8" stroke="var(--muted)" stroke-width="2"/>`:q.none?`<circle cx="${x(ts)}" cy="${y}" r="8" fill="var(--surface)" stroke="${c}" stroke-width="2.5" stroke-dasharray="3 2"/>`:`<circle cx="${x(ts)}" cy="${y}" r="9" fill="${c}" stroke="var(--surface)" stroke-width="2"/>`;s+=`<text x="${x(ts)}" y="${y-15}" text-anchor="middle" font-size="11" fill="var(--ink)" font-weight="700" font-family="var(--mono)">${p.order||""}</text>`});
  return s+`</svg>`;
}
function viewBirth(){
  const i=S.info||{};const ro=!(S.canWrite&&db);
  const fc=tsOf(i.contractionDate,i.contractionTime);
  const list=[...S.all].sort((a,c)=>(a.order||99)-(c.order||99)).map(p=>({p,ts:tsOf(puppyBirth(p),p.birthTime)}));
  const chron=list.filter(x=>x.ts!=null).sort((a,c)=>a.ts-c.ts);chron.forEach((x,j)=>{x.gap=j?x.ts-chron[j-1].ts:(fc!=null?x.ts-fc:null);x.first=j===0});list.forEach(x=>{x.fromFc=x.ts!=null&&fc!=null?x.ts-fc:null;if(x.gap===undefined)x.gap=null});
  const born=list.filter(x=>x.ts!=null);const gaps=list.slice(1).map((x,k)=>x.gap).filter((g,k)=>g!=null&&list[k+1].gap!=null);
  const between=chron.slice(1).map(x=>x.gap);
  const avgGap=between.length?between.reduce((a,b)=>a+b,0)/between.length:null;
  const lastTs=born.length?Math.max(...born.map(x=>x.ts)):null;
  const m=S.puppies.filter(p=>p.sex==="m").length,f=S.puppies.filter(p=>p.sex==="f").length;const lostN=S.all.length-S.puppies.length;
  const rows=list.map((x,k)=>{const p=x.p,id=p.id;const D=S.bd[id]||{};const dv=(k2,v)=>D[k2]!=null?D[k2]:v;const dirty=Object.keys(D).length>0;
    const sx=dv("sex",p.sex),cl=dv("bc",p.collar);const lost=!!dv("lost",p.lost);const lr=dv("lr",p.lostReason||"");const df=!!dv("bdef",p.deform);const dfd=dv("bf",p.deformDesc||"");
    const num=`№${p.order||k+1}`;const mark=lost?`<span class="lostmark" aria-hidden="true">✕</span>`:dotH(p);
    const statusP=lost?`<span class="pill bad">Изгубено${lr?` · ${esc(lr)}`:""}</span>`:`<span class="pill ok">Живо</span>`;
    const defP=df?`<span class="pill warn">Деформация</span>`:"";
    if(!S.open.has(id))return `<div class="brow collapsed${lost?" lost":""}${dirty?" dirty":""}"><div class="bcol">${mark}<b class="num">${num}</b><span class="sex ${sx||""}">${sx==="m"?"♂ мъжко":sx==="f"?"♀ женско":sx==="u"?"пол неопределим":"пол не е въведен"}</span>${statusP}${defP}${dirty?`<span class="small" style="color:var(--accent);font-weight:600">незапазено</span>`:""}<span class="grow"></span><button class="btn ghost chev" data-bopen="${id}" aria-label="Разгъни">▾</button></div></div>`;
    const head=`<div class="bno bhead">${mark}<b>${num}</b>${lost?statusP:""}${defP}<span class="grow"></span><button class="btn ghost chev" data-bfold="${id}" aria-label="Свий">▴</button></div>`;
    const lostChk=`<label class="lostchk"><input type="checkbox" id="bl_${id}" ${lost?"checked":""} ${ro?"disabled":""}> Изгубено</label>`;
    const gapH=`<div class="bgap small">${x.first?(x.fromFc!=null?`<span class="muted">от 1-вата контракция:</span> ${gapPill(x.fromFc)}`:""):(x.gap!=null?`<span class="muted">от предишното:</span> ${gapPill(x.gap)}`:"")}${!lost&&(p.petName||p.kennelName)?` <span class="muted">· ${esc(dn(p))}</span>`:""}</div>`;
    const defH=`<div class="field bdef"><span class="flabel">Деформация</span><div class="sexpick" role="group" aria-label="Деформация"><button type="button" data-bdef="0" data-pid="${id}" aria-pressed="${!df}" ${ro?"disabled":""}>Не</button><button type="button" data-bdef="1" data-pid="${id}" aria-pressed="${df}" ${ro?"disabled":""}>Да</button></div></div>${df?`<div class="field bdefd"><label for="bf_${id}">Описание на деформацията</label><input id="bf_${id}" value="${esc(dfd)}" placeholder="напр. извита лапа, цепнато небце…" ${ro?"disabled":""}></div>`:""}`;
    const saveH=ro?"":`<div class="bsave"><span class="unsaved small">Незапазени промени</span>${S.confirmDel===id?`<button class="btn danger" data-del="${id}">Потвърди изтриване</button><button class="btn ghost" data-nodel>Не</button>`:`<button class="btn ghost" data-askdel="${id}" style="margin-right:auto;color:var(--bad)">Изтрий записа</button>`}${dirty?`<button class="btn ghost" data-bclose="${id}">Отказ</button>`:""}<button class="btn" data-savep="${id}" ${dirty?"":"disabled"}>Запази кученце</button></div>`;
    const dateH=`<div class="field bdate"><label for="bd_${id}">Дата</label>${dateField("bd_"+id,puppyBirth(p),ro?"disabled":"",D.bd)}</div>`;
    const timeH=`<div class="field btime"><label for="bt_${id}">Час на раждане</label>${timeField("bt_"+id,dv("bt",p.birthTime),ro?"disabled":"")}</div>`;
    const sexH=`<div class="field"><span class="flabel">Пол</span><div class="sexpick" role="group" aria-label="Пол"><button type="button" class="sxm" data-bsex="m" data-pid="${id}" aria-pressed="${sx==="m"}" ${ro?"disabled":""}>♂</button><button type="button" class="sxf" data-bsex="f" data-pid="${id}" aria-pressed="${sx==="f"}" ${ro?"disabled":""}>♀</button><button type="button" class="sxu" data-bsex="u" data-pid="${id}" aria-pressed="${sx==="u"}" ${ro?"disabled":""} title="Неопределим">неопр.</button></div></div>`;
    const brk=`<div class="brk"></div>`;
    if(lost)return `<div class="brow open lost${dirty?" dirty":""}">${head}${dateH}${timeH}${sexH}${defH}${brk}<div class="field lostf">${lostChk}</div>
      <div class="field"><label for="br_${id}">Причина</label><select id="br_${id}" ${ro?"disabled":""}><option value="" ${!lr?"selected":""}>— избери —</option>${LOST_REASONS.map(r=>`<option ${lr===r?"selected":""}>${r}</option>`).join("")}</select></div>
      ${gapH}${saveH}</div>`;
    return `<div class="brow open${dirty?" dirty":""}">${head}${dateH}${timeH}
      <div class="field"><label for="bw_${id}">Тегло (г)</label><input id="bw_${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(dv("bw",p.birthWeight)??"")}" ${ro?"disabled":""}></div>
      ${sexH}${defH}${brk}
      <div class="field bmark"><label for="bm_${id}">Отличителни белези</label><input id="bm_${id}" value="${esc(dv("bm",p.markings))}" placeholder="окраска, петна, белези…" ${ro?"disabled":""}><div class="drawbtn">${marksSVG(p.marks)}${ro?"":`<button type="button" class="btn" data-draw="${id}">✎ ${p.marks&&p.marks.strokes&&p.marks.strokes.length?"Промени рисунката":"Нарисувай белезите"}</button>`}</div></div>
      ${brk}
      <div class="field"><label for="bco_${id}">Цвят</label><select id="bco_${id}" ${ro?"disabled":""}>${optList(COATS,dv("bco",p.coat||""))}</select></div>
      <div class="field"><label for="btl_${id}">Опашка</label><select id="btl_${id}" ${ro?"disabled":""}>${optList(TAILS,dv("btl",p.tail||""))}</select></div>
      <div class="field"><label for="bc_${id}">Каишка</label><select id="bc_${id}" ${ro?"disabled":""}><option value="" ${!cl?"selected":""}>— още няма —</option>${COLLARS.map(c=>`<option value="${c.id}" ${cl===c.id?"selected":""}>${c.name}</option>`).join("")}</select></div>
      <div class="field lostf">${lostChk}</div>
      <div class="field bphoto"><span class="flabel">Снимки</span><div class="row" style="gap:8px">${thumbs(p,photosOf(p,"birth"))}${ro?"":camBtn(p,"birth",puppyBirth(p),"Добави")}</div></div>
      ${gapH}${saveH}</div>`}).join("");
  return `<div class="stack">
    ${i.contractionDate&&i.contractionTime&&!S.fcEdit&&!S.fcd?`<div class="panel fcsaved"><span class="flabel">Първа контракция</span><b class="num">${fmtDate(i.contractionDate)} · ${esc(i.contractionTime)}</b><span class="grow"></span>${ro?"":`<button class="btn" id="fcEdit">✎ Редакция</button>`}</div>`:`<div class="panel"><div class="sec-h" style="padding:14px 16px 0;margin:0"><h2>Първа контракция</h2></div>
      <div class="fcrow"><div class="field"><label for="fc_date">Дата</label>${dateField("fc_date",i.contractionDate||"",ro?"disabled":"",S.fcd?S.fcd.date:undefined)}</div>
      <div class="field"><label for="fc_time">Час</label>${timeField("fc_time",S.fcd?S.fcd.time:i.contractionTime,ro?"disabled":"")}</div>
      <button class="btn" id="fcNow" ${ro?"disabled":""}>Сега</button><span class="unsaved small" id="fcState" ${S.fcd?"":"hidden"}>Незапазено — натисни „Запази раждане“</span></div></div>`}
    <div class="tiles">
      <div class="panel tile"><div class="k">Първа контракция</div><div class="v num" style="font-size:22px">${i.contractionTime?esc(i.contractionTime):"—"}</div><div class="s">${i.contractionDate?fmtDate(i.contractionDate):"не е въведена"}</div></div>
      <div class="panel tile"><div class="k">Родени</div><div class="v num">${S.all.length}</div><div class="s">${S.puppies.length} живи: ${m} ♂ · ${f} ♀${S.puppies.length-m-f?` · ${S.puppies.length-m-f} без пол`:""}${lostN?` · <span style="color:var(--bad)">${lostN} изгубени</span>`:""}</div></div>
      <div class="panel tile"><div class="k">Продължителност</div><div class="v num" style="font-size:22px">${fc!=null&&lastTs!=null?dur(lastTs-fc):"—"}</div><div class="s">от 1-вата контракция до последното</div></div>
      <div class="panel tile"><div class="k">Среден интервал</div><div class="v num" style="font-size:22px;color:${avgGap!=null?gapBand(avgGap).c:"inherit"}">${dur(avgGap)}</div><div class="s">между кученцата</div></div>
    </div>
    ${born.length||fc!=null?`<div class="panel tl-h" style="padding:8px 10px 2px;overflow-x:auto">${birthTimeline(fc,list)}</div><div class="panel tl-v">${birthTimelineV(fc,list)}</div>`:""}
    <div>
      <div class="sec-h"><h2>Родени кученца</h2><div class="row">${list.length?(list.every(x=>S.open.has(x.p.id))?`<button class="btn" id="collapseAll">Свий всички</button>`:`<button class="btn" id="expandAll">Разгъни всички</button>`):""}${ro?"":`<button class="btn primary" id="addBirth">+ Роди се кученце</button>`}</div></div>
      ${list.length?`<div class="panel blist">${rows}</div>`:`<div class="notice">Натисни „Роди се кученце“ при всяко раждане — часът се записва автоматично и после можеш да го коригираш.</div>`}
      ${ro?"":`<div class="savebar"><span class="small muted">„Запази кученце“ записва един ред. „Запази раждане“ записва първата контракция и всички редове наведнъж.</span><button class="btn primary" id="saveBirth" ${dirtyCount()?"":"disabled"}>Запази раждане${dirtyCount()?` (${dirtyCount()})`:""}</button></div>`}
      <p class="small muted" style="margin-top:10px">Всичко тук попълва автоматично раздел „Кучило“. Имената, развъдното име и бележките добавяш там.</p>
    </div>
  </div>`;
}


/* ---------- markings drawing ---------- */
const SIL=`<g fill="#ece6dc" stroke="#7d756c" stroke-width="5" stroke-linejoin="round">
<path d="M360 470 L360 610 Q360 630 380 630 L405 630 Q420 630 420 612 L420 500 Z"/><path d="M445 480 L445 612 Q445 632 465 632 L490 632 Q505 632 505 614 L505 505 Z"/>
<path d="M640 480 L640 612 Q640 632 660 632 L685 632 Q700 632 700 614 L700 505 Z"/><path d="M720 470 L720 600 Q720 620 740 620 L765 620 Q780 620 780 602 L780 480 Z"/>
<ellipse cx="820" cy="350" rx="48" ry="26" transform="rotate(-25 820 350)"/>
<ellipse cx="560" cy="410" rx="270" ry="135"/>
<path d="M205 205 L240 75 L300 200 Z"/><path d="M290 195 L345 80 L370 215 Z"/>
<circle cx="285" cy="300" r="120"/><ellipse cx="175" cy="340" rx="80" ry="55"/>
</g><circle cx="250" cy="285" r="11" fill="#3a332c"/><ellipse cx="102" cy="330" rx="17" ry="13" fill="#3a332c"/>`;
const SIL_URL="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700">${SIL}</svg>`);
const silImg=new Image();silImg.src=SIL_URL;
function strokePath(st){const p=st.pts;if(!p.length)return"";if(p.length===1)return `M${p[0][0]} ${p[0][1]} l0.1 0`;return "M"+p.map(q=>q[0]+" "+q[1]).join(" L")}
function marksSVG(m){if(!m||!m.strokes||!m.strokes.length)return"";return `<svg class="mthumb" viewBox="0 0 1000 700" role="img" aria-label="Скица на белезите">${m.sil===false?"":SIL}${m.strokes.map(st=>`<path d="${strokePath(st)}" fill="none" stroke="${st.c}" stroke-width="${st.w}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>`}
const DR={pid:null,strokes:[],cur:null,pen:"#ffffff",size:24,sil:true};
function drawRedraw(){const cv=document.getElementById("drawCanvas"),cx=cv.getContext("2d");cx.fillStyle="#cfd8d4";cx.fillRect(0,0,1000,700);
  if(DR.sil&&silImg.complete)cx.drawImage(silImg,0,0,1000,700);
  cx.lineCap="round";cx.lineJoin="round";
  for(const st of DR.strokes){cx.strokeStyle=st.c;cx.lineWidth=st.w;cx.beginPath();st.pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));if(st.pts.length===1)cx.lineTo(st.pts[0][0]+.1,st.pts[0][1]);cx.stroke()}}
silImg.onload=()=>{if(!document.getElementById("drawModal").hidden)drawRedraw()};
function drawSync(){document.querySelectorAll(".pen").forEach(b=>b.setAttribute("aria-pressed",b.dataset.pen===DR.pen));document.querySelectorAll("[data-size]").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.size===DR.size));document.getElementById("drawSil").textContent=DR.sil?"Без силует":"Със силует"}
async function openDraw(pid){const p=S.puppies.find(x=>x.id===pid);if(!p)return;DR.pid=pid;
  DR.strokes=p.marks&&p.marks.strokes?JSON.parse(JSON.stringify(p.marks.strokes)):[];DR.sil=!(p.marks&&p.marks.sil===false);
  document.getElementById("drawTitle").textContent=`Белези — ${dn(p)}`;document.getElementById("drawText").value="";
  const m=document.getElementById("drawModal");m.hidden=false;drawSync();drawRedraw();
  const ask=document.getElementById("drawAsk");ask.hidden=true;
  try{const smp=await window.claude.use("sample");const lim=smp&&await smp.limits().catch(()=>null);ask.hidden=!(lim&&lim.images)}catch(_){}
}
function closeDraw(){document.getElementById("drawModal").hidden=true;DR.pid=null;DR.cur=null}
(function bindDraw(){
  const cv=document.getElementById("drawCanvas");
  const pt=e=>{const r=cv.getBoundingClientRect();return [Math.round((e.clientX-r.left)/r.width*1000),Math.round((e.clientY-r.top)/r.height*700)]};
  cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);DR.cur={c:DR.pen,w:DR.size,pts:[pt(e)]};DR.strokes.push(DR.cur);drawRedraw()});
  cv.addEventListener("pointermove",e=>{if(!DR.cur)return;const q=pt(e),l=DR.cur.pts[DR.cur.pts.length-1];if(Math.abs(q[0]-l[0])+Math.abs(q[1]-l[1])<4)return;DR.cur.pts.push(q);drawRedraw()});
  const end=()=>{DR.cur=null};cv.addEventListener("pointerup",end);cv.addEventListener("pointercancel",end);
  document.getElementById("drawModal").addEventListener("click",async e=>{
    const t=e.target.closest("button");if(e.target.id==="drawModal"){closeDraw();return}if(!t)return;
    if(t.dataset.pen){DR.pen=t.dataset.pen;drawSync();return}
    if(t.dataset.size){DR.size=+t.dataset.size;drawSync();return}
    if(t.id==="drawUndo"){DR.strokes.pop();drawRedraw();return}
    if(t.id==="drawClear"){DR.strokes=[];drawRedraw();return}
    if(t.id==="drawSil"){DR.sil=!DR.sil;drawSync();drawRedraw();return}
    if(t.id==="drawClose"||t.id==="drawCancel"){closeDraw();return}
    if(t.id==="drawAsk"){if(!DR.strokes.length){toast("Първо нарисувай белезите");return}
      t.disabled=true;const old=t.textContent;t.textContent="Описвам…";
      try{const smp=await window.claude.use("sample");const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
        const res=await smp(`Изображението е схема на новородено кученце${DR.sil?" в страничен изглед, главата е вляво, опашката вдясно":""}. Цветните петна, нарисувани с пръст, са отличителни белези по козината (бялото е бяла козина, черното е черна и т.н.). Опиши белезите на български с една кратка фраза до 15 думи: цвят, форма и къде са по тялото. Без увод и без кавички — само описанието.`,{images:[blob],modelTier:"quick"});
        document.getElementById("drawText").value=String(res.text||"").trim().replace(/^["„]|["“]$/g,"")}
      catch(err){toast(err&&err.code==="not_granted"?"Описанието с Claude не е разрешено.":"Не успях да опиша рисунката.")}
      t.disabled=false;t.textContent=old;return}
    if(t.id==="drawSave"){const p=S.puppies.find(x=>x.id===DR.pid);if(!p)return;t.disabled=true;
      const txt=document.getElementById("drawText").value.trim();const up={marks:{strokes:DR.strokes,sil:DR.sil}};
      if(txt){const draft=S.bd[p.id]&&S.bd[p.id].bm;const base=draft!=null?draft:(p.markings||"");const merged=base?base.replace(/[\s,;.]+$/,"")+"; "+txt:txt;
        if(draft!=null)S.bd[p.id].bm=merged;else up.markings=merged}
      const ok=await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update(up)));t.disabled=false;
      if(ok){closeDraw();toast("Белезите са запазени");render()}}
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("drawModal").hidden)closeDraw()});
})();


function gapBand(ms){const h=ms/3600e3;return h<=2?{c:"var(--ok)",bg:"var(--ok-soft)",k:"ok"}:h<=3?{c:"var(--yel)",bg:"var(--yel-soft)",k:"yel"}:h<=4?{c:"var(--ora)",bg:"var(--ora-soft)",k:"ora"}:{c:"var(--bad)",bg:"var(--bad-soft)",k:"bad"}}
function gapPill(ms){const b=gapBand(ms);return `<span class="pill" style="background:${b.bg};color:${b.c}">${dur(ms)}</span>`}
function birthAnalysisH(){
  const i=S.info||{};const fc=tsOf(i.contractionDate,i.contractionTime);
  const L=S.all.map(p=>({p,ts:tsOf(puppyBirth(p),p.birthTime)})).filter(x=>x.ts!=null).sort((a,c)=>a.ts-c.ts);
  if(!L.length)return"";
  L.forEach((x,k)=>{x.seq=k+1;x.gap=k?x.ts-L[k-1].ts:null;x.fromFc=fc!=null?x.ts-fc:null});
  const ints=L.slice(1);const mins=ints.map(x=>x.gap);
  const avg=mins.length?mins.reduce((a,b)=>a+b,0)/mins.length:null;
  const sorted=[...mins].sort((a,b)=>a-b);const med=sorted.length?(sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2):null;
  const mx=ints.length?ints.reduce((a,b)=>b.gap>a.gap?b:a):null,mn=ints.length?ints.reduce((a,b)=>b.gap<a.gap?b:a):null;
  const first=L[0],last=L[L.length-1];
  const lost=L.filter(x=>x.p.lost),alive=L.filter(x=>!x.p.lost);
  const long=ints.filter(x=>x.gap>2*3600e3);
  const ws=alive.map(x=>+x.p.birthWeight).filter(w=>w>0);const wavg=ws.length?ws.reduce((a,b)=>a+b,0)/ws.length:null;
  const heavy=alive.filter(x=>x.p.birthWeight>0).sort((a,c)=>c.p.birthWeight-a.p.birthWeight);
  const mismatch=L.some(x=>x.p.order&&x.p.order!==x.seq);
  const lbl=x=>`№${x.p.order||"?"}`;
  const hm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
  const dm=t=>{const d=new Date(t);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")};
  // summary
  const parts=[];
  if(fc!=null)parts.push(`Първата контракция е в <strong>${hm(fc)}</strong>, първото кученце идва след ${gapPill(first.ts-fc)}.`);
  parts.push(`Родени са <strong>${L.length}</strong> кученца за <strong>${dur(last.ts-first.ts)}</strong> (от първото до последното)${fc!=null?`, общо <strong>${dur(last.ts-fc)}</strong> от първата контракция`:""}.`);
  if(mins.length)parts.push(`Средният интервал е ${gapPill(avg)} (медиана ${gapPill(med)}); най-дълъг ${gapPill(mx.gap)} между ${lbl(L[mx.seq-2])} и ${lbl(mx)}, най-къс ${gapPill(mn.gap)}.`);
  if(long.length)parts.push(`<strong>${long.length}</strong> ${long.length===1?"интервал е":"интервала са"} над 2 часа.`);
  if(lost.length)parts.push(`Изгубени: <strong>${lost.length}</strong> (${lost.map(x=>`${lbl(x)}${x.p.lostReason?" – "+esc(x.p.lostReason):""}`).join(", ")}).`);
  const defs=L.filter(x=>x.p.deform);if(defs.length)parts.push(`С деформация: <strong>${defs.length}</strong> (${defs.map(x=>`${lbl(x)}${x.p.deformDesc?" – "+esc(x.p.deformDesc):""}`).join("; ")}).`);
  if(wavg)parts.push(`Средно тегло при раждане на живите: <strong>${g(wavg)} г</strong> (от ${g(heavy[heavy.length-1].p.birthWeight)} до ${g(heavy[0].p.birthWeight)} г).`);
  // chart
  const bars=[...(fc!=null?[{gap:first.ts-fc,p:first.p,ts:first.ts,from:"1-ва контракция",fc:true}]:[]),...ints.map((x,k)=>({gap:x.gap,p:x.p,ts:x.ts,from:lbl(L[k])}))];
  const W=760,H=262,Lm=56,R=12,T=30,B=46;const n=bars.length;
  let chart="";
  if(n){const realMax=Math.max(150,...bars.map(b=>b.gap/60000));const maxM=Math.min(realMax,360);const hasBig=mins.some(m=>m>3*3600e3);const step=[30,60,120,240,480,720,1440,2880,5760].find(st=>maxM/st<=6)||11520;const top=Math.ceil(maxM/step)*step;
    const off=fc!=null?1:0;const y=v=>T+(1-v/top)*(H-T-B);const bw=(W-Lm-R)/(n+off);
    chart=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Интервали между кученцата">`;
    for(let v=0;v<=top;v+=step)chart+=`<line x1="${Lm}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${Lm-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v>=60?Math.floor(v/60)+" ч"+(v%60?" "+v%60+" мин":""):v+" мин"}</text>`;
    [[120,"var(--yel)"],[180,"var(--ora)"],[240,"var(--bad)"]].forEach(([v,c])=>{if(v<=top)chart+=`<line x1="${Lm}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-dasharray="5 4" stroke-width="1.3"/><text x="${W-R}" y="${y(v)-4}" text-anchor="end" font-size="10.5" fill="${c}" font-weight="600">${v/60} ч</text>`});
    if(off){const cx=Lm;chart+=`<line x1="${cx+bw/2}" x2="${cx+bw/2}" y1="${T}" y2="${y(0)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${cx+bw/2}" cy="${y(0)}" r="5" fill="var(--accent)"/><text x="${cx+bw/2}" y="${H-B+16}" text-anchor="middle" font-size="11" fill="var(--accent)" font-weight="700">контр.</text><text x="${cx+bw/2}" y="${H-B+30}" text-anchor="middle" font-size="10.5" fill="var(--accent)" font-family="var(--mono)">${hm(fc)}</text>`}
    bars.forEach((x,k)=>{const mr=x.gap/60000;const cut=mr>top;const m=Math.min(mr,top);const cx=Lm+(k+off)*bw;const w=Math.min(46,bw*.62);const col=gapBand(x.gap).c;
      
      chart+=`<rect x="${cx+(bw-w)/2}" y="${y(m)}" width="${w}" height="${Math.max(1,y(0)-y(m))}" rx="3" fill="${col}"${x.p.lost?' fill-opacity=".45"':""}><title>${x.from} → ${lbl(x)}: ${dur(x.gap)}</title></rect>`;
      if(cut)chart+=`<path d="M${cx+(bw-w)/2-3} ${y(m)+14} l${w/4+1.5} -6 l${w/4} 6 l${w/4} -6 l${w/4+1.5} 6" stroke="var(--surface)" stroke-width="4" fill="none"/>`;
      {const tm=Math.round(x.gap/60000),hh=Math.floor(tm/60),mm=tm%60;const l1=hh?`${hh} ч`:`${mm} мин`,l2=hh&&mm?`${mm} мин`:"";chart+=`<text x="${cx+bw/2}" y="${y(m)-(l2?17:5)}" text-anchor="middle" font-size="10.5" fill="${col}" font-weight="700" font-family="var(--mono)">${l1}</text>${l2?`<text x="${cx+bw/2}" y="${y(m)-5}" text-anchor="middle" font-size="10.5" fill="${col}" font-weight="700" font-family="var(--mono)">${l2}</text>`:""}`}
      chart+=`<text x="${cx+bw/2}" y="${H-B+16}" text-anchor="middle" font-size="11" fill="var(--ink)" font-weight="600" font-family="var(--mono)">${lbl(x)}${x.p.lost?"✕":""}</text><text x="${cx+bw/2}" y="${H-B+30}" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="var(--mono)">${hm(x.ts)}</text>`});
    chart+=`</svg>`}
  const rows=L.map(x=>{const st=x.p.lost?`<span class="pill bad">Изгубено${x.p.lostReason?" · "+esc(x.p.lostReason):""}</span>`:`<span class="pill ok">Живо</span>`;
    const gl=x.gap==null?"—":dur(x.gap);const warn=x.gap!=null&&x.gap>2*3600e3;
    return `<tr><td class="num">${x.seq}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${x.p.lost?`<span class="lostmark">✕</span>`:dotH(x.p)}<b>${lbl(x)}</b> ${x.p.lost?"":esc(dn(x.p))}</span></td><td class="num">${dm(x.ts)} ${hm(x.ts)}</td><td><span class="sex ${x.p.sex||""}">${sexS(x.p.sex)}</span></td><td class="num">${x.p.lost?"—":x.p.birthWeight?g(x.p.birthWeight)+" г":"—"}</td><td class="num">${x.gap!=null?gapPill(x.gap):x.fromFc!=null?gapPill(x.fromFc):"—"}</td><td class="num">${x.fromFc!=null?dur(x.fromFc):"—"}</td><td style="white-space:normal;min-width:120px">${x.p.deform?`<span class="pill warn">Да</span> <span class="small">${esc(x.p.deformDesc||"")}</span>`:`<span class="muted">Не</span>`}</td><td>${st}</td></tr>`}).join("");
  return `<section class="fold"><div class="fold-h"><h2>Анализ на раждането</h2><span class="small muted">${L.length} кученца · по реда на часа на раждане</span><button class="btn ghost chev" data-foldba aria-expanded="${!S.foldBA}" aria-label="${S.foldBA?"Разгъни":"Свий"}">${S.foldBA?"▾":"▴"}</button></div>${S.foldBA?"":`<div class="stack">
    <div class="brief">${parts.join(" ")}</div>
    <div class="tiles">
      <div class="panel tile"><div class="k">До 1-вото кученце</div><div class="v num" style="font-size:22px;color:${fc!=null?gapBand(first.ts-fc).c:"inherit"}">${fc!=null?dur(first.ts-fc):"—"}</div><div class="s">от първата контракция</div></div>
      <div class="panel tile"><div class="k">Активна фаза</div><div class="v num" style="font-size:22px">${dur(last.ts-first.ts)}</div><div class="s">${hm(first.ts)} – ${hm(last.ts)}</div></div>
      <div class="panel tile"><div class="k">Среден интервал</div><div class="v num" style="font-size:22px;color:${avg!=null?gapBand(avg).c:"inherit"}">${dur(avg)}</div><div class="s">медиана <span style="color:${med!=null?gapBand(med).c:"inherit"};font-weight:600">${dur(med)}</span></div></div>
      <div class="panel tile"><div class="k">Най-дълъг интервал</div><div class="v num" style="font-size:22px;color:${mx?gapBand(mx.gap).c:"inherit"}">${mx?dur(mx.gap):"—"}</div><div class="s">${mx?`${lbl(L[mx.seq-2])} → ${lbl(mx)}`:""}</div></div>
    </div>
    ${chart?`<div class="panel"><div class="sec-h" style="padding:14px 16px 0;margin:0"><h2 style="font-size:17px">Време между кученцата</h2><span class="small muted" style="flex-basis:100%;margin-top:-4px">Започва от първата контракция; всяко стълбче е времето до съответното кученце от предишното събитие.</span><span class="small muted legend-gap"><i style="background:var(--ok)"></i>до 2 ч <i style="background:var(--yel)"></i>2–3 ч <i style="background:var(--ora)"></i>3–4 ч <i style="background:var(--bad)"></i>над 4 ч</span></div><div class="chart-wrap" style="overflow-x:auto">${chart}</div></div>`:""}
    <div class="panel tscroll"><table><thead><tr><th>Ред</th><th>Кученце</th><th>Родено</th><th>Пол</th><th>Тегло</th><th>От предишното</th><th>От 1-ва контракция</th><th>Деформация</th><th>Статус</th></tr></thead><tbody>${fc!=null?`<tr class="fcrowt"><td class="num">—</td><td><b>1-ва контракция</b></td><td class="num">${dm(fc)} ${hm(fc)}</td><td></td><td></td><td class="num">—</td><td class="num">0 мин</td><td></td><td></td></tr>`:""}${rows}</tbody></table></div>
    ${mismatch?`<p class="small muted" style="margin:0">Номерата не следват точно реда по час — „Ред“ е реалната поредност по час на раждане. Ако номер е въведен грешно, поправи го в „Кучило“.</p>`:""}
  </div>`}</section>`;
}


/* ---------- development ---------- */
const MS=[{k:"walk",l:"Прохождане"},{k:"feed",l:"Захранване"},{k:"solid",l:"Твърда храна"}];
const DW_WEEKS=[2,4,6,8];
function dwFor(p){return evFor(p).filter(e=>e.type==="deworm")}
function dwForOld(p){return S.deworm.filter(d=>!d.puppies||d.puppies==="all"||(Array.isArray(d.puppies)&&d.puppies.includes(p.id)))}
function calMini(attrs){return `<span class="calmini" title="Избери дата"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><input type="date" ${attrs} aria-label="Избери дата"></span>`}
async function setMs(pid,k,iso){const p=S.puppies.find(x=>x.id===pid);if(!p)return false;return queue(pid,()=>write(()=>db.doc("puppies/"+pid).update({ms:{[k]:iso||""}})))}
function eventsForChart(){const b=birthDate();if(!b)return[];const ev=[];const seen=new Set();
  S.events.forEach(e=>{if(e.type==="walk"||e.type==="eyes"||e.type==="ears")return;const key=e.type+e.date;if(seen.has(key))return;seen.add(key);ev.push({day:dayDiff(b,e.date),label:normT(e.type)==="vac"?"Ваксина "+evNum(e):e.type==="deworm"?"Обезпараз. "+evNum(e):e.type==="vet"?"Вет. "+evNum(e):evLabel(e.type),c:normT(e.type)==="vac"?"var(--boy)":e.type==="deworm"?"var(--muted)":"var(--accent)"})});
  if(S.events.length)return ev;
  MS.forEach(m=>{if(m.k==="walk")return;if(m.k.startsWith("vac")){const ds=S.puppies.map(p=>p.ms&&p.ms[m.k]).filter(Boolean).sort();if(ds.length)ev.push({day:dayDiff(b,ds[0]),label:"Вакс. "+m.k.slice(3),c:"var(--boy)"});return}const ds=S.puppies.map(p=>p.ms&&p.ms[m.k]).filter(Boolean).sort();if(ds.length)ev.push({day:dayDiff(b,ds[0]),label:m.l,c:"var(--accent)"})});
  S.deworm.forEach(d=>ev.push({day:dayDiff(b,d.date),label:"Обезпараз.",c:"var(--muted)"}));return ev}
const EV_TYPES=[{k:"walk",l:"Прохождане"},{k:"feed",l:"Захранване"},{k:"solid",l:"Твърда храна"},{k:"vac",l:"Ваксина"},{k:"deworm",l:"Обезпаразитяване"},{k:"vet",l:"Ветеринарен преглед"},{k:"chip",l:"Микрочип"},{k:"eyes",l:"Отваряне на очите"},{k:"ears",l:"Отваряне на ушите"},{k:"other",l:"Друго"}];
const NUMBERED=new Set(["vac","deworm","vet"]);
const normT=t=>/^vac\d$/.test(t)?"vac":t;
function evNum(e){const T=normT(e.type);const l=S.events.filter(x=>normT(x.type)===T).sort((a,c)=>a.date<c.date?-1:a.date>c.date?1:(a.ts||0)-(c.ts||0));return l.findIndex(x=>x.id===e.id)+1}
function evTitle(e){const T=normT(e.type);return evLabel(T)+(NUMBERED.has(T)?" "+evNum(e):"")}
function dwNum(e){const l=S.events.filter(x=>x.type==="deworm").sort((a,c)=>a.date<c.date?-1:a.date>c.date?1:(a.ts||0)-(c.ts||0));return l.findIndex(x=>x.id===e.id)+1}
const evLabel=k=>(EV_TYPES.find(t=>t.k===normT(k))||{l:k}).l;
function evApplies(e,p){return !e.puppies||e.puppies==="all"||(Array.isArray(e.puppies)&&e.puppies.includes(p.id))}
function evFor(p){return S.events.filter(e=>evApplies(e,p)).sort((a,c)=>a.date<c.date?-1:1)}
function msDate(p,k){const e=evFor(p).find(e=>e.type===k);return e?e.date:(p.ms&&p.ms[k])||""}
function viewDev(){
  if(!S.puppies.length)return emptyState();
  const ro=!(S.canWrite&&db);const b=birthDate();const today=todayStr();
  if(S.dwSel==null)S.dwSel="all";const sel=S.dwSel;
  const chips=`<button type="button" class="chip" data-dwall aria-pressed="${sel==="all"}">Всички</button>${S.puppies.map(p=>`<button type="button" class="chip" data-dwp="${p.id}" aria-pressed="${sel!=="all"&&sel.includes(p.id)}">№${p.order||""} ${esc(dn(p))}</button>`).join("")}`;
  const form=ro?"":`<div class="panel"><form class="evform" id="evForm">
      <div class="field"><label for="ev_date">Дата</label>${dateField("ev_date",S.evDate||today)}</div>
      <div class="field"><label for="ev_type">Събитие</label><select id="ev_type">${EV_TYPES.map(t=>`<option value="${t.k}" ${S.evType===t.k?"selected":""}>${t.l}</option>`).join("")}</select></div>
      <div class="field evnote"><label for="ev_note" id="ev_note_l">${S.evType==="vet"?"Коментар от прегледа":"Коментар"}</label><textarea id="ev_note" rows="${S.evType==="vet"?4:1}" placeholder="${S.evType==="vet"?"какво е прегледано, тегло, препоръки, следващ преглед…":"напр. препарат, доза, наблюдение"}"></textarea></div>
      <div class="field evwho"><span class="flabel">За</span><div class="chips">${chips}</div></div>
      <div class="form-acts"><button class="btn primary" type="submit">Добави събитие</button></div>
    </form></div>`;
  // overview
  const present=new Set(S.events.map(e=>normT(e.type)));const cols=EV_TYPES.map(t=>t.k).filter(k=>present.has(k));
  const head=`<tr><th style="text-align:left">№</th><th style="text-align:left">Кученце</th>${cols.map(k=>`<th style="text-align:left">${evLabel(k)}</th>`).join("")}<th style="text-align:left">Снимки</th></tr>`;
  const rows=S.puppies.map(p=>{const dws=evFor(p).filter(e=>e.type==="deworm");
    return `<tr><td class="num" style="text-align:left">${p.order||""}</td><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${dotH(p)}<b>${esc(dn(p))}</b> <span class="sex ${p.sex||""}">${sexS(p.sex)}</span></span></td>${cols.map(k=>{const es=evFor(p).filter(e=>normT(e.type)===k);return `<td style="text-align:left">${es.length?es.map((e,i)=>`<span class="mpill"><b>${NUMBERED.has(k)?(i+1)+". ":es.length>1?(i+1)+". ":""}ден ${dayDiff(puppyBirth(p),e.date)}</b><small>${fmtDate(e.date)}</small></span>`).join(" "):`<span class="muted">—</span>`}</td>`}).join("")}<td><div class="row" style="gap:6px;flex-wrap:nowrap">${thumbs(p,photosOf(p,"dev"),3)}${ro?"":camBtn(p,"dev",todayStr(),"")}</div></td></tr>`}).join("");
  // deworm schedule
  const SCHED=[{t:"deworm",n:1,d:15},{t:"deworm",n:2,d:30},{t:"vac",n:1,d:45},{t:"vac",n:2,d:66},{t:"vac",n:3,d:87}];
  const sItems=b?SCHED.map(x=>{const evs=S.events.filter(e=>normT(e.type)===x.t).sort((a,c)=>a.date<c.date?-1:1);const done=evs[x.n-1];const iso=shiftDate(b,x.d);return {...x,iso,done,late:!done&&iso<today}}):[];
  const nextS=sItems.find(x=>!x.done);
  const sched=sItems.map(x=>`<div class="sch ${x.done?"done":x.late?"late":x===nextS?"next":""}"><b>${evLabel(x.t)} ${x.n}</b><span class="num">ден ${x.d} · ${fmtDate(x.iso)}</span><small>${x.done?`✓ направено ${fmtDate(x.done.date)} (ден ${dayDiff(b,x.done.date)})`:x.late?`закъснява с ${dayDiff(x.iso,today)} дни`:x===nextS?`след ${dayDiff(today,x.iso)} дни`:"предстои"}</small></div>`).join("");
  // log
  const log=[...S.events].sort((a,c)=>a.date<c.date?1:a.date>c.date?-1:(c.ts||0)-(a.ts||0));
  const list=log.length?log.map(e=>{const who=!e.puppies||e.puppies==="all"?"всички":e.puppies.map(id=>{const p=S.all.find(x=>x.id===id);return p?`№${p.order||"?"} ${esc(dn(p))}`:""}).filter(Boolean).join(", ");
    return `<li><div><b>${b?`ден ${dayDiff(b,e.date)}`:""}</b> <span class="muted">· ${fmtDate(e.date)}</span></div><div><span class="pill evp">${evTitle(e)}</span>${e.note?` <span style="white-space:pre-line">${esc(e.note)}</span>`:""}</div><div class="small muted">за ${who}</div>${ro?"":S.dwConfirm===e.id?`<div class="row"><button class="btn danger xs" data-evdel="${e.id}">Изтрий</button><button class="btn ghost xs" data-dwno>Не</button></div>`:`<button class="btn ghost xs" data-dwask="${e.id}" aria-label="Изтрий">✕</button>`}</li>`}).join(""):`<li class="muted">Още няма записани събития.</li>`;
  return `<div class="stack">
    <div><div class="sec-h"><h2>Ново събитие</h2><span class="small muted">избери ден, събитие и за кои кученца</span></div>${form}</div>
    <div><div class="sec-h"><h2>Дневник на събитията</h2></div><div class="panel"><ul class="dwlist">${list}</ul></div></div>
    <div><div class="sec-h"><h2>График</h2>${nextS?`<span class="small">Следващо: <b>${evLabel(nextS.t)} ${nextS.n}</b> · ден ${nextS.d} · ${fmtDate(nextS.iso)}</span>`:""}</div>${sched?`<div class="schgrid">${sched}</div>`:`<div class="notice">Въведи дата на раждане, за да се изчисли графикът.</div>`}</div>
    <div><div class="sec-h"><h2>Преглед по кученца</h2><span class="small muted">попълва се от дневника</span></div>
      ${cols.length?`<div class="panel tscroll"><table class="mstable"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`:`<div class="notice">Таблицата ще се появи с първото записано събитие — колона за всеки вид събитие, щом се случи.</div>`}</div>
  </div>`;
}

/* ---------- dossier ---------- */
function buildDossier(p){
  const it=[];const b=puppyBirth(p);const i=S.info||{};
  const add=(date,kind,title,text,cls)=>{if(date)it.push({date,kind,title,text:text||"",cls:cls||kind})};
  // birth
  if(b){const fc=tsOf(i.contractionDate,i.contractionTime);const ts=tsOf(b,p.birthTime);
    const L=S.all.map(q=>({q,ts:tsOf(puppyBirth(q),q.birthTime)})).filter(x=>x.ts!=null).sort((a,c)=>a.ts-c.ts);const k=L.findIndex(x=>x.q.id===p.id);
    let gap=k>0?ts-L[k-1].ts:(fc!=null&&ts!=null?ts-fc:null);let kk=k;if(p._gap!==undefined){gap=p._gap;kk=p._gapFirst?0:1}
    const bits=[];if(p.birthTime)bits.push(`в ${esc(p.birthTime)} ч.`);bits.push(`№${p.order||"?"} по ред`);if(gap!=null)bits.push(`${kk>0?"след предишното":"след 1-вата контракция"} ${gapPill(gap)}`);
    const d2=[];if(p.sex)d2.push(sexL(p.sex));if(p.birthWeight)d2.push(`${g(p.birthWeight)} г`);if(p.coat)d2.push(esc(p.coat));if(p.tail)d2.push(esc(p.tail));if(p.markings)d2.push(esc(p.markings));
    add(b,"birth",p.lost?"Изгубено при раждане":"Раждане",bits.join(" · ")+(d2.length?`<br>${d2.join(" · ")}`:"")+(p.lost&&p.lostReason?`<br>Причина: ${esc(p.lostReason)}`:"")+(p.deform?`<br><span class="pill warn">Деформация</span> ${esc(p.deformDesc||"")}`:""),p.lost?"bad":"birth");}
  // weights
  const pts=series(p);const bw=stats(p).bw;
  if(pts.length>1&&bw){
    let low=null,recovered=false;const hit=new Set();let best=null;
    pts.forEach((x,j)=>{if(j===0)return;const pv=pts[j-1];const dd=Math.max(1,x.day-pv.day);const diff=x.g-pv.g;const pc=diff/pv.g/dd*100;
      add(x.date,"wgt",j===1?"Първо претегляне":"Претегляне",`${g(x.g)} г · ${sg(diff)} г (${pct(pc)}${dd>1?` за ${dd} дни`:" за денонощие"})`,diff<0?(x.day>3?"bad":"wgt"):"wgt");
      if(x.g<bw&&(!low||x.g<low.g))low=x;
      if(low&&!recovered&&x.g>=bw&&j>1){recovered=true;add(x.date,"ms","Върна рожденото тегло",`${g(x.g)} г`,"good")}
      if(diff<0&&x.day>3)add(x.date,"alert","Внимание: загуба на тегло","провери суче ли, температура и хидратация","bad");
      [[1.5,"+50% от рожденото тегло"],[2,"Удвои теглото си"],[3,"Утрои теглото си"],[4,"×4 от рожденото тегло"],[5,"×5 от рожденото тегло"]].forEach(([m,l])=>{if(!hit.has(m)&&x.g>=bw*m){hit.add(m);add(x.date,"ms",l,`${g(x.g)} г на ден ${x.day}`,m===2?"star":"good")}});
      if(x.day>0&&x.day%7===0){const ref=[...pts].reverse().find(q=>q.day<=x.day-7)||pts[0];const wk=x.day/7;add(x.date,"week",`Седмица ${wk}`,`${g(x.g)} г · ${pct((x.g/ref.g-1)*100)} за седмицата · ${pct((x.g/bw-1)*100,0)} от рожденото`)}
      if(x.day>3&&(!best||pc>best.pc))best={x,pc};
    });
    if(low&&low.date!==b)add(low.date,"wgt2","Най-ниско тегло",`${g(low.g)} г (${pct((low.g/bw-1)*100)} от рожденото)`,low.g<bw*0.9?"bad":"info");
    if(best)add(best.x.date,"ms","Най-добро денонощие",`${pct(best.pc)} за денонощие`,"good");
  }
  if(p.owner&&p.owner.name&&p.owner.date)add(p.owner.date,"event","Взет от собственик",esc(p.owner.name)+(p.owner.city?" · "+esc(p.owner.city):""),"star");
  // events
  evFor(p).forEach(e=>add(e.date,"event",evTitle(e),e.note?esc(e.note):"","event"));
  const order={birth:0,wgt:1,wgt2:2,alert:3,ms:4,week:5,event:6};
  it.sort((a,c)=>a.date<c.date?-1:a.date>c.date?1:(order[a.kind]??9)-(order[c.kind]??9));
  return it;
}
function dossierChart(p){const pts=series(p).filter(x=>x.day!=null);const bw=stats(p).bw;if(pts.length<2||!bw)return"";
  const W=620,H=170,L=44,R=12,T=12,B=26;const maxD=Math.max(7,...pts.map(x=>x.day));const hi=Math.max(bw*2.1,...pts.map(x=>x.g));const lo=Math.min(bw*0.85,...pts.map(x=>x.g));
  const x=d=>L+d/maxD*(W-L-R),y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);const c=pc(p).hex;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Крива на растежа">`;
  [[bw,"рождено"],[bw*2,"×2"]].forEach(([v,l])=>{s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${l==="×2"?"var(--ok)":"var(--line)"}" stroke-dasharray="4 4"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="10.5" fill="${l==="×2"?"var(--ok)":"var(--muted)"}" font-family="var(--mono)">${l==="×2"?"×2":g(v)}</text>`});
  for(let d=0;d<=maxD;d+=maxD<=14?1:7)s+=`<text x="${x(d)}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="var(--mono)">${d}</text>`;
  s+=`<path d="${pts.map((q,i)=>(i?"L":"M")+x(q.day).toFixed(1)+" "+y(q.g).toFixed(1)).join(" ")}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"${pc(p).none?' stroke-dasharray="6 4"':""}/>`;
  pts.forEach(q=>s+=`<circle cx="${x(q.day)}" cy="${y(q.g)}" r="3.5" fill="${c}" stroke="var(--surface)" stroke-width="1.5"><title>ден ${q.day}: ${g(q.g)} г</title></circle>`);
  return s+`</svg>`}
let OT={type:""};
function ownerH(p){const o=p.owner||{};const ro=!(S.canWrite&&db);if(S.ownerEdit===p.id&&OT.pid!==p.id)OT={pid:p.id,type:o.type||""};
  if(S.ownerEdit===p.id)return `<div class="ow-body"><div class="sec-h" style="padding:14px 16px 0;margin:0"><h2>Собственик</h2></div><form class="pform" id="ownerForm" data-pid="${p.id}">
    <div class="field"><label for="o_name">Име</label><input id="o_name" value="${esc(o.name)}" autocomplete="off"></div>
    <div class="field"><label for="o_phone">Телефон</label><input id="o_phone" type="tel" value="${esc(o.phone)}" autocomplete="off"></div>
    <div class="field"><label for="o_email">Имейл</label><input id="o_email" type="email" value="${esc(o.email)}" autocomplete="off"></div>
    <div class="field"><label for="o_city">Град / адрес</label><input id="o_city" value="${esc(o.city)}" autocomplete="off"></div>
    <div class="field"><label for="o_date">Дата на вземане</label>${dateField("o_date",o.date||"")}</div>
    <div class="field"><span class="flabel">Тип</span><div class="sexpick" role="group" aria-label="Тип"><button type="button" data-otype="pet" aria-pressed="${OT.type==="pet"}">Домашен любимец</button><button type="button" data-otype="show" aria-pressed="${OT.type==="show"}">Шоу куче</button></div></div>
    <div class="field"><label for="o_amt">Цена (€)</label><input id="o_amt" type="text" inputmode="decimal" value="${esc(o.price??"")}"></div>
    <div class="field"><label for="o_depamt">Депозит (€)</label><input id="o_depamt" type="text" inputmode="decimal" value="${esc(o.depositAmt??"")}"></div>
    <div class="field full"><span class="flabel">Плащане</span><div class="chkrow"><label class="lostchk"><input type="checkbox" id="o_dep" ${o.deposit?"checked":""}> Платен депозит</label><label class="lostchk"><input type="checkbox" id="o_paid" ${o.paid?"checked":""}> Платено куче</label></div></div>
    <div class="field full"><span class="flabel">Родословие</span><div class="chkrow"><label class="lostchk"><input type="checkbox" id="o_pn" ${o.pedNat?"checked":""}> Национално</label><label class="lostchk"><input type="checkbox" id="o_pi" ${o.pedInt?"checked":""}> Международно</label></div></div>
    <div class="field"><label for="o_price">Договор / бележка за продажба</label><input id="o_price" value="${esc(o.deal)}"></div>
    <div class="field full"><label for="o_note">Бележки</label><textarea id="o_note">${esc(o.note)}</textarea></div>
    <div class="form-acts">${o.name?`<button type="button" class="btn ghost" data-ownerclear="${p.id}" style="margin-right:auto;color:var(--bad)">Премахни собственика</button>`:""}<button type="button" class="btn ghost" data-owneredit="">Отказ</button><button class="btn primary" type="submit">Запази собственика</button></div></form></div>`;
  if(!o.name)return ro?"":`<div class="ow-body ow-empty"><span class="muted">Още няма собственик.</span><button class="btn" data-owneredit="${p.id}">+ Добави собственик</button></div>`;
  const open=S.ownerOpen===p.id;
  return `<div class="ow-body"><div class="ow-h"><span class="flabel">Собственик</span><button type="button" class="ow-name" data-owneropen="${p.id}" aria-expanded="${open}"><b>${esc(o.name)}</b><span class="chev-i">${open?"▴":"▾"}</span></button>${ro?"":`<button class="btn ghost xs" data-owneredit="${p.id}">✎ Редакция</button>`}</div>
    ${open?`<dl class="kv"><dt>Име</dt><dd><b>${esc(o.name)}</b></dd>${o.phone?`<dt>Телефон</dt><dd class="num" style="user-select:all">${esc(o.phone)}</dd>`:""}${o.email?`<dt>Имейл</dt><dd style="user-select:all">${esc(o.email)}</dd>`:""}${o.city?`<dt>Адрес</dt><dd>${esc(o.city)}</dd>`:""}${o.type?`<dt>Тип</dt><dd><b>${o.type==="show"?"Шоу куче":"Домашен любимец"}</b></dd>`:""}${o.price!=null?`<dt>Цена</dt><dd class="num">${money(o.price)}</dd>`:""}${o.depositAmt!=null?`<dt>Депозит</dt><dd class="num">${money(o.depositAmt)}${o.price!=null?` <span class="muted">· остатък ${money(o.price-o.depositAmt)}</span>`:""}</dd>`:""}<dt>Плащане</dt><dd><span class="pill ${o.deposit?"ok":""}" ${o.deposit?"":'style="background:var(--sunk);color:var(--muted)"'}>Депозит ${o.deposit?"✓ платен":"— не"}</span> <span class="pill ${o.paid?"ok":""}" ${o.paid?"":'style="background:var(--sunk);color:var(--muted)"'}>Куче ${o.paid?"✓ платено":"— не"}</span></dd><dt>Родословие</dt><dd>${[o.pedNat&&"Национално",o.pedInt&&"Международно"].filter(Boolean).join(" + ")||"—"}</dd>${o.date?`<dt>Дата на вземане</dt><dd>${fmtDate(o.date)}${puppyBirth(p)?` · на ${dayDiff(puppyBirth(p),o.date)} дни`:""}${o.date>todayStr()?` <span class="small muted">(след ${dayDiff(todayStr(),o.date)} дни)</span>`:""}</dd>`:""}${o.deal?`<dt>Договор</dt><dd>${esc(o.deal)}</dd>`:""}${o.note?`<dt>Бележки</dt><dd>${esc(o.note)}</dd>`:""}</dl><div class="docrow"><div><b>Договор за покупко-продажба</b><div class="small muted">Попълва се автоматично с данните на кученцето, собственика, цената и депозита.</div></div><span class="pill" style="background:var(--sunk);color:var(--muted)">очаква шаблон</span></div>`:""}</div>`}
function viewDossier(p){
  const st=stats(p);const c=pc(p);const items=buildDossier(p);const b=puppyBirth(p);
  const byDate={};items.forEach(x=>{(byDate[x.date]=byDate[x.date]||[]).push(x)});(p.photos||[]).forEach(ph=>{(byDate[ph.date]=byDate[ph.date]||[])});
  const dates=Object.keys(byDate).sort();
  const ICON={birth:"●",wgt:"г",wgt2:"↓",alert:"!",ms:"★",star:"★",good:"↑",week:"7",event:"◆",bad:"!",info:"i"};
  const tl=dates.map(d=>{const phs=photosOf(p,null,d);return `<li class="dz-day"><div class="dz-dh"><b>${b?`Ден ${dayDiff(b,d)}`:""}</b> <span class="muted num">${fmtDate(d)}</span></div><ul>${byDate[d].map(x=>`<li class="dz-it ${x.cls}"><span class="dz-ic" aria-hidden="true">${ICON[x.cls]||ICON[x.kind]||"•"}</span><div><b>${x.title}</b>${x.text?`<div class="small">${x.text}</div>`:""}</div></li>`).join("")}${phs.length?`<li class="dz-it"><span class="dz-ic" aria-hidden="true">▣</span><div>${thumbs(p,phs,8)}</div></li>`:""}</ul></li>`}).join("");
  const names=[p.petName&&p.petName!==dn(p)&&`<b>${esc(p.petName)}</b>`,p.kennelName&&esc(p.kennelName),p.name&&p.name!==dn(p)&&`<span class="muted">${esc(p.name)}</span>`].filter(Boolean).join(" · ");
  return `<div class="stack">
    <div class="row" style="justify-content:space-between">${S.viewer?"<span></span>":`<button class="btn ghost" data-closedossier>‹ Всички кученца</button>`}${S.canWrite&&db?camBtn(p,"dev",todayStr(),"Добави снимка"):""}</div>
    <div class="panel dz-head">
            <div class="dz-id">${p.lost?`<span class="lostmark">✕</span>`:dotH(p)}<div><h2>${esc(dn(p))} <span class="sex ${p.sex||""}">${sexL(p.sex)}</span></h2><dl class="kv dz-names"><dt>Име в кучилото</dt><dd>${esc(p.name)||"—"}</dd><dt>Развъдно име</dt><dd>${esc(p.kennelName)||"—"}</dd><dt>Pet name</dt><dd>${esc(p.petName)||"—"}</dd></dl><div class="small muted">№${p.order||"?"} · ${c.name}${p.coat?` · ${esc(p.coat)}`:""}${p.tail?` · ${esc(p.tail)}`:""}${p.markings?` · ${esc(p.markings)}`:""}</div></div>${marksSVG(p.marks)}${avatarH(p,"dz-av")}</div>
      ${p.lost?`<div class="pill bad">Изгубено${p.lostReason?" · "+esc(p.lostReason):""}</div>`:`<div class="dz-chips">
        <span><small>При раждане</small><b class="num">${g(st.bw)} г</b></span>
        <span><small>Последно</small><b class="num">${st.last?g(st.last.g)+" г":"—"}</b></span>
        <span><small>Общо</small><b class="num">${pct(st.total,0)}</b></span>
        <span><small>Средно на ден</small><b class="num">${st.avg!=null?g(st.avg)+" г":"—"}</b></span>
        <span><small>Удвоено</small><b>${st.dbl?`ден ${st.dbl.day}`:"още не"}</b></span>
        <span><small>Статус</small><b><span class="pill ${st.lv}">${statusLabel[st.lv]}</span></b></span></div>`}
      ${(p.photos||[]).length?`<div>${thumbs(p,p.photos,12)}</div>`:""}
      ${p.lost?"":dossierChart(p)}
    </div>
    <div><div class="sec-h"><h2>Хронология</h2><span class="small muted">раждане, претегляния, етапи и снимки</span></div>
      <ol class="dz-tl panel">${tl||`<li class="muted" style="padding:14px">Още няма записи.</li>`}</ol></div>
    ${p.lost||(S.viewer&&!(p.owner&&p.owner.name))?"":`<div class="panel dz-owner empty"><span><span class="flabel">Собственик</span> ${p.owner&&p.owner.name?(S.viewer?`<b>${esc(p.owner.name)}</b>`:`<button type="button" class="linkbtn" data-goowner="${p.id}"><b>${esc(p.owner.name)}</b></button>`):`<span class="muted">няма</span>`}</span></div>`}
    ${p.notes?`<div class="panel" style="padding:14px 16px"><b>Бележки</b><div>${esc(p.notes)}</div></div>`:""}
  </div>`;
}


function viewOwners(){
  if(!S.puppies.length)return emptyState();
  const L=[...S.puppies].sort((a,c)=>(a.order||99)-(c.order||99));
  const withO=L.filter(p=>p.owner&&p.owner.name);
  const sum=f=>withO.reduce((t,p)=>t+(f(p.owner)||0),0);
  const dep=sum(o=>o.deposit?o.depositAmt:0),paid=sum(o=>o.paid?o.price:0),total=sum(o=>o.price);
  const due=sum(o=>o.price!=null?o.price-(o.paid?o.price:o.deposit?(o.depositAmt||0):0):0);
  const today=todayStr();
  const pick=withO.filter(p=>p.owner.date&&p.owner.date>=today).sort((a,c)=>a.owner.date<c.owner.date?-1:1);
  const rows=L.map(p=>`<div class="panel ow-wrap" id="ow_${p.id}"><div class="ow-pup">${dotH(p)}<b class="num">№${p.order||"?"}</b><button type="button" class="linkbtn" data-dossier="${p.id}"><b>${esc(dn(p))}</b></button><span class="sex ${p.sex||""}">${sexS(p.sex)}</span>${p.owner&&p.owner.name?`<span class="pill ok">има собственик</span>`:`<span class="pill" style="background:var(--sunk);color:var(--muted)">свободно</span>`}</div>${ownerH(p)}</div>`).join("");
  return `<div class="stack">
    <div class="tiles">
      <div class="panel tile"><div class="k">Със собственик</div><div class="v num">${withO.length} / ${L.length}</div><div class="s">${L.length-withO.length} свободни</div></div>
      <div class="panel tile"><div class="k">Обща стойност</div><div class="v num" style="font-size:22px">${money(total)}</div><div class="s">по договорени цени</div></div>
      <div class="panel tile"><div class="k">Получено</div><div class="v num" style="font-size:22px">${money(sum(o=>o.paid?o.price:o.deposit?o.depositAmt:0))}</div><div class="s">депозити и плащания</div></div>
      <div class="panel tile"><div class="k">Остава да се получи</div><div class="v num" style="font-size:22px;color:${due>0?"var(--warn)":"inherit"}">${money(due)}</div><div class="s">остатъци по цените</div></div>
    </div>
    ${pick.length?`<div><div class="sec-h"><h2>Предстоящи вземания</h2></div><div class="panel"><ul class="dwlist">${pick.map(p=>`<li><div><b>${fmtDate(p.owner.date)}</b> <span class="muted">· след ${dayDiff(today,p.owner.date)} дни</span></div><div>№${p.order||"?"} ${esc(dn(p))} → <b>${esc(p.owner.name)}</b></div><div class="small">${p.owner.paid?`<span class="pill ok">платено</span>`:p.owner.deposit?`<span class="pill warn">само депозит</span>`:`<span class="pill bad">неплатено</span>`}</div><span></span></li>`).join("")}</ul></div></div>`:""}
    <div><div class="sec-h"><h2>Кученца и собственици</h2><span class="small muted">натисни името на собственика за повече информация</span></div><div class="stack" style="gap:10px">${rows}</div></div>
  </div>`;
}


/* ---------- viewer mode & access ---------- */
function renderViewer(){
  document.getElementById("hEyebrow").textContent="Carrot Cake Litter Diary";
  const p=S.all.find(x=>x.id===S.vSel);
  document.getElementById("hTitle").textContent=p?dn(p):"Досие";
  document.getElementById("hMeta").textContent=p&&S.info&&S.info.breed?S.info.breed:"";
  document.getElementById("hAge").hidden=true;document.getElementById("hCover").hidden=true;document.getElementById("banner").innerHTML="";
  const v=document.getElementById("view");
  if(!p){v.innerHTML=`<div class="panel empty"><h2>Досие</h2><p>${esc(S.viewerMsg||"Зареждане…")}</p></div>`;return}
  const pick=S.all.length>1?`<div class="chips" style="margin-bottom:12px">${S.all.map(q=>`<button type="button" class="chip" data-vsel="${q.id}" aria-pressed="${q.id===S.vSel}">${esc(dn(q))}</button>`).join("")}</div>`:"";
  v.innerHTML=pick+viewDossier(p);
}
let SYNC_T=null;
function scheduleSync(){if(S.viewer||!S.admin||!db)return;clearTimeout(SYNC_T);SYNC_T=setTimeout(syncDossiers,1500)}
const DZ_LAST={};
function dossierSnap(p){
  const b=puppyBirth(p);const i=S.info||{};const fc=tsOf(i.contractionDate,i.contractionTime);const ts=tsOf(b,p.birthTime);
  const L=S.all.map(q=>({q,ts:tsOf(puppyBirth(q),q.birthTime)})).filter(x=>x.ts!=null).sort((a,c)=>a.ts-c.ts);const k=L.findIndex(x=>x.q.id===p.id);
  const gap=ts==null?null:k>0?ts-L[k-1].ts:(fc!=null?ts-fc:null);
  const pp={...p};delete pp.access;if(pp.owner)pp.owner={name:pp.owner.name||""};pp._gap=gap;pp._gapFirst=k<=0;pp.birthDate=b||null;
  return {puppy:pp,weights:S.weights.filter(w=>w.puppyId===p.id).map(w=>({id:w.id,puppyId:w.puppyId,date:w.date,grams:w.grams})),events:evFor(p).map(e=>({id:e.id,date:e.date,type:e.type,note:e.note||"",ts:e.ts||0,puppies:"all"}))};
}
async function syncDossiers(){
  if(S.viewer||!S.admin||!db||!S.loaded.p||!S.loaded.w||!S.loaded.i||!S.evLoaded||!S.dzLoaded)return;
  const i=S.info||{};const map={};const L=window.__litter;
  S.puppies.forEach(p=>(p.access||[]).forEach(em=>{em=String(em).toLowerCase();(map[em]=map[em]||[]).push(dossierSnap(p))}));
  for(const em of Object.keys(map)){const doc={litterId:L,info:{name:i.name||"",breed:i.breed||"",mother:i.mother||"",father:i.father||"",birthDate:i.birthDate||""},pids:map[em].map(x=>x.puppy.id),puppies:map[em]};const js=JSON.stringify(doc);
    if(DZ_LAST[em]===js)continue;try{await db.doc("dossiers/"+em+"/byLitter/"+L).set(doc);DZ_LAST[em]=js}catch(_){}}
  const now=Object.keys(map);
  for(const em of S.dzExisting){if(!map[em]){try{await db.doc("dossiers/"+em+"/byLitter/"+L).delete();delete DZ_LAST[em]}catch(_){}}}
  if([...S.dzExisting].sort().join(",")!==[...now].sort().join(",")){try{await db.doc("meta/dossiers").set({emails:now})}catch(_){}}
}
async function ensureProfiles(ids){if(!USER)return;const miss=ids.filter(id=>!S.prof[id]);if(!miss.length)return;try{const ps=await USER.profiles(miss);let ch=false;miss.forEach(id=>{if(ps[id]){S.prof[id]=ps[id];ch=true}});if(ch)render()}catch(_){}}
function profName(id){const p=S.prof[id];return p?(p.name||p.email||"Без име"):"…"}
function viewAccess(){
  if(!S.isOwner)return `<div class="notice">Този раздел е видим само за собственика на приложението.</div>`;
  const ed=S.editors||[];
  const rows=S.puppies.map(p=>{const acc=p.access||[];const open=S.accSearch===p.id;
    return `<div class="panel ow-wrap"><div class="ow-pup">${dotH(p)}<b class="num">№${p.order||"?"}</b><b>${esc(dn(p))}</b><span class="sex ${p.sex||""}">${sexS(p.sex)}</span>${p.owner&&p.owner.name?`<span class="muted small">собственик: ${esc(p.owner.name)}${p.owner.email?" · "+esc(p.owner.email):""}</span>`:""}</div>
      <div class="ow-body"><div class="row" style="gap:6px">${acc.length?acc.map(em=>`<span class="acc-chip">${esc(em)}<button type="button" data-accdel="${esc(em)}" data-pid="${p.id}" aria-label="Махни достъпа">✕</button></span>`).join(""):`<span class="muted small">Никой няма достъп до досието.</span>`}${open?"":`<button class="btn xs" data-accadd="${p.id}">+ Дай достъп</button>`}</div>
      ${open?`<form class="acc-search" data-accform="${p.id}"><input id="acc_q" type="email" placeholder="имейл на собственика" value="${esc(p.owner&&p.owner.email||"")}" autocomplete="off" required><div class="row" style="gap:6px"><button class="btn primary xs" type="submit">Дай достъп</button><button type="button" class="btn ghost xs" data-accclose>Отказ</button></div></form>`:""}</div></div>`}).join("");
  return `<div class="stack">
    <div class="panel" style="padding:14px 16px"><h2 style="font-size:20px;margin-bottom:6px">Достъп</h2>
      <p class="small" style="margin:0;max-width:70ch">Видимо само за теб. Тук добавяш помощници (Editor) и определяш кой собственик вижда досието на кое кученце.</p></div>
    <div class="panel" style="padding:14px 16px"><h2 style="font-size:17px;margin-bottom:6px">Editors</h2>
      <p class="small muted" style="margin:0 0 8px">Виждат и въвеждат всичко, качват снимки. Не виждат този раздел.</p>
      <div class="row" style="gap:6px">${ed.length?ed.map(em=>`<span class="acc-chip">${esc(em)}<button type="button" data-eddel="${esc(em)}" aria-label="Махни">✕</button></span>`).join(""):`<span class="muted small">Няма добавени.</span>`}</div>
      <form class="acc-search" id="edForm" style="margin-top:10px"><div class="row" style="gap:6px"><input id="ed_q" type="email" placeholder="имейл на помощник" autocomplete="off" required><button class="btn xs" type="submit">+ Добави Editor</button></div></form></div>
    <div class="panel" style="padding:14px 16px"><h2 style="font-size:17px;margin-bottom:6px">Собственици на кученца (Viewer)</h2>
      <ol class="small" style="margin:0;padding-left:18px;max-width:70ch"><li>При кученцето натисни „Дай достъп“ и въведи имейла на собственика.</li><li>Изпрати му адреса <b>litters.corgi.bg</b>. Той въвежда имейла си, получава линк за вход и вижда <b>само досието на своето кученце</b>.</li></ol></div>
    ${rows}
    <div class="panel" style="padding:14px 16px"><h2 style="font-size:17px;margin-bottom:6px">Импорт на данни</h2><p class="small muted" style="margin:0 0 8px">Зарежда JSON файл с кучило — еднократно, при преместването от старата версия. Записва в текущото кучило.</p><label class="btn xs" style="display:inline-flex">Избери файл<input type="file" id="importFile" accept=".json,application/json" hidden></label></div>
  </div>`;
}

/* ---------- photos ---------- */
const CAM=`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
const STAGE={birth:"Раждане",weigh:"Претегляне",dev:"Развитие"};
let PH={pid:null,stage:null,date:null},LB={pid:null,list:[],i:0,confirm:false};
let ASSETS;async function assetsNS(){if(ASSETS!==undefined)return ASSETS;try{ASSETS=await window.claude.use("assets")}catch(_){ASSETS=null}return ASSETS}
function coverOf(p){const ph=p.photos||[];if(!ph.length)return null;return ph.find(x=>x.id===p.cover)||[...ph].sort((a,c)=>(a.date+(a.ts||""))<(c.date+(c.ts||""))?1:-1)[0]}
function avatarH(p,cls){const c=coverOf(p);if(c)return `<button type="button" class="av ${cls}" data-photo="${p.id}" data-phid="${c.id}" aria-label="Снимка"><img src="${bu(c.id)}" alt="" loading="lazy"></button>`;
  return S.canWrite&&db?`<button type="button" class="av ${cls} empty" data-addphoto="${p.id}" data-stage="dev" data-date="${todayStr()}" title="Добави снимка" aria-label="Добави снимка">${CAM}</button>`:""}
function photosOf(p,stage,date){return (p.photos||[]).filter(x=>(!stage||x.stage===stage)&&(!date||x.date===date))}
function thumbs(p,list,max=4){if(!list.length)return"";const sh=list.slice(-max);return `<span class="thumbs">${sh.map(x=>`<button type="button" class="pth" data-photo="${p.id}" data-phid="${x.id}" aria-label="Отвори снимката"><img src="${bu(x.id)}" alt="" loading="lazy"></button>`).join("")}${list.length>max?`<span class="small muted">+${list.length-max}</span>`:""}</span>`}
function camBtn(p,stage,date,label){return `<button type="button" class="btn camb" data-addphoto="${p.id}" data-stage="${stage}" data-date="${date||""}">${CAM}${label?`<span>${label}</span>`:""}</button>`}
function shrink(file){return new Promise(res=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{const m=1200;let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,m/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);URL.revokeObjectURL(u);c.toBlob(b=>res(b||file),"image/jpeg",.85)};img.onerror=()=>{URL.revokeObjectURL(u);res(file)};img.src=u})}
async function startLitterPhoto(){const a=await assetsNS();if(!a){toast("Качването на снимки не е достъпно в този изглед.");return}PH={litter:true};const inp=document.getElementById("photoInput");inp.value="";inp.click()}
async function startPhoto(pid,stage,date){const a=await assetsNS();if(!a){toast("Качването на снимки не е достъпно в този изглед.");return}PH={pid,stage,date:date||todayStr()};const inp=document.getElementById("photoInput");inp.value="";inp.click()}
document.getElementById("photoInput").addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
  if(PH.litter){toast("Качване…");try{const a=await assetsNS();const blob=await shrink(f);const r=await a.upload(blob,{pid:"_litter"});const old=S.info&&S.info.cover;if(await queue("litter",()=>write(()=>db.doc("meta/litter").set({...(S.info||{}),cover:r.id})))){toast("Снимката на кучилото е сменена");if(old){try{await a.delete(old)}catch(_){}}}}catch(err){toast("Снимката не се качи. Опитай пак.")}PH={};return}
  if(!PH.pid)return;
  const p=S.all.find(x=>x.id===PH.pid);if(!p)return;toast("Качване…");
  try{const a=await assetsNS();const blob=await shrink(f);const r=await a.upload(blob,{pid:p.id});
    const ok=await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({photos:[...(S.all.find(x=>x.id===p.id).photos||[]),{id:r.id,stage:PH.stage,date:PH.date,ts:Date.now()}]})));
    if(ok)toast("Снимката е добавена")}catch(err){toast(err&&err.code==="not_granted"?"Нямаш права да качваш снимки.":"Снимката не се качи. Опитай пак.")}});
function openLB(pid,phid){const p=S.all.find(x=>x.id===pid);if(!p)return;LB={pid,list:p.photos||[],i:Math.max(0,(p.photos||[]).findIndex(x=>x.id===phid)),confirm:false};showLB()}
function showLB(){const p=S.all.find(x=>x.id===LB.pid);const x=LB.list[LB.i];if(!x){document.getElementById("lightbox").hidden=true;return}
  document.getElementById("lbImg").src=bu(x.id);
  document.getElementById("lbCap").textContent=`${p?dn(p):""} · ${STAGE[x.stage]||""} · ${fmtDate(x.date)}${p&&puppyBirth(p)?` · ден ${dayDiff(puppyBirth(p),x.date)}`:""}`;
  const d=document.getElementById("lbDel");d.textContent=LB.confirm?"Потвърди изтриване":"Изтрий снимката";d.hidden=!(S.canWrite&&db);
  {const cv=coverOf(S.all.find(q=>q.id===LB.pid)||{});const cb=document.getElementById("lbCover");cb.hidden=!(S.canWrite&&db);cb.disabled=!!(cv&&cv.id===x.id);cb.textContent=cv&&cv.id===x.id?"Корица ✓":"Направи корица"}
  document.getElementById("lbPrev").disabled=LB.i<=0;document.getElementById("lbNext").disabled=LB.i>=LB.list.length-1;
  document.getElementById("lightbox").hidden=false}
document.getElementById("lightbox").addEventListener("click",async e=>{const t=e.target.closest("button");if(e.target.id==="lightbox"||(t&&t.id==="lbClose")){document.getElementById("lightbox").hidden=true;return}if(!t)return;
  if(t.id==="lbPrev"){LB.i--;LB.confirm=false;showLB();return}if(t.id==="lbNext"){LB.i++;LB.confirm=false;showLB();return}
  if(t.id==="lbCover"){const x=LB.list[LB.i];const p=S.all.find(q=>q.id===LB.pid);if(await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({cover:x.id}))))toast("Корицата е сменена");showLB();return}
  if(t.id==="lbDel"){if(!LB.confirm){LB.confirm=true;showLB();return}const x=LB.list[LB.i];const p=S.all.find(q=>q.id===LB.pid);
    const ok=await queue(p.id,()=>write(()=>db.doc("puppies/"+p.id).update({photos:(p.photos||[]).filter(q=>q.id!==x.id)})));
    if(ok){try{const a=await assetsNS();a&&await a.delete(x.id)}catch(_){}LB.list=LB.list.filter(q=>q.id!==x.id);LB.i=Math.min(LB.i,LB.list.length-1);LB.confirm=false;toast("Снимката е изтрита");showLB()}}});

/* ---------- data ---------- */
window.__init=async function init(){
  render();
  try{db=window.claude&&typeof window.claude.use==="function"?await window.claude.use("db"):null}catch(_){db=null}
  if(!db){S.noDb=true;render();return}
  try{USER=await window.claude.use("user");if(USER){const c=await USER.can("data.write");if(c===false)S.canWrite=false;S.isOwner=await USER.isOwner();S.admin=await USER.canEdit()}}catch(_){}
  const err=e=>{if(e&&e.code==="revoked"){S.noDb=true;db=null}render()};
  if(USER&&!S.admin){S.viewer=true;S.canWrite=false;document.body.classList.add("viewer");const uid=await USER.id();
    if(!uid){S.viewerMsg="Влез в профила си, за да видиш досието.";render();return}
    db.collection("dossiers/"+uid+"/byLitter").limit(50).onSnapshot(q=>{const ds=q.docs.map(d=>d.data());
      const pups=ds.flatMap(d=>(d.puppies||[]).map(x=>({...x,info:d.info})));
      if(pups.length){S.info=pups[0].info||{};S.all=pups.map(x=>x.puppy);S.puppies=S.all;S.weights=pups.flatMap(x=>x.weights||[]);S.events=pups.flatMap(x=>x.events||[]).filter((e,i,a)=>a.findIndex(q=>q.id===e.id)===i);if(!S.vSel||!S.all.some(p=>p.id===S.vSel))S.vSel=S.all[0].id;S.viewerMsg=""}
      else{S.all=[];S.puppies=[];S.viewerMsg="Досието на твоето кученце още не е споделено. Свържи се с развъдника."}
      S.loaded={i:1,p:1,w:1};render()},err);
    return}
  db.doc("meta/dossiers").onSnapshot(sn=>{S.dzExisting=new Set(sn.exists&&sn.data().emails||[]);S.dzLoaded=true;scheduleSync()},()=>{S.dzLoaded=true});
  db.doc("meta/litter").onSnapshot(s=>{S.info=s.exists?s.data():null;S.loaded.i=1;render()},err);
  db.collection("puppies").limit(200).onSnapshot(q=>{S.all=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,c)=>(a.order||99)-(c.order||99)||String(a.name).localeCompare(c.name,"bg"));S.puppies=S.all.filter(p=>!p.lost);S.loaded.p=1;render()},err);
  db.collection("events").limit(500).onSnapshot(q=>{S.events=q.docs.map(d=>({id:d.id,...d.data()}));S.evLoaded=true;render()},err);
  db.collection("deworm").limit(200).onSnapshot(q=>{S.deworm=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,c)=>a.date<c.date?-1:1);render()},err);
  db.collection("weights").limit(1000).onSnapshot(q=>{S.weights=q.docs.map(d=>({id:d.id,...d.data()}));S.loaded.w=1;render()},err);
};
