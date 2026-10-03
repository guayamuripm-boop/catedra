# Investigacion: diagnostico adaptativo, segundo cerebro y datos

Fecha: 2026-10-03. Marca: **[V]** verificado en fuente consultada, **[C]** conocimiento previo sin verificar aqui, **[D]** decision de diseno propia.

---

## 1. Hallazgos que cambian el plan

1. **NotebookLM no se puede "conectar" como app.** La edicion de consumidor no tiene API publica [V]. Existe una API Enterprise (alpha, Google Cloud) que crea notebooks y gestiona fuentes (Docs, Slides, texto, web, YouTube), pero no permite consultar ni chatear con el notebook [V]. No es viable para estudiantes. La integracion real es por **traspaso de archivos**: exportar un "paquete de fuentes" que el estudiante sube a NotebookLM, e importar de vuelta lo que NotebookLM produce (resumenes, guias, preguntas) por pegado [D].
2. **Recibir contenido de otras apps solo funciona en Android.** `share_target` en el manifest permite que la PWA instalada aparezca en el menu "Compartir" (texto, URL, archivos) desde Chrome 71 [V]. En iOS no esta soportado [V]. Fallback iOS: boton pegar, selector de archivos, arrastrar y soltar [D].
3. **La transcripcion de voz de Chrome envia el audio a un servidor de Google** [V]. Existe modo local (`processLocally`) pero inicialmente solo en Windows, Mac y Linux, no en Android [V]. Whisper en el navegador (Transformers.js, WebGPU/WASM) corre 100% local [V] pero obliga a descargar un modelo grande, malo para 3G [D]. Para menores esto exige consentimiento explicito (ver `docs/legal/privacidad-checklist.md`).
4. **localStorage (~5-10 MB) no sirve como base de datos** [V]. IndexedDB y Cache API tienen cuota mucho mayor (Safari ~1 GB) [V]. `navigator.storage.persist()` evita el borrado automatico [V]. Una PWA instalada en iOS usa un contenedor de almacenamiento separado del navegador [V]: datos creados en Safari no aparecen en la app instalada.
5. **MSLQ es de dominio publico** (usar citando a los autores) [V]. **LASSI es un instrumento comercial** [C]: no copiar sus items, solo medir los mismos constructos con items originales. Los 10 dominios de LASSI son una buena lista de constructos: ansiedad, actitud, concentracion, procesamiento de informacion, motivacion, ideas principales, autoevaluacion, estrategias de examen, manejo del tiempo y uso de recursos [V].

## 2. Problemas reales en la app actual (honestos)

| Problema | Impacto | Arreglo |
|---|---|---|
| Audios guardados como base64 en localStorage | Con 3-5 audios se llena la cuota; `saveState` traga el error y **se pierden datos en silencio** | IndexedDB con Blobs, `persist()`, aviso de espacio |
| Evaluacion oral usa `Math.random()` | Da cobertura inventada. Feedback falso a testers | Transcribir de verdad y comparar, o rotular "demo" |
| `MediaRecorder` forzado a `audio/webm` | Falla en Safari/iOS (usa mp4) | Elegir tipo con `isTypeSupported` |
| Pregunta de "canal" (auditivo/visual...) y titular "Procesador auditivo" | Es clasificacion por estilos de aprendizaje, que el propio `spec.md` dice que NO se hace y cuya hipotesis de emparejamiento no esta respaldada [C] | Quitarla del titular; usar la modalidad solo como preferencia de practica |
| Evaluacion escrita por coincidencia de palabras | Burda: penaliza sinonimos, premia listas de palabras | Mejorar a corto plazo; LLM a medio plazo |
| Respuestas del diagnostico solo se guardan una vez | El perfil no "muta" | Ver seccion 3 |

## 3. Diagnostico estilo clinico (adaptativo y que muta)

**Principio:** en medicina no se hace un cuestionario fijo; se hace triaje, anamnesis dirigida, revision por sistemas y control de seguimiento. Lo traducimos asi [D]:

1. **Motivo de consulta (triaje, 3 preguntas):** "que te pasa cuando estudias?", cuando falla (antes, durante, despues del examen), gravedad 0-10.
2. **Anamnesis dirigida:** el motivo elegido abre 2-3 preguntas especificas (ramificacion). Ej.: "no retengo" -> "olvidas en horas o en dias?" -> "como repasas hoy?".
3. **Revision por dominios:** 1 pregunta de cribado por dominio (8 dominios: concentracion, manejo del tiempo, motivacion, ansiedad ante examen, procesamiento, autoevaluacion, estrategia de examen, uso de recursos; mas **sueno** como factor de estilo de vida). Si la respuesta es ambigua o extrema-problematica, se profundiza con 2 preguntas mas; si es clara, se corta. Es la logica de un test adaptativo (CAT) simplificado [D]; la literatura de CAT usa IRT o modelos bayesianos [V].
4. **Redaccion conductual, no autoconcepto:** "ayer, cuantas veces miraste el celular mientras estudiabas?" es mas fiable que "te distraes mucho?" [C].
5. **Seguimiento (control):** pulso de 1 pregunta tras cada 3 sesiones; re-diagnostico corto cada 2-3 semanas; cambio de materia o examen cercano dispara revision.

**Perfil = prior + evidencia.** El cuestionario fija una estimacion inicial con incertidumbre por dominio. Cada sesion la actualiza con datos observados [D]:

| Dominio | Senal observada que actualiza el perfil |
|---|---|
| Autoevaluacion / calibracion | Brecha confianza vs acierto (ya existe) |
| Concentracion | Duracion real vs bloque, abandonos, latencia de respuesta |
| Manejo del tiempo | Dias planificados vs dias estudiados, hora real vs hora pico declarada |
| Procesamiento | Acierto por tipo de pregunta (recuperacion, explicacion, aplicacion) |
| Ansiedad ante examen | Diferencia practica normal vs simulacro (ya existe) |
| Motivacion | Retorno sin recordatorio, rachas, feedback post-sesion |

Si lo observado contradice lo declarado, el perfil se mueve hacia lo observado y se le muestra al estudiante ("dijiste que rindes mas de manana; tus mejores sesiones son de noche").

**Limites (importante):** no es diagnostico medico ni psicologico. No etiquetar ansiedad/TDAH. Si el dominio de ansiedad sale alto de forma sostenida, mostrar mensaje de apoyo y sugerir hablar con un profesional [D]. Sin etiquetas fijas: siempre "estimacion, se ajusta".

## 4. Segundo cerebro estudiantil

Alcance acotado a lo que mueve el resultado: **capturar -> organizar -> recuperar -> practicar** [D].

- **Bandeja de entrada:** todo lo capturado (nota, voz, texto compartido, archivo, URL) llega sin clasificar; un toque lo asigna a materia/tema.
- **Fuentes:** cada contenido guarda de donde vino y es citable por las preguntas (regla de anclaje a fuente ya vigente).
- **Busqueda local** (MiniSearch/FlexSearch) y enlaces entre notas/temas.
- **Puente a practica:** cualquier nota o fuente se convierte en preguntas aprobables.
- **Grabadora:** nota de voz -> transcripcion -> nota de texto enlazada al audio.
- **NotebookLM:** boton "Paquete de fuentes" (Markdown por materia, con secciones) y "Importar de NotebookLM" (pegar texto/preguntas, parser a items).
- No competir con Notion/Obsidian: nada de bloques libres, bases de datos ni plantillas.

## 5. Capa de datos

- **IndexedDB** (via Dexie) como fuente de verdad; migracion automatica desde `localStorage`.
- Audios como **Blob**, no base64.
- Llamar `navigator.storage.persist()` al terminar el onboarding; mostrar uso con `storage.estimate()`.
- **Exportar/importar respaldo JSON** (ya hay exportar; falta importar). Es el seguro mientras no haya cuenta.
- Esquema con `id`, `createdAt`, `updatedAt`, `deletedAt` desde ya, para que el sync futuro con Supabase (ADR-004) no obligue a migrar.
- Esquema versionado con migraciones.

## 6. Plan por fases (cada una se queda; ninguna se deshace)

| Fase | Contenido | Por que primero |
|---|---|---|
| 0. Cimientos | IndexedDB + migracion, audio a Blob, `persist()`, importar respaldo, arreglo `webm`/iOS, quitar `Math.random()` oral, quitar "estilo de aprendizaje" del titular | Evita perder datos de testers y dar feedback falso |
| 1. Diagnostico v2 | Triaje + anamnesis ramificada + dominios + actualizacion por telemetria + pulsos + re-diagnostico | Es el diferenciador y lo que mas se valida con gente real |
| 2. Segundo cerebro | Bandeja, captura (texto/voz/archivo/`share_target`), busqueda, paquete NotebookLM, importar pegado | Convierte la app en lugar donde vive el estudio |
| 3. IA real | Proxy (Cloudflare Worker/Supabase) para generacion y evaluacion oral/escrita con LLM | Una PWA estatica no puede guardar claves de API |

## Fuentes
- [NotebookLM Enterprise API: sin endpoint de consulta](https://discuss.google.dev/t/notebooklm-enterprise-api-missing-query-chat-endpoint-for-rag-orchestration/366875)
- [NotebookLM: que se puede automatizar hoy](https://horadecodar.com.br/notebooklm-api/)
- [Web Share Target en Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/web-share-target)
- [What Web Can Do Today: sharing](https://whatwebcando.today/sharing.html)
- [Web Speech API en el navegador (MDN)](https://developer.mozilla.org/docs/Web/API/Web_Speech_API)
- [Intent to Ship: On-device Web Speech API](https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM/m/TQpe9shjCgAJ)
- [Whisper en el navegador con Transformers.js](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/client-side-asr-faster-whisper-wasm-browser)
- [Storage for the web (web.dev)](https://web.dev/storage-for-the-web)
- [LASSI (EdInstruments)](https://edinstruments.org/instruments/learning-and-study-strategies-inventory-3rd-edition-lassi)
- [MSLQ y LASSI: evaluar estrategias de aprendizaje](https://learningscientists.org/blog/2024/7/2/digest-174)
- [Probabilistic Models for Computerized Adaptive Testing](https://arxiv.org/pdf/1703.09794)
