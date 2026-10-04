/* Catedra · IA opcional vía proxy propio (js/ai.js)
   Sin URL configurada todo funciona con heurísticas locales. Nunca hay claves en el cliente. */

function aiEndpoint(){ return (S.settings && S.settings.aiUrl) || '/api/ai'; }
function aiEnabled(){ return !!(S.settings && S.settings.aiUrl) || window.__aiOn === true; }
function aiTaskOn(t){ return !!(S.settings && S.settings.aiUrl) || (window.__aiTasks||[]).includes(t); }
function deviceId(){
  if(!S.settings.deviceId){ S.settings.deviceId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())+Math.random().toString(36).slice(2); saveState(); }
  return S.settings.deviceId;
}
function aiHeaders(){
  const h = {'Content-Type':'application/json','x-device':deviceId()};
  if(S.settings.pilotCode) h['x-pilot-code'] = S.settings.pilotCode;
  return h;
}
// Detecta si la pasarela de IA del propio sitio esta lista (y captura el codigo de piloto ?c=CODIGO)
async function aiProbe(){
  try{
    const q = new URLSearchParams(location.search), c = q.get('c');
    if(c){ S.settings.pilotCode = c.trim().slice(0,40); saveState(); q.delete('c'); history.replaceState(null,'',location.pathname+(q.toString()?'?'+q.toString():'')); }
  }catch(e){}
  if(S.settings.aiUrl){ window.__aiOn = true; }
  else{
    try{
      const r = await fetch('/api/ai', {headers:aiHeaders(), cache:'no-store'});
      if(r.ok){ const j = await r.json(); window.__aiOn = !!j.enabled; window.__aiTasks = j.tasks||[]; }
    }catch(e){}
  }
  const pb = document.getElementById('cap-photo');
  if(pb) pb.style.display = aiTaskOn('transcribe') && aiEnabled() ? 'flex' : 'none';
}

async function aiCall(task, payload){
  if(!aiEnabled()) return null;
  if(!S.consent.ia){
    if(!confirm('Para usar IA, tu texto o imagen se envía a proveedores de IA (Groq, Google). En sus planes gratuitos pueden usarlo para mejorar sus productos y personas podrían revisarlo. No subas datos personales de otras personas. ¿Continuar?')) return null;
    S.consent.ia = true; saveState();
  }
  const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 28000);
  try{
    const r = await fetch(aiEndpoint(), {method:'POST', headers:aiHeaders(), body:JSON.stringify({task, payload}), signal:ctl.signal});
    if(r.status===429){ showToast('Llegaste al límite diario de IA'); return null; }
    if(r.status===401||r.status===503){ window.__aiOn=false; return null; }
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
  finally{ clearTimeout(to); }
}

const AI_TIPOS = ['recuperacion','explicacion','aplicacion','comparacion','error'];
const AI_DIFS = ['baja','media','alta'];
function validateAiItems(raw, source){
  const src = norm(source), out = [];
  for(const x of raw||[]){
    if(!x || typeof x.pregunta!=='string' || typeof x.respuesta!=='string' || typeof x.cita!=='string') continue;
    const cita = x.cita.trim();
    if(cita.length<12 || !src.includes(norm(cita))) continue;           // anclaje obligatorio a la fuente
    out.push({
      pregunta:x.pregunta.trim().slice(0,400), respuesta:x.respuesta.trim().slice(0,600),
      explicacion:(typeof x.explicacion==='string'?x.explicacion:'').trim().slice(0,400),
      cita:cita.slice(0,400),
      tipo:AI_TIPOS.includes(x.tipo)?x.tipo:'recuperacion', dificultad:AI_DIFS.includes(x.dificultad)?x.dificultad:'media'
    });
    if(out.length>=8) break;
  }
  return out.filter(i=>i.pregunta.length>8 && i.respuesta.length>2);
}

async function generateFromText(text, sid, extra){
  extra = extra||{};
  let items = null, viaAi = false;
  if(aiEnabled()){
    const r = await aiCall('generate', {text:text.slice(0,12000), count:6});
    if(r && Array.isArray(r.items)){ items = validateAiItems(r.items, text); viaAi = items.length>0; }
  }
  if(!items || !items.length) items = generateMockItems(text);
  items.forEach(it=>S.pendingItems.push(Object.assign({
    id:'item'+(S.itemIdCounter++), subjectId:sid, pregunta:it.pregunta, respuesta:it.respuesta,
    explicacion:it.explicacion||'', cita:it.cita||'', dificultad:it.dificultad||'media', tipo:it.tipo||'recuperacion', mock:!viaAi
  }, extra)));
  saveState();
  return items.length;
}

// Evalua una respuesta libre contra uno o varios conceptos. Devuelve {results:[{state,note}], feedback} o null.
async function aiEvaluate(items, answer){
  const r = await aiCall('evaluate', {items:items.slice(0,8), answer:String(answer||'').slice(0,6000)});
  if(!r || !Array.isArray(r.results) || r.results.length!==items.length) return null;
  r.results = r.results.map(x=>({state:['covered','partial','missed'].includes(x&&x.state)?x.state:'partial', note:typeof (x&&x.note)==='string'?x.note.slice(0,300):''}));
  r.feedback = typeof r.feedback==='string' ? r.feedback.slice(0,400) : '';
  return r;
}

// Onboarding (paso material) y Materiales: genera preguntas del texto pegado
async function generateItems(){
  const text = document.getElementById('inp-material-text').value.trim();
  if(!text || !currentSubjectForGen) return;
  const btn = document.getElementById('btn-generate');
  btn.disabled = true; btn.textContent = 'Generando...';
  const n = await generateFromText(text, currentSubjectForGen);
  renderPendingList(); renderMaterialsSubjectGen(currentSubjectForGen);
  btn.disabled = false; btn.textContent = 'Generar preguntas';
  showToast(n+' preguntas generadas');
}

function syncAiField(){
  const el = document.getElementById('ai-url'); if(!el || el.dataset.bound) return;
  el.dataset.bound = '1'; el.value = S.settings.aiUrl || '';
  el.addEventListener('change', ()=>{
    const v = el.value.trim();
    if(v && !/^https:\/\/[^\s]+$/i.test(v)){ showToast('La URL debe empezar con https://'); el.value = S.settings.aiUrl||''; return; }
    S.settings.aiUrl = v; S.consent.ia = false; saveState(); showToast(v?'IA configurada':'IA desactivada');
  });
}
