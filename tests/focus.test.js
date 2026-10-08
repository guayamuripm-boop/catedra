'use strict';
const test = require('node:test');
const assert = require('node:assert');
const F = require('../js/focus.js');

test('la semana empieza el lunes', ()=>{
  assert.equal(F.mondayOf('2026-10-08'), '2026-10-05'); // jueves
  assert.equal(F.mondayOf('2026-10-05'), '2026-10-05'); // lunes
  assert.equal(F.mondayOf('2026-10-11'), '2026-10-05'); // domingo
});

test('etapas de la semilla según la meta', ()=>{
  assert.equal(F.stage(0,90), 0);
  assert.equal(F.stage(10,90), 1);
  assert.equal(F.stage(40,90), 2);
  assert.equal(F.stage(60,90), 3);
  assert.equal(F.stage(90,90), 4);
  assert.equal(F.stage(10,0), 0);
});

test('consecuencia: en la app, más de 2 salidas vale la mitad; fuera de la app no se castiga', ()=>{
  assert.equal(F.credit(25,0,'app'), 25);
  assert.equal(F.credit(25,2,'app'), 25);
  assert.equal(F.credit(25,3,'app'), 13);
  assert.equal(F.credit(25,5,'fuera'), 25);
});

test('racha semanal: cuenta semanas cumplidas, el 60 % sostiene sin sumar, menos la rompe', ()=>{
  const e = (d,c)=>({d, credit:c});
  const today = '2026-10-08'; // semana del 5 oct
  const log = [e('2026-09-28',90), e('2026-09-21',60), e('2026-09-14',100), e('2026-09-07',10)];
  // semana en curso sin cumplir: no rompe; 28 sep cumple (1), 21 sep sostiene (60 de 90 = 66 %), 14 sep cumple (2), 7 sep rompe
  assert.equal(F.weekStreak(log,90,today), 2);
  log.push(e('2026-10-06',95));
  assert.equal(F.weekStreak(log,90,today), 3);
  assert.equal(F.weekStreak([],90,today), 0);
  assert.equal(F.weekStreak(log,0,today), 0);
});

test('reconoce enlaces de YouTube y rechaza otros', ()=>{
  assert.equal(F.ytId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3'), 'dQw4w9WgXcQ');
  assert.equal(F.ytId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(F.ytId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(F.ytId('https://vimeo.com/123'), '');
  assert.equal(F.ytId(''), '');
});
