-- Migration: Add legal_type, industry[], challenges[] to companies table
-- Purpose: Support Chilean legal entity types and multi-select onboarding options

-- Create enum type for legal entity types if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_legal_type') THEN
    CREATE TYPE company_legal_type AS ENUM ('SpA', 'EIRL', 'Ltda.', 'S.A.', 'Empresa Individual');
  END IF;
END $$;

-- Add legal_type column
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS legal_type company_legal_type;

-- Add industry as text array (replaces single string)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS industry text[];

-- Add challenges as text array (new multi-select field)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS challenges text[];

-- Enable RLS on companies
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

CREATE POLICY "companies_select_policy" ON companies FOR SELECT USING (company_id = current_setting('app.current_company_id', true)::uuid);
CREATE POLICY "companies_insert_policy" ON companies FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);
CREATE POLICY "companies_update_policy" ON companies FOR UPDATE USING (company_id = current_setting('app.current_company_id', true)::uuid);
CREATE POLICY "companies_delete_policy" ON companies FOR DELETE USING (company_id = current_setting('app.current_company_id', true)::uuid);

COMMENT ON COLUMN companies.legal_type IS 'Tipo de entidad legal chilena: SpA, EIRL, Ltda., S.A., Empresa Individual';
COMMENT ON COLUMN companies.industry IS 'Tipos de construcción que realiza la empresa (array)';
COMMENT ON COLUMN companies.challenges IS 'Desafíos o dolores que quiere resolver ( array)';