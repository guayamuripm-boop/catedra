// Catedra · Edge Function: envía recordatorios push por web-push. Invocada por pg_cron.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

Deno.serve(async (_req) => {
  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

  const now = new Date();
  const { data: prefs } = await supa.from("reminder_prefs").select("*").eq("enabled", true);
  for (const p of prefs ?? []) {
    const kind = dueFor(p, now);
    if (!kind) continue;
    const msg = messageFor(kind);
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

// MISMA LÓGICA QUE js/reminders.js (fuente de verdad)
function dueFor(pref, now) {
  if (!pref?.enabled) return null;
  const tz = pref.tz || 'America/Caracas';
  const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const picoHour = pref.pico_hour ?? 15;
  const lastActive = pref.last_active_at ? new Date(pref.last_active_at) : null;
  const nextExam = pref.next_exam_at ? new Date(pref.next_exam_at) : null;

  if (lastActive) {
    const diffDays = Math.floor((nowLocal - lastActive) / 864e5);
    if (diffDays >= 3) return 'slip';
  }
  if (nextExam) {
    const diffMs = nextExam - nowLocal;
    const diffHours = diffMs / 3.6e6;
    if (diffHours >= 12 && diffHours <= 24) return 'exam-eve';
    const sameDay = nextExam.toDateString() === nowLocal.toDateString();
    if (sameDay && nowLocal.getHours() === picoHour) return 'exam-morning';
  }
  if (nowLocal.getHours() === picoHour) return 'daily';
  return null;
}

function messageFor(kind) {
  const msgs = {
    'exam-eve': { title: 'Mañana tienes examen', body: 'Repasa lo esencial 15 min. Te va a ir mejor.', url: '/app' },
    'exam-morning': { title: 'Hoy es el examen', body: 'Un último repaso rápido y a confiar. ¡Suerte!', url: '/app' },
    'daily': { title: 'Hora de estudiar', body: 'Tu bloque de hoy te espera. 15 min y listo.', url: '/app' },
    'slip': { title: 'Llevas 3 días sin estudiar', body: 'Vuelve con una sesión corta. Recuperas el ritmo en 5 min.', url: '/app' }
  };
  return msgs[kind] || { title: 'Catedra', body: 'Tienes algo pendiente', url: '/app' };
}