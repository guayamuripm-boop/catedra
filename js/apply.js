/* Catedra · Aplica: usar lo visto en clase en una situación de la vida diaria.
   Con IA genera la situación y evalúa la respuesta; sin IA propone pensar una propia y autoevaluarse (rotulado). */

let AP = null;
const AP_CTX_FALLBACK = ['la bodega', 'el transporte', 'tu celular', 'una charla con amigos', 'la cocina', 'tu dinero', 'tu casa', 'el deporte'];

function apPickItem(s, used){
  const last = it=>{const r=(it.recallScores||[]).slice(-1)[0]; return r==null?50:r;};
  const pool = s.items.filter(it=>!used.includes(it.id) && it.respuesta && it.respuesta.length>=15);
  pool.sort((a,b)=>String(a.nextReviewDate).localeCompare(String(b.nextReviewDate)) || last(a)-last(b));
  return pool[0] || null;
}

function startApplyFlow(){
  const s = pickSubject(1);
  if(!s){ showToast('Necesitas al menos una pregunta aprobada'); return; }
  AP = {subjectId:s.id, used:[], contexts:[], done:0, sum:0, sc:null, item:null, ai:aiEnabled() && aiTaskOn('scenario')};
  document.getElementById('apply-subject-label').textContent = s.nombre;
  showView('apply'); document.getElementById('tabbar').style.display='none';
  apNext();
}

async function apNext(){
  const s = S.subjects.find(x=>x.id===AP.subjectId);
  const it = s && apPickItem(s, AP.used);
  if(!it){ apFinish(); return; }
  AP.item = it; AP.sc = null; AP.used.push(it.id);
  const body = document.getElementById('apply-body');
  if(AP.ai){
    body.innerHTML = `<div class="glass" style="margin-top:12px;text-align:center;padding:26px;"><div class="muted" style="font-size:13px;">Preparando tu situación…</div></div>`;
    const r = await aiCall('scenario', {items:[{pregunta:it.pregunta, respuesta:it.respuesta}], avoid:AP.contexts.slice(-4)});
    if(!AP || AP.item!==it) return;
    if(r && r.escenario && r.tarea){ AP.sc = r; if(r.contexto) AP.contexts.push(r.contexto); }
    else AP.ai = false; // sin respuesta fiable de la IA: modo manual, sin inventar nada
  }
  apRenderQuestion();
}

function apRenderQuestion(){
  const it = AP.item, sc = AP.sc, body = document.getElementById('apply-body');
  const ctx = AP_CTX_FALLBACK[(AP.done + AP.used.length) % AP_CTX_FALLBACK.length];
  const head = sc
    ? `<div class="eyebrow" style="margin-bottom:8px;">${esc(sc.contexto||'Tu día')}</div>
       <div style="font-size:15px;line-height:1.55;">${esc(sc.escenario)}</div>
       <div style="font-size:15px;line-height:1.5;margin-top:12px;font-weight:600;color:var(--brass);">${esc(sc.tarea)}</div>`
    : `<div class="eyebrow" style="margin-bottom:8px;">Piénsalo en tu día</div>
       <div style="font-size:15px;line-height:1.55;">Piensa en un momento de hoy o de esta semana, en ${esc(ctx)} u otro lugar, donde te serviría esto:</div>
       <div style="font-size:15px;line-height:1.5;margin-top:10px;font-weight:600;color:var(--brass);">${esc(it.pregunta)}</div>`;
  body.innerHTML = `<div class="glass fade-in" style="margin-top:12px;padding:16px;">${head}
    <textarea id="apply-answer" rows="5" style="margin-top:14px;" placeholder="${sc?'Tu respuesta…':'Cuenta la situación y cómo lo usarías…'}"></textarea>
    <button class="btn btn-primary btn-block" style="margin-top:10px;" onclick="apSubmit()">Responder</button>
    ${sc?'':'<div class="muted" style="font-size:11px;margin-top:8px;">Sin IA: tú evalúas tu respuesta.</div>'}</div>`;
}

async function apSubmit(){
  const ans = document.getElementById('apply-answer').value.trim();
  if(ans.length<8){ showToast('Escribe un poco más'); return; }
  const it = AP.item, sc = AP.sc, body = document.getElementById('apply-body');
  const model = sc ? sc.respuesta_modelo : it.respuesta;
  const reveal = (extra, buttons)=>{
    body.innerHTML = `<div class="glass fade-in" style="margin-top:12px;padding:16px;">
      <div class="eyebrow" style="margin-bottom:6px;">Tu respuesta</div><div class="muted" style="font-size:13px;line-height:1.5;">${esc(ans)}</div>
      <div class="eyebrow" style="margin:14px 0 6px;">${sc?'Una buena respuesta':'Lo que viste en clase'}</div><div style="font-size:13.5px;line-height:1.55;color:var(--brass);">${esc(model)}</div>
      ${sc&&sc.para_que?`<div class="muted" style="font-size:12px;margin-top:12px;line-height:1.5;">Para qué te sirve: ${esc(sc.para_que)}</div>`:''}
      ${extra}${buttons}</div>`;
  };
  if(sc){
    body.innerHTML = `<div class="glass" style="margin-top:12px;text-align:center;padding:26px;"><div class="muted" style="font-size:13px;">Revisando…</div></div>`;
    const r = await aiEvaluate([{pregunta:sc.escenario+' '+sc.tarea, respuesta:sc.respuesta_modelo}], ans);
    if(r){
      const st = r.results[0].state, cls = st==='covered'?'good':st==='partial'?'partial':'weak';
      const msg = st==='covered'?'Lo aplicaste bien.':st==='partial'?'Vas bien, pero falta algo.':'Aún no. Mira cómo se resuelve.';
      apRecord(st==='covered'?100:st==='partial'?50:0);
      reveal(`<div class="written-feedback ${cls}">${msg}${r.results[0].note?' '+esc(r.results[0].note):''}<div class="muted" style="font-size:11px;margin-top:4px;">Evaluado con IA</div></div>`, apNavButtons());
      return;
    }
    // la evaluación falló: pasamos a autoevaluación
  }
  reveal(`<div class="eyebrow" style="margin:14px 0 6px;">¿Cómo te fue?</div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="apSelf(100)">Bien</button>
      <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="apSelf(50)">A medias</button>
      <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="apSelf(0)">No supe</button></div>`, '');
}

function apNavButtons(){
  return `<div style="display:flex;gap:8px;margin-top:14px;">
    <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="apFinish()">Terminar</button>
    <button class="btn btn-primary btn-sm" style="flex:1;" onclick="apNext()">Otra situación</button></div>`;
}
function apSelf(score){
  apRecord(score);
  const host = document.getElementById('apply-body').querySelector('.glass');
  host.insertAdjacentHTML('beforeend', apNavButtons());
  host.querySelectorAll('button[onclick^="apSelf"]').forEach(b=>b.disabled=true);
}
function apRecord(score){
  const s = S.subjects.find(x=>x.id===AP.subjectId), real = s && s.items.find(x=>x.id===AP.item.id);
  if(real) scheduleItem(real, score);
  AP.done++; AP.sum += score;
  if(s) s.lastActivity = todayStr();
  saveState();
}

function apFinish(){
  const done = AP && AP.done;
  if(done){ updateStreak(); saveState(); if(typeof track==='function') track('apply_done', {n:AP.done, ai:!!AP.ai, avg:Math.round(AP.sum/AP.done)}); }
  AP = null;
  goTab('home');
  if(done) showToast(done===1?'Situación guardada':done+' situaciones guardadas');
}
function closeApply(){ AP = null; goTab('home'); }
