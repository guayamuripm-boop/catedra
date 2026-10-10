# Guía: encender la IA gratis en Catedra (paso a paso)

**Para quién:** para ti, el fundador. No necesitas saber programar ni escribir comandos. Todo el código ya está listo y esperando las claves; tú solo las creas, las pegas en Vercel y rediseñas. Son unos 10-15 minutos.

**Qué logras al terminar:** que la app genere preguntas de verdad desde el material del estudiante (hoy salen de plantillas que dicen "Sin IA"), evalúe respuestas y transcriba fotos de apuntes.

**Regla de oro:** las claves **nunca** se pegan en un chat, ni en el código, ni en este repositorio. Solo viven en Vercel. Si alguna vez pegas una clave en un chat, bórrala y créala de nuevo.

---

## Lo que ya está hecho (no tienes que tocarlo)

- La pasarela de IA (`api/ai.js`) ya sabe hablar con Groq, OpenRouter y Gemini, y cambia de uno a otro si uno falla o se queda sin cupo.
- Está **cerrada por defecto**: nadie puede usar tu clave sin un código de piloto que tú repartas.
- Verifica que cada pregunta tenga una cita literal del texto, bloquea instrucciones escondidas en el material, y limita las llamadas por estudiante al día.
- La lista completa de nombres de variables está en `.env.example` (en la raíz del proyecto).

Tú solo haces los 3 pasos de abajo.

---

## Paso 1 · Crea las claves gratis (sin tarjeta)

Necesitas **al menos una**. Recomendado: Groq (texto) + Gemini (fotos). Crea una cuenta en cada sitio con tu correo y copia la clave.

| Proveedor | Para qué sirve | Dónde sacar la clave | Nombre de la variable |
|---|---|---|---|
| **Groq** | Texto → preguntas. Rápido y gratis. **Empieza por este.** | console.groq.com → *API Keys* → *Create API Key* | `GROQ_API_KEY` |
| **Gemini** | Lo mismo + **leer fotos** de apuntes. Es el único que transcribe imágenes. | aistudio.google.com/apikey → *Create API key* | `GEMINI_API_KEY` |
| **OpenRouter** | Respaldo: si Groq se queda sin cupo, entra este. Opcional. | openrouter.ai/keys → *Create Key* | `OPENROUTER_API_KEY` |

> Cada clave es un texto largo (empieza con algo como `gsk_...` en Groq o `AIza...` en Gemini). Cópiala completa. Si el sitio solo te la muestra una vez, guárdala en un lugar seguro (un gestor de contraseñas), nunca en un chat.

---

## Paso 2 · Pégalas en Vercel

1. Entra a **vercel.com** → inicia sesión → abre el proyecto **catedra**.
2. Arriba, pestaña **Settings** → en el menú de la izquierda, **Environment Variables**.
3. Para cada clave, añade una variable:
   - **Key** (nombre): exactamente `GROQ_API_KEY` (o `GEMINI_API_KEY`, etc. — respeta mayúsculas).
   - **Value** (valor): pega la clave que copiaste.
   - **Environment**: deja marcado *Production* (y *Preview* si quieres probarla en ramas).
   - **Save**.
4. Añade también esta, **obligatoria** para que la IA se encienda:
   - **Key:** `PILOT_CODES`
   - **Value:** tus códigos inventados separados por coma, por ejemplo `grupo1,grupo2,ana,luis`. Cada persona o grupo usa uno. Sin esto, la IA no funciona para nadie (es la protección de tu cupo).
5. Recomendadas (opcionales):
   - `AI_DAILY_LIMIT_PER_USER` = `25` (tope de llamadas por estudiante al día).
   - `POSTHOG_KEY` = tu clave de PostHog, si quieres medir uso anónimo.
   - `FEEDBACK_URL` = enlace a un Google Form/Tally para recoger opiniones.

> La lista completa con explicaciones está en `.env.example`. Borra o no pongas las que no uses.

---

## Paso 3 · Redespliega y verifica

1. En Vercel, pestaña **Deployments** → en el último deploy, botón **⋯** (tres puntos) → **Redeploy**. (Un cambio de variables no se aplica hasta que rediseñas.)
2. Espera a que termine (1-2 min).
3. **Verifica las claves** abriendo esta dirección en el navegador, cambiando `TU_CODIGO` por uno de tus `PILOT_CODES`:

   ```
   https://catedra-flame.vercel.app/api/ai?check=1&c=TU_CODIGO
   ```

   Debe responder algo como `{"checks":[{"provider":"groq","model":"...","ok":true}, ...]}`. Cada proveedor con `"ok":true` está funcionando. Esta prueba **no muestra tus claves**.
4. **Pruébalo en la app**: abre
   ```
   https://catedra-flame.vercel.app/app?c=TU_CODIGO
   ```
   (la app guarda el código y lo quita de la barra). Pega un texto de clase y genera preguntas: si **no** dicen "Sin IA", ya está funcionando.
5. **Reparte el enlace** a tus estudiantes del piloto así: `https://catedra-flame.vercel.app/?c=TU_CODIGO`.

---

## Para apagar o controlar

- **Apagar al instante:** en Vercel añade `AI_ENABLED` = `false` y redespliega. La IA se apaga; el resto de la app sigue.
- **Cortar a un grupo:** quita su código de `PILOT_CODES` y redespliega.
- **Subir o bajar el tope diario:** cambia `AI_DAILY_LIMIT_PER_USER`.
- **Que ningún texto de estudiantes llegue a Google:** añade `AI_NO_GEMINI_TEXT` = `1` (Gemini se usará solo para fotos).

---

## Si algo no funciona

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El `check` dice `"ok":false` en un proveedor | Clave mal copiada o sin cupo | Vuelve a copiar la clave en Vercel; revisa que no sobren espacios; redespliega |
| La app sigue diciendo "Sin IA" | No redesplegaste, o el código `?c=` no coincide | Redeploy; usa un código exacto de `PILOT_CODES` |
| `check` responde pero no te deja (401/403) | El código no está en `PILOT_CODES` | Revisa la variable `PILOT_CODES` en Vercel |
| Todo `ok` pero las preguntas salen vacías | El texto es muy corto o no da para preguntas fiables | Pega un texto más largo (mínimo ~80 caracteres con contenido real) |

> Cupos gratis aproximados: Groq y Gemini tienen límites generosos para un piloto pequeño. Si creces, el `AI_DAILY_LIMIT_PER_USER` y el respaldo de OpenRouter te protegen. Para escala real haría falta caché y cuotas persistentes (ver `arquitectura-y-escala.md §6`).
