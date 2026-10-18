'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SYNC = require('../js/sync.js');

const filled = { onboarded: true, subjects: [{ id: 's1' }], notes: [], materials: [], settings: { deviceId: 'D1', pilotCode: 'abc', aiUrl: '', x: 1 } };
const empty = { onboarded: false, subjects: [], notes: [], materials: [], settings: {} };

test('pack quita lo propio del dispositivo y no muta el estado', () => {
  const p = SYNC.pack(filled);
  assert.equal(p.settings.deviceId, undefined);
  assert.equal(p.settings.pilotCode, undefined);
  assert.equal(p.settings.x, 1);
  assert.equal(filled.settings.deviceId, 'D1');
});

test('unpack conserva el deviceId y el código de este equipo, no los de la nube', () => {
  const cloud = { settings: { deviceId: 'OTRO', pilotCode: 'zzz', x: 2 }, subjects: [] };
  const u = SYNC.unpack(cloud, filled);
  assert.equal(u.settings.deviceId, 'D1');
  assert.equal(u.settings.pilotCode, 'abc');
  assert.equal(u.settings.x, 2);
});

test('decide: sin nube y sin datos no hace nada; con datos sube', () => {
  assert.equal(SYNC.decide({ cloud: null, local: empty, meta: {}, uid: 'u' }), 'noop');
  assert.equal(SYNC.decide({ cloud: null, local: filled, meta: {}, uid: 'u' }), 'push');
});

test('decide: equipo nuevo — vacío adopta la nube; con datos pregunta', () => {
  const cloud = { updatedAt: 't1' };
  assert.equal(SYNC.decide({ cloud, local: empty, meta: {}, uid: 'u' }), 'adopt');
  assert.equal(SYNC.decide({ cloud, local: filled, meta: {}, uid: 'u' }), 'ask');
  assert.equal(SYNC.decide({ cloud, local: filled, meta: { uid: 'otro', syncedAt: 't1' }, uid: 'u' }), 'ask', 'otra cuenta en el mismo equipo no se mezcla en silencio');
});

test('decide: equipo ya vinculado', () => {
  const m = (syncedAt, dirty) => ({ uid: 'u', syncedAt, dirty });
  assert.equal(SYNC.decide({ cloud: { updatedAt: 't1' }, local: filled, meta: m('t1', false), uid: 'u' }), 'noop');
  assert.equal(SYNC.decide({ cloud: { updatedAt: 't1' }, local: filled, meta: m('t1', true), uid: 'u' }), 'push');
  assert.equal(SYNC.decide({ cloud: { updatedAt: 't2' }, local: filled, meta: m('t1', false), uid: 'u' }), 'adopt', 'otro dispositivo avanzó');
  assert.equal(SYNC.decide({ cloud: { updatedAt: 't2' }, local: filled, meta: m('t1', true), uid: 'u' }), 'ask', 'cambiaron los dos');
});

test('tooBig protege contra estados enormes', () => {
  assert.equal(SYNC.tooBig(filled), false);
  assert.equal(SYNC.tooBig({ settings: {}, blob: 'x'.repeat(SYNC.MAX_BYTES + 10) }), true);
});
