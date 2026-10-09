'use strict';
const test = require('node:test');
const assert = require('node:assert');
const V = require('../js/voice.js');

const T = '2026-10-08';
const base = ()=>({subjects:[{id:'s1', nombre:'Bio', items:[], evals:[]}], pendingItems:[], materials:[], focusLog:[], sessionLog:[], habit:{active:null, history:[]}});

test('siguiente paso: primero lo que vence hoy', ()=>{
  const st = base(); st.subjects[0].items = [{nextReviewDate:'2026-10-01'},{nextReviewDate:'2026-10-08'},{nextReviewDate:'2099-01-01'}];
  const n = V.nextStep(st,T);
  assert.equal(n.k,'repaso'); assert.match(n.text,/2 preguntas de Bio/); assert.match(n.fn,/startSessionFlow\('s1'\)/);
  assert.notEqual(V.nextStep(st,T,['repaso']).k,'repaso');
});

test('siguiente paso: revisar, convertir material, averiguar, enfocarse y descansar, en ese orden', ()=>{
  const st = base(); st.subjects[0].items=[{nextReviewDate:'2099-01-01'}];
  st.pendingItems=[{subjectId:'s1'}];
  assert.equal(V.nextStep(st,T).k,'revisar');
  st.pendingItems=[]; st.materials=[{subjectId:'s1', estado:'recibido', titulo:'Clase 3'}];
  assert.equal(V.nextStep(st,T).k,'material');
  st.materials[0].estado='convertido';
  st.subjects[0].evals=[{id:'e1', nombre:'Parcial 1', fecha:'2026-10-15', asks:[{q:'x',done:false}]}];
  const a = V.nextStep(st,T); assert.equal(a.k,'averiguar'); assert.match(a.sub,/Faltan 7 días/);
  st.subjects[0].evals[0].asks[0].done=true;
  assert.equal(V.nextStep(st,T).k,'enfoque');
  st.focusLog=[{d:'2026-10-06', credit:90}];
  assert.equal(V.nextStep(st,T).k,'descanso');
});

test('siguiente paso: experimento listo a los 2 días y resultado tras la evaluación', ()=>{
  const st = base();
  st.experiment = {phase:'wait', startedAt:'2026-10-07'};
  assert.notEqual(V.nextStep(st,T).k,'experimento');
  st.experiment.startedAt = '2026-10-06';
  assert.equal(V.nextStep(st,T).k,'experimento');
  st.experiment.phase = 'done';
  st.subjects[0].evals = [{id:'e1', nombre:'Parcial 1', fecha:'2026-10-05'}];
  const r = V.nextStep(st,T); assert.equal(r.k,'resultado'); assert.match(r.fn,/openEvalResult\('s1','e1'\)/);
  st.subjects[0].evals[0].result = {feel:'bien'};
  assert.notEqual(V.nextStep(st,T).k,'resultado');
});

test('línea de la semana', ()=>{
  assert.match(V.weekLine(0,90),/aún no siembras/);
  assert.match(V.weekLine(60,90),/Te faltan 30 min/);
  assert.match(V.weekLine(90,90),/floreció/);
  assert.equal(V.weekCredit({focusLog:[{d:'2026-10-05',credit:20},{d:'2026-10-04',credit:50}]},T),20);
});

test('primera semana: cuenta pasos hechos y propone el siguiente', ()=>{
  const st = base();
  let w = V.firstWeek(st); assert.equal(w.done,0); assert.equal(w.next.k,'experimento');
  st.experiment={phase:'wait', startedAt:T};
  w = V.firstWeek(st); assert.equal(w.done,1); assert.equal(w.next.k,'material');
  st.subjects[0].items=[{}]; st.sessionLog=[{focus:true}];
  w = V.firstWeek(st); assert.equal(w.done,2); assert.equal(w.next.k,'repaso');
  st.sessionLog.push({}); st.focusLog=[{}]; st.subjects[0].evals=[{}]; st.habit.history=[{}];
  w = V.firstWeek(st); assert.equal(w.done,6); assert.equal(w.next,null);
});

test('mensajes tras enfoque y repaso', ()=>{
  assert.equal(V.afterFocus({credit:8,min:15,leaves:3},1,1).t,'Sesión a medias');
  assert.equal(V.afterFocus({credit:15,min:15,leaves:0},1,2).t,'Tu semilla creció');
  assert.equal(V.afterFocus({credit:15,min:15,leaves:0},3,4).t,'Tu semilla floreció');
  assert.equal(V.afterFocus({credit:15,min:15,leaves:0},2,2).t,'Enfoque limpio');
  assert.match(V.afterSession(9,10),/Lo tienes/);
  assert.match(V.afterSession(2,10),/fija más que releer/);
});
