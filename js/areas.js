'use strict';
/* Catedra · Áreas: no se estudia igual Castellano que Matemáticas o Química.
   Cada área trae (1) los métodos que más convienen y por qué, con su evidencia, y
   (2) un "puente": una pregunta para que el estudiante conecte el tema con algo de su vida.
   El puente lo genera el propio estudiante: en los estudios, la relevancia que uno mismo escribe
   ayuda sobre todo a quien tiene poca confianza, y la que se le dice directamente puede
   desanimarlo (Hulleman y Harackiewicz 2009; Canning y Harackiewicz 2015). Por eso primero
   preguntamos y solo después, si la pide, damos ideas. */
(function(root){
  const AREAS = {
    matematicas: {nombre:'Números y problemas', ej:'Matemáticas, Física, Estadística',
      kw:['mate','álgebra','algebra','cálculo','calculo','geometr','trigonom','estad','física','fisica','contab','finanz','aritm','probab','ecuacion','ecuación'],
      metodos:['ejemplo_resuelto','intercalar','autoprueba','espaciado'], actividad:'ejercicios',
      tip:'Aquí se aprende resolviendo, no leyendo. Primero estudia un ejemplo resuelto; luego resuelve ejercicios mezclados de distintos tipos, sin saber de antemano qué método toca.',
      ev:'Ejemplos resueltos: efecto medio en matemáticas (Barbieri y col., 2023). Ejercicios mezclados: un mes después, 61 % contra 38 % en séptimo grado (Rohrer y col., 2020).',
      puente:{q:'¿Dónde aparece esto fuera de clase?', pista:'dinero, medidas, tiempos, tu teléfono, un juego', ideas:['Calcular cuánto te alcanza con lo que tienes o un descuento.','Medir algo en casa o repartir una cuenta.','Entender una gráfica o un porcentaje en una noticia.']}},
    quimica: {nombre:'Química', ej:'Química, Bioquímica',
      kw:['quím','quim','bioquím','bioquim'],
      metodos:['ejemplo_resuelto','tres_niveles','autoprueba','espaciado'], actividad:'ejercicios',
      tip:'La química se entiende en tres niveles: lo que ves, lo que pasa con las partículas y cómo se escribe. Cuando estudies una fórmula, dibuja también qué le pasa a las moléculas.',
      ev:'Moverse entre los tres niveles es lo que más cuesta a quien empieza (Johnstone; revisiones de la Royal Society of Chemistry).',
      puente:{q:'¿Dónde ves pasar esto?', pista:'la cocina, la limpieza, el cuerpo, un carro', ideas:['Cocinar: algo que se dora, fermenta o se disuelve.','Limpiar: por qué el jabón quita la grasa.','Tu cuerpo: lo que pasa cuando comes o haces ejercicio.']}},
    ciencias: {nombre:'Ciencias de la vida', ej:'Biología, Anatomía, Ciencias naturales',
      kw:['biolog','anatom','fisiolog','ciencias nat','ecolog','genét','genet','microbio','botán','botan','zoolog','salud','histolog','medic','enfermer'],
      metodos:['autoprueba','por_que','mapa','espaciado'], actividad:'leer',
      tip:'Hay mucho que recordar y todo está conectado. Ponte a prueba sin mirar, pregúntate por qué pasa cada cosa y dibuja el proceso de memoria.',
      ev:'Evaluarse y repartir el estudio: utilidad alta; preguntarse por qué: moderada (Dunlosky y col., 2013).',
      puente:{q:'¿Qué de tu vida se explica con esto?', pista:'tu cuerpo, alguien que conoces, la comida, el clima', ideas:['Algo que le pasó a tu cuerpo: una gripe, un golpe, el cansancio.','Por qué una planta de tu casa crece o se seca.','Una noticia de salud que hayas visto.']}},
    lengua: {nombre:'Lengua e idiomas', ej:'Castellano, Literatura, Inglés',
      kw:['castell','lengua','literat','idioma','inglés','ingles','francés','frances','portugu','redacc','gramát','gramat','lectura','comunicaci','escritura','ortograf'],
      metodos:['pregunta_resume','autoprueba','explicalo','espaciado'], actividad:'leer',
      tip:'Para comprender un texto, pregúntate cosas mientras lees y al final resume la idea principal con tus palabras. Para vocabulario y reglas, ponte a prueba en días distintos.',
      ev:'Preguntarse y resumir: efectos de moderados a grandes en comprensión lectora, mayores en quien tiene dificultades (metaanálisis 2019; Edmonds y col.).',
      puente:{q:'¿Cuándo vas a necesitar esto?', pista:'un mensaje, una entrevista, un trabajo escrito, una canción', ideas:['Escribir un mensaje o un correo que tiene que sonar bien.','Hablar en una entrevista o en público.','Entender una canción, una serie o un contrato.']}},
    sociales: {nombre:'Sociales y humanidades', ej:'Historia, Geografía, Derecho, Economía',
      kw:['histor','geograf','derecho','econom','filosof','socio','polít','polit','cívic','civic','ética','etica','psicolog','administr','ciudadan','arte'],
      metodos:['por_que','autoprueba','explicalo','mapa'], actividad:'leer',
      tip:'Más que fechas sueltas, busca causas y consecuencias: pregúntate por qué pasó y qué cambió después. Explícalo como una historia, sin mirar.',
      ev:'Preguntarse por qué y explicarlo con tus palabras: utilidad moderada; evaluarse: alta (Dunlosky y col., 2013).',
      puente:{q:'¿Qué de hoy se parece a esto?', pista:'una noticia, tu ciudad, tu familia, una decisión', ideas:['Una noticia actual que tenga una causa parecida.','Algo de tu ciudad o tu país que venga de ahí.','Una decisión de tu vida que siga la misma lógica.']}},
    general: {nombre:'Otra', ej:'Cualquier otra materia',
      kw:[], metodos:['autoprueba','espaciado','explicalo','mapa'], actividad:'leer',
      tip:'Lo que funciona en casi todo: ponte a prueba sin mirar y repártelo en varios días.',
      ev:'Evaluarse y repartir: utilidad alta en casi cualquier materia (Dunlosky y col., 2013; Donoghue y Hattie, 2021).',
      puente:{q:'¿Dónde vas a usar esto?', pista:'tu día, tu trabajo, tus planes', ideas:['Algo de tu día a día.','Un trabajo que te gustaría tener.','Un proyecto o plan personal.']}}
  };
  const ORDER = ['matematicas','quimica','ciencias','lengua','sociales','general'];

  function norm(s){ return String(s||'').toLowerCase(); }
  /* Adivina el área por el nombre; el estudiante siempre puede cambiarla */
  function detect(nombre){
    const n = norm(nombre);
    for(const k of ORDER){ if(AREAS[k].kw.some(w=>n.includes(w))) return k; }
    return 'general';
  }
  function of(subject){ return subject && AREAS[subject.area] ? subject.area : detect(subject&&subject.nombre); }
  /* Ajuste para el recomendador: el primer método del área pesa más */
  function boost(area, methodId){
    const a = AREAS[area]; if(!a) return 0;
    const i = a.metodos.indexOf(methodId);
    return i<0 ? 0 : i===0 ? 0.6 : i===1 ? 0.4 : 0.2;
  }
  /* ¿Toca pedir un puente? Una vez por materia cada 7 días, y solo tras haber practicado */
  function wantsBridge(st, sid, today){
    const list = (st.puentes||[]).filter(p=>p.sid===sid);
    const asked = (st.puenteAsk||{})[sid];
    const last = [asked].concat(list.map(p=>p.d)).filter(Boolean).sort().pop();
    if(!last) return true;
    return (new Date(today) - new Date(last))/864e5 >= 7;
  }

  const AREA = {AREAS, ORDER, detect, of, boost, wantsBridge};
  root.AREA = AREA;
  if(typeof module!=='undefined' && module.exports) module.exports = AREA;

  /* ───────── Interfaz (solo navegador) ───────── */
  if(typeof document==='undefined') return;
  function state(){ return (typeof S!=='undefined') ? S : root.S; }
  function h(s){ return typeof root.esc==='function' ? root.esc(s) : String(s); }
  function say(l,r,o){ return typeof root.TUTOR!=='undefined' ? root.TUTOR.say(l,r,o) : ''; }
  function sub(sid){ return state().subjects.find(x=>x.id===sid); }
  function today(){ return typeof root.todayStr==='function' ? root.todayStr() : new Date().toISOString().slice(0,10); }

  /* Fila compacta dentro de la tarjeta de la materia */
  root.areaRowHTML = function(s){
    const k = of(s), a = AREAS[k], n = (state().puentes||[]).filter(p=>p.sid===s.id).length;
    return `<button class="area-row" onclick="openArea('${s.id}')"><span class="area-ico">${k==='matematicas'?'∑':k==='quimica'?'⚗':k==='ciencias'?'❦':k==='lengua'?'¶':k==='sociales'?'⌘':'✦'}</span><span style="flex:1;min-width:0;"><b>Cómo estudiar ${h(s.nombre)}</b><small>${h(a.tip.split('. ')[0])}.</small></span>${n?`<em>${n} puente${n===1?'':'s'}</em>`:''}</button>`;
  };

  root.openArea = function(sid){
    const s = sub(sid); if(!s) return;
    const k = of(s), a = AREAS[k], ST = root.STRAT;
    const ms = a.metodos.map(id=>ST&&ST.BY_ID[id]).filter(Boolean);
    const ps = (state().puentes||[]).filter(p=>p.sid===sid).slice(-5).reverse();
    root.openSheet(`${say([a.tip,{t:a.ev,small:true}])}
      <div class="eyebrow" style="margin-top:12px;">Lo que te propongo para ${h(s.nombre)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">${ms.map((m,i)=>`<div class="hub-tool"><div style="display:flex;justify-content:space-between;gap:8px;"><b>${h(m.nombre)}</b><span class="eyebrow" style="color:${m.ev.nivel==='alta'?'var(--sage)':m.ev.nivel==='media'?'var(--brass)':'var(--muted)'}">evidencia ${m.ev.nivel}</span></div><div class="muted" style="font-size:12.5px;line-height:1.45;margin-top:3px;">${h(m.que)}</div>${i===0?`<button class="tu-r p" style="margin-top:8px;" onclick="closeSheet();openFocus({subjectId:'${sid}',act:'${a.actividad}'})">Probarlo ahora</button>`:''}</div>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px;">Para qué me sirve</div>
      ${ps.length?ps.map(p=>`<div class="tu-b" style="margin-top:6px;">«${h(p.text)}»</div>`).join(''):'<div class="muted" style="font-size:12.5px;margin-top:4px;">Aún no lo has conectado con tu vida.</div>'}
      <button class="tu-r" style="margin-top:10px;" onclick="openBridge('${sid}')">Conectarlo con algo mío</button>
      <div class="eyebrow" style="margin-top:16px;">¿No es esta área?</div>
      <select style="margin-top:6px;" onchange="setArea('${sid}',this.value)">${ORDER.map(x=>`<option value="${x}"${x===k?' selected':''}>${h(AREAS[x].nombre)} · ${h(AREAS[x].ej)}</option>`).join('')}</select>`);
  };
  root.setArea = function(sid,k){ const s=sub(sid); if(!s||!AREAS[k]) return; s.area=k; if(typeof root.saveState==='function') root.saveState(); root.openArea(sid); if(typeof root.renderMaterials==='function') root.renderMaterials(); };

  /* El puente: el estudiante escribe dónde usará lo que estudia; si quiere, después le damos ideas */
  root.bridgeHTML = function(sid, opts){
    const s = sub(sid); if(!s) return '';
    const a = AREAS[of(s)];
    return `<div class="bridge" id="bridge-${sid}">${say(['Antes de que te vayas, una pregunta.', a.puente.q.replace('esto','esto de '+s.nombre),{t:'Piensa en algo tuyo: '+a.puente.pista+'. Una línea basta. Conectarlo con tu vida te ayuda a recordarlo y a que te importe.',small:true}],[],opts)}
      <input type="text" id="bridge-in-${sid}" maxlength="160" placeholder="Me sirve para…" style="margin-top:8px;">
      <div class="tu-replies" style="margin-top:8px;"><button class="tu-r" onclick="bridgeSkip('${sid}')">Ahora no</button><button class="tu-r" onclick="bridgeIdeas('${sid}')">Dame ideas</button><button class="tu-r p" onclick="bridgeSave('${sid}')">Guardar</button></div>
      <div id="bridge-ideas-${sid}"></div></div>`;
  };
  root.openBridge = function(sid){ root.openSheet(root.bridgeHTML(sid)); };
  root.bridgeIdeas = function(sid){
    const s=sub(sid), a=AREAS[of(s)], el=document.getElementById('bridge-ideas-'+sid); if(!el) return;
    el.innerHTML = say(['Algunas ideas, por si te ayudan. Lo mejor es que lo digas con tus palabras:'].concat(a.puente.ideas.map(t=>({t,small:true}))));
  };
  root.bridgeSave = function(sid){
    const inp=document.getElementById('bridge-in-'+sid), t=(inp&&inp.value||'').trim();
    if(t.length<3){ if(typeof root.showToast==='function') root.showToast('Escribe aunque sea una línea'); return; }
    const st=state(); st.puentes=st.puentes||[]; st.puentes.push({sid, text:t.slice(0,160), d:today()});
    if(typeof root.saveState==='function') root.saveState();
    if(typeof root.track==='function') root.track('bridge_saved',{area:of(sub(sid))});
    const box=document.getElementById('bridge-'+sid);
    if(box) box.innerHTML = say(['Guardado. Te lo voy a recordar cuando repases '+sub(sid).nombre+'.'],[],{});
    if(document.getElementById('sheet') && !document.querySelector('#view-summary.active')) setTimeout(()=>{ if(typeof root.closeSheet==='function') root.closeSheet(); if(typeof root.renderAll==='function') root.renderAll(); },1200);
  };
  root.bridgeSkip = function(sid){
    const st=state(); st.puenteAsk=st.puenteAsk||{}; st.puenteAsk[sid]=today();
    if(typeof root.saveState==='function') root.saveState();
    const box=document.getElementById('bridge-'+sid); if(box) box.remove();
    if(document.getElementById('sheet')&&typeof root.closeSheet==='function'&&!document.querySelector('#view-summary.active')) root.closeSheet();
  };
})(typeof window!=='undefined' ? window : globalThis);
