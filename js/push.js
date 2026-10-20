'use strict';
/* Catedra · Push client: pedir permiso, suscribir, sincronizar prefs.
   Puro (sin DOM salvo APIs nativas), probado en tests/reminders.test.js (lógica en reminders.js). */
(function(root){
  // PEGA AQUÍ TU CLAVE VAPID PÚBLICA (la genera el fundador con: npx web-push generate-vapid-keys)
  const VAPID_PUBLIC = 'REEMPLAZA_CON_TU_VAPID_PUBLIC_KEY';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function todayStr(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }

  // Pico hour 0-23 desde perfil
  function picoHourFromProfile(profile){
    const map = {manana:8, tarde:15, noche:20, madrugada:6};
    return profile?.picoProductividad ? map[profile.picoProductividad] : 18;
  }

  // Próximo examen (fecha ISO o null)
  function nextExamAt(subjects){
    const now = new Date();
    let best = null;
    for(const s of subjects||[]){
      if(!s.examDate) continue;
      const d = new Date(s.examDate + 'T00:00:00');
      if(d >= now && (!best || d < best)) best = d;
    }
    return best ? best.toISOString() : null;
  }

  // Última actividad (ISO string o null)
  function lastActiveAt(st){
    const dates = [];
    (st.sessionLog||[]).forEach(x=>x.date && dates.push(new Date(x.date+'T00:00:00')));
    (st.evlog||[]).forEach(x=>x.d && dates.push(new Date(x.d+'T00:00:00')));
    if(!dates.length) return null;
    return new Date(Math.max(...dates)).toISOString();
  }

  // Rachas (días consecutivos con práctica)
  function streakDays(st){
    const days = new Set();
    (st.sessionLog||[]).forEach(x=>x.date && days.add(x.date));
    (st.evlog||[]).forEach(x=>x.d && days.add(x.d));
    if(!days.size) return 0;
    let streak = 0;
    const today = todayStr();
    let d = new Date(today);
    while(days.has(d.toISOString().slice(0,10))){
      streak++;
      d.setDate(d.getDate()-1);
    }
    return streak;
  }

  // Pedir permiso push (llamar TRAS sesión completada, no al cargar)
  async function pushAsk(){
    if(!('serviceWorker' in navigator) || !('PushManager' in window)){
      console.log('[push] Push no soportado');
      return false;
    }
    if(Notification.permission === 'denied'){
      console.log('[push] Permiso denegado');
      return false;
    }
    try{
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if(perm !== 'granted'){
        console.log('[push] Permiso no concedido:', perm);
        return false;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      });
      const keys = sub.toJSON().keys;
      // Subir a Supabase via cloudFetch (patrón de js/cloud.js)
      const token = localStorage.getItem('catedra_access_token');
      if(token){
        await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth
          })
        });
      }
      console.log('[push] Suscrito OK');
      return true;
    }catch(e){
      console.error('[push] Error:', e);
      return false;
    }
  }

  // Sincronizar preferencias (llamar en cada cloudSync)
  async function pushSyncPrefs(st){
    const token = localStorage.getItem('catedra_access_token');
    if(!token) return;
    const prefs = {
      next_exam_at: nextExamAt(st.subjects),
      pico_hour: picoHourFromProfile(st.profile),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      last_active_at: lastActiveAt(st),
      streak: streakDays(st),
      enabled: true
    };
    try{
      await fetch('/api/push-prefs', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify(prefs)
      });
    }catch(e){
      console.error('[push] Sync prefs error:', e);
    }
  }

  // Exportar para test/uso
  const PUSH = { pushAsk, pushSyncPrefs, picoHourFromProfile, nextExamAt, lastActiveAt, streakDays };
  root.PUSH = PUSH;
  if(typeof module!=='undefined' && module.exports) module.exports = PUSH;
})(typeof window!=='undefined' ? window : globalThis);