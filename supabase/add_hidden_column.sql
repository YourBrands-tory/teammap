-- Add hidden column to tasks table for hide/unhide functionality
-- Run this in your Supabase SQL editor
alter table tasks add column if not exists hidden boolean default false;
