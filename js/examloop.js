'use strict';
/* Catedra · Bucle del examen: contrastar lo que la app predijo con lo que pasó de verdad.
   Puro (sin DOM), probado en tests/examloop.test.js.
   La nota solo cuenta si viene con su escala ("15/20", "4/5"): un "7" suelto puede ser de 10, de 20 o de 5. */
(function(root){
  function ratio(nota){
    const m = String(nota||'').match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if(!m) return null;
    const a = parseFloat(m[1].replace(',','.')), b = parseFloat(m[2].replace(',','.'));
    return b>0 && a<=b ? a/b : null;
  }

  /* Devuelve {estado:'calibrado'|'sobreestimo'|'subestimo'|'sin_dato', delta, mensaje} */
  function compare(result){
    const pred = result && result.prediccion;
    if(!pred || pred.readiness===null || pred.readiness===undefined){
      return {estado:'sin_dato', delta:null, mensaje:'Gracias por contármelo. Aún no tengo suficiente práctica tuya para comparar; la próxima vez sí.'};
    }
    const r = pred.readiness;                       // 0-100
    const q = ratio(result.nota);
    const mal = result.feel==='mal' || (q!==null && q<0.5);
    const bien = result.feel==='bien' || (q!==null && q>=0.7);

    if(r>=70 && mal)  return {estado:'sobreestimo', delta:r, mensaje:'Yo te veía listo (preparación '+r+'%) y no salió bien. Eso me dice que debo cambiar cómo te preparo, no que tú no sirvas.'};
    if(r<=40 && bien) return {estado:'subestimo', delta:r, mensaje:'Yo te veía con poca preparación ('+r+'%) y te fue bien: sabes más de lo que mi práctica alcanza a medir.'};
    return {estado:'calibrado', delta:r, mensaje:'Lo que yo esperaba y lo que pasó van parecidos. Seguimos con lo que te funciona.'};
  }

  const EXAMLOOP = { compare, ratio };
  root.EXAMLOOP = EXAMLOOP;
  if(typeof module!=='undefined' && module.exports) module.exports = EXAMLOOP;
})(typeof window!=='undefined' ? window : globalThis);
