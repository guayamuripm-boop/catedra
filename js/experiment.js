'use strict';
/* Catedra · Experimento de 48 h: "¿qué te funciona a ti?"
   Saber qué método es bueno no basta: hay que verlo en uno mismo (marco KBCP, McDaniel y Einstein 2020).
   Un texto se relee dos veces, el otro se lee una vez y se intenta recordar sin mirar. A los 2 días se
   pregunta por ambos. Debe esperar: a los 5 minutos releer gana; a los 2 días gana recordar
   (Roediger y Karpicke 2006). Es una prueba personal pequeña, no un estudio: se dice así. */
(function(root){
  const WAIT_DAYS = 2;
  const TEXTS = {
    a: {titulo:'El Salto Ángel', texto:'El Salto Ángel, en el estado Bolívar, es la caída de agua ininterrumpida más alta del mundo: unos 979 metros desde la cima del Auyán-tepui. Está dentro del Parque Nacional Canaima, declarado Patrimonio de la Humanidad por la UNESCO en 1994. Los tepuyes son mesetas de paredes verticales formadas por arenisca muy antigua, y su cima suele estar cubierta de niebla. El nombre del salto viene de Jimmie Angel, un aviador estadounidense que lo sobrevoló en 1933 y que años después aterrizó su avioneta en la cima del tepuy. Para el pueblo pemón, que habita la Gran Sabana, el salto tiene su propio nombre en su lengua. Llegar suele requerir avioneta hasta Canaima y luego horas en curiara por el río.',
      q: [
        ['¿Cuánto mide, aproximadamente, la caída del Salto Ángel?', ['979 metros','420 metros','1.500 metros','2.300 metros']],
        ['¿Desde qué tepuy cae?', ['Auyán-tepui','Roraima','Kukenán','Sarisariñama']],
        ['¿De dónde viene su nombre?', ['De un aviador que lo sobrevoló','De un misionero','De una leyenda pemón','De un río cercano']],
        ['¿En qué año el parque fue declarado Patrimonio de la Humanidad?', ['1994','1975','2001','1962']]
      ]},
    b: {titulo:'La danza de las abejas', texto:'Cuando una abeja obrera encuentra flores con néctar, vuelve a la colmena y lo comunica bailando. Si la comida está cerca, hace una danza en círculo. Si está lejos, hace la «danza del meneo»: camina en línea recta moviendo el abdomen y luego regresa en semicírculo para repetir. El ángulo de esa línea, respecto a la vertical del panal, indica la dirección de la comida respecto al sol. Cuánto dura el meneo indica la distancia: más largo, más lejos. Las demás abejas siguen a la bailarina en la oscuridad y perciben el baile por las vibraciones y el olor de las flores. Este lenguaje lo descifró el zoólogo austriaco Karl von Frisch, que recibió el Premio Nobel en 1973.',
      q: [
        ['¿Qué indica cuánto dura el meneo?', ['La distancia','La dirección','La cantidad de néctar','El tipo de flor']],
        ['¿Respecto a qué se marca la dirección de la comida?', ['El sol','La luna','El viento','La reina']],
        ['Si la comida está cerca, ¿qué danza hacen?', ['En círculo','Del meneo','En zigzag','Ninguna']],
        ['¿Quién descifró este lenguaje?', ['Karl von Frisch','Charles Darwin','Gregor Mendel','Louis Pasteur']]
      ]}
  };

  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parse(s){ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function daysBetween(a,b){ return Math.round((parse(b)-parse(a))/864e5); }

  /* rnd: número en [0,1) para asignar al azar qué texto se relee (evita que la dificultad del texto decida) */
  function create(today, rnd){ return {startedAt:today, reread:(rnd<0.5?'a':'b'), predict:null, phase:'learn', answers:null, score:null}; }
  function testKey(e){ return e.reread==='a'?'b':'a'; }
  function daysLeft(e,today){ return Math.max(0, WAIT_DAYS - daysBetween(e.startedAt,today)); }
  function isDue(e,today){ return !!e && e.phase==='wait' && daysLeft(e,today)===0; }

  /* Preguntas mezcladas de ambos textos; las opciones se barajan con una semilla fija por pregunta */
  function quiz(e){
    const out=[];
    ['a','b'].forEach(k=>TEXTS[k].q.forEach(([t,o],i)=>{
      const order=o.map((x,j)=>j); const s=(t.length*7+i*13)%4;
      for(let j=0;j<s;j++) order.push(order.shift());
      out.push({k, i, t, o:order.map(j=>o[j]), ok:order.indexOf(0)});
    }));
    return out.filter((x,n)=>n%2===0).concat(out.filter((x,n)=>n%2===1));
  }
  /* answers: arreglo de índices elegidos, en el orden de quiz(e) */
  function score(e, answers){
    const qz=quiz(e), r={a:0,b:0};
    qz.forEach((q,n)=>{ if(answers[n]===q.ok) r[q.k]++; });
    return {reread:r[e.reread], test:r[testKey(e)], n:4};
  }
  function verdict(e){
    const s=e.score; if(!s) return null;
    const diff=s.test-s.reread;
    const fooled = e.predict==='releer' && diff>0;
    let t, m;
    if(diff>0){ t='Recordar sin mirar te funcionó mejor'; m='Del texto que intentaste recordar acertaste '+s.test+' de 4; del que releíste, '+s.reread+' de 4.'; }
    else if(diff===0){ t='Empate'; m='Acertaste '+s.test+' de 4 en ambos. Con 4 preguntas por texto hay ruido: tus repasos de cada día nos dirán más.'; }
    else { t='Esta vez releer te fue mejor'; m='Releyendo acertaste '+s.reread+' de 4 y recordando '+s.test+' de 4. Pasa: un texto pudo resultarte más fácil. Lo seguimos midiendo con tu propio material, no con una sola prueba.'; }
    const extra = fooled ? 'Y creías lo contrario: eso es la ilusión de saber. Releer se siente más seguro, pero se olvida más rápido.' : '';
    return {t, m, extra, won: diff>0?'test':diff<0?'reread':'tie'};
  }

  const EXP = {WAIT_DAYS, TEXTS, create, testKey, daysLeft, isDue, quiz, score, verdict, iso};
  root.EXP = EXP;
  if(typeof module!=='undefined' && module.exports) module.exports = EXP;

  /* ───────── Interfaz (solo navegador) ───────── */
  if(typeof document==='undefined') return;
  const X = {step:'intro', reads:0, qn:0, ans:[]};
  function st(){ return (typeof S!=='undefined') ? S : root.S; }
  function save(){ if(typeof root.saveState==='function') root.saveState(); }
  function h(s){ return typeof root.esc==='function' ? root.esc(s) : String(s); }
  function today(){ return typeof root.todayStr==='function' ? root.todayStr() : iso(new Date()); }
  function sheet(html){ if(typeof root.openSheet==='function') root.openSheet(html); }

  root.openExperiment = function(){
    const e=st().experiment;
    if(!e){ X.step='intro'; }
    else if(e.phase==='learn'){ X.step = X.step==='intro'?'predict':X.step; }
    else if(e.phase==='wait'){ X.step = isDue(e,today()) ? 'quizIntro' : 'waiting'; }
    else X.step='result';
    render();
  };
  root.expGo = function(step, arg){
    const S=st();
    if(step==='start'){ S.experiment=create(today(), Math.random()); save(); X.step='predict'; }
    else if(step==='predict'){ S.experiment.predict=arg; save(); X.step='reread'; X.reads=1; }
    else if(step==='again'){ X.reads=2; }
    else if(step==='test'){ X.step='testRead'; }
    else if(step==='recall'){ X.step='recall'; }
    else if(step==='check'){ X.step='check'; }
    else if(step==='wait'){ S.experiment.phase='wait'; S.experiment.startedAt=today(); save(); X.step='waiting'; if(typeof root.track==='function') root.track('exp_learned',{}); }
    else if(step==='quiz'){ X.step='quiz'; X.qn=0; X.ans=[]; }
    else if(step==='answer'){ X.ans.push(arg); X.qn++; if(X.qn>=8){ S.experiment.answers=X.ans.slice(); S.experiment.score=score(S.experiment,X.ans); S.experiment.phase='done'; save(); X.step='result'; if(typeof root.track==='function') root.track('exp_done',{won:verdict(S.experiment).won}); } }
    else if(step==='close'){ if(typeof root.closeSheet==='function') root.closeSheet(); if(typeof root.renderAll==='function') root.renderAll(); return; }
    render();
  };

  function textCard(k){ const T=TEXTS[k]; return `<div class="exp-text"><div class="eyebrow">${h(T.titulo)}</div><p>${h(T.texto)}</p></div>`; }
  function render(){
    const e=st().experiment;
    let b='';
    if(X.step==='intro') b=`<div class="eyebrow">Experimento de 48 horas</div>
      <div class="h1" style="font-size:21px;">Descubre qué te funciona a ti</div>
      <div class="muted exp-p">Dos textos cortos. Uno lo lees dos veces. El otro lo lees una vez y luego intentas recordarlo sin mirar. En 2 días te pregunto por los dos y comparas tus propios resultados.</div>
      <div class="chips">${typeof root.mkChip==='function'?root.mkChip('clock','4 min hoy')+root.mkChip('flag','2 min en 2 días'):''}</div>
      <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="expGo('start')">Empezar</button>`;
    else if(X.step==='predict') b=`<div class="h1" style="font-size:19px;">Antes de empezar: ¿con cuál crees que recordarás más en 2 días?</div>
      <div class="mode-opts" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
      ${[['releer','Leyéndolo dos veces'],['recordar','Intentando recordarlo sin mirar'],['nose','No sé']].map(([v,l])=>`<button class="btn btn-ghost btn-block" onclick="expGo('predict','${v}')">${l}</button>`).join('')}</div>`;
    else if(X.step==='reread') b=`<div class="eyebrow">Texto 1 · léelo ${X.reads===1?'una vez':'otra vez'}</div>${textCard(e.reread)}
      ${X.reads===1?`<button class="btn btn-primary btn-block" onclick="expGo('again')">Leído. Leer otra vez</button>`:`<button class="btn btn-primary btn-block" onclick="expGo('test')">Listo, siguiente texto</button>`}`;
    else if(X.step==='testRead') b=`<div class="eyebrow">Texto 2 · léelo una sola vez, con atención</div>${textCard(testKey(e))}
      <button class="btn btn-primary btn-block" onclick="expGo('recall')">Leído. Ahora sin mirar</button>`;
    else if(X.step==='recall') b=`<div class="eyebrow">Texto 2 · sin mirar</div>
      <div class="h1" style="font-size:18px;">Escribe o di en voz alta todo lo que recuerdes</div>
      <div class="muted exp-p">No importa si es poco. El esfuerzo de recordar es lo que lo fija.</div>
      <textarea class="input" rows="5" placeholder="Lo que recuerdo…" style="width:100%;margin-top:8px;"></textarea>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" onclick="expGo('check')">Comparar con el texto</button>`;
    else if(X.step==='check') b=`<div class="eyebrow">Compara: ¿qué se te escapó?</div>${textCard(testKey(e))}
      <button class="btn btn-primary btn-block" onclick="expGo('wait')">Terminar por hoy</button>`;
    else if(X.step==='waiting'){ const d=daysLeft(e,today()); b=`<div class="eyebrow">Experimento en curso</div>
      <div class="h1" style="font-size:20px;">Vuelve en ${d} día${d===1?'':'s'}</div>
      <div class="muted exp-p">No repases los textos: así la comparación es justa. Te lo recordaré en Hoy. Releer gana si preguntamos ya; lo que queremos saber es qué queda después.</div>
      <button class="btn btn-ghost btn-block" style="margin-top:12px;" onclick="expGo('close')">Entendido</button>`; }
    else if(X.step==='quizIntro') b=`<div class="eyebrow">Experimento de 48 horas</div>
      <div class="h1" style="font-size:20px;">Ocho preguntas, sin mirar</div>
      <div class="muted exp-p">Responde lo que recuerdes de ambos textos. Si no sabes, elige la que te parezca.</div>
      <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="expGo('quiz')">Empezar</button>`;
    else if(X.step==='quiz'){ const q=quiz(e)[X.qn]; b=`<div class="eyebrow">${X.qn+1} de 8 · ${h(TEXTS[q.k].titulo)}</div>
      <div class="h1" style="font-size:18px;">${h(q.t)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">${q.o.map((o,j)=>`<button class="btn btn-ghost btn-block" onclick="expGo('answer',${j})">${h(o)}</button>`).join('')}</div>`; }
    else if(X.step==='result'){ const v=verdict(e), s=e.score;
      const bar=(l,n,c)=>`<div class="exp-bar"><span>${l}</span><i><b style="width:${n*25}%;background:${c}"></b></i><em>${n}/4</em></div>`;
      b=`<div class="eyebrow">Tu resultado</div>
      <div class="h1" style="font-size:21px;">${h(v.t)}</div>
      ${bar('Recordar sin mirar',s.test,'var(--brass)')}${bar('Releer dos veces',s.reread,'var(--muted)')}
      <div class="muted exp-p">${h(v.m)}${v.extra?' '+h(v.extra):''}</div>
      <div class="muted exp-p" style="font-size:11.5px;">En el estudio de Roediger y Karpicke (2006), releer ganaba a los 5 minutos y recordar ganaba a los 2 días y a la semana. Esto fue una prueba tuya pequeña, no un estudio.</div>
      <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="expGo('close');goTab('materials')">Usarlo con mi material</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick="expGo('close')">Volver a Hoy</button>`; }
    sheet(`<div class="exp">${b}</div>`);
  }
})(typeof window!=='undefined' ? window : globalThis);
