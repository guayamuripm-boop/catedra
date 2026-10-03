# ADR-005: Diagnóstico adaptativo, segundo cerebro y capa de datos

**Estado:** Implementado en el cliente (2026-10-03). IA real pendiente de desplegar el proxy.
**Base:** `docs/research/diagnostico-segundo-cerebro.md`

## Decisiones

1. **Datos en IndexedDB** (fuente de verdad) con migración automática desde `localStorage` (incluye audios base64 → Blob). Respaldo/restauración JSON, `storage.persist()`, medidor de espacio, borrado total. Si guardar falla, se avisa (antes se perdía en silencio).
2. **Diagnóstico adaptativo estilo clínico** (`js/diag.js`): triaje (queja principal, cuándo falla, gravedad) → 9 dominios con una pregunta conductual de cribado → seguimientos ramificados (todos en el dominio de la queja; 1 por dominio ambiguo, máx. 5). Una pregunta por pantalla, avance automático, botón atrás. Peor caso ~21 preguntas.
3. **Perfil = estimación con evidencia.** Cada dominio guarda `est` (0-100) y `w` (peso). Las respuestas fijan el punto de partida; cada sesión lo actualiza con datos observados (calibración, acierto, duración, constancia, simulacro). Pulso de 1 pregunta cada 3 sesiones y control de 2 min cada 14 días. Prioridad = estimación encogida hacia 60 según evidencia (una sola respuesta no decide) y con peso extra a la queja declarada.
4. **El perfil adapta la app:** bloques más cortos si concentración es baja; sugerencia de simulacro si estrategia/calma de examen son bajas y el examen está a ≤14 días.
5. **Sin "estilos de aprendizaje".** Se eliminó la pregunta de canal y el titular "Procesador auditivo/práctico".
6. **Segundo cerebro** (`js/brain.js`): bandeja de notas con captura por texto, voz (dictado), archivo (.txt/.md/.pdf con pdf.js bajo demanda), pegado y contenido compartido desde otras apps; asignación a materia en un toque; etiquetas `#`; búsqueda local sin tildes; nota → preguntas.
7. **NotebookLM por traspaso:** paquete Markdown por materia (descargar, copiar, compartir, abrir NotebookLM) e importación pegada con detección de 3 formatos (Pregunta/Respuesta, pregunta con `?` + respuesta, término: definición). No existe API pública de consumidor.
8. **Voz con consentimiento.** Dictado y síntesis oral usan el reconocimiento del navegador (en Chrome envía audio a Google); se pide consentimiento una vez y siempre hay alternativa escrita. Se quitó `Math.random()` de la evaluación oral: ahora puntúa sobre la transcripción real y agenda cada concepto como un repaso.
9. **IA opcional por proxy** (`worker/ai-proxy.js`, `js/ai.js`): generación y evaluación con LLM. Sin URL, todo usa heurísticas locales rotuladas "sin IA". Se descartan las preguntas cuya cita no exista literalmente en el texto fuente. Consentimiento antes de enviar texto.

## Correcciones de fondo
- "Hoy" se calculaba en UTC: de noche (pico de muchos estudiantes en VE/CO) rompía rachas y repasos. Ahora usa fecha local. Etiquetas de día de la semana en Agenda también estaban desfasadas.
- Pretest entraba en bucle (volvía a aparecer tras "Empezar sesión"); ahora se marca hecho y no vuelve.
- Grabadora forzaba `audio/webm` (fallaba en iOS); ahora elige el formato soportado.
- PWA: íconos PNG reales (los SVG `data:` podían impedir la instalación), `share_target`, atajos, service worker con red primero para el HTML (los testers reciben versiones nuevas).
- Simulacro con cuenta regresiva real, revisión con respuesta esperada y su resultado agenda los repasos.

## Limitaciones conocidas (verificar con gente real)
- `share_target` solo en Android con la PWA instalada; no se probó en un dispositivo real. En iOS: pegar o elegir archivo.
- PDF requiere conexión la primera vez (pdf.js desde CDN); PDF escaneado sin texto no se lee (no hay OCR).
- Dictado en iOS Safari es poco fiable; hay alternativa escrita.
- Cobertura sin IA es léxica: penaliza sinónimos. Por eso se rotula "estimado sin IA".
- El respaldo no incluye audios.
- Sin cuenta ni sincronización: un dispositivo = un perfil. Borrar datos del navegador sin respaldo los pierde (por eso `persist()` y el medidor).
- Los pesos del perfil (`obsUpdate`) son razonables pero **no están calibrados con datos**; hay que revisarlos con los primeros testers.

## Qué medir
Finalización del diagnóstico (¿se abandona en la pregunta N?), si el perfil "cambia" de forma creíble para el estudiante, notas capturadas por usuario/semana, uso de paquete e importación NotebookLM, y D2/D7.
