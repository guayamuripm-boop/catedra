'use strict';
/* Catedra · Perfil progresivo: el diagnóstico madura con el uso.
   Rellena picoProductividad, capacidadEnfoque y desafío con micro-preguntas visuales,
   no con un diagnóstico largo al entrar. Puro (sin DOM), probado en tests/profile.test.js. */
(function(root){
  const ESS_KEYS = ['capacidadEnfoque','picoProductividad','desafio'];
  const VALID = {
    capacidadEnfoque: new Set([10,20,35,45]),
    picoProductividad: new Set(['manana','tarde','noche','madrugada']),
    desafio: new Set(['concentracion','tiempo','nervios','empezar'])
  };

  function todayStr(){ return iso(new Date()); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

  function hasSession(st){
    return (st.sessionLog||[]).length > 0 || (st.evlog||[]).length > 0;
  }

  function missing(st){
    const p = st.profile || {};
    return ESS_KEYS.filter(k => !p[k] || (typeof p[k]==='string' && p[k].trim()==='') || (typeof p[k]==='number' && p[k]===0));
  }

  function capture(st, key, value){
    const p = st.profile || {};
    if(key in p && p[key] && !(typeof p[key]==='number' && p[key]===0)) return false;
    const vset = VALID[key];
    if(vset && !vset.has(value)) return false;
    p[key] = value;
    return true;
  }

  function shouldAsk(st, today){
    today = today || todayStr();
    if(!hasSession(st)) return false;
    const m = missing(st);
    if(m.length===0) return false;
    if(st.profile._askedDay === today) return false;
    return true;
  }

  const PROFILE = { missing, capture, shouldAsk, ESS_KEYS };
  root.PROFILE = PROFILE;
  if(typeof module!=='undefined' && module.exports) module.exports = PROFILE;
})(typeof window!=='undefined' ? window : globalThis);