'use strict';
/* Catedra · Lógica pura de recordatorios (fuente de verdad testeada).
   La Edge Function importa/porta esta lógica. */
(function(root){
  const MS_DAY = 86400000;
  const MS_HOUR = 3600000;

  function parseISO(s){ return s ? new Date(s) : null; }

  // Devuelve: 'exam-eve' | 'exam-morning' | 'daily' | 'slip' | null
  function due(pref, now){
    if(!pref || !pref.enabled) return null;
    const nowMs = now.getTime();
    const tz = pref.tz || 'America/Caracas';

    // exam-eve: next_exam_at entre ahora+12h y ahora+24h
    if(pref.next_exam_at){
      const exam = parseISO(pref.next_exam_at);
      if(exam){
        const diff = exam.getTime() - nowMs;
        if(diff >= 12*MS_HOUR && diff <= 24*MS_HOUR) return 'exam-eve';
        // exam-morning: mismo día del examen, en la hora pico
        const todayLocal = new Date(now.toLocaleString('en-US', {timeZone: tz}));
        const examLocal = new Date(exam.toLocaleString('en-US', {timeZone: tz}));
        if(todayLocal.toDateString() === examLocal.toDateString()){
          const pico = pref.pico_hour != null ? pref.pico_hour : 18;
          if(todayLocal.getHours() === pico) return 'exam-morning';
        }
      }
    }

    // slip: last_active_at >= 3 días
    if(pref.last_active_at){
      const last = parseISO(pref.last_active_at);
      if(last && (nowMs - last.getTime()) >= 3*MS_DAY) return 'slip';
    }

    // daily: hora local == pico_hour (suave 1x/día)
    const localNow = new Date(now.toLocaleString('en-US', {timeZone: tz}));
    const pico = pref.pico_hour != null ? pref.pico_hour : 18;
    if(localNow.getHours() === pico) return 'daily';

    return null;
  }

  function messageFor(kind){
    switch(kind){
      case 'exam-eve': return {title:'Examen mañana', body:'Repasa lo esencial hoy. 15 min marcan la diferencia.', url:'/app'};
      case 'exam-morning': return {title:'Hoy es el examen', body:'Último repaso ligero y a confiar. ¡Tú puedes!', url:'/app'};
      case 'slip': return {title:'Llevas 3 días sin estudiar', body:'Vuelve con 10 min. Lo que hiciste no se pierde.', url:'/app'};
      case 'daily': return {title:'Hora de repasar', body:'Tu momento pico. Abre la app y repasa 5 min.', url:'/app'};
      default: return {title:'Catedra', body:'Tu momento de estudiar', url:'/app'};
    }
  }

  const REMINDERS = { due, messageFor };
  root.REMINDERS = REMINDERS;
  if(typeof module!=='undefined' && module.exports) module.exports = REMINDERS;
})(typeof window!=='undefined' ? window : globalThis);