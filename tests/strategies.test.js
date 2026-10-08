'use strict';
const test = require('node:test');
const assert = require('node:assert');
const ST = require('../js/strategies.js');

test('cada método tiene evidencia con nivel válido, fuente, pasos y búsqueda', ()=>{
  ST.CATALOG.forEach(m=>{
    assert.ok(['alta','media','baja'].includes(m.ev.nivel), m.id);
    assert.ok(m.ev.fuente.length>10, m.id);
    assert.ok(m.pasos.length>=2, m.id);
    assert.ok(m.buscar.length>=1, m.id);
    assert.ok(m.para.every(a=>ST.ACT.includes(a)), m.id);
  });
  assert.equal(new Set(ST.CATALOG.map(m=>m.id)).size, ST.CATALOG.length);
});

test('para leer, lo de evidencia alta va antes que releer', ()=>{
  const r = ST.recommend({actividad:'leer'});
  assert.equal(r[0].m.id, 'autoprueba');
  const idx = id=>r.findIndex(x=>x.m.id===id);
  assert.ok(idx('releer') > idx('autoprueba'));
  assert.equal(r[r.length-1].m.id, 'releer');
});

test('con el examen cerca sube responder sin mirar; lejos, repartir', ()=>{
  const cerca = ST.recommend({actividad:'repasar', diasExamen:3});
  assert.equal(cerca[0].m.id, 'autoprueba');
  assert.ok(cerca[0].why.includes('tu examen está cerca'));
  const lejos = ST.recommend({actividad:'repasar', diasExamen:30});
  assert.ok(lejos.find(x=>x.m.id==='espaciado').why.includes('tienes tiempo de repartirlo'));
});

test('lo que a esa persona le funciona o no, mueve el orden (con mínimo 3 usos)', ()=>{
  const bueno = [1,2,3].map(()=>({method:'cornell', rating:3}));
  const malo = [1,2,3].map(()=>({method:'autoprueba', rating:1}));
  const r = ST.recommend({actividad:'apuntes', log:bueno.concat(malo)});
  assert.ok(r.findIndex(x=>x.m.id==='cornell') < r.findIndex(x=>x.m.id==='autoprueba'));
  assert.equal(ST.personal([{method:'x',rating:3},{method:'x',rating:3}],'x'), null);
  assert.ok(r.find(x=>x.m.id==='cornell').why.includes('a ti te ha funcionado'));
});

test('actividad desconocida cae a leer; las búsquedas no inventan enlaces', ()=>{
  assert.ok(ST.recommend({actividad:'bailar'}).length>0);
  assert.ok(ST.searchUrl('a b').startsWith('https://www.youtube.com/results?search_query=a%20b'));
  assert.ok(ST.searchUrl('a b','google').startsWith('https://www.google.com/search?q='));
  assert.ok(ST.asksFor('Simulacro 2').some(q=>/penaliz/i.test(q)));
  assert.ok(ST.FUENTES.every(f=>f.url.startsWith('https://')));
});

test('para cada actividad sugiere primero lo pensado para ella cuando incluye recuperación', ()=>{
  assert.equal(ST.recommend({actividad:'video'})[0].m.id, 'video_activo');
  assert.equal(ST.recommend({actividad:'ejercicios'})[0].m.id, 'intercalar');
  assert.equal(ST.recommend({actividad:'leer'})[0].m.id, 'autoprueba');
});
