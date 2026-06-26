-- Migration: Add moods table with hidden column for mood visibility control
-- Run in Supabase SQL Editor. Safe to re-run.
--
-- Previously moods were stored as a JSONB array in app_state. This migration
-- adds a normalized moods table so each mood's `hidden` flag can be updated
-- individually without rewriting the entire array.
-- =============================================================================

-- 1) Create moods table (id matches the ids used in DMOODS / task.mood)
CREATE TABLE IF NOT EXISTS moods (
  id        TEXT PRIMARY KEY,
  label     TEXT NOT NULL,
  icon      TEXT NOT NULL DEFAULT '📌',
  color     TEXT NOT NULL DEFAULT '#666',
  bg        TEXT NOT NULL DEFAULT '#f2f0ec',
  "desc"    TEXT DEFAULT '',
  max       INT,
  cardSize  TEXT DEFAULT 'narrow',
  hidden    BOOLEAN NOT NULL DEFAULT false
);

-- 2) Insert default moods if the table is empty
INSERT INTO moods (id, label, icon, color, bg, "desc", max, cardSize, hidden)
SELECT * FROM (VALUES
  ('top',        'Top',          '🔴', '#dc2626', '#fee2e2', 'Urgent, do first',             NULL,  'narrow', false),
  ('hero',       'Hero',         '⚡', '#c9920a', '#fffbeb', 'High impact, max 2/day',        2,     'big',    false),
  ('imp',        'Imp',          '⭐', '#7c3aed', '#ede9fe', 'Important, max 3/day',          3,     'big',    false),
  ('creative',   'Creative',     '🎨', '#be185d', '#fce7f3', 'Creative work',                 NULL,  'mid',    false),
  ('rapid',      'Rapid',        '💨', '#0f7c6c', '#d1fae5', 'Quick tasks',                   NULL,  'narrow', true),
  ('share',      'Share',        '🔗', '#2196c4', '#e3f2fd', 'To share/handoff',              NULL,  'narrow', true),
  ('secondhalf', 'Second Half',  '🌤️', '#d97706', '#fef3c7', 'Second half of the day',       NULL,  'narrow', true),
  ('followup',   'Follow Up',    '📞', '#1d4ed8', '#dbeafe', 'Tasks needing follow-up',       NULL,  'narrow', true)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM moods);

-- 3) Ensure hidden column exists and set correct defaults
ALTER TABLE moods ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;
UPDATE moods SET hidden = false WHERE id IN ('top','hero','imp','creative');
UPDATE moods SET hidden = true  WHERE id IN ('rapid','share','secondhalf','followup');

-- 4) Disable RLS on moods so all authenticated users can update hidden state
ALTER TABLE moods DISABLE ROW LEVEL SECURITY;
