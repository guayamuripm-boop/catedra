'use strict';
const test = require('node:test');
const assert = require('node:assert');
const PACK = require('../js/pack.js');

const aids = {
  outline:[{section:'Derivadas', points:['Definición como límite','Regla de la cadena']}],
  key_concepts:[{term:'Derivada', definition:'La tasa de cambio instantánea de una función', why:'Mide pendientes'}],
  key_formulas:[{formula:"(f∘g)' = f'(g)·g'", meaning:'Derivada de una composición', when_to_use:'Funciones anidadas'}],
  worked_examples:[{problem:'Deriva sin(x²)', approach:'Regla de la cadena: cos(x²)·2x'}],
  study_questions:[{question:'¿Qué mide la derivada?', answer:'La tasa de cambio instantánea'}],
  flashcards:[{front:'¿Qué mide la derivada?', back:'Duplicada, se descarta'},{front:'Derivada de x^n', back:'n·x^(n-1)'}],
  common_mistakes:[{mistake:'Olvidar multiplicar por la derivada interna', correction:'Siempre multiplicar por g\'(x)'}],
  exam_notes:['Entra regla de la cadena'], resources:['Stewart cap. 3'], open_questions:['¿Y las implícitas?']
};

test('acepta el bloque de ZR Note sin envolver', ()=>{
  const r = PACK.parse(JSON.stringify(aids));
  assert.ok(r);
  assert.equal(r.meta.fuente, 'ZR Note');
  assert.equal(r.items.filter(i=>i.pregunta==='¿Qué mide la derivada?').length, 1); // deduplica
  assert.ok(r.items.some(i=>i.tipo==='aplicacion' && /sin\(x²\)/.test(i.pregunta)));
  assert.ok(r.items.some(i=>i.tipo==='error'));
  assert.ok(r.items.some(i=>i.pregunta==='¿Qué es Derivada?' && i.explicacion==='Mide pendientes'));
  assert.deepEqual(r.examNotes, ['Entra regla de la cadena']);
  assert.ok(r.texto.includes('## Lo que entra en el examen'));
  assert.ok(r.texto.includes('- Regla de la cadena'));
});

test('acepta el sobre catedra_pack, aunque venga con texto alrededor', ()=>{
  const env = {catedra_pack:1, materia:'Cálculo I', unidad:'Clase del 8 oct', fuente:'ZR Note', fecha:'2026-10-08', study_aids:aids};
  const r = PACK.parse('Te comparto esto:\n'+JSON.stringify(env)+'\nsaludos');
  assert.equal(r.meta.materia, 'Cálculo I');
  assert.equal(r.meta.unidad, 'Clase del 8 oct');
  assert.equal(r.meta.fecha, '2026-10-08');
});

test('ignora lo que no es un paquete y lo mal formado', ()=>{
  assert.equal(PACK.parse('Pregunta: hola\nRespuesta: chao'), null);
  assert.equal(PACK.parse('{"a":1}'), null);
  assert.equal(PACK.parse('{roto'), null);
  const r = PACK.parse(JSON.stringify({study_questions:[{question:5},{question:'corta',answer:'x'},null,{question:'¿Pregunta válida?',answer:'Sí'}]}));
  assert.equal(r.items.length, 1);
});

test('limita a 40 preguntas', ()=>{
  const many = {flashcards:Array.from({length:80},(_,i)=>({front:'Tarjeta número '+i, back:'Respuesta '+i}))};
  assert.equal(PACK.parse(JSON.stringify(many)).items.length, 40);
});
