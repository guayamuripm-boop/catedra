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
  recomienda: {q:'¿Se la recomendarías a un compañero?', o:[['si','Sí, seguro'],['tal','Tal vez'],['no','No']]}
};
const SV_SCHEDULE = [ // [clave, días mínimos de uso, sesiones mínimas]
  ['sean',3,3], ['beneficio',4,4], ['freno',5,4], ['recomienda',7,5]
];

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

// En línea: chips dentro de una pantalla. Devuelve HTML; al tocar, se agradece y se oculta.
function surveyInline(k, id, max){
  const sv = SURVEYS[k]; if(!sv) return '';
  const mine = svState().log.filter(x=>x.k===k);
  if(mine.some(x=>x.d===todayStr()) || (max && mine.length>=max)) return ''; // sin insistir: una vez al día y con tope
  const hid = 'sv-'+(id||k);
  return `<div class="sv-inline" id="${hid}" style="margin-top:14px;"><div class="muted" style="font-size:12px;margin-bottom:8px;">${sv.q}</div>
    <div class="chip-row">${sv.o.map(([v,l])=>`<button class="chip" style="font-size:12px;" onclick="surveyInlinePick('${k}','${v}','${hid}')">${l}</button>`).join('')}</div></div>`;
}
function surveyInlinePick(k, v, hid){
  surveyAnswer(k, v);
  const el = document.getElementById(hid);
  if(el) el.innerHTML = '<div class="muted" style="font-size:12px;">Gracias</div>';
}

// En hoja inferior: una pregunta a pantalla completa de opciones
function surveyAsk(k){
  const sv = SURVEYS[k]; if(!sv || typeof openSheet!=='function') return;
  const st = svState();
  st.shown = (st.shown.d===todayStr()) ? st.shown : {d:todayStr(), n:0};
  st.shown.n++; saveState();
  openSheet(`<div class="eyebrow">Una pregunta rápida</div>
    <div class="h1" style="font-size:20px;line-height:1.3;">${sv.q}</div>
    ${sv.o.map(([v,l])=>`<button class="btn btn-ghost btn-block" data-v="${v}">${l}</button>`).join('')}
    <button class="ob-back" id="sv-skip">Ahora no</button>`);
  document.querySelectorAll('#sheet [data-v]').forEach(b=>b.onclick=()=>{ surveyAnswer(k, b.dataset.v); closeSheet(); showToast('Gracias'); });
  document.getElementById('sv-skip').onclick = ()=>{ surveyAnswer(k, 'omitida'); closeSheet(); };
}

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
