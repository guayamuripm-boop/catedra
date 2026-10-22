'use strict';
const test = require('node:test');
const assert = require('node:assert');
const E = require('../js/examloop.js');

const res = (feel, nota, readiness) => ({ feel, prep: 'si', nota, prediccion: readiness === undefined ? undefined : { readiness, dominio: null } });

test('preparación alta + se sintió mal ⇒ sobreestimó', () => {
  const c = E.compare(res('mal', '', 80));
  assert.equal(c.estado, 'sobreestimo');
  assert.match(c.mensaje, /cambiar cómo te preparo/);
});

test('preparación baja + se sintió bien ⇒ subestimó', () => {
  assert.equal(E.compare(res('bien', '', 30)).estado, 'subestimo');
});

test('preparación media + regular ⇒ calibrado', () => {
  assert.equal(E.compare(res('regular', '', 50)).estado, 'calibrado');
});

test('sin predicción (o preparación nula) ⇒ sin_dato y no rompe', () => {
  assert.equal(E.compare(res('bien', '8/10')).estado, 'sin_dato');
  assert.equal(E.compare({ feel: 'bien', prediccion: { readiness: null } }).estado, 'sin_dato');
  assert.equal(E.compare(null).estado, 'sin_dato');
});

test('la nota solo cuenta con su escala: 15/20 es buena, 6/20 es mala, 2/5 es mala, 4/5 es buena', () => {
  assert.equal(E.ratio('15/20'), 0.75);
  assert.equal(E.ratio('6 / 20'), 0.3);
  assert.equal(E.ratio('4,5/5'), 0.9);
  assert.equal(E.compare(res('regular', '6/20', 80)).estado, 'sobreestimo');
  assert.equal(E.compare(res('regular', '2/5', 80)).estado, 'sobreestimo');
  assert.equal(E.compare(res('regular', '15/20', 30)).estado, 'subestimo');
  assert.equal(E.compare(res('regular', '4/5', 30)).estado, 'subestimo');
});

test('una nota suelta sin escala NO decide nada (podría ser de 5, 10 o 20)', () => {
  assert.equal(E.ratio('7'), null);
  assert.equal(E.ratio('15'), null);
  assert.equal(E.compare(res('regular', '15', 30)).estado, 'calibrado');
  assert.equal(E.compare(res('regular', '3', 80)).estado, 'calibrado');
});

test('bordes: 70 y 40 cuentan como alto y bajo', () => {
  assert.equal(E.compare(res('mal', '', 70)).estado, 'sobreestimo');
  assert.equal(E.compare(res('bien', '', 40)).estado, 'subestimo');
  assert.equal(E.compare(res('bien', '', 70)).estado, 'calibrado');
  assert.equal(E.compare(res('mal', '', 40)).estado, 'calibrado');
});
