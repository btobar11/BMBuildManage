-- Migration 002: Add missing multi-tenant columns and tables (Fixed Order)
-- This migration fixes critical multi-tenancy security issues

-- 1. Add company_id to documents table (missing from initial schema)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. Create invoices table (completely missing from initial schema)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier VARCHAR(300) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create project_models table (BIM models - missing from initial schema)
CREATE TABLE IF NOT EXISTS project_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    format VARCHAR(50),
    processing_status VARCHAR(50) DEFAULT 'pending',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Now create indexes after columns exist
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_company ON documents(project_id, company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_company ON invoices(project_id, company_id);
CREATE INDEX IF NOT EXISTS idx_project_models_project ON project_models(project_id);
CREATE INDEX IF NOT EXISTS idx_project_models_company ON project_models(company_id);
CREATE INDEX IF NOT EXISTS idx_project_models_project_company ON project_models(project_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_models_project_storage ON project_models(project_id, storage_path);

-- 5. Update documents table to set company_id based on existing project relationships
UPDATE documents 
SET company_id = (
    SELECT p.company_id 
    FROM projects p 
    WHERE p.id = documents.project_id
)
WHERE company_id IS NULL;

-- 6. Make company_id NOT NULL after backfilling data (only if column was just added)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'company_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE documents ALTER COLUMN company_id SET NOT NULL;
    END IF;
END $$;