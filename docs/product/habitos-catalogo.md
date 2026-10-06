# Catálogo de hábitos y motor de hipótesis

Fecha: 2026-10-05 · Código: `js/habits.js` · Pruebas: `tests/habits.test.js`

**Estado honesto:** el equipo no tiene psicopedagogo. Las reglas son **hipótesis nuestras construidas sobre literatura citada**, no un protocolo clínico ni validado. Antes de mostrarlas como "recomendación experta" necesitan revisión de un profesional. El motor no diagnostica nada: elige una acción, la prueba y mide.

## Ciclo
1. **Señal** (declarada por el estudiante u observada en su práctica) → 2. **hipótesis**: un hábito del catálogo (el de mayor puntuación = fuerza de la señal × peso de la evidencia; lo observado pesa más que lo declarado) → 3. **prueba** de 7 a 10 días contra una **línea base** de los 14 días previos → 4. **veredicto** (funcionó / sin cambio / no ayudó / faltan datos) → 5. si no mejora, **migra** a la siguiente hipótesis; si mejora, se consolida (28 días sin repetirlo) y se busca el siguiente.
Reglas de honestidad: sin datos suficientes no se culpa al hábito (se extiende 5 días una sola vez); evidencia baja + solo respuesta declarada no basta para proponer; "Otra idea" omite la propuesta 14 días; nunca más de un hábito activo.

## Catálogo (10 hábitos)
| Hábito | Señal que lo activa | Se mide con | Evidencia | Fuente |
|---|---|---|---|---|
| Pruébate antes de releer | Recuerdo tras 5+ días < 60 % (obs.) · o dice que relee (decl.) | Recuerdo tras 5+ días | Alta | Roediger & Karpicke 2006; Dunlosky 2013 [V] |
| Predice antes de ver | Brecha confianza-acierto ≥ 30 pts (obs.) · o no sabe si aprendió (decl.) | Brecha confianza-acierto | Media | Roediger & Karpicke 2006 (releer sube confianza, no recuerdo) [V] |
| Menos horas, más días | < 2.5 días/semana (obs.) · o estudia en la víspera (decl.) | Días por semana | Alta | Cepeda et al. 2006; Dunlosky 2013 [V] |
| Decide cuándo empiezas | Le cuesta empezar (decl.) | Días por semana | Alta (general) | Gollwitzer & Sheeran 2006, d≈0.65, metas diversas [V] |
| Usa tu mejor hora | < 40 % de la práctica en su mejor hora | % en su franja | Media | Lally et al. 2010 (contexto repetido; 18 a 254 días para formar hábito) [V] |
| Explícalo con tus palabras | Aciertos al explicar/comparar 20 pts por debajo de recordar | Acierto en esos tipos | Media | Dunlosky 2013, utilidad moderada [V] |
| Úsalo en la vida real | Aciertos al aplicar 20 pts por debajo de recordar, o nunca aplica | Acierto en Aplica | Media | Agarwal 2019; Butler 2010 [V] |
| Un simulacro con tiempo | Examen en ≤ 30 días y sin simulacro en 7 | Nota de simulacro | Media | Roediger & Karpicke 2006; vínculo con ansiedad sin verificar |
| Celular en otra habitación | Revisa el celular (decl.) | Autoinforme | Baja | Ward et al. 2017: un estudio, réplicas mixtas [V el original] |
| Duerme antes de repasar más | Duerme poco (decl.) | Autoinforme | Baja | Sin verificar |

`[V]` = comprobé que el estudio existe y su resumen en esta sesión. Los umbrales (60 %, 30 pts, 2.5 días…) son **nuestros**, no de la literatura.

## Fuera del catálogo a propósito
Estilos de aprendizaje (sin evidencia, Pashler 2008), Pomodoro como "método" (evidencia directa limitada; la duración del bloque ya se ajusta por el ritmo declarado), diagnósticos de ansiedad/TDAH, y cualquier hábito que no podamos medir ni con datos ni con una pregunta al estudiante.

## Cómo añadir un hábito
Una entrada en `CATALOG` con `id`, `nombre`, `accion`, `ev {nivel, fuente}`, `signal(st,hoy)`, y `metric` o `self`. La prueba `todo hábito del catálogo declara…` falla si falta algo. Cada hábito nuevo debe traer una fuente que alguien haya abierto.

## Siguiente
- Revisión por un profesional (psicopedagogía/psicología educativa) de señales, umbrales y textos.
- Calibrar umbrales con el piloto (¿qué porcentaje de pruebas termina en "funcionó"? ¿coincide con la nota?).
- Más hábitos cuando haya fuente y métrica: intercalar materias, dividir tareas grandes, respiración antes del examen.
- Medir el motor: comparar estudiantes con hábito a prueba frente a sin él (diseño del piloto).
