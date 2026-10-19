'use strict';
const test = require('node:test');
const assert = require('node:assert');
const A = require('../js/agenda.js');

const T = '2026-10-08';
const base = () => ({
  subjects: [
    { id: 's1', nombre: 'Bio', items: [], evals: [] },
    { id: 's2', nombre: 'Mate', items: [], evals: [] }
  ],
  pendingItems: [],
  materials: [],
  focusLog: [],
  sessionLog: [],
  experiment: null,
  focusGoal: 90
});

test('Examen a 1 día con ítems ⇒ rank()[0].k==="rescate" y heroOnly===true', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }];
  st.subjects[0].examDate = '2026-10-09';
  const r = A.rank(st, T);
  assert.equal(r[0].k, 'rescate');
  assert.equal(r[0].heroOnly, true);
});

test('Sin material (ningún subject con items) ⇒ existe candidato add-material', () => {
  const st = base();
  const r = A.rank(st, T);
  const hasAdd = r.some(c => c.k === 'add-material');
  assert.equal(hasAdd, true);
});

test('Con todo al día ⇒ el último es descanso', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.subjects[0].examDate = '2099-01-01';
  const r = A.rank(st, T);
  assert.equal(r[r.length - 1].k, 'descanso');
});

test('skip:["repaso"] ⇒ ningún candidato con k==="repaso"', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }];
  const r = A.rank(st, T, { skip: ['repaso'] });
  const hasRepaso = r.some(c => c.k === 'repaso');
  assert.equal(hasRepaso, false);
});

test('Orden determinista: dos llamadas con el mismo estado dan el mismo orden', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }];
  st.subjects[0].examDate = '2026-10-09';
  st.pendingItems = [{ subjectId: 's1' }];
  const r1 = A.rank(st, T).map(c => c.k);
  const r2 = A.rank(st, T).map(c => c.k);
  assert.deepEqual(r1, r2);
});

test('AGENDA.next(...) nunca devuelve un heroOnly', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }];
  st.subjects[0].examDate = '2026-10-09';
  const n = A.next(st, T);
  assert.equal(n.heroOnly, undefined);
  assert.notEqual(n.k, 'rescate');
});

test('rescate sale en next cuando skip incluye rescate (heroOnly filtrado)', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }];
  st.subjects[0].examDate = '2026-10-09';
  const n = A.next(st, T, ['experimento', 'resultado']);
  // next filtra heroOnly, así que debería ser repaso
  assert.equal(n.k, 'repaso');
});

test('experimento listo a los 2 días aparece con urgency 90', () => {
  const st = base();
  st.experiment = { phase: 'wait', startedAt: '2026-10-06' };
  const r = A.rank(st, T);
  const exp = r.find(c => c.k === 'experimento');
  assert.ok(exp);
  assert.equal(exp.urgency, 90);
});

test('resultado tras evaluación aparece con urgency 80', () => {
  const st = base();
  st.subjects[0].evals = [{ id: 'e1', nombre: 'Parcial 1', fecha: '2026-10-05' }];
  const r = A.rank(st, T);
  const res = r.find(c => c.k === 'resultado');
  assert.ok(res);
  assert.equal(res.urgency, 80);
});

test('repaso con items vencidos aparece con urgency 70', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2026-10-01' }, { nextReviewDate: '2026-10-08' }];
  const r = A.rank(st, T);
  const rep = r.find(c => c.k === 'repaso');
  assert.ok(rep);
  assert.equal(rep.urgency, 70);
  assert.match(rep.text, /2 preguntas de Bio/);
});

test('revisar (pendingItems) aparece con urgency 60', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.pendingItems = [{ subjectId: 's1' }, { subjectId: 's1' }];
  const r = A.rank(st, T);
  const rev = r.find(c => c.k === 'revisar');
  assert.ok(rev);
  assert.equal(rev.urgency, 60);
  assert.match(rev.text, /2 preguntas/);
});

test('material (recibido) aparece con urgency 50', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.materials = [{ subjectId: 's1', estado: 'recibido', titulo: 'Clase 3' }];
  const r = A.rank(st, T);
  const mat = r.find(c => c.k === 'material');
  assert.ok(mat);
  assert.equal(mat.urgency, 50);
});

test('averiguar (examen sin info) aparece con urgency 40', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.subjects[0].evals = [{ id: 'e1', nombre: 'Parcial 1', fecha: '2026-10-15' }];
  const r = A.rank(st, T);
  const avg = r.find(c => c.k === 'averiguar');
  assert.ok(avg);
  assert.equal(avg.urgency, 40);
  assert.match(avg.sub, /Faltan 7 días/);
});

test('enfoque (meta no cumplida) aparece con urgency 30', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.focusLog = [{ d: '2026-10-06', credit: 20 }];
  const r = A.rank(st, T);
  const enf = r.find(c => c.k === 'enfoque');
  assert.ok(enf);
  assert.equal(enf.urgency, 30);
  assert.match(enf.sub, /Te faltan 70 min/);
});

test('add-material cuando no hay items en ningún subject', () => {
  const st = base();
  st.subjects[0].items = [];
  st.subjects[1].items = [];
  const r = A.rank(st, T);
  const add = r.find(c => c.k === 'add-material');
  assert.ok(add);
  assert.equal(add.urgency, 20);
});

test('descanso siempre está al final con urgency 0', () => {
  const st = base();
  st.subjects[0].items = [{ nextReviewDate: '2099-01-01' }];
  st.subjects[0].examDate = '2099-01-01';
  const r = A.rank(st, T);
  assert.equal(r[r.length - 1].k, 'descanso');
  assert.equal(r[r.length - 1].urgency, 0);
});