-- ============================================================================
-- TeamMap — Cleanup: drop unused admin functions + simplify RLS
-- Safe to re-run. Will not affect existing data in any table.
-- ============================================================================

-- ── 1. Drop unused admin RPC functions ───────────────────────────────────────
drop function if exists admin_invite_user(text, text, text, text);
drop function if exists admin_get_profiles();
drop function if exists admin_delete_profile(uuid);

-- ── 2. Simplify RLS: any authenticated user can read/write all tables ────────
-- Since the frontend no longer uses role-based access control, we replace
-- the admin/manager/member policies with simple "authenticated = full access".

do $$
declare t text;
begin
  foreach t in array array['members','clients','links','milestones','tags','app_state','tasks']
  loop
    execute format('drop policy if exists %1$s_read on %1$s;', t);
    execute format('create policy %1$s_read on %1$s for select using (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists %1$s_write on %1$s;', t);
    execute format('create policy %1$s_write on %1$s for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- Drop the old granular task policies (they reference is_admin/is_manager)
drop policy if exists tasks_admin_write on tasks;
drop policy if exists tasks_member_update on tasks;

-- ── 3. Simplify profiles RLS ─────────────────────────────────────────────────
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists profiles_write on profiles;
create policy profiles_write on profiles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── 4. Simplify member_sheets RLS ────────────────────────────────────────────
drop policy if exists member_sheets_admin_all on member_sheets;
drop policy if exists member_sheets_member_read on member_sheets;
drop policy if exists member_sheets_member_write on member_sheets;
drop policy if exists member_sheets_member_update on member_sheets;

create policy member_sheets_read on member_sheets for select
  using (auth.role() = 'authenticated');

create policy member_sheets_write on member_sheets for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── 5. Drop unused helper functions (no longer needed by RLS) ────────────────
drop function if exists is_admin();
drop function if exists is_manager();
