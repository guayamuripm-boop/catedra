'use strict';
/* Catedra · Modelo de estudio: Espacio > Materia > Unidades, Materiales y Evaluaciones.
   Un "espacio" es dónde estudias (universidad, bachillerato, academia, curso o por tu cuenta) y solo cambia
   el vocabulario y el ritmo. Todo es opcional: quien no quiera orden no lo ve. Los datos anteriores
   se migran solos (cada materia con examDate recibe una evaluación). */
(function(root){
const pad = n=>String(n).padStart(2,'0');
function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function parse(s){ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }

const TIPOS = {
  universidad:{n:'Universidad', unidad:'Tema', evaluacion:'Parcial', ph:'Ej. Parcial 1', fase:'semestre'},
  bachillerato:{n:'Colegio', unidad:'Tema', evaluacion:'Evaluación', ph:'Ej. Evaluación del lapso', fase:'lapso'},
  academia:{n:'Academia', unidad:'Módulo', evaluacion:'Simulacro', ph:'Ej. Simulacro 2', fase:'ciclo'},
  curso:{n:'Curso', unidad:'Módulo', evaluacion:'Examen', ph:'Ej. Examen final', fase:'curso'},
  propio:{n:'Por mi cuenta', unidad:'Tema', evaluacion:'Evaluación', ph:'Ej. Examen, entrega o meta', fase:'meta'}
};
const MATERIAL_TIPOS = ['texto','clase','foto','pdf','video','enlace','nota'];

function ensure(st){
  st.spaces = st.spaces||[]; st.materials = st.materials||[];
  st.spIdCounter = st.spIdCounter||0; st.matIdCounter = st.matIdCounter||0; st.unitIdCounter = st.unitIdCounter||0; st.evalIdCounter = st.evalIdCounter||0;
  if(!st.spaces.length) st.spaces.push({id:'sp'+(st.spIdCounter++), tipo:'propio', nombre:'Mis materias'});
  (st.subjects||[]).forEach(s=>{
    if(!s.spaceId || !st.spaces.some(x=>x.id===s.spaceId)) s.spaceId = st.spaces[0].id;
    s.units = s.units||[]; s.evals = s.evals||[];
    if(s.examDate && !s.evals.length){
      s.evals.push({id:'ev'+(st.evalIdCounter++), nombre:'Examen', fecha:s.examDate, peso:0, unitIds:[], asks:[]});
    }
  });
  return st;
}
function spaceOf(st,s){ return st.spaces.find(x=>x.id===s.spaceId) || st.spaces[0]; }
function vocab(st,s){ const sp = spaceOf(st,s); return TIPOS[sp&&sp.tipo] || TIPOS.propio; }

function addSpace(st,tipo,nombre){
  const sp = {id:'sp'+(st.spIdCounter++), tipo:TIPOS[tipo]?tipo:'propio', nombre:(nombre||TIPOS[tipo]&&TIPOS[tipo].n||'Mis materias')};
  st.spaces.push(sp); return sp;
}
// Reutiliza el espacio de ese tipo si ya existe (la mayoría tiene uno por tipo)
function spaceFor(st,tipo){
  const t = TIPOS[tipo]?tipo:'propio';
  return st.spaces.find(x=>x.tipo===t) || addSpace(st,t,TIPOS[t].n);
}
function addUnit(st,s,nombre){
  const u = {id:'un'+(st.unitIdCounter++), nombre:String(nombre||'Tema').trim().slice(0,80), createdAt:Date.now()};
  s.units.push(u); return u;
}
function unitFor(st,s,nombre){
  const n = String(nombre||'').trim().toLowerCase();
  return s.units.find(u=>u.nombre.toLowerCase()===n) || addUnit(st,s,nombre);
}
// Tras cambiar evaluaciones, examDate sigue siendo la próxima fecha (el resto de la app lo lee)
function syncExam(s,today){
  const t = today || iso(new Date());
  const fut = (s.evals||[]).filter(e=>e.fecha && e.fecha>=t).sort((a,b)=>a.fecha<b.fecha?-1:1);
  if(fut.length) s.examDate = fut[0].fecha;
  else if((s.evals||[]).length){ const all=s.evals.filter(e=>e.fecha).sort((a,b)=>a.fecha<b.fecha?1:-1); s.examDate = all.length?all[0].fecha:''; }
  return s.examDate||'';
}
function addEval(st,s,o){
  const e = {id:'ev'+(st.evalIdCounter++), nombre:String(o.nombre||'Examen').trim().slice(0,60), fecha:o.fecha||'', peso:Math.max(0,Math.min(100,+o.peso||0)), unitIds:o.unitIds||[], asks:o.asks||[]};
  s.evals.push(e); syncExam(s); return e;
}
function removeEval(st,s,id,today){ s.evals = s.evals.filter(e=>e.id!==id); syncExam(s,today); if(!s.evals.length) s.examDate=''; }
function nextEval(s,today){
  const t = today || iso(new Date());
  return (s.evals||[]).filter(e=>e.fecha && e.fecha>=t).sort((a,b)=>a.fecha<b.fecha?-1:1)[0] || null;
}
function addMaterial(st,o){
  const m = {id:'mat'+(st.matIdCounter++), subjectId:o.subjectId, unitId:o.unitId||'', tipo:MATERIAL_TIPOS.includes(o.tipo)?o.tipo:'texto',
    titulo:String(o.titulo||'').trim().slice(0,100), texto:String(o.texto||'').slice(0,30000), fuente:o.fuente||'', estado:o.estado||'recibido', createdAt:Date.now()};
  st.materials.push(m); return m;
}
// Cuenta cuántas preguntas aprobadas hay por unidad y qué unidades tienen material sin práctica
function coverage(st,s,today){
  const t = today || iso(new Date());
  return (s.units||[]).map(u=>{
    const items = s.items.filter(i=>i.unitId===u.id);
    return {unit:u, items:items.length, due:items.filter(i=>i.nextReviewDate<=t).length,
      materials:st.materials.filter(m=>m.subjectId===s.id && m.unitId===u.id).length};
  });
}
// Material aún sin convertir en práctica (para avisar con calma)
function pendingMaterials(st,s){ return st.materials.filter(m=>m.subjectId===s.id && m.estado==='recibido'); }
function daysBetween(a,b){ return Math.round((parse(b)-parse(a))/864e5); }

const SP = {TIPOS, MATERIAL_TIPOS, ensure, spaceOf, vocab, addSpace, spaceFor, addUnit, unitFor, addEval, removeEval, syncExam, nextEval, addMaterial, coverage, pendingMaterials, daysBetween, iso};
root.SP = SP;
if(typeof module!=='undefined' && module.exports) module.exports = SP;
})(typeof window!=='undefined' ? window : globalThis);
