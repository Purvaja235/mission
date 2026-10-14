const $=s=>document.querySelector(s),K='habit102v1',pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const P=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addD=(s,n)=>{const d=P(s);d.setDate(d.getDate()+n);return ymd(d)};
const diff=(a,b)=>Math.round((P(a)-P(b))/864e5);
const fmt=k=>P(k).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const TD=()=>ymd(new Date()),r1=v=>+(+v).toFixed(1),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DEF={apps:1000,dsa:50,java:40,ex:25};
let db={entries:{},targets:{},tasks:[],reviews:{},settings:{start:'2026-09-21',theme:'dark',days:90,name:'',daily:{apps:50,dsa:3,java:2}}},vm=TD().slice(0,7),hf='all';
const num=(v,i)=>{v=parseFloat(v);return isFinite(v)&&v>0?(i?Math.round(v):v):0};
const normE=e=>({apps:num(e.apps,1),dsaCompleted:!!e.dsaCompleted,dsaProblems:num(e.dsaProblems,1),javaCompleted:!!e.javaCompleted,javaHours:num(e.javaHours),exerciseCompleted:!!e.exerciseCompleted,steps:num(e.steps,1),calories:num(e.calories,1),weight:num(e.weight),notes:String(e.notes||'').slice(0,2000),rest:!!e.rest});
function clean(r){
 if(!r||typeof r!=='object'||!r.entries||typeof r.entries!=='object')throw 1;
 const o={entries:{},targets:{},tasks:[],reviews:{},settings:{start:'2026-09-21',theme:'dark',days:90,name:'',daily:{apps:50,dsa:3,java:2}}},D=/^\d{4}-\d{2}-\d{2}$/;
 for(const k in r.entries)if(D.test(k)&&r.entries[k]&&typeof r.entries[k]==='object')o.entries[k]=normE(r.entries[k]);
 const t=r.targets||{};for(const m in t)if(/^\d{4}-\d{2}$/.test(m)&&t[m]&&typeof t[m]==='object')o.targets[m]={apps:num(t[m].apps),dsa:num(t[m].dsa),java:num(t[m].java),ex:num(t[m].ex)};
 const s=r.settings||{};if(D.test(s.start))o.settings.start=s.start;if(['light','dark','pink','sky','system'].includes(s.theme))o.settings.theme=s.theme;if(+s.lastBackup>0)o.settings.lastBackup=+s.lastBackup;{const d=Math.round(+s.days);if(d>=7&&d<=365)o.settings.days=d}if(typeof s.name==='string')o.settings.name=s.name.trim().slice(0,40);{const dl=s.daily;if(dl&&typeof dl==='object')o.settings.daily={apps:num(dl.apps),dsa:num(dl.dsa),java:num(dl.java)}}{const rv=r.reviews;if(rv&&typeof rv==='object')for(const k in rv)if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&rv[k]&&typeof rv[k]==='object')o.reviews[k]={well:String(rv[k].well||'').slice(0,2000),change:String(rv[k].change||'').slice(0,2000),t:+rv[k].t||0}}o.tasks=Array.isArray(r.tasks)?r.tasks.map(normT).filter(Boolean):[];
 return o}
function load(){try{const r=JSON.parse(localStorage.getItem(K));if(r)db=clean(r)}catch(e){}}
function save(){try{localStorage.setItem(K,JSON.stringify(db));setMeta({...syncMeta(),t:Date.now()});queuePush();return true}catch(e){toast('⚠️ Could not save — browser storage is blocked',1);return false}}
let tt;function toast(m,bad){const t=$('#toast');t.textContent=m;t.style.background=bad?'var(--miss)':'var(--full)';t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)}
const core=e=>[e.apps>0,e.dsaCompleted||e.dsaProblems>0,e.javaCompleted||e.javaHours>0,e.exerciseCompleted];
const st=e=>{if(!e)return'miss';const c=core(e).filter(Boolean).length;return c>=3?'full':(c||e.calories>0||e.weight>0)?'part':'miss'};
function streaks(){const t=TD(),ks=Object.keys(db.entries).filter(k=>k<=t&&st(db.entries[k])!=='miss').sort(),a=new Set(ks),R=k=>!a.has(k)&&isRest(db.entries[k]);let best=0,run=0,pv=null;
 const bridged=(x,y)=>{for(let d=addD(x,1);d<y;d=addD(d,1))if(!R(d))return false;return true};
 for(const k of ks){run=pv&&bridged(pv,k)?run+1:1;best=Math.max(best,run);pv=k}
 let cur=0,d=t;if(!a.has(d)&&!R(d))d=addD(d,-1);while(a.has(d)||R(d)){if(a.has(d))cur++;d=addD(d,-1)}return{cur,best,days:ks.length}}
const trackStart=()=>{const ks=Object.keys(db.entries).sort();return ks.length&&ks[0]<db.settings.start?ks[0]:db.settings.start};
const me=()=>Object.keys(db.entries).filter(k=>k.startsWith(vm)).sort().map(k=>[k,db.entries[k]]);
const sum=(a,f)=>a.reduce((s,[,e])=>s+f(e),0);
const mlab=m=>{const[y,n]=m.split('-').map(Number);return new Date(y,n-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'})};
/* form */
const goal=(p,f,l)=>`<div class="dgoal"><div class="pb g" role="progressbar" aria-label="${l} vs daily goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="${p}-b-${f}"></i></div><small class="sub" id="${p}-l-${f}"></small></div>`;
const F=p=>`<div class="tgrid f" data-p="${p}">
<section class="tgrp" aria-label="Career"><header class="tgh"><span class="tgi" aria-hidden="true">💼</span><div><h3>CAREER</h3><small>Career execution</small></div></header>
 <div class="tgb"><div class="mt w"><div class="ml">📩 Job applications</div><div class="st"><button type="button" class="rb" data-a="apps:-1" aria-label="Decrease applications">−</button><input id="${p}-apps" type="number" inputmode="numeric" min="0" step="1" placeholder="0" aria-label="Applications today"><button type="button" class="rb" data-a="apps:1" aria-label="Increase applications">+</button></div><div class="q">${[10,20,30,40,50].map(n=>`<button type="button" data-a="apps:${n}">+${n}</button>`).join('')}</div>${goal(p,'apps','Applications')}</div></div></section>
<section class="tgrp" aria-label="Learning"><header class="tgh"><span class="tgi" aria-hidden="true">💻</span><div><h3>LEARNING</h3><small>Skill building</small></div></header>
 <div class="tgb c2"><div class="mt"><div class="ml">☕ Java</div><label class="ck"><input type="checkbox" id="${p}-javaC"> Completed today</label><label class="l" for="${p}-javaH">Study hours</label><input id="${p}-javaH" type="number" inputmode="decimal" min="0" step="0.5" placeholder="0">${goal(p,'javaH','Java hours')}</div>
 <div class="mt"><div class="ml">🧠 DSA</div><label class="ck"><input type="checkbox" id="${p}-dsaC"> Completed today</label><label class="l" for="${p}-dsaN">Problems solved</label><input id="${p}-dsaN" type="number" inputmode="numeric" min="0" step="1" placeholder="0">${goal(p,'dsaN','DSA problems')}</div></div></section>
<section class="tgrp" aria-label="Health"><header class="tgh"><span class="tgi" aria-hidden="true">🏃</span><div><h3>HEALTH</h3><small>Daily wellbeing</small></div></header>
 <div class="tgb c2 hl"><div class="mt"><div class="ml">🏃 Exercise</div><label class="ck"><input type="checkbox" id="${p}-exC"> Completed today</label></div>
 <div class="mt"><div class="ml">👣 Steps</div><input id="${p}-steps" type="number" inputmode="numeric" min="0" step="1" placeholder="0" aria-label="Steps (optional)"></div>
 <div class="mt"><div class="ml">🔥 Calories</div><div class="st"><input id="${p}-cal" type="number" inputmode="numeric" min="0" step="1" placeholder="0" aria-label="Calories in kcal"><span>kcal</span></div></div>
 <div class="mt"><div class="ml">⚖️ Weight</div><div class="st"><input id="${p}-wt" type="number" inputmode="decimal" min="0" step="0.1" placeholder="0.0" aria-label="Weight in kg"><span>kg</span></div></div><div class="mt w" style="grid-column:1/-1"><label class="ck"><input type="checkbox" id="${p}-rest"> 😴 Rest day — keeps my streak alive</label></div></div></section>
<section class="tgrp" aria-label="Notes"><header class="tgh"><span class="tgi" aria-hidden="true">📝</span><div><h3>NOTES</h3><small>Daily reflection</small></div></header>
 <div class="tgb tn1"><textarea id="${p}-notes" placeholder="What did I accomplish today?" aria-label="Daily note"></textarea></div></section></div>`;
const g=(p,i)=>document.getElementById(p+'-'+i);
const readF=p=>normE({apps:g(p,'apps').value,dsaCompleted:g(p,'dsaC').checked,dsaProblems:g(p,'dsaN').value,javaCompleted:g(p,'javaC').checked,javaHours:g(p,'javaH').value,exerciseCompleted:g(p,'exC').checked,steps:g(p,'steps').value,calories:g(p,'cal').value,weight:g(p,'wt').value,notes:g(p,'notes').value,rest:g(p,'rest').checked});
function fillF(p,e){e=normE(e||{});const s=(i,v)=>g(p,i).value=v||'';s('apps',e.apps);s('dsaN',e.dsaProblems);s('javaH',e.javaHours);s('steps',e.steps);s('cal',e.calories);s('wt',e.weight);s('notes',e.notes);g(p,'dsaC').checked=e.dsaCompleted;g(p,'javaC').checked=e.javaCompleted;g(p,'exC').checked=e.exerciseCompleted;g(p,'rest').checked=e.rest;dailyBars(p)}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const p=b.closest('.f').dataset.p,[f,n]=b.dataset.a.split(':'),i=g(p,f);i.value=Math.max(0,(parseFloat(i.value)||0)+ +n);live(p)});
document.addEventListener('input',ev=>{const f=ev.target.closest('.f');if(f)live(f.dataset.p,ev.target.id)});
document.addEventListener('change',ev=>{const f=ev.target.closest('.f');if(f)live(f.dataset.p)});
function live(p,id){dailyBars(p);if(id===p+'-dsaN'&&+g(p,'dsaN').value>0)g(p,'dsaC').checked=true;if(id===p+'-javaH'&&+g(p,'javaH').value>0)g(p,'javaC').checked=true;if(id===p+'-apps'&&+g(p,'apps').value<0)g(p,'apps').value=0;if(p==='t')renderStatus()}
$('#tf').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type==='number'){e.preventDefault();saveToday()}});
/* renderers */
function renderStatus(){const e=readF('t'),s=st(e),c=core(e).filter(Boolean).length;
 $('#stat').textContent=e.rest&&s==='miss'?'😴 REST DAY — STREAK SAFE':s==='full'?'🟢 TODAY COMPLETED':s==='part'?'🟡 TODAY IN PROGRESS':'🔴 TODAY NOT STARTED';
 $('#sbar i').style.width=c*25+'%';$('#sbar').setAttribute('aria-valuenow',c*25);$('#slab').textContent=`${c*25}% · ${c}/4 core habits (applications, DSA, Java, exercise)`}
let MD=90,core1=e=>core(e).some(Boolean);
function mission(){const s=db.settings.start,t=TD(),dn=diff(t,s)+1;let done=0,pd=0,pr=0;
 const end=addD(s,MD-1);for(const k in db.entries)if(k>=s&&k<=end&&k<=t&&core1(db.entries[k]))done++;
 const pastN=Math.min(Math.max(dn-1,0),MD);for(let i=0;i<pastN;i++){const e=db.entries[addD(s,i)];if(e&&core1(e))pd++;else if(isRest(e))pr++}
 return{s,end,dn,done,rem:dn<1?MD:Math.max(MD-dn,0),missed:pastN-pd-pr,pct:done/MD*100}}
let ringFirst=true;
function renderTop(){const S=streaks(),M=mission(),t=TD(),te=db.entries[t],tc=!!te&&core1(te),pc=Math.round(M.pct),C=2*Math.PI*88,all=M.done>=MD;
 $('#today').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
 $('#empty').hidden=!!Object.keys(db.entries).length;$('#mlab').textContent=mlab(vm);
 const status=all?`🎉 YOU COMPLETED ALL ${MD} DAYS!`:M.dn<1?'🚀 MISSION STARTS SOON':M.dn>MD?'🏆 MISSION COMPLETE':M.dn===MD?'⚡ FINAL DAY':'🔥 MISSION IN PROGRESS';
 const dl=M.dn<1?'STARTS '+P(M.s).toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase():M.dn>MD?'MISSION ENDED':`DAY ${M.dn} OF ${MD}`;
 const center=all?`<b style="font-size:48px">🎉</b><span>MISSION COMPLETE</span><span>${MD} / ${MD}</span>`:`<span>${dl}</span><b id="pct">${ringFirst?0:pc}%</b><span>${M.done} / ${MD} COMPLETE</span>`;
 const first=ringFirst;ringFirst=false;
 $('#top').innerHTML=`<div class="hw"><div class="ring" role="img" aria-label="${M.done} of ${MD} mission days completed, ${pc} percent"><svg viewBox="0 0 200 200"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--ac)"/><stop offset="1" style="stop-color:var(--full)"/></linearGradient></defs><circle class="rt" cx="100" cy="100" r="88"/><circle id="arc" class="arc" cx="100" cy="100" r="88" transform="rotate(-90 100 100)" stroke-dasharray="${C}" stroke-dashoffset="${first?C:C*(1-M.pct/100)}" style="${M.done?'':'opacity:0'}"/></svg><div class="rc">${center}</div></div>
 <div class="hi"><div><span class="badge">${status}</span> <span class="sub" style="font-weight:600;margin-left:6px">LAST PUSH OF ${P(M.end).getFullYear()}</span></div>
 <p class="sub">${MD} days. One final push. Show up every day.</p>
 ${M.dn===MD&&!all?`<div class="fin">⚡ FINAL DAY · DAY ${MD} / ${MD}<br>TODAY IS THE LAST DAY.</div>`:''}
 <div class="hs2"><div><b>🔥 ${M.done}</b><span class="sub">DAYS COMPLETED</span></div><div class="left"><b>⏳ ${M.rem}</b><span class="sub">DAYS REMAINING</span></div></div>
 <p class="sub" style="font-size:13px">📅 Mission Day: ${M.dn<1?0:Math.min(M.dn,MD)} / ${MD}${M.missed?` · ✕ ${M.missed} missed`:''} · ends ${fmt(M.end)}.<br>Completed = days you actually showed up. Remaining = mission days still ahead.</p>
 ${taskLine(M)}
 <div class="sr"><div><span class="sub">🔥 CURRENT STREAK</span><b>${S.cur} ${S.cur===1?'DAY':'DAYS'}</b></div><div><span class="sub">🏆 BEST STREAK</span><b>${S.best} ${S.best===1?'DAY':'DAYS'}</b></div><div><span class="sub">📅 DAYS TRACKED</span><b>${S.days}</b></div></div>
 <div><span class="badge">${tc?'🟢 TODAY CONTRIBUTED':'⭕ TODAY NOT COMPLETED'}</span> <span class="sub" style="font-size:14px;margin-left:6px">${tc?"🔥 Today's contribution is done. Keep going.":'Your next contribution keeps the chain alive.'}</span></div></div></div>`;
 if(first){requestAnimationFrame(()=>requestAnimationFrame(()=>{const a=$('#arc');if(a)a.style.strokeDashoffset=C*(1-M.pct/100)}));
  const el=$('#pct');if(el){if(matchMedia('(prefers-reduced-motion:reduce)').matches)el.textContent=pc+'%';else{const t0=performance.now(),f=n=>{const p=Math.min(1,(n-t0)/900);el.textContent=Math.round(pc*(1-Math.pow(1-p,3)))+'%';if(p<1&&document.body.contains(el))requestAnimationFrame(f)};requestAnimationFrame(f)}}}}
function tip(k,e){const d=fmt(k);return e?`${d}\nApplications: ${e.apps}\nDSA: ${e.dsaProblems} problems${e.dsaCompleted&&!e.dsaProblems?' (completed)':''}\nJava: ${r1(e.javaHours)} hours${e.javaCompleted&&!e.javaHours?' (completed)':''}\nExercise: ${e.exerciseCompleted?'Completed':'Not done'}\nCalories: ${e.calories||'–'}\nWeight: ${e.weight?r1(e.weight)+' kg':'–'}`:d+'\nNo record'}
function renderCal(){const[y,m]=vm.split('-').map(Number),n=new Date(y,m,0).getDate(),lead=(new Date(y,m-1,1).getDay()+6)%7,t=TD(),ts=trackStart();
 let h=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="wd">${d}</div>`).join('')+'<span></span>'.repeat(lead);
 for(let d=1;d<=n;d++){const k=`${vm}-${pad(d)}`,e=db.entries[k],s=st(e);let c,mk='',lb;
  if(k>t){c='fut';lb='Future'}else if(s!=='miss'){c=s;mk=s==='full'?'✓':'◐';lb=s==='full'?'Full day':'Partial day'}else if(isRest(e)){c='rest';mk='☾';lb='Rest day'}else if(k===t){c='t0';lb='Today, not started'}else if(k>=ts){c='miss';mk='✕';lb='Missed day'}else{c='none';lb='No record'}
  h+=`<button class="cell ${c}${k===t?' now':''}" data-k="${k}" ${k>t?'disabled':''} title="${esc(tip(k,e))}" aria-label="${fmt(k)}: ${lb}">${d}<small>${mk}</small></button>`}
 $('#cal').innerHTML=h}
$('#cal').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b&&!b.disabled)openDay(b.dataset.k)});
const mc=(ic,l,v,s='')=>`<div class="mc"><span>${ic} ${l}</span><b>${v}</b><small>${s||'&nbsp;'}</small></div>`;
function renderMonth(){const es=me(),ws=es.filter(([,e])=>e.weight>0),cs=es.filter(([,e])=>e.calories>0);
 $('#mh').textContent=`📊 ${mlab(vm).toUpperCase()} PROGRESS`;
 let w;if(ws.length>=2){const a=ws[0][1].weight,b=ws[ws.length-1][1].weight,d=r1(b-a);w=mc('⚖️','WEIGHT CHANGE',(d>0?'+':'')+d+' kg',`Starting ${r1(a)} kg · Current ${r1(b)} kg`)}else w=mc('⚖️','WEIGHT CHANGE','No sufficient data.',ws.length?`Only one weigh-in: ${r1(ws[0][1].weight)} kg`:'');
 $('#ms').innerHTML=mc('📩','APPLICATIONS',sum(es,e=>e.apps))+mc('💻','DSA PROBLEMS',sum(es,e=>e.dsaProblems))+mc('☕','JAVA STUDY',r1(sum(es,e=>e.javaHours))+' hours')+mc('🏃','EXERCISE',es.filter(([,e])=>e.exerciseCompleted).length+' days')+mc('🔥','AVERAGE CALORIES',cs.length?Math.round(sum(cs,e=>e.calories)/cs.length)+' kcal':'No data yet')+w}
function renderTargets(){const es=me(),t=db.targets[vm]||DEF,R=[['apps','📩 Applications',sum(es,e=>e.apps),''],['dsa','💻 DSA',sum(es,e=>e.dsaProblems),' problems'],['java','☕ Java',r1(sum(es,e=>e.javaHours)),' hours'],['ex','🏃 Exercise',es.filter(([,e])=>e.exerciseCompleted).length,' days']];
 $('#tg').innerHTML=R.map(([k,l,v,u])=>{const p=t[k]>0?Math.min(100,v/t[k]*100):0;return`<div class="tr"><div class="h"><strong>${l}</strong><label>Target <input type="number" min="0" step="1" data-t="${k}" value="${t[k]}" aria-label="${l} target for ${mlab(vm)}"></label></div><div class="pb g" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100" aria-label="${l}"><i style="width:${p}%"></i></div><small class="sub">${v} / ${t[k]}${u} · ${r1(Math.max(0,t[k]-v))}${u} left · ${Math.round(p)}%</small></div>`}).join('')}
$('#tg').addEventListener('change',e=>{const k=e.target.dataset.t;if(!k)return;db.targets[vm]={...(db.targets[vm]||DEF),[k]:num(e.target.value)};save();renderTargets()});
function renderCharts(){const es=me(),pts=es.filter(([,e])=>e.weight>0);
 if(!pts.length)$('#wt').innerHTML='<p class="sub">No weight data yet.</p>';else{const w=600,h=200,pl=44,pr=14,pt=14,pb=28,ws=pts.map(p=>p[1].weight),mn=Math.min(...ws),mx=Math.max(...ws),x=i=>pts.length>1?pl+i*(w-pl-pr)/(pts.length-1):(w+pl)/2,y=v=>mx===mn?(pt+h-pb)/2:pt+(mx-v)/(mx-mn)*(h-pt-pb);
  $('#wt').innerHTML=`<div class="sg" style="margin:0 0 12px"><div><span class="sub">Starting</span><b>${r1(ws[0])} kg</b></div><div><span class="sub">Current</span><b>${r1(ws[ws.length-1])} kg</b></div><div><span class="sub">Change</span><b>${ws[ws.length-1]>ws[0]?'▲ +':ws[ws.length-1]<ws[0]?'▼ ':'＝ '}${r1(ws[ws.length-1]-ws[0])} kg</b></div></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weight trend"><text x="4" y="${y(mx)+4}">${r1(mx)}</text><text x="4" y="${y(mn)+4}">${r1(mn)}</text><line x1="${pl}" x2="${w-pr}" y1="${h-pb+6}" y2="${h-pb+6}" stroke="var(--b)"/><polyline class="ln" points="${pts.map((p,i)=>x(i)+','+y(p[1].weight)).join(' ')}"/>${pts.map((p,i)=>`<circle class="dot" cx="${x(i)}" cy="${y(p[1].weight)}" r="4"><title>${fmt(p[0])}: ${r1(p[1].weight)} kg</title></circle>`).join('')}<text x="${pl}" y="${h-4}">${P(pts[0][0]).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</text><text x="${w-pr}" y="${h-4}" text-anchor="end">${P(pts[pts.length-1][0]).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</text></svg>`}
 const[yy,mm]=vm.split('-').map(Number),n=new Date(yy,mm,0).getDate(),t=TD(),mxA=Math.max(1,...es.map(([,e])=>e.apps)),act=es.filter(([,e])=>e.apps>0),tot=sum(es,e=>e.apps);let b='',a='';
 for(let d=1;d<=n;d++){const k=`${vm}-${pad(d)}`,v=(db.entries[k]||{}).apps||0;b+=`<div class="${v?'':'z'}" style="height:${v?Math.max(4,v/mxA*100):2}%" title="${fmt(k)}: ${v} applications"></div>`;a+=`<span>${d===1||d%5===0?d:''}</span>`}
 const tA=(db.targets[vm]||DEF).apps,pA=tA>0?Math.min(100,tot/tA*100):0;$('#ap').innerHTML=`<div class="big"><b>${tot}</b> <span class="sub">/ ${tA} applications this month</span><div class="pb g" role="progressbar" aria-valuenow="${Math.round(pA)}" aria-valuemin="0" aria-valuemax="100" aria-label="Applications progress"><i style="width:${pA}%"></i></div><small class="sub">${Math.max(0,tA-tot)} remaining · ${Math.round(pA)}%</small></div><div class="bars" role="img" aria-label="Applications per day">${b}</div><div class="ax">${a}</div><div class="sg"><div><span class="sub">Total applications</span><b>${tot}</b></div><div><span class="sub">Avg / active day</span><b>${act.length?r1(tot/act.length):0}</b></div><div><span class="sub">Highest in one day</span><b>${act.length?mxA:0}</b></div></div>`}
function renderHist(){const[y,m]=vm.split('-').map(Number),n=new Date(y,m,0).getDate(),t=TD(),ts=trackStart(),F=[['all','All'],['full','Full Days'],['part','Partial Days'],['miss','Missed Days']];
 $('#fl').innerHTML=F.map(([k,l])=>`<button data-f="${k}" aria-pressed="${hf===k}">${l}</button>`).join('');let h='';
 for(let d=n;d>=1;d--){const k=`${vm}-${pad(d)}`;if(k>t)continue;const e=db.entries[k];if(!e&&k<ts)continue;const s=st(e);if(hf!=='all'&&hf!==s)continue;
  h+=`<div class="h1 ${s}"><strong>${fmt(k)} <span class="sub">— ${isRest(e)?'Rest day':s==='full'?'Full day':s==='part'?'Partial day':'Missed day'}</span></strong>`+(e&&s!=='miss'||e?`<div class="r"><span>📩 ${e.apps} Applications</span><span>💻 DSA: ${e.dsaProblems} problems${e.dsaCompleted?' ✅':''}</span><span>☕ Java: ${r1(e.javaHours)} hours${e.javaCompleted?' ✅':''}</span><span>🏃 Exercise: ${e.exerciseCompleted?'✅':'—'}</span><span>🔥 Calories: ${e.calories||'—'}</span><span>⚖️ Weight: ${e.weight?r1(e.weight)+' kg':'—'}</span></div>${e.notes?`<div class="note">📝 ${esc(e.notes)}</div>`:''}`:'<span class="sub">No activity recorded.</span>')+`<div class="a"><button data-e="${k}">${e?'Edit':'Add'}</button>${e?`<button class="dng" data-d="${k}">Delete</button>`:''}</div></div>`}
 $('#hs').innerHTML=h||'<p class="sub">No records to show for this month and filter.</p>'}
$('#fl').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(b){hf=b.dataset.f;renderHist()}});
$('#hs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.e)editDay(b.dataset.e);if(b.dataset.d)delDay(b.dataset.d)});
function renderMiles(){const S=streaks(),v=Object.values(db.entries),sm=f=>v.reduce((t,e)=>t+f(e),0),A=sm(e=>e.apps),D=sm(e=>e.dsaProblems),J=sm(e=>e.javaHours),X=v.filter(e=>e.exerciseCompleted).length,T=db.tasks.filter(t=>t.status==='completed').length;
 const L=[[S.best>=3,'🔥 3 Day Streak'],[S.best>=7,'🔥 7 Day Streak'],[S.best>=14,'🔥 14 Day Streak'],[S.best>=30,'🔥 30 Day Streak'],[S.best>=60,'🔥 60 Day Streak'],[S.best>=90,'🔥 90 Day Streak'],
 [A>=100,'📩 100 Applications'],[A>=500,'📩 500 Applications'],[A>=1000,'📩 1000 Applications'],[A>=2000,'📩 2000 Applications'],
 [D>=50,'💻 50 DSA Problems'],[D>=100,'💻 100 DSA Problems'],[D>=200,'💻 200 DSA Problems'],
 [J>=50,'☕ 50 Java Hours'],[J>=100,'☕ 100 Java Hours'],[X>=30,'🏃 30 Exercise Days'],[T>=10,'✅ 10 Tasks Done'],[T>=50,'✅ 50 Tasks Done']];
 const got=L.filter(x=>x[0]);
 $('#ml').innerHTML=L.map(x=>`<div class="ach ${x[0]?'on':'lk'}"><span class="ai">${x[0]?'🏆':'🔒'}</span><div><b>${x[1]}</b><small>${x[0]?'UNLOCKED':'LOCKED'}</small></div></div>`).join('')+`<p class="sub">${got.length} of ${L.length} badges earned</p>`}
function render(){renderTop();renderStatus();renderCal();renderMonth();renderTargets();renderCharts();renderHist();renderMiles();renderTasks();renderExtra()}
/* actions */
function saveToday(){db.entries[TD()]=readF('t');if(save()){render();toast("✅ Today's progress saved!")}}
$('#sv').onclick=saveToday;
$('#go').onclick=()=>{$('#trk').scrollIntoView({behavior:'smooth'});g('t','apps').focus({preventScroll:true})};
function chm(d){const[y,m]=vm.split('-').map(Number),n=new Date(y,m-1+d,1);vm=n.getFullYear()+'-'+pad(n.getMonth()+1);render()}
$('#pm').onclick=()=>chm(-1);$('#nm').onclick=()=>chm(1);
function openDay(k){const e=db.entries[k];$('#dbody').innerHTML=`<h2>${fmt(k)}</h2>${e?`<div class="r" style="display:grid;gap:4px"><span>📩 ${e.apps} applications</span><span>💻 DSA: ${e.dsaProblems} problems${e.dsaCompleted?' (completed)':''}</span><span>☕ Java: ${r1(e.javaHours)} hours${e.javaCompleted?' (completed)':''}</span><span>🏃 Exercise: ${e.exerciseCompleted?'Completed':'Not done'}${e.steps?' · '+e.steps+' steps':''}</span><span>🔥 Calories: ${e.calories||'—'}</span><span>⚖️ Weight: ${e.weight?r1(e.weight)+' kg':'—'}</span>${e.notes?`<span class="note">📝 ${esc(e.notes)}</span>`:''}</div>`:'<p class="sub">No record for this day.</p>'}<div class="ar"><button id="dc">Close</button>${e?'<button id="dx" class="dng">Delete</button>':''}<button id="de" class="pri">${e?'Edit':'Add entry'}</button></div>`;
 $('#dc').onclick=()=>$('#dlg').close();$('#de').onclick=()=>editDay(k);if(e)$('#dx').onclick=()=>delDay(k);if(!$('#dlg').open)$('#dlg').showModal()}
function editDay(k){$('#dbody').innerHTML=`<h2>Edit ${fmt(k)}</h2>${F('m')}<div class="ar"><button id="dc">Cancel</button><button id="dsv" class="pri">Save changes</button></div>`;fillF('m',db.entries[k]);
 $('#dc').onclick=()=>$('#dlg').close();$('#dsv').onclick=()=>{db.entries[k]=readF('m');if(save()){if(k===TD())fillF('t',db.entries[k]);$('#dlg').close();render();toast('✅ Changes saved!')}};if(!$('#dlg').open)$('#dlg').showModal()}
let cb;function ask(m,ok,f){$('#cfm').textContent=m;$('#cfok').textContent=ok;cb=f;$('#cf').showModal()}
$('#cfno').onclick=()=>$('#cf').close();$('#cfok').onclick=()=>{$('#cf').close();cb&&cb()};
function delDay(k){$('#dlg').close();ask("Are you sure you want to delete this day's record?"+' ('+fmt(k)+')','Delete',()=>{delete db.entries[k];save();if(k===TD())fillF('t',{});render();toast('🗑️ Record deleted')})}
/* settings */
function theme(){const t=db.settings.theme;document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',theme);
$('#th2').onchange=$('#th3').onchange=e=>{db.settings.theme=e.target.value;save();applySettings()};
$('#sd').onchange=e=>{if(!e.target.value)return;db.settings.start=e.target.value;save();render()};
/* ================================
   COLLAPSIBLE SETTINGS
   ================================ */

const settingsToggle = document.getElementById('settingsToggle');
const settingsContent = document.getElementById('settingsContent');
const settingsArrow = document.getElementById('settingsArrow');
const settingsClose = document.getElementById('settingsClose');

function toggleSettings(show) {
  if (!settingsContent || !settingsToggle) return;

  settingsContent.hidden = !show;
  settingsToggle.setAttribute('aria-expanded', String(show));

  if (settingsArrow) {
    settingsArrow.textContent = show ? '▲' : '▼';
  }
}

if (settingsToggle) {
  settingsToggle.addEventListener('click', () => {
    toggleSettings(settingsContent.hidden);
  });
}

if (settingsClose) {
  settingsClose.addEventListener('click', () => {
    toggleSettings(false);

    if (settingsToggle) {
      settingsToggle.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });
}
function doExport(){db.settings.lastBackup=Date.now();save();renderBackup();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'habit102',version:1,exportedAt:new Date().toISOString(),...db},null,2)],{type:'application/json'}));a.download='habit-tracker-'+TD()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3);toast('📤 Data exported')}
$('#ex').onclick=doExport;
$('#sdays').onchange=e=>{const d=Math.round(+e.target.value);if(!(d>=7&&d<=365)){toast('⚠️ Choose 7 to 365 days',1);e.target.value=MD;return}db.settings.days=d;save();applySettings();render()};
$('#sname').onchange=e=>{db.settings.name=e.target.value.trim().slice(0,40);save();applySettings()};
$('#im').onclick=()=>$('#imp').click();
$('#imp').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;let n;try{n=clean(JSON.parse(await f.text()))}catch(x){return toast('⚠️ Not a valid tracker file — nothing was changed',1)}
 ask(`Import ${Object.keys(n.entries).length} days? This replaces your current data.`,'Import',()=>{db=n;save();applySettings();fillF('t',db.entries[TD()]);render();toast('📥 Data imported')})};
$('#clr').onclick=()=>ask('This permanently erases ALL your records, targets and settings. Export a backup first if unsure.','Continue',()=>{if((prompt('Type DELETE to erase everything')||'').trim()==='DELETE'){db={entries:{},targets:{},tasks:[],reviews:{},settings:{start:'2026-09-21',theme:'dark',days:90,name:'',daily:{apps:50,dsa:3,java:2}}};save();applySettings();fillF('t',{});render();toast('🗑️ All data cleared')}else toast('Nothing was deleted',1)});
function applySettings(){const D=db.settings.daily||{};['apps','dsa','java'].forEach(k=>{const el=document.getElementById('dt-'+k);if(el)el.value=D[k]||''});MD=db.settings.days||90;const nm=(db.settings.name||'').trim()||`MY ${MD}-DAY MISSION`;$('#mt').textContent='🚀 '+nm.toUpperCase();$('#mt2').textContent=`🚀 YOUR ${MD}-DAY MISSION STARTS HERE`;document.title=nm;$('#sdays').value=MD;$('#sname').value=db.settings.name||'';$('#sname').placeholder=`MY ${MD}-DAY MISSION`;$('#sd').value=db.settings.start;$('#th2').value=$('#th3').value=db.settings.theme;theme()}
const CATS=['Java','DSA','Job Applications','Interview Preparation','Project','Exercise','Personal','Other'],PRI={high:'🔴 High',medium:'🟡 Medium',low:'🟢 Low'},PR={high:0,medium:1,low:2},
CHEER=['🔥 Great job! Keep going!','✅ One more task conquered!',"🚀 You're making progress!",'💪 Keep the momentum!','🎯 Another step toward your goal!'];
function normT(t){if(!t||typeof t!=='object')return null;const title=String(t.title||'').trim().slice(0,200);if(!title)return null;const ts=v=>{v=+v;return isFinite(v)&&v>0?v:Date.now()};
 return{id:String(t.id||'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),title,description:String(t.description||'').slice(0,2000),dueDate:/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)?t.dueDate:'',dueTime:/^\d{2}:\d{2}$/.test(t.dueTime)?t.dueTime:'',priority:PRI[t.priority]?t.priority:'medium',category:CATS.includes(t.category)?t.category:'Other',status:t.status==='completed'?'completed':'pending',repeat:['daily','weekdays','weekly'].includes(t.repeat)?t.repeat:'',createdAt:ts(t.createdAt),completedAt:t.status==='completed'?ts(t.completedAt):null}}
const isOver=t=>{if(t.status!=='pending'||!t.dueDate)return false;const d=P(t.dueDate),[h,m]=t.dueTime?t.dueTime.split(':').map(Number):[23,59];d.setHours(h,m,t.dueTime?0:59);return d.getTime()<Date.now()};
const fS=k=>P(k).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}),fT=v=>{const[h,m]=v.split(':').map(Number);return new Date(2e3,0,1,h,m).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})};
const dueBadge=t=>{if(t.status==='completed'||!t.dueDate)return'';if(isOver(t))return'<span class="od">🔴 Overdue</span>';const d=TD();return t.dueDate===d?'<span>🟠 Due today</span>':t.dueDate===addD(d,1)?'<span>🟡 Due tomorrow</span>':'<span>🟢 Upcoming</span>'};
const dk=t=>t.dueDate?t.dueDate+(t.dueTime||'23:59'):'',dcmp=(x,y)=>{const a=dk(x),b=dk(y);return a===b?0:!a?1:!b?-1:a<b?-1:1};
const srt=(a,o)=>a.sort((x,y)=>o==='due-desc'?dcmp(y,x):o==='pri'?PR[x.priority]-PR[y.priority]||dcmp(x,y):o==='added'?y.createdAt-x.createdAt:o==='comp'?(y.completedAt||0)-(x.completedAt||0):o==='alpha'?x.title.localeCompare(y.title):dcmp(x,y));
function tcard(t){const dn=t.status==='completed';return`<div class="tk ${t.priority}${dn?' dn':''}"><label class="ck"><input type="checkbox" data-tc="${t.id}" ${dn?'checked':''}><span class="tt">${esc(t.title)}</span></label>${t.description?`<div class="sub">${esc(t.description)}</div>`:''}<div class="chips">${t.dueDate?`<span>📅 Due: ${fS(t.dueDate)}</span>`:''}${t.dueTime?`<span>⏰ ${fT(t.dueTime)}</span>`:''}<span>${PRI[t.priority]}</span><span>🟦 ${esc(t.category)}</span>${t.repeat?`<span>🔁 ${{daily:'Daily',weekdays:'Weekdays',weekly:'Weekly'}[t.repeat]}</span>`:''}${dueBadge(t)}${dn?`<span>🟢 Completed: ${new Date(t.completedAt).toLocaleString('en-US',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}</span>`:''}</div><div class="a">${dn?`<button data-act="pend" data-id="${t.id}">↩ Mark Pending</button>`:`<button class="pri" data-act="done" data-id="${t.id}">✓ Mark Complete</button>`}<button data-act="edit" data-id="${t.id}">✏ Edit</button><button class="dng" data-act="del" data-id="${t.id}">🗑 Delete</button></div></div>`}
const trow=(t,o)=>{const d=t.status==='completed';return`<label class="ck"><input type="checkbox" data-tc="${t.id}" ${d?'checked':''}><span style="${d?'text-decoration:line-through;opacity:.6':''}">${esc(t.title)}${o?` <small class="sub">— ${fS(t.dueDate)}${t.dueTime?', '+fT(t.dueTime):''}</small>`:''}</span></label>`};
const tf={q:'',s:'all',c:'all',p:'all',o:'due-asc'};
function taskLine(M){const ts=db.tasks.filter(t=>t.dueDate===TD()),n=ts.length,c=ts.filter(t=>t.status==='completed').length,lb=M.dn>=1&&M.dn<=MD?'Day '+M.dn:'Today';
 return`<p class="sub" style="font-size:14px">📋 ${lb} tasks: <b>${n?`${c} / ${n} completed · ${Math.round(c/n*100)}%`:'none due'}</b>${n&&c===n?' <span class="badge">🔥 DAY COMPLETE</span>':''}</p>`}
function renderTasks(){const T=db.tasks,td=TD(),pend=T.filter(t=>t.status==='pending'),done=T.length-pend.length,over=pend.filter(isOver),rate=T.length?Math.round(done/T.length*100):0,M=mission(),MT=T.filter(t=>t.dueDate>=M.s&&t.dueDate<=M.end),md=MT.filter(t=>t.status==='completed').length,mp=MT.length?Math.round(md/MT.length*100):0,C=2*Math.PI*26;
 $('#tcnt').innerHTML=`<div class="c4">${mc('📋','Total Tasks',T.length)+mc('⏳','Pending',pend.length)+mc('✅','Completed',done)+mc('📈','Completion Rate',rate+'%')}</div><p style="margin:14px 0 4px"><strong>Task Progress</strong> <span class="sub">${done} / ${T.length} completed</span></p><div class="pb g" role="progressbar" aria-valuenow="${rate}" aria-valuemin="0" aria-valuemax="100" aria-label="Task progress"><i style="width:${rate}%"></i></div><div class="tm"><div><strong>🚀 ${MD}-DAY TASK PROGRESS · ${mp}%</strong><div class="sub">Tasks due ${fS(M.s)} – ${fS(M.end)}</div></div></div>`;
 const tt=T.filter(t=>t.dueDate===td),rem=tt.filter(t=>t.status==='pending').length;
 $('#tnow').innerHTML=`<div class="tn"><div><h3>📅 TODAY'S TASKS</h3>${tt.length?tt.map(t=>trow(t)).join('')+`<small class="sub">${rem} task${rem===1?'':'s'} remaining today</small>`:'<small class="sub">No tasks due today.</small>'}</div>${over.length?`<div><h3 style="color:var(--miss)">⚠️ OVERDUE (${over.length})</h3>${over.map(t=>trow(t,1)).join('')}</div>`:''}</div>`;
 const q=tf.q.trim().toLowerCase(),ok=t=>(!q||(t.title+' '+t.description+' '+t.category).toLowerCase().includes(q))&&(tf.c==='all'||t.category===tf.c)&&(tf.p==='all'||t.priority===tf.p);
 let PL=pend.filter(ok),DL=T.filter(t=>t.status==='completed'&&ok(t));if(tf.s==='overdue')PL=PL.filter(isOver);srt(PL,tf.o);srt(DL,tf.o);
 const sp=tf.s!=='completed',sd=tf.s==='all'||tf.s==='completed';$('#hp').hidden=!sp;$('#tpend').hidden=!sp;$('#hd').hidden=!sd;$('#tdone').hidden=!sd;$('.addbar').hidden=!sp||!pend.length;
 $('#hp').textContent=`📋 Pending Tasks (${PL.length})`;$('#hd').textContent=`✅ COMPLETED TASKS (${DL.length})`;
 $('#tpend').innerHTML=PL.length?PL.map(tcard).join(''):pend.length?'<p class="sub">No pending tasks match your filters.</p>':'<div class="e2"><h3>🎉 No Pending Tasks!</h3><p class="sub">You have completed everything for now.</p><button class="pri" data-act="add">+ Add New Task</button></div>';
 $('#tdone').innerHTML=DL.length?DL.map(tcard).join(''):done?'<p class="sub">No completed tasks match your filters.</p>':'<div class="e2"><h3>📋 No Completed Tasks Yet</h3><p class="sub">Complete your first task and it will appear here.</p></div>';
 const wk=addD(td,-((P(td).getDay()+6)%7)),ck=t=>t.status==='completed'&&t.completedAt?ymd(new Date(t.completedAt)):'';
 $('#tst').innerHTML=`<h3>Task history</h3><div class="c4">${mc('🗂','Created',T.length)+mc('✅','Completed',done)+mc('⏳','Pending',pend.length)+mc('⚠️','Overdue',over.length)+mc('📈','Overall rate',rate+'%')+mc('📅','Done today',T.filter(t=>ck(t)===td).length)+mc('🗓','Done this week',T.filter(t=>ck(t)>=wk&&ck(t)<=td).length)+mc('📆','Done this month',T.filter(t=>ck(t).startsWith(td.slice(0,7))).length)}</div>`}
function openTask(id){const t=db.tasks.find(x=>x.id===id)||{title:'',description:'',dueDate:TD(),dueTime:'',priority:'medium',category:'Other',repeat:''};
 $('#dbody').innerHTML=`<h2>${id?'✏ Edit task':'+ Add task'}</h2><div style="display:grid;gap:10px"><label>Task name<input id="k-t" type="text" maxlength="200" placeholder="Complete 20 Java pattern problems" value="${esc(t.title)}"></label><label>Description / notes (optional)<textarea id="k-d">${esc(t.description)}</textarea></label><div class="tg"><label>Due date<input id="k-dd" type="date" value="${t.dueDate}"></label><label>Due time (optional)<input id="k-dt" type="time" value="${t.dueTime}"></label><label>Priority<select id="k-p">${Object.keys(PRI).map(k=>`<option value="${k}" ${k===t.priority?'selected':''}>${PRI[k]}</option>`).join('')}</select></label><label>Category<select id="k-c">${CATS.map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></label><label>Repeat<select id="k-r">${[['','Does not repeat'],['daily','Every day'],['weekdays','Weekdays (Mon–Fri)'],['weekly','Every week']].map(([v,l])=>`<option value="${v}" ${v===t.repeat?'selected':''}>${l}</option>`).join('')}</select></label></div></div><div class="ar"><button id="dc">Cancel</button><button id="ksv" class="pri">${id?'Save changes':'Add Task'}</button></div>`;
 $('#dc').onclick=()=>$('#dlg').close();
 const sv=()=>{const title=$('#k-t').value.trim();if(!title){$('#k-t').focus();return toast('⚠️ Enter a task name',1)}
  const v={title,description:$('#k-d').value,dueDate:$('#k-dd').value,dueTime:$('#k-dt').value,priority:$('#k-p').value,category:$('#k-c').value,repeat:$('#k-r').value};
  if(id)Object.assign(db.tasks.find(x=>x.id===id),normT({...db.tasks.find(x=>x.id===id),...v}));else db.tasks.push(normT({...v,status:'pending',createdAt:Date.now()}));
  if(save()){$('#dlg').close();render();toast(id?'✅ Task updated':'✅ Task added')}};
 $('#ksv').onclick=sv;$('#k-t').onkeydown=e=>{if(e.key==='Enter')sv()};if(!$('#dlg').open)$('#dlg').showModal();$('#k-t').focus()}
function tAct(a,id){const t=db.tasks.find(x=>x.id===id);if(!t)return;
 if(a==='done'){t.status='completed';t.completedAt=Date.now();let nx='';if(t.repeat&&t.dueDate){const nd=nextDue(t);if(!db.tasks.some(x=>x.status==='pending'&&x.title===t.title&&x.dueDate===nd)){db.tasks.push(normT({...t,id:'',dueDate:nd,status:'pending',completedAt:null,createdAt:Date.now()}));nx=' 🔁 Next: '+fS(nd)}}if(save()){render();toast('🎉 Task Completed! '+t.title+nx+' — '+CHEER[Math.floor(Math.random()*CHEER.length)])}}
 else if(a==='pend'){t.status='pending';t.completedAt=null;if(save()){render();toast('↩ Moved back to pending')}}
 else if(a==='edit')openTask(id);
 else if(a==='del')ask('Are you sure you want to delete this task?','Delete',()=>{db.tasks=db.tasks.filter(x=>x.id!==id);save();render();toast('🗑️ Task deleted')})}
$('#tasks').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)b.dataset.act==='add'?openTask():tAct(b.dataset.act,b.dataset.id);const s=e.target.closest('[data-ts]');if(s){tf.s=s.dataset.ts;document.querySelectorAll('[data-ts]').forEach(x=>x.setAttribute('aria-pressed',x===s));renderTasks()}});
$('#tasks').addEventListener('change',e=>{const c=e.target.closest('[data-tc]');if(c)tAct(c.checked?'done':'pend',c.dataset.tc)});
$('#tc').innerHTML='<option value="all">All categories</option>'+CATS.map(c=>`<option>${c}</option>`).join('');
$('#tq').oninput=e=>{tf.q=e.target.value;renderTasks()};$('#tc').onchange=e=>{tf.c=e.target.value;renderTasks()};$('#tp').onchange=e=>{tf.p=e.target.value;renderTasks()};$('#to').onchange=e=>{tf.o=e.target.value;renderTasks()};
setInterval(renderTasks,6e4);

function renderFull(){const M=mission(),t=TD();let h='';
 for(let i=0;i<MD;i++){const k=addD(M.s,i),e=db.entries[k],ok=e&&core1(e);let c,l,m='';
  if(k>t){c='fut';l='Upcoming'}else if(ok){c='full';l='Completed';m='✓'}else if(isRest(e)){c='rest';l='Rest day';m='☾'}else if(k===t){c='t0';l='Today, not yet'}else{c='miss';l='Missed';m='✕'}
  h+=`<button class="cell ${c}${k===t?' now':''}" data-k="${k}" ${k>t?'disabled':''} title="Day ${i+1} · ${fS(k)} · ${l}" aria-label="Day ${i+1}, ${fS(k)}: ${l}">${i+1}<small>${m}</small></button>`}
 $('#fm').innerHTML=`<div class="fg">${h}</div>`}
$('#fm').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b&&!b.disabled)openDay(b.dataset.k)});
function wsum(a,b){const o={apps:0,dsa:0,java:0,ex:0,act:0,tk:0};for(let k=a;k<=b;k=addD(k,1)){const e=db.entries[k];if(e){o.apps+=e.apps;o.dsa+=e.dsaProblems;o.java+=e.javaHours;if(e.exerciseCompleted)o.ex++;if(core1(e))o.act++}}
 o.tk=db.tasks.filter(t=>{if(t.status!=='completed'||!t.completedAt)return false;const k=ymd(new Date(t.completedAt));return k>=a&&k<=b}).length;return o}
function renderWeek(){const td=TD(),ws=addD(td,-((P(td).getDay()+6)%7)),A=wsum(ws,addD(ws,6)),B=wsum(addD(ws,-7),addD(ws,-1));
 const R=[['📩 Applications','apps'],['💻 DSA problems','dsa'],['☕ Java hours','java'],['🏃 Exercise days','ex'],['✅ Active days','act'],['📋 Tasks done','tk']];
 $('#wk').innerHTML=`<p class="sub" style="margin-bottom:8px">This week: ${fS(ws)} – ${fS(addD(ws,6))} (Mon–Sun)</p><div class="calw"><table class="wt"><tr><th></th><th>This week</th><th>Last week</th><th>Change</th></tr>${R.map(([l,k])=>{const d=r1(A[k]-B[k]);return`<tr><td>${l}</td><td><b>${r1(A[k])}</b></td><td>${r1(B[k])}</td><td>${d>0?'▲ +'+d:d<0?'▼ '+d:'＝ 0'}</td></tr>`}).join('')}</table></div>`}
function renderBackup(){const lb=db.settings.lastBackup||0,days=lb?Math.floor((Date.now()-lb)/864e5):0,has=Object.keys(db.entries).length||db.tasks.length,need=has&&(!lb||days>=7);
 $('#bk').hidden=!need;$('#bk').innerHTML=need?`<div><strong>💾 BACKUP REMINDER</strong><div class="sub">${lb?`Last backup: ${days} days ago`:'No backup yet'} · Keep a manual JSON backup for extra protection.</div></div><button id="bkb" class="pri">Export now</button>`:'';
 $('#lbt').textContent=lb?'💾 Last backup: '+new Date(lb).toLocaleString('en-US',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}):'💾 No backup yet — use Export Data.'}
$('#bk').onclick=e=>{if(e.target.id==='bkb')doExport()};
function renderExtra(){renderFull();renderWeek();renderBackup();renderIns();renderReview()}
function report(){const M=mission(),td=TD(),last=td<M.end?td:M.end,rows=[],ws=[];let apps=0,dsa=0,jh=0,ex=0,done=0,miss=0;
 for(let k=M.s;k<=last;k=addD(k,1)){const e=db.entries[k],ok=e&&core1(e);if(ok)done++;else if(k<td&&!isRest(e))miss++;if(e){apps+=e.apps;dsa+=e.dsaProblems;jh+=e.javaHours;if(e.exerciseCompleted)ex++;if(e.weight)ws.push(e.weight)}
  rows.push(`<tr><td>${fS(k)}</td><td>${ok?'✓':isRest(e)?'☾':k<td?'✕':'–'}</td><td>${e?e.apps:0}</td><td>${e?e.dsaProblems:0}</td><td>${e?r1(e.javaHours):0}</td><td>${e&&e.exerciseCompleted?'✓':''}</td><td>${e&&e.calories||''}</td><td>${e&&e.weight?r1(e.weight):''}</td><td>${e?esc(e.notes):''}</td></tr>`)}
 const S=streaks(),TK=db.tasks.filter(t=>t.status==='completed'&&t.dueDate>=M.s&&t.dueDate<=M.end).length,nm=(db.settings.name||'').trim()||`MY ${MD}-DAY MISSION`,box=(l,v)=>`<div><b>${v}</b>${l}</div>`;
 const h=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(nm)} — report</title><style>body{font:15px system-ui,sans-serif;max-width:920px;margin:24px auto;padding:0 14px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #ccc;padding:5px 8px;text-align:left}th{background:#eee}.g{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.g div{border:1px solid #ccc;border-radius:10px;padding:8px 14px}.g b{font-size:22px;display:block}</style></head><body><h1>🚀 ${esc(nm)}</h1><p>${fS(M.s)} – ${fS(M.end)} · report generated ${fS(td)}</p><div class="g">${box('days completed',done+' / '+MD)}${box('days missed',miss)}${box('best streak',S.best)}${box('applications',apps)}${box('DSA problems',dsa)}${box('Java hours',r1(jh))}${box('exercise days',ex)}${box('tasks completed',TK)}${ws.length>1?box('weight change',r1(ws[ws.length-1]-ws[0])+' kg ('+r1(ws[0])+' → '+r1(ws[ws.length-1])+')'):''}</div><h2>Day by day</h2><table><tr><th>Date</th><th>Done</th><th>Apps</th><th>DSA</th><th>Java h</th><th>Exercise</th><th>Calories</th><th>Weight</th><th>Note</th></tr>${rows.join('')}</table></body></html>`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));a.download='mission-report-'+td+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3);toast('📄 Report saved — open it and print or save as PDF')}
$('#rp').onclick=report;
function nextDue(t){const td=TD(),st=t.repeat==='weekly'?7:1;let d=t.dueDate;do{d=addD(d,st)}while(d<=td);if(t.repeat==='weekdays')while([0,6].includes(P(d).getDay()))d=addD(d,1);return d}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

var FB=null,pushT=null;const SK='habit102sync';
function syncMeta(){try{return JSON.parse(localStorage.getItem(SK))||{}}catch(e){return{}}}
function setMeta(m){try{localStorage.setItem(SK,JSON.stringify(m))}catch(e){}}
const setSync=m=>{$('#sync').textContent=m;const k=m.includes('⚠️')?'err':/Connecting|…/.test(m)?'busy':/Synced|Connected/.test(m)?'ok':'';$('#sdot').className='sd '+k;const u=FB&&FB.user;$('#sst').textContent=u?'● Connected to '+(u.email||'Google account'):'Not connected';$('#sdesc').textContent=u?'Your tracker syncs to this Google account.':'Your data is currently stored locally on this device.'};
const hasData=()=>Object.keys(db.entries).length>0||db.tasks.length>0;
function queuePush(){if(!FB||!FB.user||!FB.ref)return;clearTimeout(pushT);pushT=setTimeout(push,1500)}
async function push(){try{await FB.fs.setDoc(FB.ref,{data:JSON.stringify(db),t:syncMeta().t||Date.now()});setSync('☁️ Synced at '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}))}catch(e){setSync('⚠️ Sync failed: '+(e.code||e.message))}}
function applyRemote(r){try{const n=clean(JSON.parse(r.data));db=n;localStorage.setItem(K,JSON.stringify(db));setMeta({...syncMeta(),uid:FB.user.uid,t:r.t});applySettings();fillF('t',db.entries[TD()]);render();setSync('☁️ Synced (loaded latest from cloud)')}catch(e){setSync('⚠️ Cloud data could not be read')}}
function onRemote(snap){if(snap.metadata&&snap.metadata.hasPendingWrites)return;const m=syncMeta(),uid=FB.user.uid;
 if(!snap.exists()){setMeta({...m,uid,t:m.t||Date.now()});if(hasData())push();else setSync('☁️ Connected — nothing saved in the cloud yet');return}
 const r=snap.data();
 if(m.uid!==uid){if(hasData()&&!confirm("The cloud already has saved data for this account.\n\nOK = use the cloud data on this device (replaces what is here).\nCancel = keep this device's data and overwrite the cloud.")){setMeta({uid,t:Date.now()});push();return}applyRemote(r);return}
 if(r.t>(m.t||0))applyRemote(r);else if((m.t||0)>r.t)push();else setSync('☁️ Synced')}
async function initSync(){const hide=()=>{$('#sin').hidden=true;$('#sout').hidden=true};
 if(!firebaseConfig){hide();return setSync('☁️ Sync is not set up yet — data stays on this device.')}
 if(!location.protocol.startsWith('http')){hide();return setSync('☁️ Sync works only from the https web address, not from a local file.')}
 try{const B='https://www.gstatic.com/firebasejs/10.12.2/',[a,au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  const app=a.initializeApp(firebaseConfig);FB={au,fs,auth:au.getAuth(app),db:fs.getFirestore(app),user:null,ref:null,unsub:null};
  au.onAuthStateChanged(FB.auth,u=>{FB.user=u;if(FB.unsub){FB.unsub();FB.unsub=null}$('#sin').hidden=!!u;$('#sout').hidden=!u;
   if(u){FB.ref=fs.doc(FB.db,'users',u.uid);setSync('☁️ Connecting as '+(u.email||'you')+'…');FB.unsub=fs.onSnapshot(FB.ref,onRemote,e=>setSync('⚠️ '+(e.code||e.message)))}else{FB.ref=null;setSync('☁️ Not signed in — data stays on this device.')}})}
 catch(e){hide();setSync('⚠️ Could not load Firebase (are you offline?)')}}
$('#sin').onclick=async()=>{try{await FB.au.signInWithPopup(FB.auth,new FB.au.GoogleAuthProvider())}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code))FB.au.signInWithRedirect(FB.auth,new FB.au.GoogleAuthProvider());else if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')setSync('⚠️ '+(e.code||e.message))}};
$('#sout').onclick=()=>FB&&FB.au.signOut(FB.auth);

/* ===== v3 features: daily targets, rest day, insights, weekly review ===== */
function isRest(e){return !!e&&!!e.rest&&st(e)==='miss'}
function dailyBars(p){const T=db.settings.daily||{};[['apps','apps'],['dsaN','dsa'],['javaH','java']].forEach(([f,k])=>{const bar=g(p,'b-'+f),lb=g(p,'l-'+f),inp=g(p,f);if(!bar||!lb||!inp)return;const v=+inp.value||0,t=T[k]||0,pc=t>0?Math.min(100,v/t*100):0;bar.style.width=pc+'%';bar.parentElement.setAttribute('aria-valuenow',Math.round(pc));lb.textContent=t>0?`${r1(v)} / ${t} today${v>=t?' ✓ goal reached':''}`:'No daily goal set (Settings)'})}
['apps','dsa','java'].forEach(k=>{$('#dt-'+k).onchange=e=>{db.settings.daily={...(db.settings.daily||{}),[k]:num(e.target.value)};save();dailyBars('t')}});
function renderIns(){const[y,m]=vm.split('-').map(Number),n=new Date(y,m,0).getDate();
 const dayBars=(f,l,u)=>{let b='',a='',mx=0,sum=0,act=0;const V=[];for(let d=1;d<=n;d++){const k=`${vm}-${pad(d)}`,v=(db.entries[k]||{})[f]||0;V.push([k,v]);mx=Math.max(mx,v);sum+=v;if(v>0)act++}
  V.forEach(([k,v],i)=>{b+=`<div class="${v?'':'z'}" style="height:${v?Math.max(4,v/mx*100):2}%" title="${fmt(k)}: ${r1(v)} ${u}"></div>`;a+=`<span>${i===0||(i+1)%5===0?i+1:''}</span>`});
  return`<h3>${l}</h3><div class="bars" role="img" aria-label="${l}, ${mlab(vm)}">${b}</div><div class="ax">${a}</div><p class="sub">Total ${r1(sum)} ${u} · Average ${act?r1(sum/act):0} per active day</p>`};
 const ts=trackStart(),td=TD(),W=Array.from({length:7},()=>({s:0,n:0})),N=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 for(let k=ts;k<=td;k=addD(k,1)){const e=db.entries[k];if(isRest(e))continue;const i=(P(k).getDay()+6)%7;W[i].n++;W[i].s+=e?core(e).filter(Boolean).length:0}
 const av=W.map(x=>x.n?x.s/x.n:0),mx=Math.max(...av),bi=mx>0?av.indexOf(mx):-1;
 $('#ins').innerHTML=`<div class="tg"><div>${dayBars('dsaProblems','💻 DSA problems per day','problems')}</div><div>${dayBars('javaHours','☕ Java hours per day','hours')}</div></div><h3 style="margin-top:18px">Best weekday</h3>${bi<0?'<p class="sub">No data yet.</p>':`<p class="sub">🏆 <b>${N[bi]}</b> is your strongest day — ${r1(mx)} of 4 core habits on average (rest days excluded).</p><div class="bars" style="height:90px" role="img" aria-label="Average core habits by weekday">${av.map((v,i)=>`<div class="${i===bi?'':'wkd'}" style="height:${Math.max(4,v/4*100)}%" title="${N[i]}: ${r1(v)} / 4"></div>`).join('')}</div><div class="ax">${N.map(x=>`<span>${x.slice(0,3)}</span>`).join('')}</div>`}`}
function renderReview(){
  const box=$('#rv');

  if(
    document.activeElement &&
    box.contains(document.activeElement) &&
    document.activeElement.tagName==='TEXTAREA'
  ) return;

  const td=TD();
  const k=addD(td,-((P(td).getDay()+6)%7));
  const R=db.reviews||{};
  const r=R[k]||{well:'',change:''};
  const sun=P(td).getDay()===0;

  box.innerHTML =
  (sun
    ? '<div class="bk" style="margin-bottom:12px"><strong>🗓 Sunday — time for your weekly review.</strong></div>'    : '') +

    '<p class="sub" style="margin-bottom:10px">' +
      'Week of '+fS(k)+' – '+fS(addD(k,6))+
    '</p>' +

    '<div class="tg">' +

      '<label class="rl">' +
        'What went well' +
        '<textarea id="rv-w" maxlength="2000" placeholder="Wins, progress, things that worked…">'+
          esc(r.well)+
        '</textarea>' +
      '</label>' +

      '<label class="rl">' +
        'What to change' +
        '<textarea id="rv-c" maxlength="2000" placeholder="One or two adjustments for next week…">'+
          esc(r.change)+
        '</textarea>' +
      '</label>' +

    '</div>' +

    '</div>' +

'<p class="sub review-autosave">💾 Your review is saved automatically.</p>' +

'<div class="review-history-controls">' +

    '<div class="review-history-controls">' +
      '<button id="reviewHistoryToggle" type="button" class="review-history-btn">' +
        '📚 View Review History' +
      '</button>' +
    '</div>' +

    '<div id="reviewHistory" class="review-history" hidden>' +

      '<h3>📚 Review History</h3>' +

      '<div class="review-filters">' +
        '<button type="button" class="review-filter active" data-filter="all">All Reviews</button>' +
        '<button type="button" class="review-filter" data-filter="current">Current Week</button>' +
        '<button type="button" class="review-filter" data-filter="past">Past Reviews</button>' +
      '</div>' +

      '<div id="reviewHistoryList"></div>' +

      '<button id="reviewHistoryClose" type="button" class="review-history-close">' +
        '▲ Hide Review History' +
      '</button>' +

    '</div>';
function autoSaveReview(){
  db.reviews=db.reviews||{};

  db.reviews[k]={
    well:$('#rv-w').value.trim().slice(0,2000),
    change:$('#rv-c').value.trim().slice(0,2000),
    t:Date.now()
  };

  save();

  const msg=document.querySelector('.review-autosave');

  if(msg){
    msg.textContent='💾 Saved automatically';
    clearTimeout(window.reviewSaveTimer);

    window.reviewSaveTimer=setTimeout(function(){
      msg.textContent='💾 Your review is saved automatically.';
    },1200);
  }
}

$('#rv-w').addEventListener('input',autoSaveReview);
$('#rv-c').addEventListener('input',autoSaveReview);

  function renderHistory(filter){

    const list=$('#reviewHistoryList');

    if(!list) return;

    const allDates=Object.keys(R).sort().reverse();

    let dates=allDates;

    if(filter==='current'){
      dates=allDates.filter(function(x){
        return x===k;
      });
    }

    if(filter==='past'){
      dates=allDates.filter(function(x){
        return x!==k;
      });
    }

    if(!dates.length){
      list.innerHTML='<p class="sub">No reviews found.</p>';
      return;
    }

    list.innerHTML=dates.map(function(x){

      return (
        '<div class="h1 review-history-item">' +

          '<strong>Week of '+fS(x)+' – '+fS(addD(x,6))+'</strong>' +

          '<div>👍 '+(esc(R[x].well)||'—')+'</div>' +

          '<div>🔧 '+(esc(R[x].change)||'—')+'</div>' +

          '<button type="button" class="dng review-delete" data-review="'+x+'">' +
            '🗑️ Delete' +
          '</button>' +

        '</div>'
      );

    }).join('');

    document.querySelectorAll('.review-delete').forEach(function(btn){

      btn.onclick=function(){

        const reviewDate=btn.dataset.review;

        ask(
          'Delete the weekly review for '+fS(reviewDate)+'?',
          'Delete',
          function(){

            delete db.reviews[reviewDate];

            if(save()){
              toast('🗑️ Weekly review deleted');
              renderReview();
            }

          }
        );

      };

    });

  }

  $('#reviewHistoryToggle').onclick=function(){

    $('#reviewHistory').hidden=false;
    $('#reviewHistoryToggle').hidden=true;

    renderHistory('all');

  };

  $('#reviewHistoryClose').onclick=function(){

    $('#reviewHistory').hidden=true;
    $('#reviewHistoryToggle').hidden=false;

  };

  document.querySelectorAll('.review-filter').forEach(function(btn){

    btn.onclick=function(){

      document.querySelectorAll('.review-filter')
        .forEach(function(b){
          b.classList.remove('active');
        });

      btn.classList.add('active');

      renderHistory(btn.dataset.filter);

    };

  });

}
/* init */
load();$('#tf').innerHTML=F('t');fillF('t',db.entries[TD()]);applySettings();render();
setInterval(()=>{if($('#today').textContent!==new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})){fillF('t',db.entries[TD()]);render()}},6e4);
initSync();
