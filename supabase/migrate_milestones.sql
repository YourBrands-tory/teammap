-- ============================================================================
-- TeamMap — Fix milestones table: add columns from add_milestones.sql
-- The original schema.sql created milestones with only:
--   id, name, description, assigned_to, color, created_at
-- add_milestones.sql used CREATE TABLE IF NOT EXISTS which was a no-op.
-- This migration adds the missing columns.
-- ============================================================================

ALTER TABLE milestones ADD COLUMN IF NOT EXISTS title       TEXT NOT NULL DEFAULT '';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS mood        TEXT DEFAULT '';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS client_id   TEXT DEFAULT '';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS date        TEXT DEFAULT '';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS deadline    TEXT DEFAULT '';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS substeps    JSONB DEFAULT '[]'::jsonb;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'daily';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS display_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS deleted     BOOLEAN DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS updated_at  BIGINT;

-- Backfill: copy old name → title for existing rows
UPDATE milestones SET title = name WHERE title = '' AND name != '';
