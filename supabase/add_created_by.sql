-- Ensure created_by column exists on tasks table (safe to re-run)
alter table tasks add column if not exists created_by text;

-- RLS: allow members to SELECT tasks they created (for "Sent" tab)
-- Without this, members can only see tasks where they are in assigned_to.
drop policy if exists tasks_member_created on tasks;
create policy tasks_member_created on tasks for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.member_id is not null
      and tasks.created_by = p.member_id
  )
);
