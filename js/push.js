'use strict';
/* Catedra · Push client: permiso tras momento positivo, sync prefs, VAPID. Puro (sin DOM salvo APIs nativas). */
(function(root){
  // PEGA AQUÍ TU CLAVE PÚBLICA VAPID (la genera el fundador con: npx web-push generate-vapid-keys)
  const VAPID_PUBLIC = 'TU_VAPID_PUBLIC_AQUI';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }

  async function pushAsk() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') return pushSubscribe();

    // Pedir permiso tras momento positivo (llama a esto desde app.html tras sesión completada)
    const perm = await Notification.requestPermission();
    if (perm === 'granted') await pushSubscribe();
  }

  async function pushSubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
    });
    const key = sub.getKey('p256dh');
    const auth = sub.getKey('auth');
    const payload = {
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
    };
    await cloudFetch('/api/push-subscribe', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function pushSyncPrefs() {
    if (typeof cloudFetch !== 'function') return;
    const st = root.S || {};
    const prefs = {
      next_exam_at: (typeof SP!=='undefined' && SP.nextEval) ? SP.nextEval(st.subjects || [], new Date().toISOString().slice(0,10)) : null,
      pico_hour: hourFromPico(st.profile?.picoProductividad),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      last_active_at: (st.sessionLog?.length || st.evlog?.length) ? new Date().toISOString() : null,
      streak: streakCount(st),
      enabled: true
    };
    await cloudFetch('/api/reminder-prefs', { method: 'POST', body: JSON.stringify(prefs) });
  }

  function hourFromPico(p) { return {manana:8, tarde:15, noche:20, madrugada:6}[p] || 15; }
  function streakCount(st) {
    let c=0, d=new Date();
    while(st.streakDays?.includes(localISO(d))) { c++; d.setDate(d.getDate()-1); }
    return c;
  }
  function localISO(d){ const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }

  root.PUSH = { pushAsk, pushSyncPrefs };
  if(typeof module!=='undefined' && module.exports) module.exports = { pushAsk, pushSyncPrefs };
})(typeof window!=='undefined' ? window : globalThis);