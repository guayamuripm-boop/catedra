/* Catedra · Preguntas de validación del piloto.
   Una pregunta a la vez, un toque para responder, nunca texto libre. Cada respuesta se guarda en el teléfono (S.survey)
   y, si el estudiante acepta la medición anónima, se envía como evento `survey` (k = pregunta, v = respuesta).
   Métricas objetivo y cómo leerlas: docs/product/piloto-guion.md */

const SV_YN = [['si','Sí'],['algo','Más o menos'],['no','No']];
const SURVEYS = {
  // — Dentro del flujo (en línea, tras la acción) —
  sesion_util:   {q:'¿Te ayudó esta sesión?', o:[['si','Sí, mucho'],['algo','Más o menos'],['no','No mucho']]},
  perfil_valido: {q:'¿Este perfil describe cómo estudias?', o:[['si','Sí'],['algo','En parte'],['no','No']]},
  aplica_real:   {q:'¿La situación se parece a tu vida?', o:SV_YN},
  aplica_propia: {q:'¿Pensar tu propia situación te sirvió?', o:SV_YN},
  recuerda_util: {q:'¿Te sirvió escribir lo que recuerdas?', o:SV_YN},
  ia_calidad:    {q:'¿Las preguntas reflejan tu material?', o:[['si','Sí'],['algunas','Algunas'],['no','No']]},
  habito_util:   {q:'¿Este hábito te pareció útil?', o:SV_YN},
  // — Programadas (una por día, tras varios días de uso) —
  sean:       {q:'Si dejaras de usar Catedra, ¿cómo te sentirías?', o:[['muy','Muy decepcionado'],['algo','Algo decepcionado'],['nada','Nada decepcionado'],['no_uso','No la usaría']]},
  beneficio:  {q:'¿Qué es lo que más te sirve?', o:[['plan','Mi plan de hoy'],['preguntas','Preguntas de mi material'],['habitos','Los hábitos'],['aplica','Situaciones de la vida real'],['nada','Nada todavía']]},
  freno:      {q:'¿Qué te frena más para usarla?', o:[['tiempo','Poco tiempo'],['preguntas','Las preguntas no me sirven'],['confusa','Me confunde'],['olvido','Se me olvida abrirla'],['nada','Nada']]},
  recomienda: {q:'¿Se la recomendarías a un compañero?', o:[['si','Sí, seguro'],['tal','Tal vez'],['no','No']]},
  metodo_claro:{q:'¿Entiendes qué método te conviene y por qué?', o:[['si','Sí'],['algo','Más o menos'],['no','No']]},
  mejor:      {q:'Comparado con antes de usar Catedra, ¿cómo estudias?', o:[['mejor','Mejor'],['igual','Igual'],['peor','Peor']]},
  // Escala 1 a 5 (se pregunta al inicio y otra vez a los 10 días: es la diferencia que importa)
  confianza_ini:{q:'¿Qué tan preparado te sientes para tu próximo examen?', scale:5},
  confianza_fin:{q:'¿Qué tan preparado te sientes para tu próximo examen?', scale:5}
};
const SV_SCHEDULE = [ // [clave, días mínimos de uso, sesiones mínimas]; en orden, sin saltar
  ['confianza_ini',0,1], ['sean',3,3], ['metodo_claro',4,3], ['beneficio',4,4], ['freno',5,4],
  ['mejor',7,5], ['recomienda',7,5], ['confianza_fin',10,8]
];
// Preguntas de tres niveles: se responden con caritas (bueno, medio, malo)
const SV_FACE = {si:0,mucho:0,muy:0,mejor:0,seguro:0, algo:1,algunas:1,tal:1,igual:1, no:2,peor:2,nada:2};
const FACE_SVG = [
  '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="17" cy="17" r="13"/><path d="M11 20c2 3 10 3 12 0"/><circle cx="12.5" cy="14" r=".8" fill="currentColor"/><circle cx="21.5" cy="14" r=".8" fill="currentColor"/></svg>',
  '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="17" cy="17" r="13"/><path d="M12 22h10"/><circle cx="12.5" cy="14" r=".8" fill="currentColor"/><circle cx="21.5" cy="14" r=".8" fill="currentColor"/></svg>',
  '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="17" cy="17" r="13"/><path d="M11 24c2-3 10-3 12 0"/><circle cx="12.5" cy="14" r=".8" fill="currentColor"/><circle cx="21.5" cy="14" r=".8" fill="currentColor"/></svg>'
];
function svIsFaces(sv){ return !sv.scale && sv.o.length===3 && sv.o.every(([v])=>v in SV_FACE); }
// Controles visuales de respuesta (caritas, escala de 1 a 5 o botones); cada uno llama a `cb(k,v)`
function svControls(k, cb){
  const sv = SURVEYS[k];
  if(sv.scale){
    return `<div class="sv-scale">${[1,2,3,4,5].map(n=>`<button class="sv-dot" style="--f:${n/5}" aria-label="${n} de 5" onclick="${cb}('${k}','${n}')"><i></i></button>`).join('')}</div><div class="sv-ends"><span>Nada</span><span>Totalmente</span></div>`;
  }
  if(svIsFaces(sv)){
    return `<div class="sv-faces">${sv.o.map(([v,l])=>`<button class="sv-face f${SV_FACE[v]}" onclick="${cb}('${k}','${v}')">${FACE_SVG[SV_FACE[v]]}<span>${l}</span></button>`).join('')}</div>`;
  }
  return sv.o.map(([v,l])=>`<button class="btn btn-ghost btn-block" style="border-radius:22px 14px 22px 14px;" onclick="${cb}('${k}','${v}')">${l}</button>`).join('');
}

function svState(){
  if(!S.survey) S.survey = {log:[], shown:{d:'', n:0}};
  return S.survey;
}
function svDaysUsed(){
  const f = S.settings && S.settings.firstSeen; if(!f) return 0;
  return Math.max(0, Math.round((parseDay(todayStr()) - parseDay(f))/864e5));
}

// Guarda la respuesta y avisa a la medición anónima
function surveyAnswer(k, v){
  const st = svState();
  st.log.push({k, v, d:todayStr()});
  if(st.log.length>200) st.log = st.log.slice(-200);
  saveState();
  if(typeof track==='function') track('survey', {k, v, sessions:S.sessionLog.length, days:svDaysUsed()});
}

// En línea: dentro de una pantalla. Devuelve HTML; al tocar, se agradece y se oculta.
function surveyInline(k, id, max){
  const sv = SURVEYS[k]; if(!sv) return '';
  const mine = svState().log.filter(x=>x.k===k);
  if(mine.some(x=>x.d===todayStr()) || (max && mine.length>=max)) return ''; // sin insistir: una vez al día y con tope
  const hid = 'sv-'+(id||k);
  return `<div class="sv-inline" id="${hid}" style="margin-top:16px;" data-hid="${hid}"><div class="muted" style="font-size:12.5px;margin-bottom:10px;text-align:center;">${sv.q}</div>${svControls(k,'surveyInlinePick')}</div>`;
}
function surveyInlinePick(k, v){
  surveyAnswer(k, v);
  document.querySelectorAll('.sv-inline').forEach(el=>{ if(el.innerHTML.includes("'"+k+"'")) el.innerHTML = '<div class="muted" style="font-size:12px;text-align:center;">Gracias, eso nos ayuda a mejorar</div>'; });
}

// En hoja inferior: una pregunta, respuesta de un toque
function surveyAsk(k){
  const sv = SURVEYS[k]; if(!sv || typeof openSheet!=='function') return;
  const st = svState();
  st.shown = (st.shown.d===todayStr()) ? st.shown : {d:todayStr(), n:0};
  st.shown.n++; saveState();
  openSheet(`<div class="eyebrow" style="text-align:center;">Una pregunta rápida</div>
    <div class="h1" style="font-size:20px;line-height:1.3;text-align:center;">${sv.q}</div>
    ${svControls(k,'surveySheetPick')}
    <button class="ob-back" id="sv-skip">Ahora no</button>`);
  document.getElementById('sv-skip').onclick = ()=>{ surveyAnswer(k, 'omitida'); closeSheet(); };
}
function surveySheetPick(k, v){ surveyAnswer(k, v); closeSheet(); showToast('Gracias'); }

// Programadas: como máximo una al día, nunca durante una sesión, solo en Hoy
function surveyMaybeScheduled(){
  if(!S.onboarded || !S.consent || !S.consent.terms) return;
  const home = document.getElementById('view-home');
  if(!home || !home.classList.contains('active') || document.getElementById('sheet')) return;
  const st = svState();
  if(st.shown.d===todayStr() && st.shown.n>=1) return;
  const days = svDaysUsed(), ses = S.sessionLog.length;
  const done = new Set(st.log.map(x=>x.k));
  for(const [k, dMin, sMin] of SV_SCHEDULE){
    if(done.has(k)) continue;
    if(days>=dMin && ses>=sMin){ setTimeout(()=>{ if(!document.getElementById('sheet') && home.classList.contains('active')) surveyAsk(k); }, 1200); return; }
    return; // las programadas van en orden: no saltar a la siguiente
  }
}

// ¿Está funcionando? Mide lo observado (no solo lo declarado) y lo contrasta con lo percibido.
function effectSummary(){
  const out = {days:svDaysUsed(), sessions:S.sessionLog.length};
  const ev = S.evlog||[], today = todayStr();
  if(ev.length>=8 && typeof HAB!=='undefined'){
    const first = ev.slice(0,Math.ceil(ev.length/2)), last = ev.slice(Math.ceil(ev.length/2));
    const avg = a=>a.reduce((x,y)=>x+y.s,0)/a.length;
    out.accFirst = Math.round(avg(first)); out.accLast = Math.round(avg(last));
  }
  const hist = (S.habit&&S.habit.history)||[];
  out.habitsTried = hist.filter(h=>h.verdict!=='omitido').length;
  out.habitsWorked = hist.filter(h=>h.verdict==='mejoro').length;
  const log = svState().log, get = k=>{ const x=log.filter(l=>l.k===k&&l.v!=='omitida').pop(); return x?x.v:null; };
  out.confIni = get('confianza_ini'); out.confFin = get('confianza_fin'); out.mejor = get('mejor');
  return out;
}
function effectCSV(){
  const t = todayStr(), e = effectSummary();
  const rows = [['pregunta','respuesta','fecha']].concat(svState().log.map(x=>[x.k,x.v,x.d]));
  rows.push(['_dias_de_uso',e.days,t],['_sesiones',e.sessions,t]);
  return rows.map(r=>r.join(',')).join(String.fromCharCode(10));
}
