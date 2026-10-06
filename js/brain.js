/* Catedra · Segundo cerebro: capturar -> organizar -> recuperar -> practicar */

// ── Hoja inferior reutilizable ──
(function(){
  const st=document.createElement('style');
  st.textContent=`.sheet-back{position:absolute;inset:0;z-index:50;background:rgba(5,7,12,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:flex-end;}
  .sheet{width:100%;background:var(--ink-mid);border-top:1px solid var(--glass-border-strong);border-radius:20px 20px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;}`;
  document.head.appendChild(st);
})();
function openSheet(html){
  closeSheet();
  const w=document.createElement('div'); w.className='sheet-back'; w.id='sheet';
  w.innerHTML=`<div class="sheet fade-in">${html}</div>`;
  w.addEventListener('click',e=>{if(e.target===w)closeSheet();});
  document.querySelector('.app-shell').appendChild(w);
}
function closeSheet(){const e=document.getElementById('sheet'); if(e)e.remove();}

// ── Notas ──
let brainQ='', brainFilter='all', brainTag='', curNote=null;
function noteTitle(n){return (n.title||'').trim() || (n.text||'').trim().split('\n')[0].slice(0,48) || 'Sin título';}
function parseTags(t){const m=(t||'').match(/#([\p{L}\p{N}_]{2,24})/gu)||[]; return [...new Set(m.map(x=>x.slice(1).toLowerCase()))];}
function addNote(o){
  const now=Date.now();
  const n={id:'note'+(S.noteIdCounter++), title:o.title||'', text:(o.text||'').slice(0,200000), subjectId:o.subjectId||null, source:o.source||'texto', tags:[], createdAt:now, updatedAt:now};
  n.tags=parseTags(n.title+' '+n.text);
  S.notes.unshift(n); saveState(); return n;
}
function subjName(id){const s=S.subjects.find(x=>x.id===id);return s?s.nombre:'';}
function relDay(ts){
  const d=Math.round((parseDay(todayStr())-parseDay(localISO(new Date(ts))))/864e5);
  return d<=0?'hoy':d===1?'ayer':d<7?'hace '+d+' d':localISO(new Date(ts)).slice(5);
}
function searchNotes(){
  let list=S.notes.slice();
  if(brainFilter==='inbox') list=list.filter(n=>!n.subjectId);
  else if(brainFilter!=='all') list=list.filter(n=>n.subjectId===brainFilter);
  if(brainTag) list=list.filter(n=>n.tags.includes(brainTag));
  const toks=norm(brainQ).split(' ').filter(Boolean);
  if(!toks.length) return list.sort((a,b)=>b.updatedAt-a.updatedAt);
  const scored=[];
  for(const n of list){
    const t=norm(noteTitle(n)), x=norm(n.text), g=n.tags.join(' ');
    let sc=0, ok=true;
    for(const k of toks){
      let h=0; if(t.includes(k))h+=3; if(g.includes(k))h+=2; if(x.includes(k))h+=1;
      if(!h){ok=false;break;} sc+=h;
    }
    if(ok) scored.push({n,sc});
  }
  return scored.sort((a,b)=>b.sc-a.sc||b.n.updatedAt-a.n.updatedAt).map(x=>x.n);
}
function renderCerebro(){
  const badge=document.getElementById('brain-badge');
  const inbox=S.notes.filter(n=>!n.subjectId).length;
  if(badge){badge.textContent=inbox>9?'9+':inbox; badge.style.display=inbox?'flex':'none';}
  const fl=document.getElementById('brain-filters'), ls=document.getElementById('brain-list');
  if(!fl||!ls) return;
  const chip=(id,label,sel)=>`<button class="chip${sel?' selected':''}" data-f="${id}" style="min-height:34px;padding:7px 13px;font-size:12px;">${label}</button>`;
  let h='<div class="chip-row" style="margin-top:12px;">'+chip('all','Todo',brainFilter==='all')+(inbox?chip('inbox','Sin clasificar · '+inbox,brainFilter==='inbox'):'')+S.subjects.map(s=>chip(s.id,esc(s.nombre),brainFilter===s.id)).join('')+'</div>';
  const tagCount={}; S.notes.forEach(n=>n.tags.forEach(t=>tagCount[t]=(tagCount[t]||0)+1));
  const tags=Object.keys(tagCount).sort((a,b)=>tagCount[b]-tagCount[a]).slice(0,8);
  if(tags.length) h+='<div class="chip-row" style="margin-top:8px;">'+tags.map(t=>`<button class="chip${brainTag===t?' selected':''}" data-t="${esc(t)}" style="min-height:30px;padding:5px 11px;font-size:11px;">#${esc(t)}</button>`).join('')+'</div>';
  fl.innerHTML=h;
  fl.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{brainFilter=b.dataset.f;renderCerebro();}));
  fl.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{brainTag=brainTag===b.dataset.t?'':b.dataset.t;renderCerebro();}));
  const list=searchNotes();
  if(!list.length){
    ls.innerHTML=`<div class="empty-card" style="margin-top:16px;">${S.notes.length?'Nada coincide.':'Captura una nota, una voz o un archivo.'}</div>`;
    return;
  }
  const srcIcon={voz:'🎙',archivo:'📎',foto:'📷',compartido:'↗',pegado:'📋',notebooklm:'✦',texto:''};
  ls.innerHTML=list.map(n=>{
    const subj=n.subjectId?`<span class="tag-pill subj">${esc(subjName(n.subjectId))}</span>`:
      (S.subjects.slice(0,3).map(s=>`<button class="tag-pill inbox" data-assign="${n.id}|${s.id}" style="border:none;cursor:pointer;">→ ${esc(s.nombre)}</button>`).join('')||'<span class="tag-pill inbox">Sin clasificar</span>');
    return `<div class="glass note-card fade-in" data-open="${n.id}">
      <div class="nt">${srcIcon[n.source]?srcIcon[n.source]+' ':''}${esc(noteTitle(n))}</div>
      <div class="ns">${esc((n.text||'').replace(/\s+/g,' ').slice(0,160))}</div>
      <div class="note-tags">${subj}${n.tags.slice(0,3).map(t=>`<span class="tag-pill">#${esc(t)}</span>`).join('')}<span class="tag-pill" style="margin-left:auto;">${relDay(n.updatedAt)}</span></div></div>`;
  }).join('');
  ls.querySelectorAll('[data-open]').forEach(c=>c.addEventListener('click',()=>openNoteEditor(c.dataset.open)));
  ls.querySelectorAll('[data-assign]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); const [nid,sid]=b.dataset.assign.split('|');
    const n=S.notes.find(x=>x.id===nid); if(n){n.subjectId=sid;n.updatedAt=Date.now();saveState();renderCerebro();showToast('Guardada en '+subjName(sid));}
  }));
}
document.getElementById('brain-search').addEventListener('input',e=>{brainQ=e.target.value;renderCerebro();});

// ── Editor de nota ──
let _noteTimer=null;
function openNoteEditor(id, preset){
  const ex=id?S.notes.find(n=>n.id===id):null;
  curNote=ex||{draft:true,id:null,title:'',text:(preset&&preset.text)||'',subjectId:(preset&&preset.subjectId)||(brainFilter!=='all'&&brainFilter!=='inbox'?brainFilter:null),source:(preset&&preset.source)||'texto'};
  document.getElementById('note-title').value=curNote.title||'';
  document.getElementById('note-text').value=curNote.text||'';
  renderNoteSubjects(); renderNoteMeta(); renderNotePending();
  showView('note'); document.getElementById('tabbar').style.display='none';
  if(!ex) setTimeout(()=>document.getElementById('note-text').focus(),50);
}
function renderNoteSubjects(){
  const h=document.getElementById('note-subjects');
  h.innerHTML=`<button class="chip${!curNote.subjectId?' selected':''}" data-s="" style="min-height:34px;padding:7px 13px;font-size:12px;">Sin materia</button>`+
    S.subjects.map(s=>`<button class="chip${curNote.subjectId===s.id?' selected':''}" data-s="${s.id}" style="min-height:34px;padding:7px 13px;font-size:12px;">${esc(s.nombre)}</button>`).join('');
  h.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{curNote.subjectId=b.dataset.s||null;persistNote();renderNoteSubjects();}));
}
function renderNoteMeta(){
  const t=document.getElementById('note-text').value;
  const w=norm(t).split(' ').filter(Boolean).length;
  document.getElementById('note-meta').textContent=w+' palabras'+(parseTags(t).length?' · '+parseTags(t).map(x=>'#'+x).join(' '):'');
}
function persistNote(){
  const title=document.getElementById('note-title').value, text=document.getElementById('note-text').value;
  curNote.title=title; curNote.text=text;
  if(curNote.draft){
    if(!title.trim() && !text.trim()) return;
    const n=addNote({title,text,subjectId:curNote.subjectId,source:curNote.source});
    curNote=n;
  } else {
    curNote.tags=parseTags(title+' '+text); curNote.updatedAt=Date.now();
    const i=S.notes.findIndex(x=>x.id===curNote.id); if(i>=0) S.notes[i]=curNote;
    saveState();
  }
}
['note-title','note-text'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{
  renderNoteMeta(); clearTimeout(_noteTimer); _noteTimer=setTimeout(persistNote,400);
}));
function closeNote(){
  clearTimeout(_noteTimer); persistNote(); curNote=null; goTab('cerebro');
}
function deleteNote(){
  if(!curNote) return;
  if(!curNote.draft && !confirm('¿Borrar esta nota?')) return;
  if(!curNote.draft){S.notes=S.notes.filter(n=>n.id!==curNote.id); saveState();}
  curNote=null; goTab('cerebro'); showToast('Nota borrada');
}
async function noteToQuestions(){
  persistNote();
  if(!curNote||curNote.draft){showToast('Escribe algo primero');return;}
  if(!curNote.subjectId){showToast('Elige una materia arriba');return;}
  if((curNote.text||'').trim().length<80){showToast('Muy corta para crear preguntas');return;}
  showToast('Creando preguntas…');
  const n=await generateFromText(curNote.text, curNote.subjectId, {noteId:curNote.id});
  renderNotePending();
  showToast(n?n+' preguntas para revisar':'No se pudieron crear preguntas');
}

// ── Preguntas pendientes en nota / importacion ──
function pendingCardHTML(it){
  const tag=it.origen==='NotebookLM'?'Importada':(it.mock?'Sin IA':'IA');
  return `<div class="glass item-card fade-in"><span class="eyebrow">${tag}</span>
    <div class="q" style="margin-top:4px;">${esc(it.pregunta)}</div>
    <div class="muted" style="font-size:12px;margin-top:6px;">${esc((it.respuesta||'').slice(0,140))}${(it.respuesta||'').length>140?'…':''}</div>
    ${it.cita?`<div class="cita">"${esc(it.cita.slice(0,140))}"</div>`:''}
    <div class="item-actions"><button class="btn grade-high" data-ap="${it.id}">Aprobar</button><button class="btn grade-low" data-ds="${it.id}">Descartar</button></div></div>`;
}
function renderPendingInto(elId, filterFn){
  const el=document.getElementById(elId); if(!el) return;
  const mine=S.pendingItems.filter(filterFn);
  if(!mine.length){el.innerHTML='';return;}
  el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;"><span class="section-title" style="margin:0;">Revisa ${mine.length}</span><button class="btn btn-ghost btn-sm" data-apall="1">Aprobar todo</button></div>`+mine.map(pendingCardHTML).join('');
  el.querySelectorAll('[data-ap]').forEach(b=>b.addEventListener('click',()=>approveItem(b.dataset.ap)));
  el.querySelectorAll('[data-ds]').forEach(b=>b.addEventListener('click',()=>discardItem(b.dataset.ds)));
  const all=el.querySelector('[data-apall]'); if(all) all.addEventListener('click',()=>{mine.map(m=>m.id).forEach(id=>approveItem(id,true)); saveState(); refreshPendingExtra(); renderAll(); showToast(mine.length+' aprobadas');});
}
function renderNotePending(){ renderPendingInto('note-pending', p=>curNote&&curNote.id&&p.noteId===curNote.id); }
let importSubject=null;
function renderImportPending(){ renderPendingInto('import-result', p=>p.origen==='NotebookLM' && p.subjectId===importSubject); }
function refreshPendingExtra(){ renderNotePending(); renderImportPending(); }

// ── Captura: voz, archivos, pegar ──
let brainVoice={rec:null,active:false,text:'',interim:''};
function paintBrainVoice(){
  const box=document.getElementById('brain-voice-live');
  box.innerHTML=`<div class="eyebrow" style="color:#E3B3A7;margin-bottom:6px;">Escuchando… toca Voz para terminar</div><div style="font-size:14px;line-height:1.5;">${esc((brainVoice.text+' '+brainVoice.interim).trim())||'…'}</div>`;
}
function dictateNote(){
  const btn=document.getElementById('cap-voice'), box=document.getElementById('brain-voice-live');
  if(brainVoice.active){ stopDictation(); return; }
  if(!SR_API){showToast('Tu navegador no dicta voz. Escribe la nota.');openNoteEditor();return;}
  if(!ensureVoiceConsent()) return;
  const r=new SR_API(); r.lang=speechLang(); r.continuous=true; r.interimResults=true;
  brainVoice={rec:r,active:true,text:'',interim:''};
  r.onresult=e=>{let it='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript; if(e.results[i].isFinal)brainVoice.text+=t+' '; else it+=t;} brainVoice.interim=it; paintBrainVoice();};
  r.onerror=e=>{ if(['not-allowed','service-not-allowed','network'].includes(e.error)){showToast(e.error==='network'?'Sin conexión para transcribir':'Sin permiso de micrófono'); brainVoice.active=false; stopDictation(true);} };
  r.onend=()=>{ if(brainVoice.active){ try{r.start();}catch(err){} } };
  try{r.start();}catch(err){showToast('No se pudo iniciar el micrófono');brainVoice.active=false;return;}
  btn.classList.add('live'); box.style.display='block'; paintBrainVoice();
}
function stopDictation(silent){
  const r=brainVoice.rec; brainVoice.active=false;
  try{r&&r.stop();}catch(e){}
  document.getElementById('cap-voice').classList.remove('live');
  document.getElementById('brain-voice-live').style.display='none';
  const text=(brainVoice.text+' '+brainVoice.interim).trim();
  if(text.length>2 && !silent){
    const n=addNote({text, source:'voz', subjectId:(brainFilter!=='all'&&brainFilter!=='inbox')?brainFilter:null});
    renderCerebro(); showToast('Nota guardada');
  }
  brainVoice={rec:null,active:false,text:'',interim:''};
}
async function pasteNote(){
  try{
    const t=await navigator.clipboard.readText();
    if(t&&t.trim()){ const n=addNote({text:t,source:'pegado'}); renderCerebro(); openNoteEditor(n.id); showToast('Pegado'); return; }
    showToast('El portapapeles está vacío');
  }catch(e){ openNoteEditor(); showToast('Pega aquí el texto'); }
}
let _pdfLoading=null;
function loadPdfJs(){
  if(window.pdfjsLib) return Promise.resolve();
  if(_pdfLoading) return _pdfLoading;
  _pdfLoading=new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';res();};
    s.onerror=()=>{_pdfLoading=null;rej(new Error('pdfjs'));};
    document.head.appendChild(s);
  });
  return _pdfLoading;
}
async function pdfToText(buf){
  await loadPdfJs();
  const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
  const pages=Math.min(pdf.numPages,60); let out='';
  for(let i=1;i<=pages;i++){
    const pg=await pdf.getPage(i); const c=await pg.getTextContent();
    out+=c.items.map(x=>x.str).join(' ')+'\n\n';
  }
  return out.trim();
}
async function ingestFile(file, source){
  const name=(file.name||'archivo').replace(/\.[^.]+$/,'');
  const isPdf=/\.pdf$/i.test(file.name||'')||file.type==='application/pdf';
  try{
    let text;
    if(isPdf){ showToast('Leyendo PDF…'); text=await pdfToText(await file.arrayBuffer()); }
    else text=await file.text();
    if(!text||text.trim().length<20){showToast(isPdf?'Ese PDF no tiene texto (parece una imagen)':'Archivo vacío');return null;}
    return addNote({title:name,text,source:source||'archivo',subjectId:(brainFilter!=='all'&&brainFilter!=='inbox')?brainFilter:null});
  }catch(e){ showToast(isPdf?'No se pudo leer el PDF (¿sin conexión?)':'No se pudo leer el archivo'); return null; }
}
document.getElementById('brain-file').addEventListener('change',async e=>{
  const files=[...e.target.files]; e.target.value='';
  let n=0; for(const f of files){ if(await ingestFile(f,'archivo')) n++; }
  if(n){renderCerebro();showToast(n+(n===1?' archivo guardado':' archivos guardados'));}
});

// ── Foto de apuntes -> texto (IA de visión) ──
function resizeImage(file, max, q){
  return new Promise((res,rej)=>{
    const img=new Image(), u=URL.createObjectURL(file);
    img.onload=()=>{
      const s=Math.min(1, max/Math.max(img.width,img.height));
      const c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(u);
      res(c.toDataURL('image/jpeg',q));
    };
    img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'));};
    img.src=u;
  });
}
async function photoNote(file){
  if(!aiEnabled()||!aiTaskOn('transcribe')){showToast('Leer fotos necesita la IA, que aún no está activa');return;}
  try{
    showToast('Leyendo foto…');
    const dataUrl=await resizeImage(file,1600,0.82);
    const r=await aiCall('transcribe',{image:dataUrl});
    if(!r||!r.text||r.legible===false){showToast('No pude leer esa foto. Prueba con más luz y de frente.');return;}
    const n=addNote({title:'Foto '+todayStr(),text:r.text,source:'foto',subjectId:(brainFilter!=='all'&&brainFilter!=='inbox')?brainFilter:null});
    renderCerebro(); openNoteEditor(n.id); showToast('Revisa el texto antes de usarlo');
  }catch(e){ showToast('No se pudo procesar la foto'); }
}
document.getElementById('brain-photo').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(f) await photoNote(f);
});

// ── Contenido compartido desde otras apps (Android, PWA instalada) ──
async function intakeShared(){
  const q=new URLSearchParams(location.search);
  if(!q.has('shared')) return;
  try{
    const cache=await caches.open('catedra-share');
    const mr=await cache.match('./share/meta'); if(!mr) return;
    const meta=await mr.json(); let n=0;
    const body=[meta.text,meta.url].filter(Boolean).join('\n\n').trim();
    if(body){ addNote({title:meta.title||'',text:body,source:'compartido'}); n++; }
    for(const f of meta.files||[]){
      const r=await cache.match(f.key); if(!r) continue;
      const blob=await r.blob();
      const file=new File([blob], f.name||'compartido', {type:f.type||blob.type});
      if(await ingestFile(file,'compartido')) n++;
      await cache.delete(f.key);
    }
    await cache.delete('./share/meta');
    window.__sharedCount=n;
  }catch(e){}
  history.replaceState(null,'',location.pathname);
}
function afterBoot(){
  if(window.__sharedCount){ goTab('cerebro'); showToast(window.__sharedCount+' guardado'+(window.__sharedCount>1?'s':'')+' en Cerebro'); window.__sharedCount=0; return; }
  const g=new URLSearchParams(location.search).get('go');
  if(g==='capture'){ goTab('cerebro'); openNoteEditor(); }
  else if(g==='study'){ const b=buildDailyPlan()[0]; if(b) startSessionFlow(b.subjectId); }
  if(g) history.replaceState(null,'',location.pathname);
}

// ── Puente con NotebookLM ──
function buildNotebookPack(sid){
  const s=S.subjects.find(x=>x.id===sid); if(!s) return {md:'',notes:0,qs:0};
  const notes=S.notes.filter(n=>n.subjectId===sid);
  let md=`# ${s.nombre}\n\n`;
  if(s.examDate) md+=`Examen: ${s.examDate}\n\n`;
  md+=`_Paquete de fuentes generado por Catedra el ${todayStr()}._\n\n`;
  if(notes.length){ md+='## Notas\n\n'+notes.map(n=>`### ${noteTitle(n)}\n\n${n.text.trim()}\n`).join('\n')+'\n'; }
  if(s.items.length){
    md+='## Preguntas de estudio\n\n'+s.items.map((it,i)=>`**${i+1}. ${it.pregunta}**\n\n${it.respuesta}\n${it.cita?`\n> Fuente: "${it.cita}"\n`:''}`).join('\n')+'\n';
  }
  return {md, notes:notes.length, qs:s.items.length, name:s.nombre};
}
function exportNotebookPack(sid){
  const pk=buildNotebookPack(sid);
  if(!pk.notes && !pk.qs){showToast('Esta materia aún no tiene notas ni preguntas');return;}
  const fname='catedra-'+norm(pk.name).replace(/\s+/g,'-')+'.md';
  let canShare=false, shareFile=null;
  try{ shareFile=new File([pk.md],fname,{type:'text/markdown'}); canShare=!!(navigator.canShare&&navigator.canShare({files:[shareFile]})); }catch(e){}
  openSheet(`<div class="h1" style="font-size:20px;">Paquete para NotebookLM</div>
    <div class="muted">${pk.notes} nota${pk.notes===1?'':'s'} · ${pk.qs} pregunta${pk.qs===1?'':'s'} · se sube como fuente</div>
    <button class="btn btn-primary btn-block" id="pk-dl">Descargar .md</button>
    ${canShare?'<button class="btn btn-ghost btn-block" id="pk-share">Compartir con otra app</button>':''}
    <button class="btn btn-ghost btn-block" id="pk-copy">Copiar texto</button>
    <button class="btn btn-ghost btn-block" id="pk-prompt">Copiar instrucción para NotebookLM</button>
    <button class="btn btn-ghost btn-block" id="pk-open">Abrir NotebookLM</button>
    <div class="muted" style="font-size:11px;text-align:center;">Pega la instrucción en NotebookLM y luego usa Importar.</div>`);
  document.getElementById('pk-prompt').onclick=async()=>{
    const p='Con las fuentes de este cuaderno, crea 10 preguntas de estudio para practicar sin mirar los apuntes. Incluye 3 de aplicación a situaciones cotidianas de un estudiante. Usa EXACTAMENTE este formato, sin viñetas ni numeración, una pregunta por bloque:'+'\n\nP: pregunta\nR: respuesta breve (máximo 2 frases) basada solo en las fuentes\n';
    try{await navigator.clipboard.writeText(p);showToast('Instrucción copiada');}catch(e){showToast('No se pudo copiar');}
  };
  document.getElementById('pk-dl').onclick=()=>{
    const b=new Blob([pk.md],{type:'text/markdown'}), u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u;a.download=fname;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(u),2000);showToast('Archivo descargado');
  };
  const sh=document.getElementById('pk-share'); if(sh) sh.onclick=()=>navigator.share({files:[shareFile],title:pk.name}).catch(()=>{});
  document.getElementById('pk-copy').onclick=async()=>{try{await navigator.clipboard.writeText(pk.md);showToast('Copiado');}catch(e){showToast('No se pudo copiar');}};
  document.getElementById('pk-open').onclick=()=>window.open('https://notebooklm.google.com','_blank','noopener');
}
function openImport(sid){
  importSubject=sid;
  document.getElementById('import-subject').textContent=subjName(sid);
  document.getElementById('import-text').value=''; document.getElementById('import-result').innerHTML='';
  showView('import'); document.getElementById('tabbar').style.display='none';
  renderImportPending();
}
function stripMd(l){return l.replace(/^\s*(?:[-*•]+|\d+[.)])\s+/,'').replace(/\*\*|__|`/g,'').trim();}
function parseImported(text){
  const clean=text.replace(/\r/g,'').split('\n').map(stripMd);
  const qre=/^(?:pregunta|p|q|question)\s*\d*\s*[:.\-)]\s*(.+)$/i, are=/^(?:respuesta|r|a|answer)\s*[:.\-)]\s*(.+)$/i;
  const A=[]; let cq=null, ca=null;
  for(const l of clean){
    if(!l) continue; let m;
    if((m=l.match(qre))){ if(cq&&ca) A.push([cq,ca]); cq=m[1].trim(); ca=null; continue; }
    if(cq!==null && (m=l.match(are)) && ca===null){ ca=m[1].trim(); continue; }
    if(cq!==null){ if(ca===null) cq+=' '+l; else ca+=' '+l; }
  }
  if(cq&&ca) A.push([cq,ca]);
  if(A.length>=2) return A;
  const B=[]; let q=null, a=[];
  for(const l of clean){
    if(!l){ if(q&&a.length){B.push([q,a.join(' ')]);q=null;a=[];} continue; }
    if(/\?\s*$/.test(l) && l.length<220){ if(q&&a.length) B.push([q,a.join(' ')]); q=l; a=[]; }
    else if(q) a.push(l);
  }
  if(q&&a.length) B.push([q,a.join(' ')]);
  if(B.length>=2) return B;
  const C=[];
  for(const l of clean){ const m=l.match(/^([^:–—]{2,50}?)\s*(?::|–|—|\s-\s)\s*(.{25,})$/); if(m&&m[1].trim().split(' ').length<=6) C.push(['¿Qué es '+m[1].trim().replace(/[¿?]/g,'')+'?', m[2].trim()]); }
  return C.length>=3 ? C : [];
}
function runImport(){
  const text=document.getElementById('import-text').value.trim();
  if(text.length<30){showToast('Pega primero el texto');return;}
  const pairs=parseImported(text).slice(0,40);
  const host=document.getElementById('import-result');
  if(pairs.length){
    pairs.forEach(([q,a])=>S.pendingItems.push({id:'item'+(S.itemIdCounter++),subjectId:importSubject,pregunta:q.slice(0,400),respuesta:a.slice(0,600),explicacion:'',cita:'',dificultad:'media',tipo:'recuperacion',mock:false,origen:'NotebookLM'}));
    saveState(); renderImportPending(); showToast(pairs.length+' preguntas detectadas');
  } else {
    const n=addNote({title:'De NotebookLM',text,source:'notebooklm',subjectId:importSubject});
    host.innerHTML=`<div class="glass fade-in" style="margin-top:12px;"><div style="font-size:13.5px;">No detecté preguntas. Lo guardé como nota en Cerebro.</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" id="imp-open">Abrir nota</button></div>`;
    document.getElementById('imp-open').onclick=()=>openNoteEditor(n.id);
    renderCerebro();
  }
}
