-- ============================================================================
-- TeamMap — Per-user playground sheets (pg_sheets)
-- Run after schema.sql and migration.sql. Safe to re-run.
-- ============================================================================

-- ── 1. pg_sheets: one row per owner, NOT shared app_state ────────────────────
create table if not exists pg_sheets (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,                          -- references members.id
  data       jsonb not null default '{"tabs":[{"id":"pg1","name":"Sheet 1","data":{}}]}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_id)
);

-- ── 2. RLS: require auth, let the app enforce owner scoping ────────────────
alter table pg_sheets enable row level security;

drop policy if exists pg_sheets_select on pg_sheets;
create policy pg_sheets_select on pg_sheets
  for select using (auth.role() = 'authenticated');

drop policy if exists pg_sheets_insert on pg_sheets;
create policy pg_sheets_insert on pg_sheets
  for insert with check (auth.role() = 'authenticated');

drop policy if exists pg_sheets_update on pg_sheets;
create policy pg_sheets_update on pg_sheets
  for update using (auth.role() = 'authenticated');

drop policy if exists pg_sheets_delete on pg_sheets;
create policy pg_sheets_delete on pg_sheets
  for delete using (auth.role() = 'authenticated');

-- ── 3. One-time migration: move existing global playground to first manager ───
-- Picks the first admin/manager member (by id) as owner.
insert into pg_sheets (owner_id, data)
select
  (select id from members where role in ('admin', 'manager') order by id limit 1),
  value
from app_state
where key = 'playground'
on conflict (owner_id) do nothing;

-- Remove the global key — new users get fresh defaults from the frontend
delete from app_state where key = 'playground';
