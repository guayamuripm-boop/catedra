/* Catedra · Repaso espaciado con FSRS (ts-fsrs vendorizado en js/vendor) y "preparación" para el examen. */
const SRS = (function () {
  const hasLib = typeof FSRS !== 'undefined';
  const sched = hasLib ? FSRS.fsrs(FSRS.generatorParameters({ enable_short_term: false, request_retention: 0.9, enable_fuzz: true })) : null;

  function toCard(f) {
    if (!f) return null;
    return Object.assign({}, f, { due: new Date(f.due), last_review: f.last_review ? new Date(f.last_review) : undefined });
  }
  function fromCard(c) {
    return {
      due: c.due.toISOString(), stability: c.stability, difficulty: c.difficulty, elapsed_days: c.elapsed_days,
      scheduled_days: c.scheduled_days, reps: c.reps, lapses: c.lapses, learning_steps: c.learning_steps || 0,
      state: c.state, last_review: c.last_review ? c.last_review.toISOString() : undefined
    };
  }

  // score: 0 = no lo sabía, 50 = con dudas, 100 = lo dominé. Devuelve false si FSRS no está disponible.
  function review(item, score, when) {
    if (!hasLib) return false;
    const now = when || new Date();
    const card = toCard(item.fsrs) || FSRS.createEmptyCard(now);
    const rating = score >= 100 ? FSRS.Rating.Good : score >= 50 ? FSRS.Rating.Hard : FSRS.Rating.Again;
    const next = sched.repeat(card, now)[rating].card;
    item.fsrs = fromCard(next);
    item.nextReviewDate = localISO(next.due);
    return true;
  }

  // Probabilidad (0-1) de recordar la pregunta en `date`. Sin repasos previos: 0.
  function retrievability(item, date) {
    if (!hasLib || !item.fsrs || !item.fsrs.reps) return 0;
    const r = sched.get_retrievability(toCard(item.fsrs), date, false);
    return isFinite(r) ? Math.max(0, Math.min(1, r)) : 0;
  }

  // Preparación de una materia en `date`: promedio de la probabilidad de recordar sobre TODAS sus preguntas
  // (las que nunca se repasaron cuentan 0). Supone que no se repasa nada más hasta esa fecha.
  function readiness(subject, date) {
    const items = subject.items || [];
    if (!items.length) return { pct: 0, n: 0, reviewed: 0 };
    let sum = 0, reviewed = 0;
    for (const it of items) {
      const r = retrievability(it, date);
      if (it.fsrs && it.fsrs.reps) reviewed++;
      sum += r;
    }
    return { pct: Math.round((sum / items.length) * 100), n: items.length, reviewed };
  }

  return { review, retrievability, readiness, available: hasLib };
})();
if (typeof module !== 'undefined') module.exports = SRS;
