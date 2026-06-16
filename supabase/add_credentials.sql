-- ============================================================================
-- TeamMap — Add email/password login columns + disable RLS for custom auth
-- ============================================================================

-- Add email + password columns to members for custom credential login
alter table members add column if not exists email text;
alter table members add column if not exists password text;

-- Disable RLS on all tables — we handle auth ourselves now
alter table profiles  disable row level security;
alter table members   disable row level security;
alter table clients   disable row level security;
alter table links     disable row level security;
alter table tasks     disable row level security;
alter table milestones disable row level security;
alter table tags      disable row level security;
alter table app_state disable row level security;
alter table member_sheets disable row level security;

-- Seed an admin login (change email/password after running)
-- update members set email='admin@agency.com', password='admin123' where role in ('admin','manager') limit 1;

-- Seed a member login (change email/password after running)
-- update members set email='member@agency.com', password='member123' where role='member' limit 1;
