-- Milestones table for TeamMap
-- Each milestone has a title, mood, assigned members, client, date, deadline,
-- substeps (JSONB array), display settings, and soft-delete support.

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  mood TEXT DEFAULT '',
  assigned_to JSONB DEFAULT '[]'::jsonb,
  client_id TEXT DEFAULT '',
  date TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  substeps JSONB DEFAULT '[]'::jsonb,
  display_mode TEXT DEFAULT 'daily',
  display_days JSONB DEFAULT '[]'::jsonb,
  deleted BOOLEAN DEFAULT false,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (no restrictive RLS)
CREATE POLICY "Allow all" ON milestones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
