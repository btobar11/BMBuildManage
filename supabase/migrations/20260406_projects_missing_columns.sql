-- Add missing columns to projects table that were added in TypeORM entities but missing from schema

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS type TEXT NULL,
  ADD COLUMN IF NOT EXISTS folder TEXT NULL,
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(15, 2) NULL;
