# Especificación de ejecución — "Un bucle vivo, listo para campo" (Catedra)

> **Para un agente de código externo.** Este documento es autocontenido: contiene el diagnóstico, las reglas del repo, el mapa de datos y 7 workstreams (W1–W7) con pasos numerados, archivos exactos, qué reutilizar, pruebas y criterios de aceptación. No necesitas la conversación que lo originó. Al final hay apéndices con implementación de referencia (agenda.js), SQL de Supabase y esqueleto de la Edge Function.
>
> **Orden:** ejecuta W1→W7 en orden. Cada workstream se **commitea y despliega** por separado con sus pruebas verdes. No hagas Fase 2.
>
> Fecha de redacción: 2026-10-19. Repo: PWA vanilla JS, sin build. Shell: `app.html` (~2.200 líneas, HTML+CSS+JS). Módulos en `js/*.js` (UMD, probados con `node --test`). Backend: funciones serverless Vercel en `api/*.js`. Nube: Supabase (proyecto `qtcrbzwksivlsasotdlq`), ya conectado en `js/cloud.js`.

---

## 0. Diagnóstico (por qué este trabajo)

El producto tiene ~11 subsistemas construidos y probados, pero **funcionan como islas**: hay mucho, desorganizado, apareciendo en momentos que no son, y sin un diagnóstico que de verdad adapte. Hallazgos verificados en el código:

1. **Diagnóstico recogido pero casi sin usar.** El onboarding NO corre el diagnóstico real de 9 dominios (solo 3 preguntas, `MINI_QUIZ` en `app.html`). De todo el perfil, solo **`S.diag.dom.CON`→duración de bloque** (`getMethodology`, app.html) y **`S.profile.picoProductividad`/`capacidadEnfoque`→hora/duración del plan** (`buildDailyPlan`, app.html) cambian algo. `S.profile.cuando` se escribe en `diag.js` y **no se lee nunca**. `S.diag.history/pulses/answers` y la mayoría de `dom` solo redibujan su propia pantalla. Un usuario recién onboardeado tiene `pico/capacidad/desafío` vacíos → `getMethodology()` cae siempre al default de 30 min.
2. **Dos cerebros de "qué sigue" que divergen.** Hoy usa la cascada de `renderProtagonist()` (app.html); los resúmenes usan `VOICE.nextStep()` (`js/voice.js`). No comparten fuente de verdad. La UI colapsa el exceso con `homeMoreBtn()` por orden de DOM, no por prioridad.
3. **El resultado del examen —la única verdad de campo— no se compara con ninguna predicción.** `submitEvalResult()` (app.html) guarda `e.result={d,feel,prep,nota}` y se manda a la IA como texto subjetivo (`resultados_previos` en `js/coach.js`), pero nada lo contrasta con `SRS.readiness()` (`js/srs.js`) ni con el `dominio` que la app predijo.
4. **Bucles abiertos que la copia promete cerrar.** `js/experiment.js` calcula un veredicto (`won:'test'|'reread'|'tie'`) y su texto promete "de ahora en adelante te pregunto más", pero **no escribe nada** que lo haga; ningún otro módulo lee `S.experiment.won`. `js/hub.js` ("¿Atascado?") es un directorio estático que termina botando al usuario en Materiales **sin registrar nada**.
5. **La app no puede avisar sola.** Cero notificaciones/scheduler (confirmado: ningún uso de Notification API / `showNotification` fuera de node_modules). Toda la lógica de "momento" es *pull*: solo aparece si el estudiante ya abrió la app.

**Resultado buscado:** un ciclo visible y único —diagnóstico que madura con el uso → plan → práctica → medición → re-plan— donde completar una sesión cambia de forma notable lo que la app recomienda y *cuándo* lo dice, con push para los 3 momentos clave, y un solo camino visible en Hoy.

**Decisiones ya tomadas (no re-preguntar):** alcance **enfocado** (no reescritura); diagnóstico **progresivo** (onboarding rápido, el perfil madura con el uso + 2-3 micro-preguntas visuales); **incluir push real** (asumiendo fragilidad en iOS; degradar con elegancia).

---

## 1. Reglas del repo (OBLIGATORIAS)

- **Pruebas verdes siempre.** `node --test tests/*.test.js` debe pasar (hoy **97**). No desplegar con pruebas rotas.
- **Lógica nueva = módulo UMD puro en `js/` + prueba en `tests/`.** `app.html` solo pinta y llama. Patrón UMD (copiar de `js/pack.js`):
  ```js
  (function(root){ /* ... */ const X={fn}; root.X=X; if(typeof module!=='undefined'&&module.exports) module.exports=X; })(typeof window!=='undefined'?window:globalThis);
  ```
- **Cambio de formato de datos** (`S`): subir `STATE_VERSION` (hoy `2`, en app.html) y añadir migración en `normalizeState()` + una prueba con un estado viejo.
- **La IA nunca inventa enlaces ni cifras.** El cliente valida todo lo que devuelve (ver `cleanItems`/`cleanPlan` en `api/ai.js`).
- **Service worker:** al tocar archivos cacheados, subir `VERSION` en `sw.js` (hoy `catedra-v35`). Todo `js/*.js` nuevo va a `PRECACHE` en `sw.js` **y** a los `<script src>` al final de `app.html`.
- **Prohibido por una prueba del repo:** `onclick` con comillas escapadas concatenadas dentro de plantillas. Usar literales de plantilla: `onclick="fn('${id}')"`.
- **Escapar HTML dinámico** con `esc()` antes de interpolar en `innerHTML`.
- **Bitácora:** una entrada en `docs/BITACORA.md` por workstream cerrado (fecha, qué cambió en una frase por punto, hash del commit).
- **Commits** terminan con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Despliegue:** `git push` a `master` → Vercel despliega. Verificar en `https://app-catedra.vercel.app` que carga la versión nueva (Progreso muestra la versión) y que `/api/ai` sigue respondiendo.

---

## 2. Mapa de datos clave (referencia)

| Dato | Se escribe en | Se lee en | Nota |
|---|---|---|---|
| `S.profile.picoProductividad` | `diag.js` diagFinish | `buildDailyPlan`, `habits.js`, profile card | **vacío tras solo-onboarding** |
| `S.profile.capacidadEnfoque` | `diag.js` diagFinish | `getMethodology` | vacío tras solo-onboarding |
| `S.profile.desafio` | `diag.js` diagFinish | `coach.js` (prompt IA) | vacío tras solo-onboarding |
| `S.profile.cuando` | `diag.js` diagFinish | **NADIE** | dato muerto |
| `S.diag.dom.CON` | diag + `learnFromSession` | `getMethodology` (duración) | único efecto real fuerte |
| `S.diag.dom.*` (resto) | diag + `learnFromSession` | solo su propia pantalla | display |
| `item.confidences[]` | `gradeItem` (app.html) | calibración UI, `learnFromSession`(AUT), habits, coach | sí se reutiliza |
| `item.recallScores` / `nextReviewDate` | `scheduleItem`/`gradeItem` | `dueItems`, `coach.digest` (`avgScore`) | la IA lee esto |
| `item.fsrs` (FSRS) | `SRS.review` | `SRS.readiness` → 2 barras de progreso | **la IA NO lo lee** (Fase 2) |
| `e.result={d,feel,prep,nota}` | `submitEvalResult` | `coach.digest`→`resultados_previos` | no se compara con predicción (W4) |
| `S.experiment.won` | `experiment.js` | **NADIE** | cerrar en W5 |
| `S.evlog` | `HAB.log` (toda práctica) | métricas `habits.js`, coach | log universal |

Funciones/firmas que vas a reutilizar (todas existentes):
- `getExamAlerts()`, `allDueCount()`, `dueItems(subject)`, `buildDailyPlan()`, `getMethodology()`, `renderProtagonist()`, `renderHome()`, `homeMoreBtn()`, `submitEvalResult()`, `openEvalResult(sid,eid)` — en `app.html`.
- `VOICE.nextStep(st,today,skip)`, `VOICE.firstWeek(st)`, `VOICE.weekCredit`, `VOICE.weekLine` — `js/voice.js`.
- `SRS.readiness(subject,date)`, `SRS.review(item,score,when)` — `js/srs.js`.
- `STRAT.recommend(ctx)`, `STRAT.personal` — `js/strategies.js`.
- `SP.nextEval(s,today)`, `SP.missingInfo(e)` — `js/space.js`.
- `HAB.status`, `HAB.measure`, `HAB.log` — `js/habits.js`.
- `coach.digest(st,today,c)`, `coachToday()` — `js/coach.js`.
- `cloudFetch`, `cloudSession`, `cloudSync` — `js/cloud.js`.

---

## W1 — Un solo cerebro de "qué sigue" (ranker puro)

**Objetivo:** eliminar la divergencia entre la cascada de Hoy y `VOICE.nextStep`. Crear un único ranker puro que ambos consuman.

**Pasos:**
1. Crear **`js/agenda.js`** con la implementación de referencia del **Apéndice A** (ya está escrita y es correcta: replica exactamente la prioridad de `VOICE.nextStep` como lista ordenada, y añade un candidato `rescate` —examen a ≤1 día— marcado `heroOnly`). Exporta `AGENDA.rank(st,today,{skip})` y `AGENDA.next(st,today,skip)`.
2. En **`js/voice.js`**, reemplazar el **cuerpo** de `nextStep(st,today,skip)` por una delegación:
   ```js
   function nextStep(st,today,skip){
     const c = (root.AGENDA||require('./agenda.js')).next(st,today,skip||[]);
     return c ? {k:c.k, text:c.text, sub:c.sub, fn:c.fn, label:c.label} : null;
   }
   ```
   `AGENDA.next` ya excluye `heroOnly`, así que la salida es **idéntica** a la actual (las pruebas de `tests/voice.test.js` deben seguir verdes sin cambios).
3. Registrar el módulo: añadir `'./js/agenda.js'` a `PRECACHE` en `sw.js`, y `<script src="js/agenda.js"></script>` en `app.html` **antes** de `js/voice.js`. Subir `sw.js` VERSION.
4. Crear **`tests/agenda.test.js`** (ver criterios abajo).

**Reutilizar:** la lógica ya está en `VOICE.nextStep`; no inventar reglas nuevas. `AGENDA` tiene sus propios helpers de fecha (no depende del DOM).

**Pruebas (`tests/agenda.test.js`):**
- Examen a 1 día con ítems ⇒ `rank()[0].k==='rescate'` y `heroOnly===true`.
- Sin material (ningún subject con items) ⇒ existe candidato `add-material`; con todo al día ⇒ el último es `descanso`.
- `skip:['repaso']` ⇒ ningún candidato con `k==='repaso'`.
- Orden determinista: dos llamadas con el mismo estado dan el mismo orden.
- `AGENDA.next(...)` nunca devuelve un `heroOnly`.
- **Regresión:** `tests/voice.test.js` sigue verde sin editar (prueba que la delegación no cambió comportamiento).

**Criterio de aceptación:** Hoy (tras W6) y los resúmenes muestran el mismo "siguiente" para el mismo estado. `node --test tests/*.test.js` verde (99+).

**Commit + deploy.** Bitácora.

---

## W2 — Perfil progresivo (diagnóstico que madura con el uso)

**Objetivo:** llenar `picoProductividad`, `capacidadEnfoque` y `desafio` con el uso (no con un diagnóstico largo al entrar), para que `getMethodology()`/`buildDailyPlan()` dejen de usar el default para todos.

**Pasos:**
1. Crear **`js/profile.js`** (puro) con:
   - `PROFILE.missing(S)` → array de las claves esenciales aún vacías, en orden: `['capacidadEnfoque','picoProductividad','desafio']` (solo las que falten).
   - `PROFILE.capture(S, key, value)` → escribe `S.profile[key]=value` **solo si estaba vacío** (no sobrescribe un valor ya puesto por el diagnóstico completo). Valores válidos: `capacidadEnfoque`∈{10,20,35,45}, `picoProductividad`∈{manana,tarde,noche,madrugada}, `desafio`∈{concentracion,tiempo,nervios,empezar}. Devuelve `true` si escribió.
   - `PROFILE.shouldAsk(S, today)` → `true` si hay alguna `missing` **y** el usuario ya hizo al menos 1 sesión (para no preguntar en el minuto 0) **y** no se preguntó hoy (usar un sello `S.profile._askedDay`).
2. En **`app.html`**, añadir una **tarjeta de contexto** ligera en Hoy (dentro de `renderHome`, como un slot más del héroe/`#home-more`), que aparezca cuando `PROFILE.shouldAsk(S, todayStr())`: UNA pregunta por vez (la primera de `PROFILE.missing`), con chips/íconos (reutilizar el estilo `.chip`/`.chip-row` existente). Al responder: `PROFILE.capture(...)`, sellar `S.profile._askedDay=todayStr()`, `saveState()`, `renderAll()`. Copia breve y cálida (voz de profe, primera persona).
3. En `getMethodology()` y `buildDailyPlan()`: cuando el campo sigue vacío, usar un default **explícito** y que la UI diga "ajusto esto cuando te conozca mejor" en vez de fingir personalización. (No cambiar el default numérico; solo el mensaje y asegurarse de que W2 lo irá llenando.)
4. **Dato muerto `cuando`:** dejar de escribirlo en `diag.js` (quitar la línea que setea `S.profile.cuando`) **o** usarlo en `buildDailyPlan` para el `intention`. Elegir una; documentar en la bitácora. (Recomendado: dejar de escribirlo, es lo mínimo.)
5. `STATE_VERSION`: si añades `_askedDay`/campos, no cambia el shape de forma incompatible (son opcionales, `normalizeState` ya hace merge de `profile`), así que **no** hace falta subir versión salvo que elimines/renombres algo; si quitas `cuando`, añade en `normalizeState` un `delete d.profile.cuando` idempotente y una prueba.

**Reutilizar:** `obsUpdate` (app.html, si encaja para seedear dominios), estilos `.chip`, `getMethodology`, `buildDailyPlan`.

**Pruebas (`tests/profile.test.js`):**
- Tras 3 `capture`, `S.profile` tiene los 3 campos y `PROFILE.missing` queda vacío.
- `capture` no sobrescribe un valor ya presente.
- `shouldAsk` es `false` con 0 sesiones y `true` con ≥1 sesión y campos faltantes; `false` si ya se preguntó hoy.
- Valor inválido ⇒ `capture` devuelve `false` y no escribe.

**Criterio de aceptación:** un usuario que solo hizo onboarding tiene, al 3er día de uso, plan con hora y duración personalizadas sin abrir el diagnóstico de Progreso.

**Commit + deploy.** Bitácora.

---

## W3 — Que el diagnóstico adapte de verdad (pocas señales, visibles)

**Objetivo:** que cambiar el perfil cambie algo **visible**, con el motivo escrito. No usar "todo"; elegir 3-4 señales.

**Pasos:**
1. **Dominio más débil:** función en `js/profile.js` (o `diag.js`) `weakestDomain(S)` → la clave de `S.diag.dom` con menor `est` y `w≥3` (umbral de evidencia), o `null`. En **`js/agenda.js`**, cuando el candidato ganador sea de práctica genérica (`repaso`/`enfoque`), enriquecer su `reason` con el dominio débil (p. ej. "reforzamos autoevaluación"). En el héroe (W6), mostrar ese `reason`.
2. **`AUT`/calibración → autoprueba:** en `js/strategies.js`, `recommend(ctx)` debe aceptar `ctx.sesgo` (p. ej. `{autoprueba:+0.3}` cuando hay sobreconfianza detectada vía `item.confidences` o `S.diag.dom.AUT` bajo) y sumarlo al score de los métodos correspondientes. Si `recommend` ya acepta un sesgo por formato (`FORMATO_METODOS`), extender el mismo mecanismo; no duplicar.
3. **Mantener** `CON`→duración (`getMethodology`) y `pico`→hora (`buildDailyPlan`), pero **mostrar el motivo** en la UI del plan/héroe ("bloques cortos porque te cuesta concentrarte", "a tu mejor hora").
4. El digest del coach ya recibe el perfil declarado (`declarado_por_el_estudiante_pesa_menos`); no cambiar eso.

**Reutilizar:** `STRAT.recommend`, `S.diag.dom`, `item.confidences`, digest del coach.

**Pruebas:**
- `strategies.test.js`: con `ctx.sesgo.autoprueba` alto, `recommend` sube `autoprueba` en el orden.
- `profile.test.js` (o nuevo): `weakestDomain` ignora dominios con `w<3`; devuelve el de menor `est`.

**Criterio de aceptación:** cambiar el perfil cambia de forma observable la recomendación del héroe, con el motivo escrito.

**Commit + deploy.** Bitácora.

---

## W4 — Cerrar el bucle del examen (predicción vs realidad)

**Objetivo:** usar la nota/sensación del examen (la verdad de campo) comparándola con lo que la app predijo.

**Pasos:**
1. En **`app.html` `submitEvalResult()`**: antes de guardar, calcular la predicción del momento y guardarla dentro de `e.result`:
   ```js
   const s = /* subject de la eval */;
   const readiness = (typeof SRS!=='undefined' && SRS.readiness) ? SRS.readiness(s, e.fecha||todayStr()) : null;
   e.result = { d:todayStr(), feel:r.feel, prep:r.prep, nota:(…), prediccion:{ readiness, dominio: /* del digest si hay plan */ } };
   ```
   (Si no hay plan/`dominio`, dejar `dominio:null`.)
2. Crear **`js/examloop.js`** (puro) con `EXAMLOOP.compare(result)` → `{estado:'calibrado'|'sobreestimo'|'subestimo'|'sin_dato', delta, mensaje}`:
   - sin `prediccion.readiness` ⇒ `sin_dato`.
   - readiness alto (≥0.7) y (`feel==='mal'` o `nota` baja) ⇒ `sobreestimo`.
   - readiness bajo (≤0.4) y (`feel==='bien'` o `nota` alta) ⇒ `subestimo`.
   - resto ⇒ `calibrado`. `mensaje` honesto y breve en voz de profe.
3. En `submitEvalResult`, tras guardar, mostrar `EXAMLOOP.compare(e.result).mensaje` (toast o en la pantalla de resultado) en vez del toast genérico.
4. En **`js/coach.js`** (`digest`→`resultados_previos`): incluir `predicho` junto a `real` en cada entrada (`{formato, se_sintio, llego_preparado, nota, predicho_readiness}`). En **`api/ai.js`**, ampliar la regla del prompt de `plan` para que, si `predicho_readiness` alto y resultado malo, lo mencione en `ajuste` ("la práctica no bastó, cambiamos enfoque"). Mantener "no inventes cifras".

**Reutilizar:** `SRS.readiness`, `submitEvalResult`, digest `resultados_previos`.

**Pruebas (`tests/examloop.test.js`):**
- readiness 0.8 + feel 'mal' ⇒ `sobreestimo`.
- readiness 0.3 + nota alta ⇒ `subestimo`.
- sin `prediccion` ⇒ `sin_dato` (no rompe).
- En `coach.test.js`: `resultados_previos` incluye `predicho_readiness` cuando `e.result.prediccion` existe.

**Criterio de aceptación:** registrar una nota produce una reflexión calibrada y el siguiente plan la menciona.

**Commit + deploy.** Bitácora.

---

## W5 — Cerrar experimento y "¿Atascado?" (no mentir en la copia)

**Objetivo:** que el veredicto del experimento y los eventos de "atascado" influyan en lo que sigue; que ninguna copia prometa algo que el código no hace.

**Pasos:**
1. **Experimento** (`js/experiment.js` + `js/coach.js` + `api/ai.js`):
   - Al terminar con `won:'test'`, asegurarse de que `S.experiment.won` queda escrito (ya se calcula; confirmar que persiste). En `coach.digest`, añadir al objeto un campo `experimento_personal` con `won` cuando exista, y en `api/ai.js` (prompt `plan`) una regla: si `experimento_personal.won==='test'`, reconocer "tu propio experimento mostró que recordar te funciona" y priorizar autoprueba.
   - Opcional de bajo costo: si `won==='test'`, sesgar `HAB` a proponer el hábito `predice`/`autoprueba` (reutilizar el mecanismo de propuesta de `habits.js`; no forzar si ya hay hábito activo).
   - Si `won` es `tie`/`reread`, el texto de cierre NO debe prometer "te voy a preguntar más": ajustar la copia en `experiment.js` para no mentir.
2. **¿Atascado?** (`js/hub.js` + `js/agenda.js`):
   - Cuando el usuario abre el hub sobre un tema, registrar `{tema, materia, d:todayStr()}` en un log pequeño `S.stuckLog` (cap 20) — añadir el campo a `defaultState()` y a `normalizeState`.
   - En `js/agenda.js`, añadir un candidato `stuck-followup` (urgencia media, ~45) que, si hay una entrada en `S.stuckLog` de hace ≥1 día sin resolver, surfacee "¿Resolviste *tema*?" con acción de reabrir el hub o marcar resuelto.
   - Mantener el hub como orquestador externo (no cambiar su catálogo), solo que deje rastro.

**Pruebas:**
- `coach.test.js`: con `S.experiment.won==='test'`, el digest incluye `experimento_personal`.
- `agenda.test.js`: con una entrada vieja en `S.stuckLog`, aparece el candidato `stuck-followup`.
- Migración: `normalizeState` con un estado viejo sin `stuckLog` no truena (prueba).

**Criterio de aceptación:** ninguna copia promete adaptación inexistente; experimento y "atascado" influyen en lo que sigue.

**Commit + deploy.** Bitácora.

---

## W6 — Un solo camino visible en Hoy (declutter)

**Objetivo:** una sola decisión obvia en la primera pantalla; el resto plegado.

**Pasos:**
1. En **`renderProtagonist()`** (app.html): obtener `const top = AGENDA.rank(S, todayStr())[0]` y renderizar el héroe a partir de `top` (mapear `top.action`→función: `rescue`/`start-session`→`startSessionFlow`, `open-experiment`→`openExperiment`, `report-exam`→`openEvalResult`, `convert-material`→`goTab('materials')`, `open-focus`→`openFocus`, `review-pending`→`goTab('materials')`, `ask-exam`→`openAsks`, `stuck-followup`→hub, `rest`→tarjeta calma). Mostrar `top.reason` como motivo. Conservar las tarjetas ricas existentes (hábito-veredicto, experimento) cuando el `action` lo indique.
2. Las prácticas (Recordar/Aplicar/Hablar/Simulacro/¿Atascado?) y extras quedan detrás de "Más formas" (ya existe `homeMoreBtn`/`practiceModesHTML`). Revisar que el colapso use el orden del ranker, no el del DOM.
3. Semana viva y lista de materias se quedan. Nada de tarjetas apiladas compitiendo por la decisión.

**Verificación (preview móvil 375px):** Hoy muestra UN protagonista + resto plegado; tras completar una sesión, el protagonista cambia coherentemente.

**Criterio de aceptación:** en la primera pantalla hay una sola decisión obvia, consistente con `VOICE.nextStep`.

**Commit + deploy.** Bitácora.

---

## W7 — Push real para los 3 momentos

**Objetivo:** que la app alcance al estudiante con la app cerrada en: (a) víspera/mañana de examen, (b) repaso del día a su hora pico, (c) hábito que resbala (≥3 días sin estudiar). Se calculan con datos mínimos, sin portar la lógica de los módulos al servidor.

**Infra (reutiliza Supabase ya conectado en `js/cloud.js`):**

1. **Migración `supabase/002_push.sql`** (ver **Apéndice B**): tablas `push_subscriptions` y `reminder_prefs` con RLS por fila propia (patrón idéntico a `user_state` en `supabase/001_user_state.sql`), más el `pg_cron` que invoca la Edge Function. Aplicar en Supabase (SQL Editor o `apply_migration`). Verificar RLS: un anónimo recibe `42501` al escribir y `[]` al leer.
2. **Cliente `js/push.js`** (nuevo): 
   - Constante `VAPID_PUBLIC` (clave pública, se puede incrustar).
   - `pushAsk()` — pedir permiso **tras un momento positivo** (p. ej. después de una sesión completada), no al cargar. Si concede: `reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)})` y subir `{endpoint,p256dh,auth}` a `push_subscriptions` por REST (patrón `cloudFetch` de `js/cloud.js`, con el token de sesión).
   - `pushSyncPrefs()` — en cada `cloudSync` (engancharlo ahí), hacer upsert a `reminder_prefs`: `next_exam_at` (de `SP.nextEval`), `pico_hour` (derivado de `S.profile.picoProductividad`), `tz` (`Intl.DateTimeFormat().resolvedOptions().timeZone`), `last_active_at` (hoy si hubo práctica), `streak`, `enabled`.
   - Degradar: si no hay permiso o el navegador no soporta push, no romper; mantener `exportIcs()` (.ics) y el "momento" in-app.
3. **Service worker `sw.js`:** añadir handlers:
   ```js
   self.addEventListener('push', e => { const d = e.data? e.data.json():{}; e.waitUntil(self.registration.showNotification(d.title||'Catedra', {body:d.body||'', icon:'./assets/icon-192.png', data:{url:d.url||'./app'}})); });
   self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.matchAll({type:'window'}).then(ws=>{ for(const w of ws){ if('focus'in w) return w.focus(); } return clients.openWindow(e.notification.data.url||'./app'); })); });
   ```
   Subir `VERSION`; añadir `js/push.js` a `PRECACHE`.
4. **Edge Function `supabase/functions/send-reminders/index.ts`** (ver **Apéndice C**): Deno + `web-push`. Invocada por `pg_cron` cada hora. Lee `reminder_prefs`⋈`push_subscriptions`, calcula a quién notificar con la **lógica pura reutilizada** (ver paso 5), envía con VAPID (secretos `VAPID_PUBLIC`/`VAPID_PRIVATE`/`VAPID_SUBJECT`), y borra suscripciones que devuelvan 404/410.
5. **Lógica pura compartida `js/reminders.js`** (nuevo, UMD) con `REMINDERS.due(pref, now)` → `'exam-eve'|'exam-morning'|'daily'|'slip'|null`. La Edge Function la porta/importa (puede duplicarse en TS, pero la **fuente de verdad testeada** vive en `js/reminders.js`). Reglas:
   - `exam-eve`: `next_exam_at` entre ahora+12h y ahora+24h.
   - `exam-morning`: mismo día del examen, en la franja de `pico_hour`.
   - `slip`: `last_active_at` ≥ 3 días.
   - `daily`: hora local == `pico_hour` y hay algo que repasar (si no se sabe en el server, enviar suave 1×/día).
6. **PWA/manifest:** confirmar instalable. **iOS: push solo en PWA instalada (16.4+) y es frágil** — documentarlo en la bitácora y en la UI (texto honesto al pedir permiso).

**Pasos que requieren la cuenta del fundador (anótalos en la bitácora como pendientes de él, NO los ejecutes tú):**
- Generar VAPID: `npx web-push generate-vapid-keys`.
- `supabase secrets set VAPID_PUBLIC=… VAPID_PRIVATE=… VAPID_SUBJECT=mailto:soporte@…`.
- Desplegar la Edge Function y crear el `pg_cron` (SQL del Apéndice B).
- Pegar `VAPID_PUBLIC` en la constante de `js/push.js`.

**Pruebas (`tests/reminders.test.js`):** cubrir `REMINDERS.due` para cada caso (`exam-eve`, `exam-morning`, `slip`, `daily`, `null`) con distintos `now`/`tz`. (El envío real se prueba a mano en dispositivo.)

**Criterio de aceptación:** un teléfono con la PWA instalada y permiso recibe aviso de víspera de examen y de "llevas 3 días sin estudiar"; el sistema degrada sin romper donde no hay push.

**Commit + deploy.** Bitácora. Documentar resultado real en iOS.

---

## Fase 2 — NO ejecutar (solo anotar en `docs/ARQUITECTURA.md` como disparadores)

- **Unificar los dos motores de dominio:** hoy FSRS (`srs.js`) y `recallScores`/`consolidationStreak` conviven y la IA lee el más débil (`avgScore` de `recallScores`, no la retrievability de FSRS). Unificar a una sola fuente y un **mapa de dominio por tema/unidad** (hoy agrega solo por materia). Riesgo de migración de datos del piloto → se difiere.
- **Motor de prioridad completo** más allá del ranker de W1.
- **`methodLog` (qué método funciona) dentro del digest del coach.**
- Caché de IA por hash de contenido; cuotas persistentes (hoy en memoria del servidor).

---

## Verificación end-to-end y "listo para campo"

1. `node --test tests/*.test.js` verde con las nuevas suites (`agenda`, `profile`, `examloop`, `reminders` + añadidos en `coach`/`strategies`/`voice`). No bajar de 97 + nuevas.
2. Preview local (`preview_start` name `catedra`, viewport 375px): Hoy con un solo protagonista (W6); tras "estudiar" cambia el siguiente paso (W1); la tarjeta de contexto llena el perfil (W2); registrar un resultado muestra la reflexión calibrada (W4).
3. Supabase: `002_push.sql` aplicado, RLS verificada; Edge Function desplegada; `pg_cron` creado.
4. Push en dispositivo real (Android + iPhone instalado): forzar un envío de prueba, confirmar recepción; documentar iOS.
5. Despliegue por workstream: subir `sw.js` VERSION; `git push master`; confirmar versión nueva y que `/api/ai` responde.
6. Una entrada en `docs/BITACORA.md` por workstream, con el hash.

**Listo para campo:** completar una sesión cambia de forma visible lo que vence, el siguiente paso (único, con motivo), el experimento/hábito y el próximo plan — y la app avisa en los 3 momentos aunque esté cerrada. A partir de ahí el producto es probable con 3–5 estudiantes reales (siguiente paso, no es código).

---

## Apéndice A — `js/agenda.js` (implementación de referencia, usar tal cual)

```js
'use strict';
/* Catedra · Agenda: UN solo cerebro de "qué sigue ahora". Puro (sin DOM), probado en tests/agenda.test.js.
   Antes había dos lógicas que divergían: la cascada del héroe en app.html (renderProtagonist) y
   VOICE.nextStep en voice.js. Ahora ambas consumen AGENDA.rank, que devuelve UNA lista ordenada de
   candidatos. Cada candidato trae un `action` (string) que la UI mapea a la función real, y `fn`
   (el onclick histórico). `heroOnly:true` = solo tarjeta protagonista en Hoy (rescate); nextStep lo excluye. */
(function(root){
  const DAY = 864e5;
  function parse(s){ const p = String(s).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
  function daysTo(today, ds){ return Math.round((parse(ds)-parse(today))/DAY); }
  const faltaInfo = e => { const i=e.info||{}; return !i.formato||i.formato==='nose'||!i.material||i.material==='nose'||(!(e.unitIds&&e.unitIds.length)&&!i.temas); };

  function weekCredit(st, today){
    const d=parse(today); d.setDate(d.getDate()-((d.getDay()+6)%7)); const ws=iso(d), we=addDays(ws,6);
    return (st.focusLog||[]).filter(e=>e.d>=ws&&e.d<=we).reduce((a,e)=>a+(e.credit||0),0);
  }
  function weekLine(credit, goal){
    if(!(goal>0)) return '';
    if(credit>=goal) return 'Tu semilla ya floreció esta semana. Todo lo que sumes ahora es ganancia.';
    const left=goal-credit;
    if(credit===0) return 'Esta semana aún no siembras. Con '+Math.min(15,goal)+' minutos ya empieza a brotar.';
    return 'Te faltan '+left+' min para que tu semilla florezca esta semana.';
  }

  function rank(st, today, opts){
    opts = opts || {}; const skip = opts.skip || []; today = today || iso(new Date());
    const subs = st.subjects || []; const out = [];
    const push = c => { if(!skip.includes(c.k)) out.push(c); };

    let rescue = null;
    for(const s of subs){
      const d = s.examDate ? daysTo(today, s.examDate) : null;
      if(d!==null && d>=0 && d<=1 && (s.items||[]).length){ if(!rescue || d < rescue.d) rescue = { s, d }; }
    }
    if(rescue) push({ k:'rescate', action:'rescue', heroOnly:true, urgency:100, subjectId:rescue.s.id, reason:'examen inminente',
      text:(rescue.d===0?'Hoy':'Mañana')+' tienes examen de '+rescue.s.nombre, sub:'Rescatemos lo esencial: lo más débil primero.',
      fn:"startSessionFlow('"+rescue.s.id+"')", label:'Rescatar' });

    const ex = st.experiment;
    if(ex && ex.phase==='wait' && daysTo(ex.startedAt, today)>=2) push({ k:'experimento', action:'open-experiment', urgency:90, reason:'experimento listo',
      text:'Tu experimento está listo', sub:'Tengo 8 preguntas para ti. En 2 minutos vemos qué te funcionó.', fn:'openExperiment()', label:'Ver' });

    for(const s of subs) for(const e of (s.evals||[])){
      const d = e.fecha ? daysTo(today, e.fecha) : null;
      if(d!==null && d<0 && d>=-21 && !e.result){
        push({ k:'resultado', action:'report-exam', urgency:80, subjectId:s.id, evalId:e.id, reason:'medir resultado real',
          text:'¿Cómo te fue en '+e.nombre+' de '+s.nombre+'?', sub:'Cuéntame en 10 segundos. Así sé si lo que te propongo te está sirviendo.',
          fn:"openEvalResult('"+s.id+"','"+e.id+"')", label:'Contar' }); break;
      }
    }

    const due = subs.map(s=>({ s, n:(s.items||[]).filter(i=>i.nextReviewDate<=today).length })).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)[0];
    if(due) push({ k:'repaso', action:'start-session', urgency:70, subjectId:due.s.id, reason:'repasos vencidos',
      text:'Te tocan '+due.n+' pregunta'+(due.n===1?'':'s')+' de '+due.s.nombre, sub:'Unos '+Math.max(2,Math.round(due.n*0.6))+' min. Si las recuerdas hoy, se te quedan.',
      fn:"startSessionFlow('"+due.s.id+"')", label:'Repasar' });

    const pend = (st.pendingItems||[]).filter(p=>subs.some(s=>s.id===p.subjectId));
    if(pend.length) push({ k:'revisar', action:'review-pending', urgency:60, reason:'preguntas por aprobar',
      text:'Te preparé '+pend.length+' pregunta'+(pend.length===1?'':'s')+' nueva'+(pend.length===1?'':'s'), sub:'Revísalas tú: quédate solo con las que te sirvan.',
      fn:"goTab('materials')", label:'Revisar' });

    const mat = (st.materials||[]).find(m=>m.estado==='recibido'&&subs.some(s=>s.id===m.subjectId));
    if(mat) push({ k:'material', action:'convert-material', urgency:50, reason:'material sin convertir',
      text:'Tengo «'+(mat.titulo||'tu material').slice(0,40)+'» sin convertir', sub:'Dame un minuto y te hago preguntas con eso.',
      fn:"goTab('materials')", label:'Convertir' });

    for(const s of subs) for(const e of (s.evals||[])){
      const d = e.fecha ? daysTo(today, e.fecha) : null;
      if(d!==null && d>=0 && d<=14 && faltaInfo(e)){
        push({ k:'averiguar', action:'ask-exam', urgency:40, subjectId:s.id, evalId:e.id, reason:'armar práctica a medida',
          text:'Cuéntame cómo será '+e.nombre+' de '+s.nombre, sub:'Faltan '+d+' día'+(d===1?'':'s')+'. Con el formato y los temas te armo la práctica a la medida.',
          fn:"openAsks('"+s.id+"','"+e.id+"')", label:'Contarte' }); break;
      }
    }

    const goal = st.focusGoal||90, cr = weekCredit(st, today);
    if(cr<goal && subs.length) push({ k:'enfoque', action:'open-focus', urgency:30, reason:'meta de enfoque',
      text:'Te propongo 15 minutos de enfoque', sub:weekLine(cr,goal), fn:'openFocus()', label:'Enfocarme' });

    if(!subs.some(s=>(s.items||[]).length)) push({ k:'add-material', action:'convert-material', urgency:20, reason:'aún no hay material',
      text:'Pásame el material de tu próxima clase', sub:'Te hago preguntas con él y tú decides cuáles quedan.', fn:"goTab('materials')", label:'Añadir' });

    out.push({ k:'descanso', action:'rest', urgency:0, reason:'al día',
      text:'Por hoy es suficiente', sub:'Volver mañana te rinde más que seguir hoy. Nos vemos.', fn:'', label:'' });

    return out.sort((a,b)=>b.urgency-a.urgency);
  }

  function next(st, today, skip){ return rank(st, today, { skip }).filter(c=>!c.heroOnly)[0]; }

  const AGENDA = { rank, next };
  root.AGENDA = AGENDA;
  if(typeof module!=='undefined' && module.exports) module.exports = AGENDA;
})(typeof window!=='undefined' ? window : globalThis);
```

> **Nota W5:** cuando implementes "¿Atascado?", añade dentro de `rank()` un candidato `stuck-followup` (urgency ~45, entre `material` y `averiguar`) que lea `st.stuckLog`.

---

## Apéndice B — `supabase/002_push.sql`

```sql
-- Catedra · Push: suscripciones y preferencias de recordatorio. RLS por fila propia (como user_state).
create table if not exists public.push_subscriptions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "subs: propio" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.reminder_prefs (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  next_exam_at  timestamptz,
  pico_hour     int,
  tz            text default 'America/Caracas',
  last_active_at timestamptz,
  streak        int default 0,
  enabled       bool not null default true,
  updated_at    timestamptz not null default now()
);
alter table public.reminder_prefs enable row level security;
create policy "prefs: propio" on public.reminder_prefs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- pg_cron: invocar la Edge Function cada hora (requiere extensión pg_cron + pg_net habilitadas).
-- Reemplaza <PROJECT_REF> y usa el service_role solo del lado servidor (nunca en el cliente).
-- select cron.schedule('catedra-reminders', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
--   );
-- $$);
```

---

## Apéndice C — `supabase/functions/send-reminders/index.ts` (esqueleto)

```ts
// Catedra · Edge Function: envía recordatorios push por web-push. Invocada por pg_cron.
// Secretos requeridos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

Deno.serve(async (_req) => {
  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

  const now = new Date();
  const { data: prefs } = await supa.from("reminder_prefs").select("*").eq("enabled", true);
  for (const p of prefs ?? []) {
    const kind = dueFor(p, now); // misma lógica que js/reminders.js (REMINDERS.due)
    if (!kind) continue;
    const msg = messageFor(kind); // {title, body, url:'/app'}
    const { data: subs } = await supa.from("push_subscriptions").select("*").eq("user_id", p.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg));
      } catch (e) {
        if ((e as any).statusCode === 404 || (e as any).statusCode === 410) {
          await supa.from("push_subscriptions").delete().eq("user_id", s.user_id).eq("endpoint", s.endpoint);
        }
      }
    }
  }
  return new Response("ok");
});

// dueFor(pref, now) y messageFor(kind): portar desde js/reminders.js (fuente de verdad testeada).
```
