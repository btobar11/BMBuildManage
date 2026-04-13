-- Convert project type from single string to array for multi-select support
ALTER TABLE projects ALTER COLUMN type TYPE TEXT[];
ALTER TABLE projects ALTER COLUMN type DROP NOT NULL;