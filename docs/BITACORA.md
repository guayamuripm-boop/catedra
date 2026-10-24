# Bitácora de Catedra

Documento maestro: qué se hizo, en qué commit, y por qué. Lo más nuevo arriba. Para detalle técnico de cada tema hay un doc aparte en `docs/product/`.

---

## 2026-10-23 · feat: avisos push probados de punta a punta, icono corregido y mensajes variados ("racha")
**Probado con el fundador en producción:** cuenta creada, VAPID desplegado, suscripción del celular confirmada en `push_subscriptions`, y un aviso real llegó al teléfono tras forzar las condiciones (`?debug=1&now=...` en la Edge Function). En el camino se corrigieron dos confusiones reales que habrían hecho perder tiempo a cualquiera: `current_date` en SQL usa la fecha UTC del servidor, no la del estudiante (hay que calcular "hoy"/"ayer" con `(now() at time zone tz)::date`); y la ventana de avisos (8–20 hora local) es así a propósito, no se puede probar pasadas las 20h sin simular la hora.
**Diagnóstico en la función** (`supabase/functions/send-reminders/index.ts`): `?debug=1` devuelve, por estudiante, si le tocaba aviso y por qué no si no le tocó, y el error real de cada intento de envío (antes fallaba en silencio). `?debug=1&now=ISO` además simula la hora, para probar sin esperar al cron. Nunca se activa sin el `CRON_SECRET`.
**Icono:** el ícono "maskable" tenía el texto "Ca" pegado a los bordes — al recortarlo en círculo (Android) se cortaba. Se recentró dentro de la zona segura (66% central). Se añadió una insignia monocroma (`assets/badge-96.png`, `badge-128.png`): antes la notificación usaba el ícono a color completo como insignia de la barra de estado, que Android no tiñe y se ve como un cuadrado gris; ahora es una "C" blanca sobre transparente, pensada para leerse a tamaño diminuto.
**Mensajes más variados, menos "pesados":**
- Nuevo tipo de aviso **"racha"**: si el estudiante lleva 2+ días seguidos y hoy aún no practica, el aviso (mismo horario y mismo tope de uno al día que ya existía) dice "no rompas tu racha de N días" en vez del genérico "tu repaso de hoy". Con menos de 2 días, sigue como "daily".
- Cada tipo de aviso tiene 2–3 variantes de texto que rotan por fecha (mismo día = mismo texto, para que un reintento del cron no cambie el mensaje; otro día = probablemente otro). Nada de azar real ni de enviar más veces: sigue siendo un aviso al día como máximo.
- `supabase/002_push.sql`: columna `streak` (con `add column if not exists`, no pierde datos si ya existía la tabla). `js/push.js`: `streakChain()` calcula la racha hasta el último día que estudió (aunque hoy aún no haya practicado) y la sube en cada sincronización.
- Tests: 164 (antes 160). Nuevas: racha vs. diario, variedad de mensajes estable por día, `streakChain`.
**Pendiente del fundador:** re-desplegar la función (`supabase functions deploy send-reminders --no-verify-jwt`) y volver a correr `supabase/002_push.sql` (agrega la columna `streak` sin tocar lo que ya había).
`sw.js` → `catedra-v43`.

## 2026-10-22 · feat: Ajustes a un toque, Progreso en bento, auditoría de todas las pantallas y avisos listos para encender
**Experiencia de usuario**
- **Ajustes en una pantalla propia** (`view-settings`), a un toque desde un avatar con la inicial del estudiante (arriba a la derecha en Hoy y Progreso, y botón al final de Progreso). Agrupa: nombre editable; **Cómo estudias** (concentración, hora en que rinde, qué le cuesta — editables siempre, y muestra el método resultante); cuenta y avisos; recordatorios de calendario; tus datos (respaldar, restaurar, copiar resultados, borrar, en mosaicos); privacidad (interruptor); la app (versión, buscar actualización, IA). Se movieron los mismos elementos (mismos `id`), así que respaldo, cuenta, IA y privacidad siguen conectados.
- **Progreso en "bento"**: una pieza grande (preguntas + barra de consolidadas) y dos chicas (racha, minutos/sesiones). Se quitó la sección "Hábitos" (repetía esos números) y "Tus datos" (ahora en Ajustes). Materias sin repasos dicen "sin medir" en vez de "0%".
- **Héroe de Hoy**: si aún no hay repasos medidos, muestra el número de preguntas por repasar hoy en vez de un "0%" desalentador.
- **Encuesta programada**: ya no salta como hoja al abrir la app; se ofrece en línea en el resumen al terminar una sesión (`surveyScheduledInline`, con prueba).
- Biblioteca: filtros en una fila deslizable (antes ocupaban 3 renglones). Cambiar de pestaña cierra cualquier hoja abierta.
- Legibilidad y toque: nada por debajo de 10.5–11 px; botones de volver/cerrar, chips, selector de evaluación y pestañas de modo con ≥ 40 px de alto.
**Arreglos**
- La versión de la app **nunca se mostraba**: la expresión `/^catedra-vd+/` había perdido la barra (`\d`).
**Auditoría** (`.dev/audit.js`, local): 26 pantallas y hojas (pestañas, Ajustes, 7 hojas, enfoque, energía, sesión, resumen, recordar, aplicar, hablar, diagnóstico, nota, importar, onboarding) en 320, 360, 390, 768, 1280 y 740×360 horizontal: **0 errores de JavaScript, 0 desbordes, 0 textos cortados**. Único aviso aceptado: el enlace "política de privacidad" dentro de una frase (excepción de las pautas de accesibilidad para enlaces en línea).
**Activación**
- **Avisos push**: claves VAPID generadas con `node:crypto` (sin descargar nada; par verificado firmando y comprobando). La pública va en `js/push.js`; la privada y un `CRON_SECRET` en `.dev/SECRETOS-avisos.txt` (excluido de git) con los comandos rellenados. **Auto-encendido**: la app solo ofrece avisos cuando existe la tabla `push_subscriptions` (sondeo a Supabase), así nunca aparece un botón roto. Guía: `docs/product/guia-activar-avisos.md`.
- **Medición apagada en producción** (`analytics:false`, falta `POSTHOG_KEY`): sin eso no llegan eventos, errores ni encuestas. Pendiente del fundador.
- Lista completa de pendientes del fundador: `docs/product/checklist-fundador.md`.
**Rendimiento y calidad**: con red lenta el service worker abre la copia guardada a los 3 s (antes 5). `npm run check` revisa la sintaxis de los 30 archivos (antes 2). Pruebas: 160. `sw.js` → `catedra-v42`.
Generar claves de nuevo: `node -e "const c=require('crypto'),{publicKey:p,privateKey:k}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'}),j=p.export({format:'jwk'});console.log(Buffer.concat([Buffer.from([4]),Buffer.from(j.x,'base64url'),Buffer.from(j.y,'base64url')]).toString('base64url'),k.export({format:'jwk'}).d)"`

## 2026-10-22 · fix: revisión y reparación del trabajo W1–W7 de un agente externo
Se revisó el código de los 8 commits (`7e20bae`…`672c8c0`) leyéndolo y ejecutándolo en el navegador, no solo con las pruebas (145 pasaban y aun así había fallos reales: las pruebas solo cubrían lógica pura, no su conexión con la interfaz).
**Fallos encontrados y reparados:**
- **Hoy (W6) perdió funciones.** La nueva `renderProtagonist` dejó de mostrar la tarjeta de hábitos (`renderHabitCard` ya no se llamaba desde ningún sitio) y el plan de la IA (`coachToday`) dejó de mandar en el protagonista. Se reescribió con un helper (`heroCard`) en vez de 9 ramas copiadas, se restauró la tarjeta "para ti" y el plan entra al ranker como candidato (`opts.coach`, `AGENDA` sigue puro). El rescate de examen vuelve a cubrir hasta 2 días.
- **Pregunta de perfil imposible de responder (W2).** El chip mandaba `'10'` (texto, desde el `onclick`) y `PROFILE.capture` exigía el número `10`: la primera pregunta nunca se guardaba y la tarjeta se repetía para siempre. Ahora `capture` convierte el texto. Además la tarjeta estaba en el último lugar del bloque plegable "Ver más" y casi nunca se veía; pasa al primero.
- **"¿Atascado?" nunca guardaba nada (W5).** Intentaba leer el tema justo al abrir la hoja, cuando el campo está vacío. Ahora se registra al usar una herramienta (una entrada por tema y día), se puede cerrar ("Ya lo resolví" / "Ya lo entendí") y el seguimiento caduca a los 14 días (antes habría aparecido para siempre).
- **Bucle del examen (W4).** La predicción se calculaba pasando la fecha como texto a ts-fsrs (que espera `Date`), y la nota se leía como sobre 10 (la app pide "15/20", escala de 20; "3/5" contaba como reprobado). Ahora la nota solo cuenta con su escala ("a/b"); un número suelto no decide nada. La predicción solo existe si hubo repasos reales.
- **Señales del diagnóstico (W3) sin conectar.** `STRAT.recommend` aceptaba `sesgo` pero nadie lo pasaba; ahora `PROFILE.sesgo` (sobreconfianza o autoevaluación baja ⇒ más autoprueba) se pasa desde el enfoque. La app dice cuando usa valores por defecto.
- **Push (W7) no funcionaba y habría hecho spam.** El cliente llamaba a rutas `/api/...` inexistentes (nunca guardó una suscripción), usaba `window.S`/`cloudSession` (los `let`/`const` de script no cuelgan de `window`), pedía permiso con una clave de relleno y en cada sesión; el servidor avisaba **cada hora** (sin tope diario), de madrugada, con las zonas horarias mezcladas, comparando una marca de tiempo UTC con una hora local; y la Edge Function en TypeScript tenía funciones sin tipos y ninguna autenticación. Se rehízo: lógica única en `supabase/functions/send-reminders/reminders.js` (1 aviso por día, solo 8–20 h locales, zonas con `Intl`), función con `CRON_SECRET`, tablas con fechas locales y `last_sent_*`, cliente `js/push.js` con invitación de un toque (necesita cuenta) y fila en Progreso, y el estado de avisos es por dispositivo (no viaja en la sincronización). Se eliminó `js/reminders.js` del navegador.
- `sw.js` se restauró a su formato (el agente le borró comentarios y reformateó código que no tocaba) dejando solo lo añadido; `catedra-v40`.
**Pruebas:** 159 (antes 145). Nuevas: `reminders` (10, zonas horarias reales), `push` (6), `examloop` reescrita (7), y casos de `agenda`/`profile` para cada fallo anterior.
**Pendiente del fundador:** activar los avisos (claves VAPID, secretos, función, cron). Guía paso a paso en `docs/product/guia-activar-avisos.md`. Hasta entonces la app no muestra ningún control de avisos.
**Nota:** la entrada W7 siguiente describe la primera versión (reemplazada por esta).

## 2026-10-19 · W1: Un solo cerebro de "qué sigue" (AGENDA ranker)
- **Problema:** dos lógicas divergentes para "qué sigue": la cascada de `renderProtagonist()` en `app.html` y `VOICE.nextStep()` en `js/voice.js`. No compartían fuente de verdad y la UI colapsaba el exceso por orden de DOM, no por prioridad.
- **Solución:** crear `js/agenda.js` (módulo UMD puro) con `AGENDA.rank(st,today,opts)` y `AGENDA.next(st,today,skip)` que replican exactamente la prioridad de `VOICE.nextStep` y añaden candidato `rescate` (examen ≤1 día) marcado `heroOnly`. `VOICE.nextStep` pasa a ser una delegación fina a `AGENDA.next`.
- `js/agenda.js` registrado en `sw.js` (PRECACHE) y `<script>` en `app.html` antes de `voice.js`. `sw.js` VERSION → `catedra-v36`.
- Pruebas: `tests/agenda.test.js` (16 pruebas: rescate heroOnly, add-material, descanso, skip, determinismo, next nunca heroOnly, y cada urgencia). Regresión: `tests/voice.test.js` verde sin cambios.
- Commit: `7e20bae`. 113 pruebas pasan (97 originales + 16 nuevas).

## 2026-10-19 · W2: Perfil progresivo (diagnóstico que madura con el uso)
- **Problema:** tras onboarding rápido (3 preguntas MINI_QUIZ), `picoProductividad`, `capacidadEnfoque` y `desafio` quedan vacíos → `getMethodology()` y `buildDailyPlan()` usan defaults para todos. Dato muerto `cuando` se escribía en `diag.js` y nadie lo leía.
- **Solución:** `js/profile.js` (UMD) con `PROFILE.missing/capture/shouldAsk` → micro-preguntas visuales en Hoy (1 a la vez, chips) tras ≥1 sesión y no preguntado hoy. `capture` no sobrescribe; `shouldAsk` usa sello `_askedDay`.
- `getMethodology()` y `buildDailyPlan()` devuelven `defaultUsed` cuando el campo está vacío; la UI puede mostrar "ajusto esto cuando te conozca mejor".
- Eliminar `S.profile.cuando` en `diag.js` (línea 191) + migración idempotente `delete d.profile.cuando` en `normalizeState`.
- `sw.js` VERSION → `catedra-v37`, `profile.js` en PRECACHE y `<script>`.
- Tests: `tests/profile.test.js` (7 pruebas: 3 captures llenan perfil, no sobrescribe, shouldAsk con/sin sesiones y _askedDay, valor inválido no escribe). 119 pruebas pasan.
- Commit: `439791c`.

## 2026-10-19 · W3: Que el diagnóstico adapte de verdad (pocas señales, visibles)
- **Problema:** el diagnóstico (9 dominios) se recogía pero casi no cambiaba nada visible. Solo `CON→duración` y `pico→hora` tenían efecto real.
- **Solución:** tres señales visibles y accionables:
  1. `PROFILE.weakestDomain(S)` → dominio con menor `est` y `w≥3` (umbral de evidencia). En `js/agenda.js`, los candidatos `repaso` y `enfoque` enriquecen su `reason` ("reforzamos autoevaluación").
  2. `STRAT.recommend(ctx)` acepta `ctx.sesgo` (p.ej. `{autoprueba:+0.3}` por sobreconfianza detectada vía `item.confidences` o `AUT` bajo) y lo suma al score del método correspondiente.
  3. Mantener `CON→duración` (`getMethodology`) y `pico→hora` (`buildDailyPlan`), pero mostrar el motivo en la UI ("bloques cortos porque te cuesta concentrarte", "a tu mejor hora").
- Tests: `profile.test.js` (4 tests weakestDomain), `strategies.test.js` (2 tests sesgo), `agenda.test.js` (3 tests reason con dominio débil). 128 pruebas pasan.
- Commit: `17461d4`.

## 2026-10-19 · W4: Cerrar el bucle del examen (predicción vs realidad)
- **Problema:** el resultado del examen (verdad de campo) se guardaba pero no se comparaba con la predicción de la app (SRS.readiness). El coach lo mandaba a la IA como texto subjetivo sin contraste.
- **Solución:**
  1. `js/examloop.js` (UMD) con `EXAMLOOP.compare(result)` → estados: `calibrado`, `sobreestimo` (readiness≥70 + feel mal/nota baja), `subestimo` (readiness≤40 + feel bien/nota alta), `sin_dato`.
  2. `submitEvalResult()` calcula `SRS.readiness` y `dominio` del plan antes de guardar en `e.result.prediccion`.
  3. Toast muestra reflexión calibrada (p.ej. "La app pensaba que ibas bien (80%) pero te fue mal. La práctica no bastó: cambiemos el enfoque").
  4. `js/coach.js`: `resultados_previos` incluye `predicho_readiness` cuando existe.
  5. `api/ai.js`: prompt de plan detecta `predicho_readiness` alto + resultado malo → "la práctica no bastó, cambiamos enfoque".
- Tests: `tests/examloop.test.js` (7 pruebas: sobreestimo, subestimo, calibrado, sin_dato, bordes). 135 pruebas pasan.
- Commit: `f456216`.

## 2026-10-19 · W5: Cerrar experimento y "¿Atascado?" (no mentir en la copia)
- **Problema:** el experimento calculaba `won` ('test'|'reread'|'tie') pero no lo persistía ni lo usaba; la copia prometía "te voy a preguntar más" incluso en empate/derrota. El hub "¿Atascado?" no dejaba rastro.
- **Solución:**
  1. `js/experiment.js`: persistir `S.experiment.won` al terminar; ajustar copia del resultado según `won` (solo 'test' promete preguntar más).
  2. `js/coach.js`: digest incluye `experimento_personal: {won}` cuando existe.
  3. `api/ai.js`: prompt de plan detecta `experimento_personal.won==='test'` → "tu propio experimento mostró que recordar te funciona" y prioriza autoprueba.
  4. `js/hub.js`: al abrir hub sobre un tema, registrar `{tema, materia, d}` en `S.stuckLog` (cap 20).
  5. `js/agenda.js`: candidato `stuck-followup` (urgency 45, entre material y averiguar) si hay entrada en `stuckLog` de hace ≥1 día.
  6. `app.html`: `stuckLog` en `defaultState` (migración automática en `normalizeState`).
- Tests: `agenda.test.js` (3 tests stuck-followup). 138 pruebas pasan.
- Commit: `7242d9e`.

## 2026-10-19 · W6: Un solo camino visible en Hoy (declutter)
- **Problema:** la cascada de `renderProtagonist()` tenía 6-7 branches que competían; el "Más formas" colapsaba por orden DOM, no por prioridad del ranker.
- **Solución:** reescribir `renderProtagonist()` para usar `AGENDA.rank(S, todayStr())[0]` como única fuente. Mapeo de 10 actions (rescue, open-experiment, report-exam, start-session, review-pending, convert-material, ask-exam, open-focus, stuck-followup, rest) a su tarjeta de héroe. El `reason` del ranker se muestra como chip de motivo. Las tarjetas de hábito/experimento en `home-foryou` se mantienen (veredicto > experimento listo > hábito activo). Prácticas y extras quedan detrás de "Más formas" usando orden del ranker.
- Tests: regresión completa (138 pruebas pasan).
- Commit: `465ced2`.

## 2026-10-19 · W7: Push real para los 3 momentos
- **Problema:** la app no puede avisar sola; toda la lógica de "momento" es pull (solo aparece si el estudiante abre la app). Cero notificaciones.
- **Solución:** push real (Web Push + VAPID) para 3 momentos: (a) víspera/mañana de examen, (b) repaso a hora pico, (c) hábito que resbala (≥3 días sin estudiar).
  1. `supabase/002_push.sql`: tablas `push_subscriptions` + `reminder_prefs` con RLS por fila propia + pg_cron comentado.
  2. `js/push.js`: `VAPID_PUBLIC` (constante, fundador pega su clave); `pushAsk()` pide permiso **tras sesión completada** (no al cargar); `pushSyncPrefs()` upsert en `reminder_prefs` en cada `cloudSync`; degradación elegante (si no hay permiso/navegador no soporta, no rompe; mantiene `.ics`).
  3. `js/reminders.js`: `REMINDERS.due(pref,now)` lógica pura → `'exam-eve'|'exam-morning'|'daily'|'slip'|null` (fuente de verdad testeada).
  4. `tests/reminders.test.js`: 8 tests cubriendo cada caso.
  4. `sw.js`: handlers `push`/`notificationclick` + `VERSION catedra-v39` + `push.js`/`reminders.js` en PRECACHE.
  5. `app.html`: `<script src="js/push.js">` + `<script src="js/reminders.js">`.
  6. `supabase/functions/send-reminders/index.ts`: Deno + `web-push`, importa lógica de `reminders.js`, envía y limpia subs 404/410.
- **Pendientes del fundador (NO ejecuto yo):**
  1. `npx web-push generate-vapid-keys` → genera VAPID_PUBLIC/VAPID_PRIVATE.
  2. `supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:soporte@...`.
  3. Desplegar Edge Function (`supabase functions deploy send-reminders`) y crear `pg_cron` (SQL en `002_push.sql`).
  4. Pegar `VAPID_PUBLIC` en `js/push.js` línea 10.
- iOS: push solo en PWA instalada (16.4+) y es frágil — documentado en bitácora y UI (texto honesto al pedir permiso).
- Tests: `tests/reminders.test.js` (8 tests). 145 pruebas pasan (97 originales + 48 W1-W7).
- Commit: `672c8c0`.

## 2026-10-17 · feat: cuentas y sincronización entre dispositivos (Supabase)
- **Problema:** cada navegador guardaba sus propios datos; el iPhone y el PC se veían distintos.
- **Proyecto Supabase propio de Catedra** (cuenta nueva, separada de los otros productos). Tabla `public.user_state` (una fila por estudiante: `state jsonb`, `version`, `updated_at`) con RLS: cada quien solo lee/escribe su fila (`supabase/001_user_state.sql`). Verificado: un acceso anónimo recibe `42501` al insertar y `[]` al leer.
- **Inicio de sesión: correo + contraseña** (Progreso > Tus datos). Se descartó el código por correo porque el SMTP por defecto de Supabase no permite editar la plantilla (sin `{{ .Token }}`) y limita los envíos; el enlace mágico abriría el navegador y no la PWA instalada en iPhone. Mejora futura: SMTP propio + código de 6 dígitos o Google.
- `js/sync.js` (núcleo puro, 6 pruebas): `decide` elige noop/push/adopt/ask; `pack/unpack` no suben ni pisan `deviceId`, `pilotCode`, `aiUrl`. Versión de la fila = su `updated_at`, comparada solo por igualdad (sin depender de relojes).
- `js/cloud.js`: auth y REST con `fetch` (sin librerías ni build). Local primero: cada guardado marca "pendiente" y sube a los 4 s; sincroniza al abrir, al volver a la pestaña, al reconectar y cada 5 min. Subida con concurrencia optimista (`PATCH ... updated_at=eq.<versión>`): si otro dispositivo avanzó, no se pisa. Si los dos cambiaron o un equipo con datos entra a una cuenta con datos, **pregunta** y guarda copia del estado local (`backup-pre-sync` en IndexedDB). Los tokens viven en `localStorage`, nunca dentro del estado.
- Límites conocidos: se sincroniza el estado completo (no por campo) y sin audios; tope 3,5 MB; sin recuperación de contraseña hasta tener SMTP propio (el respaldo manual sigue existiendo).
- `tests/cloud.test.js`: el flujo real de `js/cloud.js` contra un Supabase simulado con dos dispositivos (subir, adoptar, conflicto con ambas elecciones y copia local, equipo con datos que no pisa en silencio, validaciones sin red). Aún falta la prueba con la cuenta real (la crea el usuario).
- Reporte de errores: `js/track.js` envía `js_error` (mensaje corto, archivo y línea; máx. 5 por sesión) por la medición anónima ya existente.
- `sw.js` → `catedra-v34`. 97 pruebas pasan.
- **Rediseño de cuenta (v35):** los campos de correo/contraseña salían sin estilo y la cuenta estaba escondida en Progreso. Ahora hay una hoja de cuenta (`cloudOpen` en `js/cloud.js`): selector Entrar / Crear cuenta, etiquetas, botón Ver/Ocultar contraseña, errores en línea (no toasts), estado "Un momento…" y envío con Enter. Entra por el primer pantallazo ("Ya tengo cuenta · Entrar") y por Progreso (fila compacta con estado y botón). Estilos nuevos en `app.html`: `.acct-*`, `.pw-wrap`, `.btn-link`; `input[type=email|password]` heredan el estilo base. Verificado en 375 px.

## 2026-10-16 · feat: la IA funciona sin código de piloto (modo abierto con topes)
- **Problema:** cada navegador/dispositivo exigía pegar el código de piloto; sin él la app daba preguntas genéricas y el estudiante no lo notaba. Era fricción pura y la causa de "en un navegador sí, en otro no".
- `api/ai.js`: la IA está **abierta por defecto**. El código pasó a ser opcional (da más usos al día). Topes que sustituyen al código: `AI_ANON_DAILY` (30/día por **IP**, porque el encabezado `x-device` lo puede falsear cualquiera), `AI_DAILY_LIMIT_PER_USER` (por código) y `AI_GLOBAL_DAILY` (2500/día total, protege las cuotas gratuitas). `AI_OPEN=0` vuelve al modo cerrado. Un código falso ya no bloquea: cae al modo abierto. El autotest (`?check=1`) sigue exigiendo un código real (gasta cuota y revela modelos).
- Cliente (`js/ai.js`): textos sin "pega tu código"; distingue "límite diario" de "IA muy pedida hoy". `app.html`: el campo ahora dice "opcional".
- Pruebas: 86 pasan (nueva: modo abierto, tope por IP no esquivable con `x-device`, tope global, autotest cerrado).
- `sw.js` → `catedra-v32`. `.env.example` documenta los topes.
- **Límite conocido:** los contadores viven en memoria de la función (se reinician en cada arranque en frío). Suficiente para el piloto; para escala, mover a Upstash Redis o Supabase (ver `docs/ARQUITECTURA.md`).

## 2026-10-13 (2) · Decision de arquitectura: no reescribir en React ahora

Se evaluo `react-refactor` con datos: no compila (396 errores de TypeScript, `vite build` falla), cubre ~un tercio de las funciones y no migra los datos de los estudiantes del piloto. La rama queda guardada, sin fusionar. `master` vuelve a ser la linea desplegable.
- Nuevo `docs/ARQUITECTURA.md`: decision, el nucleo de dominio puro como activo, riesgos reales de la startup (validar con estudiantes, cuentas y sincronizacion, IA persistente, observabilidad) y modernizacion por etapas con disparadores.
- `package.json` (`npm test`, `npm run check`), `.gitignore` y plantilla de CI en `docs/ci.yml.example` (corre las 85 pruebas en cada push/PR); para activarla: moverla a `.github/workflows/ci.yml` desde la web de GitHub o con un token con permiso `workflow`.

---

## 2026-10-13 · El examen ahora aprende de lo que le cuentas (y se ve que version tienes)

**Problema:** tras crear un examen salia "Antes de estudiar, averigua": 4-6 casillas iguales para todos. Lo marcado no se guardaba como dato ni cambiaba nada; era trabajo para el estudiante sin retorno.
**Ahora ("Cuentame como sera"):** formato (desarrollo, opcion multiple, problemas, oral, mixto), si se permite material, peso y temas. Se guarda en la evaluacion (`e.info`). Lo que no se sabe queda como recordatorio ("faltan N datos") en vez de una lista fija.
- **Asesor (plan):** el resumen que recibe la IA lleva `evaluacion` (formato, material, temas) y `resultados_previos` (como se sintio y si llego preparado en examenes pasados). El prompt adapta la practica al formato (opcion -> autoprueba; problemas -> ejemplo resuelto e intercalar; desarrollo/oral -> explicar) y cambia el enfoque si le fue mal.
- **Recomendador de metodo:** el formato da un empujon a los metodos que se parecen al examen ("asi te van a evaluar").
- **PWA:** busca actualizacion al abrir, al volver a la app, al recuperar internet y cada 20 min abierta. Progreso > Tus datos muestra la version y un boton "Buscar actualizacion". SW v31.
- Pruebas: 85 pasan.
- **Ojo (ramas):** existen 3 commits locales no subidos de otra sesion (reescritura React/Vite, `react-refactor`) que cambian index.html y agregan un build de Vite: subirlos romperia el despliegue actual. Este cambio se despliega desde `catedra-vanilla` (sobre origin/master).

---

## 2026-10-11 (6) · La app ya dice por que usa preguntas genericas

**Sintoma:** al subir material salian preguntas genericas en vez de personalizadas. **Causa:** el codigo de piloto se guarda dentro de cada navegador (no hay cuentas); en un navegador sin codigo la IA esta apagada y la app caia a preguntas genericas **sin avisar**. Tambien caia en silencio si la IA respondia con citas que no estaban en el texto.
- Aviso honesto tras generar: "N preguntas hechas con IA" o "genericas (sin IA): <motivo>".
- Un reintento automatico si la IA falla o sus citas no se verifican.
- Progreso > IA avanzada: estado de la IA y campo para pegar el codigo en ese navegador (ya no hace falta abrir el enlace con ?c=).
- **Datos entre navegadores:** son locales por navegador (IndexedDB); no se sincronizan. Mover datos: Progreso > Respaldar y Restaurar. Sincronizar de verdad exige cuentas (propuesta pendiente).
- SW v30.

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
