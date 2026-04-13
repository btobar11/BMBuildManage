-- Migration: clients table
-- Date: 2026-04-13
-- Purpose: Create clients table for multi-tenant client management

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for company_id filtering
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);

-- Add client_id column to projects table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for client_id in projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS policy for clients - company isolation
DROP POLICY IF EXISTS clients_company_isolation ON clients;
CREATE POLICY clients_company_isolation ON clients
  USING (company_id = current_setting('app.company_id', true)::uuid);

-- Allow service role full access
DROP POLICY IF EXISTS clients_service_role ON clients;
CREATE POLICY clients_service_role ON clients
  FOR ALL
  USING (current_setting('app.request.jwt.role', true) = 'service_role');