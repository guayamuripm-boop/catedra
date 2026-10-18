'use strict';
/* Catedra · Núcleo puro de sincronización (sin red ni DOM; probado en tests/sync.test.js).
   Modelo: el dispositivo manda (IndexedDB), la nube es una copia por cuenta.
   Una fila por estudiante; "version" de la fila = su updated_at (se compara solo por igualdad, nunca por reloj). */
(function(root){
// Lo que es de ESTE dispositivo y no viaja: identificador de equipo, código de piloto y proxy propio.
const LOCAL_ONLY = ['deviceId', 'pilotCode', 'aiUrl'];
const MAX_BYTES = 3500000;

function meaningful(s){
  return !!(s && typeof s==='object' && (s.onboarded || (s.subjects&&s.subjects.length) || (s.notes&&s.notes.length) || (s.materials&&s.materials.length)));
}
function pack(s){
  const c = JSON.parse(JSON.stringify(s));
  if(c.settings) LOCAL_ONLY.forEach(k=>{ delete c.settings[k]; });
  return c;
}
function unpack(cloud, local){
  const c = JSON.parse(JSON.stringify(cloud));
  c.settings = Object.assign({}, c.settings);
  LOCAL_ONLY.forEach(k=>{ if(local && local.settings && k in local.settings) c.settings[k] = local.settings[k]; });
  return c;
}
function tooBig(s){ try{ return JSON.stringify(pack(s)).length > MAX_BYTES; }catch(e){ return true; } }

/* o = {cloud: null | {updatedAt}, local: estado, meta: {uid, syncedAt, dirty}, uid}
   Devuelve: 'noop' | 'push' (subir; inserta si no hay fila) | 'adopt' (traer la nube) | 'ask' (los dos cambiaron o es un equipo nuevo con datos) */
function decide(o){
  const linked = !!(o.meta && o.meta.uid === o.uid);
  if(!o.cloud) return meaningful(o.local) ? 'push' : 'noop';
  if(!linked) return meaningful(o.local) ? 'ask' : 'adopt';
  const cloudChanged = o.cloud.updatedAt !== o.meta.syncedAt;
  if(!cloudChanged) return o.meta.dirty ? 'push' : 'noop';
  return o.meta.dirty ? 'ask' : 'adopt';
}

const api = { LOCAL_ONLY, MAX_BYTES, meaningful, pack, unpack, tooBig, decide };
if(typeof module!=='undefined' && module.exports) module.exports = api; else root.SYNC = api;
})(typeof window!=='undefined' ? window : globalThis);
