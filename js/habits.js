'use strict';
/* Catedra · Motor de hábitos: señal -> hipótesis -> prueba -> veredicto -> migrar.
   Un catálogo de hábitos con nivel de evidencia y fuente; reglas explícitas (sin IA) eligen UNA hipótesis,
   se prueba unos días contra una línea base medida en los datos reales y, si no mejora, se propone otra.
   No es un diagnóstico clínico. Las reglas son hipótesis nuestras pendientes de revisión humana (ver docs/product/habitos-catalogo.md). */
(function(root){
const DAY = 864e5;
const pad = n=>String(n).padStart(2,'0');
function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function parse(s){ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
function diffDays(a,b){ return Math.round((parse(b)-parse(a))/DAY); }
const mean = a=>a.reduce((x,y)=>x+y,0)/a.length;
const PM = {1:0.2,2:0.5,3:0.85};
const WIN = {manana:[6,11],tarde:[13,18],noche:[18,23],madrugada:[3,7]};
const PICO_TXT = {manana:'7–10 h',tarde:'14–17 h',noche:'19–22 h',madrugada:'5–7 h'};
const EVW = {alta:1, media:0.8, baja:0.55};
const MIN_SCORE = 0.3;

/* ── Registro de eventos de práctica (insumo de todas las métricas) ── */
function log(st, e){
  st.evlog = st.evlog || [];
  const n = new Date();
  st.evlog.push({d:iso(n), h:n.getHours(), id:e.id, s:e.s, c:e.c||0, t:e.t||'recuperacion'});
  if(st.evlog.length>800) st.evlog = st.evlog.slice(-800);
}

/* ── Métricas: cada una devuelve {v,n} sobre la ventana [from,to] ── */
function evs(st,from,to){ return (st.evlog||[]).filter(e=>e.d>=from && e.d<=to); }
const M = {
  acc(st,from,to){ const a=evs(st,from,to); return {v:a.length?mean(a.map(e=>e.s))/100:0, n:a.length}; },
  delayed(st,from,to){
    const all=st.evlog||[], out=[], last={};
    all.forEach(e=>{ const p=last[e.id]; if(p && e.d>=from && e.d<=to && diffDays(p,e.d)>=5) out.push(e.s); last[e.id]=e.d; });
    return {v:out.length?mean(out)/100:0, n:out.length};
  },
  calib(st,from,to){
    const a=evs(st,from,to).filter(e=>e.c>0);
    return {v:a.length?mean(a.map(e=>Math.abs(PM[e.c]-e.s/100))):0, n:a.length};
  },
  days(st,from,to){
    const a=evs(st,from,to), set=new Set(a.map(e=>e.d)), span=Math.max(1,diffDays(from,to)+1);
    return {v:set.size/span*7, n:a.length};
  },
  tipo(st,from,to,tipos){
    const a=evs(st,from,to).filter(e=>tipos.includes(e.t));
    return {v:a.length?mean(a.map(e=>e.s))/100:0, n:a.length};
  },
  inwin(st,from,to){
    const w=WIN[st.profile&&st.profile.picoProductividad]; const a=evs(st,from,to);
    if(!w) return {v:0,n:0};
    return {v:a.length?a.filter(e=>e.h>=w[0]&&e.h<w[1]).length/a.length:0, n:a.length};
  },
  sim(st,from,to){
    const a=(st.simLog||[]).filter(x=>x.date>=from && x.date<=to);
    return {v:a.length?mean(a.map(x=>x.avg))/100:0, n:a.length};
  }
};
// dir: +1 sube = mejora; -1 baja = mejora. thr: cambio mínimo; meta: objetivo absoluto si no hubo línea base
const METRIC = {
  acc:{dir:1,thr:0.08,meta:0.7,minN:6,txt:'acierto'},
  delayed:{dir:1,thr:0.08,meta:0.7,minN:4,txt:'recuerdo tras 5+ días'},
  calib:{dir:-1,thr:0.07,meta:0.25,minN:6,txt:'brecha confianza-acierto (menos es mejor)'},
  days:{dir:1,thr:1,meta:3,minN:3,txt:'días por semana'},
  tipo:{dir:1,thr:0.1,meta:0.7,minN:4,txt:'acierto en este tipo de pregunta'},
  inwin:{dir:1,thr:0.15,meta:0.6,minN:6,txt:'práctica en tu mejor hora'},
  sim:{dir:1,thr:0.08,meta:0.7,minN:1,txt:'nota de simulacro'}
};
function measure(st,k,from,to,opt){ return M[k](st,from,to,opt); }

/* ── Señales ── */
function dom(st,k){ const d=st.diag&&st.diag.dom&&st.diag.dom[k]; return d && d.n>0 ? d.est : null; }
const pct = v=>Math.round(v*100);
function base14(st,today){ return [addDays(today,-14), addDays(today,-1)]; }
function obs(st,today,k,opt){ const r=base14(st,today); return M[k](st,r[0],r[1],opt); }
function hasPico(st){ return !!(st.profile&&WIN[st.profile.picoProductividad]); }

const CATALOG = [
  { id:'autoprueba', nombre:'Pruébate antes de releer', accion:'Antes de repasar un tema, respóndelo sin mirar los apuntes. Después revisa.',
    ev:{nivel:'alta', fuente:'Roediger & Karpicke (2006); Dunlosky et al. (2013)'}, metric:{k:'delayed'}, dias:10,
    signal(st,t){
      const o=obs(st,t,'delayed'); if(o.n>=4 && o.v<0.6) return {w:0.8, why:'Recuerdas ~'+pct(o.v)+' % de lo que repasaste hace más de 5 días.'};
      const p=dom(st,'PRO'); if(p!==null && p<=45) return {src:'decl', w:0.75, why:'Dijiste que repasas releyendo o leyendo una sola vez.'};
      return null; } },
  { id:'predice', nombre:'Predice antes de ver', accion:'Antes de ver cada respuesta, marca con sinceridad qué tan seguro estás.',
    ev:{nivel:'media', fuente:'Roediger & Karpicke (2006): releer sube la confianza, no el recuerdo'}, metric:{k:'calib'}, dias:7,
    signal(st,t){
      const o=obs(st,t,'calib'); if(o.n>=6 && o.v>=0.3) return {w:0.8, why:'Tu confianza y tu acierto difieren ~'+pct(o.v)+' puntos.'};
      const a=dom(st,'AUT'); if(a!==null && a<=45) return {src:'decl', w:0.55, why:'Dijiste que no sabes bien si aprendiste.'};
      return null; } },
  { id:'repartir', nombre:'Menos horas, más días', accion:'Estudia 15 minutos en 3 o 4 días distintos esta semana.',
    ev:{nivel:'alta', fuente:'Cepeda et al. (2006); Dunlosky et al. (2013)'}, metric:{k:'days'}, dias:7,
    signal(st,t){
      const o=obs(st,t,'days'); if(o.n>=6 && o.v<2.5) return {w:0.7, why:'Practicas ~'+o.v.toFixed(1)+' días por semana.'};
      const x=dom(st,'TIE'); if(x!==null && x<=40) return {src:'decl', w:0.5, why:'Dijiste que estudias muy cerca del examen.'};
      return null; } },
  { id:'si_entonces', nombre:'Decide cuándo empiezas', accion:'Elige hoy una hora y un lugar: «Si es [hora], abro Catedra 10 minutos».',
    ev:{nivel:'alta', fuente:'Gollwitzer & Sheeran (2006), d≈0.65 en metas diversas, no solo estudio'}, metric:{k:'days'}, dias:7,
    signal(st,t){
      const x=dom(st,'TIE'); if(x!==null && x<=45) return {src:'decl', w:0.6, why:'Dijiste que te cuesta empezar a tiempo.'};
      return null; } },
  { id:'hora_fija', nombre:'Usa tu mejor hora', accion:'Practica en tu franja fuerte: {pico}.',
    ev:{nivel:'media', fuente:'Lally et al. (2010): los hábitos se forman repitiendo en el mismo contexto'}, metric:{k:'inwin'}, dias:7,
    signal(st,t){
      if(!hasPico(st)) return null; const o=obs(st,t,'inwin');
      if(o.n>=8 && o.v<0.4) return {w:0.55, why:'Solo el '+pct(o.v)+' % de tu práctica cae en tu mejor hora.'};
      return null; } },
  { id:'explicar', nombre:'Explícalo con tus palabras', accion:'Antes de ver una respuesta de explicar o comparar, dila en voz alta o escríbela.',
    ev:{nivel:'media', fuente:'Dunlosky et al. (2013): autoexplicación, utilidad moderada'}, metric:{k:'tipo',opt:['explicacion','comparacion','error']}, dias:10,
    signal(st,t){
      const a=obs(st,t,'tipo',['explicacion','comparacion','error']), r=obs(st,t,'tipo',['recuperacion']);
      if(a.n>=3 && r.n>=3 && a.v<r.v-0.2) return {w:0.7, why:'Aciertas '+pct(r.v)+' % al recordar pero '+pct(a.v)+' % al explicar o comparar.'};
      return null; } },
  { id:'aplicar', nombre:'Úsalo en la vida real', accion:'Haz una situación de Aplica cada día que estudies.',
    ev:{nivel:'media', fuente:'Agarwal (2019); Butler (2010)'}, metric:{k:'tipo',opt:['aplicacion']}, dias:10,
    signal(st,t){
      const a=obs(st,t,'tipo',['aplicacion']), r=obs(st,t,'tipo',['recuperacion']);
      if(a.n>=3 && r.n>=3 && a.v<r.v-0.2) return {w:0.75, why:'Aciertas '+pct(r.v)+' % al recordar pero '+pct(a.v)+' % al aplicar.'};
      const tot=evs(st,addDays(t,-14),t).length;
      if(a.n===0 && tot>=10) return {w:0.4, why:'Aún no practicas aplicar lo que sabes.'};
      return null; } },
  { id:'simulacro', nombre:'Un simulacro con tiempo', accion:'Haz un simulacro esta semana, con cronómetro y sin apuntes.',
    ev:{nivel:'media', fuente:'Roediger & Karpicke (2006): practicar con pruebas; vínculo con ansiedad sin verificar'}, metric:{k:'sim'}, dias:7,
    signal(st,t){
      const near=(st.subjects||[]).map(s=>({s,d:s.examDate?diffDays(t,s.examDate):null})).filter(x=>x.d!==null&&x.d>=0&&x.d<=30).sort((a,b)=>a.d-b.d)[0];
      if(!near) return null;
      const recent=(st.simLog||[]).some(x=>diffDays(x.date,t)<=7); if(recent) return null;
      const anx=dom(st,'ANS'), exa=dom(st,'EXA'), extra=((anx!==null&&anx<=45)||(exa!==null&&exa<=45))?0.15:0;
      return {w:0.65+extra, why:'Tu examen de '+near.s.nombre+' es en '+near.d+' día'+(near.d===1?'':'s')+' y no hiciste simulacro esta semana.'}; } },
  { id:'celular', nombre:'Celular en otra habitación', accion:'Mientras practicas, deja el celular fuera de tu vista.',
    ev:{nivel:'baja', fuente:'Ward et al. (2017): un estudio; las réplicas dan resultados mixtos'}, self:'¿Te distrajiste menos?', dias:7,
    signal(st){ const c=dom(st,'CON'); if(c!==null && c<=40) return {src:'decl', w:0.6, why:'Dijiste que revisas el celular mientras estudias.'}; return null; } },
  { id:'dormir', nombre:'Duerme antes de repasar más', accion:'Esta semana, duerme 7 horas o más antes de cada día de estudio.',
    ev:{nivel:'baja', fuente:'Sin verificar todavía'}, self:'¿Dormiste 7 h o más la mayoría de noches?', dias:7,
    signal(st){ const s=dom(st,'SUE'); if(s!==null && s<=40) return {src:'decl', w:0.6, why:'Dijiste que duermes poco en días de estudio.'}; return null; } }
];
function byId(id){ return CATALOG.find(h=>h.id===id); }
function accionTxt(st,H){ return H.accion.replace('{pico}', PICO_TXT[st.profile&&st.profile.picoProductividad]||'la que mejor te va'); }

/* ── Hipótesis ── */
function ensure(st){ st.habit = st.habit || {active:null, history:[]}; st.habit.history = st.habit.history||[]; return st.habit; }
function excluded(st,id,today){
  return ensure(st).history.some(h=>h.id===id && diffDays(h.end,today) < (h.verdict==='mejoro'?28:h.verdict==='omitido'?14:21));
}
function hypothesize(st,today){
  const out=[];
  CATALOG.forEach(H=>{
    if(excluded(st,H.id,today)) return;
    const s=H.signal(st,today); if(!s) return;
    const score=s.w*EVW[H.ev.nivel]*(s.src==='decl'?0.8:1); /* lo observado pesa más que lo declarado */
    if(score>=MIN_SCORE) out.push({H,why:s.why,score});
  });
  out.sort((a,b)=>b.score-a.score);
  if(out.length) return {habit:out[0].H, why:out[0].why, score:out[0].score, alt:out.length-1};
  const declared=Object.keys((st.diag&&st.diag.dom)||{}).some(k=>dom(st,k)!==null);
  if(!declared && (st.evlog||[]).length<8) return {need:'preguntas'};
  return null;
}

/* ── Prueba ── */
function start(st,id,why,today){
  const H=byId(id), h=ensure(st); if(!H) return null;
  let base=null;
  if(H.metric){ const r=base14(st,today), m=M[H.metric.k](st,r[0],r[1],H.metric.opt); if(m.n>=METRIC[H.metric.k].minN) base={v:m.v,n:m.n}; }
  h.active={id, start:today, dias:H.dias, why, base, extended:false};
  return h.active;
}
function evaluate(st,a,today){
  const H=byId(a.id);
  if(H.self) return {kind:'self', question:H.self};
  const k=H.metric.k, cfg=METRIC[k], m=M[k](st,a.start,today,H.metric.opt);
  if(m.n<cfg.minN) return {kind:'data', verdict:'sin_datos', n:m.n, need:cfg.minN, canExtend:!a.extended};
  let verdict, delta=null;
  if(a.base){
    delta=(m.v-a.base.v)*cfg.dir;
    verdict = delta>=cfg.thr?'mejoro' : delta<=-cfg.thr?'empeoro' : 'igual';
  } else {
    const ok = cfg.dir>0 ? m.v>=cfg.meta : m.v<=cfg.meta;
    verdict = ok?'mejoro':'igual';
  }
  return {kind:'data', verdict, before:a.base?a.base.v:null, after:m.v, delta, metric:k, n:m.n};
}
function status(st,today){
  const h=ensure(st);
  if(!h.active){ const hy=hypothesize(st,today); return hy ? (hy.need?{phase:'need'}:{phase:'propose',hy}) : {phase:'none'}; }
  const a=h.active, H=byId(a.id); if(!H){ h.active=null; return {phase:'none'}; }
  const elapsed=diffDays(a.start,today);
  if(elapsed < a.dias) return {phase:'running',a,H,day:elapsed+1};
  return {phase:'verdict',a,H,res:evaluate(st,a,today)};
}
function finish(st,today,selfAns){
  const h=ensure(st), a=h.active; if(!a) return null;
  const H=byId(a.id), res=evaluate(st,a,today);
  let verdict;
  if(res.kind==='self') verdict = selfAns==='si'?'mejoro':'igual';
  else if(res.verdict==='sin_datos' && res.canExtend){ a.extended=true; a.dias+=5; return {extended:true}; }
  else verdict=res.verdict;
  const rec={id:a.id, start:a.start, end:today, verdict, before:res.before==null?null:res.before, after:res.after==null?null:res.after, metric:res.metric||null};
  h.history.push(rec); if(h.history.length>40) h.history=h.history.slice(-40);
  h.active=null;
  return rec;
}
function skip(st,today){
  const h=ensure(st), hy=hypothesize(st,today); if(!hy||!hy.habit) return;
  h.history.push({id:hy.habit.id, start:today, end:today, verdict:'omitido'});
}

const HAB = {CATALOG, METRIC, log, measure, hypothesize, start, status, finish, skip, evaluate, byId, accionTxt, iso, addDays, diffDays, ensure};
root.HAB = HAB;
if(typeof module!=='undefined' && module.exports) module.exports = HAB;
})(typeof window!=='undefined' ? window : globalThis);

/* ── Interfaz (solo navegador) ── */
if(typeof document!=='undefined'){
  const hToday = ()=>HAB.iso(new Date());
  const VERDICT_TXT = {mejoro:'Funcionó', igual:'Sin cambio claro', empeoro:'No ayudó', sin_datos:'Faltan datos'};
  function fmt(k,v){ if(v==null) return '—'; return (k==='days') ? v.toFixed(1)+' d/sem' : Math.round(v*100)+' %'; }
  function evBadge(H){ return {alta:'Evidencia alta', media:'Evidencia media', baja:'Evidencia baja'}[H.ev.nivel]; }
  function why(H, w){
    return `<details style="margin-top:10px;"><summary class="muted" style="font-size:11.5px;cursor:pointer;">Por qué esto</summary>
      <div class="muted" style="font-size:12px;line-height:1.5;margin-top:6px;">${esc(w)}<br>${evBadge(H)} · ${esc(H.ev.fuente)}</div></details>`;
  }
  function shell(inner){ return `<div class="glass fade-in" style="margin-top:12px;border-left:3px solid var(--brass);padding:14px 16px;">${inner}</div>`; }

  window.renderHabitCard = function(){
    const slot=document.getElementById('home-habit-slot'); if(!slot) return false;
    slot.innerHTML='';
    if(!S.onboarded || !(S.sessionLog.length>=1 || (S.evlog||[]).length>=3)) return false;
    const st=HAB.status(S,hToday());
    if(st.phase==='none') return false;
    if(st.phase==='need'){
      slot.innerHTML=shell(`<div class="eyebrow">Tu primer hábito</div>
        <div style="font-family:'Fraunces',serif;font-size:19px;margin-top:4px;">4 preguntas para elegirlo</div>
        <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="startDiagnostic({mode:'control',domains:['PRO','TIE','AUT','CON'],onFinish:()=>goTab('home')})">Responder · 1 min</button>`);
      return true;
    }
    if(st.phase==='propose'){
      const H=st.hy.habit;
      slot.innerHTML=shell(`<div class="eyebrow">Hipótesis para ti</div>
        <div style="font-family:'Fraunces',serif;font-size:20px;margin-top:4px;">${esc(H.nombre)}</div>
        <div class="muted" style="font-size:13px;line-height:1.5;margin-top:6px;">${esc(HAB.accionTxt(S,H))}</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          ${st.hy.alt>0?'<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="habitSkip()">Otra idea</button>':''}
          <button class="btn btn-primary btn-sm" style="flex:2;" onclick="habitStart(\''+H.id+'\')">Probar ${H.dias} días</button></div>
        ${why(H, st.hy.why)}`);
      return true;
    }
    if(st.phase==='running'){
      const a=st.a, H=st.H, p=Math.min(100,Math.round(st.day/a.dias*100));
      slot.innerHTML=shell(`<div class="eyebrow">Tu hábito · día ${Math.min(st.day,a.dias)} de ${a.dias}</div>
        <div style="font-family:'Fraunces',serif;font-size:20px;margin-top:4px;">${esc(H.nombre)}</div>
        <div class="muted" style="font-size:13px;line-height:1.5;margin-top:6px;">${esc(HAB.accionTxt(S,H))}</div>
        <div class="progressbar" style="margin-top:12px;"><div style="width:${p}%"></div></div>
        ${why(H, a.why)}`);
      return true;
    }
    // veredicto
    const a=st.a, H=st.H, r=st.res;
    if(r.kind==='self'){
      slot.innerHTML=shell(`<div class="eyebrow">Resultado de la prueba</div>
        <div style="font-family:'Fraunces',serif;font-size:19px;margin-top:4px;">${esc(r.question)}</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="habitFinish('no')">No</button>
          <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="habitFinish('medias')">A medias</button>
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="habitFinish('si')">Sí</button></div>`);
      return true;
    }
    if(r.verdict==='sin_datos'){
      slot.innerHTML=shell(`<div class="eyebrow">Resultado de la prueba</div>
        <div style="font-family:'Fraunces',serif;font-size:19px;margin-top:4px;">Aún faltan datos</div>
        <div class="muted" style="font-size:13px;margin-top:6px;">Practicaste poco para medirlo. ${r.canExtend?'Damos 5 días más.':'Probemos otra idea.'}</div>
        <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="habitFinish()">${r.canExtend?'Seguir':'Continuar'}</button>`);
      return true;
    }
    const k=r.metric, cfg=HAB.METRIC[k], better=r.verdict==='mejoro';
    slot.innerHTML=shell(`<div class="eyebrow">Resultado de la prueba</div>
      <div style="font-family:'Fraunces',serif;font-size:20px;margin-top:4px;">${VERDICT_TXT[r.verdict]}</div>
      <div style="display:flex;align-items:baseline;gap:10px;margin-top:8px;"><span class="muted" style="font-size:15px;">${fmt(k,r.before)}</span><span>→</span><span style="font-family:'Fraunces',serif;font-size:22px;color:${better?'var(--sage)':'var(--parchment)'};">${fmt(k,r.after)}</span></div>
      <div class="muted" style="font-size:11.5px;margin-top:4px;">${esc(cfg.txt)}${r.before==null?' · sin medición previa':''}</div>
      <div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:8px;">${better?'Lo mantenemos y buscamos el siguiente.':'No lo forzamos: probamos otra idea.'}</div>
      <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="habitFinish()">Siguiente</button>`);
    return true;
  };
  window.habitStart = function(id){
    const st=HAB.status(S,hToday()); if(st.phase!=='propose') return;
    HAB.start(S,id,st.hy.why,hToday()); saveState();
    if(typeof track==='function') track('habit_started',{id}); renderHabitCard();
  };
  window.habitSkip = function(){ HAB.skip(S,hToday()); saveState(); if(typeof track==='function') track('habit_skipped'); renderHabitCard(); };
  window.habitFinish = function(selfAns){
    const rec=HAB.finish(S,hToday(),selfAns); saveState();
    if(rec && rec.verdict && typeof track==='function') track('habit_verdict',{id:rec.id,verdict:rec.verdict});
    renderHabitCard();
    if(rec && rec.verdict && rec.verdict!=='sin_datos' && typeof surveyAsk==='function') setTimeout(()=>surveyAsk('habito_util'), 600);
  };
}
