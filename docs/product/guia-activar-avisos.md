# Activar los avisos push (lo que hace el fundador)

**Ya hecho (2026-10-22):** las claves VAPID están generadas y la **pública ya está en la app** (`js/push.js`). La privada y un `CRON_SECRET` están en tu computador, en `.dev/SECRETOS-avisos.txt`, con **todos los comandos ya rellenados**. Esa carpeta está excluida de git: nunca se sube.

**Auto-encendido:** la app solo ofrece los avisos cuando la tabla `push_subscriptions` existe en Supabase. Por eso el último paso es crear las tablas: en ese momento aparecen solos en *Ajustes → Cuenta y avisos* y en la tarjeta tras una sesión. Antes de eso, nadie ve un botón que no funcione.

Qué avisa, y cuándo (lógica en `supabase/functions/send-reminders/reminders.js`, probada en `tests/reminders.test.js`):

| Aviso | Cuándo |
|---|---|
| Víspera de examen | el día anterior, a la hora pico del estudiante |
| Mañana del examen | el día del examen, a las 8 de su hora local |
| Repaso del día | a su hora pico, si hoy aún no estudió (y estudió hace 1–2 días) |
| Te echamos de menos | a los 3 días sin estudiar; repite cada 3 días; se calla a los 14 |

Reglas de respeto: **un aviso por día como máximo**, nunca antes de las 8 ni después de las 20 (hora de cada estudiante), y solo si tiene cuenta y activó los avisos en ese dispositivo.

## Pasos (unos 10 minutos)

Abre `.dev/SECRETOS-avisos.txt` y sigue sus 4 pasos en orden:

1. **Terminal** (en la carpeta del proyecto): `supabase login`, `link`, `secrets set` y `functions deploy`. Son 4 líneas ya listas para copiar.
2. **Supabase → Database → Extensions:** activa `pg_cron` y `pg_net`.
3. **Supabase → SQL Editor:** pega el bloque `cron.schedule(...)` del archivo (ya trae tu proyecto y tu secreto) → *Run*.
4. **Supabase → SQL Editor:** pega todo `supabase/002_push.sql` → *Run*. **Esto enciende los avisos en la app.**

Comprobar: la prueba `curl` del final del archivo debe responder `{"sent":0}` (o más). `403` = el secreto no coincide.

Probar en un teléfono: entra con tu cuenta → *Ajustes → Avisos → Activar*. Para forzar un aviso, en el SQL Editor pon en tu fila de `reminder_prefs` `next_exam_date` = mañana y `pico_hour` = la hora actual de tu zona, y ejecuta el `curl`.

## Si alguna vez necesitas claves nuevas
`node` puede generarlas sin instalar nada (así se hicieron): ver el bloque en `docs/BITACORA.md` del 2026-10-22. Si cambias la pública, cámbiala también en `js/push.js` y vuelve a desplegar; las suscripciones viejas dejarán de funcionar y la app pedirá activar de nuevo.

## Límites que debes conocer
- **iPhone:** solo con la app **instalada en la pantalla de inicio** (iOS 16.4 o superior), y es menos fiable que Android. La app lo dice al ofrecerlos.
- Sin cuenta no hay avisos (la suscripción pertenece a un usuario).
