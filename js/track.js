/* Catedra · Medición de uso anónima y configuración pública.
   Cola local (sobrevive sin conexión), envío en lotes por /api/e, nunca texto del estudiante. */

const TRACK_VER = 'mvp-1';
const EVQ_KEY = 'catedra_evq';
let _evq = [], _evTimer = null, _flushing = false;
window.__cfg = null;

function trackAllowed(){ return !!(S && S.consent && S.consent.terms) && !(S.settings && S.settings.noAnalytics); }
function loadQueue(){ try{ _evq = JSON.parse(localStorage.getItem(EVQ_KEY)||'[]'); }catch(e){ _evq = []; } }
function saveQueue(){ try{ localStorage.setItem(EVQ_KEY, JSON.stringify(_evq.slice(-200))); }catch(e){} }

function track(name, props){
  if(!trackAllowed()) return;
  const p = Object.assign({ v: TRACK_VER, standalone: !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) }, props||{});
  _evq.push({ name, props: p, ts: new Date().toISOString() });
  saveQueue();
  clearTimeout(_evTimer); _evTimer = setTimeout(flushEvents, 4000);
}

async function flushEvents(useBeacon){
  if(_flushing || !_evq.length || !navigator.onLine) return;
  if(!window.__cfg || !window.__cfg.analytics || !trackAllowed()){ return; }
  _flushing = true;
  const batch = _evq.splice(0, 50);
  const body = JSON.stringify({ did: deviceId(), events: batch });
  try{
    if(useBeacon && navigator.sendBeacon){
      if(!navigator.sendBeacon('/api/e', new Blob([body], {type:'application/json'}))) _evq.unshift(...batch);
    } else {
      const r = await fetch('/api/e', { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true });
      if(!r.ok && r.status >= 500) _evq.unshift(...batch);
    }
  }catch(e){ _evq.unshift(...batch); }
  saveQueue(); _flushing = false;
  if(_evq.length) { clearTimeout(_evTimer); _evTimer = setTimeout(flushEvents, 4000); }
}

async function loadConfig(){
  try{
    const r = await fetch('/api/config', { cache:'no-store' });
    if(r.ok) window.__cfg = await r.json();
  }catch(e){}
  applyConfigUI();
  flushEvents();
}
function applyConfigUI(){
  const url = window.__cfg && window.__cfg.feedbackUrl;
  document.querySelectorAll('[data-fb]').forEach(el=>{ el.style.display = url ? '' : 'none'; });
}
function openFeedback(){
  const url = window.__cfg && window.__cfg.feedbackUrl;
  if(!url){ showToast('Opinar no está disponible aún'); return; }
  track('feedback_open');
  window.open(url, '_blank', 'noopener');
}

// ── Consentimiento y privacidad ──
const TERMS_VERSION = '2026-10';
function acceptTerms(){
  S.consent.terms = { v: TERMS_VERSION, ts: Date.now() };
  saveState(); track('terms_accepted');
}
function ensureTerms(){
  if(!S.onboarded || S.consent.terms) return;
  openSheet(`<div class="h1" style="font-size:20px;">Antes de seguir</div>
    <div class="muted" style="font-size:13.5px;line-height:1.55;">Medimos el uso de forma anónima para mejorar Catedra. Tu material se queda en tu teléfono; solo viaja a la IA cuando tú lo pides.</div>
    <button class="btn btn-primary btn-block" id="tm-ok">Acepto · tengo 18 años o más</button>
    <a class="btn btn-ghost btn-block" href="privacidad.html" target="_blank" rel="noopener" style="text-decoration:none;">Leer la política</a>
    <button class="ob-back" id="tm-no">Ahora no</button>`);
  document.getElementById('tm-ok').onclick = ()=>{ acceptTerms(); closeSheet(); };
  document.getElementById('tm-no').onclick = closeSheet;
}
function syncPrivacyUI(){
  const c = document.getElementById('chk-analytics');
  if(!c || c.dataset.bound) { if(c) c.checked = !S.settings.noAnalytics; return; }
  c.dataset.bound = '1'; c.checked = !S.settings.noAnalytics;
  c.addEventListener('change', ()=>{
    S.settings.noAnalytics = !c.checked;
    if(S.settings.noAnalytics){ _evq = []; saveQueue(); }
    saveState(); showToast(c.checked ? 'Medición anónima activada' : 'Medición desactivada');
  });
}

// ── Instrumentación: se engancha a las funciones existentes sin tocarlas ──
function wrapFn(name, after){
  const orig = window[name];
  if(typeof orig !== 'function') return;
  window[name] = function(){
    const r = orig.apply(this, arguments);
    try{ after(r, arguments); }catch(e){}
    return r;
  };
}
function whenDone(r, fn){ if(r && typeof r.then === 'function') r.then(fn).catch(()=>{}); else fn(r); }

function instrument(){
  wrapFn('startDiagnostic', (r,a)=>track('diag_start', { mode:(a[0]&&a[0].mode)||'full' }));
  wrapFn('diagFinish', ()=>track('diag_done', { mode:D&&D.mode, n:D?Object.keys(D.answers).length:0, domains:Object.keys(S.diag.dom).length }));
  wrapFn('addSubject', ()=>track('subject_added', { total:S.subjects.length }));
  wrapFn('generateFromText', (r)=>whenDone(r, n=>track('questions_generated', { n:n||0, ai:aiEnabled() })));
  wrapFn('approveItem', (r,a)=>track('question_approved', { bulk:!!a[1] }));
  wrapFn('startSession', ()=>track('session_start', { n:sessionQueue.length, energy:sessionEnergy||0 }));
  wrapFn('finishSession', ()=>{ const l=S.sessionLog[S.sessionLog.length-1]||{}; track('session_done', { n:l.items||0, minutes:l.minutes||0, correct:l.correct||0, total_sessions:S.sessionLog.length }); });
  wrapFn('addNote', (r)=>track('note_created', { source:(r&&r.source)||'texto' }));
  wrapFn('startOralFlow', ()=>track('oral_start'));
  wrapFn('startApplyFlow', ()=>track('apply_start'));
  wrapFn('finishOral', ()=>track('oral_done'));
  wrapFn('startExamSimFlow', ()=>track('sim_start'));
  wrapFn('finishExamSim', ()=>{ const l=(S.simLog||[]).slice(-1)[0]||{}; track('sim_done', { avg:l.avg||0 }); });
  wrapFn('exportIcs', ()=>track('ics_export'));
  wrapFn('exportData', ()=>track('backup_export'));
  wrapFn('exportNotebookPack', ()=>track('notebooklm_pack'));
  wrapFn('runImport', ()=>track('import_run'));
  wrapFn('photoNote', (r)=>whenDone(r, ()=>track('photo_note')));
  wrapFn('startPretest', ()=>track('pretest_start'));
  wrapFn('installApp', ()=>track('install_click'));
  window.addEventListener('appinstalled', ()=>track('app_installed'));
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flushEvents(true); });
  window.addEventListener('online', ()=>flushEvents());
}

function startTracking(){
  loadQueue(); instrument();
  if(!S.settings.firstSeen){ S.settings.firstSeen = todayStr(); saveState(); }
  track('app_open', { onboarded:!!S.onboarded, day:Math.round((parseDay(todayStr())-parseDay(S.settings.firstSeen))/864e5) });
  loadConfig();
}
