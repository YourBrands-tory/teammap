-- ============================================================================
-- TeamMap — Supabase schema
-- Run in Supabase → SQL Editor. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- IDs are TEXT to preserve the legacy ids from your JSON backup (e.g. "m1",
-- "xmpqxcw9r5mt"). Do not switch these to uuid or the import will break links.
-- ============================================================================

-- ── profiles: maps an auth user to a role + (optionally) a team member ──────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'member',   -- 'admin' | 'member'
  member_id   text,                              -- links a login to a members.id
  created_at  timestamptz default now()
);

-- ── core tables (TEXT ids to match the legacy backup) ───────────────────────
create table if not exists members (
  id        text primary key,
  name      text not null,
  role      text,
  color     text,
  capacity  int default 6
);

create table if not exists clients (
  id        text primary key,
  name      text not null,
  industry  text default '',
  color     text,
  ord       int default 0
);

create table if not exists links (
  id         text primary key,
  member_id  text references members(id) on delete cascade,
  client_id  text references clients(id) on delete cascade,
  roles      jsonb default '[]'::jsonb        -- nested roles kept as jsonb
);

create table if not exists tasks (
  id            text primary key,
  name          text not null,
  client_id     text,
  date          date,
  mood          text,
  status        text default 'Not Started',
  assigned_to   jsonb default '[]'::jsonb,     -- array of member ids
  tags          jsonb default '[]'::jsonb,
  est_h         int default 0,
  est_m         int default 0,
  notes         text default '',
  is_milestone  boolean default false,
  milestone_id  text,
  deleted       boolean default false,
  created_at    bigint,                         -- ms epoch (matches old data)
  updated_at    bigint
);
create index if not exists tasks_date_idx on tasks(date);
create index if not exists tasks_deleted_idx on tasks(deleted);

create table if not exists milestones (
  id           text primary key,
  name         text not null,
  description  text default '',
  assigned_to  jsonb default '[]'::jsonb,
  color        text,
  created_at   bigint
);

create table if not exists tags (
  id     text primary key,
  label  text not null,
  color  text
);

-- ── app_state: one row per config singleton (settings, moods, navOrder, ...) ─
create table if not exists app_state (
  key    text primary key,
  value  jsonb
);

-- ── helper: is the current user an admin? ───────────────────────────────────
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table profiles   enable row level security;
alter table members    enable row level security;
alter table clients    enable row level security;
alter table links      enable row level security;
alter table tasks      enable row level security;
alter table milestones enable row level security;
alter table tags       enable row level security;
alter table app_state  enable row level security;

-- profiles: a user can read their own profile; admins can read all.
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select
  using (id = auth.uid() or is_admin());

-- Everything below: any authenticated user can READ.
-- Admins can WRITE everything. Members can update their OWN tasks (status etc.).
-- Tighten later as you build the member view.

do $$
declare t text;
begin
  foreach t in array array['members','clients','links','milestones','tags','app_state']
  loop
    execute format('drop policy if exists %1$s_read on %1$s;', t);
    execute format('create policy %1$s_read on %1$s for select using (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists %1$s_write on %1$s;', t);
    execute format('create policy %1$s_write on %1$s for all using (is_admin()) with check (is_admin());', t);
  end loop;
end $$;

-- tasks: read for all authenticated; admin full write; members update own tasks.
drop policy if exists tasks_read on tasks;
create policy tasks_read on tasks for select using (auth.role() = 'authenticated');

drop policy if exists tasks_admin_write on tasks;
create policy tasks_admin_write on tasks for all using (is_admin()) with check (is_admin());

drop policy if exists tasks_member_update on tasks;
create policy tasks_member_update on tasks for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.member_id is not null
        and tasks.assigned_to ? p.member_id      -- member is assigned to this task
    )
  );

-- ── make yourself admin after creating your auth user ───────────────────────
-- 1) Authentication → Users → Add user (email + password) — that's your admin login.
-- 2) Run (replace the email):
--    insert into profiles (id, role)
--    select id, 'admin' from auth.users where email = 'you@agency.com'
--    on conflict (id) do update set role = 'admin';
-- 3) Sign in, go to Settings → Import JSON backup.
