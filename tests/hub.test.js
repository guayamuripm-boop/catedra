'use strict';
const test = require('node:test');
const assert = require('node:assert');
const HUB = require('../js/hub.js');

test('herramientas con enlaces https reales y una situación clara', ()=>{
  HUB.TOOLS.forEach(t=>{ assert.ok(t.para && t.como, t.id); t.links.forEach(([,u])=>assert.match(u,/^https:\/\/[a-z.]+\.(com|google\.com)\//)); });
});
test('la instrucción para el tutor pide preguntas, no la respuesta', ()=>{
  const p = HUB.prompt('tutor','la mitosis','Biología');
  assert.match(p,/de Biología/); assert.match(p,/la mitosis/); assert.match(p,/No me des la respuesta/);
  assert.match(HUB.prompt('persona',''),/este tema/);
  assert.equal(HUB.videoQuery('mitosis','Bio'),'mitosis explicación Bio');
});
