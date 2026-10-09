'use strict';
/* Catedra · Tutor: la forma en que Catedra habla. Un profe que quiere que aprendas de verdad:
   habla en primera persona, una idea por burbuja, y te deja responder con un toque.
   Nunca finge ser humano: es Catedra. Solo construye HTML; quien lo usa decide dónde va. */
(function(root){
  function h(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  /* Marca de Catedra: un brote dentro de una forma orgánica que respira */
  function mark(size){
    const s=size||34;
    return `<span class="tu-mark" style="width:${s}px;height:${s}px;" aria-hidden="true"><svg width="${Math.round(s*.6)}" height="${Math.round(s*.6)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 15c-4 0-6.5-2.4-6.5-6 4 0 6.5 2.2 6.5 6z" fill="currentColor" fill-opacity=".22"/><path d="M12 12c0-4 2.4-6.6 6.5-6.8 0 4-2.2 6.6-6.5 6.8z" fill="currentColor" fill-opacity=".32"/></svg></span>`;
  }
  /* lines: textos (o {t, small}) que dice Catedra, cada uno en su burbuja.
     replies: [[texto, onclick, primario?]] respuestas del estudiante.
     opts.compact: sin avatar grande (para Hoy); opts.still: sin animación de entrada */
  function say(lines, replies, opts){
    opts=opts||{};
    const L=(Array.isArray(lines)?lines:[lines]).filter(Boolean);
    const bubbles=L.map((l,i)=>{
      const o=typeof l==='string'?{t:l}:l;
      return `<div class="tu-b${o.small?' small':''}${opts.still?'':' in'}" style="animation-delay:${opts.still?0:i*0.32}s">${o.html||h(o.t)}</div>`;
    }).join('');
    const rs=(replies||[]).filter(Boolean);
    const rDelay=opts.still?0:L.length*0.32+0.1;
    const rep=rs.length?`<div class="tu-replies${opts.still?'':' in'}" style="animation-delay:${rDelay}s">${rs.map(([t,fn,p])=>`<button class="tu-r${p?' p':''}" onclick="${h(fn)}">${h(t)}</button>`).join('')}</div>`:'';
    return `<div class="tu${opts.compact?' compact':''}">${mark(opts.compact?28:34)}<div class="tu-col">${bubbles}${rep}</div></div>`;
  }
  const TUTOR={say, mark, esc:h};
  root.TUTOR=TUTOR;
  if(typeof module!=='undefined'&&module.exports) module.exports=TUTOR;
})(typeof window!=='undefined'?window:globalThis);
