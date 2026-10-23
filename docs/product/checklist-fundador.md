# Lo que te toca para que todo funcione (fundador)

Estado al 2026-10-22. Todo lo demás ya está construido, probado y desplegado en `https://app-catedra.vercel.app`. Cada punto dice **qué se enciende** al hacerlo y **cuánto toma**.

## Ya funciona (no tienes que hacer nada)
- App completa, offline, que se actualiza sola (versión visible en *Ajustes → La app*).
- IA abierta sin código de piloto (preguntas, evaluación, fotos, plan, resumen, casos).
- Cuentas y sincronización entre dispositivos (Supabase, correo + contraseña).
- Ajustes en una pantalla propia (avatar arriba a la derecha en Hoy y en Progreso).

## Para encender (en orden de valor)

### 1. Medición de uso y reporte de errores · 5 min · **importante para el piloto**
Hoy está **apagada** en producción (`/api/config` responde `analytics:false`): no ves qué hacen los estudiantes, ni si algo se rompe en su teléfono, ni las respuestas de las encuestas.
1. Crea una cuenta gratis en <https://posthog.com> → crea un proyecto.
2. Copia la **Project API key** (empieza por `phc_`).
3. Vercel → proyecto de Catedra → *Settings → Environment Variables* → `POSTHOG_KEY` = esa clave (Production).
   - Si elegiste región Europa en PostHog, añade también `POSTHOG_HOST` = `https://eu.i.posthog.com`.
4. *Deployments → Redeploy*. Comprueba: `https://app-catedra.vercel.app/api/config` debe decir `"analytics":true`.

### 2. Avisos push · 10 min
Claves ya generadas; comandos listos en tu computador: **`.dev/SECRETOS-avisos.txt`**. Guía: `docs/product/guia-activar-avisos.md`. Se encienden solos en la app al terminar el paso 4.

### 3. CI (pruebas automáticas en cada cambio) · 2 min
En GitHub (web): *Add file → Create new file* → nombre `.github/workflows/ci.yml` → pega el contenido de `docs/ci.yml.example` → *Commit*. Desde entonces, cada `push` corre las 160 pruebas.

### 4. Botón "Opinar" (opcional) · 5 min
Crea un Google Form corto → copia su enlace → Vercel → `FEEDBACK_URL` = enlace → Redeploy. Aparece en *Ajustes → Privacidad* y tras las sesiones.

### 5. Recuperar contraseña (después del piloto) · 20 min
Necesita un correo propio en Supabase (*Authentication → Emails → SMTP*, por ejemplo con Resend, que es gratis). Mientras tanto: si alguien olvida su contraseña, sus datos siguen en su teléfono y puede usar *Ajustes → Tus datos → Respaldar*.

## Pruebas que solo tú puedes hacer
- [ ] **iPhone**: abre la app en Safari → Compartir → *Añadir a pantalla de inicio* → ábrela desde el ícono. Mira Hoy, Ajustes y una sesión completa.
- [ ] **Android** (Chrome): instalar desde el aviso o el menú → lo mismo.
- [ ] Crear cuenta en el PC, entrar en el teléfono, cambiar algo y ver que aparece en el otro.
- [ ] Subir una **foto real de apuntes** y ver que salen preguntas con IA.
- [ ] Pedir un **plan con IA** (Hoy → tarjeta del asesor) con material real.

## La prueba que decide
3 a 5 estudiantes reales, una semana. Con la medición encendida (punto 1) se ve: ¿vuelven 3 días?, ¿completan sesiones?, ¿qué responden en las encuestas tras cada sesión?
