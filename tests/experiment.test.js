'use strict';
const test = require('node:test');
const assert = require('node:assert');
const EXP = require('../js/experiment.js');

test('cada texto tiene 4 preguntas con 4 opciones y la correcta primero', ()=>{
  ['a','b'].forEach(k=>{ assert.equal(EXP.TEXTS[k].q.length,4); EXP.TEXTS[k].q.forEach(([t,o])=>{ assert.equal(o.length,4); assert.ok(EXP.TEXTS[k].texto.length>300); }); });
});

test('asignación al azar y espera de 2 días', ()=>{
  assert.equal(EXP.create('2026-10-08',0.1).reread,'a');
  const e = EXP.create('2026-10-08',0.9); assert.equal(e.reread,'b'); assert.equal(EXP.testKey(e),'a');
  e.phase='wait';
  assert.equal(EXP.isDue(e,'2026-10-09'),false); assert.equal(EXP.daysLeft(e,'2026-10-09'),1);
  assert.equal(EXP.isDue(e,'2026-10-10'),true);
  assert.equal(EXP.isDue(null,'2026-10-10'),false);
});

test('el cuestionario mezcla 8 preguntas y puntúa por condición', ()=>{
  const e = EXP.create('2026-10-08',0.1); // relee a, recuerda b
  const qz = EXP.quiz(e); assert.equal(qz.length,8);
  assert.equal(new Set(qz.map(q=>q.k+q.i)).size,8);
  qz.forEach(q=>assert.equal(q.o[q.ok], EXP.TEXTS[q.k].q[q.i][1][0]));
  const ans = qz.map(q=> q.k==='b' ? q.ok : (q.ok+1)%4); // acierta todo lo recordado, nada de lo releído
  e.score = EXP.score(e, ans); assert.deepEqual(e.score,{reread:0,test:4,n:4});
  e.predict='releer';
  const v = EXP.verdict(e); assert.equal(v.won,'test'); assert.match(v.extra,/ilusión de saber/);
  e.score = {reread:3,test:3,n:4}; assert.equal(EXP.verdict(e).won,'tie');
  e.score = {reread:4,test:2,n:4}; assert.match(EXP.verdict(e).m,/no con una sola prueba/);
});
