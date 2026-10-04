# Arquitectura, datos, IA y despliegue (pensado para escalar)

Fecha: 2026-10-04. **[V]** verificado en fuente, **[C]** conocimiento previo sin verificar aquí, **[D]** juicio propio. Las cifras de costo y escala son órdenes de magnitud, no presupuestos.

---

## 1. Principios

1. **Local primero, nube para sincronizar.** La app funciona sin conexión (ya es así); la nube suma cuentas, respaldo y análisis.
2. **Postgres estándar, sin atarnos.** Lo que se pueda hacer con SQL puro se hace con SQL puro; así cambiar de proveedor es posible.
3. **El costo de IA es una restricción de diseño**, no un detalle (ver §6).
4. **Menores por diseño.** Parte del público tiene 14–15 años: mínimo de datos, consentimiento del tutor, sin publicidad.
5. **El dato más valioso es el registro de repasos** (qué se estudió, cuándo, cómo respondió). Se guarda como historial inmutable desde el principio.

## 2. Arquitectura objetivo

```
 PWA (offline, IndexedDB) ──► Vercel: estático + /api (funciones)
        │                          │
        │ sync                     ├─► Pasarela de IA ─► Groq / Gemini (ruteo por tarea, caché, cuotas)
        ▼                          ├─► Push (OneSignal o web-push + cron)
 Supabase: Auth · Postgres+RLS     └─► Pagos (por mercado)
        ▲
        └─ Observabilidad: Sentry (errores) · PostHog (producto) · logs · alertas de costo
```
**Hoy existe:** PWA, IndexedDB, Vercel estático, y la pasarela `api/ai.js`. **Falta:** Supabase, push, pagos, analítica, caché de IA.

## 3. Base de datos

**Elección: Supabase (Postgres + Auth + RLS).** Postgres estándar con autenticación y seguridad por fila integradas. Plan gratuito: 2 proyectos, 500 MB, 50.000 MAU, **se pausa tras una semana sin actividad**; Pro $25/mes: 100.000 MAU, 8 GB, 250 GB de transferencia [V]. Conclusión: el gratuito sirve para desarrollo y *staging*; **producción desde el piloto con cuentas va en Pro** [D]. Región: elegir la de Sudamérica (São Paulo) si está disponible, por latencia desde LatAm [C, verificar].

**Esquema (resumen).** Toda tabla lleva `user_id` y RLS `user_id = auth.uid()`; la clave de servicio solo vive en funciones del servidor.

| Grupo | Tablas |
|---|---|
| Identidad | `profiles(id, display_name, birth_year, country, locale, role, created_at, deleted_at)`, `consents(user_id, kind, version, granted_at, revoked_at, guardian_contact)` |
| Perfil de aprendizaje | `diag_domains(user_id, domain, est, w, n, updated_at)`, `diag_snapshots(user_id, taken_at, kind, dom jsonb)`, `diag_answers(user_id, qid, value, answered_at)` |
| Contenido | `subjects`, `exams(subject_id, date, weight)`, `notes(…, source, tags[], updated_at, deleted_at)`, `items(…, question, answer, cite, type, origin, note_id, updated_at, deleted_at)` |
| Memoria | `fsrs_state(item_id, due, stability, difficulty, reps, lapses, last_review)`, **`review_logs(id, user_id, item_id, ts, rating, latency_ms, confidence, session_id, mode)`** (solo se agrega, nunca se edita) |
| Sesiones y eventos | `sessions(id, started_at, ended_at, energy, kind)`, `events(user_id, ts, name, props jsonb)` |
| IA y negocio | `ai_usage(user_id, ts, task, provider, model, tokens_in, tokens_out, cost_usd, cache_hit)`, `subscriptions(user_id, plan, status, provider, current_period_end)` |

`review_logs` y `events` crecen más rápido que todo lo demás: particionar por mes cuando pasen de decenas de millones de filas [C].

## 4. Sincronización (local primero)

| Fase | Qué es | Límite |
|---|---|---|
| **A · Copia en la nube** | Subir el estado completo como un `jsonb` por usuario con control de versión | Sirve de respaldo y de cambio de dispositivo, **no** permite análisis ni escala |
| **B · Tablas normalizadas** | `items` y `notes`: gana la última edición (`updated_at`) con borrado lógico (`deleted_at`). `review_logs`: solo se agrega, sin conflictos. Descarga por cursor (`updated_at > since`) | Requiere refactor: hoy el estado es un solo objeto |

Descarto CRDT: es sobre-ingeniería para un usuario editando sus propios datos [D]. Para la fase B, cada entidad necesita `id` estable (ya los tiene) y `updatedAt`.

## 5. Control de perfil y privacidad

- **El perfil es del usuario:** exportar (existe), borrar cuenta con borrado en cascada de todo lo suyo, consentimientos versionados y revocables.
- **Pseudónimo:** el identificador es un UUID; los eventos de analítica no llevan nombre ni correo.
- **Datos mínimos:** año de nacimiento y país, no fecha exacta. Sin publicidad ni venta de datos.
- **Menores:** consentimiento del tutor antes de activar cuenta en la nube y en las funciones de IA/voz. Colombia (Ley 1581) tiene disposiciones especiales para menores, y la mayoría de los países de la región no tiene reglas específicas [V]. Diseñar al estándar más exigente y **revisar con un abogado local antes de abrir a menores** [D].
- **Contenido del estudiante:** nunca se usa para entrenar modelos. Revisar los términos de cada proveedor: las capas gratuitas de algunos pueden usar datos para mejorar productos [C, verificar]; con menores conviene un plan de pago sin esa cláusula.
- **Retención:** los registros de IA guardan metadatos (tarea, modelo, tokens, latencia), nunca el contenido.

## 6. Pasarela de IA

**Ya hecho (`api/ai.js`, 9 pruebas automáticas):**
- Tareas: `generate` (texto→preguntas), `evaluate` (respuesta libre), `transcribe` (foto de apuntes→texto).
- **Cerrada por defecto:** exige al menos una clave *y* códigos de piloto (`PILOT_CODES`) o apertura explícita (`AI_OPEN=1`). Sin eso nadie puede usar tu clave.
- Código de acceso por enlace (`?c=CODIGO`), cuota diaria por usuario, solo mismo origen, interruptor de emergencia (`AI_ENABLED=false`).
- Ruteo por tarea con ruta alternativa si falta un proveedor; ambos hablan el mismo formato (compatible con OpenAI), así que cambiar de modelo es cambiar una variable.
- **El texto del estudiante va delimitado como datos** (defensa contra instrucciones escondidas en un PDF) y **toda pregunta debe traer una cita literal que exista en el texto fuente**; el servidor descarta las que no.

**Falta para escalar:**
1. **Caché por contenido** (hash del texto + tarea): el mismo material no se paga dos veces. Redis (Upstash) o Supabase.
2. **Cuotas persistentes** por usuario autenticado (hoy viven en memoria de cada instancia: frenan abusos, no garantizan nada).
3. **Conjunto de evaluación** (≈20 materiales reales de distintas materias) para medir el % de preguntas aprobadas por modelo y decidir el ruteo con datos, no con intuición.
4. Reintentos y cambio automático de proveedor; moderación para menores; registro de costo por usuario (`ai_usage`); *batch* para tareas no urgentes (−50 % en Groq [V]).

**El costo decide el modelo de negocio.** Supuesto ilustrativo [D]: un usuario activo gasta ~80.000 tokens de entrada y ~30.000 de salida al mes.

| Modelo | Precio por M tokens (entrada/salida) [V] | Costo por usuario activo/mes |
|---|---|---|
| Gemini 2.5 Flash | $0,30 / $2,50 | ≈ $0,10 |
| Gemini 2.5 Flash-Lite | $0,10 / $0,40 | ≈ $0,02 |
| Llama 3.1 8B (Groq) | $0,05 / $0,08 | ≈ $0,007 |

Si solo ~2,6 % paga [V, referencia de edtech], cada pagador sostiene el costo de ~38 usuarios: con Flash eso es ≈ $3,85 al mes por pagador, **más que un ingreso de $2–3**; con Flash-Lite, ≈ $0,77. **Conclusión:** modelo barato por defecto, caché y cuotas en el plan gratuito son requisitos de negocio, no optimizaciones. Reservar el modelo caro para lo que lo justifica (foto, evaluación fina) y para el plan de pago.

## 7. Metodología de despliegue

| Tema | Práctica |
|---|---|
| **Ramas** | `main` = producción. Ramas cortas por funcionalidad → *pull request* → Vercel genera una URL de vista previa [C] → revisión → *merge* → producción automática. Vercel permite volver a la versión anterior al instante [C] |
| **Entornos** | Local (`vercel dev`) · Preview (Supabase "staging", claves de IA propias con tope de gasto) · Producción (Supabase Pro). Variables por entorno; **nunca claves en el repo** |
| **Base de datos** | Migraciones SQL versionadas en `supabase/migrations/`, aplicadas por CLI. Ningún cambio manual en producción. RLS con pruebas |
| **CI** | GitHub Actions: pruebas (`node --test`) + pruebas de extremo a extremo (Playwright) contra la vista previa. **Bloqueo actual:** el token de `gh` no tiene permiso `workflow`; lo activas tú con `gh auth refresh -s workflow` (abre el navegador) |
| **Lanzamientos** | Banderas de funcionalidad por cohorte (código de piloto → 10 % → 100 %). Subir `VERSION` del service worker en cada versión y probar la actualización desde un SW viejo |
| **Observabilidad** | Sentry (errores de cliente y funciones), PostHog (producto), logs de Vercel, monitor externo de disponibilidad, alertas de costo y de cuota de IA |
| **Copias** | Supabase Pro con copias diarias (recuperación a un instante: opcional) [C]; exportación semanal propia; **simulacro de restauración antes de abrir al público** |
| **Seguridad** | RLS, límites de uso, cabeceras (hecho en `vercel.json`), política de contenido (CSP, pendiente), secretos solo en Vercel, rotación de claves, pocas dependencias (hoy solo pdf.js desde CDN) |
| **Pruebas** | Hoy solo la pasarela tiene pruebas automáticas. Pendiente: puntaje del diagnóstico, importadores y cobertura; exige extraerlas a módulos |

## 8. Escala por etapas

| Etapa | Usuarios | Infra | Costo mensual aprox. [D] |
|---|---|---|---|
| 0 · Piloto | ≤100 | Vercel + Supabase + IA gratuita con códigos | $0–45 |
| 1 | ≤10k activos | Vercel Pro ($20) + Supabase Pro ($25) + Upstash + IA | cientos de dólares |
| 2 | 10k–200k | Mayor cómputo de BD, réplica de lectura, particionar logs, cola de IA, CDN. Supabase Pro incluye 100k MAU y luego cobra por exceso [V] | miles |
| 3 | >200k | Separar el servicio de IA, almacén de datos para analítica y optimización de FSRS por cohorte, multi-región | según uso |

Vercel Hobby no permite uso comercial; Pro cuesta $20 por usuario al mes [V].

## 9. Huecos que aún no atacamos

**Antes de abrir a más gente (P0):** analítica anónima · cuentas con RLS y borrado de cuenta · consentimiento de menores y política de privacidad publicada · copias de seguridad · control de costos de IA · canal de soporte · moderación del contenido generado para menores · pruebas de extremo a extremo mínimas.

**Siguiente (P1):** recordatorios push · traducción (es-419, pt-BR, en) · accesibilidad (WCAG 2.1 AA: contraste, lector de pantalla, tamaño de letra) · derechos de autor del material que suben (apuntes propios vs libros protegidos: política y retiro) · antiabuso (cuentas múltiples para esquivar cuotas) · rendimiento en gama baja y 3G (el HTML ya pesa ~105 KB sin comprimir [V]).

**Después (P2):** panel docente/institucional · API pública · integración con plataformas de aulas.

## 10. Cómo activar la IA hoy (lo único que necesitas hacer tú)

1. Crea una clave en Groq y otra en Gemini (gratis; las dos sirven para texto, Gemini es la que lee fotos).
2. En Vercel → tu proyecto → Settings → Environment Variables, agrega: `GROQ_API_KEY`, `GEMINI_API_KEY` y `PILOT_CODES` (por ejemplo `grupo1,grupo2`, los códigos que repartirás). **No pegues las claves en el chat.**
3. Redespliega (cualquier push, o "Redeploy" en Vercel).
4. Comparte el enlace con el código: `https://catedra-flame.vercel.app/?c=grupo1`. La app lo guarda y lo quita de la barra.
5. Para pausarla al instante: pon `AI_ENABLED=false` y redespliega.
