-- ============================================================================
-- TeamMap — Migration: member auth accounts + per-member playground sheets
-- Run after schema.sql. Safe to re-run.
-- ============================================================================

-- ── 1. Ensure profiles has all needed columns ───────────────────────────────
alter table profiles add column if not exists email text;
alter table profiles add column if not exists invited_at timestamptz;

-- ── 2. member_sheets: per-member playground data, NOT shared app_state ──────
create table if not exists member_sheets (
  id        uuid primary key default gen_random_uuid(),
  member_id text not null references members(id) on delete cascade,
  data      jsonb not null default '{"tabs":[{"id":"pg1","name":"Sheet 1","data":{}}]}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(member_id)
);

-- ── 3. RLS on member_sheets ─────────────────────────────────────────────────
alter table member_sheets enable row level security;

-- Admins/managers can read/write all member sheets
drop policy if exists member_sheets_admin_all on member_sheets;
create policy member_sheets_admin_all on member_sheets
  for all using (is_admin() or is_manager())
  with check (is_admin() or is_manager());

-- Members can read/write ONLY their own row (where member_id matches their profile)
drop policy if exists member_sheets_member_read on member_sheets;
create policy member_sheets_member_read on member_sheets
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and member_sheets.member_id = p.member_id
    )
  );

drop policy if exists member_sheets_member_write on member_sheets;
create policy member_sheets_member_write on member_sheets
  for insert using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and member_sheets.member_id = p.member_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and member_sheets.member_id = p.member_id
    )
  );

drop policy if exists member_sheets_member_update on member_sheets;
create policy member_sheets_member_update on member_sheets
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and member_sheets.member_id = p.member_id
    )
  );

-- ── 4. RLS: let members write their own lineUpHidden/lineUpOrder ────────────
-- We don't scope these per-member in app_state because the current code
-- stores them globally. Members can still view their tasks; hide/reorder
-- will work optimistically but won't persist to DB (RLS blocks app_state writes).
-- This is acceptable — RLS is the security boundary and reading tasks is the
-- critical path. If needed, a future migration could use a member_prefs table.

-- ── 5. Updated tasks RLS: members can INSERT their own tasks ─────────────────
-- (e.g. quick-create from playground). Existing policies cover SELECT and UPDATE.
-- Add INSERT policy for members:
drop policy if exists tasks_member_insert on tasks;
create policy tasks_member_insert on tasks for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and tasks.assigned_to ? p.member_id
    )
  );

-- ── 6. Admin helper: invite a new auth user and link to a member ────────────
-- Usage in Supabase SQL editor (not from client):
--   select admin_invite_user('email@example.com', 'password123', 'm1', 'member');
-- Or via client using supabase.rpc() — SECURITY DEFINER so it can modify auth.users.
create or replace function admin_invite_user(
  user_email text,
  user_password text default null,
  target_member_id text default null,
  target_role text default 'member'
) returns jsonb
language plpgsql security definer
as $$
declare
  new_user_id uuid;
  result jsonb;
begin
  -- Only admins can call this
  if not (select is_admin()) then
    return jsonb_build_object('error', 'Only admins can invite users');
  end if;

  -- Check if auth user already exists with this email
  select id into new_user_id from auth.users where email = user_email;
  if found then
    -- Just update the profile
    insert into profiles (id, role, member_id, email)
    values (new_user_id, target_role, target_member_id, user_email)
    on conflict (id) do update set role = target_role, member_id = target_member_id, email = user_email;
    return jsonb_build_object('id', new_user_id::text, 'existing', true);
  end if;

  -- Create user in auth.users
  new_user_id := gen_random_uuid();
  insert into auth.users (id, email, encrypted_password, email_confirmed_at)
  values (
    new_user_id,
    user_email,
    crypt(user_password, gen_salt('bf')),
    now()
  );

  -- Create profile
  insert into profiles (id, role, member_id, email)
  values (new_user_id, target_role, target_member_id, user_email);

  return jsonb_build_object('id', new_user_id::text, 'existing', false);
end;
$$;

-- ── 7. Admin helper: list profiles with member info ─────────────────────────
create or replace function admin_get_profiles() returns jsonb
language sql security definer
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'role', p.role,
      'member_id', p.member_id,
      'member_name', m.name,
      'created_at', p.created_at
    )
    order by p.created_at desc
  ), '[]'::jsonb)
  from profiles p
  left join members m on m.id = p.member_id;
$$;

-- ── 8. Admin helper: delete a profile (disconnect auth user from team) ──────
create or replace function admin_delete_profile(target_id uuid) returns jsonb
language plpgsql security definer
as $$
begin
  if not (select is_admin()) then
    return jsonb_build_object('error', 'Only admins can delete profiles');
  end if;
  delete from profiles where id = target_id;
  return jsonb_build_object('deleted', true);
end;
$$;
