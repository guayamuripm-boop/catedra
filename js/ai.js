/* Catedra · IA opcional vía proxy propio (js/ai.js)
   Sin URL configurada todo funciona con heurísticas locales. Nunca hay claves en el cliente. */

function aiEnabled(){ return !!(S.settings && S.settings.aiUrl); }

async function aiCall(task, payload){
  if(!aiEnabled()) return null;
  if(!S.consent.ia){
    if(!confirm('Para usar IA, el texto que analices se envía al servicio que configuraste. ¿Continuar?')) return null;
    S.consent.ia = true; saveState();
  }
  const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 25000);
  try{
    const r = await fetch(S.settings.aiUrl, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task, payload}), signal:ctl.signal});
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
