-- Add legal_type, industry[], and challenges[] columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_type VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS challenges TEXT[];