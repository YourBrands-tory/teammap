-- Add updated_by column to tasks table and create task_activity table
-- Run this in your Supabase SQL editor

alter table tasks add column if not exists updated_by text;

create table if not exists task_activity (
  id         bigint generated always as identity primary key,
  task_id    text not null references tasks(id) on delete cascade,
  action     text not null,
  field      text,
  old_value  jsonb,
  new_value  jsonb,
  user_id    text not null,    -- references members.id (the app's auth system)
  created_at bigint default (extract(epoch from now()) * 1000)
);

create index if not exists task_activity_task_id_idx on task_activity(task_id);
create index if not exists task_activity_created_at_idx on task_activity(created_at desc);
