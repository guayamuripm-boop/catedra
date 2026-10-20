-- Catedra · Push: suscripciones y preferencias de recordatorio. RLS por fila propia (como user_state).
create table if not exists public.push_subscriptions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "subs: propio" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.reminder_prefs (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  next_exam_at  timestamptz,
  pico_hour     int,
  tz            text default 'America/Caracas',
  last_active_at timestamptz,
  streak        int default 0,
  enabled       bool not null default true,
  updated_at    timestamptz not null default now()
);
alter table public.reminder_prefs enable row level security;
create policy "prefs: propio" on public.reminder_prefs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- pg_cron: invocar la Edge Function cada hora (requiere extensión pg_cron + pg_net habilitadas).
-- Reemplaza <PROJECT_REF> y usa el service_role solo del lado servidor (nunca en el cliente).
-- select cron.schedule('catedra-reminders', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
--   );
-- $$);