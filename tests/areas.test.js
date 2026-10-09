'use strict';
const test = require('node:test');
const assert = require('node:assert');
const AREA = require('../js/areas.js');
const ST = require('../js/strategies.js');

test('detecta el área por el nombre de la materia', ()=>{
  assert.equal(AREA.detect('Matemáticas I'),'matematicas');
  assert.equal(AREA.detect('Física 11'),'matematicas');
  assert.equal(AREA.detect('Química orgánica'),'quimica');
  assert.equal(AREA.detect('Bioquímica'),'quimica');
  assert.equal(AREA.detect('Biología celular'),'ciencias');
  assert.equal(AREA.detect('Castellano y Literatura'),'lengua');
  assert.equal(AREA.detect('Inglés'),'lengua');
  assert.equal(AREA.detect('Historia de Venezuela'),'sociales');
  assert.equal(AREA.detect('Dibujo técnico'),'general');
  assert.equal(AREA.of({nombre:'Historia', area:'lengua'}),'lengua');
});

test('cada área usa métodos que existen en la biblioteca y tiene un puente con ideas', ()=>{
  AREA.ORDER.forEach(k=>{
    const a = AREA.AREAS[k];
    a.metodos.forEach(id=>assert.ok(ST.BY_ID[id], k+':'+id));
    assert.ok(a.puente.q.includes('esto'), k);
    assert.ok(a.puente.ideas.length>=3, k);
    assert.ok(a.tip.length>40 && a.ev.length>20, k);
  });
});

test('el recomendador prioriza lo que conviene en la materia', ()=>{
  globalThis.AREA = AREA;
  const mate = ST.recommend({actividad:'ejercicios', area:'matematicas'});
  assert.deepEqual(mate.slice(0,2).map(x=>x.m.id).sort(),['ejemplo_resuelto','intercalar']);
  assert.ok(mate[0].why.includes('conviene en esta materia'));
  const lengua = ST.recommend({actividad:'leer', area:'lengua'});
  assert.ok(lengua.slice(0,2).some(x=>x.m.id==='pregunta_resume'));
  delete globalThis.AREA;
});

test('el puente se pide como mucho una vez por semana por materia', ()=>{
  const st = {puentes:[], puenteAsk:{}};
  assert.equal(AREA.wantsBridge(st,'s1','2026-10-08'),true);
  st.puentes.push({sid:'s1', text:'x', d:'2026-10-05'});
  assert.equal(AREA.wantsBridge(st,'s1','2026-10-08'),false);
  assert.equal(AREA.wantsBridge(st,'s1','2026-10-12'),true);
  st.puenteAsk.s2='2026-10-07';
  assert.equal(AREA.wantsBridge(st,'s2','2026-10-08'),false);
});
