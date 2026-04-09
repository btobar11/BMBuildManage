-- Migration 002: Add missing multi-tenant columns and tables
-- This migration fixes critical multi-tenancy security issues

-- 1. Add company_id to documents table (missing from initial schema)
ALTER TABLE documents ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_project_company ON documents(project_id, company_id);

-- 2. Create invoices table (completely missing from initial schema)
CREATE TABLE invoices (
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
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_project_company ON invoices(project_id, company_id);

-- 3. Create project_models table (BIM models - missing from initial schema)
CREATE TABLE project_models (
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
CREATE INDEX idx_project_models_project ON project_models(project_id);
CREATE INDEX idx_project_models_company ON project_models(company_id);
CREATE INDEX idx_project_models_project_company ON project_models(project_id, company_id);
CREATE UNIQUE INDEX idx_project_models_project_storage ON project_models(project_id, storage_path);

-- 4. Update documents table to set company_id based on existing project relationships
-- This ensures existing documents are properly associated with companies
UPDATE documents 
SET company_id = (
    SELECT p.company_id 
    FROM projects p 
    WHERE p.id = documents.project_id
)
WHERE company_id IS NULL;

-- 5. Make company_id NOT NULL after backfilling data
ALTER TABLE documents ALTER COLUMN company_id SET NOT NULL;

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY documents_company_isolation ON documents
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for invoices  
CREATE POLICY invoices_company_isolation ON invoices
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for project_models
CREATE POLICY project_models_company_isolation ON project_models
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_models TO authenticated;