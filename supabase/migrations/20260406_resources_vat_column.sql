ALTER TABLE projects ADD COLUMN IF NOT EXISTS type character varying(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS folder character varying(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_budget decimal(15, 2);

-- Migracion nueva
ALTER TABLE resources ADD COLUMN IF NOT EXISTS has_vat boolean DEFAULT false;
