'use strict';
/* Catedra · Lógica pura de recordatorios (fuente de verdad testeada). La Edge Function la porta a TS. */
(function(root){
  function dueFor(pref, now) {
    if (!pref?.enabled) return null;
    const tz = pref.tz || 'America/Caracas';
    const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const picoHour = pref.pico_hour ?? 15;
    const lastActive = pref.last_active_at ? new Date(pref.last_active_at) : null;
    const nextExam = pref.next_exam_at ? new Date(pref.next_exam_at) : null;

    // slip: ≥3 días sin actividad
    if (lastActive) {
      const diffDays = Math.floor((nowLocal - lastActive) / 864e5);
      if (diffDays >= 3) return 'slip';
    }

    // exam-eve: examen en 12-24h
    if (nextExam) {
      const diffMs = nextExam - nowLocal;
      const diffHours = diffMs / 3.6e6;
      if (diffHours >= 12 && diffHours <= 24) return 'exam-eve';
      // exam-morning: mismo día del examen en hora pico
      const sameDay = nextExam.toDateString() === nowLocal.toDateString();
      if (sameDay && nowLocal.getHours() === picoHour) return 'exam-morning';
    }

    // daily: hora pico local y hay algo que repasar (en server no sabemos, mandamos suave 1×/día)
    if (nowLocal.getHours() === picoHour) return 'daily';

    return null;
  }

  function messageFor(kind) {
    const msgs = {
      'exam-eve': { title: 'Mañana tienes examen', body: 'Repasa lo esencial 15 min. Te va a ir mejor.', url: '/app' },
      'exam-morning': { title: 'Hoy es el examen', body: 'Un último repaso rápido y a confiar. ¡Suerte!', url: '/app' },
      'daily': { title: 'Hora de estudiar', body: 'Tu bloque de hoy te espera. 15 min y listo.', url: '/app' },
      'slip': { title: 'Llevas 3 días sin estudiar', body: 'Vuelve con una sesión corta. Recuperas el ritmo en 5 min.', url: '/app' }
    };
    return msgs[kind] || { title: 'Catedra', body: 'Tienes algo pendiente', url: '/app' };
  }

  root.REMINDERS = { dueFor, messageFor };
  if(typeof module!=='undefined' && module.exports) module.exports = { dueFor, messageFor };
})(typeof window!=='undefined' ? window : globalThis);