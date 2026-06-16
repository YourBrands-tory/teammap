-- ============================================================================
-- TeamMap — Fix: admin_invite_user creates a proper auth user + identity
-- Run this after fix.sql. Safe to re-run.
-- ============================================================================

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

  if user_password is null or user_password = '' then
    return jsonb_build_object('error', 'Password is required');
  end if;

  -- Check if auth user already exists with this email
  select id into new_user_id from auth.users where email = user_email;
  if found then
    insert into profiles (id, role, member_id, email)
    values (new_user_id, target_role, target_member_id, user_email)
    on conflict (id) do update set role = target_role, member_id = target_member_id, email = user_email;
    return jsonb_build_object('id', new_user_id::text, 'existing', true);
  end if;

  new_user_id := gen_random_uuid();

  -- 1. Create auth user with all required columns
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  -- 2. Create identity record (REQUIRED for login to work)
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    user_email,
    now(),
    now(),
    now()
  );

  -- 3. Create profile
  insert into profiles (id, role, member_id, email)
  values (new_user_id, target_role, target_member_id, user_email);

  return jsonb_build_object('id', new_user_id::text, 'existing', false);
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$;
