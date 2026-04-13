-- Add location fields for Chilean address cascade
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commune VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add estimated area for surface tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_area NUMERIC(10, 2);