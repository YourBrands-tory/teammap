-- ============================================================================
-- TeamMap — Fix Milestones RLS
-- 
-- PROBLEM:
--   Milestones INSERT fails with 42501 (RLS violation) because the only write
--   policy (milestones_write) requires is_admin() or is_manager(). Members
--   who can create tasks cannot create milestones.
--
--   Additionally, milestones SELECT returns 0 rows for members because the
--   same milestones_write policy (for all, including SELECT) only allows
--   admin/manager. No member-level SELECT policy exists.
--
-- ROOT CAUSE:
--   Tasks have tasks_member_insert and tasks_member_update policies (from
--   migration.sql), but milestones lack equivalent member-level policies.
--   The schema.sql loop creates milestones_write with admin/manager check
--   and no member SELECT/INSERT/UPDATE policies exist.
--
-- FIX:
--   1. Recreate is_admin() / is_manager() in case they were dropped
--   2. Drop restrictive milestones_write + any "Allow all" permissive policy
--   3. Create admin_write (all ops), member_select, member_insert, member_update
--      policies mirroring tasks pattern
-- ============================================================================

-- ── 0. Ensure helper functions exist (may have been dropped) ──────────────
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_manager() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'manager');
$$;

-- ── 1. Drop the restrictive write policy (from schema.sql loop) ────────────
drop policy if exists milestones_write on milestones;

-- ── 2. Drop any permissive policy (from add_milestones.sql) ────────────────
drop policy if exists "Allow all" on milestones;

-- ── 3. Admin/Manager full access (mirrors tasks_admin_write) ───────────────
drop policy if exists milestones_admin_write on milestones;
create policy milestones_admin_write on milestones
  for all
  using (is_admin() or is_manager())
  with check (is_admin() or is_manager());

-- ── 4. Member SELECT: members can read milestones they are assigned to ─────
drop policy if exists milestones_member_select on milestones;
create policy milestones_member_select on milestones
  for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and milestones.assigned_to ? p.member_id
    )
  );

-- ── 5. Member INSERT: any member can insert milestones.
--     SELECT and UPDATE policies restrict visibility/editing to assigned members,
--     so INSERT is safe to leave open for all authenticated members.
drop policy if exists milestones_member_insert on milestones;
create policy milestones_member_insert on milestones
  for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
    )
  );

-- ── 6. Member UPDATE: members can update milestones they are assigned to
--     (mirrors tasks_member_update)
drop policy if exists milestones_member_update on milestones;
create policy milestones_member_update on milestones
  for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'member'
        and p.member_id is not null
        and milestones.assigned_to ? p.member_id
    )
  );
