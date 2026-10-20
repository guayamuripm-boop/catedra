'use strict';
/* Catedra · Bucle examen: comparar predicción vs realidad.
   Puro (sin DOM), probado en tests/examloop.test.js. */
(function(root){
  function compare(result){
    const pred = result && result.prediccion;
    if(!pred || pred.readiness === null || pred.readiness === undefined){
      return {estado:'sin_dato', delta:null, mensaje:'Sin datos de predicción para comparar. La próxima vez lo sabremos.'};
    }
    const r = pred.readiness; // 0-100
    const feel = result.feel; // 'bien' | 'regular' | 'mal'
    const nota = result.nota; // string, p.ej. "8.5" o "notable"
    let notaNum = null;
    if(nota){ const m = String(nota).match(/(\d+(?:\.\d+)?)/); if(m) notaNum = parseFloat(m[1]); }

    // readiness alto (≥70) y feel 'mal' o nota baja (<5) → sobreestimo
    const feelMal = feel === 'mal';
    const notaBaja = notaNum !== null && notaNum < 5;
    const feelBien = feel === 'bien';
    const notaAlta = notaNum !== null && notaNum >= 7;

    if(r >= 70 && (feelMal || notaBaja)){
      return {estado:'sobreestimo', delta: r, mensaje:'La app pensaba que ibas bien (preparación '+r+'%) pero te fue mal. La práctica no bastó: cambiemos el enfoque.'};
    }
    if(r <= 40 && (feelBien || notaAlta)){
      return {estado:'subestimo', delta: r, mensaje:'La app veía preparación baja ('+r+'%) y te fue bien. ¡Mejor de lo esperado! Sigamos así.'};
    }
    return {estado:'calibrado', delta: r, mensaje:'Predicción y realidad coinciden. El plan funcionó.'};
  }

  const EXAMLOOP = { compare };
  root.EXAMLOOP = EXAMLOOP;
  if(typeof module!=='undefined' && module.exports) module.exports = EXAMLOOP;
})(typeof window!=='undefined' ? window : globalThis);