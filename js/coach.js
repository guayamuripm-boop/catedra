'use strict';
/* Catedra · Asesor: convierte los datos del estudiante en un plan que la IA redacta y Catedra mide.
   La IA nunca ve el nombre ni mide nada: recibe un resumen numérico (digest), propone sesiones, cosas por hacer
   fuera de Catedra y qué medir; Catedra valida la propuesta, la compara después con la práctica real
   y le cuenta a la IA qué se cumplió y qué funcionó cuando se pide el plan siguiente.
   Sin enlaces inventados: la IA propone frases de búsqueda y Catedra arma la búsqueda. */
(function(root){
  const DAY = 864e5;
  const pad = n=>String(n).padStart(2,'0');
  const iso = d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const parse = s=>{ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); };
  const addDays = (s,n)=>{ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); };
  const diff = (a,b)=>Math.round((parse(b)-parse(a))/DAY);
  const mean = a=>a.reduce((x,y)=>x+y,0)/a.length;
  const r2 = v=>Math.round(v*100)/100;
  const WEEKDAY = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  const ACT = {
    autoprueba:['Pruébate sin mirar','Respóndelo de memoria y luego revisa.'],
    ejemplo_resuelto:['Estudia un ejemplo resuelto','Sigue cada paso de uno resuelto antes de hacer el tuyo.'],
    intercalar:['Ejercicios mezclados','Mezcla tipos distintos, sin saber cuál toca.'],
    explicar:['Explícalo con tus palabras','Dilo en voz alta o escríbelo sin mirar.'],
    aplicar:['Llévalo a la vida real','Usa el tema en una situación de tu día.'],
    simulacro:['Simulacro con tiempo','Cronómetro y sin apuntes.'],
    leer_activo:['Lectura con preguntas','Léelo preguntándote cosas y resume al final.']
  };
  const FUERA = {video:'Video', lectura:'Lectura', ejercicios:'Ejercicios', tutor_ia:'Tutor con IA', persona:'Alguien que sepa'};
  const METRIC_TXT = {acc:'Acierto', delayed:'Recuerdo tras 5+ días', calib:'Brecha confianza–acierto', days:'Días de práctica por semana', sim:'Nota de simulacro'};
  const LOWER_BETTER = {calib:true};
  const PCT_METRIC = {acc:1, delayed:1, calib:1, sim:1};

  /* Búsqueda real (nunca un enlace inventado). tutor_ia y persona no llevan enlace: llevan instrucción. */
  function searchUrl(tipo, q){
    const t = encodeURIComponent(String(q||'').trim());
    if(!t) return '';
    if(tipo==='video') return 'https://www.youtube.com/results?search_query='+t;
    if(tipo==='lectura' || tipo==='ejercicios') return 'https://www.google.com/search?q='+t;
    return '';
  }

  function avgScore(it){ const s=it.recallScores||[]; return s.length?mean(s):null; }

  /* ── Resumen numérico del estudiante (sin nombre) ── */
  function digest(st, today, c){
    c = c||{};
    const HAB = c.HAB, SP = c.SP, AREA = c.AREA;
    const from = addDays(today,-14), to = addDays(today,-1);
    const ids = {};
    const materias = (st.subjects||[]).filter(s=>s.items&&s.items.length).slice(0,6).map((s,i)=>{
      const id = 'm'+(i+1); ids[id] = s.id;
      const sc = s.items.map(avgScore).filter(v=>v!==null);
      const dias = s.examDate ? diff(today,s.examDate) : null;
      const ne = SP && SP.nextEval ? SP.nextEval(s,today) : null;
      const debiles = s.items.map(it=>({it,a:avgScore(it)})).filter(x=>x.a!==null&&x.a<60)
        .sort((a,b)=>a.a-b.a).slice(0,3).map(x=>String(x.it.pregunta).slice(0,90));
      const sinPractica = SP && SP.coverage ? SP.coverage(st,s,today).filter(u=>u.materials>0&&u.items===0).slice(0,3).map(u=>u.unit.nombre) : [];
      const o = {id, nombre:String(s.nombre).slice(0,50), area:(AREA&&AREA.of)?AREA.of(s):'general',
        preguntas:s.items.length, por_repasar:s.items.filter(it=>it.nextReviewDate<=today).length};
      if(dias!==null && dias>=0) o.dias_examen = dias;
      if(ne && ne.peso) o.peso_evaluacion = ne.peso;
      if(ne){
        const inf = ne.info||{}, ev = {nombre:String(ne.nombre).slice(0,40)};
        if(inf.formato && inf.formato!=='nose') ev.formato = inf.formato;
        if(inf.material && inf.material!=='nose') ev.material_permitido = inf.material==='si';
        const temas = (ne.unitIds||[]).map(id=>{ const u=(s.units||[]).find(x=>x.id===id); return u?String(u.nombre).slice(0,40):''; }).filter(Boolean).slice(0,6);
        if(temas.length) ev.temas = temas; else if(inf.temas) ev.temas = [String(inf.temas).slice(0,120)];
        if(Object.keys(ev).length>1 || temas.length) o.evaluacion = ev;
      }
      if(sc.length) o.dominio = r2(mean(sc)/100);
      if(debiles.length) o.temas_debiles = debiles;
      if(sinPractica.length) o.unidades_sin_practica = sinPractica;
      return o;
    });

    const medido = {};
    if(HAB){
      ['acc','delayed','calib','days'].forEach(k=>{ const m=HAB.measure(st,k,from,to); if(m.n>0) medido[k]={valor:r2(m.v),n:m.n}; });
      const rec = HAB.measure(st,'tipo',from,to,['recuperacion']), apl = HAB.measure(st,'tipo',from,to,['aplicacion']), exp = HAB.measure(st,'tipo',from,to,['explicacion','comparacion','error']);
      if(rec.n>=3) medido.acierto_recordar = r2(rec.v);
      if(apl.n>=3) medido.acierto_aplicar = r2(apl.v);
      if(exp.n>=3) medido.acierto_explicar = r2(exp.v);
      if(st.profile && st.profile.picoProductividad){ const w=HAB.measure(st,'inwin',from,to); if(w.n>=6) medido.practica_en_su_mejor_hora = r2(w.v); }
    }

    const p = st.profile||{};
    const bloque = Math.max(10, Math.min(90, (c.methodology&&c.methodology.duration)||30));
    const horas = Math.max(0, Math.min(40, +p.horasSemana||0));
    const perfil = {nivel:String(p.nivel||'').slice(0,30), franja_fuerte:String(p.picoProductividad||'').slice(0,12),
      desafio:String(p.desafio||'').slice(0,40), motivacion:String(p.motivacion||'').slice(0,40)};

    const declarado = {};
    const dom = st.diag && st.diag.dom || {};
    Object.keys(dom).forEach(k=>{ if(dom[k] && dom[k].n>0 && Number.isFinite(dom[k].est)) declarado[k]=Math.round(dom[k].est); });

    const hab = st.habit||{};
    const habito = {};
    if(hab.active) habito.en_prueba = String(hab.active.id).slice(0,30);
    const hist = (hab.history||[]).slice(-3).map(h=>({id:String(h.id).slice(0,30), resultado:String(h.verdict||'').slice(0,20)}));
    if(hist.length) habito.anteriores = hist;

    const intereses = (st.puentes||[]).slice(-5).map(x=>String(x.text||'').slice(0,100)).filter(Boolean);
    const prev = progress(st.coach, st, today, c);

    const out = {hoy:today, dia_semana:WEEKDAY[parse(today).getDay()], perfil,
      minutos_max_semana: horas ? Math.min(horas*60, 1500) : 300, bloque_max_min: bloque,
      materias, medido_14d: medido, declarado_por_el_estudiante_pesa_menos: declarado, habito};
    if(intereses.length) out.dijo_que_le_interesa = intereses;
    if(prev) out.plan_anterior = prev.resumen;
    const pasadas = [];
    (st.subjects||[]).forEach(s=>(s.evals||[]).forEach(e=>{ if(e.result) pasadas.push({d:e.result.d||'', r:{ formato:(e.info&&e.info.formato&&e.info.formato!=='nose')?e.info.formato:undefined, se_sintio:e.result.feel, llego_preparado:e.result.prep||undefined, nota:e.result.nota||undefined }}); }));
    if(pasadas.length) out.resultados_previos = pasadas.sort((a,b)=>a.d<b.d?-1:1).slice(-3).map(x=>x.r);
    return {digest:out, ids};
  }

  /* ── ¿Se cumplió y funcionó el plan? Compara con la práctica real ── */
  function practiceDays(st, from, to){
    const set = new Set();
    (st.evlog||[]).forEach(e=>{ if(e.d>=from && e.d<=to) set.add(e.d); });
    (st.sessionLog||[]).forEach(e=>{ if(e.date>=from && e.date<=to) set.add(e.date); });
    return set;
  }
  function progress(coach, st, today, c){
    if(!coach || !coach.plan) return null;
    const HAB = c&&c.HAB, fecha = coach.fecha, edad = diff(fecha,today);
    const days = practiceDays(st, fecha, today);
    const due = coach.plan.bloques.filter(b=>addDays(fecha,b.dia)<=today);
    const hechos = due.filter(b=>days.has(addDays(fecha,b.dia))).length;
    const metricas = (coach.plan.medir||[]).map(m=>{
      const base = coach.base && coach.base[m.metrica];
      let ahora = null;
      if(HAB){ const r = HAB.measure(st,m.metrica,fecha,today); if(r.n>=2) ahora = r2(r.v); }
      const venc = edad>=m.en_dias;
      let estado = 'en_curso';
      if(ahora===null) estado = venc ? 'sin_datos' : 'en_curso';
      else if(venc) estado = (LOWER_BETTER[m.metrica] ? ahora<=m.meta : ahora>=m.meta) ? 'logrado' : 'no_logrado';
      return {metrica:m.metrica, base:base==null?null:base, ahora, meta:m.meta, en_dias:m.en_dias, estado};
    });
    return {edad, hechos, previstos:due.length, metricas,
      resumen:{hace_dias:edad, bloques_previstos_hasta_hoy:due.length, bloques_con_practica_ese_dia:hechos,
        metricas:metricas.map(m=>({metrica:m.metrica, antes:m.base, ahora:m.ahora, meta:m.meta, estado:m.estado}))}};
  }

  /* Guarda el plan validado junto a su línea base para poder medirlo después */
  function save(st, plan, ids, dig, today){
    st.coach = st.coach||{};
    const hist = (st.coach.history||[]).slice(-3);
    if(st.coach.plan){ const pr = progress(st.coach, st, today, {HAB:root.HAB}); if(pr) hist.push({fecha:st.coach.fecha, hechos:pr.hechos, previstos:pr.previstos}); }
    const base = {};
    ['acc','delayed','calib','days'].forEach(k=>{ const m=dig.medido_14d&&dig.medido_14d[k]; if(m) base[k]=m.valor; });
    st.coach = {plan, ids, fecha:today, base, history:hist};
    return st.coach;
  }

  /* Un bloque de hoy según la fecha de creación del plan */
  function blocksOn(coach, date){
    if(!coach||!coach.plan) return [];
    return coach.plan.bloques.filter(b=>addDays(coach.fecha,b.dia)===date);
  }
  function stale(coach, today){ return !coach || !coach.plan || diff(coach.fecha,today)>=7; }

  const COACH = {digest, progress, save, blocksOn, stale, searchUrl, ACT, FUERA, METRIC_TXT, WEEKDAY, addDays, diff};
  root.COACH = COACH;
  if(typeof module!=='undefined' && module.exports) module.exports = COACH;

  /* ───────── Interfaz (solo navegador) ───────── */
  if(typeof document==='undefined') return;
  const S_ = ()=>(typeof S!=='undefined'?S:root.S);
  const h = s=>root.esc?root.esc(s):String(s);
  const today = ()=>root.todayStr();
  const ctx = ()=>({HAB:root.HAB, SP:root.SP, AREA:root.AREA, methodology:root.getMethodology&&root.getMethodology()});
  const fmtMetric = (k,v)=>v==null?'—':(PCT_METRIC[k]?Math.round(v*100)+' %':String(v));
  function dayLabel(coach, b){
    const d = addDays(coach.fecha,b.dia), off = diff(today(),d);
    return off===0?'Hoy':off===1?'Mañana':off===-1?'Ayer':WEEKDAY[parse(d).getDay()].replace(/^./,c=>c.toUpperCase());
  }
  function say(lines, replies, opts){ return root.TUTOR?root.TUTOR.say(lines,replies,opts):`<div>${h(lines[0]&&lines[0].t||lines[0]||'')}</div>`; }
  function aiReady(){ return typeof root.aiEnabled==='function' && root.aiEnabled() && root.aiTaskOn('plan'); }

  /* Tarjeta en Hoy: una línea y lo de hoy; el detalle vive en la hoja */
  /* Sesión del plan que toca hoy (solo si su materia sigue existiendo y no se hizo ya) */
  root.coachToday = function(){
    const st = S_(), co = st.coach; if(!co||!co.plan||!aiReady()) return null;
    const day = today(), done = practiceDays(st, day, day).size>0;
    if(done) return null;
    for(const b of blocksOn(co,day)){
      const s = (st.subjects||[]).find(x=>x.id===(co.ids&&co.ids[b.materia]));
      if(s && s.items.length) return {b, subject:s, label:(ACT[b.actividad]||[b.actividad])[0]};
    }
    return null;
  };
  /* Cada actividad del plan abre la forma de practicar que le corresponde */
  root.coachRun = function(sid, act){
    const f = {explicar:'startOralFlow', aplicar:'startApplyFlow', simulacro:'startExamSimFlow'}[act];
    if(f && typeof root[f]==='function') root[f](); else root.startSessionFlow(sid);
  };
  root.renderCoach = function(){
    const el = document.getElementById('home-coach'); if(!el) return;
    const st = S_();
    const ok = aiReady() && st.onboarded && (st.subjects||[]).some(s=>s.items&&s.items.length);
    if(!ok){ el.innerHTML=''; return; }
    const co = st.coach;
    if(!co || !co.plan){
      el.innerHTML = `<div class="glass fade-in" style="margin-top:14px;">${say(['Puedo armarte el plan de esta semana con tus datos: qué estudiar, cuánto y qué hacer por fuera.'],[['Armar mi plan','coachAsk()',true]],{compact:true,still:true})}</div>`;
      return;
    }
    const pr = progress(co,st,today(),ctx());
    if(stale(co,today())){
      const ms = pr.metricas.filter(m=>m.estado==='logrado'||m.estado==='no_logrado');
      const res = ms.length ? ms.map(m=>(METRIC_TXT[m.metrica]||m.metrica)+' '+fmtMetric(m.metrica,m.base)+' → '+fmtMetric(m.metrica,m.ahora)).join(' · ') : 'Faltan datos para medirlo.';
      el.innerHTML = `<div class="glass fade-in" style="margin-top:14px;">
        <span class="eyebrow">Tu semana</span>
        <div style="font-size:14px;margin-top:6px;">${pr.hechos} de ${pr.previstos} sesiones con práctica</div>
        <div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:4px;">${h(res)}</div>
        <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="coachAsk()">Armar el plan de la próxima semana</button></div>`;
      return;
    }
    el.innerHTML = `<div class="glass fade-in" style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div><span class="eyebrow">Plan de la semana</span><div class="muted" style="font-size:12.5px;margin-top:3px;">${pr.hechos} de ${pr.previstos} sesiones con práctica hasta hoy</div></div>
      <button class="btn btn-ghost btn-sm" onclick="coachOpen()">Ver plan</button></div>`;
  };
  function subjOf(co,b){
    const sid = co.ids && co.ids[b.materia], s = (S_().subjects||[]).find(x=>x.id===sid);
    return s?s.nombre:'Materia';
  }

  root.coachAsk = async function(){
    if(!aiReady()){ root.showToast('El asesor necesita la IA, que aún no está activa'); return; }
    const st = S_();
    root.openSheet(`<div class="h1" style="font-size:20px;">Armando tu plan</div>${say(['Estoy mirando tu práctica, tus exámenes y cómo te ha ido…'],[],{compact:true})}`);
    const {digest:dig, ids} = digest(st, today(), ctx());
    if(!dig.materias.length){ root.closeSheet(); root.showToast('Primero añade preguntas a una materia'); return; }
    const r = await root.aiCall('plan', {digest:dig});
    if(!r || !Array.isArray(r.bloques) || !r.bloques.length){
      root.openSheet(`<div class="h1" style="font-size:20px;">No pude armarlo ahora</div><div class="muted" style="margin-top:6px;">Tu plan de hoy sigue igual. Inténtalo más tarde.</div><button class="btn btn-ghost btn-block" onclick="closeSheet()">Cerrar</button>`);
      return;
    }
    // Defensa en el cliente: el plan solo puede referirse a materias que enviamos
    r.bloques = r.bloques.filter(b=>ids[b.materia] && ACT[b.actividad]);
    if(!r.bloques.length){ root.closeSheet(); root.showToast('El plan no salió bien. Intenta de nuevo'); return; }
    save(st, r, ids, dig, today()); root.saveState();
    if(typeof root.track==='function') root.track('coach_plan',{bloques:r.bloques.length});
    root.renderCoach(); if(typeof root.renderHome==='function') root.renderHome(); root.coachOpen();
  };

  root.coachOpen = function(){
    const st = S_(), co = st.coach;
    if(!co||!co.plan){ root.coachAsk(); return; }
    const p = co.plan, pr = progress(co,st,today(),ctx());
    const byDay = {};
    p.bloques.forEach(b=>{ (byDay[b.dia]=byDay[b.dia]||[]).push(b); });
    const days = Object.keys(byDay).map(Number).sort((a,b)=>a-b);
    const blocks = days.map(d=>`<div style="margin-top:12px;"><div class="eyebrow">${h(dayLabel(co,byDay[d][0]))}</div>${byDay[d].map(b=>{
      const hoy = addDays(co.fecha,b.dia)===today();
      return `<div class="hub-tool" style="margin-top:6px;"><div style="font-weight:600;">${h(subjOf(co,b))} · ${b.minutos} min</div>
        <div style="font-size:13px;margin-top:2px;">${h((ACT[b.actividad]||[b.actividad])[0])}${b.foco?': '+h(b.foco):''}</div>
        <div class="muted" style="font-size:12px;line-height:1.45;margin-top:2px;">${h((ACT[b.actividad]||['',''])[1])}</div>
        ${b.por_que?`<div class="muted" style="font-size:12px;line-height:1.45;margin-top:4px;">Porque: ${h(b.por_que)}</div>`:''}
        ${hoy?`<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="closeSheet();coachRun('${h(co.ids[b.materia]||'')}','${b.actividad}')">Empezar</button>`:''}</div>`;
    }).join('')}</div>`).join('');
    const fuera = (p.fuera||[]).map((f,i)=>{
      const u = searchUrl(f.tipo,f.busca);
      return `<div class="hub-tool" style="margin-top:6px;"><div class="eyebrow" style="color:var(--brass);">${h(FUERA[f.tipo]||f.tipo)} · ${f.minutos} min</div>
        <div style="font-size:13px;margin-top:2px;">${h(f.para||f.busca)}</div>
        <div class="muted" style="font-size:12px;margin-top:2px;">Busca: «${h(f.busca)}»</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">${u?`<a class="btn btn-ghost btn-sm" href="${h(u)}" target="_blank" rel="noopener">Buscar ↗</a>`:`<button class="btn btn-ghost btn-sm" onclick="coachCopy(${i},this)">Copiar instrucción</button>`}</div></div>`;
    }).join('');
    const med = pr.metricas.map(m=>{
      const est = {en_curso:'en curso', logrado:'lo lograste', no_logrado:'no se logró', sin_datos:'faltan datos'}[m.estado];
      return `<div class="fx-row" style="margin-top:6px;"><div><b>${h(METRIC_TXT[m.metrica]||m.metrica)}</b><small>${fmtMetric(m.metrica,m.base)} → ${fmtMetric(m.metrica,m.ahora)} · meta ${fmtMetric(m.metrica,m.meta)} en ${m.en_dias} d · ${est}</small></div></div>`;
    }).join('');
    root.openSheet(`<div class="h1" style="font-size:20px;">Tu plan</div>
      ${p.ajuste?`<div class="muted" style="font-size:13px;margin-top:6px;line-height:1.5;">${h(p.ajuste)}</div>`:''}
      <div style="font-size:14px;line-height:1.55;margin-top:8px;">${h(p.diagnostico)}</div>
      ${blocks}
      ${fuera?`<div class="eyebrow" style="margin-top:16px;">Por fuera de Catedra</div>${fuera}`:''}
      ${med?`<div class="eyebrow" style="margin-top:16px;">Lo que mediremos · ${pr.hechos} de ${pr.previstos} sesiones previstas con práctica</div>${med}`:''}
      <div class="muted" style="font-size:11px;line-height:1.5;margin-top:14px;">Propuesta hecha con IA a partir de tus datos. No es un diagnóstico: si algo no te sirve, dímelo actualizando el plan y lo ajusto.</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="coachAsk()">Actualizar plan</button>
      <button class="btn btn-ghost btn-block" onclick="closeSheet()">Cerrar</button>`);
  };
  root.coachCopy = function(i, btn){
    const f = ((S_().coach||{}).plan||{}).fuera; const x = f&&f[i]; if(!x) return;
    const t = x.tipo==='persona'
      ? 'Hola, necesito ayuda con: '+x.busca+'. ¿Me lo podrías explicar con un ejemplo?'
      : 'Actúa como mi tutor. Quiero entender: '+x.busca+'. No me des la respuesta directa: hazme una pregunta a la vez y corrígeme si me equivoco.';
    const done = ()=>{ if(btn) btn.textContent='Copiada ✓'; };
    try{ navigator.clipboard.writeText(t).then(done,()=>{ window.prompt('Copia esta instrucción:',t); done(); }); }catch(e){ window.prompt('Copia esta instrucción:',t); done(); }
  };

  /* ───────── Entender un material: resumen, ideas clave, plan de estudio y casos de la vida real ───────── */
  let _last = null;
  root.understandMaterial = async function(sid, text){
    const st = S_(), s = st.subjects.find(x=>x.id===sid);
    text = String(text||'').trim();
    if(text.length<200){ root.showToast('Pega un texto un poco más largo para poder resumirlo'); return; }
    if(!(typeof root.aiEnabled==='function' && root.aiEnabled() && root.aiTaskOn('digest'))){ root.showToast('Esto necesita la IA, que aún no está activa'); return; }
    root.openSheet(`<div class="h1" style="font-size:20px;">Leyendo tu material</div>${say(['Voy a sacar lo esencial, armarte un plan para estudiarlo y buscar dónde lo vas a usar…'],[],{compact:true})}`);
    const mine = (st.puentes||[]).filter(x=>x.sid===sid).concat((st.puentes||[]).filter(x=>x.sid!==sid)).slice(0,5).map(x=>x.text);
    const dias = s&&s.examDate?diff(today(),s.examDate):null;
    const r = await root.aiCall('digest',{text:text.slice(0,12000), area:(s&&root.AREA)?root.AREA.of(s):undefined, dias_examen:dias!==null&&dias>=0?dias:undefined, intereses:mine});
    if(!r || !r.resumen){
      root.openSheet(`<div class="h1" style="font-size:20px;">No pude resumirlo</div><div class="muted" style="margin-top:6px;">Prueba con un texto más claro o más corto.</div><button class="btn btn-ghost btn-block" onclick="closeSheet()">Cerrar</button>`);
      return;
    }
    _last = {sid, text, r};
    if(typeof root.track==='function') root.track('digest_ok',{conceptos:(r.conceptos||[]).length});
    const list = (a,fn)=>(a||[]).map(fn).join('');
    root.openSheet(`<div class="h1" style="font-size:20px;">Lo esencial${s?' · '+h(s.nombre):''}</div>
      <div style="font-size:14px;line-height:1.55;margin-top:8px;">${h(r.resumen)}</div>
      <div class="eyebrow" style="margin-top:14px;">Ideas clave</div>
      ${list(r.conceptos,c=>`<div class="hub-tool" style="margin-top:6px;"><div style="font-weight:600;">${h(c.termino)}</div><div style="font-size:13px;margin-top:2px;">${h(c.idea)}</div><div class="cita" style="margin-top:4px;">"${h(c.cita)}"</div></div>`)}
      ${(r.sesiones||[]).length?`<div class="eyebrow" style="margin-top:14px;">Cómo estudiarlo</div>${list(r.sesiones,(x,i)=>`<div style="font-size:13.5px;margin-top:6px;"><b>${i+1}.</b> ${x.minutos} min · ${h((ACT[x.actividad]||[x.actividad])[0])}: ${h(x.foco)}</div>`)}`:''}
      ${(r.aplicaciones||[]).length?`<div class="eyebrow" style="margin-top:14px;">Dónde lo vas a usar</div>${list(r.aplicaciones,a=>`<div class="hub-tool" style="margin-top:6px;"><div style="font-size:13.5px;line-height:1.5;">${h(a.situacion)}</div><div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:4px;">${a.concepto?'<b>'+h(a.concepto)+':</b> ':''}${h(a.como_usarlo)}</div></div>`)}`:''}
      ${(r.dudas||[]).length?`<div class="eyebrow" style="margin-top:14px;">Ojo con esto</div>${list(r.dudas,d=>`<div class="muted" style="font-size:13px;margin-top:4px;">• ${h(d)}</div>`)}`:''}
      <div class="muted" style="font-size:11px;line-height:1.5;margin-top:14px;">Hecho con IA. Las ideas clave llevan una cita del texto para que lo compruebes; los casos de la vida real son ejemplos, no parte de tu material.</div>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" onclick="understandSave()">Guardar en Cerebro</button>
      <button class="btn btn-ghost btn-block" onclick="understandQuestions()">Crear preguntas con este texto</button>
      <button class="btn btn-ghost btn-block" onclick="closeSheet()">Cerrar</button>`);
  };
  root.understandSave = function(){
    if(!_last) return;
    const r = _last.r;
    const md = `## Resumen\n${r.resumen}\n\n## Ideas clave\n${(r.conceptos||[]).map(c=>`- **${c.termino}**: ${c.idea}`).join('\n')}\n\n`
      + ((r.sesiones||[]).length?`## Cómo estudiarlo\n${r.sesiones.map((x,i)=>`${i+1}. ${x.minutos} min · ${(ACT[x.actividad]||[x.actividad])[0]}: ${x.foco}`).join('\n')}\n\n`:'')
      + ((r.aplicaciones||[]).length?`## Dónde lo vas a usar\n${r.aplicaciones.map(a=>`- ${a.situacion} → ${a.como_usarlo}`).join('\n')}\n`:'');
    root.addNote({title:'Resumen · '+(r.conceptos[0]?r.conceptos[0].termino:'material'), text:md, source:'resumen', subjectId:_last.sid});
    root.closeSheet(); root.showToast('Guardado en Cerebro');
    if(typeof root.renderCerebro==='function') root.renderCerebro();
  };
  root.understandQuestions = async function(){
    if(!_last) return;
    const {sid,text} = _last; root.closeSheet(); root.showToast('Creando preguntas…');
    const n = await root.generateFromText(text, sid, {});
    if(typeof root.renderMaterialsSubjectGen==='function') root.renderMaterialsSubjectGen(sid);
    root.showToast(n?root.genToast(n):'No se pudieron crear preguntas');
  };
  root.understandFromPaste = function(sid){
    const el = document.getElementById('material-text-'+sid);
    root.understandMaterial(sid, el?el.value:'');
  };
  root.understandFromNote = function(){
    const c = (typeof curNote!=='undefined')?curNote:null; if(!c||!c.subjectId){ root.showToast('Elige una materia arriba'); return; }
    const t = document.getElementById('note-text');
    root.understandMaterial(c.subjectId, t?t.value:c.text);
  };
})(typeof window!=='undefined' ? window : globalThis);
