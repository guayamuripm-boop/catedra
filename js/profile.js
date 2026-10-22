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
    if(!st.profile) st.profile = {};
    const p = st.profile;
    // Los chips de la UI mandan el valor como texto (viene de un atributo onclick): 10 llega como '10'
    if(key==='capacidadEnfoque' && typeof value==='string' && /^\d+$/.test(value)) value = Number(value);
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

  function weakestDomain(st){
    const dom = st.diag && st.diag.dom;
    if(!dom) return null;
    let worst = null, worstEst = 101;
    for(const k in dom){
      const d = dom[k];
      if(d.w >= 3 && d.est < worstEst){
        worstEst = d.est;
        worst = k;
      }
    }
    return worst;
  }

  /* Sesgo para STRAT.recommend: si el estudiante se sobreestima (dice "lo sé" y falla) o su autoevaluación es baja,
     la autoprueba pesa más. Devuelve {} si no hay evidencia suficiente. */
  function sesgo(st){
    const conf = [];
    for(const s of (st.subjects||[])) for(const it of (s.items||[])) for(const c of (it.confidences||[])) conf.push(c);
    const sure = conf.filter(c=>c.conf===3);
    const over = sure.length>=5 && sure.filter(c=>c.score<100).length/sure.length >= 0.4;
    const aut = st.diag && st.diag.dom && st.diag.dom.AUT;
    const autBaja = !!(aut && aut.w>=3 && aut.est<40);
    return (over || autBaja) ? { autoprueba: 0.3 } : {};
  }

  const PROFILE = { missing, capture, shouldAsk, weakestDomain, sesgo, ESS_KEYS };
  root.PROFILE = PROFILE;
  if(typeof module!=='undefined' && module.exports) module.exports = PROFILE;
})(typeof window!=='undefined' ? window : globalThis);