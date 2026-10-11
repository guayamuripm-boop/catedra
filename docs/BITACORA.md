# Bitácora de Catedra

Documento maestro: qué se hizo, en qué commit, y por qué. Lo más nuevo arriba. Para detalle técnico de cada tema hay un doc aparte en `docs/product/`.

---

## 2026-10-11 (5) · IA confirmada: Groq ok, Gemini ok, fotos con modelo rapido

Autotest: **Groq gpt-oss-120b (548 ms) y gpt-oss-20b (113 ms) ok**, **gemini-3.5-flash-lite ok**, OpenRouter 429 (limite temporal, solo respaldo). `gemini-3.8-flash` dio timeout a los 12 s incluso con una prueba minima: demasiado lento para fotos.
- Transcripcion de fotos: primero `gemini-3.5-flash-lite` (rapido, tambien lee imagenes), `gemini-3.8-flash` como respaldo.
- Pendiente: probar una foto de apuntes real.

---

## 2026-10-11 (4) · IA funcionando: Gemini ok, Groq con modelos nuevos

Autotest tras el arreglo anterior: **Gemini `gemini-3.5-flash-lite` ok** (la app ya genera preguntas y planes), OpenRouter con límite temporal (429, se resuelve solo y sirve de respaldo), `gemini-3.8-flash` (fotos) dio `bad_model_output` con solo 20 tokens de prueba, probablemente porque razona antes de responder. Groq mostró su lista real: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` (ya no existe llama-3.x).
- Groq por defecto: `openai/gpt-oss-120b` (principal) y `openai/gpt-oss-20b` (rápido), con `reasoning_effort: low`.
- Margen de +500 tokens para modelos que razonan (gpt-oss, qwen3, gemini-3) para que no corten el JSON; el autotest usa 60 tokens en vez de 20.
- Pendiente de confirmar: autotest de nuevo para ver Groq ok y si las fotos (gemini-3.8-flash) transcriben.

---

## 2026-10-11 (3) · fix: las 3 IA fallaban con error 404 — causa real: modelos vencidos

**Síntoma:** el usuario dijo que la IA estaba "medio chimborra". El autotest (`/api/ai?check=1&c=CODIGO`) daba `upstream_404` en las 5 rutas (Groq ×2, OpenRouter, Gemini ×2).

**Primer intento (descartado):** se pensó que `GROQ_BASE_URL`/`OPENROUTER_BASE_URL`/`GEMINI_BASE_URL` tenían una URL mal pegada en Vercel, porque un 404 idéntico en 3 proveedores distintos, en <110 ms, no parece una llamada real. Se blindó el código para tolerar ese error de todos modos (`cleanBase()` en `api/ai.js`), pero el autotest siguió igual: no era la causa.

**Causa real, confirmada con el modo debug (`&debug=1`, añadido para esto):** las claves sí son válidas y sí llegan a los 3 proveedores — el 404 es la respuesta *real* de cada uno diciendo que el modelo pedido ya no existe:
- Groq: `llama-3.3-70b-versatile` y `llama-3.1-8b-instant` → "does not exist or you do not have access to it".
- OpenRouter: `meta-llama/llama-3.3-70b-instruct:free` → dejó de ser gratis; sugiere la versión de pago.
- Gemini: `gemini-2.5-flash-lite` y `gemini-2.5-flash` → "no longer available to new users"; **la propia API dijo el reemplazo**: `gemini-3.5-flash-lite` y `gemini-3.8-flash`.

Normal: los proveedores retiran modelos cada cierto tiempo y el código llevaba meses con esos nombres.

**Arreglo:**
- Gemini: modelos por defecto actualizados a los que la propia API de Google indicó (autoridad directa, de hoy).
- OpenRouter: se consultó su catálogo público de modelos gratuitos vigente hoy (`GET /api/v1/models`, sin necesitar clave) y se puso `google/gemma-4-31b-it:free` como nuevo valor por defecto.
- Groq: su catálogo cambia seguido y consultarlo necesita clave — en vez de adivinar un nombre que podría volver a vencer, el modo debug ahora, cuando un modelo de Groq da 404, **le pregunta a Groq mismo cuáles tiene disponibles con la clave real** y los lista en `debug.available`. Si el modelo por defecto vuelve a fallar, el usuario pone el que le aparezca ahí en `GROQ_MODEL` (Vercel → Environment Variables), sin tocar código.
- `.env.example` actualizado con los nuevos valores y la instrucción de cómo revisarlo si vuelve a pasar.

**Para que no vuelva a sorprender:** si en el futuro la IA deja de responder, correr `https://app-catedra.vercel.app/api/ai?check=1&debug=1&c=CODIGO` dice exactamente cuál proveedor falla y por qué, sin tener que adivinar.

---

## 2026-10-11 (2) · fix: todo el sitio apunta ya a app-catedra.vercel.app

**Qué se hizo:** por pedido del usuario, se reemplazó `catedra-flame.vercel.app` por `app-catedra.vercel.app` en todos los archivos que lo mencionaban como URL: `sitemap.xml`, `robots.txt`, `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD), `app.html` (og:url), `acerca.html` (canonical), `llms.txt`, y los docs de producto que lo citaban (`guia-encender-ia.md`, `guia-lanzamiento-gratis.md`, `arquitectura-y-escala.md`, `como-funciona-y-tu-parte.md`, `informe-maestro-2026-10-09.md`, `pegar-en-vercel.txt`). El punto de 2026-10-11 de más abajo queda tal cual (es el registro de lo que pasó, no hay que "corregirlo").

**Para tu iPhone:** el ícono viejo en la pantalla de inicio sigue apuntando a `catedra-flame.vercel.app`, que seguirá redirigiendo y congelado. No hace falta borrarlo con prisa: solo
1. Abre Safari → `https://app-catedra.vercel.app/app`
2. Botón compartir → "Añadir a pantalla de inicio"
3. Usa ese ícono nuevo de ahora en adelante; el viejo lo borras cuando quieras (mantener presionado → Eliminar app), no antes.

**Pendiente, fuera del código:** en el panel de Vercel, revisa Settings → Domains del proyecto y confirma cuál es el dominio "Production" real. Si quieres que `catedra-flame.vercel.app` vuelva a funcionar algún día (por ejemplo si ya está indexado en Google), hay que arreglarlo ahí; si no, no hace falta tocar nada más — ya todo el sitio usa el dominio que sí funciona.

---

## 2026-10-11 · 🔴 Encontrado: el dominio de producción quedó roto para actualizar la PWA

**Qué pasó:** `catedra-flame.vercel.app` (el dominio que usan el sitemap, el `og:url`, el canonical y la guía de IA) ya **no sirve la app directamente**: devuelve un redirect 307 a `app-catedra.vercel.app`, que es donde Vercel sirve el proyecto ahora.

```
curl -I https://catedra-flame.vercel.app/sw.js
→ 307 → Location: https://app-catedra.vercel.app/sw.js
```

El contenido en `app-catedra.vercel.app` **sí tiene todo lo nuevo** (confirmado: v29, tarjeta del asesor, etc.). El problema es que el navegador **nunca puede instalar un Service Worker nuevo a través de un redirect**: es una regla del estándar, no un bug nuestro. Como `catedra-flame.vercel.app/sw.js` ahora redirige, cualquier PWA instalada desde esa URL (la oficial, la que compartiste) queda congelada para siempre en la última versión que logró instalar antes de que apareciera el redirect — sin importar cuántas veces la cierres, la abras o esperes.

**Por qué pasó:** en Vercel, cuando un proyecto se renombra (o se crea un alias nuevo), el dominio `*.vercel.app` anterior queda como redirect automático al nuevo. Probablemente el proyecto pasó de llamarse "catedra" a "app-catedra" en algún momento en el panel de Vercel.

**Decisión tomada (ver entrada de arriba):** en vez de pelear con el redirect en Vercel, se movió todo el sitio a `app-catedra.vercel.app`, que es el dominio que sí sirve contenido fresco.

---

## 2026-10-10 noche · fix: la app ocupa toda la pantalla y se ve menos amontonada
**Commit:** `7197772`
- La app medía menos que la pantalla del iPhone y dejaba un vacío oscuro bajo la barra de pestañas. Se cambió `.app-shell` a posición fija ocupando toda la ventana.
- Más espacio entre la tarjeta grande y el botón de enfoque.
- "Tu primera semana" ahora aparece antes que el mensaje suelto de Catedra (le sirve más a quien recién empieza).

## 2026-10-10 tarde · feat: asesor con IA + Hoy reordenado + fixes de PWA
**Commit:** `b608684`
- **Asesor con IA:** nuevas tareas del servidor `plan` (arma un plan semanal a partir de tus datos reales: dominio por materia, acierto, recuerdo, días de práctica) y `digest` (resume un material, saca ideas clave con cita verificada, arma sesiones de estudio y 3 casos de la vida diaria). Código: `api/ai.js`, `js/coach.js`. El modelo nunca inventa enlaces: solo propone qué buscar y Catedra arma la búsqueda real.
- **Bucle de medición:** cada plan guarda su línea base; al pedir el siguiente, la IA recibe qué se cumplió y si cada métrica mejoró, y ajusta.
- **Hoy reordenado:** estudiar es lo primero (antes quedaba debajo de varias tarjetas); los 5 modos de practicar (Recordar, Aplicar, Hablar, Simulacro, ¿Atascado?) ahora están a la vista en vez de detrás de un enlace; solo se muestra una tarjeta de apoyo a la vez con "Ver N más para ti".
- **Fix franja blanca en iPhone:** faltaba `viewport-fit=cover` en el viewport y un fondo fijo en `html`.
- **Fix actualización de la PWA:** la app ahora revisa si hay versión nueva al abrirse y al volver de segundo plano, y se recarga sola si estás en Hoy (o avisa si estás en medio de una sesión).
- Pruebas: `tests/coach.test.js` nuevo, `tests/ai.test.js` ampliado. 82 pasan.
- Documento con propuestas evaluadas: `docs/product/asesor-ia-propuestas.md`.

## 2026-10-09 · feat: estructura lista para encender IA + descubribilidad
**Commit:** `c63f033`
- `.env.example` con la lista de variables y guía paso a paso (`docs/product/guia-encender-ia.md`).
- `sitemap.xml`, `robots.txt` (con bots de IA permitidos), JSON-LD (WebApplication/FAQ), canonical y tarjetas sociales en la landing, para que buscadores e IAs encuentren y entiendan la app.

## 2026-10-08 noche · fix: landing en index.html, app en /app
**Commit:** `638145f`
- Vercel prioriza archivos sobre reescrituras: la landing pasó a ser `index.html` directamente y la app se sirve en `/app` → `app.html`.

## 2026-10-08 · feat: estrategias por área de materia + puente "para qué me sirve"
**Commit:** `b421fd0`
- Métodos de estudio distintos según el área (números, química, ciencias, lengua, sociales), con evidencia citada (`js/areas.js`, `js/strategies.js`).
- "Puente": el estudiante escribe para qué le sirve el tema (el propio estudiante lo escribe, no se le sugiere primero — así ayuda más, según Canning y Harackiewicz 2015).
- Preguntas de aplicación por área en la IA (`api/ai.js`).

## 2026-10-08 · feat: Catedra habla como un profe (primera persona)
**Commit:** `7cdfa62`
- Voz reescrita: burbujas, respuestas de un toque, "ahora no" (`js/tutor.js`).
- Experimento y ¿Atascado? como conversación en vez de formularios.

## 2026-10-08 · feat: experimento de 48 h + centro ¿Atascado?
**Commit:** `4fa0ecd`
- Compara releer contra recordar con los datos propios del estudiante, en 48 h (`js/experiment.js`).
- ¿Atascado? orquesta tutores de IA, NotebookLM, video y personas en vez de competir con ellos (`js/hub.js`).
- Evaluación de realidad y guía del MVP (`docs/product/evaluacion-realidad-mvp.md`).

## 2026-10-05/06 · base del rediseño
**Commit:** `3b2e3c8` y anteriores
- Siguiente paso de un toque tras cada sesión, camino de la primera semana, voz con progreso real.

---

### Cómo mantener esta bitácora
Cada vez que se cierre un cambio importante (no cada commit chico), se añade una entrada arriba con: fecha, qué cambió en una frase por punto, el hash del commit, y el archivo de detalle si existe en `docs/product/`.
