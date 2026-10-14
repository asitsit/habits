-- Empêche la mise en pause du projet Supabase gratuit (7 jours sans activité).
-- Une fonction appelée chaque jour (cron Vercel + GitHub Actions) écrit une
-- ligne en base : une vraie écriture compte comme activité, contrairement à
-- une simple lecture que la RLS renvoie vide.

create table if not exists keep_alive (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now(),
  ping_count bigint not null default 0
);

-- Table interne : personne n'y accède directement, seulement via la fonction.
alter table keep_alive enable row level security;

create or replace function public.keep_alive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into keep_alive (id, pinged_at, ping_count) values (1, now(), 1)
  on conflict (id) do update
    set pinged_at = now(), ping_count = keep_alive.ping_count + 1
  returning pinged_at;
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
