-- Service Categories master table (parallel to moods/tags pattern)
CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888',
  created_at BIGINT
);

ALTER TABLE service_categories DISABLE ROW LEVEL SECURITY;

-- Add service_category_ids column to clients (JSONB array of category ids)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_category_ids JSONB DEFAULT '[]';

-- Seed default categories
INSERT INTO service_categories (id, label, color, created_at) VALUES
  ('sc_perf',     'Performance', '#2d6a4f', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('sc_social',   'Social',      '#2196c4', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('sc_website',  'Website',     '#7c3aed', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('sc_seo',      'SEO',         '#d97706', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('sc_other',    'Other',       '#e76f51', EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;
