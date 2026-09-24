# ADR-002: Metodologia de desarrollo

**Estado:** Aceptada
**Fecha:** 2026-09-20

## Contexto

Equipo pequeno (2-4 personas, dedicacion parcial) necesita un framework de desarrollo que permita iterar rapido sin ceremonia excesiva.

## Decision

Shape Up adaptado con ciclos de 2 semanas + 2-3 dias de cooldown.

- Cada ciclo tiene un objetivo unico y un "apetito" fijo
- Si algo no cabe, se corta el alcance, no se extiende el tiempo
- Cooldown para bugs, deuda tecnica y exploracion
- Demo cada 2 semanas con usuarios reales
- Tareas en GitHub Issues + Projects
- Decisiones en ADRs en el repo

## Alternativas descartadas

- Scrum: demasiada ceremonia para equipo de 2-4
- Kanban puro: sin estructura temporal, riesgo de scope creep
- Sin framework: caos predecible con dedicacion parcial

## Consecuencias

- Requiere disciplina para cortar scope
- Requiere demos reales cada 2 semanas
- El cooldown no es opcional
