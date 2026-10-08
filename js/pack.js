'use strict';
/* Catedra · Paquetes de clase (formato abierto "catedra-pack v1").
   Acepta el bloque de ayudas de estudio del Modo Clase de ZR Note (study_aids) tal cual, o envuelto:
   {"catedra_pack":1, "materia":"", "unidad":"", "titulo":"", "fuente":"ZR Note", "fecha":"AAAA-MM-DD", "study_aids":{...}}
   Lo convierte en preguntas para revisar (nada entra al repaso sin que el estudiante lo apruebe) y en un material
   legible con temario, lo que entra en el examen, recursos y dudas abiertas. Nunca confía en la forma: corrige o descarta. */
(function(root){
const str = (v,n)=>typeof v==='string' ? v.replace(/\s+/g,' ').trim().slice(0,n||600) : '';
const arr = v=>Array.isArray(v) ? v : [];
const AIDS_KEYS = ['study_questions','flashcards','key_concepts','key_formulas','worked_examples','common_mistakes','outline','exam_notes'];

function tryJson(text){
  const t = String(text||'').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if(a<0 || b<=a) return null;
  try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; }
}
function isAids(o){ return o && typeof o==='object' && AIDS_KEYS.some(k=>Array.isArray(o[k])); }

/* Devuelve null si el texto no es un paquete */
function parse(text){
  const o = tryJson(text); if(!o) return null;
  const aids = isAids(o.study_aids) ? o.study_aids : isAids(o) ? o : null;
  if(!aids) return null;
  const meta = {materia:str(o.materia||o.subject,80), unidad:str(o.unidad||o.unit||o.title||o.titulo,80), titulo:str(o.titulo||o.title,100),
    fuente:str(o.fuente||o.source,40)||'ZR Note', fecha:/^\d{4}-\d{2}-\d{2}$/.test(o.fecha||'')?o.fecha:''};
  const items = [], seen = new Set();
  const add = (p,r,tipo,expl)=>{
    p = str(p,400); r = str(r,600);
    if(p.length<6 || r.length<2) return;
    const k = p.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g,'');
    if(seen.has(k)) return; seen.add(k);
    items.push({pregunta:p, respuesta:r, explicacion:str(expl,400), tipo});
  };
  arr(aids.study_questions).forEach(x=>x&&add(x.question, x.answer, 'recuperacion'));
  arr(aids.worked_examples).forEach(x=>x&&add(x.problem, x.approach, 'aplicacion'));
  arr(aids.common_mistakes).forEach(x=>x&&add('¿Qué está mal aquí? «'+str(x.mistake,300)+'»', x.correction, 'error'));
  arr(aids.key_concepts).forEach(x=>x&&add('¿Qué es '+str(x.term,120).replace(/[¿?]/g,'')+'?', x.definition, 'recuperacion', x.why));
  arr(aids.key_formulas).forEach(x=>x&&add('¿Qué expresa '+str(x.formula,160)+'?', [str(x.meaning,400), x.when_to_use?'Se usa: '+str(x.when_to_use,200):''].filter(Boolean).join(' '), 'recuperacion'));
  arr(aids.flashcards).forEach(x=>x&&add(x.front, x.back, 'recuperacion'));

  const md = [];
  if(meta.titulo) md.push('# '+meta.titulo);
  arr(aids.outline).forEach(s=>{ if(!s) return; md.push('## '+str(s.section,120)); arr(s.points).forEach(p=>md.push('- '+str(p,300))); });
  const list = (h,a)=>{ const xs=arr(a).map(x=>str(x,300)).filter(Boolean); if(xs.length){ md.push('## '+h); xs.forEach(x=>md.push('- '+x)); } };
  list('Lo que entra en el examen', aids.exam_notes);
  list('Recursos mencionados', aids.resources);
  list('Dudas abiertas', aids.open_questions);
  return {meta, items:items.slice(0,40), examNotes:arr(aids.exam_notes).map(x=>str(x,300)).filter(Boolean).slice(0,12), texto:md.join('\n')};
}

const PACK = {parse};
root.PACK = PACK;
if(typeof module!=='undefined' && module.exports) module.exports = PACK;
})(typeof window!=='undefined' ? window : globalThis);
