# Activar los avisos push (lo que hace el fundador)

El código ya está desplegado, pero los avisos **no funcionan hasta que hagas estos pasos** (necesitan tus cuentas y claves). Hasta entonces la app no muestra ningún botón de avisos ni pide permiso: es invisible para el estudiante.

Qué avisa, y cuándo (lógica en `supabase/functions/send-reminders/reminders.js`, probada en `tests/reminders.test.js`):

| Aviso | Cuándo |
|---|---|
| Víspera de examen | el día anterior, a la hora pico del estudiante |
| Mañana del examen | el día del examen, a las 8 de su hora local |
| Repaso del día | a su hora pico, si hoy aún no estudió (y estudió hace 1–2 días) |
| Te echamos de menos | a los 3 días sin estudiar; repite cada 3 días; se calla a los 14 |

Reglas de respeto: **un aviso por día como máximo**, nunca antes de las 8 ni después de las 20 (hora de cada estudiante), y solo si tiene cuenta y activó los avisos en ese dispositivo.

## Pasos (unos 15 minutos)

1. **Tablas.** Supabase → *SQL Editor → New query* → pega todo `supabase/002_push.sql` → *Run*. (Si ya habías corrido una versión anterior, antes ejecuta la línea `drop table …` que está comentada al inicio del archivo.)
2. **Extensiones.** Supabase → *Database → Extensions* → activa `pg_cron` y `pg_net`.
3. **Claves VAPID.** En una terminal: `npx web-push generate-vapid-keys`. Te da una clave *Public* y una *Private*. La Private **nunca** va al repositorio ni al chat.
4. **CLI de Supabase** (en la carpeta del proyecto):
   ```bash
   npx supabase login
   npx supabase link --project-ref qtcrbzwksivlsasotdlq
   ```
5. **Secretos** (inventa un `CRON_SECRET` largo y aleatorio):
   ```bash
   npx supabase secrets set VAPID_PUBLIC=<la pública> VAPID_PRIVATE=<la privada> VAPID_SUBJECT=mailto:tu@correo.com CRON_SECRET=<aleatorio>
   ```
6. **Desplegar la función** (sin JWT: la protege `CRON_SECRET`):
   ```bash
   npx supabase functions deploy send-reminders --no-verify-jwt
   ```
7. **Clave pública en la app.** Abre `js/push.js` y pega la clave *Public* en `const VAPID_PUBLIC = '';`. (Es pública: puede ir en el código. Hasta entonces la app no ofrece los avisos.) Commit y push.
8. **Disparador horario.** En el SQL Editor, usa el bloque comentado al final de `002_push.sql`: quita los `--`, cambia `<PROJECT_REF>` por `qtcrbzwksivlsasotdlq` y `<CRON_SECRET>` por el mismo valor del paso 5, y ejecútalo.
9. **Probar la función a mano:**
   ```bash
   curl -X POST https://qtcrbzwksivlsasotdlq.supabase.co/functions/v1/send-reminders -H "x-cron-secret: <CRON_SECRET>"
   ```
   Debe responder `{"sent":0}` (o más). `403` = el secreto no coincide.
10. **Probar en un teléfono:** entra con tu cuenta → Progreso → *Avisos → Activar* (o la tarjeta "¿Te aviso antes de tus exámenes?" tras una sesión). Para forzar un aviso de prueba, en el SQL Editor pon en tu fila de `reminder_prefs` `next_exam_date` = mañana y `pico_hour` = la hora actual en tu zona, y ejecuta el paso 9.

## Límites que debes conocer
- **iPhone:** los avisos solo funcionan con la app **instalada en la pantalla de inicio** (iOS 16.4 o superior) y son menos fiables que en Android. La app lo dice al ofrecerlos.
- Sin cuenta no hay avisos (la suscripción pertenece a un usuario).
- Si un estudiante cambia de zona horaria, el aviso se ajusta en su próxima sincronización.
