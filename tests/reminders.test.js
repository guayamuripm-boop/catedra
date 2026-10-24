'use strict';
/* Lógica de recordatorios push: vive en supabase/functions/send-reminders/reminders.js (ESM, la usa la Edge Function). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let R;
test.before(async () => { R = await import(pathToFileURL(path.join(__dirname, '../supabase/functions/send-reminders/reminders.js')).href); });

// 2026-10-22 es jueves. Caracas = UTC-4 (sin horario de verano). Ciudad de México = UTC-6.
const at = (iso) => new Date(iso);
const base = (o) => Object.assign({ enabled: true, tz: 'America/Caracas', pico_hour: 15, next_exam_date: null, last_study_date: '2026-10-21', last_sent_kind: null, last_sent_on: null }, o);

test('localParts respeta la zona horaria del estudiante', () => {
  assert.deepEqual(R.localParts(at('2026-10-22T19:00:00Z'), 'America/Caracas'), { date: '2026-10-22', hour: 15 });
  assert.deepEqual(R.localParts(at('2026-10-22T19:00:00Z'), 'America/Mexico_City'), { date: '2026-10-22', hour: 13 });
  assert.deepEqual(R.localParts(at('2026-10-23T02:30:00Z'), 'America/Caracas'), { date: '2026-10-22', hour: 22 }, 'cruza la medianoche UTC sin cambiar su día');
  assert.deepEqual(R.localParts(at('2026-10-22T19:00:00Z'), 'Zona/Inventada'), { date: '2026-10-22', hour: 15 }, 'zona inválida: cae a Caracas, no rompe');
});

test('víspera: avisa el día anterior a su hora pico, y solo a esa hora', () => {
  const p = base({ next_exam_date: '2026-10-23' });
  assert.equal(R.dueFor(p, at('2026-10-22T19:00:00Z')), 'exam-eve');           // 15:00 en Caracas
  assert.equal(R.dueFor(p, at('2026-10-22T18:00:00Z')), null, 'una hora antes: nada');
  assert.equal(R.dueFor(p, at('2026-10-22T20:00:00Z')), null, 'una hora después: nada (no un aviso por hora)');
  assert.equal(R.dueFor(p, at('2026-10-22T19:00:00Z')), 'exam-eve');
});

test('mañana del examen: a las 8 locales, sin importar la hora pico', () => {
  const p = base({ next_exam_date: '2026-10-22', pico_hour: 20 });
  assert.equal(R.dueFor(p, at('2026-10-22T12:00:00Z')), 'exam-morning');       // 08:00 en Caracas
  assert.equal(R.dueFor(p, at('2026-10-22T13:00:00Z')), null);
  assert.equal(R.dueFor(p, at('2026-10-23T00:00:00Z')), null, 'a las 20:00 el examen ya pasó: nada');
});

test('un aviso por día: si ya se envió hoy, no vuelve a salir', () => {
  const p = base({ next_exam_date: '2026-10-23', last_sent_on: '2026-10-22', last_sent_kind: 'exam-eve' });
  assert.equal(R.dueFor(p, at('2026-10-22T19:00:00Z')), null);
  assert.equal(R.dueFor(Object.assign({}, p, { last_sent_on: '2026-10-21' }), at('2026-10-22T19:00:00Z')), 'exam-eve');
});

test('horas de silencio: una hora pico de madrugada se mueve a las 8, la de noche tardía a las 20', () => {
  assert.equal(R.dueFor(base({ pico_hour: 3, last_study_date: '2026-10-21' }), at('2026-10-22T12:00:00Z')), 'daily'); // 08:00 Caracas
  assert.equal(R.dueFor(base({ pico_hour: 3 }), at('2026-10-22T07:00:00Z')), null, 'a las 03:00 nunca');
  assert.equal(R.dueFor(base({ pico_hour: 23 }), at('2026-10-23T00:00:00Z')), 'daily');                          // 20:00 Caracas
});

test('hábito que resbala: ≥3 días sin estudiar avisa, pero no insiste ni para siempre', () => {
  const t = at('2026-10-22T19:00:00Z');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-19' }), t), 'slip');                       // 3 días
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-19', last_sent_kind: 'slip', last_sent_on: '2026-10-21' }), t), null, 'ya se avisó ayer');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-10', last_sent_kind: 'slip', last_sent_on: '2026-10-19' }), t), 'slip', 'pasaron 3 días desde el último');
  assert.equal(R.dueFor(base({ last_study_date: '2026-09-01' }), t), null, 'más de 14 días: se calla');
});

test('repaso diario: solo si hoy aún no estudió, y nunca a quien no ha empezado', () => {
  const t = at('2026-10-22T19:00:00Z');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-21' }), t), 'daily');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-22' }), t), null, 'ya estudió hoy');
  assert.equal(R.dueFor(base({ last_study_date: null }), t), null, 'nunca ha estudiado: no hay hábito que recordar');
});

test('apagado o sin preferencias: no avisa y no rompe', () => {
  assert.equal(R.dueFor(base({ enabled: false }), at('2026-10-22T19:00:00Z')), null);
  assert.equal(R.dueFor(null, at('2026-10-22T19:00:00Z')), null);
});

test('prioridad: examen mañana gana a un hábito que resbala', () => {
  assert.equal(R.dueFor(base({ next_exam_date: '2026-10-23', last_study_date: '2026-10-10' }), at('2026-10-22T19:00:00Z')), 'exam-eve');
});

test('messageFor: texto para cada caso y un genérico seguro', () => {
  for (const k of ['exam-eve', 'exam-morning', 'daily', 'slip']) {
    const m = R.messageFor(k);
    assert.ok(m.title && m.body && m.url === '/app', k);
  }
  assert.ok(R.messageFor('nada').title);
});

test('racha en riesgo: con racha ≥2 el aviso es "streak" en vez de "daily" (misma ventana, sin avisar más veces)', () => {
  const t = at('2026-10-22T19:00:00Z');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-21', streak: 2 }), t), 'streak');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-21', streak: 1 }), t), 'daily', 'con 1 día aún no es "racha"');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-21', streak: 0 }), t), 'daily');
  assert.equal(R.dueFor(base({ last_study_date: '2026-10-19', streak: 5 }), t), 'slip', 'si ya resbaló 3+ días, manda "slip", no "streak"');
});

test('messageFor: cada tipo tiene texto, "{n}" se rellena con la racha, y el mismo día da siempre el mismo texto', () => {
  for (const k of ['exam-eve', 'exam-morning', 'streak', 'daily', 'slip']) {
    const m = R.messageFor(k, { date: '2026-10-22', streak: 4 });
    assert.ok(m.title && m.body && m.url === '/app', k);
    assert.ok(!m.title.includes('{n}') && !m.body.includes('{n}'), k + ': sin plantillas sueltas');
  }
  const a = R.messageFor('streak', { date: '2026-10-22', streak: 4 });
  const b = R.messageFor('streak', { date: '2026-10-22', streak: 4 });
  assert.deepEqual(a, b, 'mismo día, mismo texto (no cambia si el cron reintenta)');
  assert.ok(a.title.includes('4') || a.body.includes('4'), 'la racha aparece en el texto');
  assert.ok(R.messageFor('nada', {}).title);
});

test('messageFor: rota entre variantes en distintos días (no se siente repetitivo)', () => {
  const days = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];
  const texts = new Set(days.map(d => R.messageFor('daily', { date: d }).body));
  assert.ok(texts.size >= 2, 'con 6 días distintos, al menos dos variantes aparecen');
});
