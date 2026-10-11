# Bitácora de Catedra

Documento maestro: qué se hizo, en qué commit, y por qué. Lo más nuevo arriba. Para detalle técnico de cada tema hay un doc aparte en `docs/product/`.

---

## 2026-10-11 · 🔴 Encontrado: el dominio de producción quedó roto para actualizar la PWA

**Qué pasó:** `catedra-flame.vercel.app` (el dominio que usan el sitemap, el `og:url`, el canonical y la guía de IA) ya **no sirve la app directamente**: devuelve un redirect 307 a `app-catedra.vercel.app`, que es donde Vercel sirve el proyecto ahora.

```
curl -I https://catedra-flame.vercel.app/sw.js
→ 307 → Location: https://app-catedra.vercel.app/sw.js
```

El contenido en `app-catedra.vercel.app` **sí tiene todo lo nuevo** (confirmado: v29, tarjeta del asesor, etc.). El problema es que el navegador **nunca puede instalar un Service Worker nuevo a través de un redirect**: es una regla del estándar, no un bug nuestro. Como `catedra-flame.vercel.app/sw.js` ahora redirige, cualquier PWA instalada desde esa URL (la oficial, la que compartiste) queda congelada para siempre en la última versión que logró instalar antes de que apareciera el redirect — sin importar cuántas veces la cierres, la abras o esperes.

**Por qué pasó:** en Vercel, cuando un proyecto se renombra (o se crea un alias nuevo), el dominio `*.vercel.app` anterior queda como redirect automático al nuevo. Probablemente el proyecto pasó de llamarse "catedra" a "app-catedra" en algún momento en el panel de Vercel.

**Cómo se arregla (2 minutos, en el panel de Vercel, no por código):**
1. Entra a vercel.com → tu proyecto.
2. Settings → Domains.
3. Busca `catedra-flame.vercel.app`. Si aparece como "redirige a" otro dominio, quítale esa redirección y asígnalo como dominio real de este proyecto (botón para añadirlo si no aparece en la lista).
4. Alternativa más simple y definitiva: añade un dominio propio (ej. `catedra.app` o el que tengas) como dominio principal, así esto no depende de los nombres que Vercel genera solo.

**Mientras tanto, para ver los cambios hoy:** abre `https://app-catedra.vercel.app/app` en Safari y añade esa a la pantalla de inicio (el ícono viejo seguirá congelado; hay que instalar uno nuevo desde la URL que sí funciona).

**Qué no toqué:** las URLs en `sitemap.xml`, `robots.txt`, `index.html` (canonical, og:url, JSON-LD) siguen apuntando a `catedra-flame.vercel.app` a propósito — es el dominio indexado y el correcto una vez arreglada la asignación en Vercel. Si prefieres mover todo a `app-catedra.vercel.app` en vez de arreglar el dominio, dímelo y actualizo esas referencias.

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
- **Fix actualización de la PWA:** la app ahora revisa si hay versión nueva al abrirse y al volver de segundo plano, y se recarga sola si estás en Hoy (o avisa si estás en medio de una sesión). *(Este fix no sirve mientras el dominio de producción esté redirigiendo — ver el punto de arriba, 2026-10-11.)*
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
