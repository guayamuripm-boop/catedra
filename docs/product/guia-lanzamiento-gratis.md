# Guía: del código actual a un piloto con 20–30 universitarios en Venezuela

Fecha: 2026-10-05. Todo lo de abajo es **gratis y sin programar**. Las partes que solo tú puedes hacer (crear cuentas, pegar claves, hablar con estudiantes) están marcadas con **Tú**. **[V]** = verificado en fuente; **[C]** = conocimiento previo, comprueba en pantalla.

**Decisiones de partida:** Venezuela primero, universitarios (18+) primero, sin cobro todavía, instituciones después.

---

## 0. Dónde estamos

| Ya está hecho y verificado | Falta (solo tú) |
|---|---|
| Diagnóstico corto (≈13 preguntas) que se completa con 1 pregunta por sesión | Crear 3 cuentas gratuitas y pegar 5 variables en Vercel |
| Repaso con FSRS y anillo de **Preparación** para el examen | Reclutar 20–30 universitarios |
| Biblioteca (notas, voz, archivo, PDF, pegar, foto con IA) | Configurar el embudo en PostHog (10 min) |
| Medición anónima, consentimiento 18+, página de privacidad, botón Opinar | Hacer las 8–10 entrevistas |
| Recordatorios en el calendario del teléfono (`.ics`) | |
| IA lista pero **apagada** hasta que pongas las claves | |

Por qué importa el peso: un plan móvil típico en Venezuela trae ~5 GB al mes [V]. La app funciona sin conexión y solo descarga ~0,4 MB la primera vez (más las fuentes de Google).

---

## 1. Crear las cuentas gratuitas (≈35 min) — **Tú**

**1.1 Groq (texto: crea preguntas y evalúa)**
1. Entra a `console.groq.com` y crea una cuenta.
2. Menú **API Keys** → **Create API Key** → ponle nombre `catedra` → copia la clave (empieza con `gsk_`) y guárdala en un lugar privado.
3. Límites gratuitos: 1.000 solicitudes/día con el modelo grande y 14.400 con el pequeño [V]. Sobra para 30 personas.

**1.2 Google AI Studio (Gemini: lee fotos de apuntes)**
1. Entra a `aistudio.google.com` con una cuenta de Google → **Get API key** → **Create API key**.
2. ⚠ **En el plan gratuito Google puede usar el contenido para mejorar sus productos y revisores humanos pueden leerlo** [V]. La app ya se lo advierte al estudiante antes de usar IA. Si prefieres no asumir ese riesgo, **no crees esta clave**: todo funciona igual, solo desaparece el botón Foto.

**1.3 PostHog (medir uso)**
1. `posthog.com` → **Get started free** → región **US Cloud**.
2. Crea un proyecto `catedra`. En **Settings → Project → Project API key** copia la clave (empieza con `phc_`). 1 millón de eventos gratis al mes, sin tarjeta [V].

**1.4 Dónde te escriben los estudiantes (elige uno)**
- **WhatsApp (recomendado en Venezuela):** arma el enlace `https://wa.me/58412XXXXXXX?text=Hola%20Catedra` con tu número en formato internacional (sin `+`, sin espacios).
- O un **Google Forms** corto y copia su enlace.

---

## 2. Pegar las variables en Vercel (≈5 min) — **Tú**

Vercel → tu proyecto **catedra** → **Settings → Environment Variables**. Agrega cada una en **Production** (y Preview si quieres probar):

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | la clave `gsk_…` |
| `GEMINI_API_KEY` | la clave de Google (opcional, ver 1.2) |
| `PILOT_CODES` | códigos de acceso separados por coma, p. ej. `uni1,uni2,uni3` |
| `POSTHOG_KEY` | la clave `phc_…` |
| `FEEDBACK_URL` | el enlace de WhatsApp o Forms |

Luego **Deployments → … → Redeploy** (los cambios de variables solo se aplican con un despliegue nuevo [C]). **No pegues ninguna clave en el chat ni en el repo.**

Para apagar la IA al instante: agrega `AI_ENABLED=false` y redespliega.

---

## 3. Comprobar que quedó bien (≈5 min) — **Tú**

Abre `https://catedra-flame.vercel.app/?c=uni1` en tu celular (la app guarda el código y lo quita de la barra).

| Prueba | Debe pasar | Si no pasa |
|---|---|---|
| Biblioteca | Aparece el botón **Foto** | Falta `GEMINI_API_KEY`, el código es incorrecto o no redesplegaste |
| Crear materia, pegar un texto de 4–5 frases y **Generar preguntas** | Las preguntas salen **sin** la etiqueta "Sin IA" | Código mal escrito, sin redeploy, o límite diario alcanzado |
| PostHog → **Activity / Live events** | Ves `app_open`, `terms_accepted`, `diag_start`… | Falta `POSTHOG_KEY`, o no marcaste "Acepto" (sin consentimiento no se mide) |
| Progreso → **Opinar** | Abre tu WhatsApp o Forms | Falta `FEEDBACK_URL` (debe empezar con `https://`) |

---

## 4. Armar el embudo en PostHog (≈10 min) — **Tú**, sin código

En PostHog → **Product analytics → New insight → Funnel**. Pasos en orden:

`app_open` → `terms_accepted` → `diag_start` → `diag_done` → `subject_added` → `questions_generated` → `question_approved` → `session_start` → `session_done`

Guárdalo en un panel llamado **Piloto**. Añade un insight de **Retention** con evento inicial `app_open` y evento de regreso `session_done`. Eso te dice en qué paso se cae la gente.

Eventos de ayuda: `pulse_answered`, `photo_note`, `ics_export`, `notebooklm_pack`, `backup_export`, `feedback_open`, `app_installed`.

---

## 5. Reclutar y ejecutar el piloto — **Tú**

**A quién:** 20–30 universitarios de 18+, con parcial o final en las próximas 4 semanas, de 2–3 carreras distintas (incluye alguna STEM y alguna que no).

**Mensaje para WhatsApp (cópialo):**
> Estoy probando una app para estudiar mejor (te dice cómo estudias, arma tu plan para el parcial y te hace repasar lo justo). Es gratis y es una prueba. ¿Me ayudas 2 semanas? Ábrela aquí: https://catedra-flame.vercel.app/?c=uni1
> En Android: ábrela en Chrome → menú ⋮ → "Instalar app". En iPhone: Safari → Compartir → "Añadir a pantalla de inicio". Instálala y úsala siempre desde ahí (tus datos quedan en tu teléfono).
> Úsala para una materia que tengas que estudiar de verdad. Cualquier cosa me escribes por el botón "Opinar".

**Códigos:** usa uno distinto por grupo (`uni1` para una carrera, `uni2` para otra…). Así sabes qué canal funciona y puedes retirar acceso cambiando `PILOT_CODES`.

**Reglas:** solo mayores de 18; no pedir que suban datos de terceros; no prometer notas.

**Tu rutina diaria (≈15 min):**
1. Mira el panel Piloto: ¿quién se quedó en qué paso?
2. Responde mensajes y anota fricciones literales ("no entendí…", "se cerró…").
3. Revisa el consumo en las consolas de Groq y Google.

**Entrevista breve a los 3 días (10 min, por WhatsApp o llamada):**
1. ¿Qué estudiaste con la app? ¿Cómo lo hacías antes?
2. ¿Qué te dijo el diagnóstico? ¿Se parece a ti? (1–5)
3. ¿Qué fue lo primero que dejaste de usar?
4. ¿Las preguntas eran buenas? ¿Cuál fue mala?
5. ¿La usarías antes de tu próximo parcial? ¿Por qué sí o no?

Guion completo para entrevistas previas (sin mostrar la app): `docs/research/validacion.md`.

---

## 6. Cuándo decidir

| Medida (PostHog) | Meta del piloto |
|---|---|
| `diag_done` ÷ `diag_start` | ≥ 70 % |
| `session_done` en las primeras 24 h | ≥ 60 % |
| Vuelven en los días 2–3 sin que les escribas | ≥ 50 % |
| `question_approved` ÷ `questions_generated` | ≥ 70 % |
| "El diagnóstico se parece a mí" (1–5) | ≥ 4 |

**Seguir:** se cumplen casi todas. **Ajustar:** cae un paso concreto (arréglalo y repite 1 semana). **Pivotar:** menos de 1 de cada 4 vuelve y las entrevistas dicen que querían otra cosa (resolver tareas, explicaciones…).

---

## 7. Escalar poco a poco (y qué cambia en cada tramo)

| Tramo | Qué haces | Costo |
|---|---|---|
| **≤ 30 personas** | Nada más. Todo en capas gratuitas | $0 |
| **30–150** | Si te acercas al tope de Groq, en Vercel pon `AI_GENERATE_MODEL=llama-3.1-8b-instant` (modelo pequeño con 14.400/día [V]) | $0 |
| **150–1.000** | **Antes de abrir sin códigos:** cuentas con Supabase (sync + borrado de cuenta), caché de IA, subir a planes de pago de IA (sin entrenamiento con datos), correo de soporte | decenas de $/mes |
| **Cuando cobres** | Vercel Pro ($20/mes; Hobby no permite uso comercial [V]) y pasarela de pagos del país donde cobrarás (no Venezuela) | según ingresos |
| **Instituciones** | Solo con datos de retención en mano: conversa con 1–2 universidades o centros de estudiantes | — |

Un dominio propio es opcional; `catedra-flame.vercel.app` sirve para el piloto.

---

## 8. Mantenimiento (yo lo hago contigo)

- Cada cambio: `git push` → Vercel despliega solo → subir `VERSION` en `sw.js`.
- Pruebas antes de subir: `node --test tests/ai.test.js tests/analytics.test.js tests/srs.test.js` (23 pruebas).
- Si algo se rompe: Vercel → Deployments → versión anterior → **Promote to Production** [C].

## 9. Qué NO hacer todavía
Panel docente · cobro · app de tienda · aceptar menores · IA con claves abiertas sin códigos · más funciones antes de ver los números del piloto.
