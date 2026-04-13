-- Add estimated_area column to projects for surface area tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_area NUMERIC(10, 2);
