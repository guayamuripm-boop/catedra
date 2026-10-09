'use strict';
/* Catedra · Centro de herramientas: no competimos con los tutores de IA ni con NotebookLM, los orquestamos.
   Catedra decide qué herramienta conviene según lo que le pasa al estudiante, le prepara la instrucción
   y le pide volver para convertir lo entendido en preguntas (evaluarse > releer).
   Solo enlaces a páginas de inicio reales o búsquedas; nunca resultados inventados. */
(function(root){
  const TOOLS = [
    {id:'tutor', para:'No entiendes un concepto', nombre:'Tutor con IA', como:'Te hace preguntas paso a paso en vez de darte la respuesta. Si tu app tiene un modo de estudio o aprendizaje guiado, actívalo.',
      links:[['ChatGPT','https://chatgpt.com/'],['Gemini','https://gemini.google.com/app']], copia:'tutor'},
    {id:'notebook', para:'Tienes mucho material (PDF, guías)', nombre:'NotebookLM', como:'Sube tus PDF o apuntes y pídele un resumen, un audio o preguntas. Luego trae lo útil aquí con "Importar".',
      links:[['Abrir NotebookLM','https://notebooklm.google.com/']], copia:'notebook'},
    {id:'video', para:'Necesitas verlo explicado', nombre:'Un video corto', como:'Busca una explicación de menos de 15 min. Míralo en una sesión de enfoque y al final intenta explicarlo sin mirar.',
      links:[], busca:true},
    {id:'persona', para:'Es algo de tu clase o del examen', nombre:'Pregúntale a alguien', como:'Al profesor, a un preparador o a un compañero que lo domine. Una pregunta concreta se responde rápido.',
      links:[], copia:'persona'}
  ];

  function prompt(kind, tema, materia){
    const t = (tema||'este tema').trim(), m = (materia||'').trim();
    if(kind==='tutor') return 'Actúa como mi tutor'+(m?' de '+m:'')+'. Quiero entender: '+t+'. No me des la respuesta directa: hazme una pregunta a la vez para que yo llegue a entenderlo, corrígeme si me equivoco y al final hazme 3 preguntas cortas para comprobar que lo entendí.';
    if(kind==='notebook') return 'Con base solo en mis fuentes, explícame '+t+' en palabras sencillas, con un ejemplo, y luego hazme 5 preguntas de repaso con sus respuestas.';
    if(kind==='persona') return 'Hola, en '+t+(m?' ('+m+')':'')+' no me queda claro ______. ¿Me lo podría explicar con un ejemplo?';
    return '';
  }
  function videoQuery(tema, materia){ return ((tema||'').trim()+' explicación '+(materia||'').trim()).trim(); }

  const HUB = {TOOLS, prompt, videoQuery};
  root.HUB = HUB;
  if(typeof module!=='undefined' && module.exports) module.exports = HUB;

  /* ───────── Interfaz (solo navegador) ───────── */
  if(typeof document==='undefined') return;
  function state(){ return (typeof S!=='undefined') ? S : root.S; }
  function h(s){ return typeof root.esc==='function' ? root.esc(s) : String(s); }
  function val(id){ const e=document.getElementById(id); return e?e.value:''; }
  function materia(){ const S=state(), sid=val('hub-subj'); const s=S&&S.subjects.find(x=>x.id===sid); return s?s.nombre:''; }

  root.openStuck = function(sid){
    const S=state(), subs=(S&&S.subjects)||[];
    const opts=subs.map(s=>`<option value="${s.id}"${s.id===sid?' selected':''}>${h(s.nombre)}</option>`).join('');
    root.openSheet(`<div class="eyebrow">¿Atascado?</div>
      <div class="h1" style="font-size:19px;">Te digo dónde conviene buscar</div>
      <input type="text" id="hub-tema" placeholder="¿Qué tema no entiendes?" style="margin-top:8px;">
      ${opts?`<select id="hub-subj" style="margin-top:8px;">${opts}</select>`:''}
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
      ${TOOLS.map(t=>`<div class="hub-tool"><div class="eyebrow" style="color:var(--brass);">${h(t.para)}</div>
        <div style="font-weight:600;margin-top:2px;">${h(t.nombre)}</div>
        <div class="muted" style="font-size:12px;line-height:1.45;margin-top:2px;">${h(t.como)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          ${t.copia?`<button class="btn btn-ghost btn-sm" onclick="hubCopy('${t.copia}',this)">Copiar instrucción</button>`:''}
          ${t.links.map(([l,u])=>`<a class="btn btn-ghost btn-sm" href="${u}" target="_blank" rel="noopener">${h(l)} ↗</a>`).join('')}
          ${t.busca?`<button class="btn btn-ghost btn-sm" onclick="hubVideo()">Buscar en YouTube ↗</button>`:''}
        </div></div>`).join('')}
      </div>
      <div class="muted" style="font-size:12px;line-height:1.5;margin-top:12px;">Cuando lo entiendas, vuelve y conviértelo en preguntas: entenderlo hoy no es recordarlo en el examen.</div>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" onclick="closeSheet();goTab('materials')">Ya lo entendí: crear preguntas</button>`);
    if(typeof root.track==='function') root.track('stuck_open',{});
  };
  root.hubCopy = function(kind, btn){
    const txt = prompt(kind, val('hub-tema'), materia());
    const done = ()=>{ if(btn){ btn.textContent='Copiada ✓'; } if(typeof root.track==='function') root.track('stuck_copy',{kind}); };
    try{ navigator.clipboard.writeText(txt).then(done, ()=>{ window.prompt('Copia esta instrucción:', txt); done(); }); }
    catch(e){ window.prompt('Copia esta instrucción:', txt); done(); }
  };
  root.hubVideo = function(){
    const q = videoQuery(val('hub-tema'), materia());
    const u = (typeof root.STRAT!=='undefined') ? root.STRAT.searchUrl(q) : 'https://www.youtube.com/results?search_query='+encodeURIComponent(q);
    window.open(u,'_blank','noopener');
  };
})(typeof window!=='undefined' ? window : globalThis);
