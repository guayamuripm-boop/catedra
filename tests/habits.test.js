'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const HAB = require('../js/habits.js');

const T = '2026-10-20';
const d = n => HAB.addDays(T, n);
function mk(extra) {
  return Object.assign({ profile: { picoProductividad: 'noche' }, subjects: [], diag: { dom: {} }, evlog: [], simLog: [], habit: { active: null, history: [] } }, extra || {});
}
let idc = 0;
function ev(day, s, o) { return Object.assign({ d: d(day), h: 20, id: 'i' + (idc++), s, c: 0, t: 'recuperacion' }, o || {}); }

test('motor de hábitos', async t => {
  await t.test('sin datos ni respuestas pide preguntas', () => {
    assert.deepEqual(HAB.status(mk(), T), { phase: 'need' });
  });

  await t.test('respuesta declarada de retención baja propone autoprueba', () => {
    const st = mk({ diag: { dom: { PRO: { est: 20, n: 1, w: 1 } } } });
    const s = HAB.status(st, T);
    assert.equal(s.phase, 'propose');
    assert.equal(s.hy.habit.id, 'autoprueba');
  });

  await t.test('lo observado supera a lo declarado: sobreconfianza -> predice', () => {
    const evlog = [];
    for (let i = 0; i < 8; i++) evlog.push(ev(-i, 0, { c: 3 }));
    const st = mk({ evlog, diag: { dom: { PRO: { est: 20, n: 1 } } } });
    const hy = HAB.hypothesize(st, T);
    assert.equal(hy.habit.id, 'predice', 'brecha confianza-acierto ~85 % pesa más que la respuesta declarada');
  });

  await t.test('pocos días de práctica -> repartir', () => {
    const evlog = [];
    for (let i = 0; i < 8; i++) evlog.push(ev(-1, 100)); // todo en un mismo día
    const hy = HAB.hypothesize(mk({ evlog }), T);
    assert.equal(hy.habit.id, 'repartir');
  });

  await t.test('simulacro solo con examen cercano y sin simulacro reciente', () => {
    const st = mk({ evlog: [ev(-1, 100), ev(-2, 100), ev(-3, 100), ev(-4, 100), ev(-5, 100), ev(-6, 100), ev(-7, 100), ev(-8, 100)], subjects: [{ nombre: 'Física', examDate: d(5) }], diag: { dom: { PRO: { est: 90, n: 1 } } } });
    assert.equal(HAB.hypothesize(st, T).habit.id, 'simulacro');
    st.simLog = [{ date: d(-2), avg: 60 }];
    assert.notEqual((HAB.hypothesize(st, T) || {}).habit && HAB.hypothesize(st, T).habit.id, 'simulacro');
  });

  await t.test('prueba: línea base, mejora y migración si no mejora', () => {
    const evlog = [];
    for (let i = 2; i <= 12; i++) evlog.push(ev(-i, 100, { c: 3 })); // base: 7 días/14 -> ~... días distintos
    const st = mk({ evlog, diag: { dom: { TIE: { est: 20, n: 1 } } } });
    const hy = HAB.hypothesize(st, T);
    HAB.start(st, 'repartir', hy.why, T);
    assert.ok(st.habit.active.base, 'hay línea base medible');
    // durante la prueba practica 6 de 8 días
    const later = HAB.addDays(T, 7);
    for (let i = 0; i < 7; i += 1) st.evlog.push({ d: d(i), h: 20, id: 'x' + i, s: 100, c: 0, t: 'recuperacion' });
    assert.equal(HAB.status(st, d(3)).phase, 'running');
    const sv = HAB.status(st, later);
    assert.equal(sv.phase, 'verdict');
    const rec = HAB.finish(st, later);
    assert.ok(['mejoro', 'igual'].includes(rec.verdict));
    assert.equal(st.habit.active, null);
    // el hábito probado no se vuelve a proponer de inmediato
    const next = HAB.hypothesize(st, later);
    assert.ok(!next || !next.habit || next.habit.id !== 'repartir');
  });

  await t.test('sin datos suficientes: extiende una vez y luego cierra sin culpar al hábito', () => {
    const st = mk({ diag: { dom: { PRO: { est: 10, n: 1 } } } });
    HAB.start(st, 'autoprueba', 'x', T);
    const end = HAB.addDays(T, 10);
    assert.deepEqual(HAB.finish(st, end), { extended: true });
    assert.equal(st.habit.active.dias, 15);
    const end2 = HAB.addDays(T, 15);
    const rec = HAB.finish(st, end2);
    assert.equal(rec.verdict, 'sin_datos');
  });

  await t.test('hábitos de autoreporte se cierran con la respuesta del estudiante', () => {
    const st = mk({ diag: { dom: { CON: { est: 10, n: 1 } } } });
    assert.equal(HAB.hypothesize(st, T), null, 'evidencia baja + solo declarado no alcanza para proponerlo');
    HAB.start(st, 'celular', 'x', T);
    const end = HAB.addDays(T, 7);
    assert.equal(HAB.status(st, end).res.kind, 'self');
    assert.equal(HAB.finish(st, end, 'si').verdict, 'mejoro');
  });

  await t.test('"Otra idea" omite la propuesta actual', () => {
    const st = mk({ diag: { dom: { PRO: { est: 20, n: 1 }, TIE: { est: 20, n: 1 } } } });
    const first = HAB.hypothesize(st, T).habit.id;
    HAB.skip(st, T);
    assert.notEqual(HAB.hypothesize(st, T).habit.id, first);
  });

  await t.test('registro de eventos con tope', () => {
    const st = mk();
    for (let i = 0; i < 850; i++) HAB.log(st, { id: 'a', s: 100 });
    assert.equal(st.evlog.length, 800);
  });

  await t.test('todo hábito del catálogo declara evidencia, fuente, acción y medición', () => {
    HAB.CATALOG.forEach(H => {
      assert.ok(['alta', 'media', 'baja'].includes(H.ev.nivel), H.id);
      assert.ok(H.ev.fuente && H.accion && H.nombre, H.id);
      assert.ok(H.self || (H.metric && HAB.METRIC[H.metric.k]), H.id + ' necesita métrica o autoreporte');
    });
  });
});

test('botones: ningún onclick concatena con comillas escapadas dentro de una plantilla', () => {
  // Bug real (habits.js): onclick="f(\''+x+'\')" dentro de `...` imprime el texto literal y el botón no hace nada.
  const fs = require('node:fs'), path = require('node:path');
  const files = ['app.html'].concat(fs.readdirSync(path.join(__dirname, '../js')).filter(f => f.endsWith('.js') && f !== 'ts-fsrs.umd.js').map(f => 'js/' + f));
  files.forEach(f => {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!/onclick="[^"]*\''\s*\+/.test(src), f + ' tiene un onclick con concatenación escapada');
  });
});
