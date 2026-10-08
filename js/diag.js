/* Catedra · Hábitos de estudio: preguntas adaptativas
   Una pregunta de entrada, preguntas dirigidas por área y seguimiento con tu práctica real.
   El resultado es una estimación por área (est 0-100, w = peso de evidencia) que se actualiza
   con respuestas y con datos observados. Son hipótesis para probar, no etiquetas ni un diagnóstico. */

const IC = {
  CON:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  TIE:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  MOT:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ANS:'<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  PRO:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  AUT:'<path d="M12 4v16M6 20h12M5 8h14"/>',
  EXA:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 14l2 2 4-4"/>',
  REC:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  SUE:'<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>'
};
function icoSvg(k,sz){return `<svg width="${sz||18}" height="${sz||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]||''}</svg>`;}

const DOMAINS = {
  CON:{n:'Concentración'}, TIE:{n:'Tiempo'}, MOT:{n:'Motivación'}, ANS:{n:'Calma ante examen'},
  PRO:{n:'Retención'}, AUT:{n:'Autoevaluación'}, EXA:{n:'Estrategia de examen'}, REC:{n:'Recursos'}, SUE:{n:'Descanso'}
};

// Cada opcion: [texto, valor 0-100]. Valor alto = habito mas eficaz. Redaccion conductual.
const DQ = {
  // ── Triaje ──
  T1:{t:'¿Qué te cuesta más cuando estudias?', tri:true, o:[
    ['Concentrarme',{dom:'CON',des:'distraccion'}],['Empezar a tiempo',{dom:'TIE',des:'procrastinacion'}],
    ['Recordar lo estudiado',{dom:'PRO',des:'retencion'}],['Es demasiado contenido',{dom:'TIE',des:'volumen'}],
    ['Me bloqueo en el examen',{dom:'ANS',des:'ansiedad'}],['Mantener la motivación',{dom:'MOT',des:'motivacion'}]]},
  T2:{t:'¿Cuándo falla?', tri:true, o:[['Antes: no arranco','antes'],['Durante: me distraigo u olvido','durante'],['Después: en el examen','despues']]},
  T3:{t:'¿Cuánto te afecta?', tri:true, o:[['Poco',1],['Bastante',2],['Muchísimo',3]]},
  P1:{t:'¿A qué hora te cuesta menos concentrarte?', tri:true, o:[['Mañana','manana'],['Tarde','tarde'],['Noche','noche'],['Madrugada','madrugada']]},
  P2:{t:'Sin pausar, ¿cuánto rindes antes de distraerte?', tri:true, o:[['15–20 min',20],['30–45 min',45],['60 min o más',60]]},
  // ── Concentracion ──
  CON1:{dom:'CON',scr:true,t:'La última vez que estudiaste, ¿cuántas veces miraste el celular?',o:[['Ninguna',100],['1 o 2 veces',66],['Varias veces',33],['No pude soltarlo',0]],f:['CON2','CON3']},
  CON2:{dom:'CON',t:'¿Cuánto tardas en concentrarte al sentarte?',o:[['Menos de 5 min',100],['5 a 15 min',66],['15 a 30 min',33],['Casi nunca llego',0]]},
  CON3:{dom:'CON',t:'¿Dónde estudias normalmente?',o:[['Lugar fijo y tranquilo',100],['Lugar fijo con ruido',66],['Donde pueda',33],['En la cama o el sofá',0]]},
  // ── Tiempo ──
  TIE1:{dom:'TIE',scr:true,t:'¿Cuándo empiezas a estudiar para un examen?',o:[['Con 2 semanas o más',100],['Una semana antes',66],['2 o 3 días antes',33],['La víspera',0]],f:['TIE2','TIE3']},
  TIE2:{dom:'TIE',t:'¿Tienes un horario fijo de estudio?',o:[['Sí, y lo cumplo',100],['A veces',66],['Casi nunca',33],['No tengo',0]]},
  TIE3:{dom:'TIE',t:'Ante una tarea grande, ¿qué haces?',o:[['La divido en partes',100],['Empiezo sin plan',66],['Espero sentirme listo',33],['La evito',0]]},
  // ── Motivacion ──
  MOT1:{dom:'MOT',scr:true,t:'¿Qué tan seguido estudias sin que nadie te lo pida?',o:[['Casi siempre',100],['Seguido',66],['A veces',33],['Solo si me obligan',0]],f:['MOT2','MOT3']},
  MOT2:{dom:'MOT',t:'Si un tema te parece inútil, ¿qué haces?',o:[['Busco para qué sirve',100],['Lo estudio igual',66],['Lo dejo para el final',33],['Lo salto',0]]},
  MOT3:{dom:'MOT',t:'Cuando sacas mala nota, ¿qué piensas?',o:[['Qué puedo cambiar',100],['Me frustro, pero sigo',66],['No soy bueno en esto',33],['Dejo de intentarlo',0]]},
  // ── Calma ante examen ──
  ANS1:{dom:'ANS',scr:true,t:'Antes de un examen importante, ¿cómo te sientes?',o:[['Tranquilo',100],['Algo nervioso',66],['Muy nervioso',33],['Casi no duermo, me bloqueo',0]],f:['ANS2','ANS3']},
  ANS2:{dom:'ANS',t:'En el examen, ¿olvidas lo que sabías?',o:[['Nunca',100],['Rara vez',66],['Seguido',33],['Casi siempre',0]]},
  ANS3:{dom:'ANS',t:'Si sientes tensión, ¿qué haces?',o:[['Respiro y hago pausa',100],['Sigo igual',66],['Me bloqueo',33],['Abandono',0]]},
  // ── Retencion ──
  PRO1:{dom:'PRO',scr:true,t:'Para aprender un tema nuevo, ¿qué haces sobre todo?',o:[['Me pregunto sin mirar',100],['Resumo o hago esquemas',66],['Releo y subrayo',33],['Leo una sola vez',0]],f:['PRO2','PRO3']},
  PRO2:{dom:'PRO',t:'¿Cuánto recuerdas de un tema una semana después?',o:[['Casi todo',100],['La mitad',66],['Poco',33],['Casi nada',0]]},
  PRO3:{dom:'PRO',t:'¿Repasas un tema varios días, no de golpe?',o:[['Siempre',100],['A veces',66],['Solo antes del examen',33],['Nunca',0]]},
  // ── Autoevaluacion ──
  AUT1:{dom:'AUT',scr:true,t:'Al terminar, ¿cómo sabes si aprendiste?',o:[['Me pruebo sin apuntes',100],['Comparo con la guía',66],['Siento que lo entendí',33],['No lo sé',0]],f:['AUT2','AUT3']},
  AUT2:{dom:'AUT',t:'¿Tu nota coincide con lo que esperabas?',o:[['Casi siempre',100],['Me va mejor de lo esperado',66],['Me va peor de lo esperado',33],['No lo sé',0]]},
  AUT3:{dom:'AUT',t:'¿Qué haces con las preguntas que fallas?',o:[['Las repaso hasta dominarlas',100],['Las miro una vez',66],['Las ignoro',33],['No reviso',0]]},
  // ── Estrategia de examen ──
  EXA1:{dom:'EXA',scr:true,t:'¿Practicas con exámenes anteriores o simulacros?',o:[['Siempre',100],['A veces',66],['Rara vez',33],['Nunca',0]],f:['EXA2','EXA3']},
  EXA2:{dom:'EXA',t:'En el examen, ¿cómo manejas el tiempo?',o:[['Planifico por pregunta',100],['Reviso al final',66],['Me quedo sin tiempo',33],['Dejo preguntas en blanco',0]]},
  EXA3:{dom:'EXA',t:'¿Qué haces con una pregunta que no sabes?',o:[['Paso y vuelvo',100],['Descarto opciones',66],['Me quedo pegado',33],['Me bloqueo',0]]},
  // ── Recursos ──
  REC1:{dom:'REC',scr:true,t:'Cuando no entiendes algo, ¿qué haces?',o:[['Busco otra fuente o pregunto',100],['Pregunto a un compañero',66],['Espero que salga en clase',33],['Lo dejo',0]],f:['REC2','REC3']},
  REC2:{dom:'REC',t:'¿Tus apuntes están organizados?',o:[['Sí, por tema',100],['Sí, pero desordenados',66],['Uso copias de otros',33],['No tengo',0]]},
  REC3:{dom:'REC',t:'¿Estudias con otras personas?',o:[['Nos explicamos entre todos',100],['A veces',66],['Solo para copiar',33],['Nunca',0]]},
  // ── Descanso ──
  SUE1:{dom:'SUE',scr:true,t:'¿Cuántas horas duermes en días de estudio?',o:[['7 a 9 horas',100],['6 a 7 horas',66],['5 a 6 horas',33],['Menos de 5',0]],f:['SUE2']},
  SUE2:{dom:'SUE',t:'La noche antes de un examen, ¿qué haces?',o:[['Duermo bien',100],['Repaso y duermo poco',66],['Estudio hasta tarde',33],['Me desvelo',0]]}
};
const SCREENERS = ['CON1','TIE1','MOT1','ANS1','PRO1','AUT1','EXA1','REC1','SUE1'];
const CORE_SCREENERS = ['CON1','TIE1','PRO1','AUT1']; // los 4 más accionables; el resto se completa en las primeras sesiones
const DOM_OF_SCR = {CON:'CON1',TIE:'TIE1',MOT:'MOT1',ANS:'ANS1',PRO:'PRO1',AUT:'AUT1',EXA:'EXA1',REC:'REC1',SUE:'SUE1'};

// Prescripciones: accion concreta + lo que hace la app por ti
const RX = {
  CON:'Celular en otra habitación y bloques cortos. La app ya acorta tus bloques.',
  TIE:'Tres bloques fijos por semana. Empieza con 2 minutos; la app los agenda.',
  MOT:'Conecta cada tema con algo que te importe. Empieza por la sesión más corta.',
  ANS:'Simulacros semanales con tiempo real y 1 minuto de respiración lenta antes.',
  PRO:'Cambia releer por responder sin mirar, y reparte los repasos en varios días.',
  AUT:'Predice tu acierto antes de ver la respuesta. La app compara y te muestra el desfase.',
  EXA:'Un simulacro por semana. Practica pasar y volver a las preguntas difíciles.',
  REC:'Convierte tus apuntes en preguntas y pide ayuda al primer atasco, no al último.',
  SUE:'Duerme 7 horas o más antes del examen: consolida más que repasar una hora extra.'
};

// ── Estado del flujo ──
let D = null;
function todayISO(){return todayStr();}
function domOf(k){
  if(!S.diag.dom[k]) S.diag.dom[k] = {est:60, w:0, n:0};
  return S.diag.dom[k];
}
function domLevel(est){return est<40?'bajo':est<65?'medio':'alto';}
function domColor(est){return est<40?'var(--amber)':est<65?'var(--brass)':'var(--sage)';}
function domLevel(est){return est<40?'por explorar':est<65?'en camino':'sólido';}

function startDiagnostic(opts){
  opts = opts || {};
  D = {mode:opts.mode||'full', onFinish:opts.onFinish||null, queue:[], stack:[], answers:{}, cur:null, curSnap:null, complaint:null, sev:0, extra:0};
  if(D.mode==='full'){
    D.queue = ['T1','T2','T3','P1','P2','@SCR'];
  } else if(opts.domains){
    D.queue = opts.domains.map(k=>DOM_OF_SCR[k]);
  } else {
    const order = Object.keys(DOMAINS).sort((a,b)=>{const da=domOf(a),db=domOf(b);return (da.w - db.w) || (da.est - db.est);});
    D.queue = order.slice(0,3).map(k=>DOM_OF_SCR[k]);
  }
  showView('diag');
  document.getElementById('tabbar').style.display='none';
  document.getElementById('diag-q').style.display='flex';
  document.getElementById('diag-report').style.display='none';
  diagNext();
}

function diagExpand(){
  while(D.queue.length && D.queue[0]==='@SCR'){
    D.queue.shift();
    const first = D.complaint ? DOM_OF_SCR[D.complaint] : null;
    const rest = CORE_SCREENERS.filter(id=>id!==first);
    D.queue = (first?[first]:[]).concat(rest).concat(D.queue);
  }
}
function diagNext(){
  diagExpand();
  if(!D.queue.length){ diagFinish(); return; }
  const id = D.queue.shift();
  D.cur = id; D.curSnap = [id].concat(D.queue);
  const q = DQ[id];
  document.getElementById('diag-dom').innerHTML = q.dom ? `${icoSvg(q.dom,16)}<span>${DOMAINS[q.dom].n}</span>` : '<span>Tu consulta</span>';
  document.getElementById('diag-text').textContent = q.t;
  const est = D.stack.length + 1 + D.queue.reduce((a,x)=>a+(x==='@SCR'?4:1),0) + 2;
  document.getElementById('diag-bar').style.width = Math.min(96, Math.round((D.stack.length/est)*100)) + '%';
  const host = document.getElementById('diag-opts');
  host.innerHTML = q.o.map((o,i)=>`<button class="diag-opt fade-in" data-i="${i}">${o[0]}</button>`).join('');
  host.querySelectorAll('.diag-opt').forEach(b=>b.addEventListener('click',()=>{
    b.classList.add('picked');
    setTimeout(()=>diagAnswer(parseInt(b.dataset.i)),140);
  }));
}
function diagAnswer(i){
  const id = D.cur, q = DQ[id], val = q.o[i][1];
  D.stack.push({id, snap:D.curSnap, extra:D.extra});
  D.answers[id] = val;
  if(id==='T1'){ D.complaint = val.dom; D.desafio = val.des; }
  if(id==='T3'){ D.sev = val; }
  if(q.scr){
    const isComplaint = D.complaint===q.dom;
    const ambiguous = (val===33||val===66);
    let take = [];
    if(isComplaint) take = q.f;
    else if(ambiguous && D.extra<2){ take = [q.f[0]]; D.extra++; }
    D.queue = take.filter(f=>!(f in D.answers)).concat(D.queue);
  }
  diagNext();
}
function diagBack(){
  if(!D) return;
  if(!D.stack.length){
    if(D.mode==='full' && !S.onboarded){ showView('onboard'); goStep(1); }
    else goTab(S.onboarded && D.mode==='full' ? 'home' : 'progress');
    return;
  }
  const last = D.stack.pop();
  D.queue = last.snap.slice();
  D.extra = last.extra;
  delete D.answers[last.id];
  if(last.id==='T1'){D.complaint=null;D.desafio=null;}
  if(last.id==='T3'){D.sev=0;}
  diagNext();
}

function diagFinish(){
  const A = D.answers;
  const sums = {};
  Object.keys(A).forEach(id=>{
    const q = DQ[id];
    if(q.dom && typeof A[id]==='number'){ (sums[q.dom] = sums[q.dom]||[]).push(A[id]); }
  });
  const snapshotBefore = {};
  Object.keys(S.diag.dom).forEach(k=>snapshotBefore[k]=Math.round(S.diag.dom[k].est));
  if(D.mode==='full'){
    S.diag.dom = {};
    Object.keys(sums).forEach(k=>{
      const v = sums[k]; S.diag.dom[k] = {est:v.reduce((a,b)=>a+b,0)/v.length, w:Math.min(v.length,6), n:v.length};
    });
    if(A.P1) S.profile.picoProductividad = A.P1;
    if(A.P2) S.profile.capacidadEnfoque = A.P2;
    if(D.desafio) S.profile.desafio = D.desafio;
    if(A.T2) S.profile.cuando = A.T2;
    if(A.T3) S.profile.gravedad = A.T3;
    S.diag.lastFull = todayISO();
    S.diag.answers = Object.assign({}, A);
  } else {
    Object.keys(sums).forEach(k=>{
      const v = sums[k], d = domOf(k);
      d.est = (d.est*d.w + v.reduce((a,b)=>a+b,0)) / (d.w + v.length);
      d.w = Math.min(d.w + v.length, 14); d.n = (d.n||0) + v.length;
    });
    S.diag.lastFull = todayISO();
  }
  diagSnapshot(D.mode==='full'?'inicial':'control');
  saveState();
  renderDiagReport(snapshotBefore);
}
function diagSnapshot(kind){
  const dom = {}; Object.keys(S.diag.dom).forEach(k=>dom[k]=Math.round(S.diag.dom[k].est));
  S.diag.history.push({date:todayISO(), kind, dom});
  if(S.diag.history.length>40) S.diag.history = S.diag.history.slice(-40);
}

// ── Reporte ──
function lastSnapshotBefore(){
  const h = S.diag.history; return h.length>=2 ? h[h.length-2].dom : null;
}
function renderDiagReport(prevSnap){
  document.getElementById('diag-q').style.display='none';
  const el = document.getElementById('diag-report');
  el.style.display='flex';
  const prev = prevSnap && Object.keys(prevSnap).length ? prevSnap : lastSnapshotBefore();
  el.innerHTML = diagReportHTML(prev, true);
  const back = document.getElementById('diag-done');
  if(back) back.onclick = ()=>{ const f=D&&D.onFinish; if(f)f(); else goTab('progress'); };
  document.getElementById('view-diag').scrollTop = 0;
}
function diagReportHTML(prev, withActions){
  const p = S.profile, method = getMethodology();
  const keys = Object.keys(DOMAINS).filter(k=>S.diag.dom[k] && (S.diag.dom[k].n>0 || S.diag.dom[k].w>=1));
  const complaintDom = (S.diag.answers && S.diag.answers.T1 && S.diag.answers.T1.dom) || null;
  const rank = k=>{const d=S.diag.dom[k]; const n=Math.max(d.n||0,0.5); return (d.est*n+60)/(n+1) - (k===complaintDom?8:0);};
  const sorted = keys.sort((a,b)=>rank(a)-rank(b));
  const priority = sorted[0];
  const picoRange = {manana:'7–10 h',tarde:'14–17 h',noche:'19–22 h',madrugada:'5–7 h'}[p.picoProductividad] || '';
  const lows = sorted.filter(k=>S.diag.dom[k].est<65).slice(0,3);
  const strong = sorted.slice().reverse().filter(k=>S.diag.dom[k].est>=70).slice(0,2);
  const ansNote = S.diag.dom.ANS && S.diag.dom.ANS.est<35 && (p.gravedad||0)>=2;
  const delta = k=>{
    if(!prev || prev[k]==null) return '';
    const dlt = Math.round(S.diag.dom[k].est) - prev[k];
    if(Math.abs(dlt)<3) return '';
    return `<span class="delta ${dlt>0?'up':'down'}">${dlt>0?'↑':'↓'} ${Math.abs(dlt)}</span>`;
  };
  let h = `<div class="eyebrow" style="margin-top:14px;">Cómo estudias hoy</div>`;
  if(strong.length){
    h += `<div class="big-priority">${esc(DOMAINS[strong[0]].n)}<span style="display:block;font-size:14px;color:var(--sage);font-family:'IBM Plex Sans';margin-top:4px;">es lo que mejor te funciona</span></div>`;
  } else if(priority){
    h += `<div class="big-priority">Empezamos por ${esc(DOMAINS[priority].n.toLowerCase())}<span style="display:block;font-size:14px;color:var(--muted);font-family:'IBM Plex Sans';margin-top:4px;">lo probamos y vemos qué pasa</span></div>`;
  }
  h += `<div class="glass" style="margin-top:16px;padding:6px 14px;">` + sorted.map(k=>{
    const d = S.diag.dom[k], v = Math.round(d.est);
    return `<div class="dom-row"><div class="dom-ico" style="color:${domColor(d.est)};">${icoSvg(k)}</div>
      <div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><span style="font-size:13.5px;font-weight:600;">${esc(DOMAINS[k].n)}${delta(k)}</span><span style="font-size:12px;color:${domColor(d.est)};">${domLevel(d.est)}${d.n<2?' · por confirmar':''}</span></div>
      <div class="dom-bar"><div style="width:${v}%;background:${domColor(d.est)};"></div></div></div></div>`;
  }).join('') + `</div>`;
  if(lows.length){
    h += `<div class="section-title" style="margin-top:20px;">Lo que vamos a probar</div><div class="glass" style="padding:6px 14px;">` +
      lows.map(k=>`<div class="dom-row" style="align-items:flex-start;"><div class="dom-ico" style="color:${domColor(S.diag.dom[k].est)};">${icoSvg(k)}</div><div style="font-size:13px;line-height:1.5;padding-top:2px;">${esc(RX[k])}</div></div>`).join('') + `</div>`;
  } else if(sorted.length){
    h += `<div class="section-title" style="margin-top:20px;">Lo que vamos a probar</div><div class="glass"><div style="font-size:13px;line-height:1.5;">Todo marcha bien. Seguimos atentos a cualquier cambio.</div></div>`;
  }
  h += `<div class="section-title" style="margin-top:20px;">Tu ritmo</div><div style="display:flex;gap:8px;flex-wrap:wrap;">
    <span class="tag-pill subj" style="font-size:12px;padding:6px 12px;">${method.name} · ${method.duration} min</span>
    ${picoRange?`<span class="tag-pill" style="font-size:12px;padding:6px 12px;">Mejor hora ${picoRange}</span>`:''}
    ${strong.length?`<span class="tag-pill" style="font-size:12px;padding:6px 12px;color:var(--sage);">Fuerte: ${strong.map(k=>DOMAINS[k].n).join(', ')}</span>`:''}
  </div>`;
  if(ansNote){
    h += `<div class="glass nudge info" style="margin-top:16px;"><div class="nudge-text">El bloqueo ante exámenes es común y se trabaja. Si te agobia mucho, hablarlo con un orientador o profesional ayuda.</div></div>`;
  }
  const measured = Object.keys(DOMAINS).filter(k=>S.diag.dom[k] && (S.diag.dom[k].n>0)).length;
  if(measured < 9) h += `<div class="muted" style="font-size:12px;margin-top:14px;">${measured} de 9 áreas medidas. Completamos el resto en tus próximas sesiones.</div>`;
  h += `<div class="muted" style="font-size:11px;margin-top:10px;">Esto sale de tus respuestas y de cómo practicas. Cambia contigo: son ideas para probar, no etiquetas.</div>`;
  if(withActions){
    if(typeof surveyInline==='function' && D && D.mode!=='view') h += surveyInline('perfil_valido','perfil',2);
    h += `<button class="btn btn-primary btn-block" id="diag-done" style="margin-top:18px;">${D&&D.mode==='full'?'Continuar':'Listo'}</button>`;
  }
  return h;
}

// ── Aprendizaje continuo: observaciones reales actualizan el perfil ──
function obsUpdate(dom, obs, k){
  const d = domOf(dom);
  obs = Math.max(0, Math.min(100, obs));
  d.est = (d.est*d.w + obs*k) / (d.w + k);
  d.w = Math.min(d.w + k, 14);
  d.n = (d.n||0) + 1;
}
function daysActive(span){
  const t = new Date(); let c = 0;
  for(let i=0;i<span;i++){ const d = new Date(t); d.setDate(d.getDate()-i); if(S.streakDays.includes(localISO(d))) c++; }
  return c;
}
function learnFromSession(info){
  // Un solo día de uso no dice nada: sin respuestas previas en esa área, esperamos a tener sesiones suficientes.
  const ns = S.sessionLog.length;
  const ok = k=>{ const d=S.diag.dom[k]; return (d && d.w>0) || ns>=3; };
  const r = info.results||[];
  if(r.length>=3){
    const accuracy = r.reduce((a,x)=>a+x.score,0)/r.length;
    if(ok('PRO')) obsUpdate('PRO', accuracy, 2);
    const withConf = r.filter(x=>x.confidence);
    if(withConf.length>=3 && ok('AUT')){
      const pm = {1:0.2,2:0.5,3:0.85};
      const gap = withConf.reduce((a,x)=>a+Math.abs(pm[x.confidence]-x.score/100),0)/withConf.length;
      obsUpdate('AUT', 100*(1-gap*1.6), 2);
    }
  }
  const m = getMethodology();
  const ratio = info.minutes/m.duration;
  if(ok('CON')) obsUpdate('CON', info.fatigue ? 35 : (ratio>=0.6&&ratio<=1.4 ? 78 : 60), 1.5);
  if(ns>=3 && ok('TIE')){
    const hr = new Date().getHours();
    const win = {manana:[6,11],tarde:[13,18],noche:[18,23],madrugada:[3,7]}[S.profile.picoProductividad];
    const inWin = win ? (hr>=win[0]&&hr<win[1]) : true;
    const cons = [35,35,55,55,75,75,90][Math.min(6,daysActive(7))];
    obsUpdate('TIE', (inWin?75:50)*0.4 + cons*0.6, 1.5);
  }
  if(ns>=4 && ok('MOT')) obsUpdate('MOT', Math.min(100, daysActive(14)/10*100), 1);
  saveState();
}
function learnFromSim(sim, normalAvg){
  obsUpdate('EXA', sim, 2);
  obsUpdate('ANS', 100 - Math.max(0, normalAvg - sim)*1.5, 2);
  saveState();
}

// ── Pulso: una pregunta tras cada 3 sesiones ──
function pickPulse(){
  const asked = new Set((S.diag.pulses||[]).map(p=>p.q));
  const unseen = k=>{const d=S.diag.dom[k]; return !d || (d.n||0)===0;};
  const blind = SCREENERS.filter(id=>unseen(DQ[id].dom) && !asked.has(id));
  if(blind.length) return blind[0];
  const cand = Object.keys(DQ).filter(id=>DQ[id].dom && !DQ[id].scr && !asked.has(id) && !(id in (S.diag.answers||{})));
  if(!cand.length) return null;
  cand.sort((a,b)=>domOf(DQ[a].dom).w - domOf(DQ[b].dom).w);
  return cand[0];
}
function renderPulse(hostId){
  const host = document.getElementById(hostId);
  if(!host) return;
  host.style.display='none'; host.innerHTML='';
  const ns = S.sessionLog.length;
  if(ns===0 || (ns>5 && ns%3!==0)) return;
  const id = pickPulse(); if(!id) return;
  const q = DQ[id];
  host.style.display='block';
  host.innerHTML = `<div class="eyebrow" style="margin-bottom:6px;display:flex;align-items:center;gap:6px;">${icoSvg(q.dom,14)} ${DOMAINS[q.dom].n}</div>
    <div style="font-size:13.5px;margin-bottom:10px;">${esc(q.t)}</div>
    <div style="display:flex;flex-direction:column;gap:8px;">${q.o.map((o,i)=>`<button class="diag-opt" style="min-height:44px;font-size:13px;padding:10px 14px;" data-i="${i}">${o[0]}</button>`).join('')}</div>`;
  host.querySelectorAll('.diag-opt').forEach(b=>b.addEventListener('click',()=>{
    const val = q.o[parseInt(b.dataset.i)][1];
    obsUpdate(q.dom, val, 1);
    S.diag.pulses.push({q:id, v:val, date:todayISO()});
    if(typeof track==='function') track('pulse_answered', {dom:q.dom});
    saveState(); host.style.display='none'; showToast('Perfil actualizado');
  }));
}

// ── Control periodico y adaptaciones ──
function diagNeedsControl(){
  if(!S.diag.lastFull) return true;
  const days = Math.round((parseDay(todayISO())-parseDay(S.diag.lastFull))/864e5);
  return days>=14;
}
function diagNudges(){
  const out = [];
  if(S.onboarded && S.diag.lastFull && diagNeedsControl()){
    out.push({type:'info', text:'Control de 2 minutos: tu perfil cambia con la práctica.', action:'Hacer control', fn:"startDiagnostic({mode:'control'})"});
  }
  const sim = S.simLog||[];
  const lastSim = sim.length ? sim[sim.length-1].date : null;
  const sinceSim = lastSim ? Math.round((parseDay(todayISO())-parseDay(lastSim))/864e5) : 99;
  const exa = S.diag.dom.EXA, ans = S.diag.dom.ANS;
  const examSoon = S.subjects.some(s=>{const d=daysUntil(s.examDate);return d!==null&&d>=0&&d<=14;});
  if(examSoon && ((exa&&exa.est<55)||(ans&&ans.est<50)) && sinceSim>=5){
    out.push({type:'warn', text:'Un simulacro esta semana te prepara para el examen real.', action:'Simulacro', fn:'startExamSimFlow()'});
  }
  return out;
}

// ── Perfil en Progreso ──
function renderProgressProfile(el){
  const keys = Object.keys(DOMAINS).filter(k=>S.diag.dom[k] && (S.diag.dom[k].n>0 || S.diag.dom[k].w>=1)).sort((a,b)=>S.diag.dom[a].est-S.diag.dom[b].est);
  if(!keys.length){
    el.innerHTML = `<button class="btn btn-primary btn-block" onclick="startDiagnostic({mode:'full',onFinish:()=>goTab('progress')})">Conocer mis hábitos</button>`;
    return;
  }
  const prev = S.diag.history.length>=2 ? S.diag.history[S.diag.history.length-2].dom : null;
  const rows = keys.map(k=>{
    const d=S.diag.dom[k], v=Math.round(d.est);
    let dl='';
    if(prev && prev[k]!=null){const x=v-prev[k]; if(Math.abs(x)>=3) dl=`<span class="delta ${x>0?'up':'down'}">${x>0?'↑':'↓'} ${Math.abs(x)}</span>`;}
    return `<div class="dom-row"><div class="dom-ico" style="color:${domColor(d.est)};">${icoSvg(k)}</div><div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;"><span style="font-size:13px;font-weight:600;">${esc(DOMAINS[k].n)}${dl}</span><span style="font-size:12px;color:${domColor(d.est)};">${domLevel(d.est)}</span></div><div class="dom-bar"><div style="width:${v}%;background:${domColor(d.est)};"></div></div></div></div>`;
  }).join('');
  el.innerHTML = rows + `<div style="display:flex;gap:8px;margin-top:12px;">
    <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="viewDiagReport()">Ver reporte</button>
    <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="startDiagnostic({mode:'control',onFinish:()=>goTab('progress')})">Control · 2 min</button></div>`;
}
function viewDiagReport(){
  D = {mode:'view', onFinish:()=>goTab('progress'), queue:[], stack:[], answers:{}};
  showView('diag'); document.getElementById('tabbar').style.display='none';
  renderDiagReport(null);
}
