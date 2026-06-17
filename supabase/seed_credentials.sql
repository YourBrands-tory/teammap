-- ============================================================================
-- TeamMap — FIX: disable RLS + normalize roles + seed email/password
-- Run this in Supabase → SQL Editor ONCE. Safe to re-run.
-- ============================================================================

-- 1. Disable RLS on ALL tables (custom auth bypasses Supabase Auth entirely)
alter table if exists profiles    disable row level security;
alter table if exists members     disable row level security;
alter table if exists clients     disable row level security;
alter table if exists links       disable row level security;
alter table if exists tasks       disable row level security;
alter table if exists milestones  disable row level security;
alter table if exists tags        disable row level security;
alter table if exists app_state   disable row level security;
alter table if exists member_sheets disable row level security;

-- 2. Add email + password columns (if not yet added)
alter table members add column if not exists email text;
alter table members add column if not exists password text;

-- 3. Normalize role values: accept 'Admin', 'admin', 'Manager', etc.
update members set role = 'admin'  where lower(role) in ('admin','owner','superadmin');
update members set role = 'member' where lower(role) in ('member','lead','comms director','project manager','designer','developer','manager');

-- 4. Verify what roles exist
select 'ROLES after normalization:' as info, role, count(*) from members group by role;

-- 5. Seed email + password for all 8 members
update members set email='parth@agency.com',   password='parth1234'  where id='idmolzzgvgqn';
update members set email='aayushi@agency.com', password='aayushi123' where id='m1';
update members set email='bhakti@agency.com',  password='bhakti123'  where id='m3';
update members set email='asha@agency.com',    password='asha123'    where id='idmolzzmgqarm';
update members set email='shakti@agency.com',  password='shakti123'  where id='xmpqxqmelqw';
update members set email='virtip@agency.com',  password='virtip123'  where id='xmqg0g3te87';
update members set email='purva@agency.com',   password='purva123'   where id='m2';
update members set email='virti@agency.com',   password='virti123'   where id='xmpqxrssyze';

-- 6. Verify everything
select id, name, role, email from members order by name;
