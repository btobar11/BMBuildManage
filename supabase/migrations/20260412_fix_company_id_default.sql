-- Fix company_id UUID default generation and remove invalid company_id column
-- This addresses the error: null value in column "company_id" of relation "companies" violates not-null constraint

-- Fix 1: Set UUID default for id column
ALTER TABLE companies ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Fix 2: Make any incorrectly added company_id column nullable 
-- (companies is top-level entity, should not have company_id reference)
ALTER TABLE companies ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE companies ALTER COLUMN company_id SET DEFAULT NULL;