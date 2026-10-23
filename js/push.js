'use strict';
/* Catedra · Avisos push (cliente). Pide permiso solo cuando el estudiante lo decide (un toque), guarda el dispositivo
   y sus preferencias en Supabase, y el servidor (supabase/functions/send-reminders) decide cuándo avisar.
   Requiere cuenta (la suscripción pertenece a un usuario). Sin clave VAPID configurada, nada de esto se muestra.
   En iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4+). */
(function(root){
  // Clave PÚBLICA VAPID (es pública: puede ir aquí). La privada vive solo como secreto de la Edge Function.
  const VAPID_PUBLIC = 'BHc-LimQQSPiJuj4xD9AWCwlAlo94fJ09yVJMikcsbLP3PFxHAb7jbxtG4HPW3SaCHvZT21xRxboCIcd3b-tp8k';

  const pad = n => String(n).padStart(2,'0');
  const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const HOURS = { manana:8, tarde:15, noche:20, madrugada:8 };   // la madrugada se mueve a las 8: nunca avisamos dormidos

  function hourFromPico(p){ return HOURS[p] || 15; }
  // Último día con práctica real (racha o sesiones)
  function lastStudyDate(st){
    const days = (st.streakDays||[]).concat((st.sessionLog||[]).map(x=>x.date)).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||''));
    return days.length ? days.sort().pop() : null;
  }
  // Fecha de la próxima evaluación de todas las materias
  function nextExamDate(st, today, nextEval){
    const t = today || iso(new Date());
    const ne = nextEval || (typeof SP!=='undefined' && SP.nextEval) || null;
    if(!ne) return null;
    const f = (st.subjects||[]).map(s=>ne(s,t)).filter(e=>e&&e.fecha).map(e=>e.fecha).sort();
    return f[0] || null;
  }
  function prefsFor(st, today, tz, nextEval){
    return { next_exam_date:nextExamDate(st,today,nextEval), pico_hour:hourFromPico(st.profile&&st.profile.picoProductividad), tz:tz||'America/Caracas', last_study_date:lastStudyDate(st), enabled:true };
  }
  function b64urlToBytes(s){
    const b = (s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'), raw = atob(b);
    return Uint8Array.from(raw, c=>c.charCodeAt(0));
  }

  const api = { hourFromPico, lastStudyDate, nextExamDate, prefsFor, VAPID_PUBLIC };
  if(typeof document==='undefined'){ if(typeof module!=='undefined'&&module.exports) module.exports = api; return; }

  /* ───────── Navegador ───────── */
  // S y las funciones de cloud.js son globales de script (let/const), no propiedades de window: se usan por nombre
  const S_ = () => S;
  const hasCloud = () => typeof cloudSession==='function' && !!cloudSession();

  // 'unsupported' | 'unconfigured' | 'needs-account' | 'denied' | 'off' | 'on'
  // Auto-encendido: los avisos solo se ofrecen cuando el servidor ya tiene su tabla (supabase/002_push.sql aplicado).
  // Así nunca aparece un botón que falle; al terminar la configuración, se encienden solos.
  let serverReady = null;
  async function probe(){
    if(serverReady!==null || typeof cloudFetch!=='function') return serverReady;
    const r = await cloudFetch('/rest/v1/push_subscriptions?select=endpoint&limit=0');
    serverReady = r.status===200;
    return serverReady;
  }
  function state(){
    if(!VAPID_PUBLIC || serverReady!==true) return 'unconfigured';
    if(!('serviceWorker' in navigator) || !('PushManager' in root) || !('Notification' in root)) return 'unsupported';
    if(!hasCloud()) return 'needs-account';
    if(Notification.permission==='denied') return 'denied';
    return (S_().settings && S_().settings.push && Notification.permission==='granted') ? 'on' : 'off';
  }

  async function rest(path, opt, bodyFor){
    const ses = await cloudToken();
    if(!ses) return { ok:false };
    const o = Object.assign({}, opt);
    if(bodyFor) o.body = JSON.stringify(Object.assign({ user_id:ses.uid }, bodyFor));
    return cloudFetch(path, o, ses.access);
  }

  // Debe llamarse desde un toque del estudiante (iOS no deja pedir permiso en otro momento)
  async function enable(){
    if(state()==='unsupported'||state()==='unconfigured'||state()==='needs-account') return false;
    const perm = await Notification.requestPermission();
    if(perm!=='granted'){ root.showToast('Sin permiso no puedo avisarte. Puedes activarlo en los ajustes del navegador.'); return false; }
    try{
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64urlToBytes(VAPID_PUBLIC) });
      const k = sub.toJSON().keys || {};
      const r = await rest('/rest/v1/push_subscriptions', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates' } }, { endpoint:sub.endpoint, p256dh:k.p256dh, auth:k.auth });
      if(!r.ok) throw new Error('save');
      S_().settings.push = true; S_().settings.pushDeclined = false; root.saveState();
      await syncPrefs(true);
      root.showToast('Listo: te aviso antes de tus exámenes');
      return true;
    }catch(e){
      root.showToast('No pude activar los avisos en este dispositivo');
      return false;
    }
  }

  async function disable(){
    try{
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if(sub){ await rest('/rest/v1/push_subscriptions?endpoint=eq.'+encodeURIComponent(sub.endpoint), { method:'DELETE' }); await sub.unsubscribe(); }
    }catch(e){}
    S_().settings.push = false; root.saveState();
    root.showToast('Avisos apagados en este dispositivo');
  }

  // Sube lo que el servidor necesita para decidir cuándo avisar (solo fechas y hora: nada del contenido de estudio)
  async function syncPrefs(force){
    if(!force && state()!=='on') return;
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'America/Caracas';
    await rest('/rest/v1/reminder_prefs', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates' } }, Object.assign({ updated_at:new Date().toISOString() }, prefsFor(S_(), iso(new Date()), tz)));
  }

  const NOTE = 'En iPhone funciona solo con la app instalada en la pantalla de inicio.';
  // Tarjeta de invitación tras una sesión (una sola vez; "Ahora no" se respeta)
  function offer(slotId){
    const el = document.getElementById(slotId); if(!el) return;
    const st = S_();
    if(state()!=='off' || st.settings.pushDeclined || !(st.sessionLog||[]).length){ el.innerHTML=''; return; }
    el.innerHTML = `<div class="glass fade-in" style="margin-top:12px;text-align:left;">
      <div style="font-size:13.5px;font-weight:600;">¿Te aviso antes de tus exámenes?</div>
      <div class="muted" style="font-size:12px;line-height:1.5;margin-top:4px;">Un aviso al día como máximo, a tu hora, y nunca de madrugada. ${NOTE}</div>
      <div style="display:flex;gap:8px;margin-top:10px;"><button class="btn btn-primary btn-sm" style="flex:1;" id="push-yes">Avísame</button><button class="btn btn-ghost btn-sm" style="flex:1;" id="push-no">Ahora no</button></div></div>`;
    document.getElementById('push-yes').onclick = async()=>{ await enable(); offer(slotId); };
    document.getElementById('push-no').onclick = ()=>{ st.settings.pushDeclined = true; root.saveState(); el.innerHTML=''; };
  }

  // Fila dentro de la tarjeta de cuenta (Progreso)
  function renderRow(el){
    if(!el) return;
    const s = state();
    if(s==='unsupported'||s==='unconfigured'||s==='needs-account'){ el.innerHTML=''; return; }
    const on = s==='on';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;">
      <div style="min-width:0;"><div style="font-size:13px;">Avisos</div><div class="muted" style="font-size:11.5px;margin-top:2px;line-height:1.4;">${s==='denied'?'Bloqueados en este navegador':on?'Activos en este dispositivo':NOTE}</div></div>
      ${s==='denied'?'':`<button class="btn btn-ghost btn-sm" id="push-toggle" style="flex-shrink:0;">${on?'Apagar':'Activar'}</button>`}</div>`;
    const b = document.getElementById('push-toggle');
    if(b) b.onclick = async()=>{ on ? await disable() : await enable(); renderRow(el); };
  }

  root.PUSH = Object.assign({ state, probe, enable, disable, syncPrefs, offer, renderRow }, api);
})(typeof window!=='undefined' ? window : globalThis);
