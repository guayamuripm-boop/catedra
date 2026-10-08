# Auditoría y rumbo (2026-10-07)

Qué tenemos, si cumple la visión ("nos adaptamos a ti para darte el mejor método"), qué quedó suelto y si alguien pagaría. **[V]** verificado en fuente, **[C]** leído en el código, **[D]** juicio propio.

## 1. Estilo visual: qué hacen las apps que enamoran

- Las tendencias 2026 apuntan a formas orgánicas (no rectángulos rígidos), texturas hechas a mano, movimiento con propósito y paletas sobrias con espacio vacío; hay un rechazo explícito a lo "perfecto y generado por IA" [V, blogs de agencias: orientativo].
- Finch retiene porque hay **un compañero vivo** que crece con tu esfuerzo; Forest, por la **consecuencia visible** (el árbol muere). Su debilidad: pantallas saturadas con metas, mascota y progreso compitiendo [V, reseñas].
- Aplicado a Catedra (hecho hoy): semilla que se dibuja al llegar, formas asimétricas en tarjetas, orbe que respira alrededor del anillo de retención, grano sutil, fondo que deriva despacio, semana en "formas vivas" (dorado = estudiaste), chips con ícono en vez de frases, medidores de 3 barras en el quiz. Seriedad conservada: paleta latón/oscuro, tipografía Fraunces, sin mascota infantil.
- Siguiente paso visual [D]: que la semilla del inicio **crezca** con la práctica real (planta/jardín de retención) en lugar de un porcentaje; es nuestro "compañero" sin caer en lo infantil.

## 2. Inventario: qué hay y cómo funciona [C]

| Pieza | Estado |
|---|---|
| Onboarding invertido (llegada, 3 preguntas, insight citado, setup) | Hecho y probado |
| Hoy: un protagonista con 6 estados + voz contextual + semana | Hecho y probado |
| Repaso espaciado FSRS + anillo de preparación | Hecho (23 pruebas) |
| Prácticas: Recuerda, Aplica, Oral, Simulacro | Hecho; ahora en hoja inferior |
| Diagnóstico de 9 dominios, bayesiano, pulso cada 3 sesiones | Hecho |
| Motor de hábitos (10 hábitos, hipótesis, prueba, veredicto) | Hecho (13 pruebas) |
| Cerebro (notas, voz, foto, importar, NotebookLM) | Hecho |
| IA con cadena de respaldo y autotest | **Hecho pero apagada** (faltan claves en Vercel) |
| Medición anónima, consentimiento 18+, encuestas | Hecho |

## 3. Lo que dejamos suelto o desconectado (por prioridad)

1. **El hábito no cambia nada.** El motor propone "Menos horas, más días", pero el plan, la sesión y la agenda lo ignoran: es una tarjeta aislada. El estudiante no nota que la app "se adapta". Conexión necesaria: hábito activo → modifica el plan de hoy (sesiones de 15 min, hora fija, tipo de práctica) y su botón lleva directo a la práctica correspondiente (un toque). [C: `HAB` solo se usa en Hoy y en el registro de eventos]
2. **No hay plan de estudio, solo "hoy".** `buildDailyPlan` arma hasta 4 bloques del día; `getMicroObjectives` reparte preguntas por días al examen, sin fases. Falta una **ruta al examen** (aprender, consolidar, simular, descansar) visible como línea de tiempo y que se reajuste sola si te saltas días.
3. **Preguntas de contexto sin recoger.** Capacidad de enfoque y hora pico solo llegan por el pulso (cada 3 sesiones); mientras tanto todos reciben "Bloques de 35 min" y el hábito "usa tu mejor hora" no puede activarse. Hay que preguntarlas visualmente (deslizador/íconos) en los primeros días.
4. **IA apagada = la parte que más valor da no existe todavía.** Sin claves, las preguntas son plantillas "sin IA" y la calidad es el factor decisivo del primer uso.
5. **Sin cuentas ni sincronización.** Todo vive en el teléfono: si lo borra, pierde su segundo cerebro. Además bloquea el cobro del plan Pro (la sincronización es parte del valor).
6. **Sin señales externas.** Los recordatorios son archivos `.ics`; formar hábito necesita una pista en el momento (notificación o "si-entonces" agendado).
7. **Cero entrevistas hechas.** Todo el producto sigue siendo hipótesis [D, ver `docs/research/validacion.md`].
8. **Descubribilidad:** al mover las 4 prácticas a "Más formas de practicar" se ven menos; los hábitos (`explicar`, `aplicar`, `simulacro`) deben llevar directo a ellas.
9. Pendientes menores: textos antiguos sin acentos, estados vacíos fríos en Biblioteca, modo cuaderno sin examen cercano, tarjeta compartible del perfil.

## 4. ¿Aporta valor real o es algo simple? ¿Pagarían?

**Lo que ya es commodity [V]:** tarjetas con repaso espaciado y generación con IA. Knowt lo ofrece gratis y Gizmo reunió 13 M de usuarios y $22 M con juego y rachas ([TechCrunch](https://techcrunch.com/2026/04/15/ai-learning-app-gizmo-levels-up-with-13m-users-and-a-22m-investment/)). Quizlet cobra ~$36/año y los estudiantes se quejan cuando funciones gratuitas pasan a pago ([comparativa](https://learnclash.com/blog/anki-vs-quizlet), blog de afiliados: orientativo). **Por eso eso solo no se paga.**

**Lo que no vimos en ningún competidor listado [D, búsqueda no exhaustiva]:** un ciclo cerrado de **método personal**: hipótesis sobre cómo estudias, prueba de 7 a 10 días y veredicto medido con tus propios datos ("esto sí/no te funcionó, probamos otra cosa"). Es un experimento de un solo sujeto con evidencia citada. Es nuestro único diferencial defendible, y hoy es la pieza más desconectada del producto (punto 1 y 2).

**Qué sí se paga [D, a validar]:** (a) resultado con fecha: examen o prueba de admisión, donde hay intención y precio alto; (b) comodidad real: sincronizar, IA buena, no perder lo tuyo; (c) un adulto pagando por un estudiante de secundaria. Referencias de conversión y precio en `modelo-de-negocio.md`.

**Prueba que decide:** en el piloto medir tres cosas: ¿cambiaste cómo estudias después de un veredicto?, ¿volviste solo en la semana 2?, ¿qué precio aceptas por "ruta al examen + sincronización"? (pantalla de precio falsa, sin cobrar).

## 5. Plan propuesto (en este orden)

1. **Conectar hábito con acción** (1 y 8): el hábito activo modifica el plan y su botón entra directo a la práctica.
2. **Ruta al examen** visual por fases + reajuste al saltar días (2).
3. **Preguntas de contexto visuales** en los primeros días (3) y modo cuaderno sin examen cercano.
4. **Activar la IA** con las claves (4) y revisar calidad con 5 materiales reales.
5. **Entrevistas y piloto de 12** con la guía de `piloto-guion.md` (7), con la pantalla de precio.
6. **Cuentas + sincronización** (5) solo si el piloto confirma retención.
7. Notificaciones y tarjeta compartible (6, 9).

## Fuentes

- [Tendencias de diseño de producto 2026](https://uxpilot.ai/blogs/product-design-trends) y [UI/UX 2026](https://mockflow.com/blog/ui-design-trends) (blogs de agencias)
- [Finch: apego emocional y retención](https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/) y [crítica de diseño](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)
- [Gizmo: 13 M de usuarios y $22 M](https://techcrunch.com/2026/04/15/ai-learning-app-gizmo-levels-up-with-13m-users-and-a-22m-investment/)
- [Anki vs Quizlet y precios](https://learnclash.com/blog/anki-vs-quizlet)
