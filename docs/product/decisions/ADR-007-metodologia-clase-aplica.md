# ADR-007 · Metodología "Clase → Recuerda → Aplica → Repite"

Fecha: 2026-10-05 · Estado: parcialmente implementada (Aplica)

## Contexto
Las tarjetas pregunta-respuesta entrenan el recuerdo literal. El estudiante pidió algo más práctico y cotidiano: que lo visto en clase se use en una situación de su vida, para que entienda **para qué** lo aprende. Ver `docs/research/validacion-diagnostico.md` §3 para la evidencia y sus límites.

## Decisión
Ciclo basado en lo visto en clase:
1. **Clase**: el estudiante captura apuntes (texto, foto, voz); salen las preguntas ancladas a la fuente (ya existe).
2. **Recuerda** *(pendiente)*: al terminar la clase, escribir lo que recuerda sin mirar los apuntes y compararlo con ellos (recuperación libre).
3. **Aplica** *(implementado, `js/apply.js`)*: una situación cotidiana (bodega, transporte, celular, amigos, dinero, cocina; nada laboral) donde debe usar el concepto: calcular, decidir, explicar, predecir. Muestra una respuesta modelo y "para qué te sirve".
4. **Repite**: cada resultado reprograma el ítem con FSRS; la próxima aplicación usa otro contexto (el generador recibe los contextos recientes para evitarlos).

## Reglas
- **Sin IA no se inventan escenarios.** El estudiante piensa su propia situación y se autoevalúa; se rotula "Sin IA". Es elaboración con valor de utilidad, no un ejercicio generado.
- Con IA (`task: scenario` en `api/ai.js`): el escenario y la respuesta modelo salen solo de la referencia del concepto; la evaluación usa la tarea `evaluate` existente. La salida se sanea (longitudes, campos) pero **no se verifica semánticamente**: si el modelo inventa un dato, hoy no hay forma automática de detectarlo → revisar con muestras reales en el piloto antes de ampliar.
- Cada paso suma al calendario de repaso; no toca el perfil de diagnóstico.

## Riesgos
- Contexto cotidiano puede distraer del concepto (Kaminski & Sloutsky) [C]: medir recuerdo/transferencia, no solo gusto.
- Escenarios de IA con errores o con tono poco local: añadir botón "reportar" y revisar muestras.
- Llama 3.3 70B en español: calidad a comprobar; cambiar modelo con `AI_SCENARIO_MODEL`.

## Siguiente
Paso "Recuerda"; aleatorizar tarjeta vs. escenario por ítem para medir el efecto (§5 del documento de validación); botón de reporte de escenarios.
