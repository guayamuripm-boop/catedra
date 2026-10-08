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

    const lesson=LESSONS.find(l=>!st.lessonsShown||!st.lessonsShown[l.id]);
    if(lesson) return {kind:'lesson', id:lesson.id, text:lesson.title+'. '+lesson.body};

    const hour=new Date().getHours();
    return {kind:'flavor', text:pick(GREETING_FLAVOR[hourBand(hour)], daySeed('g'))};
  }

  function habitRemark(verdict){
    const list=VERDICT_VOICE[verdict]; if(!list) return '';
    return pick(list, daySeed('v'+verdict));
  }

  root.VOICE={contextLine, habitRemark, LESSONS};
})(typeof window!=='undefined' ? window : globalThis);
