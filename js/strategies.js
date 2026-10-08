'use strict';
/* Catedra · Biblioteca de métodos de estudio: cada uno con evidencia, fuente, pasos y dónde aprender más.
   El copiloto recomienda y explica por qué; el estudiante decide. Cuanto más usa un método, más pesa lo que le funcionó a él.
   Niveles de evidencia (nuestra lectura, sujeta a revisión humana):
   alta  = varias revisiones sistemáticas o experimentos replicados (Dunlosky et al., 2013)
   media = evidencia moderada o indirecta
   baja  = evidencia directa limitada o resultados mixtos: se ofrece, pero se dice
   Las fuentes marcadas "[C]" están citadas de memoria y deben comprobarse antes de afirmarse en público. */
(function(root){
const EVW = {alta:1, media:0.7, baja:0.35};
const ACT = ['leer','video','ejercicios','apuntes','repasar'];
const REC = 'https://www.retrievalpractice.org/';
const LS = 'https://www.learningscientists.org/';
const APS = 'https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html';

const CATALOG = [
  { id:'autoprueba', nombre:'Respóndelo sin mirar', para:['leer','video','apuntes','repasar'], min:[15,35],
    que:'Después de leer o ver, cierra todo y escribe o di lo que recuerdas. Luego compara y repite lo que falló.',
    pasos:['Lee o ve un tramo corto.','Cierra el material y escribe lo que recuerdas.','Abre y compara; marca lo que faltó.','Vuelve a intentar solo lo que falló.'],
    ev:{nivel:'alta', fuente:'Roediger y Karpicke (2006); Dunlosky et al. (2013): utilidad alta', url:REC},
    buscar:['práctica de recuperación cómo estudiar','active recall study technique'] },
  { id:'espaciado', nombre:'Repartir en varios días', para:['leer','video','ejercicios','apuntes','repasar'], min:[15,25],
    que:'Estudiar poco varios días rinde más que mucho un solo día. Vuelve al tema a los 1, 3 y 7 días.',
    pasos:['Haz una sesión corta hoy.','Agenda volver mañana o en 3 días.','Cada vuelta, empieza respondiendo sin mirar.'],
    ev:{nivel:'alta', fuente:'Cepeda et al. (2006); Dunlosky et al. (2013): utilidad alta', url:LS},
    buscar:['práctica distribuida espaciada cómo estudiar'] },
  { id:'por_que', nombre:'Pregúntate por qué', para:['leer','video','apuntes'], min:[20,40],
    que:'Tras cada idea, pregúntate «¿por qué es así?» y respóndelo con tus palabras antes de seguir.',
    pasos:['Lee un párrafo.','Pregúntate «¿por qué?» o «¿cómo?».','Responde sin mirar; si no puedes, relee solo ese trozo.'],
    ev:{nivel:'media', fuente:'Dunlosky et al. (2013): interrogación elaborativa, utilidad moderada', url:APS},
    buscar:['elaborative interrogation técnica de estudio'] },
  { id:'explicalo', nombre:'Explícalo con tus palabras', para:['leer','ejercicios','apuntes','repasar'], min:[15,30],
    que:'Explica el tema en voz alta como si se lo contaras a alguien que no sabe nada. Donde te trabes, ahí está el hueco.',
    pasos:['Elige un concepto.','Explícalo en voz alta, sin mirar.','Anota dónde te trabaste y revísalo.','Vuelve a explicarlo más simple.'],
    ev:{nivel:'media', fuente:'Dunlosky et al. (2013): autoexplicación, utilidad moderada. El nombre «Feynman» es popular; no hay estudios con ese nombre', url:APS},
    buscar:['técnica Feynman cómo estudiar','self explanation estudiar'] },
  { id:'intercalar', nombre:'Mezcla tipos de ejercicios', para:['ejercicios'], foco:'ejercicios', min:[25,50],
    que:'En vez de diez ejercicios iguales seguidos, alterna tipos. Cuesta más y se aprende a elegir el método correcto.',
    pasos:['Prepara 3 tipos de problema.','Resuelve uno de cada tipo en orden mezclado.','Revisa los errores y qué pista decía el tipo.'],
    ev:{nivel:'media', fuente:'Rohrer y Taylor (2007); Dunlosky et al. (2013): utilidad moderada', url:LS},
    buscar:['interleaving práctica intercalada matemáticas'] },
  { id:'ejemplo_resuelto', nombre:'Primero un ejemplo resuelto', para:['ejercicios','video'], min:[20,40],
    que:'Si el tema es nuevo, estudia un ejemplo ya resuelto paso a paso antes de intentar solo, y luego quita pasos poco a poco.',
    pasos:['Estudia un ejemplo resuelto y di el porqué de cada paso.','Resuelve uno parecido tapando la solución.','Aumenta la dificultad cuando salga sin mirar.'],
    ev:{nivel:'media', fuente:'Sweller, teoría de la carga cognitiva, efecto del ejemplo resuelto (por verificar); ayuda más a quien empieza el tema', url:''},
    buscar:['worked example effect cómo estudiar problemas'] },
  { id:'video_activo', nombre:'Video con pausas para recordar', para:['video'], foco:'video', min:[20,40],
    que:'Pausa el video cada pocos minutos y di o escribe lo que acabas de ver. Ver sin parar da sensación de saber sin aprender.',
    pasos:['Ve unos 5 minutos.','Pausa y escribe lo que recuerdas.','Sigue; al final responde 3 preguntas sin mirar.'],
    ev:{nivel:'media', fuente:'Szpunar et al. (2013), preguntas intercaladas en clases en video (por verificar); base: Roediger y Karpicke (2006)', url:REC},
    buscar:['preguntas durante video clases aprender más'] },
  { id:'sq3r', nombre:'Mira, pregunta, lee, recita, repasa (SQ3R)', para:['leer'], min:[30,50],
    que:'Un método para capítulos: ojea los títulos, convierte cada uno en pregunta, lee para responderla y recita sin mirar.',
    pasos:['Ojea títulos y resúmenes.','Convierte cada título en una pregunta.','Lee buscando la respuesta.','Recita sin mirar.','Repasa al final.'],
    ev:{nivel:'baja', fuente:'Robinson (1946). Evidencia directa limitada; funciona en parte porque incluye recuperación', url:''},
    buscar:['método SQ3R cómo leer un capítulo'] },
  { id:'cornell', nombre:'Apuntes en columnas (Cornell)', para:['apuntes'], foco:'apuntes', min:[20,40],
    que:'Divide la hoja: notas a la derecha, preguntas clave a la izquierda y un resumen abajo. Luego usa las preguntas para autoevaluarte.',
    pasos:['Toma notas en la columna ancha.','Escribe preguntas clave al margen.','Tapa las notas y responde las preguntas.','Resume en dos líneas al final.'],
    ev:{nivel:'baja', fuente:'Pauk, Universidad de Cornell. Poca evidencia directa; lo útil es la autoevaluación con las preguntas', url:''},
    buscar:['método Cornell apuntes cómo hacerlo'] },
  { id:'mapa', nombre:'Dibuja el tema', para:['apuntes','leer','repasar'], min:[15,30],
    que:'Dibuja un mapa o esquema de cómo se conectan las ideas, de memoria, y luego completa lo que olvidaste.',
    pasos:['Dibuja las ideas principales de memoria.','Une con flechas y escribe cómo se relacionan.','Compara con el material y corrige.'],
    ev:{nivel:'media', fuente:'Nesbit y Adesope (2006), metaanálisis de mapas conceptuales (por verificar); rinde más si lo haces tú de memoria', url:''},
    buscar:['mapas conceptuales de memoria técnica de estudio'] },
  { id:'pomodoro', nombre:'Bloques con pausas (Pomodoro)', para:['leer','video','ejercicios','apuntes'], min:[20,30],
    que:'Trabaja un bloque fijo y descansa. Da estructura para empezar; no mejora por sí mismo el aprendizaje.',
    pasos:['Elige una sola tarea.','Trabaja el bloque sin cambiar de app.','Descansa 5 minutos lejos de la pantalla.'],
    ev:{nivel:'baja', fuente:'Smits, Wenzel y de Bruin (2025): sin ventaja frente a pausas elegidas por el estudiante en 94 universitarios', url:''},
    buscar:['pomodoro estudiar evidencia'] },
  { id:'releer', nombre:'Releer y subrayar', para:['leer'], min:[15,30], aviso:true,
    que:'Es lo que más se hace y lo que menos rinde: da familiaridad, no recuerdo. Mejor úsalo solo para ubicarte y pasa a responder sin mirar.',
    pasos:['Úsalo como máximo una vez, para ubicarte.','Pasa a «Respóndelo sin mirar».'],
    ev:{nivel:'baja', fuente:'Dunlosky et al. (2013): releer y subrayar, utilidad baja', url:APS},
    buscar:['por qué releer no funciona'] }
];
const BY_ID = {}; CATALOG.forEach(m=>BY_ID[m.id]=m);

/* Cuánto le sirvió a ESTA persona: promedio de calificaciones (1 a 3) con al menos 3 usos */
function personal(log, id){
  const r = (log||[]).filter(x=>x.method===id && x.rating>0);
  if(r.length<3) return null;
  return {avg:r.reduce((a,x)=>a+x.rating,0)/r.length, n:r.length};
}

/* ctx: {actividad, diasExamen, minutos, log} → métodos ordenados con el porqué. No decide: ordena. */
function recommend(ctx){
  ctx = ctx||{};
  const act = ACT.includes(ctx.actividad) ? ctx.actividad : 'leer';
  const out = [];
  CATALOG.forEach(m=>{
    if(!m.para.includes(act)) return;
    let score = EVW[m.ev.nivel];
    const why = [];
    if(m.ev.nivel==='alta') why.push('evidencia alta');
    if(m.foco===act){ score += 0.35; why.push('pensado para esto'); }
    if(ctx.diasExamen!=null && ctx.diasExamen>=0 && ctx.diasExamen<=7 && (m.id==='autoprueba' || m.id==='explicalo')){ score += 0.25; why.push('tu examen está cerca'); }
    if(ctx.diasExamen!=null && ctx.diasExamen>14 && m.id==='espaciado'){ score += 0.2; why.push('tienes tiempo de repartirlo'); }
    if(ctx.minutos && ctx.minutos<20 && m.min[0]>25) score -= 0.15;
    const p = personal(ctx.log, m.id);
    if(p){ if(p.avg>=2.5){ score += 0.4; why.push("a ti te ha funcionado"); } else if(p.avg<=1.5){ score -= 0.4; why.push("a ti no te ha rendido"); } }
    if(m.aviso) score -= 0.5;
    out.push({m, score, why, personal:p});
  });
  return out.sort((a,b)=>b.score-a.score);
}

function searchUrl(q, motor){
  const e = encodeURIComponent(q);
  return motor==='google' ? 'https://www.google.com/search?q='+e : 'https://www.youtube.com/results?search_query='+e;
}

/* Qué conviene preguntar o averiguar antes de estudiar para una evaluación (el estudiante decide a quién) */
function asksFor(tipoEvaluacion){
  const base = ['¿Qué temas entran exactamente?','¿Qué formato tiene (abierta, opción múltiple, problemas)?','¿Cuánto vale y cuánto tiempo hay?','¿Se permite material o calculadora?'];
  if(/simulacro|admisi/i.test(tipoEvaluacion||'')) base.push('¿Penalizan las respuestas incorrectas?');
  if(/final|parcial|examen/i.test(tipoEvaluacion||'')) base.push('¿Hay exámenes de años anteriores o guía de estudio?');
  return base;
}
const FUENTES = [
  {n:'The Learning Scientists', url:LS, d:'Guías cortas de estrategias con su investigación'},
  {n:'Retrieval Practice', url:REC, d:'Cómo practicar recuperando, con materiales'},
  {n:'Resumen de Dunlosky et al. (2013)', url:APS, d:'Qué técnicas rinden y cuáles no'}
];

const STRAT = {CATALOG, BY_ID, ACT, EVW, recommend, personal, searchUrl, asksFor, FUENTES};
root.STRAT = STRAT;
if(typeof module!=='undefined' && module.exports) module.exports = STRAT;
})(typeof window!=='undefined' ? window : globalThis);
