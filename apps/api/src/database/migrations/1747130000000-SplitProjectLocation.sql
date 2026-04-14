-- Split location field into address and commune
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commune VARCHAR;

-- Migrate existing location data to address if it exists
UPDATE projects SET address = location WHERE location IS NOT NULL AND location != '';

-- Drop the old location column
ALTER TABLE projects DROP COLUMN IF EXISTS location;

-- Update RLS policies if needed (handled by TypeORM sync in dev)