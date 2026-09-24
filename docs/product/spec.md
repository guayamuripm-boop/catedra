# Especificacion de Catedra - MVP

> Version 0.2 · Septiembre 2026
> Segmento inicial: estudiantes de bachillerato y universitarios (LatAm hispanohablante)
> Restriccion: costo de infraestructura = $0 hasta validar traccion

---

## 1. Vision y problema

**Problema.** La mayoria de los estudiantes no sabe estudiar: no planifica, relee y subraya en vez de practicar recuperacion, deja todo para la vispera del examen y sufre la "ilusion de saber".

**Vision.** Una sola app que, con ciencia del aprendizaje validada, le diga al estudiante que hacer hoy, como hacerlo y por que, y que lo ensene a estudiar mientras estudia.

**Propuesta de valor.** "Sube tu material, dile cuando es tu examen, y la app te arma el plan, te examina con lo que sabes y te ensena a estudiar mejor cada semana."

**Diferenciacion**
- Integra plan + practica + habitos + ensenanza del metodo.
- Offline-first y bajo ancho de banda (realidad LatAm).
- Precio y experiencia pensados para LatAm, espanol nativo.
- Coaching de habitos basado en datos de uso, no en "estilos de aprendizaje".

---

## 2. Usuarios objetivo

| Persona | Contexto | Dolor principal | Necesita |
|---|---|---|---|
| Bachiller (15-17) | Muchas materias, examenes parciales, presion de admision | No sabe organizarse; estudia la noche anterior | Plan simple, sesiones cortas, tono cercano |
| Universitario (18-25) | Carga alta, material denso (PDFs, guias, apuntes) | Volumen de contenido, procrastinacion, retencion | Convertir material en practica, plan por fechas |
| Tecnico/adulto | Formacion tecnica o certificaciones | Poco tiempo, aprendizaje aplicado | Sesiones cortas, practica con casos |

**Cohorte inicial recomendada:** Bachilleres 16-18 y universitarios primer semestre en Venezuela, materias STEM y pruebas de admision.

---

## 3. Base cientifica

| Tecnica | Evidencia | Donde vive en la app |
|---|---|---|
| Practica de recuperacion | ALTA | Tarjetas y quizzes desde el material |
| Repeticion espaciada | ALTA | Motor FSRS, cola diaria |
| Practica distribuida | ALTA | Planificador reparte sesiones |
| Intercalado | MEDIA-ALTA | Sesiones mezclan temas |
| Autoexplicacion | MEDIA-ALTA | "Explica con tus palabras" |
| Ejemplos resueltos | ALTA | Novato: guiados; avanzado: abiertos |
| Calibracion metacognitiva | MEDIA-ALTA | Confianza vs. acierto real |
| Pretesting | MEDIA | Diagnostico antes de ensenar un tema |
| Retroalimentacion correctiva | ALTA | Tipos de error diferenciados |
| Desvanecimiento de ayudas | ALTA | Ejemplo -> parcial -> sin ayuda |

**NO se hace:** clasificar por "estilo de aprendizaje" (visual/auditivo/kinestesico).

---

## 4. Alcance del MVP

Un estudiante nuevo puede, sin pagar:
1. Registrarse en menos de 3 minutos.
2. Crear una materia con fecha de examen.
3. Pegar texto o subir un PDF.
4. Recibir preguntas ancladas al material y editarlas.
5. Repasar con repeticion espaciada, offline.
6. Ver un plan "Hoy" claro.
7. Recibir micro-lecciones segun su comportamiento.
8. Ver su progreso y calibracion.

### Fuera del MVP
Sync con Calendar/Classroom, .apkg, panel docente, apps nativas, FSRS por usuario, marketplace, LLM en dispositivo, OCR fotos, tutor RAG.

---

## 5. Requisitos funcionales (MVP = M)

### Cuenta y onboarding
- RF-01: Registro/login con email y Google (M)
- RF-02: Perfil: nivel, pais, materias (M)
- RF-03: Diagnostico inicial <=3 min (M)
- RF-04: Consentimiento y privacidad; menores (M)
- RF-05: Eliminar cuenta y datos (M)

### Materias y fechas
- RF-06: Crear/editar materias con temas (M)
- RF-07: Registrar examenes y fechas limite (M)

### Captura de material
- RF-10: Pegar texto y crear notas (M)
- RF-11: Subir PDF y extraer texto (M)
- RF-13: Dividir material en chunks por tema (M)
- RF-14: Material privado por usuario (M)

### Generacion de practica con IA
- RF-15: Generar preguntas: abiertas, cloze, opcion multiple, V/F (M)
- RF-16: Cada item incluye cita de origen (M)
- RF-17: Editar, borrar, reportar o aprobar items (M)
- RF-18: Generar en lote y cachear por fragmento (M)
- RF-19: Cuotas de generacion con contador visible (M)

### Motor de repaso
- RF-21: Programacion con FSRS; cola diaria (M)
- RF-22: Limite configurable de items nuevos/dia (M)
- RF-23: Autoevaluacion (Otra vez/Dificil/Bien/Facil) (M)
- RF-24: Sesiones intercaladas entre temas (M)
- RF-25: Pretesting: diagnostico de 3-5 preguntas antes de tema nuevo (M)
- RF-26: Offline completo, sincroniza al reconectar (M)

### Metodos de evaluacion avanzados
- RF-28: Respuesta escrita con evaluacion IA (P2)
- RF-29: Sintesis oral con auditoria IA (Feynman automatizado) (P2)
- RF-30: Opcion multiple con distractores tipados por error (M)
- RF-31: Examen simulado cronometrado sin ayudas (P2)
- RF-32: Scaffolding progresivo de 5 niveles (M)
- RF-33: Dificultad dinamica intra-sesion (M)
- RF-34: Deteccion de fatiga por patrones de respuesta (M)

### Planificador "Hoy"
- RF-27: Plan diario con 2-4 bloques (25-50 min) (M)

### Coach de habitos
- RF-35: Detectar malos habitos con reglas basicas (M)
- RF-36: Micro-lecciones de 1-2 min por contexto (M)
- RF-37: Cada consejo explica el por que (M)
- RF-38: Silenciar o posponer consejos (M)

### Progreso
- RF-39: Retencion estimada por tema y materia (M)
- RF-40: Racha suave (no punitiva) (M)

### Monetizacion
- RF-45: Tabla de planes Free/Pro y contadores (M)
- RF-46: Pantalla de precios y paywall (M)
- RF-47: Activacion Pro manual tras pago (M)

### Administracion
- RF-50: Registro de eventos de producto (M)
- RF-51: Boton de feedback (M)

---

## 6. Requisitos no funcionales

- RNF-01: Infraestructura $0 en MVP
- RNF-02: Carga < 3s en 4G lento; bundle < 250KB
- RNF-03: Offline-first con resolucion de conflictos
- RNF-05: RLS en todas las tablas; sin claves en cliente
- RNF-06: Minimizacion de datos; material privado
- RNF-07: Consentimiento para menores
- RNF-08: WCAG 2.1 AA; modo oscuro
- RNF-09: Espanol latinoamericano; estructura para ingles
- RNF-10: Anclaje a fuente obligatorio
- RNF-14: TypeScript estricto, tests, CI

---

## 7. Modelo de datos

```
profiles(id, nivel, pais, idioma, horas_semana, plan, created_at)
subjects(id, user_id, nombre, color)
topics(id, subject_id, nombre)
deadlines(id, subject_id, tipo, fecha, peso)
materials(id, user_id, subject_id, tipo, titulo, texto_hash, created_at)
chunks(id, material_id, topic_id, texto, orden)
items(id, user_id, chunk_id, tipo, pregunta, respuesta, cita, estado, origen)
fsrs_state(item_id, due, stability, difficulty, reps, lapses, last_review)
review_logs(id, item_id, ts, rating, latency_ms, confianza_previa)
sessions(id, user_id, inicio, fin, tipo)
plans(id, user_id, fecha)
plan_blocks(id, plan_id, subject_id, tipo, minutos, estado)
habit_events(id, user_id, tipo, ts, meta)
lessons_seen(user_id, lesson_id, ts, accion)
subscriptions(id, user_id, plan, estado, vence)
usage_counters(user_id, periodo, generaciones, mensajes_tutor)
feedback(id, user_id, ts, texto, contexto)
events(id, user_id, ts, nombre, props)
```

Todas las tablas con RLS.

---

## 8. Planes

| Plan | Precio | Incluye |
|---|---|---|
| Free | $0 | Repaso ilimitado, 3 materias, cuota semanal IA, plan basico, micro-lecciones |
| Pro | ~$3-5/mes | Materias ilimitadas, cuota amplia IA, calibracion avanzada, exportacion |
