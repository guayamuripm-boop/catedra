/* Catedra · Cuenta y sincronización entre dispositivos (Supabase, vía REST; sin librerías).
   La app sigue siendo local primero: sin sesión o sin red todo funciona igual. La lógica de decisión vive en js/sync.js.
   La URL y la clave publishable son públicas por diseño: la seguridad la da la política de filas (cada estudiante solo ve la suya).
   Las claves de sesión NO van dentro del estado S (no se suben ni se respaldan): viven en localStorage. */

const CLOUD = { url:'https://qtcrbzwksivlsasotdlq.supabase.co', key:'sb_publishable_-SxqlGJeiFf2qtLzr2AHmQ_wqzacyBD' };
let _cloudErr = '', _cloudBusy = false, _cloudQuiet = false, _cloudSeq = 0, _cloudTimer = null, _cloudLast = 0, _cloudMsg = '';

const lsGet = k => { try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ v==null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const cloudSession = () => lsGet('catedra_cloud');
const cloudMeta = () => lsGet('catedra_sync') || {};

async function cloudFetch(path, opt, token){
  opt = opt || {};
  const ctl = new AbortController(), to = setTimeout(()=>ctl.abort(), 20000);
  try{
    const r = await fetch(CLOUD.url + path, Object.assign({}, opt, {
      signal: ctl.signal,
      headers: Object.assign({ apikey:CLOUD.key, Authorization:'Bearer '+(token||CLOUD.key), 'Content-Type':'application/json' }, opt.headers||{})
    }));
    let j = null; try{ j = await r.json(); }catch(e){}
    return { ok:r.ok, status:r.status, json:j };
  }catch(e){ return { ok:false, status:0, json:null }; }
  finally{ clearTimeout(to); }
}

function cloudSaveSession(j){
  const ses = { access:j.access_token, refresh:j.refresh_token, exp:Math.floor(Date.now()/1000)+(j.expires_in||3600), uid:j.user.id, email:j.user.email };
  lsSet('catedra_cloud', ses); return ses;
}
// Devuelve un token vigente, renovándolo si hace falta. Si la renovación falla de verdad, cierra la sesión (los datos locales no se tocan).
async function cloudToken(){
  const s = cloudSession(); if(!s) return null;
  if(s.exp - 60 > Date.now()/1000) return s;
  const r = await cloudFetch('/auth/v1/token?grant_type=refresh_token', { method:'POST', body:JSON.stringify({ refresh_token:s.refresh }) });
  if(r.ok && r.json && r.json.access_token) return cloudSaveSession(r.json);
  if(r.status===400 || r.status===401){ lsSet('catedra_cloud', null); cloudRender(); }
  return null;
}

const AUTH_ERR = {
  invalid_credentials:'Correo o contraseña incorrectos',
  user_already_exists:'Ese correo ya tiene cuenta: toca Entrar',
  email_not_confirmed:'Falta confirmar el correo (revisa tu bandeja)',
  weak_password:'La contraseña es muy débil: usa 8 caracteres o más',
  over_email_send_rate_limit:'Demasiados intentos; espera unos minutos',
  validation_failed:'Revisa el correo y la contraseña'
};
async function cloudAuth(mode, email, pass){
  email = String(email||'').trim().toLowerCase();
  _cloudErr = '';
  if(!/^\S+@\S+\.\S+$/.test(email)){ _cloudErr = 'Escribe un correo válido'; return false; }
  if(String(pass||'').length < 8){ _cloudErr = 'La contraseña debe tener 8 caracteres o más'; return false; }
  const r = mode==='up'
    ? await cloudFetch('/auth/v1/signup', { method:'POST', body:JSON.stringify({ email, password:pass }) })
    : await cloudFetch('/auth/v1/token?grant_type=password', { method:'POST', body:JSON.stringify({ email, password:pass }) });
  if(!r.ok){
    const code = r.json && (r.json.error_code || r.json.code);
    _cloudErr = r.status===0 ? 'Sin conexión: la cuenta necesita internet' : (AUTH_ERR[code] || 'No se pudo entrar ('+(code||r.status)+')');
    return false;
  }
  if(!r.json.access_token){ _cloudErr = 'Te enviamos un correo para confirmar la cuenta'; return false; }
  cloudSaveSession(r.json);
  showToast(mode==='up' ? 'Cuenta creada' : 'Sesión iniciada');
  cloudRender(); cloudSync({ force:true });
  return true;
}
function cloudSignOut(){
  lsSet('catedra_cloud', null); _cloudMsg = '';
  showToast('Sesión cerrada'); cloudRender();
}

// Se llama desde flushState: cada guardado local marca "pendiente de subir" y programa una subida
function cloudDirty(){
  if(_cloudQuiet) return;
  _cloudSeq++;
  const m = cloudMeta(); m.dirty = true; lsSet('catedra_sync', m);
  if(!cloudSession()) return;
  clearTimeout(_cloudTimer); _cloudTimer = setTimeout(()=>cloudSync(), 4000);
}

async function cloudRow(ses){
  const r = await cloudFetch('/rest/v1/user_state?select=updated_at&user_id=eq.'+ses.uid, {}, ses.access);
  if(!r.ok) return { err:true };
  return { row: (r.json && r.json[0]) || null };
}

async function cloudPush(ses, expected){
  if(SYNC.tooBig(S)){ _cloudMsg = 'Tus datos son demasiado grandes para sincronizar; haz un respaldo'; return false; }
  const seq = _cloudSeq, now = new Date().toISOString();
  const body = { state:SYNC.pack(S), version:STATE_VERSION, updated_at:now };
  const r = expected
    ? await cloudFetch('/rest/v1/user_state?user_id=eq.'+ses.uid+'&updated_at=eq.'+encodeURIComponent(expected), { method:'PATCH', headers:{ Prefer:'return=representation' }, body:JSON.stringify(body) }, ses.access)
    : await cloudFetch('/rest/v1/user_state', { method:'POST', headers:{ Prefer:'return=representation' }, body:JSON.stringify(Object.assign({ user_id:ses.uid }, body)) }, ses.access);
  const row = r.ok && Array.isArray(r.json) ? r.json[0] : null;
  if(!row){ _cloudMsg = r.status===0 ? 'Sin conexión; se sube cuando vuelva' : 'Otro dispositivo cambió algo; se revisa en la próxima sincronización'; return false; }
  lsSet('catedra_sync', { uid:ses.uid, syncedAt:row.updated_at, dirty: seq!==_cloudSeq });
  return true;
}

async function cloudAdopt(ses){
  const r = await cloudFetch('/rest/v1/user_state?select=state,updated_at&user_id=eq.'+ses.uid, {}, ses.access);
  const row = r.ok && r.json && r.json[0];
  if(!row || !row.state){ _cloudMsg = 'No se pudo traer tu información'; return false; }
  // Copia de seguridad del estado de este equipo antes de reemplazarlo (por si la elección fue un error)
  if(SYNC.meaningful(S)){ try{ await kvSet('backup-pre-sync', S); }catch(e){} }
  _cloudQuiet = true;
  try{
    S = normalizeState(SYNC.unpack(row.state, S));
    await flushState();
    lsSet('catedra_sync', { uid:ses.uid, syncedAt:row.updated_at, dirty:false });
  } finally { _cloudQuiet = false; }
  location.reload();
  return true;
}

async function cloudSync(opt){
  if(_cloudBusy) return;
  if(!(opt && opt.force) && Date.now()-_cloudLast < 8000) return;
  const ses = await cloudToken(); if(!ses) return;
  _cloudBusy = true; _cloudLast = Date.now(); _cloudMsg = '';
  try{
    const got = await cloudRow(ses);
    if(got.err){ _cloudMsg = 'Sin conexión con la nube'; return; }
    const row = got.row;
    let act = SYNC.decide({ cloud: row ? { updatedAt:row.updated_at } : null, local:S, meta:cloudMeta(), uid:ses.uid });
    if(act==='ask'){
      act = confirm('Tu cuenta ya tiene datos en la nube y este dispositivo también tiene los suyos.\n\nAceptar = usar los de la nube (los de este dispositivo se guardan como copia).\nCancelar = quedarte con los de este dispositivo y reemplazar la nube.') ? 'adopt' : 'push';
    }
    if(act==='adopt'){ await cloudAdopt(ses); return; }
    if(act==='push'){ await cloudPush(ses, row ? row.updated_at : null); }
    else if(act==='noop'){ const m = cloudMeta(); lsSet('catedra_sync', Object.assign(m, { uid:ses.uid, syncedAt: row ? row.updated_at : m.syncedAt })); }
  } finally { _cloudBusy = false; cloudRender(); if(typeof PUSH!=='undefined') PUSH.pushSyncPrefs(); }
}

// Hoja de cuenta: entrar / crear cuenta, con errores en línea
function cloudOpen(mode){
  let m = mode==='up' ? 'up' : 'in', email = '';
  const draw = ()=>{
    const up = m==='up';
    openSheet(`<div class="eyebrow">Tu cuenta</div>
<div class="h1" style="font-size:21px;margin-top:2px;">${up?'Crea tu cuenta':'Bienvenido de vuelta'}</div>
<div class="muted" style="font-size:12.5px;line-height:1.55;margin-top:6px;">Tu progreso te sigue del celular al computador. Es opcional: sin cuenta todo funciona en este dispositivo.</div>
<div class="acct-seg"><button type="button" id="ac-in" class="${up?'':'on'}">Entrar</button><button type="button" id="ac-up" class="${up?'on':''}">Crear cuenta</button></div>
<form id="ac-form" novalidate>
<div class="acct-f"><label class="field-label" for="ac-email">Correo</label><input type="email" id="ac-email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="tu@correo.com" value="${esc(email)}"></div>
<div class="acct-f"><label class="field-label" for="ac-pass">Contraseña</label><div class="pw-wrap"><input type="password" id="ac-pass" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'Mínimo 8 caracteres':'Tu contraseña'}"><button type="button" id="ac-eye">Ver</button></div></div>
<div class="acct-err" id="ac-err" role="alert"></div>
<button class="btn btn-primary btn-block" id="ac-go" type="submit">${up?'Crear cuenta':'Entrar'}</button>
</form>
<button class="btn-link" type="button" style="display:block;margin:8px auto 0;" onclick="closeSheet()">Ahora no</button>`);
    const $ = id=>document.getElementById(id);
    const keep = ()=>{ email = $('ac-email').value; };
    $('ac-in').onclick = ()=>{ keep(); m='in'; draw(); };
    $('ac-up').onclick = ()=>{ keep(); m='up'; draw(); };
    $('ac-eye').onclick = ()=>{ const p=$('ac-pass'), show=p.type==='password'; p.type=show?'text':'password'; $('ac-eye').textContent=show?'Ocultar':'Ver'; };
    $('ac-form').onsubmit = async ev=>{
      ev.preventDefault();
      const b = $('ac-go'); b.disabled = true; b.textContent = 'Un momento…'; $('ac-err').textContent = '';
      const ok = await cloudAuth(m, $('ac-email').value, $('ac-pass').value);
      if(ok){ closeSheet(); return; }
      if(!$('ac-go')) return;                       // la hoja se cerró mientras tanto
      b.disabled = false; b.textContent = up ? 'Crear cuenta' : 'Entrar'; $('ac-err').textContent = _cloudErr;
    };
    setTimeout(()=>{ const f=$(email?'ac-pass':'ac-email'); if(f) f.focus(); }, 60);
  };
  draw();
}

function cloudRender(){
  const el = document.getElementById('cloud-box'); if(!el) return;
  const ses = cloudSession(), m = cloudMeta();
  if(ses){
    const st = _cloudMsg || (m.dirty ? 'Pendiente de subir…' : 'Sincronizado');
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><div style="min-width:0;"><div style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(ses.email)}</div><div class="muted" style="font-size:11.5px;margin-top:2px;"><span class="acct-dot"></span>${esc(st)}</div></div>
<div style="display:flex;gap:6px;flex-shrink:0;"><button class="btn btn-ghost btn-sm" id="cloud-sync">Sincronizar</button><button class="btn btn-ghost btn-sm" id="cloud-out">Salir</button></div></div>`;
    document.getElementById('cloud-sync').onclick = async()=>{ await cloudSync({ force:true }); showToast(_cloudMsg || 'Sincronizado'); };
    document.getElementById('cloud-out').onclick = ()=>{ if(confirm('¿Cerrar sesión? Tus datos siguen en este dispositivo.')) cloudSignOut(); };
  }else{
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div><div style="font-size:13.5px;">Tu cuenta</div><div class="muted" style="font-size:11.5px;margin-top:2px;line-height:1.4;">Tu progreso en todos tus dispositivos</div></div><button class="btn btn-primary btn-sm" id="cloud-open" style="flex-shrink:0;">Entrar</button></div>`;
    document.getElementById('cloud-open').onclick = ()=>cloudOpen('in');
  }
}

function cloudInit(){
  cloudRender();
  const ob = document.getElementById('ob-login'); if(ob) ob.onclick = ()=>cloudOpen('in');
  const tick = ()=>{ if(cloudSession()) cloudSync(); };
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') tick(); });
  window.addEventListener('online', tick);
  setInterval(tick, 5*60*1000);
  tick();
}
