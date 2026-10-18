-- Catedra · estado del estudiante sincronizado entre dispositivos.
-- Se pega UNA vez en Supabase > SQL Editor > Run.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb       not null,
  version    int         not null default 2,   -- STATE_VERSION de la app
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

-- Cada estudiante solo ve, crea y cambia su propia fila.
create policy "propio: leer"      on public.user_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "propio: insertar"  on public.user_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "propio: actualizar" on public.user_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "propio: borrar"    on public.user_state for delete to authenticated using ((select auth.uid()) = user_id);
