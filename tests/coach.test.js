'use strict';
const test = require('node:test');
const assert = require('node:assert');
const COACH = require('../js/coach.js');
const HAB = require('../js/habits.js');
const SP = require('../js/space.js');

const TODAY = '2026-10-10';
function mkState() {
  const st = {
    profile: { nombre: 'Ana Pérez', nivel: 'universidad', horasSemana: 6, desafio: 'concentracion', picoProductividad: 'noche', capacidadEnfoque: 30, motivacion: 'aprobar' },
    subjects: [{ id: 's1', nombre: 'Física', examDate: '2026-10-14', items: [
      { pregunta: '¿Qué dice la segunda ley?', nextReviewDate: '2026-10-09', recallScores: [0, 50] },
      { pregunta: '¿Qué es la inercia?', nextReviewDate: '2026-10-20', recallScores: [100, 100] }] , units: [], evals: [] }],
    evlog: [], sessionLog: [], habit: { active: { id: 'autoprueba' }, history: [{ id: 'celular', verdict: 'no_mejoro', end: '2026-09-01' }] },
    diag: { dom: { PRO: { est: 40, n: 3 }, SUE: { est: 70, n: 0 } } }, puentes: [{ sid: 's1', text: 'calcular el frenado de mi moto' }], coach: null
  };
  SP.ensure(st);
  for (let i = 0; i < 8; i++) HAB.log(st, { id: 'it' + i, s: i % 2 ? 100 : 0, c: 2, t: 'recuperacion' });
  st.evlog.forEach(e => { e.d = '2026-10-08'; });
  return st;
}

test('el resumen no lleva el nombre y mapea las materias a ids opacos', () => {
  const st = mkState();
  const { digest, ids } = COACH.digest(st, TODAY, { HAB, SP, methodology: { duration: 35 } });
  const txt = JSON.stringify(digest);
  assert.ok(!txt.includes('Ana') && !txt.includes('Pérez'));
  assert.deepEqual(ids, { m1: 's1' });
  assert.equal(digest.materias[0].dias_examen, 4);
  assert.ok(Math.abs(digest.materias[0].dominio - 0.63) < 0.011);
  assert.deepEqual(digest.materias[0].temas_debiles, ['¿Qué dice la segunda ley?']);
  assert.equal(digest.bloque_max_min, 35);
  assert.equal(digest.minutos_max_semana, 360);
  assert.equal(digest.medido_14d.acc.n, 8);
  assert.deepEqual(digest.declarado_por_el_estudiante_pesa_menos, { PRO: 40 }, 'solo lo declarado con respuestas');
  assert.deepEqual(digest.dijo_que_le_interesa, ['calcular el frenado de mi moto']);
  assert.equal(digest.habito.en_prueba, 'autoprueba');
});

test('las búsquedas son reales y nunca inventadas', () => {
  assert.match(COACH.searchUrl('video', 'segunda ley de Newton'), /^https:\/\/www\.youtube\.com\/results\?search_query=segunda%20ley/);
  assert.match(COACH.searchUrl('lectura', 'x y'), /^https:\/\/www\.google\.com\/search\?q=/);
  assert.equal(COACH.searchUrl('tutor_ia', 'x'), '');
  assert.equal(COACH.searchUrl('persona', 'x'), '');
  assert.equal(COACH.searchUrl('video', '  '), '');
});

test('el plan se guarda con su línea base y se mide contra la práctica real', () => {
  const st = mkState();
  const { digest, ids } = COACH.digest(st, TODAY, { HAB, SP });
  const plan = { diagnostico: 'd', bloques: [{ materia: 'm1', dia: 0, minutos: 20, actividad: 'autoprueba', foco: '', por_que: '' }, { materia: 'm1', dia: 2, minutos: 20, actividad: 'explicar', foco: '', por_que: '' }],
    fuera: [], medir: [{ metrica: 'acc', meta: 0.7, en_dias: 5 }, { metrica: 'days', meta: 3, en_dias: 5 }], ajuste: '' };
  COACH.save(st, plan, ids, digest, TODAY);
  assert.equal(st.coach.base.acc, 0.5);
  assert.equal(COACH.blocksOn(st.coach, TODAY).length, 1);
  assert.equal(COACH.blocksOn(st.coach, '2026-10-12').length, 1);

  // Pasan 6 días: el estudiante practicó el día 0 (no el día 2) y subió su acierto
  const later = '2026-10-16';
  st.sessionLog.push({ date: TODAY, minutes: 20 });
  for (let i = 0; i < 6; i++) HAB.log(st, { id: 'n' + i, s: 100, c: 3, t: 'recuperacion' });
  st.evlog.slice(-6).forEach(e => { e.d = '2026-10-13'; });
  const pr = COACH.progress(st.coach, st, later, { HAB });
  assert.equal(pr.previstos, 2);
  assert.equal(pr.hechos, 1, 'solo el bloque del día 0 tuvo práctica ese día');
  const acc = pr.metricas.find(m => m.metrica === 'acc');
  assert.equal(acc.estado, 'logrado');
  assert.equal(pr.resumen.hace_dias, 6);
  // el siguiente resumen para la IA incluye cómo le fue al plan anterior
  const next = COACH.digest(st, later, { HAB, SP }).digest;
  assert.equal(next.plan_anterior.bloques_con_practica_ese_dia, 1);
  // guardar otro plan archiva el cumplimiento del anterior
  COACH.save(st, plan, ids, next, later);
  assert.deepEqual(st.coach.history[0], { fecha: TODAY, hechos: 1, previstos: 2 });
});

test('un plan sin datos suficientes no se declara fallido y caduca a la semana', () => {
  const st = mkState();
  st.evlog = [];
  const plan = { diagnostico: '', bloques: [{ materia: 'm1', dia: 0, minutos: 20, actividad: 'autoprueba', foco: '', por_que: '' }], fuera: [], medir: [{ metrica: 'delayed', meta: 0.7, en_dias: 5 }], ajuste: '' };
  COACH.save(st, plan, { m1: 's1' }, { medido_14d: {} }, TODAY);
  const pr = COACH.progress(st.coach, st, '2026-10-20', { HAB });
  assert.equal(pr.metricas[0].estado, 'sin_datos');
  assert.equal(COACH.stale(st.coach, '2026-10-16'), false);
  assert.equal(COACH.stale(st.coach, '2026-10-17'), true);
  assert.equal(COACH.stale(null, TODAY), true);
});

test('el formato y los temas del examen llegan al asesor; lo que falta se detecta', () => {
  const STRAT = require('../js/strategies.js');
  const st = mkState();
  const s = st.subjects[0];
  const u = SP.addUnit(st, s, 'Cinemática');
  const e = s.evals[0];            // la evaluación migrada de examDate
  e.peso = 30; e.unitIds = [u.id];
  assert.deepStrictEqual(SP.missingInfo(e), ['formato', 'material']);
  SP.setEvalInfo(e, 'formato', 'opcion');
  SP.setEvalInfo(e, 'material', 'no');
  SP.setEvalInfo(e, 'formato', 'inventado');            // valor fuera de catálogo: se ignora
  assert.deepStrictEqual(SP.missingInfo(e), []);
  const { digest } = COACH.digest(st, TODAY, { HAB, SP });
  const ev = digest.materias[0].evaluacion;
  assert.strictEqual(ev.formato, 'opcion');
  assert.strictEqual(ev.material_permitido, false);
  assert.deepStrictEqual(ev.temas, ['Cinemática']);
  const a = STRAT.recommend({ actividad: 'repasar', formato: 'opcion' });
  const b = STRAT.recommend({ actividad: 'repasar' });
  const sc = (list, id) => list.find(x => x.m.id === id).score;
  assert.ok(sc(a, 'autoprueba') > sc(b, 'autoprueba'));
});

test('los resultados de evaluaciones pasadas se envían sin datos personales', () => {
  const st = mkState();
  const s = st.subjects[0];
  const e = SP.addEval(st, s, { nombre: 'Parcial 1', fecha: '2026-09-20' });
  e.result = { d: '2026-09-21', feel: 'mal', prep: 'no', nota: '9/20' };
  const { digest } = COACH.digest(st, TODAY, { HAB, SP });
  assert.strictEqual(digest.resultados_previos[0].se_sintio, 'mal');
  assert.ok(!JSON.stringify(digest).includes('Ana'));
});
