'use strict';
const test = require('node:test');
const assert = require('node:assert');
const E = require('../js/examloop.js');

test('readiness 0.8 + feel mal ⇒ sobreestimo', () => {
  const result = {feel: 'mal', prep: 'si', nota: '4', prediccion: {readiness: 80, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'sobreestimo');
  assert.match(c.mensaje, /La app pensaba que ibas bien/);
});

test('readiness 0.3 + nota alta ⇒ subestimo', () => {
  const result = {feel: 'bien', prep: 'si', nota: '9', prediccion: {readiness: 30, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'subestimo');
  assert.match(c.mensaje, /La app veía preparación baja/);
});

test('readiness 0.5 + feel regular ⇒ calibrado', () => {
  const result = {feel: 'regular', prep: 'si', nota: '6', prediccion: {readiness: 50, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'calibrado');
  assert.match(c.mensaje, /coinciden/);
});

test('sin prediccion ⇒ sin_dato (no rompe)', () => {
  const result = {feel: 'bien', prep: 'si', nota: '8'};
  const c = E.compare(result);
  assert.equal(c.estado, 'sin_dato');
  assert.match(c.mensaje, /Sin datos de predicción/);
});

test('readiness 70 + feel bien ⇒ calibrado', () => {
  const result = {feel: 'bien', prep: 'si', nota: '7', prediccion: {readiness: 70, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'calibrado');
});

test('readiness 70 + nota 4 ⇒ sobreestimo', () => {
  const result = {feel: 'bien', prep: 'si', nota: '4', prediccion: {readiness: 70, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'sobreestimo');
});

test('readiness 40 + feel mal ⇒ calibrado', () => {
  const result = {feel: 'mal', prep: 'no', nota: '3', prediccion: {readiness: 40, dominio: null}};
  const c = E.compare(result);
  assert.equal(c.estado, 'calibrado');
});