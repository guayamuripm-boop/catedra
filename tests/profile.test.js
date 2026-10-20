'use strict';
const test = require('node:test');
const assert = require('node:assert');
const P = require('../js/profile.js');

function baseState(overrides = {}) {
  return {
    profile: { nombre: '', nivel: '', horasSemana: 0, desafio: '', picoProductividad: '', capacidadEnfoque: 0, motivacion: '', cuando: '', gravedad: 0, _askedDay: '' },
    sessionLog: [],
    evlog: [],
    subjects: [],
    ...overrides
  };
}

test('Tras 3 capture, S.profile tiene los 3 campos y PROFILE.missing queda vacío', () => {
  const st = baseState();
  assert.ok(P.capture(st, 'capacidadEnfoque', 20));
  assert.ok(P.capture(st, 'picoProductividad', 'manana'));
  assert.ok(P.capture(st, 'desafio', 'concentracion'));
  assert.deepEqual(P.missing(st), []);
  assert.equal(st.profile.capacidadEnfoque, 20);
  assert.equal(st.profile.picoProductividad, 'manana');
  assert.equal(st.profile.desafio, 'concentracion');
});

test('capture no sobrescribe un valor ya presente', () => {
  const st = baseState({ profile: { capacidadEnfoque: 35, picoProductividad: '', desafio: '', _askedDay: '' } });
  const ok = P.capture(st, 'capacidadEnfoque', 20);
  assert.equal(ok, false);
  assert.equal(st.profile.capacidadEnfoque, 35);
});

test('shouldAsk es false con 0 sesiones y true con ≥1 sesión y campos faltantes; false si ya se preguntó hoy', () => {
  // 0 sesiones
  const st0 = baseState();
  assert.equal(P.shouldAsk(st0, '2026-10-08'), false);

  // 1 sesión, campos faltantes
  const st1 = baseState({ sessionLog: [{ date: '2026-10-07' }] });
  assert.equal(P.shouldAsk(st1, '2026-10-08'), true);

  // Ya se preguntó hoy
  const st2 = baseState({ sessionLog: [{ date: '2026-10-07' }], profile: { _askedDay: '2026-10-08' } });
  assert.equal(P.shouldAsk(st2, '2026-10-08'), false);

  // Sin campos faltantes
  const st3 = baseState({ sessionLog: [{ date: '2026-10-07' }], profile: { capacidadEnfoque: 20, picoProductividad: 'manana', desafio: 'concentracion', _askedDay: '' } });
  assert.equal(P.shouldAsk(st3, '2026-10-08'), false);
});

test('Valor inválido ⇒ capture devuelve false y no escribe', () => {
  const st = baseState();
  assert.equal(P.capture(st, 'capacidadEnfoque', 99), false);
  assert.equal(P.capture(st, 'picoProductividad', 'mediodia'), false);
  assert.equal(P.capture(st, 'desafio', 'otro'), false);
  assert.deepEqual(P.missing(st), ['capacidadEnfoque', 'picoProductividad', 'desafio']);
});

test('missing ignora campos con valor 0 o string vacío', () => {
  const st = baseState({ profile: { capacidadEnfoque: 0, picoProductividad: '', desafio: 'concentracion', _askedDay: '' } });
  const m = P.missing(st);
  assert.ok(m.includes('capacidadEnfoque'));
  assert.ok(m.includes('picoProductividad'));
  assert.ok(!m.includes('desafio'));
});

test('shouldAsk usa _askedDay para no preguntar dos veces el mismo día', () => {
  const st = baseState({ sessionLog: [{ date: '2026-10-07' }], profile: { _askedDay: '2026-10-08' } });
  assert.equal(P.shouldAsk(st, '2026-10-08'), false);
  assert.equal(P.shouldAsk(st, '2026-10-09'), true);
});

test('weakestDomain devuelve el dominio con menor est y w>=3', () => {
  const st = baseState({
    diag: {
      dom: {
        CON: {est: 80, w: 5, n: 5},
        TIE: {est: 30, w: 4, n: 4},
        PRO: {est: 60, w: 3, n: 3},
        AUT: {est: 20, w: 6, n: 6},
        ANS: {est: 90, w: 2, n: 2} // w<3, debe ignorarse
      }
    }
  });
  assert.equal(P.weakestDomain(st), 'AUT'); // est=20, w=6
});

test('weakestDomain ignora dominios con w<3', () => {
  const st = baseState({
    diag: {
      dom: {
        CON: {est: 10, w: 2, n: 2}, // w<3
        TIE: {est: 40, w: 4, n: 4}
      }
    }
  });
  assert.equal(P.weakestDomain(st), 'TIE');
});

test('weakestDomain devuelve null si no hay dominios con w>=3', () => {
  const st = baseState({
    diag: {
      dom: {
        CON: {est: 10, w: 2, n: 2},
        TIE: {est: 40, w: 1, n: 1}
      }
    }
  });
  assert.equal(P.weakestDomain(st), null);
});

test('weakestDomain devuelve null si no hay diag.dom', () => {
  const st = baseState({ diag: {} });
  assert.equal(P.weakestDomain(st), null);
});