# Modelos de IA 100 % gratis, sin tarjeta, para el piloto

Fecha: 2026-10-05. **Advertencia:** los límites vienen de comparativas de terceros (una de ellas del propio OpenRouter, que tiene interés comercial) y los proveedores los cambian seguido. Antes de depender de un número, míralo en la consola del proveedor. Gemini, por ejemplo, redujo sus límites gratuitos varias veces entre fines de 2025 y abril de 2026.

## Qué necesitamos de la IA (tareas de `api/ai.js`)
Generar preguntas desde un texto, evaluar una respuesta libre, crear situaciones cotidianas (Aplica) y transcribir fotos de apuntes. Son tareas cortas (≈1 000–2 500 tokens cada una) que devuelven JSON y que, en español, no exigen un modelo de frontera.

## Opciones comprobadas (sin tarjeta)
| Proveedor | Límites gratis reportados | ¿Entrena con tus datos? | Veredicto |
|---|---|---|---|
| **Groq** | Llama 3.3 70B: 30 req/min, ~1 000 req/día, ~12 000 tokens/min y **~100 000 tokens/día**. Los límites son por organización, no por clave | No | **Principal.** Rápido y sin tarjeta. El techo diario de tokens es lo que se agota primero |
| **OpenRouter** | ~20 req/min, **50 req/día** con modelos `:free` (1 000 con 10 USD de saldo) | No | **Respaldo.** Poco cupo, pero una sola clave abre varios modelos |
| **Google AI Studio (Gemini)** | Solo Flash y Flash-Lite; entre ~20 y ~250 req/día según el modelo y el mes | **Sí** en el plan gratis (fuera de la UE/UK/EEA) | **Solo para fotos** (transcribir apuntes) y como último recurso. Privacidad: es lo menos recomendable para datos de estudiantes |
| Cloudflare Workers AI | ~10 000 "neurons"/día, sin tarjeta | No | Posible respaldo futuro; contexto pequeño y API no 100 % compatible |
| GitHub Models | 15 req/min, 150–1 000 req/día, atado a una cuenta de GitHub | No | Pensado para pruebas, no para producción |
| Mistral (Experiment) | Alto en tokens | **Obligatorio aceptar entrenamiento** | Descartado por privacidad |
| Cohere | ~100 req/día | No | Descartado: **solo uso no comercial** |
| Cerebras | Fuentes contradictorias: una dice 1 M tokens/día sin tarjeta; otra, que desde el 16 de julio de 2026 exige un método de pago verificado | No | **Descartado** hasta aclararlo: no cumple "sin tarjeta" si la segunda fuente es la correcta |

## Qué implementé
Una **cadena de respaldo** en `api/ai.js`: si un proveedor devuelve 429 (sin cupo) o falla, prueba el siguiente.
1. Groq `llama-3.3-70b-versatile`
2. Groq `llama-3.1-8b-instant` (otro cupo de tokens; menos calidad)
3. OpenRouter `meta-llama/llama-3.3-70b-instruct:free` (el nombre de los modelos gratis cambia: se ajusta con `OPENROUTER_MODEL`)
4. Gemini `gemini-2.5-flash-lite` (se puede apagar para texto con `AI_NO_GEMINI_TEXT=1`)
Las fotos van solo a Gemini (`gemini-2.5-flash`). Se aceptan respuestas con JSON envuelto en ``` o en texto. Un autotest (`/api/ai?check=1`, con tu código de piloto) dice qué claves funcionan sin mostrarlas.

## Cuánta capacidad hay (cuenta de servilleta)
Un estudiante activo usa ~8 llamadas/día (~12 000 tokens). Con el tope reportado de Groq 70B (~100 000 tokens/día), el 70B solo atiende a ~8 estudiantes al día; el 8B y OpenRouter absorben el resto. **Para 10–15 estudiantes alcanza; con 30 o más habrá días con IA en modo reducido o apagada.** La app lo tolera: sin IA usa plantillas rotuladas "Sin IA" y el modo manual de Aplica. Si el piloto crece, el primer gasto razonable es una tarjeta con tope en Groq o OpenRouter, no cambiar de proveedor.

## Recomendación
Empieza con **Groq + OpenRouter** (ambos sin tarjeta y sin entrenar con datos) y agrega **Gemini** solo si quieres transcribir fotos de apuntes y aceptas que Google puede usar esas imágenes. `AI_DAILY_LIMIT_PER_USER=25` protege el cupo.

## Fuentes
- [Comparativa de APIs gratis 2026 (OpenRouter, con interés comercial)](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)
- [Límites gratuitos de Groq, resumen de terceros](https://eesel.ai/blog/groq-pricing)
- [Cambios del plan gratis de Gemini, abril 2026](https://agentdeals.dev/gemini-api-pricing-changes)
- [Cerebras, resumen de terceros](https://costbench.com/software/llm-api-providers/cerebras-inference/free-plan/)
No pude abrir la página oficial de límites de Groq (error 403); confírmalo en su consola.
