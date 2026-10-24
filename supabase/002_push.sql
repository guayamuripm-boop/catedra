-- Catedra · Avisos push: dispositivos y preferencias.
-- Se puede pegar y correr TANTAS VECES como haga falta en Supabase > SQL Editor > Run: no duplica nada,
-- no pierde datos, y no se cae a mitad de camino si algo ya existía de una corrida anterior.

create table if not exists public.push_subscriptions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "subs: propio" on public.push_subscriptions;
create policy "subs: propio" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.reminder_prefs (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  next_exam_date  date,                                   -- próxima evaluación, fecha local del estudiante
  pico_hour       int,                                    -- hora local en que rinde más (8-20)
  tz              text not null default 'America/Caracas',
  last_study_date date,                                   -- último día que practicó
  streak          int not null default 0,                 -- racha de días seguidos hasta last_study_date (avisa "no la rompas")
  enabled         bool not null default true,
  last_sent_kind  text,                                   -- lo escribe la Edge Function: evita avisar dos veces el mismo día
  last_sent_on    date,
  updated_at      timestamptz not null default now()
);
alter table public.reminder_prefs enable row level security;
alter table public.reminder_prefs add column if not exists streak int not null default 0; -- por si la tabla venía de una versión anterior sin esta columna
drop policy if exists "prefs: propio" on public.reminder_prefs;
create policy "prefs: propio" on public.reminder_prefs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Disparador horario (requiere las extensiones pg_cron y pg_net: Database > Extensions).
-- Reemplaza <PROJECT_REF> (Settings > General > Reference ID) y <CRON_SECRET> (el mismo valor que pones en
-- `supabase secrets set CRON_SECRET=...`). Quita los "--" para activarlo. Si ya lo activaste antes, esto
-- reemplaza el disparador existente en vez de fallar por duplicado.
-- select cron.unschedule('catedra-reminders');
-- select cron.schedule('catedra-reminders', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>')
--   );
-- $$);
