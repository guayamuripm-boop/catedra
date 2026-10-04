'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

global.FSRS = require('../js/vendor/ts-fsrs.umd.js');
global.localISO = d => {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const SRS = require('../js/srs.js');

const day = (iso, h = 12) => new Date(iso + 'T' + String(h).padStart(2, '0') + ':00:00');

test('repaso FSRS', async t => {
  await t.test('disponible y agenda en días (sin pasos de minutos)', () => {
    assert.equal(SRS.available, true);
    const it = {};
    SRS.review(it, 100, day('2026-10-05'));
    assert.ok(it.fsrs && it.fsrs.reps === 1);
    assert.ok(it.nextReviewDate > '2026-10-05', 'la siguiente revisión es en días posteriores');
  });

  await t.test('olvidar vuelve antes que dominar; con dudas queda en medio', () => {
    const a = {}, b = {}, c = {};
    const now = day('2026-10-05');
    SRS.review(a, 0, now); SRS.review(b, 50, now); SRS.review(c, 100, now);
    assert.ok(a.nextReviewDate <= b.nextReviewDate);
    assert.ok(b.nextReviewDate <= c.nextReviewDate);
    assert.ok(a.fsrs.lapses >= 0 && a.fsrs.stability < c.fsrs.stability);
  });

  await t.test('la estabilidad crece con repasos exitosos', () => {
    const it = {};
    SRS.review(it, 100, day('2026-10-05'));
    const s1 = it.fsrs.stability;
    SRS.review(it, 100, day('2026-10-08'));
    assert.ok(it.fsrs.stability > s1);
  });

  await t.test('sobrevive a guardar y restaurar como JSON (fechas como texto)', () => {
    const it = {};
    SRS.review(it, 100, day('2026-10-05'));
    const restored = JSON.parse(JSON.stringify(it));
    SRS.review(restored, 100, day('2026-10-09'));
    assert.equal(restored.fsrs.reps, 2);
  });

  await t.test('preparación: sin repasos es 0; baja con el tiempo; sube al repasar', () => {
    const subj = { items: [{}, {}, {}, {}] };
    assert.equal(SRS.readiness(subj, day('2026-10-20')).pct, 0);
    subj.items.forEach(it => SRS.review(it, 100, day('2026-10-05')));
    const soon = SRS.readiness(subj, day('2026-10-06')).pct;
    const late = SRS.readiness(subj, day('2026-11-20')).pct;
    assert.ok(soon > late, 'recordar mañana es más probable que dentro de un mes');
    assert.ok(soon > 0 && soon <= 100);
    subj.items.forEach(it => SRS.review(it, 100, day('2026-10-09')));
    const after = SRS.readiness(subj, day('2026-11-20')).pct;
    assert.ok(after > late, 'repasar a tiempo mejora la preparación futura');
  });

  await t.test('preguntas sin repasar bajan el promedio', () => {
    const full = { items: [{}, {}] };
    full.items.forEach(it => SRS.review(it, 100, day('2026-10-05')));
    const half = { items: [{}, {}] };
    SRS.review(half.items[0], 100, day('2026-10-05'));
    const d = day('2026-10-07');
    assert.ok(SRS.readiness(full, d).pct > SRS.readiness(half, d).pct);
    assert.equal(SRS.readiness(half, d).reviewed, 1);
  });
});
