'use strict';
const test = require('node:test');
const assert = require('node:assert');
const TUTOR = require('../js/tutor.js');

test('el tutor escapa el texto y arma burbujas y respuestas', ()=>{
  const h = TUTOR.say(['Hola <b>', {t:'nota', small:true}], [['Si', "go('a')", true]]);
  assert.match(h, /Hola &lt;b&gt;/);
  assert.equal((h.match(/class="tu-b/g)||[]).length, 2);
  assert.match(h, /tu-b small/);
  assert.match(h, /class="tu-r p" onclick="go\(&#39;a&#39;\)"/);
  assert.doesNotMatch(TUTOR.say(['x'],[],{still:true}), / in"/);
});
