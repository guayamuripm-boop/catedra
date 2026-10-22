// Catedra · Edge Function: envía los recordatorios push. La invoca pg_cron cada hora (ver supabase/002_push.sql).
// Secretos: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen).
// Despliegue: supabase functions deploy send-reminders --no-verify-jwt   (la protege CRON_SECRET, no un JWT)
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { dueFor, localParts, messageFor } from "./reminders.js";

interface Pref {
  user_id: string;
  enabled: boolean;
  tz: string;
  pico_hour: number | null;
  next_exam_date: string | null;
  last_study_date: string | null;
  last_sent_kind: string | null;
  last_sent_on: string | null;
}
interface Sub { user_id: string; endpoint: string; p256dh: string; auth: string }

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

  const now = new Date();
  const { data: prefs, error } = await supa.from("reminder_prefs").select("*").eq("enabled", true);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const p of (prefs ?? []) as Pref[]) {
    const kind: string | null = dueFor(p, now);
    if (!kind) continue;
    const { data: subs } = await supa.from("push_subscriptions").select("*").eq("user_id", p.user_id);
    const payload = JSON.stringify(messageFor(kind));
    let ok = false;
    for (const s of (subs ?? []) as Sub[]) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        ok = true;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { // el navegador ya no acepta ese dispositivo
          await supa.from("push_subscriptions").delete().eq("user_id", s.user_id).eq("endpoint", s.endpoint);
        }
      }
    }
    if (ok) { // solo se marca como enviado si llegó a algún dispositivo: un aviso por día, no uno por hora
      sent++;
      await supa.from("reminder_prefs").update({ last_sent_kind: kind, last_sent_on: localParts(now, p.tz).date }).eq("user_id", p.user_id);
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
