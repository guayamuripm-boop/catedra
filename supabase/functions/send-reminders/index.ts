// Catedra · Edge Function: envía los recordatorios push. La invoca pg_cron cada hora (ver supabase/002_push.sql).
// Secretos: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen).
// Despliegue: supabase functions deploy send-reminders --no-verify-jwt   (la protege CRON_SECRET, no un JWT)
// Diagnóstico: añade ?debug=1 a la URL para que la respuesta detalle, por preferencia, por qué se envió o no
// (sin exponer claves ni endpoints completos) y vuelque el error real de cada intento de envío.
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
  streak: number | null;
  last_sent_kind: string | null;
  last_sent_on: string | null;
}
interface Sub { user_id: string; endpoint: string; p256dh: string; auth: string }

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  // Solo en debug: deja simular "ahora" (ej. ?now=2026-10-23T19:00:00-04:00) para probar sin esperar a la hora real.
  const nowParam = debug ? url.searchParams.get("now") : null;
  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const vapidPublic = Deno.env.get("VAPID_PUBLIC") ?? "", vapidPrivate = Deno.env.get("VAPID_PRIVATE") ?? "", vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "";
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error("faltan secretos VAPID: public=" + !!vapidPublic + " private=" + !!vapidPrivate + " subject=" + !!vapidSubject);
    return new Response(JSON.stringify({ sent: 0, error: "faltan secretos VAPID en la función" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const now = nowParam && !isNaN(Date.parse(nowParam)) ? new Date(nowParam) : new Date();
  const { data: prefs, error } = await supa.from("reminder_prefs").select("*").eq("enabled", true);
  if (error) { console.error("error leyendo reminder_prefs:", error.message); return new Response(error.message, { status: 500 }); }

  let sent = 0;
  const report: unknown[] = [];
  for (const p of (prefs ?? []) as Pref[]) {
    const kind: string | null = dueFor(p, now);
    if (!kind) { if (debug) report.push({ user: p.user_id.slice(0, 8), due: null, hora_local: localParts(now, p.tz) }); continue; }
    const { data: subs, error: subErr } = await supa.from("push_subscriptions").select("*").eq("user_id", p.user_id);
    if (subErr) console.error("error leyendo push_subscriptions:", subErr.message);
    const payload = JSON.stringify(messageFor(kind, { date: localParts(now, p.tz).date, streak: p.streak || 0 }));
    let ok = false;
    const attempts: unknown[] = [];
    for (const s of (subs ?? []) as Sub[]) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        ok = true;
        attempts.push({ ok: true });
      } catch (e) {
        const err = e as { statusCode?: number; body?: string; message?: string };
        console.error("fallo al enviar push a", s.endpoint.slice(0, 40), "status:", err.statusCode, "body:", err.body, "msg:", err.message);
        attempts.push({ ok: false, statusCode: err.statusCode, body: err.body, message: err.message });
        if (err.statusCode === 404 || err.statusCode === 410) { // el navegador ya no acepta ese dispositivo
          await supa.from("push_subscriptions").delete().eq("user_id", s.user_id).eq("endpoint", s.endpoint);
        }
      }
    }
    if (debug) report.push({ user: p.user_id.slice(0, 8), due: kind, suscripciones: (subs ?? []).length, attempts });
    if (ok) { // solo se marca como enviado si llegó a algún dispositivo: un aviso por día, no uno por hora
      sent++;
      await supa.from("reminder_prefs").update({ last_sent_kind: kind, last_sent_on: localParts(now, p.tz).date }).eq("user_id", p.user_id);
    }
  }
  const body = debug ? { sent, report } : { sent };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
});
