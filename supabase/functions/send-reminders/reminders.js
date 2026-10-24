// Catedra · Lógica pura de recordatorios push. ÚNICA fuente: la importa la Edge Function (index.ts)
// y la prueba tests/reminders.test.js. No toca red ni base de datos.
//
// Reglas de respeto al estudiante:
//  - como máximo UN aviso por día (last_sent_on),
//  - solo a su hora pico, y nunca antes de las 8 ni después de las 20 (hora de SU zona),
//  - "hábito que resbala" no insiste: cada 3 días, y se calla tras 14 días sin estudiar,
//  - el texto rota entre 3 variantes por tipo (según el día), para que no se sienta un robot repitiendo.
//
// pref = { enabled, tz, pico_hour, next_exam_date:'YYYY-MM-DD', last_study_date:'YYYY-MM-DD',
//          streak:n, last_sent_kind, last_sent_on:'YYYY-MM-DD' }

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
const STREAK_MIN = 2; // a partir de 2 días seguidos, perderla ya duele: ahí vale la pena protegerla

// Qué aviso toca ahora (o null): 'exam-eve' | 'exam-morning' | 'streak' | 'daily' | 'slip' | null.
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
  if (since >= 1 && since < 3) return (pref.streak || 0) >= STREAK_MIN ? 'streak' : 'daily';
  return null; // ya estudió hoy, o lleva demasiado sin venir
}

// Elige una variante de texto sin azar real: misma fecha → mismo texto (no cambia si el cron reintenta),
// pero distinta fecha → casi siempre otro texto. Así no se siente repetitivo ni impredecible.
function pick(list, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function messageFor(kind, opts) {
  opts = opts || {};
  const seed = (opts.date || '') + kind;
  const sets = {
    'exam-eve': [
      { title: 'Mañana tienes examen', body: 'Un repaso corto hoy te deja más tranquilo. Empieza por lo más débil.' },
      { title: 'El examen es mañana', body: 'No es momento de aprender algo nuevo: repasa lo que ya sabes y descansa bien.' },
      { title: 'Último repaso antes del examen', body: '15 minutos hoy valen más que una noche entera mañana.' },
    ],
    'exam-morning': [
      { title: 'Hoy es tu examen', body: 'Un último vistazo rápido a lo esencial y a confiar. ¡Suerte!' },
      { title: 'Es el día', body: 'Ya hiciste el trabajo. Respira, repasa 5 minutos y a demostrarlo.' },
    ],
    streak: [
      { title: 'No rompas tu racha', body: 'Llevas {n} días seguidos. 5 minutos hoy y la mantienes viva.' },
      { title: 'Tu racha de {n} días te espera', body: 'Un repaso cortico y sigues sumando.' },
      { title: '{n} días seguidos. ¿Hoy también?', body: 'No hace falta mucho: con poco alcanza para no cortarla.' },
    ],
    daily: [
      { title: 'Tu repaso de hoy', body: 'Unos minutos ahora y lo de hoy queda guardado.' },
      { title: '¿Un ratico para repasar?', body: 'Lo poco y seguido rinde más que lo mucho de una vez.' },
      { title: 'Catedra te espera', body: 'Una sesión corta hoy te ahorra un repaso largo después.' },
    ],
    slip: [
      { title: 'Te echamos de menos', body: 'Una sesión corta te devuelve el ritmo. Sin presión.' },
      { title: '¿Seguimos donde lo dejamos?', body: 'Volver cuesta el primer minuto; lo demás es más fácil de lo que crees.' },
      { title: 'Tu material sigue ahí', body: 'Cuando quieras retomar, Catedra arranca donde lo dejaste.' },
    ],
  };
  const list = sets[kind];
  if (!list) return { title: 'Catedra', body: 'Tienes algo pendiente.', url: '/app' };
  const m = pick(list, seed);
  const n = String(opts.streak || '');
  return { title: m.title.replace('{n}', n), body: m.body.replace('{n}', n), url: '/app' };
}
