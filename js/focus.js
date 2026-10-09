'use strict';
/* Catedra · Sesión de enfoque: el copiloto propone un método, el estudiante decide, y hay una consecuencia suave.
   Dos modos honestos:
   - "app": la actividad ocurre dentro de Catedra (video incrustado, apuntes, ejercicios a la vista). Salir de la app
     más de unos segundos se detecta y la semilla pierde un brote; con más de 2 salidas la sesión vale la mitad.
   - "fuera": libro, cuaderno o clase. No podemos vigilar el teléfono y no lo fingimos: se mide el tiempo y al terminar
     se confirma con 2 preguntas de recuerdo.
   La racha es semanal (minutos de enfoque contra una meta), con semanas "sostenidas" al 60 % que no la rompen. */
(function(root){
const pad = n=>String(n).padStart(2,'0');
function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function parse(s){ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
function mondayOf(s){ const d=parse(s); d.setDate(d.getDate()-((d.getDay()+6)%7)); return iso(d); }
function weekCredit(log, ws){ const we=addDays(ws,6); return (log||[]).filter(e=>e.d>=ws && e.d<=we).reduce((a,e)=>a+(e.credit||0),0); }
function stage(credit, goal){ const r = goal>0 ? credit/goal : 0; return r>=1?4 : r>=0.65?3 : r>=0.35?2 : r>=0.1?1 : 0; }
function credit(min, leaves, mode){ return (mode==='app' && leaves>2) ? Math.round(min*0.5) : min; }
/* Semanas seguidas que cumplieron la meta; una semana entre 60 % y 99 % sostiene la racha sin sumar.
   La semana en curso suma solo si ya cumplió, y nunca la rompe. */
function weekStreak(log, goal, today){
  if(!(goal>0)) return 0;
  const ws = mondayOf(today);
  let n = weekCredit(log, ws)>=goal ? 1 : 0, w = addDays(ws,-7);
  for(let i=0;i<104;i++){
    const c = weekCredit(log, w);
    if(c>=goal) n++; else if(c<goal*0.6) break;
    w = addDays(w,-7);
  }
  return n;
}
function ytId(u){ const m = String(u||'').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/); return m?m[1]:''; }

const FOCUS = {iso, addDays, mondayOf, weekCredit, stage, credit, weekStreak, ytId, GRACE_MS:10000};
root.FOCUS = FOCUS;
if(typeof module!=='undefined' && module.exports) module.exports = FOCUS;
})(typeof window!=='undefined' ? window : globalThis);

/* ── Interfaz (solo navegador) ── */
if(typeof document!=='undefined'){
  const ACTS = [
    {k:'leer', n:'Leer', d:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'},
    {k:'video', n:'Ver video', d:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>'},
    {k:'ejercicios', n:'Ejercicios', d:'<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>'},
    {k:'apuntes', n:'Apuntes', d:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5"/>'}
  ];
  const sv = (d,s)=>`<svg width="${s||22}" height="${s||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const EVTXT = {alta:'Evidencia alta', media:'Evidencia media', baja:'Evidencia baja'};
  let F = null, tick = null, wake = null;

  function goal(){ return S.focusGoal || 90; }
  function seedSVG(st, size){
    const parts = [
      '<circle cx="60" cy="92" r="5" fill="rgba(198,161,91,.55)" stroke="none"/>',
      '<path d="M60 96V72"/><path d="M60 80c-11 0-17-6-17-15 11 0 17 5 17 15z" fill="rgba(198,161,91,.22)"/>',
      '<path d="M60 76c0-11 7-17 17-18 0 11-6 17-17 18z" fill="rgba(198,161,91,.3)"/>',
      '<path d="M60 72V50"/><path d="M60 58c-9 0-14-5-14-12 9 0 14 4 14 12z" fill="rgba(198,161,91,.26)"/>',
      '<circle cx="60" cy="42" r="7" fill="#C6A15B" stroke="none"/><circle cx="51" cy="40" r="5" fill="rgba(198,161,91,.55)" stroke="none"/><circle cx="69" cy="40" r="5" fill="rgba(198,161,91,.55)" stroke="none"/><circle cx="60" cy="33" r="5" fill="rgba(198,161,91,.55)" stroke="none"/>'
    ];
    let body = st===0 ? parts[0] : parts.slice(1, st+1).join('');
    return `<svg class="seed-live" width="${size||120}" height="${size||120}" viewBox="0 0 120 120" fill="none" stroke="#C6A15B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="60" cy="98" rx="32" ry="4" fill="rgba(198,161,91,.08)" stroke="none"/><path d="M30 98h60" stroke-opacity=".35"/>${body}</svg>`;
  }
  function weekInfo(){
    const t = FOCUS.iso(new Date()), c = FOCUS.weekCredit(S.focusLog, FOCUS.mondayOf(t));
    return {c, g:goal(), st:FOCUS.stage(c,goal()), streak:FOCUS.weekStreak(S.focusLog, goal(), t)};
  }
  window.focusWeekInfo = weekInfo;
  window.focusSeedSVG = seedSVG;

  function subj(){ return S.subjects.find(s=>s.id===F.subjectId) || S.subjects[0] || null; }
  function recs(){
    const s = subj(); const d = s && s.examDate ? daysUntil(s.examDate) : null;
    return STRAT.recommend({actividad:F.act, diasExamen:d, minutos:F.mins, log:S.methodLog, area:(s&&typeof AREA!=='undefined')?AREA.of(s):null});
  }
  function root(){ return document.getElementById('focus-root'); }
  function show(){ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById('view-focus').classList.add('active'); document.getElementById('tabbar').style.display='none'; }

  window.openFocus = function(pre){
    pre = pre||{};
    if(S.focusRun){ F = S.focusRun; show(); renderRun(); startTick(); return; }
    const m = (typeof getMethodology==='function') ? getMethodology().duration : 25;
    const near = [15,25,35,50].reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a);
    const ps = S.subjects.find(s=>s.id===pre.subjectId) || S.subjects[0];
    const defAct = (ps&&typeof AREA!=='undefined') ? AREA.AREAS[AREA.of(ps)].actividad : 'leer';
    F = {step:'setup', act:pre.act||defAct, subjectId:pre.subjectId||(S.subjects[0]&&S.subjects[0].id)||'', unitId:'', mins:near, mode:'app', method:'', url:''};
    F.method = recs()[0].m.id;
    show(); renderSetup();
  };
  window.focusExit = function(){ stopTick(); releaseWake(); F=null; goTab('home'); };

  function renderSetup(){
    const w = weekInfo(), list = recs(), top = list.find(x=>x.m.id===F.method) || list[0], m = top.m;
    const s = subj(), units = s&&s.units ? s.units : [];
    const yt = F.act==='video' && FOCUS.ytId(F.url);
    root().innerHTML = `
      <div class="session-head" style="padding-top:10px;display:flex;align-items:center;justify-content:space-between;">
        <button class="session-close" onclick="focusExit()" aria-label="Volver">${sv('<path d="M15 18l-6-6 6-6"/>',20)}</button>
        <div class="eyebrow">Sesión de enfoque</div><span style="width:28px"></span></div>
      <div class="glass fade-in fx-week" onclick="focusCycleGoal()">
        ${seedSVG(w.st,64)}
        <div style="flex:1;"><b>${w.c} de ${w.g} min</b><small>esta semana${w.streak?` · ${w.streak} semana${w.streak===1?'':'s'} seguida${w.streak===1?'':'s'}`:''}</small><div class="progressbar" style="margin-top:8px;"><div style="width:${Math.min(100,Math.round(w.c/w.g*100))}%"></div></div></div>
      </div>
      <div class="section-title">¿Qué vas a hacer?</div>
      <div class="mat-tiles">${ACTS.map(a=>`<button class="mat-tile${F.act===a.k?' sel':''}" onclick="focusSet('act','${a.k}')"><span>${sv(a.d)}</span>${a.n}</button>`).join('')}</div>
      ${S.subjects.length>1?`<div class="chip-row" style="margin-top:12px;">${S.subjects.map(x=>`<button class="chip${x.id===F.subjectId?' selected':''}" onclick="focusSet('subjectId','${x.id}')">${esc(x.nombre)}</button>`).join('')}</div>`:''}
      ${units.length?`<select style="margin-top:10px;" onchange="focusSet('unitId',this.value)"><option value="">Toda la materia</option>${units.map(u=>`<option value="${u.id}"${u.id===F.unitId?' selected':''}>${esc(u.nombre)}</option>`).join('')}</select>`:''}
      ${F.act==='video'?`<div style="margin-top:12px;"><input type="url" placeholder="Pega el enlace del video (YouTube)" value="${esc(F.url)}" onchange="focusSet('url',this.value.trim())">
        <div style="display:flex;gap:8px;margin-top:8px;"><a class="btn btn-ghost btn-sm" style="flex:1;" target="_blank" rel="noopener" href="${STRAT.searchUrl((s?s.nombre+' ':'')+'explicación clase')}">Buscar un video</a></div>
        ${F.url&&!yt?'<div class="muted" style="font-size:11.5px;margin-top:6px;">Ese enlace no se puede ver dentro de la app: la sesión contará como «fuera de la app».</div>':''}</div>`:''}
      <div class="section-title">Te sugiero</div>
      <div class="glass fade-in copilot">
        <div style="display:flex;gap:12px;align-items:flex-start;"><span class="hab-ico">${sv('<path d="M5 19C5 10 10 5 20 4c0 10-5 15-13 15"/><path d="M5 19c3-5 6-8 10-10"/>',20)}</span>
        <div style="flex:1;min-width:0;"><div class="h1" style="font-size:18px;">${esc(m.nombre)}</div>
        <div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:4px;">${esc(m.que)}</div>
        <div class="chips" style="justify-content:flex-start;">${mkChip('book',EVTXT[m.ev.nivel])}${top.why.filter(x=>x!=='evidencia alta').slice(0,2).map(x=>mkChip('spark',x)).join('')}</div></div></div>
        <div style="display:flex;gap:8px;margin-top:12px;"><button class="btn btn-ghost btn-sm" style="flex:1;" onclick="focusMethods()">Ver otros métodos</button><a class="btn btn-ghost btn-sm" style="flex:1;" target="_blank" rel="noopener" href="${STRAT.searchUrl(m.buscar[0])}">Aprender cómo</a></div>
      </div>
      <div class="section-title">Cuánto tiempo</div>
      <div class="chip-row">${[15,25,35,50].map(n=>`<button class="chip${F.mins===n?' selected':''}" onclick="focusSet('mins',${n})">${n} min</button>`).join('')}</div>
      <div class="section-title">Dónde</div>
      <div class="mode-row">
        <button class="mode-opt${F.mode==='app'?' sel':''}" onclick="focusSet('mode','app')"><b>En la app</b><small>Si sales, la semilla pierde un brote</small></button>
        <button class="mode-opt${F.mode==='fuera'?' sel':''}" onclick="focusSet('mode','fuera')"><b>Fuera de la app</b><small>Libro, cuaderno o clase. Al terminar, 2 preguntas</small></button>
      </div>
      <button class="btn btn-primary btn-block" style="margin:20px 0 24px;min-height:54px;font-size:15px;" onclick="focusStart()">Empezar ${F.mins} min</button>`;
  }
  window.focusSet = function(k,v){
    F[k]=v;
    if(k==='act'){ F.method = recs()[0].m.id; if(v==='video' && !F.url) F.mode='app'; if(v==='leer'||v==='ejercicios') {} }
    if(k==='subjectId'){ F.unitId=''; F.method = recs()[0].m.id; }
    renderSetup();
  };
  window.focusCycleGoal = function(){ const g=[60,90,150,240], i=g.indexOf(goal()); S.focusGoal=g[(i+1)%g.length]; saveState(); showToast('Meta semanal: '+S.focusGoal+' min'); renderSetup(); };

  window.focusMethods = function(){
    const list = recs(), other = STRAT.CATALOG.filter(m=>!list.some(x=>x.m.id===m.id));
    const row = (m,why)=>`<div class="meth-row"><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">${esc(m.nombre)}</div>
      <div class="muted" style="font-size:12px;line-height:1.45;margin-top:2px;">${esc(m.que)}</div>
      <div class="muted" style="font-size:10.5px;margin-top:4px;font-style:italic;">${EVTXT[m.ev.nivel]} · ${esc(m.ev.fuente)}${why&&why.length?' · '+esc(why.join(', ')):''}</div></div>
      <button class="btn btn-ghost btn-sm" onclick="focusPick('${m.id}')">${F.method===m.id?'Elegido':'Usar'}</button></div>`;
    openSheet(`<div class="h1" style="font-size:19px;">Métodos para ${ACTS.find(a=>a.k===F.act).n.toLowerCase()}</div>
      <div class="muted" style="font-size:12px;">Ordenados por evidencia y por lo que a ti te ha funcionado. Tú eliges.</div>
      <div style="max-height:52vh;overflow-y:auto;">${list.map(x=>row(x.m,x.why)).join('')}
      ${other.length?`<details style="margin-top:10px;"><summary class="muted" style="font-size:12px;cursor:pointer;">Otros métodos (${other.length})</summary>${other.map(m=>row(m)).join('')}</details>`:''}
      <div class="section-title">Dónde aprender más</div>
      ${STRAT.FUENTES.map(f=>`<a class="meth-src" href="${f.url}" target="_blank" rel="noopener"><b>${esc(f.n)}</b><span>${esc(f.d)}</span></a>`).join('')}</div>`);
  };
  window.focusPick = function(id){ F.method=id; closeSheet(); renderSetup(); };

  /* ── Correr ── */
  async function getWake(){ try{ if(navigator.wakeLock && document.visibilityState==='visible') wake = await navigator.wakeLock.request('screen'); }catch(e){ wake=null; } }
  function releaseWake(){ try{ if(wake) wake.release(); }catch(e){} wake=null; }
  function startTick(){ stopTick(); tick = setInterval(()=>{ if(!F||F.step!=='run') return; if(Date.now()>=F.end) finish(); else updateClock(); }, 1000); getWake(); }
  function stopTick(){ clearInterval(tick); tick=null; }

  window.focusStart = function(){
    if(F.act==='video' && F.url && !FOCUS.ytId(F.url)) F.mode='fuera';
    F.step='run'; F.start=Date.now(); F.end=F.start+F.mins*60000; F.leaves=0; F.hiddenAt=0; F.paused=0; F.prevSt=weekInfo().st;
    S.focusRun = F; saveState();
    if(typeof track==='function') track('focus_start',{act:F.act, mode:F.mode, mins:F.mins, method:F.method});
    renderRun(); startTick();
  };
  function remaining(){ return Math.max(0, F.end-Date.now()); }
  function clock(ms){ const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+pad2(s%60); }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function liveStage(){ const done = 1-remaining()/(F.mins*60000); const st = Math.min(4, Math.floor(done*5)); return Math.max(0, st - Math.min(st, F.leaves)); }
  function renderRun(){
    const m = STRAT.BY_ID[F.method] || STRAT.CATALOG[0], id = F.act==='video' ? FOCUS.ytId(F.url) : '';
    root().innerHTML = `
      <div class="session-head" style="padding-top:10px;display:flex;align-items:center;justify-content:space-between;">
        <span style="width:28px"></span><div class="eyebrow">${F.mode==='app'?'En la app':'Fuera de la app'}</div><span style="width:28px"></span></div>
      ${id?`<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Video" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`:''}
      <div class="focus-stage fade-in"><div id="focus-seed">${seedSVG(liveStage(), id?96:150)}</div>
        <div class="focus-clock" id="focus-clock">${clock(remaining())}</div>
        <div class="chips">${mkChip('leaf',m.nombre)}${F.leaves?mkChip('flag',F.leaves+' salida'+(F.leaves===1?'':'s'),true):''}</div></div>
      <details class="glass" style="margin-top:16px;" ${id?'':'open'}><summary style="cursor:pointer;font-weight:600;font-size:13.5px;">Cómo hacerlo</summary>
        <ol class="steps">${m.pasos.map(p=>`<li>${esc(p)}</li>`).join('')}</ol></details>
      <div style="display:flex;gap:8px;margin:18px 0 24px;"><button class="btn btn-ghost" style="flex:1;" onclick="focusEndEarly()">Terminar ahora</button></div>`;
  }
  function updateClock(){
    const c=document.getElementById('focus-clock'); if(c) c.textContent=clock(remaining());
    const sd=document.getElementById('focus-seed'); const st=liveStage();
    if(sd && sd.dataset.st!==String(st)){ sd.dataset.st=String(st); sd.innerHTML=seedSVG(st, FOCUS.ytId(F.url)&&F.act==='video'?96:150); }
  }
  document.addEventListener('visibilitychange', ()=>{
    if(!F || F.step!=='run') return;
    if(document.visibilityState==='hidden'){ F.hiddenAt=Date.now(); saveState(); return; }
    getWake();
    const away = F.hiddenAt ? Date.now()-F.hiddenAt : 0; F.hiddenAt=0;
    if(Date.now()>=F.end){ finish(); return; }
    if(F.mode==='app' && away>FOCUS.GRACE_MS){
      F.leaves++; saveState(); renderRun();
      showToast(F.leaves>2?'Saliste otra vez: esta sesión valdrá la mitad':'Saliste '+Math.round(away/1000)+' s. La semilla perdió un brote');
    }
  });
  window.focusEndEarly = function(){ if(Date.now()-F.start<60000){ S.focusRun=null; saveState(); focusExit(); return; } finish(true); };

  /* ── Terminar: registrar, recordar y calificar el método ── */
  function finish(early){
    stopTick(); releaseWake();
    const min = Math.max(1, Math.round(Math.min(F.mins*60000, Date.now()-F.start)/60000));
    const cr = FOCUS.credit(min, F.leaves, F.mode);
    const e = {id:'f'+Date.now(), d:FOCUS.iso(new Date()), min, credit:cr, leaves:F.leaves, mode:F.mode, act:F.act, method:F.method, subjectId:F.subjectId, unitId:F.unitId, early:!!early};
    S.focusLog = S.focusLog||[]; S.focusLog.push(e); if(S.focusLog.length>600) S.focusLog=S.focusLog.slice(-600);
    S.focusRun = null;
    if(typeof updateStreak==='function') updateStreak();
    S.sessionLog.push({date:e.d, minutes:min, focus:true});
    saveState();
    if(typeof track==='function') track('focus_done',{min, credit:cr, leaves:F.leaves, mode:F.mode, act:F.act, method:F.method, early:!!early});
    const s = subj(); const pool = s ? s.items.filter(i=>!F.unitId || i.unitId===F.unitId) : [];
    F.step='done'; F.entry=e; F.qs = pool.slice().sort(()=>Math.random()-0.5).slice(0,2).map(it=>({it, shown:false, score:null}));
    renderDone();
  }
  function renderDone(){
    const e=F.entry, w=weekInfo(), half=e.credit<e.min;
    const v=(typeof VOICE!=='undefined'&&VOICE.afterFocus)?VOICE.afterFocus(e,F.prevSt==null?w.st:F.prevSt,w.st):{t:'Sesión hecha',s:'',grew:false};
    const first=!F.shownDone; F.shownDone=true;
    root().innerHTML = `
      <div class="focus-stage fade-in" style="margin-top:24px;"><div class="${v.grew&&first?'bloom':''}">${seedSVG(w.st,130)}</div>
        <div class="h1" style="font-size:24px;margin-top:6px;">${esc(v.t)}</div>
        <div style="margin-top:10px;width:100%;max-width:340px;">${typeof TUTOR!=='undefined'?TUTOR.say([v.s]):esc(v.s)}</div>
        <div class="chips">${mkChip('clock',e.credit+' min'+(half?' (de '+e.min+')':''))}${mkChip('leaf',w.c+' de '+w.g+' esta semana')}</div></div>
      ${F.qs.length?`<div class="section-title">Comprueba lo que te quedó</div>${F.qs.map((q,i)=>`<div class="glass" style="margin-top:8px;">
        <div class="q" style="font-family:'Fraunces',serif;font-size:15px;line-height:1.4;">${esc(q.it.pregunta)}</div>
        ${q.shown?`<div class="muted" style="font-size:13px;margin-top:8px;line-height:1.5;">${esc(q.it.respuesta)}</div>
          ${q.score==null?`<div style="display:flex;gap:6px;margin-top:10px;">${[['No',0],['A medias',50],['Sí',100]].map(([l,v])=>`<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="focusGrade(${i},${v})">${l}</button>`).join('')}</div>`:`<div class="muted" style="font-size:12px;margin-top:8px;">Anotado</div>`}`
        :`<button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="focusReveal(${i})">Pensé mi respuesta · ver</button>`}</div>`).join('')}`:''}
      <div class="section-title">¿Te sirvió «${esc((STRAT.BY_ID[e.method]||{}).nombre||'')}»?</div>
      <div class="sv-faces">${[['Sí',3,0],['Más o menos',2,1],['No',1,2]].map(([l,v,f])=>`<button class="sv-face f${f}${e.rating===v?' sel':''}" onclick="focusRate(${v})">${(typeof FACE_SVG!=='undefined'?FACE_SVG[f]:'')}<span>${l}</span></button>`).join('')}</div>
      ${typeof nextStepHTML==='function'?nextStepHTML(['enfoque']):''}
      <button class="btn btn-ghost btn-block" style="margin:14px 0 24px;" onclick="focusExit()">Volver a Hoy</button>`;
  }
  window.focusReveal = function(i){ F.qs[i].shown=true; renderDone(); };
  window.focusGrade = function(i,v){
    const q=F.qs[i]; q.score=v;
    if(typeof HAB!=='undefined') HAB.log(S,{id:q.it.id, s:v, c:0, t:q.it.tipo||'recuperacion'});
    saveState(); renderDone();
  };
  window.focusRate = function(v){
    const e=F.entry; e.rating=v;
    S.methodLog = S.methodLog||[]; S.methodLog = S.methodLog.filter(x=>x.fid!==e.id);
    S.methodLog.push({fid:e.id, d:e.d, method:e.method, act:e.act, rating:v, min:e.min});
    if(S.methodLog.length>400) S.methodLog=S.methodLog.slice(-400);
    saveState(); if(typeof track==='function') track('method_rated',{method:e.method, act:e.act, rating:v});
    renderDone();
  };

  /* Retomar una sesión que quedó abierta (la app se cerró o se recargó) */
  window.focusResume = function(){
    if(!S.focusRun) return;
    F = S.focusRun;
    if(Date.now()>=F.end){ show(); finish(); return; }
    show(); renderRun(); startTick();
  };
}
