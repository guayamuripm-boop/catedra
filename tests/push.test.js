'use strict';
/* Parte pura del cliente de avisos push (js/push.js). Lo que decide CUÁNDO avisar vive en tests/reminders.test.js. */
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/push.js');
const SYNC = require('../js/sync.js');

const nextEval = (s, today) => (s.evals || []).filter(e => e.fecha && e.fecha >= today).sort((a, b) => a.fecha < b.fecha ? -1 : 1)[0] || null;

test('la hora pico nunca cae de madrugada: se mueve a las 8', () => {
  assert.equal(P.hourFromPico('manana'), 8);
  assert.equal(P.hourFromPico('tarde'), 15);
  assert.equal(P.hourFromPico('noche'), 20);
  assert.equal(P.hourFromPico('madrugada'), 8);
  assert.equal(P.hourFromPico(''), 15, 'sin dato: media tarde');
});

test('último día de estudio: el más reciente entre racha y sesiones; ignora basura', () => {
  assert.equal(P.lastStudyDate({}), null);
  assert.equal(P.lastStudyDate({ streakDays: ['2026-10-18', '2026-10-20'], sessionLog: [{ date: '2026-10-19' }, { date: 'x' }, {}] }), '2026-10-20');
  assert.equal(P.lastStudyDate({ streakDays: ['2026-10-18'], sessionLog: [{ date: '2026-10-21' }] }), '2026-10-21');
});

test('próxima evaluación: la más cercana de todas las materias, sin contar las pasadas', () => {
  const st = { subjects: [{ evals: [{ fecha: '2026-10-30' }, { fecha: '2026-10-01' }] }, { evals: [{ fecha: '2026-10-25' }] }] };
  assert.equal(P.nextExamDate(st, '2026-10-22', nextEval), '2026-10-25');
  assert.equal(P.nextExamDate({ subjects: [] }, '2026-10-22', nextEval), null);
});

test('prefsFor manda solo fechas y hora (nada del contenido de estudio)', () => {
  const st = { subjects: [{ nombre: 'Biología secreta', evals: [{ fecha: '2026-10-25' }] }], profile: { picoProductividad: 'noche' }, streakDays: ['2026-10-21'] };
  const p = P.prefsFor(st, '2026-10-22', 'America/Bogota', nextEval);
  assert.deepEqual(p, { next_exam_date: '2026-10-25', pico_hour: 20, tz: 'America/Bogota', last_study_date: '2026-10-21', enabled: true });
  assert.ok(!JSON.stringify(p).includes('Biología'));
});

test('la clave pública VAPID es un punto P-256 sin comprimir (65 bytes en base64url)', () => {
  const raw = Buffer.from(P.VAPID_PUBLIC, 'base64url');
  assert.equal(raw.length, 65);
  assert.equal(raw[0], 4, 'empieza con 0x04 (formato sin comprimir que exige Web Push)');
  assert.ok(!/[+/=]/.test(P.VAPID_PUBLIC), 'base64url, sin relleno');
});

test('el estado de avisos es de cada dispositivo: no viaja ni pisa a otro', () => {
  const st = { settings: { deviceId: 'D1', push: true, pushDeclined: false, otra: 1 } };
  const packed = SYNC.pack(st);
  assert.equal(packed.settings.push, undefined);
  assert.equal(packed.settings.pushDeclined, undefined);
  assert.equal(packed.settings.otra, 1);
  const back = SYNC.unpack({ settings: { push: false, otra: 2 } }, st);
  assert.equal(back.settings.push, true, 'conserva el de este dispositivo');
});
