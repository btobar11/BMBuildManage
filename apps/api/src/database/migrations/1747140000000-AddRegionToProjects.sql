-- Add region column to projects for Chilean location cascade
ALTER TABLE projects ADD COLUMN IF NOT EXISTS region VARCHAR;