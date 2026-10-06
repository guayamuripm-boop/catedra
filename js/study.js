/* Catedra · Evaluacion: escrita, oral, pretest, simulacro, audio.
   La cobertura es una heuristica lexica (sin IA). Si hay IA configurada (js/ai.js) se usa encima. */

// ── Utilidades de texto ──
const STOP = new Set('para como este esta estos estas pero sino porque cuando donde cual cuales cada todo toda todos todas otro otra otros otras algo nada puede pueden tiene tienen hace hacen debe deben solo tambien muy mas menos entre sobre desde hasta hacia segun esto eso aquel aquella ellos ellas nosotros fue fueron sera seran son ser esta estan estar ese esa del las los una unos unas que con por sus su sin les han hay asi aun ante bajo tras'.split(' '));
function norm(s){return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function stem(w){return w.length>5 ? w.slice(0,w.length-2) : w;}
function keyTerms(text){return [...new Set(norm(text).split(' ').filter(w=>w.length>3 && !STOP.has(w)).map(stem))];}
function coverageOf(userText, refText){
  const terms = keyTerms(refText);
  if(!terms.length) return {pct:0, matched:[], missing:[]};
  const u = norm(userText);
  const uStems = new Set(u.split(' ').map(stem));
  const matched = terms.filter(t=>uStems.has(t) || u.includes(t));
  const missing = terms.filter(t=>!matched.includes(t));
  return {pct:Math.round(matched.length/terms.length*100), matched, missing};
}
function stateOfPct(p){return p>=50?'covered':p>=25?'partial':'missed';}
function scoreOfState(st){return st==='covered'?100:st==='partial'?50:0;}

function scheduleItem(it, score, ctx){
  it.recallScores = it.recallScores||[]; it.recallScores.push(score);
  if(it.recallScores.length>10) it.recallScores.shift();
  if(score===0){it.consolidationStreak=0; it.nextReviewDate=addDays(todayStr(),1);}
  else if(score===50){it.consolidationStreak=0; it.nextReviewDate=addDays(todayStr(),3);}
  else{it.consolidationStreak=(it.consolidationStreak||0)+1; const idx=Math.min(it.consolidationStreak,INTERVALS.length-1); it.nextReviewDate=addDays(todayStr(),INTERVALS[idx]);}
  if(typeof SRS!=='undefined') SRS.review(it, score);
  if(typeof HAB!=='undefined') HAB.log(S, {id:it.id, s:score, c:0, t:ctx||it.tipo});
}
function pickSubject(minItems){
  const c = S.subjects.filter(s=>s.items.length>=minItems);
  if(!c.length) return null;
  const urg = s=>{const d=daysUntil(s.examDate);return d!==null&&d>=0?d:999;};
  c.sort((a,b)=>urg(a)-urg(b) || dueItems(b).length-dueItems(a).length);
  return c[0];
}
const SR_API = window.SpeechRecognition || window.webkitSpeechRecognition;
function speechLang(){const l=(navigator.language||'es-ES'); return l.toLowerCase().startsWith('es')?l:'es-ES';}
function ensureVoiceConsent(){
  if(S.consent.voz) return true;
  const ok = confirm('Para transcribir, tu navegador envía el audio a su servicio de voz (en Chrome, a Google). No guardamos el audio. ¿Continuar?');
  if(ok){S.consent.voz=true; saveState();}
  return ok;
}

// ── Respuesta escrita (en sesion) ──
function submitWrittenResponse(){
  const text = document.getElementById('written-response').value.trim();
  if(!text){showToast('Escribe algo primero');return;}
  const it = sessionQueue[sessionIndex];
  const cov = coverageOf(text, it.respuesta);
  const st = stateOfPct(cov.pct);
  const cls = st==='covered'?'good':st==='partial'?'partial':'weak';
  const msg = st==='covered'?'Cubriste las ideas principales.':st==='partial'?'Respuesta parcial: faltan ideas clave.':'Respuesta incompleta. Compárala con la correcta.';
  const miss = cov.missing.slice(0,4).join(', ');
  document.getElementById('written-feedback').innerHTML = `<div class="written-feedback ${cls}">${msg}<div class="muted" style="font-size:11px;margin-top:4px;">Cobertura estimada ${cov.pct}% · sin IA${miss&&st!=='covered'?' · faltó: '+esc(miss):''}</div></div>`;
  document.getElementById('written-feedback').style.display='block';
  document.getElementById('written-response-block').style.display='none';
  revealAnswer();
  if(typeof aiEvaluate==='function' && aiEnabled()){
    aiEvaluate([{pregunta:it.pregunta, respuesta:it.respuesta}], text).then(r=>{
      if(!r||!r.results||!r.results[0]) return;
      const x=r.results[0]; const c2=x.state==='covered'?'good':x.state==='partial'?'partial':'weak';
      document.getElementById('written-feedback').innerHTML=`<div class="written-feedback ${c2}">${esc(x.note||r.feedback||'')}<div class="muted" style="font-size:11px;margin-top:4px;">Evaluado con IA</div></div>`;
    });
  }
}

// ── Sintesis oral (Feynman) ──
let oral = {subjectId:null, items:[], rec:null, active:false, text:'', interim:'', timer:null, left:90};
function pickOralItems(s){
  const due = dueItems(s);
  const pool = due.length>=3 ? due : s.items.slice().sort((a,b)=>{
    const ra=(a.recallScores||[]).slice(-1)[0], rb=(b.recallScores||[]).slice(-1)[0];
    return (ra==null?50:ra)-(rb==null?50:rb);
  });
  return pool.slice(0,6);
}
function startOralFlow(){
  const s = pickSubject(3);
  if(!s){showToast('Necesitas 3 preguntas en una materia');return;}
  oral = {subjectId:s.id, items:pickOralItems(s), rec:null, active:false, text:'', interim:'', timer:null, left:90};
  document.getElementById('oral-subject-label').textContent = s.nombre;
  document.getElementById('oral-topic-name').textContent = s.nombre;
  document.getElementById('oral-result').style.display='none';
  document.getElementById('oral-live').textContent='';
  document.getElementById('oral-countdown').textContent='1:30';
  document.getElementById('oral-rec-btn').classList.remove('recording');
  document.getElementById('oral-text').value='';
  const hasSR = !!SR_API;
  document.getElementById('oral-rec-btn').style.display = hasSR?'flex':'none';
  document.getElementById('oral-fallback').style.display = hasSR?'none':'block';
  document.getElementById('oral-rec-status').textContent = hasSR?'Toca y explica':'Tu navegador no transcribe voz. Escribe tu explicación.';
  showView('oral');
  document.getElementById('tabbar').style.display='none';
}
function toggleOralRecording(){ if(oral.active) stopOral(); else startOralRec(); }
function showOralFallback(msg){
  document.getElementById('oral-rec-btn').style.display='none';
  document.getElementById('oral-fallback').style.display='block';
  if(msg) document.getElementById('oral-rec-status').textContent=msg;
}
function paintOral(){
  const m=Math.floor(oral.left/60), sec=oral.left%60;
  document.getElementById('oral-countdown').textContent = m+':'+(sec<10?'0':'')+sec;
  document.getElementById('oral-live').textContent = (oral.text+' '+oral.interim).trim();
  const el=document.getElementById('oral-live'); el.scrollTop=el.scrollHeight;
}
function startOralRec(){
  if(!SR_API){showOralFallback('Escribe tu explicación.');return;}
  if(!ensureVoiceConsent()){showOralFallback('Escribe tu explicación.');return;}
  const r = new SR_API();
  r.lang = speechLang(); r.continuous = true; r.interimResults = true;
  oral.rec = r; oral.active = true; oral.text=''; oral.interim=''; oral.left=90;
  r.onresult = e=>{
    let interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      if(e.results[i].isFinal) oral.text += t+' '; else interim += t;
    }
    oral.interim = interim; paintOral();
  };
  r.onerror = e=>{
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){oral.active=false;clearInterval(oral.timer);document.getElementById('oral-rec-btn').classList.remove('recording');showOralFallback('Sin permiso de micrófono. Escribe tu explicación.');}
    else if(e.error==='network'){oral.active=false;clearInterval(oral.timer);document.getElementById('oral-rec-btn').classList.remove('recording');showOralFallback('Sin conexión para transcribir. Escribe tu explicación.');}
  };
  r.onend = ()=>{ if(oral.active && oral.left>0){ try{r.start();}catch(err){} } };
  try{ r.start(); }catch(err){ showOralFallback('No se pudo iniciar el micrófono.'); return; }
  document.getElementById('oral-rec-btn').classList.add('recording');
  document.getElementById('oral-rec-status').textContent='Escuchando… toca para terminar';
  oral.timer = setInterval(()=>{ oral.left--; paintOral(); if(oral.left<=0) stopOral(); },1000);
}
function stopOral(){
  oral.active=false; clearInterval(oral.timer);
  try{oral.rec&&oral.rec.stop();}catch(e){}
  document.getElementById('oral-rec-btn').classList.remove('recording');
  const text=(oral.text+' '+oral.interim).trim();
  document.getElementById('oral-rec-status').textContent='Evaluando…';
  evaluateOralTranscript(text);
}
function evaluateOralText(){ evaluateOralTranscript(document.getElementById('oral-text').value.trim()); }
function evaluateOralTranscript(text){
  const words = norm(text).split(' ').filter(Boolean);
  if(words.length<12){
    document.getElementById('oral-rec-status').textContent='Muy corto. Explica con más detalle e intenta otra vez.';
    return;
  }
  const concepts = oral.items.map(it=>{const c=coverageOf(text,it.respuesta); return {it, pct:c.pct, state:stateOfPct(c.pct), missing:c.missing};});
  renderOralResult(concepts, null);
  if(typeof aiEvaluate==='function' && aiEnabled()){
    aiEvaluate(oral.items.map(i=>({pregunta:i.pregunta,respuesta:i.respuesta})), text).then(r=>{
      if(!r||!r.results||r.results.length!==concepts.length) return;
      r.results.forEach((x,i)=>{ if(['covered','partial','missed'].includes(x.state)) concepts[i].state=x.state; });
      renderOralResult(concepts, r.feedback||'', true);
    });
  }
}
let _oralApplied=false;
function renderOralResult(concepts, aiFeedback, viaAi){
  const credit = concepts.reduce((a,c)=>a+(c.state==='covered'?1:c.state==='partial'?0.5:0),0);
  const pct = Math.round(credit/concepts.length*100);
  document.getElementById('oral-coverage-bar').style.width = pct+'%';
  document.getElementById('oral-coverage-pct').textContent = pct+'%';
  const base = pct>=80?'Explicación sólida: cubriste casi todo.':pct>=50?'Buena base, con huecos. Refuerza lo marcado en rojo.':'Cubriste poco del tema. Repasa y vuelve a intentar.';
  document.getElementById('oral-feedback-text').textContent = (aiFeedback||base) + (viaAi?'':' · estimado sin IA');
  document.getElementById('oral-concept-list').innerHTML = concepts.map(c=>`<li class="${c.state}">${esc(c.it.respuesta.slice(0,70))}${c.it.respuesta.length>70?'…':''}</li>`).join('');
  const missed = concepts.filter(c=>c.state==='missed');
  document.getElementById('oral-errors').innerHTML = missed.length ? `<div class="written-feedback weak" style="margin-top:6px;"><strong>Refuerza:</strong> ${missed.map(c=>esc(c.it.respuesta.slice(0,60))).join(' · ')}</div>` : '';
  document.getElementById('oral-result').style.display='block';
  document.getElementById('oral-rec-status').textContent='Listo';
  document.getElementById('oral-result').dataset.pending='1';
  oral.lastConcepts = concepts; oral.lastPct = pct;
}
function finishOral(){
  const s=S.subjects.find(x=>x.id===oral.subjectId);
  if(s && oral.lastConcepts){
    oral.lastConcepts.forEach(c=>{
      const real=s.items.find(x=>x.id===c.it.id);
      if(real) scheduleItem(real, scoreOfState(c.state));
    });
    s.lastActivity=todayStr();
    if(typeof obsUpdate==='function') obsUpdate('PRO', oral.lastPct, 1.5);
    updateStreak(); saveState();
  }
  oral.lastConcepts=null;
  goTab('home'); showToast('Síntesis oral guardada');
}
function closeOral(){ oral.active=false; clearInterval(oral.timer); try{oral.rec&&oral.rec.stop();}catch(e){} goTab('home'); }

// ── Pretest ──
let pretestQueue=[], pretestIndex=0, pretestSubjectId=null, pretestResults=[];
function startPretest(subjectId){
  const s=S.subjects.find(x=>x.id===subjectId); if(!s||s.items.length<3) return;
  pretestSubjectId=subjectId; pretestIndex=0; pretestResults=[];
  pretestQueue=[...s.items].sort(()=>Math.random()-0.5).slice(0,3);
  showView('pretest'); document.getElementById('tabbar').style.display='none';
  document.getElementById('pretest-result').style.display='none';
  document.getElementById('pretest-qcard').style.display='block';
  loadPretestItem();
}
function generateMCOptions(item, pool){
  const correct = {text:item.respuesta.slice(0,90), correct:true};
  const used = new Set([norm(correct.text)]);
  const others = (pool||[]).filter(x=>x.id!==item.id).sort(()=>Math.random()-0.5);
  const d = [];
  for(const o of others){ const t=o.respuesta.slice(0,90); if(!used.has(norm(t))){used.add(norm(t)); d.push({text:t, correct:false});} if(d.length===3) break; }
  const words = item.respuesta.split(' ');
  if(d.length<3 && words.length>6){ d.push({text:('No es cierto que '+item.respuesta.charAt(0).toLowerCase()+item.respuesta.slice(1)).slice(0,90), correct:false}); }
  if(d.length<3 && words.length>6){ d.push({text:words.slice(0,Math.ceil(words.length/2)).join(' ')+'…', correct:false}); }
  return [correct,...d].sort(()=>Math.random()-0.5);
}
function loadPretestItem(){
  const it=pretestQueue[pretestIndex];
  const s=S.subjects.find(x=>x.id===pretestSubjectId);
  document.getElementById('pretest-count').textContent=(pretestIndex+1)+' de '+pretestQueue.length;
  document.getElementById('pretest-bar').style.width=Math.round(((pretestIndex+1)/pretestQueue.length)*100)+'%';
  document.getElementById('pretest-q').textContent=it.pregunta;
  const opts=generateMCOptions(it, s?s.items:[]);
  const host=document.getElementById('pretest-options');
  host.innerHTML=opts.map((o,i)=>`<button class="mc-option" data-c="${o.correct?1:0}">${esc(o.text)}</button>`).join('');
  host.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>answerPretest(b)));
}
function answerPretest(btn){
  const ok = btn.dataset.c==='1';
  document.querySelectorAll('#pretest-options .mc-option').forEach(b=>{b.disabled=true; if(b.dataset.c==='1') b.classList.add('was-correct');});
  btn.classList.add(ok?'selected-correct':'selected-wrong');
  pretestResults.push({correct:ok});
  setTimeout(()=>{ pretestIndex++; if(pretestIndex>=pretestQueue.length) finishPretest(); else loadPretestItem(); }, 900);
}
function finishPretest(){
  const s=S.subjects.find(x=>x.id===pretestSubjectId); if(s){s.pretestDone=true; saveState();}
  const pct=Math.round(pretestResults.filter(r=>r.correct).length/pretestResults.length*100);
  const msg = pct>=70?'Ya tienes buena base.':pct>=40?'Conoces algo, con huecos.':'Tema nuevo: empezamos por lo básico.';
  document.getElementById('pretest-result').innerHTML=`<div class="glass fade-in" style="text-align:center;padding:16px;">
    <div style="font-family:'Fraunces',serif;font-size:28px;color:var(--brass);">${pct}%</div>
    <div class="muted" style="font-size:13px;margin-top:6px;">${msg}</div>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="startSession('${pretestSubjectId}')">Empezar sesión</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick="goTab('home')">Volver</button></div>`;
  document.getElementById('pretest-result').style.display='block';
  document.getElementById('pretest-qcard').style.display='none';
}
function skipPretest(){
  const s=S.subjects.find(x=>x.id===pretestSubjectId); if(s){s.pretestDone=true; saveState();}
  goTab('home');
}

// ── Simulacro con cuenta regresiva ──
let simQueue=[], simIndex=0, simSubjectId=null, simAnswers=[], simStart=null, simTimerInterval=null, simLeft=0;
function startExamSimFlow(){
  const s=pickSubject(5);
  if(!s){showToast('Necesitas 5 preguntas en una materia');return;}
  simSubjectId=s.id; simIndex=0; simAnswers=[]; simStart=Date.now();
  simQueue=[...s.items].sort(()=>Math.random()-0.5).slice(0,Math.min(10,s.items.length));
  simLeft=simQueue.length*150;
  document.getElementById('sim-subject-label').textContent=s.nombre;
  showView('exam-sim'); document.getElementById('tabbar').style.display='none';
  clearInterval(simTimerInterval);
  paintSimTimer();
  simTimerInterval=setInterval(()=>{
    simLeft--; paintSimTimer();
    if(simLeft<=0){ clearInterval(simTimerInterval); while(simIndex<simQueue.length){ recordSimAnswer(); simIndex++; } finishExamSim(); }
  },1000);
  loadSimQuestion();
}
function paintSimTimer(){
  const m=Math.floor(simLeft/60), sec=simLeft%60, el=document.getElementById('sim-timer');
  el.textContent=m+':'+(sec<10?'0':'')+sec;
  el.style.color = simLeft<=simQueue.length*30 ? 'var(--oxblood)' : '';
}
function loadSimQuestion(){
  const it=simQueue[simIndex];
  document.getElementById('sim-count').textContent=(simIndex+1)+' de '+simQueue.length;
  document.getElementById('sim-bar').style.width=Math.round(((simIndex+1)/simQueue.length)*100)+'%';
  document.getElementById('sim-q').textContent=it.pregunta;
  document.getElementById('sim-answer').value='';
  document.getElementById('sim-next-btn').textContent = simIndex===simQueue.length-1?'Terminar':'Siguiente';
}
function recordSimAnswer(){
  const it=simQueue[simIndex]; if(!it) return;
  const answer = simIndex===simAnswers.length && document.getElementById('sim-answer') ? document.getElementById('sim-answer').value.trim() : '';
  const cov = coverageOf(answer, it.respuesta);
  simAnswers.push({id:it.id, question:it.pregunta, answer, correctAnswer:it.respuesta, score:answer?cov.pct:0, tipo:it.tipo});
}
function nextSimQuestion(){
  recordSimAnswer(); simIndex++;
  if(simIndex>=simQueue.length) finishExamSim(); else loadSimQuestion();
}
function finishExamSim(){
  clearInterval(simTimerInterval);
  const mins=Math.max(1,Math.round((Date.now()-simStart)/60000));
  const avg=Math.round(simAnswers.reduce((a,r)=>a+r.score,0)/Math.max(1,simAnswers.length));
  const good=simAnswers.filter(r=>r.score>=70).length, part=simAnswers.filter(r=>r.score>=40&&r.score<70).length, weak=simAnswers.filter(r=>r.score<40).length;
  document.getElementById('sim-result-title').textContent=avg+'% en '+mins+' min';
  document.getElementById('sim-result-stats').innerHTML=`<div style="display:flex;gap:10px;">
    <div style="flex:1;text-align:center;"><div style="font-size:20px;font-family:'Fraunces',serif;color:var(--sage);">${good}</div><div class="muted" style="font-size:10px;">Bien</div></div>
    <div style="flex:1;text-align:center;"><div style="font-size:20px;font-family:'Fraunces',serif;color:var(--brass);">${part}</div><div class="muted" style="font-size:10px;">Parcial</div></div>
    <div style="flex:1;text-align:center;"><div style="font-size:20px;font-family:'Fraunces',serif;color:var(--oxblood);">${weak}</div><div class="muted" style="font-size:10px;">Débil</div></div></div>`;
  document.getElementById('sim-result-detail').innerHTML='<div class="eyebrow" style="margin-bottom:6px;">Revisión</div>'+simAnswers.map((r,i)=>{
    const col=r.score>=70?'sage':r.score>=40?'brass':'oxblood';
    return `<details style="border-bottom:1px solid var(--line);padding:8px 0;"><summary style="display:flex;justify-content:space-between;gap:8px;cursor:pointer;font-size:12.5px;list-style:none;"><span style="flex:1;color:var(--parchment-dim);">${i+1}. ${esc(r.question.slice(0,48))}${r.question.length>48?'…':''}</span><span style="color:var(--${col});font-weight:600;">${r.score}%</span></summary>
      <div class="muted" style="font-size:12px;margin-top:6px;"><strong>Tu respuesta:</strong> ${esc(r.answer||'(en blanco)')}</div>
      <div style="font-size:12px;margin-top:6px;color:var(--brass);"><strong>Esperada:</strong> ${esc(r.correctAnswer)}</div></details>`;
  }).join('');
  const s=S.subjects.find(x=>x.id===simSubjectId);
  const normalAvg=s?Math.round(s.items.reduce((a,it)=>{const sc=it.recallScores||[];return a+(sc.length?sc[sc.length-1]:50);},0)/(s.items.length||1)):50;
  document.getElementById('sim-vs-normal').textContent=`Práctica normal ~${normalAvg}% · simulacro ${avg}%.${avg<normalAvg-15?' Reconoces más de lo que recuerdas bajo presión.':''}`;
  if(s){ simAnswers.forEach(r=>{const real=s.items.find(x=>x.id===r.id); if(real) scheduleItem(real, r.score>=70?100:r.score>=40?50:0);}); s.lastActivity=todayStr(); }
  S.simLog=S.simLog||[]; S.simLog.push({date:todayStr(),subjectId:simSubjectId,avg});
  if(typeof learnFromSim==='function') learnFromSim(avg, normalAvg);
  updateStreak(); saveState();
  showView('exam-result');
}
function closeExamSim(){ clearInterval(simTimerInterval); goTab('home'); }

// ── Notas de voz (audio guardado como Blob en IndexedDB) ──
let mediaRecorder=null, audioChunks=[], recordingSubjectId=null, _audioUrls=[];
function pickAudioMime(){
  const c=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
  if(!window.MediaRecorder) return null;
  return c.find(t=>MediaRecorder.isTypeSupported(t)) || '';
}
function toggleRecording(sid){
  if(mediaRecorder && mediaRecorder.state==='recording'){ mediaRecorder.stop(); return; }
  if(!navigator.mediaDevices || !window.MediaRecorder){showToast('Tu navegador no graba audio');return;}
  recordingSubjectId=sid; audioChunks=[];
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    const mime=pickAudioMime();
    mediaRecorder = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream);
    mediaRecorder.ondataavailable=e=>{if(e.data.size>0)audioChunks.push(e.data);};
    mediaRecorder.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      const type=mediaRecorder.mimeType||mime||'audio/webm';
      const blob=new Blob(audioChunks,{type});
      const id='aud'+Date.now();
      try{
        await audioPut(id, blob);
        if(!S.audioNotes[sid]) S.audioNotes[sid]=[];
        S.audioNotes[sid].push({id, date:todayStr(), mime:type, size:blob.size});
        saveState(); showToast('Audio guardado');
      }catch(e){ showToast('No se pudo guardar el audio'); }
      mediaRecorder=null; renderMaterials();
    };
    mediaRecorder.start(); renderMaterials(); showToast('Grabando…');
  }).catch(()=>showToast('No se pudo acceder al micrófono'));
}
async function deleteAudio(sid, audId){
  if(!S.audioNotes[sid]) return;
  S.audioNotes[sid]=S.audioNotes[sid].filter(a=>a.id!==audId);
  try{await audioDel(audId);}catch(e){}
  saveState(); renderMaterials(); showToast('Audio eliminado');
}
async function hydrateAudio(){
  _audioUrls.forEach(u=>URL.revokeObjectURL(u)); _audioUrls=[];
  const els=document.querySelectorAll('audio[data-aud]');
  for(const el of els){
    try{ const b=await audioGet(el.dataset.aud); if(b){ const u=URL.createObjectURL(b); _audioUrls.push(u); el.src=u; } }catch(e){}
  }
}
