// Catedra · Edge Function: envía recordatorios push por web-push. Invocada por pg_cron.
// Secretos requeridos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Lógica pura portada desde js/reminders.js (fuente de verdad testeada)
const MS_DAY = 86400000;
const MS_HOUR = 3600000;

function due(pref, now) {
  if (!pref || !pref.enabled) return null;
  const nowMs = now.getTime();
  const tz = pref.tz || 'America/Caracas';

  if (pref.next_exam_at) {
    const exam = new Date(pref.next_exam_at);
    if (!isNaN(exam.getTime())) {
      const diff = exam.getTime() - nowMs;
      if (diff >= 12 * MS_HOUR && diff <= 24 * MS_HOUR) return 'exam-eve';

      const todayLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const examLocal = new Date(exam.toLocaleString('en-US', { timeZone: tz }));
      if (todayLocal.toDateString() === examLocal.toDateString()) {
        const pico = pref.pico_hour != null ? pref.pico_hour : 18;
        if (todayLocal.getHours() === pico) return 'exam-morning';
      }
    }
  }

  if (pref.last_active_at) {
    const last = new Date(pref.last_active_at);
    if (!isNaN(last.getTime()) && (nowMs - last.getTime()) >= 3 * MS_DAY) return 'slip';
  }

  const localNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const pico = pref.pico_hour != null ? pref.pico_hour : 18;
  if (localNow.getHours() === pico) return 'daily';

  return null;
}

function messageFor(kind) {
  switch (kind) {
    case 'exam-eve': return { title: 'Examen mañana', body: 'Repasa lo esencial hoy. 15 min marcan la diferencia.', url: '/app' };
    case 'exam-morning': return { title: 'Hoy es el examen', body: 'Último repaso ligero y a confiar. ¡Tú puedes!', url: '/app' };
    case 'slip': return { title: 'Llevas 3 días sin estudiar', body: 'Vuelve con 10 min. Lo que hiciste no se pierde.', url: '/app' };
    case 'daily': return { title: 'Hora de repasar', body: 'Tu momento pico. Abre la app y repasa 5 min.', url: '/app' };
    default: return { title: 'Catedra', body: 'Tu momento de estudiar', url: '/app' };
  }
}

Deno.serve(async (_req) => {
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC")!,
    Deno.env.get("VAPID_PRIVATE")!
  );

  const now = new Date();
  const { data: prefs } = await supa.from("reminder_prefs").select("*").eq("enabled", true);

  for (const p of prefs ?? []) {
    const kind = due(p, now);
    if (!kind) continue;
    const msg = messageFor(kind);

    const { data: subs } = await supa.from("push_subscriptions").select("*").eq("user_id", p.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(msg)
        );
      } catch (e) {
        if ((e as any).statusCode === 404 || (e as any).statusCode === 410) {
          await supa.from("push_subscriptions").delete().eq("user_id", s.user_id).eq("endpoint", s.endpoint);
        }
      }
    }
  }
  return new Response("ok");
});