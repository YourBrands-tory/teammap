-- ============================================================================
-- TeamMap — Fix: define missing is_admin() / is_manager() functions
-- Run this FIRST if migration.sql failed with "function is_manager() does not exist".
-- Safe to re-run. Drops and recreates everything migration.sql attempted so you
-- can pick up cleanly without re-running the full migration.
-- ============================================================================

-- ── 1. Define both helper functions (from schema.sql) ───────────────────────
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_manager() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'manager');
$$;

-- ── 2. Drop migration functions so they can be recreated ────────────────────
drop function if exists admin_invite_user(text, text, text, text);
drop function if exists admin_get_profiles();
drop function if exists admin_delete_profile(uuid);

-- ── 3. Drop migration policies so they can be recreated ─────────────────────
drop policy if exists member_sheets_admin_all on member_sheets;
drop policy if exists member_sheets_member_read on member_sheets;
drop policy if exists member_sheets_member_write on member_sheets;
drop policy if exists member_sheets_member_update on member_sheets;
drop policy if exists tasks_member_insert on tasks;

-- ── 4. Recreate member_sheets RLS policies ─────────────────────────────────
create policy member_sheets_admin_all on member_sheets
  for all using (is_admin() or is_manager())
  with check (is_admin() or is_manager());

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

-- ── 5. Recreate tasks INSERT policy for members ────────────────────────────
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

-- ── 6. Recreate admin helper functions ──────────────────────────────────────
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
begin
  if not (select is_admin()) then
    return jsonb_build_object('error', 'Only admins can invite users');
  end if;

  select id into new_user_id from auth.users where email = user_email;
  if found then
    insert into profiles (id, role, member_id, email)
    values (new_user_id, target_role, target_member_id, user_email)
    on conflict (id) do update set role = target_role, member_id = target_member_id, email = user_email;
    return jsonb_build_object('id', new_user_id::text, 'existing', true);
  end if;

  new_user_id := gen_random_uuid();
  insert into auth.users (id, email, encrypted_password, email_confirmed_at)
  values (new_user_id, user_email, crypt(user_password, gen_salt('bf')), now());

  insert into profiles (id, role, member_id, email)
  values (new_user_id, target_role, target_member_id, user_email);

  return jsonb_build_object('id', new_user_id::text, 'existing', false);
end;
$$;

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
