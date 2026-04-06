-- ============================================================
-- Migration: RLS Strict Policies for Production
-- Date: 2026-04-06
-- Purpose: Replace "Allow all" policies with company_id based isolation
-- WARNING: This MUST be run AFTER production RLS is enabled
-- ============================================================

-- ============================================================
-- STEP 1: Create profiles table if not exists (for user-company linking)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile can be read/updated by the user themselves
DROP POLICY IF EXISTS "Profile can be read by owner" ON profiles;
CREATE POLICY "Profile can be read by owner" ON profiles 
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Profile can be updated by owner" ON profiles;
CREATE POLICY "Profile can be updated by owner" ON profiles 
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- STEP 2: Strict RLS Policies for Core Tables
-- ============================================================

-- COMPANIES: Users can see their own company
DROP POLICY IF EXISTS "Allow all companies" ON companies;
CREATE POLICY "Users can see own company" ON companies
  FOR ALL TO authenticated
  USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- PROJECTS: Filter by company_id through projects.company_id
DROP POLICY IF EXISTS "Allow all projects" ON projects;
CREATE POLICY "Users can see company projects" ON projects
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- BUDGETS: Filter through projects
DROP POLICY IF EXISTS "Allow all budgets" ON budgets;
CREATE POLICY "Users can see company budgets" ON budgets
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- STAGES: Filter through budgets → projects
DROP POLICY IF EXISTS "Allow all stages" ON stages;
CREATE POLICY "Users can see company stages" ON stages
  FOR ALL TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN projects p ON b.project_id = p.id
      WHERE p.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ITEMS: Filter through stages → budgets → projects
DROP POLICY IF EXISTS "Allow all items" ON items;
CREATE POLICY "Users can see company items" ON items
  FOR ALL TO authenticated
  USING (
    stage_id IN (
      SELECT s.id FROM stages s
      JOIN budgets b ON s.budget_id = b.id
      JOIN projects p ON b.project_id = p.id
      WHERE p.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- CLIENTS: Filter by company_id
DROP POLICY IF EXISTS "Allow all clients" ON clients;
CREATE POLICY "Users can see company clients" ON clients
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- RESOURCES: Filter by company_id (null = global resources)
DROP POLICY IF EXISTS "Allow all resources" ON resources;
CREATE POLICY "Users can see company or global resources" ON resources
  FOR ALL TO authenticated
  USING (
    company_id IS NULL OR company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- WORKERS: Filter through projects
DROP POLICY IF EXISTS "Allow all workers" ON workers;
CREATE POLICY "Users can see company workers" ON workers
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- APU_TEMPLATES: Filter by company_id (null = global)
DROP POLICY IF EXISTS "Allow all apu_templates" ON apu_templates;
CREATE POLICY "Users can see company or global apu_templates" ON apu_templates
  FOR ALL TO authenticated
  USING (
    company_id IS NULL OR company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- APPU RESOURCES: Filter through apu_templates
DROP POLICY IF EXISTS "Allow all apu_resources" ON apu_resources;
CREATE POLICY "Users can see company or global apu_resources" ON apu_resources
  FOR ALL TO authenticated
  USING (
    apu_id IN (
      SELECT id FROM apu_templates
      WHERE company_id IS NULL OR company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- UNITS: All users can see (reference table)
DROP POLICY IF EXISTS "Allow all units" ON units;
CREATE POLICY "All authenticated users can see units" ON units
  FOR ALL TO authenticated
  USING (true);

-- EXPENSES: Filter through projects
DROP POLICY IF EXISTS "Allow all expenses" ON expenses;
CREATE POLICY "Users can see company expenses" ON expenses
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- DOCUMENTS: Filter through projects
DROP POLICY IF EXISTS "Allow all documents" ON documents;
CREATE POLICY "Users can see company documents" ON documents
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- PROJECT_MODELS: Filter through projects
DROP POLICY IF EXISTS "Allow all project_models" ON project_models;
CREATE POLICY "Users can see company models" ON project_models
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- BIM_ELEMENTS: Filter through project_models → projects
DROP POLICY IF EXISTS "Allow all bim_elements" ON bim_elements;
CREATE POLICY "Users can see company bim_elements" ON bim_elements
  FOR ALL TO authenticated
  USING (
    model_id IN (
      SELECT pm.id FROM project_models pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- PROJECT_CONTINGENCIES: Filter through projects
DROP POLICY IF EXISTS "Allow all project_contingencies" ON project_contingencies;
CREATE POLICY "Users can see company contingencies" ON project_contingencies
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================================
-- STEP 3: Helper function for company isolation
-- ============================================================

CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ SECURITY DEFINER;

-- ============================================================
-- STEP 4: Verification query
-- ============================================================

-- Run this to verify policies are active:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Expected: All policies should reference auth.uid() or profiles table
-- ============================================================
-- END OF MIGRATION
-- ============================================================
