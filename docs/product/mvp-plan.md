# Plan de MVP: de prototipo funcional a algo que se pueda validar

Fecha: 2026-10-04. Base: `docs/research/mercado-evidencia-integraciones.md`. Reordena la secuencia de ADR-004 con lo aprendido. Complementos: `arquitectura-y-escala.md` (datos, IA, despliegue) y `modelo-de-negocio.md`.
Las estimaciones de días son mías y aproximadas; **[D]** = juicio propio por validar.

---

## 1. Veredicto

**El problema es real, la solución aún no está probada.** Los estudiantes usan técnicas de baja utilidad aunque existen otras mucho mejores, y casi nadie les enseña a estudiar (evidencia en el documento de investigación). Lo que **no sabemos** es si un estudiante usará una app para corregirlo, y si eso mejora su resultado.

**Dónde estamos:** hay una app instalable con diagnóstico adaptativo, perfil que cambia, segundo cerebro, voz, simulacro y puente a NotebookLM. Técnicamente avanzó mucho; **comercialmente está sin validar**:

| Brecha | Por qué importa |
|---|---|
| **Cero conversaciones con estudiantes** (no existe `entrevistas.md`) | Todo lo construido es hipótesis |
| **Cero analítica** | Aunque lo prueben 10 personas, no sabríamos quién abandonó ni dónde |
| **Las preguntas son plantillas, no IA** ("Sin mirar el texto, ¿qué dice este fragmento…?") | El corazón del bucle diario se ve mediocre; un tester concluiría "no sirve" por un defecto que ya sabemos resolver. Knowt ya da esto gratis |
| **Entrada con fricción** (hay que pegar texto) | Los jóvenes no pegan texto; fotografían la pizarra o el cuaderno |
| **Onboarding largo** (hasta 21 preguntas antes de estudiar) | El primer valor llega tarde |
| **5 pestañas** (Hoy, Agenda, Cerebro, Materiales, Progreso) | Contradice "poca información"; Cerebro y Materiales se solapan |
| **Sin recordatorios** | La retención depende de que el usuario se acuerde |
| **Dos URLs vivas** (GitHub Pages y Vercel) | Los datos son por dominio: quien probó en una pierde todo en la otra |
| **Sin cuentas** | Aceptable para piloto; límite para escalar |

## 2. Definición del problema y apuesta

> **Estudiantes jóvenes estudian con técnicas que se sienten productivas pero rinden poco, y no saben qué cambiar. Catedra mide cómo estudia cada uno, le da un plan concreto para su examen y lo reajusta con su práctica real.**

Las tres apuestas, en orden de riesgo:

| # | Hipótesis | Cómo se prueba |
|---|---|---|
| H1 | Completan un diagnóstico corto y lo sienten acertado | ≥70 % lo termina; puntuación media de "se parece a mí" ≥4/5 |
| H2 | Si en <90 s sus propios apuntes (foto/PDF/texto) se vuelven preguntas buenas, hacen una primera sesión | ≥8/12 activan en 24 h; ≥70 % de preguntas IA aprobadas sin editar |
| H3 | Un plan que se adapta los hace volver, y se sienten más preparados | ≥6/12 vuelven sin que se les insista; preparación autorreportada sube; nota real del examen |

**Posicionamiento a probar [D]:** "Llega listo a tu examen" (resultado) frente a "Aprende a estudiar" (método). Probar los dos mensajes en las entrevistas.

## 3. Qué es (y no es) el MVP

**El momento mágico (≤3 minutos desde que abre):** diagnóstico corto → sube foto/PDF/texto → 6 preguntas buenas con cita → responde la primera → ve "Preparación para tu examen" y el plan de hoy.

| Dentro del MVP | Fuera / escondido por ahora |
|---|---|
| Diagnóstico corto (9 preguntas) + perfilado progresivo en las primeras sesiones | Evaluación oral con IA (queda en beta, heurística) |
| Captura: foto, PDF, texto, importar Quizlet/Anki | Tutor conversacional |
| Preguntas con IA y cita verificada, aprobar con un toque | Panel docente, marketplace, apps nativas |
| Repaso con FSRS (`ts-fsrs`) y cola diaria | Integración con LMS / Classroom |
| **Preparación para el examen**: probabilidad de recordar el día del examen | Gamificación social / ligas |
| Perfil que cambia, con "tu plan cambió porque…" | OCR propio, STT propio |
| Racha suave + recordatorios | |
| Analítica anónima + canal de opinión | |

Se conserva sin promocionar: simulacro, Cerebro/notas, puente NotebookLM (ya hechos; no son la apuesta).

## 4. Interfaz para público joven (poca información, muy gráfica)

Reglas [D]: **una acción principal por pantalla**, ≤7 palabras por elemento, el estado se *ve* (anillos, mapas, barras) antes de leerse, y cada pantalla se entiende sin instrucciones. Paleta latón/oscuro sin cambios.

| Elemento | Qué es |
|---|---|
| Navegación a **3 pestañas** | **Hoy** (plan, estudiar, agenda) · **Biblioteca** (Cerebro + Materiales) · **Tú** (perfil y progreso) |
| **Anillo de preparación** | % de probabilidad de recordar el día del examen, con cuenta regresiva. Es el número que le importa al estudiante |
| **Perfil como radar** (SVG animado) | Reemplaza las barras; es además la imagen que se comparte |
| **Ruta del día** | 3 nodos (ej. repaso → práctica → cierre), no una lista |
| **Tarjeta compartible** | "Mi perfil de estudio" como imagen (Web Share). Posible palanca de crecimiento entre jóvenes [D] |
| Microinteracciones | Confeti y vibración al terminar una sesión; sin sonido obligatorio |
| Diagnóstico como tarjetas | Una pregunta, avance automático (ya existe), con progreso visible |

## 5. Plan por sprints

Quién: **Yo** = desarrollo asistido · **Tú** = cosas que solo tú puedes hacer.

### Sprint 0 · Poder medir (≈2 días)
- **Tú:** elegir URL canónica; crear clave de Groq y de Gemini y pegarlas en Vercel → Settings → Environment Variables; reclutar 10 entrevistas.
- **Yo:** analítica anónima con eventos de embudo (`diag_start`, `diag_done`, `material_added`, `questions_approved`, `session_done`, `return_d1`); enlace de opinión en el resumen; función `/api/ai` en Vercel (generar, evaluar, visión) con límite de uso; diagnóstico a 9 preguntas con perfilado progresivo; kit de piloto (mensaje de WhatsApp, texto de consentimiento).
- **Criterio:** se ve el embudo en un panel; una pregunta con IA real en <10 s.

### Sprint 1 · Núcleo creíble (≈4–5 días)
- Captura por foto (visión), PDF, texto e importación Quizlet/Anki → 6–10 preguntas con cita; "aprobar todo" y revisión por toque.
- `ts-fsrs` reemplaza los intervalos fijos; 4 grados de respuesta; cola diaria.
- Anillo de **preparación** por materia (probabilidad de recordar a la fecha del examen).
- Evaluación escrita y oral con LLM cuando hay IA (ya cableada; falta probar con claves).
- **Criterio:** de foto a primera pregunta respondida en ≤90 s; ≥70 % de preguntas aprobadas sin editar sobre 5 materiales reales de distintas materias (incluidas STEM).

### Sprint 2 · Vistoso y autoexplicativo (≈4–5 días)
- Navegación a 3 pestañas; radar de perfil; ruta del día; tarjeta compartible; confeti y vibración; exportar `.ics`.
- Pasada de copy (≤7 palabras) y acentos en pantallas antiguas.
- **Criterio:** 5 estudiantes, sin explicación, completan diagnóstico y primera sesión sin preguntar nada.

### Sprint 3 · Retención y piloto (≈1 semana)
- Cuentas (Supabase, Google) con sincronización y respaldo automático.
- Recordatorios push (Android; en iOS solo con la PWA instalada) con racha suave.
- Límites de uso de IA por usuario.
- **Piloto B** con 8–12 estudiantes con examen en ≤4 semanas; medir y decidir.

## 6. Validación (en paralelo, no al final)

**Fase A: esta semana, sin código nuevo.** 10 entrevistas de 20 min con el guion de `docs/research/validacion.md` (reconstruir su último examen; no presentar la app). Al final, enseñarles solo el diagnóstico (30 s) y preguntar: "¿se parece a ti? 1–5" y "¿qué te daría para estudiar mejor?". Esto prueba H1 y el posicionamiento sin escribir una línea.

**Fase B: tras el Sprint 1.** Piloto con material real. Criterios de avance (de ADR-004 y `validacion.md`):
- ≥8/12 hacen la primera sesión en 24 h
- ≥6/12 vuelven sin que se les insista
- ≥70 % de preguntas IA aprobadas sin editar
- Evidencia de uso, no solo "me gustó"; y al cierre, nota real del examen

**Criterio de pivote:** si <3/12 vuelven y las entrevistas muestran que lo que querían era otra cosa (p. ej. resolver tareas o explicaciones), replantear el núcleo antes del Sprint 3.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Diferenciación fina: generar y repasar ya es gratis en Knowt/Quizlet | El diagnóstico y el ajuste deben *sentirse* en 3 min y en la primera semana; si no, es "otra app de tarjetas" |
| Preguntas de IA malas (sobre todo STEM) | Cita literal obligatoria (ya validada en código), revisión humana, medir % aprobado |
| Límites de la capa gratuita de IA (≈1.000–1.500/día) | Suficiente para 10–30 testers; límite por usuario y plan de pago antes de abrir |
| Datos de menores y términos de la capa gratuita | Universitarios primero [D]; consentimiento del tutor y revisión legal antes de 3.er año; revisar términos de datos de cada proveedor |
| Vercel Hobby prohíbe uso comercial | Aceptable para piloto sin cobro; decidir host antes de monetizar |
| Efecto educativo no transferible de aula a app | Medirlo (H3); no prometerlo en la comunicación |
| Una persona haciendo producto, entrevistas y soporte | Sprints cortos; entrevistas primero |
| iOS limita push y compartir hacia la app | Android primero para piloto; en iOS, instalada + pegar archivo |

## 8. Decisiones que necesito de ti

1. **URL canónica.** Recomiendo Vercel (ya despliega solo con cada push) y apagar GitHub Pages: los datos son por dominio y dos URLs confunden a los testers.
2. **Claves de IA.** Groq para texto y Gemini Flash para foto; las creas tú (≈5 min cada una, gratis) y las pegas en Vercel. No las pegues en el chat.
3. **Cohorte del piloto.** Tu público es 3.er año (~14–15 años) y universitarios. Para menores hace falta consentimiento del tutor y revisión legal (ver `arquitectura-y-escala.md` §5). Propuesta: arrancar con universitarios para aprender rápido sin esa fricción, y preparar en paralelo el consentimiento del tutor para abrir 3.er año en cuanto esté revisado.
4. **¿Arrancamos con Sprint 0 y las entrevistas en paralelo?** Las entrevistas son tuyas; yo preparo el kit.

## 9. Cómo se ve el éxito en 30 días
Diez conversaciones documentadas, un embudo medible, preguntas con IA que un estudiante aprueba casi sin tocar, una primera sesión en menos de 3 minutos, 8–12 personas probándola con examen real y una decisión clara: seguir, ajustar o pivotar.
