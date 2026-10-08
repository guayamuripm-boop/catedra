'use strict';
/* Catedra · Voz: companero inteligente con contexto, no porrista.
   Una sola señal a la vez (nunca varias tarjetas apiladas): primero lo que viene del
   motor de diagnóstico (control de perfil, simulacro), luego patrones de comportamiento
   (materia abandonada, sobreconfianza, sesión larga), luego un tip con evidencia, y si
   no hay nada que decir, una línea de ambiente según la hora. */
(function(root){
  const DAY=864e5;

  const LESSONS=[
    {id:'recall',title:'Recordar > releer',body:'Intentar recordar fortalece más que releer.'},
    {id:'spacing',title:'Poco cada día',body:'10 min/día supera 3h de una vez.'},
    {id:'illusion',title:'Ilusión de saber',body:'Sentir que sabes no es poder recordarlo.'},
    {id:'interleave',title:'Mezclar ayuda',body:'Temas mezclados = mejor discriminación.'},
    {id:'feynman',title:'Explica para aprender',body:'Si no puedes explicarlo, no lo entiendes.'},
    {id:'errors',title:'Errar aquí, acertar allá',body:'Los errores fortalecen más que los aciertos.'},
    {id:'breaks',title:'Pausas consolidan',body:'Después de 40 min, descansa 5.'},
    {id:'sleep',title:'Dormir es estudiar',body:'7 h de sueño > 3 h extra de repaso.'},
    {id:'preexam',title:'Semana pre-examen',body:'No aprendas nuevo. Repasa y descansa.'},
    {id:'aiuse',title:'IA: asistente, no sustituto',body:'Genera preguntas, no respuestas.'}
  ];

  const VERDICT_VOICE={
    mejoro:['Esto funcionó. Lo mantenemos.','Los datos lo confirman: mejor así.'],
    igual:['Sin cambio claro. No es un fracaso, es un dato.','No movió la aguja. Probamos otra idea.'],
    empeoro:['Esto no te está funcionando. Cambiamos de estrategia.','No ayudó. Mejor saberlo ahora que después.']
  };

  const GREETING_FLAVOR={
    madrugada:['Trasnochando. El sueño también estudia por ti.'],
    manana:['La mente está más fresca ahora que en la noche.'],
    tarde:['Buen momento para un empujón corto.'],
    noche:['Cerrando el día. Algo corto también cuenta.']
  };

  function hourBand(h){ return h<6?'madrugada':h<12?'manana':h<19?'tarde':'noche'; }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function daySeed(extra){
    const d=new Date(); let s=d.getFullYear()*372+d.getMonth()*31+d.getDate();
    if(extra) for(let i=0;i<extra.length;i++) s+=extra.charCodeAt(i);
    return Math.abs(s);
  }
  function pick(list,seed){ return list[seed%list.length]; }

  /* Devuelve UNA señal de contexto o null. st = estado global (S). */
  function contextLine(st){
    const dn=(typeof diagNudges==='function')?diagNudges():[];
    if(dn.length) return {kind:'action', text:dn[0].text, action:dn[0].action, fn:dn[0].fn};

    const today=iso(new Date());
    for(const s of (st.subjects||[])){
      if(!s.items.length) continue;
      const daysSince=s.lastActivity?Math.round((new Date(today)-new Date(s.lastActivity))/DAY):99;
      if(daysSince>=5){
        const scores=s.items.flatMap(it=>it.recallScores||[]);
        const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:100;
        if(avg<60) return {kind:'nudge', text:s.nombre+' lleva '+daysSince+' días sin ti y la retención bajó. 5 minutos rompen el olvido.', sid:s.id};
      }
    }
    const allConf=(st.subjects||[]).flatMap(s=>s.items.flatMap(it=>it.confidences||[]));
    const highConf=allConf.filter(c=>c.conf===3);
    if(highConf.length>=5 && highConf.filter(c=>c.score<100).length/highConf.length>0.4){
      return {kind:'nudge', text:'Te sientes más seguro de lo que realmente dominas. Vale la pena ponerte a prueba.'};
    }
    const minToday=(st.sessionLog||[]).filter(sl=>sl.date===today).reduce((a,sl)=>a+sl.minutes,0);
    if(minToday>45) return {kind:'nudge', text:'Ya llevas '+minToday+' min hoy. Una pausa ayuda a que esto se quede.'};

    if((st.focusLog||[]).length){
      const g=st.focusGoal||90, cr=weekCredit(st,today);
      if(cr<g) return {kind:'action', text:weekLine(cr,g), action:'Enfocarme', fn:'openFocus()'};
    }

    const lesson=LESSONS.find(l=>!st.lessonsShown||!st.lessonsShown[l.id]);
    if(lesson) return {kind:'lesson', id:lesson.id, text:lesson.title+'. '+lesson.body};

    const hour=new Date().getHours();
    return {kind:'flavor', text:pick(GREETING_FLAVOR[hourBand(hour)], daySeed('g'))};
  }

  function habitRemark(verdict){
    const list=VERDICT_VOICE[verdict]; if(!list) return '';
    return pick(list, daySeed('v'+verdict));
  }

  /* ── Semana de enfoque (mismo cálculo que focus.js, sin depender de él) ── */
  function parse(s){ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
  function weekCredit(st,today){
    const d=parse(today); d.setDate(d.getDate()-((d.getDay()+6)%7)); const ws=iso(d), we=addDays(ws,6);
    return (st.focusLog||[]).filter(e=>e.d>=ws&&e.d<=we).reduce((a,e)=>a+(e.credit||0),0);
  }
  function daysTo(today,ds){ return Math.round((parse(ds)-parse(today))/DAY); }
  function weekLine(credit,goal){
    if(!(goal>0)) return '';
    if(credit>=goal) return 'Tu semilla ya floreció esta semana. Lo que sumes ahora es ganancia.';
    const left=goal-credit;
    if(credit===0) return 'Esta semana aún no siembras. Con '+Math.min(15,goal)+' minutos ya empieza a brotar.';
    return 'Te faltan '+left+' min para que tu semilla florezca esta semana.';
  }

  /* ── Siguiente paso: una sola sugerencia de un toque, la más útil ahora. El estudiante puede ignorarla. ── */
  function nextStep(st,today,skip){
    skip=skip||[]; today=today||iso(new Date());
    const subs=st.subjects||[];
    const due=subs.map(s=>({s,n:(s.items||[]).filter(i=>i.nextReviewDate<=today).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)[0];
    if(due&&!skip.includes('repaso')) return {k:'repaso', text:'Repasa '+due.n+' pregunta'+(due.n===1?'':'s')+' de '+due.s.nombre, sub:'Unos '+Math.max(2,Math.round(due.n*0.6))+' min. Recordarlo hoy es lo que evita olvidarlo.', fn:"startSessionFlow('"+due.s.id+"')", label:'Repasar'};
    const pend=(st.pendingItems||[]).filter(p=>subs.some(s=>s.id===p.subjectId));
    if(pend.length&&!skip.includes('revisar')) return {k:'revisar', text:'Tienes '+pend.length+' pregunta'+(pend.length===1?'':'s')+' nueva'+(pend.length===1?'':'s')+' por revisar', sub:'Un vistazo y entran a tu repaso.', fn:"goTab('materials')", label:'Revisar'};
    const mat=(st.materials||[]).find(m=>m.estado==='recibido'&&subs.some(s=>s.id===m.subjectId));
    if(mat&&!skip.includes('material')) return {k:'material', text:'Tu material «'+(mat.titulo||'sin título').slice(0,40)+'» aún no tiene preguntas', sub:'Convertirlo te toma un minuto.', fn:"goTab('materials')", label:'Convertir'};
    for(const s of subs) for(const e of (s.evals||[])){
      const d=e.fecha?daysTo(today,e.fecha):null;
      if(d!==null&&d>=0&&d<=14&&(e.asks||[]).some(a=>!a.done)&&!skip.includes('averiguar'))
        return {k:'averiguar', text:'Averigua qué entra en '+e.nombre+' de '+s.nombre, sub:'Faltan '+d+' día'+(d===1?'':'s')+'. Saberlo cambia cómo conviene estudiar.', fn:"openAsks('"+s.id+"','"+e.id+"')", label:'Ver lista'};
    }
    const goal=st.focusGoal||90, cr=weekCredit(st,today);
    if(cr<goal&&subs.length&&!skip.includes('enfoque')) return {k:'enfoque', text:'Una sesión de enfoque de 15 min', sub:weekLine(cr,goal), fn:'openFocus()', label:'Enfocarme'};
    if(!subs.some(s=>(s.items||[]).length)&&!skip.includes('material')) return {k:'material', text:'Añade el material de tu próxima clase', sub:'Lo convertimos en preguntas y tú decides cuáles quedan.', fn:"goTab('materials')", label:'Añadir'};
    return {k:'descanso', text:'Por hoy está bien', sub:'Volver mañana rinde más que seguir hoy: repartir es de lo que más funciona.', fn:'', label:''};
  }

  /* ── Tu primera semana: cinco pasos que enseñan las herramientas usándolas ── */
  function firstWeek(st){
    const subs=st.subjects||[], withItems=subs.find(s=>(s.items||[]).length);
    const h=st.habit||{};
    const steps=[
      {k:'material', n:'Añade material', done:!!withItems||(st.materials||[]).length>0, fn:"goTab('materials')"},
      {k:'repaso', n:'Tu primer repaso', done:(st.sessionLog||[]).some(x=>!x.focus), fn:withItems?"startSessionFlow('"+withItems.id+"')":"goTab('materials')"},
      {k:'enfoque', n:'Una sesión de enfoque', done:(st.focusLog||[]).length>0, fn:'openFocus()'},
      {k:'evaluacion', n:'Anota una evaluación', done:subs.some(s=>(s.evals||[]).length), fn:subs[0]?"openEvalSheet('"+subs[0].id+"')":"goTab('materials')"},
      {k:'habito', n:'Elige tu primer hábito', done:!!(h.active||(h.history||[]).length), fn:"startDiagnostic({mode:'control',domains:['PRO','TIE','AUT','CON'],onFinish:()=>goTab('home')})"}
    ];
    const done=steps.filter(s=>s.done).length;
    return {steps, done, next:steps.find(s=>!s.done)||null};
  }

  /* ── Después de una sesión de enfoque ── */
  function afterFocus(e,prevSt,newSt){
    if(e.credit<e.min) return {t:'Sesión a medias', s:'Te costó quedarte, pasa. La próxima, con el celular lejos, vale completa.', grew:false};
    if(newSt>prevSt&&newSt>=4) return {t:'Tu semilla floreció', s:'Cumpliste tu meta de la semana. Lo que sumes ahora es ganancia.', grew:true};
    if(newSt>prevSt) return {t:'Tu semilla creció', s:'Cada sesión enfocada deja huella. Mañana sumas otra.', grew:true};
    if(!e.leaves) return {t:'Enfoque limpio', s:'Sin salir ni una vez. Así es como se queda.', grew:false};
    return {t:'Sesión hecha', s:'Volviste a enfocarte, y eso es lo que cuenta.', grew:false};
  }
  /* ── Después de un repaso ── */
  function afterSession(correct,total){
    if(!total) return '';
    const r=correct/total;
    if(r>=0.8) return 'Lo tienes. Esas preguntas volverán más espaciadas.';
    if(r>=0.5) return 'Vas bien. Lo que falló vuelve pronto: así se fija.';
    return 'Hoy costó, y también sirve: intentar recordar, aunque falles, fija más que releer.';
  }

  const VOICE={contextLine, habitRemark, LESSONS, weekLine, nextStep, firstWeek, afterFocus, afterSession, weekCredit};
  root.VOICE=VOICE;
  if(typeof module!=='undefined'&&module.exports) module.exports=VOICE;
})(typeof window!=='undefined' ? window : globalThis);
