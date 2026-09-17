-- Schema initial : thèmes, dimensions, entrées quotidiennes, scores par dimension.
-- Toutes les tables portent un user_id pour rester prêtes au multi-compte,
-- même si l'app est mono-utilisateur au lancement.

create extension if not exists pgcrypto;

create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists dimensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid references themes(id) on delete cascade,
  name text not null,
  type text not null check (type in ('scale', 'boolean')),
  group_label text,
  icon text,
  sort_order int not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  note_text text,
  voice_audio_url text,
  voice_transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists entry_scores (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  dimension_id uuid not null references dimensions(id) on delete cascade,
  value_int smallint check (value_int between 1 and 5),
  value_bool boolean,
  created_at timestamptz not null default now(),
  unique (entry_id, dimension_id)
);

create index if not exists dimensions_user_theme_idx on dimensions(user_id, theme_id);
create index if not exists entries_user_date_idx on entries(user_id, date);
create index if not exists entry_scores_entry_idx on entry_scores(entry_id);
create index if not exists entry_scores_dimension_idx on entry_scores(dimension_id);

-- updated_at auto sur entries
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists entries_set_updated_at on entries;
create trigger entries_set_updated_at
  before update on entries
  for each row
  execute function set_updated_at();

-- Row Level Security : chaque utilisateur ne voit/modifie que ses propres données.
alter table themes enable row level security;
alter table dimensions enable row level security;
alter table entries enable row level security;
alter table entry_scores enable row level security;

drop policy if exists "themes_owner" on themes;
create policy "themes_owner" on themes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "dimensions_owner" on dimensions;
create policy "dimensions_owner" on dimensions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries_owner" on entries;
create policy "entries_owner" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entry_scores_owner" on entry_scores;
create policy "entry_scores_owner" on entry_scores
  for all using (
    exists (
      select 1 from entries
      where entries.id = entry_scores.entry_id
        and entries.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from entries
      where entries.id = entry_scores.entry_id
        and entries.user_id = auth.uid()
    )
  );
