'use strict';
const test = require('node:test');
const assert = require('node:assert');
const R = require('../js/reminders.js');

function mkPref(overrides = {}) {
  return { enabled: true, pico_hour: 15, tz: 'America/Caracas', ...overrides };
}

test('exam-eve: examen en 18h', () => {
  const now = new Date('2026-10-19T12:00:00-04:00');
  const pref = mkPref({ next_exam_at: new Date(now.getTime() + 18*3.6e6).toISOString() });
  assert.equal(R.dueFor(pref, now), 'exam-eve');
});

test('exam-morning: mismo día a hora pico', () => {
  const now = new Date('2026-10-19T15:00:00-04:00');
  const pref = mkPref({ next_exam_at: new Date('2026-10-19T23:59:00-04:00').toISOString(), pico_hour: 15 });
  assert.equal(R.dueFor(pref, now), 'exam-morning');
});

test('slip: 3 días sin actividad', () => {
  const now = new Date('2026-10-19T12:00:00-04:00');
  const pref = mkPref({ last_active_at: new Date('2026-10-16T12:00:00-04:00').toISOString() });
  assert.equal(R.dueFor(pref, now), 'slip');
});

test('daily: hora pico', () => {
  const now = new Date('2026-10-19T15:00:00-04:00');
  const pref = mkPref({ pico_hour: 15 });
  assert.equal(R.dueFor(pref, now), 'daily');
});

test('null: disabled', () => {
  const now = new Date('2026-10-19T15:00:00-04:00');
  const pref = mkPref({ enabled: false });
  assert.equal(R.dueFor(pref, now), null);
});

test('prioridad: slip > exam-eve > exam-morning > daily', () => {
  const now = new Date('2026-10-19T15:00:00-04:00');
  const pref = mkPref({
    next_exam_at: new Date('2026-10-19T23:59:00-04:00').toISOString(),
    last_active_at: new Date('2026-10-16T12:00:00-04:00').toISOString(),
    pico_hour: 15
  });
  // slip gana porque last_active_at ≥3 días
  assert.equal(R.dueFor(pref, now), 'slip');
});

test('messageFor devuelve título/cuerpo/url', () => {
  const m = R.messageFor('exam-eve');
  assert.ok(m.title.includes('examen'));
  assert.ok(m.body.length > 0);
  assert.equal(m.url, '/app');
});