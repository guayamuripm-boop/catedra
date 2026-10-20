'use strict';
/* Catedra · Agenda: UN solo cerebro de "qué sigue ahora". Puro (sin DOM), probado en tests/agenda.test.js.
   Antes había dos lógicas que divergían: la cascada del héroe en app.html (renderProtagonist) y
   VOICE.nextStep en voice.js. Ahora ambas consumen AGENDA.rank, que devuelve UNA lista ordenada de
   candidatos. Cada candidato trae un `action` (string) que la UI mapea a la función real, y `fn`
   (el onclick histórico). `heroOnly:true` = solo tarjeta protagonista en Hoy (rescate); nextStep lo excluye. */
(function(root){
  const DAY = 864e5;
  function parse(s){ const p = String(s).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
  function daysTo(today, ds){ return Math.round((parse(ds)-parse(today))/DAY); }
  const faltaInfo = e => { const i=e.info||{}; return !i.formato||i.formato==='nose'||!i.material||i.material==='nose'||(!(e.unitIds&&e.unitIds.length)&&!i.temas); };

  function weekCredit(st, today){
    const d=parse(today); d.setDate(d.getDate()-((d.getDay()+6)%7)); const ws=iso(d), we=addDays(ws,6);
    return (st.focusLog||[]).filter(e=>e.d>=ws&&e.d<=we).reduce((a,e)=>a+(e.credit||0),0);
  }
  function weekLine(credit, goal){
    if(!(goal>0)) return '';
    if(credit>=goal) return 'Tu semilla ya floreció esta semana. Todo lo que sumes ahora es ganancia.';
    const left=goal-credit;
    if(credit===0) return 'Esta semana aún no siembras. Con '+Math.min(15,goal)+' minutos ya empieza a brotar.';
    return 'Te faltan '+left+' min para que tu semilla florezca esta semana.';
  }

  function rank(st, today, opts){
    opts = opts || {}; const skip = opts.skip || []; today = today || iso(new Date());
    const subs = st.subjects || []; const out = [];
    const push = c => { if(!skip.includes(c.k)) out.push(c); };

    let rescue = null;
    for(const s of subs){
      const d = s.examDate ? daysTo(today, s.examDate) : null;
      if(d!==null && d>=0 && d<=1 && (s.items||[]).length){ if(!rescue || d < rescue.d) rescue = { s, d }; }
    }
    if(rescue) push({ k:'rescate', action:'rescue', heroOnly:true, urgency:100, subjectId:rescue.s.id, reason:'examen inminente',
      text:(rescue.d===0?'Hoy':'Mañana')+' tienes examen de '+rescue.s.nombre, sub:'Rescatemos lo esencial: lo más débil primero.',
      fn:"startSessionFlow('"+rescue.s.id+"')", label:'Rescatar' });

    const ex = st.experiment;
    if(ex && ex.phase==='wait' && daysTo(ex.startedAt, today)>=2) push({ k:'experimento', action:'open-experiment', urgency:90, reason:'experimento listo',
      text:'Tu experimento está listo', sub:'Tengo 8 preguntas para ti. En 2 minutos vemos qué te funcionó.', fn:'openExperiment()', label:'Ver' });

    for(const s of subs) for(const e of (s.evals||[])){
      const d = e.fecha ? daysTo(today, e.fecha) : null;
      if(d!==null && d<0 && d>=-21 && !e.result){
        push({ k:'resultado', action:'report-exam', urgency:80, subjectId:s.id, evalId:e.id, reason:'medir resultado real',
          text:'¿Cómo te fue en '+e.nombre+' de '+s.nombre+'?', sub:'Cuéntame en 10 segundos. Así sé si lo que te propongo te está sirviendo.',
          fn:"openEvalResult('"+s.id+"','"+e.id+"')", label:'Contar' }); break;
      }
    }

    const due = subs.map(s=>({ s, n:(s.items||[]).filter(i=>i.nextReviewDate<=today).length })).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)[0];
    if(due){
      let wReason = 'repasos vencidos';
      const PROFILE = (root.PROFILE || (typeof module!=='undefined' && require('./profile.js')));
      const weak = (PROFILE && PROFILE.weakestDomain) ? PROFILE.weakestDomain(st) : null;
      if(weak){ const names={CON:'Concentración',TIE:'Tiempo',PRO:'Retención',AUT:'Autoevaluación',ANS:'Calma ante examen',MOT:'Motivación',EXA:'Estrategia de examen',REC:'Recursos',SUE:'Descanso'}; wReason = 'reforzamos '+names[weak].toLowerCase(); }
      push({ k:'repaso', action:'start-session', urgency:70, subjectId:due.s.id, reason:wReason,
        text:'Te tocan '+due.n+' pregunta'+(due.n===1?'':'s')+' de '+due.s.nombre, sub:'Unos '+Math.max(2,Math.round(due.n*0.6))+' min. Si las recuerdas hoy, se te quedan.',
        fn:"startSessionFlow('"+due.s.id+"')", label:'Repasar' });
    }

    const pend = (st.pendingItems||[]).filter(p=>subs.some(s=>s.id===p.subjectId));
    if(pend.length) push({ k:'revisar', action:'review-pending', urgency:60, reason:'preguntas por aprobar',
      text:'Te preparé '+pend.length+' pregunta'+(pend.length===1?'':'s')+' nueva'+(pend.length===1?'':'s'), sub:'Revísalas tú: quédate solo con las que te sirvan.',
      fn:"goTab('materials')", label:'Revisar' });

    const mat = (st.materials||[]).find(m=>m.estado==='recibido'&&subs.some(s=>s.id===m.subjectId));
    if(mat) push({ k:'material', action:'convert-material', urgency:50, reason:'material sin convertir',
      text:'Tengo «'+(mat.titulo||'tu material').slice(0,40)+'» sin convertir', sub:'Dame un minuto y te hago preguntas con eso.',
      fn:"goTab('materials')", label:'Convertir' });

    for(const s of subs) for(const e of (s.evals||[])){
      const d = e.fecha ? daysTo(today, e.fecha) : null;
      if(d!==null && d>=0 && d<=14 && faltaInfo(e)){
        push({ k:'averiguar', action:'ask-exam', urgency:40, subjectId:s.id, evalId:e.id, reason:'armar práctica a medida',
          text:'Cuéntame cómo será '+e.nombre+' de '+s.nombre, sub:'Faltan '+d+' día'+(d===1?'':'s')+'. Con el formato y los temas te armo la práctica a la medida.',
          fn:"openAsks('"+s.id+"','"+e.id+"')", label:'Contarte' }); break;
      }
    }

    const goal = st.focusGoal||90, cr = weekCredit(st, today);
    if(cr<goal && subs.length){
      let fReason = 'meta de enfoque';
      const PROFILE = (root.PROFILE || (typeof module!=='undefined' && require('./profile.js')));
      const weak = (PROFILE && PROFILE.weakestDomain) ? PROFILE.weakestDomain(st) : null;
      if(weak){ const names={CON:'Concentración',TIE:'Tiempo',PRO:'Retención',AUT:'Autoevaluación',ANS:'Calma ante examen',MOT:'Motivación',EXA:'Estrategia de examen',REC:'Recursos',SUE:'Descanso'}; fReason = 'reforzamos '+names[weak].toLowerCase(); }
      push({ k:'enfoque', action:'open-focus', urgency:30, reason:fReason,
        text:'Te propongo 15 minutos de enfoque', sub:weekLine(cr,goal), fn:'openFocus()', label:'Enfocarme' });
    }

    if(!subs.some(s=>(s.items||[]).length)) push({ k:'add-material', action:'convert-material', urgency:20, reason:'aún no hay material',
      text:'Pásame el material de tu próxima clase', sub:'Te hago preguntas con él y tú decides cuáles quedan.', fn:"goTab('materials')", label:'Añadir' });

    out.push({ k:'descanso', action:'rest', urgency:0, reason:'al día',
      text:'Por hoy es suficiente', sub:'Volver mañana te rinde más que seguir hoy. Nos vemos.', fn:'', label:'' });

    return out.sort((a,b)=>b.urgency-a.urgency);
  }

  function next(st, today, skip){ return rank(st, today, { skip }).filter(c=>!c.heroOnly)[0]; }

  const AGENDA = { rank, next };
  root.AGENDA = AGENDA;
  if(typeof module!=='undefined' && module.exports) module.exports = AGENDA;
})(typeof window!=='undefined' ? window : globalThis);