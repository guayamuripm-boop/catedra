# Metodologia de desarrollo - Catedra

## Framework: Shape Up adaptado para equipo pequeno

Shape Up (Basecamp) adaptado a un equipo de 2-4 personas con dedicacion parcial. La razon: ciclos cortos con entregables concretos, sin la ceremonia de Scrum ni la ambiguedad de Kanban puro.

---

## Estructura de ciclos

### Ciclo de 2 semanas (Build cycle)

Cada ciclo tiene un "apetito" fijo: lo que se puede construir en 2 semanas con los recursos disponibles. Si algo no cabe, se recorta el alcance, no se extiende el tiempo.

```
Semana 1: Construir el camino critico
  - Dia 1-2: Spike vertical (flujo completo simplificado)
  - Dia 3-5: Iterar sobre el spike, resolver incognitas

Semana 2: Pulir y cerrar
  - Dia 6-8: Completar casos borde, tests criticos
  - Dia 9: QA interno, prueba offline, prueba movil
  - Dia 10: Deploy a staging, demo interna, retrospectiva
```

### Cooldown (2-3 dias entre ciclos)

- Corregir bugs encontrados.
- Deuda tecnica urgente.
- Explorar ideas para el siguiente ciclo.
- Actualizar documentacion.

---

## Proceso por fase

### Fase 0: Descubrimiento (2 semanas)

**Objetivo:** Validar que el problema existe y que la solucion propuesta resuena.

| Dia | Actividad | Entregable |
|---|---|---|
| 1-3 | Definir cohorte, preparar guion de entrevista | Guion + lista de 20 candidatos |
| 3-7 | 12-15 entrevistas con estudiantes reales | Notas + patrones identificados |
| 7-10 | Prueba concierge: plan + preguntas manuales para 8-12 estudiantes | Material entregado + seguimiento |
| 10-14 | Medir uso real, decidir si continuar | Informe de validacion |

**Criterio de avance:**
- 8/12 completan primera sesion.
- Proporcion relevante vuelve sin insistir.
- Se identifica un problema repetido y especifico.
- Al menos algunos describen ahorro de tiempo o descubrimiento de lo que no sabian.

### Fase 1: MVP nucleo (6 semanas = 3 ciclos)

**Ciclo 1.1: Esqueleto (semanas 3-4)**
- Auth basico (email + Google).
- Crear materia + fecha de examen.
- Pegar texto.
- Generar preguntas con un proveedor LLM.
- Aprobar/descartar preguntas.
- PWA basica con manifest.

**Ciclo 1.2: Motor de estudio (semanas 5-6)**
- FSRS con ts-fsrs.
- Sesion de repaso con calificacion.
- Plan "Hoy" con prioridad.
- IndexedDB con Dexie para offline.
- Service Worker para app shell.

**Ciclo 1.3: Habitos y cierre (semanas 7-8)**
- Deteccion de habitos basica (3 reglas).
- 5 micro-lecciones iniciales.
- Progreso por materia.
- Feedback post-sesion.
- Pantalla de precios (fake door).
- Deploy a produccion.
- 20 usuarios piloto.

### Fase 2: Retencion (6 semanas = 3 ciclos)

- Calibracion metacognitiva.
- Subir PDF con pdf.js.
- Cascada multi-proveedor LLM.
- Re-planificacion al saltarse dias.
- 5 micro-lecciones mas.
- Cobro manual Pro.
- Referidos basicos.

### Fase 3: Escala (meses 4-6)

- Tutor socratico con RAG.
- OCR de fotos.
- Notificaciones web push.
- Panel de metricas interno.
- Exportacion CSV.
- Primeros pilotos institucionales.

---

## Definicion de hecho (DoD)

Una funcionalidad esta "hecha" cuando:

1. Funciona en el flujo principal sin errores.
2. Funciona offline (si aplica).
3. Funciona en movil (Chrome Android, Safari iOS).
4. Tiene al menos 1 test para la logica critica.
5. No rompe funcionalidades existentes.
6. El codigo pasa TypeScript estricto y linting.
7. Esta desplegada en staging.

---

## Herramientas de trabajo

| Necesidad | Herramienta | Razon |
|---|---|---|
| Codigo | GitHub | CI/CD con Actions, PRs, issues |
| Tareas | GitHub Issues + Projects | Sin herramienta extra |
| Comunicacion | WhatsApp/Telegram grupo del equipo | Lo que ya usan |
| Decisiones | Documento en el repo (`docs/decisions/`) | Trazabilidad |
| Diseno | Figma (free) o prototipo HTML | Iterar rapido |
| Metricas | Hoja de calculo compartida (inicio) | Cero costo |

---

## Reglas de equipo

1. **Un ciclo, un objetivo.** No se mezclan features de ciclos distintos.
2. **Spike primero.** Antes de construir, hacer un spike vertical que toque todas las capas.
3. **Movil primero.** Todo se prueba primero en telefono.
4. **Offline primero.** Si no funciona sin internet, no esta listo.
5. **Deploy continuo.** Cada PR mergeado va a staging.
6. **Demo cada 2 semanas.** Mostrar a usuarios reales, no solo al equipo.
7. **Deuda tecnica en cooldown.** No en medio del ciclo.
8. **Si algo no cabe, se corta.** No se extiende el ciclo.

---

## Metricas de producto por fase

### Fase 0
- Entrevistas completadas.
- Usuarios concierge que completan sesion.
- Usuarios que regresan sin insistir.

### Fase 1
- Activacion: % que completa primera sesion en 24h.
- Items aprobados sin edicion: > 70%.
- Carga inicial: < 3s.
- Bundle: < 250KB.

### Fase 2
- Retencion D7: > 30%.
- Sesiones/semana por usuario activo.
- Reduccion de cramming medida.
- Primeros pagos Pro.

### Fase 3
- Retencion D30: > 15%.
- Costo IA por usuario activo.
- Primer contrato institucional.

---

## Registro de decisiones (ADR)

Cada decision importante se documenta en `docs/decisions/` con este formato:

```
# ADR-001: Titulo

**Estado:** Aceptada | Propuesta | Reemplazada
**Fecha:** YYYY-MM-DD
**Contexto:** Por que surgio esta decision.
**Decision:** Que decidimos.
**Consecuencias:** Que implica, que ganamos, que perdemos.
```
