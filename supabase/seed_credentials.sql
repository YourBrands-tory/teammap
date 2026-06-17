-- ============================================================================
-- TeamMap — Seed email + password for all members
-- Run in Supabase → SQL Editor after add_credentials.sql
-- ============================================================================

-- First ensure columns exist
alter table members add column if not exists email text;
alter table members add column if not exists password text;

-- Disable RLS on all tables (we handle auth ourselves)
alter table profiles  disable row level security;
alter table members   disable row level security;
alter table clients   disable row level security;
alter table links     disable row level security;
alter table tasks     disable row level security;
alter table milestones disable row level security;
alter table tags      disable row level security;
alter table app_state disable row level security;
alter table member_sheets disable row level security;

-- Seed credentials
update members set email='parth@agency.com',   password='parth1234'  where id='idmolzzgvgqn';
update members set email='aayushi@agency.com', password='aayushi123' where id='m1';
update members set email='bhakti@agency.com',  password='bhakti123'  where id='m3';
update members set email='asha@agency.com',    password='asha123'    where id='idmolzzmgqarm';
update members set email='shakti@agency.com',  password='shakti123'  where id='xmpqxqmelqw';
update members set email='virtip@agency.com',  password='virtip123'  where id='xmqg0g3te87';
update members set email='purva@agency.com',   password='purva123'   where id='m2';
update members set email='virti@agency.com',   password='virti123'   where id='xmpqxrssyze';

-- Verify
select id, name, role, email from members order by name;
