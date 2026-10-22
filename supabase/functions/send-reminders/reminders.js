// Catedra · Lógica pura de recordatorios push. ÚNICA fuente: la importa la Edge Function (index.ts)
// y la prueba tests/reminders.test.js. No toca red ni base de datos.
//
// Reglas de respeto al estudiante:
//  - como máximo UN aviso por día (last_sent_on),
//  - solo a su hora pico, y nunca antes de las 8 ni después de las 20 (hora de SU zona),
//  - "hábito que resbala" no insiste: cada 3 días, y se calla tras 14 días sin estudiar.
//
// pref = { enabled, tz, pico_hour, next_exam_date:'YYYY-MM-DD', last_study_date:'YYYY-MM-DD',
//          last_sent_kind, last_sent_on:'YYYY-MM-DD' }

const DEFAULT_TZ = 'America/Caracas';

// Fecha ('YYYY-MM-DD') y hora (0-23) locales de `now` en la zona `tz`.
export function localParts(now, tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz || DEFAULT_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch (_) {
    return localParts(now, DEFAULT_TZ); // zona inválida: no rompe el envío de los demás
  }
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  return { date: o.year + '-' + o.month + '-' + o.day, hour: Number(o.hour) };
}

// Días de a a b (b - a), ambos 'YYYY-MM-DD'.
export function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 864e5);
}

const EXAM_MORNING_HOUR = 8;

// Qué aviso toca ahora (o null).
export function dueFor(pref, now) {
  if (!pref || !pref.enabled) return null;
  const { date: today, hour } = localParts(now, pref.tz);
  if (pref.last_sent_on === today) return null;

  const toExam = pref.next_exam_date ? daysBetween(today, pref.next_exam_date) : null;
  if (toExam === 0) return hour === EXAM_MORNING_HOUR ? 'exam-morning' : null;

  const pico = Number.isInteger(pref.pico_hour) ? pref.pico_hour : 15;
  if (hour !== Math.min(20, Math.max(8, pico))) return null;

  if (toExam === 1) return 'exam-eve';

  const since = pref.last_study_date ? daysBetween(pref.last_study_date, today) : null;
  if (since === null) return null; // nunca ha estudiado: no hay hábito que recordar
  if (since >= 3 && since <= 14) {
    if (pref.last_sent_kind === 'slip' && pref.last_sent_on && daysBetween(pref.last_sent_on, today) < 3) return null;
    return 'slip';
  }
  if (since >= 1 && since < 3) return 'daily';
  return null; // ya estudió hoy, o lleva demasiado sin venir
}

export function messageFor(kind) {
  const msgs = {
    'exam-eve': { title: 'Mañana tienes examen', body: 'Un repaso corto hoy te deja más tranquilo. Empieza por lo más débil.' },
    'exam-morning': { title: 'Hoy es tu examen', body: 'Un último vistazo rápido a lo esencial y a confiar. ¡Suerte!' },
    daily: { title: 'Tu repaso de hoy', body: 'Unos minutos ahora y lo de hoy queda guardado.' },
    slip: { title: 'Te echamos de menos', body: 'Una sesión corta te devuelve el ritmo. Sin presión.' }
  };
  return Object.assign({ url: '/app' }, msgs[kind] || { title: 'Catedra', body: 'Tienes algo pendiente.' });
}
