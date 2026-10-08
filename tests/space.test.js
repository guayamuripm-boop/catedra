'use strict';
const test = require('node:test');
const assert = require('node:assert');
const SP = require('../js/space.js');

const mk = ()=>({subjects:[], spaces:[], materials:[]});

test('migra una materia con examDate a una evaluación y crea el espacio por defecto', ()=>{
  const st = mk(); st.subjects.push({id:'s1', nombre:'Bio', examDate:'2026-11-10', items:[]});
  SP.ensure(st);
  assert.equal(st.spaces.length, 1);
  assert.equal(st.subjects[0].spaceId, st.spaces[0].id);
  assert.equal(st.subjects[0].evals.length, 1);
  assert.equal(st.subjects[0].evals[0].fecha, '2026-11-10');
  SP.ensure(st); // idempotente
  assert.equal(st.subjects[0].evals.length, 1);
  assert.equal(st.spaces.length, 1);
});

test('varias evaluaciones: examDate es la próxima futura', ()=>{
  const st = SP.ensure(mk()); const s = {id:'s1', nombre:'Mat', items:[], units:[], evals:[], spaceId:st.spaces[0].id}; st.subjects.push(s);
  SP.addEval(st,s,{nombre:'Parcial 1', fecha:'2026-10-01'});
  SP.addEval(st,s,{nombre:'Parcial 2', fecha:'2026-12-01'});
  SP.addEval(st,s,{nombre:'Final', fecha:'2027-02-01'});
  assert.equal(SP.syncExam(s,'2026-10-15'), '2026-12-01');
  assert.equal(SP.nextEval(s,'2026-10-15').nombre, 'Parcial 2');
  assert.equal(SP.syncExam(s,'2026-12-02'), '2027-02-01');
  assert.equal(SP.syncExam(s,'2027-03-01'), '2027-02-01'); // todas pasaron: conserva la última
});

test('quitar la última evaluación limpia examDate', ()=>{
  const st = SP.ensure(mk()); const s = {id:'s1', items:[], units:[], evals:[], spaceId:st.spaces[0].id};
  const e = SP.addEval(st,s,{nombre:'Final', fecha:'2099-01-01'});
  SP.removeEval(st,s,e.id,'2026-01-01');
  assert.equal(s.examDate, '');
});

test('vocabulario según el espacio y reutilización de espacios por tipo', ()=>{
  const st = SP.ensure(mk());
  const a = SP.spaceFor(st,'universidad'), b = SP.spaceFor(st,'universidad');
  assert.equal(a.id, b.id);
  const s = {id:'s1', items:[], units:[], evals:[], spaceId:a.id}; st.subjects.push(s);
  assert.equal(SP.vocab(st,s).evaluacion, 'Parcial');
  const c = SP.spaceFor(st,'academia');
  s.spaceId = c.id;
  assert.equal(SP.vocab(st,s).unidad, 'Módulo');
  assert.equal(SP.spaceFor(st,'inexistente').tipo, 'propio');
});

test('unidades, materiales y cobertura: detecta unidades sin preguntas', ()=>{
  const st = SP.ensure(mk()); const s = {id:'s1', items:[], units:[], evals:[], spaceId:st.spaces[0].id}; st.subjects.push(s);
  const u1 = SP.unitFor(st,s,'Clase del 8 oct'), u2 = SP.unitFor(st,s,'clase del 8 oct'), u3 = SP.addUnit(st,s,'Clase del 9 oct');
  assert.equal(u1.id, u2.id);
  SP.addMaterial(st,{subjectId:'s1', unitId:u1.id, tipo:'clase', titulo:'Audio', texto:'x'});
  SP.addMaterial(st,{subjectId:'s1', unitId:u3.id, tipo:'rarotipo', texto:'y'});
  s.items.push({id:'i1', unitId:u1.id, nextReviewDate:'2026-10-08'}, {id:'i2', unitId:u1.id, nextReviewDate:'2099-01-01'});
  const cov = SP.coverage(st,s,'2026-10-08');
  assert.equal(cov[0].items, 2); assert.equal(cov[0].due, 1);
  assert.equal(cov[1].items, 0); assert.equal(cov[1].materials, 1);
  assert.equal(st.materials[1].tipo, 'texto'); // tipo desconocido cae a texto
  assert.equal(SP.pendingMaterials(st,s).length, 2);
});
