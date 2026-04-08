-- ============================================================
-- HOTFIX SEC-001: NUCLEAR RLS LOCKDOWN
-- Date: 2026-04-07 (v2 — fixed auth schema permission error)
-- Priority: P0 - CRITICAL SECURITY PATCH
-- ============================================================
--
-- FIX v2: Function moved from auth.get_my_company_id()
--         to public.get_my_company_id() to avoid
--         "permission denied for schema auth" error.
--
-- This migration:
--   1. Creates helper function in PUBLIC schema (not auth)
--   2. Drops ALL "Allow all" USING(true) policies
--   3. Replaces them with strict company_id validation
--   4. Covers ALL 30+ tables including rfis, submittals, punch_items
-- ============================================================


-- ============================================================
-- STEP 0: ENSURE PROFILES TABLE EXISTS (idempotent)
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 1: HELPER FUNCTION IN PUBLIC SCHEMA (not auth!)
-- ============================================================
-- NOTE: auth schema is managed exclusively by Supabase.
--       We create the helper in public schema instead.

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_my_company_id() IS
  'Returns the company_id of the currently authenticated user via profiles table. SECURITY DEFINER prevents RLS bypass.';


-- ============================================================
-- STEP 2: NUCLEAR DROP OF ALL "Allow all" POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow all" ON companies;
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON projects;
DROP POLICY IF EXISTS "Allow all" ON clients;
DROP POLICY IF EXISTS "Allow all" ON budgets;
DROP POLICY IF EXISTS "Allow all" ON stages;
DROP POLICY IF EXISTS "Allow all" ON items;
DROP POLICY IF EXISTS "Allow all" ON resources;
DROP POLICY IF EXISTS "Allow all" ON workers;
DROP POLICY IF EXISTS "Allow all" ON apu_templates;
DROP POLICY IF EXISTS "Allow all" ON apu_resources;
DROP POLICY IF EXISTS "Allow all" ON units;
DROP POLICY IF EXISTS "Allow all" ON expenses;
DROP POLICY IF EXISTS "Allow all" ON invoices;
DROP POLICY IF EXISTS "Allow all" ON documents;
DROP POLICY IF EXISTS "Allow all" ON project_payments;
DROP POLICY IF EXISTS "Allow all" ON worker_assignments;
DROP POLICY IF EXISTS "Allow all" ON worker_payments;
DROP POLICY IF EXISTS "Allow all" ON project_contingencies;
DROP POLICY IF EXISTS "Allow all" ON templates;
DROP POLICY IF EXISTS "Allow all" ON template_stages;
DROP POLICY IF EXISTS "Allow all" ON template_items;
DROP POLICY IF EXISTS "Allow all" ON project_models;
DROP POLICY IF EXISTS "Allow all" ON bim_elements;
DROP POLICY IF EXISTS "Allow all" ON bim_clash_jobs;
DROP POLICY IF EXISTS "Allow all" ON bim_clashes;
DROP POLICY IF EXISTS "Allow all" ON rfis;
DROP POLICY IF EXISTS "Allow all" ON submittals;
DROP POLICY IF EXISTS "Allow all" ON punch_items;
DROP POLICY IF EXISTS "Allow all" ON audit_logs;

-- Drop named variants
DROP POLICY IF EXISTS "Allow all companies" ON companies;
DROP POLICY IF EXISTS "Allow all users" ON users;
DROP POLICY IF EXISTS "Allow all projects" ON projects;
DROP POLICY IF EXISTS "Allow all clients" ON clients;
DROP POLICY IF EXISTS "Allow all budgets" ON budgets;
DROP POLICY IF EXISTS "Allow all stages" ON stages;
DROP POLICY IF EXISTS "Allow all items" ON items;
DROP POLICY IF EXISTS "Allow all resources" ON resources;
DROP POLICY IF EXISTS "Allow all workers" ON workers;
DROP POLICY IF EXISTS "Allow all apu_templates" ON apu_templates;
DROP POLICY IF EXISTS "Allow all apu_resources" ON apu_resources;
DROP POLICY IF EXISTS "Allow all units" ON units;
DROP POLICY IF EXISTS "Allow all expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all documents" ON documents;
DROP POLICY IF EXISTS "Allow all project_payments" ON project_payments;
DROP POLICY IF EXISTS "Allow all worker_assignments" ON worker_assignments;
DROP POLICY IF EXISTS "Allow all worker_payments" ON worker_payments;
DROP POLICY IF EXISTS "Allow all project_contingencies" ON project_contingencies;
DROP POLICY IF EXISTS "Allow all templates" ON templates;
DROP POLICY IF EXISTS "Allow all template_stages" ON template_stages;
DROP POLICY IF EXISTS "Allow all template_items" ON template_items;
DROP POLICY IF EXISTS "Allow all project_models" ON project_models;
DROP POLICY IF EXISTS "Allow all bim_elements" ON bim_elements;
DROP POLICY IF EXISTS "Allow all bim_clash_jobs" ON bim_clash_jobs;
DROP POLICY IF EXISTS "Allow all bim_clashes" ON bim_clashes;
DROP POLICY IF EXISTS "Allow all rfis" ON rfis;
DROP POLICY IF EXISTS "Allow all submittals" ON submittals;
DROP POLICY IF EXISTS "Allow all punch_items" ON punch_items;
DROP POLICY IF EXISTS "Allow all materials" ON materials;

-- Drop legacy audit_logs USING(true) policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON audit_logs;

-- Drop old migration policies to recreate cleanly
DROP POLICY IF EXISTS "Users can see own company" ON companies;
DROP POLICY IF EXISTS "Users can see company projects" ON projects;
DROP POLICY IF EXISTS "Users can see company budgets" ON budgets;
DROP POLICY IF EXISTS "Users can see company stages" ON stages;
DROP POLICY IF EXISTS "Users can see company items" ON items;
DROP POLICY IF EXISTS "Users can see company clients" ON clients;
DROP POLICY IF EXISTS "Users can see company or global resources" ON resources;
DROP POLICY IF EXISTS "Users can see company workers" ON workers;
DROP POLICY IF EXISTS "Users can see company or global apu_templates" ON apu_templates;
DROP POLICY IF EXISTS "Users can see company or global apu_resources" ON apu_resources;
DROP POLICY IF EXISTS "All authenticated users can see units" ON units;
DROP POLICY IF EXISTS "Users can see company expenses" ON expenses;
DROP POLICY IF EXISTS "Users can see company documents" ON documents;
DROP POLICY IF EXISTS "Users can see company models" ON project_models;
DROP POLICY IF EXISTS "Users can see company bim_elements" ON bim_elements;
DROP POLICY IF EXISTS "Users can see company contingencies" ON project_contingencies;

-- Drop profile policies to recreate
DROP POLICY IF EXISTS "Profile can be read by owner" ON profiles;
DROP POLICY IF EXISTS "Profile can be updated by owner" ON profiles;

-- Drop any previous sec001 policies (idempotent re-run safety)
DROP POLICY IF EXISTS "sec001_profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "sec001_profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "sec001_companies_all" ON companies;
DROP POLICY IF EXISTS "sec001_users_all" ON users;
DROP POLICY IF EXISTS "sec001_projects_all" ON projects;
DROP POLICY IF EXISTS "sec001_clients_all" ON clients;
DROP POLICY IF EXISTS "sec001_workers_all" ON workers;
DROP POLICY IF EXISTS "sec001_templates_all" ON templates;
DROP POLICY IF EXISTS "sec001_resources_select" ON resources;
DROP POLICY IF EXISTS "sec001_resources_insert" ON resources;
DROP POLICY IF EXISTS "sec001_resources_update" ON resources;
DROP POLICY IF EXISTS "sec001_resources_delete" ON resources;
DROP POLICY IF EXISTS "sec001_apu_templates_select" ON apu_templates;
DROP POLICY IF EXISTS "sec001_apu_templates_insert" ON apu_templates;
DROP POLICY IF EXISTS "sec001_apu_templates_update" ON apu_templates;
DROP POLICY IF EXISTS "sec001_apu_templates_delete" ON apu_templates;
DROP POLICY IF EXISTS "sec001_budgets_all" ON budgets;
DROP POLICY IF EXISTS "sec001_stages_all" ON stages;
DROP POLICY IF EXISTS "sec001_items_all" ON items;
DROP POLICY IF EXISTS "sec001_expenses_all" ON expenses;
DROP POLICY IF EXISTS "sec001_invoices_all" ON invoices;
DROP POLICY IF EXISTS "sec001_documents_all" ON documents;
DROP POLICY IF EXISTS "sec001_project_payments_all" ON project_payments;
DROP POLICY IF EXISTS "sec001_worker_assignments_all" ON worker_assignments;
DROP POLICY IF EXISTS "sec001_worker_payments_all" ON worker_payments;
DROP POLICY IF EXISTS "sec001_contingencies_all" ON project_contingencies;
DROP POLICY IF EXISTS "sec001_project_models_all" ON project_models;
DROP POLICY IF EXISTS "sec001_template_stages_all" ON template_stages;
DROP POLICY IF EXISTS "sec001_template_items_all" ON template_items;
DROP POLICY IF EXISTS "sec001_apu_resources_select" ON apu_resources;
DROP POLICY IF EXISTS "sec001_apu_resources_insert" ON apu_resources;
DROP POLICY IF EXISTS "sec001_apu_resources_update" ON apu_resources;
DROP POLICY IF EXISTS "sec001_apu_resources_delete" ON apu_resources;
DROP POLICY IF EXISTS "sec001_bim_elements_all" ON bim_elements;
DROP POLICY IF EXISTS "sec001_bim_clash_jobs_all" ON bim_clash_jobs;
DROP POLICY IF EXISTS "sec001_bim_clashes_all" ON bim_clashes;
DROP POLICY IF EXISTS "sec001_rfis_all" ON rfis;
DROP POLICY IF EXISTS "sec001_submittals_all" ON submittals;
DROP POLICY IF EXISTS "sec001_punch_items_all" ON punch_items;
DROP POLICY IF EXISTS "sec001_units_select" ON units;
DROP POLICY IF EXISTS "sec001_audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "sec001_audit_logs_insert" ON audit_logs;
DROP POLICY IF EXISTS "sec001_materials_select" ON materials;
DROP POLICY IF EXISTS "sec001_materials_insert" ON materials;
DROP POLICY IF EXISTS "sec001_materials_update" ON materials;
DROP POLICY IF EXISTS "sec001_materials_delete" ON materials;


-- ============================================================
-- STEP 3: ENSURE RLS ENABLED ON ALL TABLES
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clash_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 4: STRICT POLICIES — PROFILES (self-access only)
-- ============================================================

CREATE POLICY "sec001_profiles_select_self" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "sec001_profiles_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ============================================================
-- STEP 5: STRICT POLICIES — DIRECT company_id TABLES
-- ============================================================

-- COMPANIES: only your own company
CREATE POLICY "sec001_companies_all" ON companies
  FOR ALL TO authenticated
  USING (id = public.get_my_company_id());

-- USERS: only users in your company
CREATE POLICY "sec001_users_all" ON users
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- PROJECTS: only your company's projects
CREATE POLICY "sec001_projects_all" ON projects
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- CLIENTS: only your company's clients
CREATE POLICY "sec001_clients_all" ON clients
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- WORKERS: only your company's workers
CREATE POLICY "sec001_workers_all" ON workers
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- TEMPLATES: only your company's templates
CREATE POLICY "sec001_templates_all" ON templates
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- RESOURCES: own company OR global (company_id IS NULL = system library)
CREATE POLICY "sec001_resources_select" ON resources
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id() OR company_id IS NULL);

CREATE POLICY "sec001_resources_insert" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "sec001_resources_update" ON resources
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "sec001_resources_delete" ON resources
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());

-- APU_TEMPLATES: own company OR global
CREATE POLICY "sec001_apu_templates_select" ON apu_templates
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id() OR company_id IS NULL);

CREATE POLICY "sec001_apu_templates_insert" ON apu_templates
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "sec001_apu_templates_update" ON apu_templates
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "sec001_apu_templates_delete" ON apu_templates
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());


-- ============================================================
-- STEP 6: STRICT POLICIES — PROJECT-SCOPED TABLES
-- ============================================================

-- BUDGETS
CREATE POLICY "sec001_budgets_all" ON budgets
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- STAGES
CREATE POLICY "sec001_stages_all" ON stages
  FOR ALL TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN projects p ON b.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
    )
  );

-- ITEMS
CREATE POLICY "sec001_items_all" ON items
  FOR ALL TO authenticated
  USING (
    stage_id IN (
      SELECT s.id FROM stages s
      JOIN budgets b ON s.budget_id = b.id
      JOIN projects p ON b.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
    )
  );

-- EXPENSES
CREATE POLICY "sec001_expenses_all" ON expenses
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- INVOICES
CREATE POLICY "sec001_invoices_all" ON invoices
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- DOCUMENTS
CREATE POLICY "sec001_documents_all" ON documents
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- PROJECT_PAYMENTS
CREATE POLICY "sec001_project_payments_all" ON project_payments
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- WORKER_ASSIGNMENTS
CREATE POLICY "sec001_worker_assignments_all" ON worker_assignments
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- WORKER_PAYMENTS
CREATE POLICY "sec001_worker_payments_all" ON worker_payments
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- PROJECT_CONTINGENCIES
CREATE POLICY "sec001_contingencies_all" ON project_contingencies
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- PROJECT_MODELS
CREATE POLICY "sec001_project_models_all" ON project_models
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );


-- ============================================================
-- STEP 7: STRICT POLICIES — NESTED TABLES
-- ============================================================

-- TEMPLATE_STAGES
CREATE POLICY "sec001_template_stages_all" ON template_stages
  FOR ALL TO authenticated
  USING (
    template_id IN (
      SELECT id FROM templates WHERE company_id = public.get_my_company_id()
    )
  );

-- TEMPLATE_ITEMS
CREATE POLICY "sec001_template_items_all" ON template_items
  FOR ALL TO authenticated
  USING (
    template_stage_id IN (
      SELECT ts.id FROM template_stages ts
      JOIN templates t ON ts.template_id = t.id
      WHERE t.company_id = public.get_my_company_id()
    )
  );

-- APU_RESOURCES
CREATE POLICY "sec001_apu_resources_select" ON apu_resources
  FOR SELECT TO authenticated
  USING (
    apu_id IN (
      SELECT id FROM apu_templates
      WHERE company_id = public.get_my_company_id() OR company_id IS NULL
    )
  );

CREATE POLICY "sec001_apu_resources_insert" ON apu_resources
  FOR INSERT TO authenticated
  WITH CHECK (
    apu_id IN (
      SELECT id FROM apu_templates WHERE company_id = public.get_my_company_id()
    )
  );

CREATE POLICY "sec001_apu_resources_update" ON apu_resources
  FOR UPDATE TO authenticated
  USING (
    apu_id IN (
      SELECT id FROM apu_templates WHERE company_id = public.get_my_company_id()
    )
  )
  WITH CHECK (
    apu_id IN (
      SELECT id FROM apu_templates WHERE company_id = public.get_my_company_id()
    )
  );

CREATE POLICY "sec001_apu_resources_delete" ON apu_resources
  FOR DELETE TO authenticated
  USING (
    apu_id IN (
      SELECT id FROM apu_templates WHERE company_id = public.get_my_company_id()
    )
  );

-- BIM_ELEMENTS
CREATE POLICY "sec001_bim_elements_all" ON bim_elements
  FOR ALL TO authenticated
  USING (
    model_id IN (
      SELECT pm.id FROM project_models pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
    )
  );

-- BIM_CLASH_JOBS
CREATE POLICY "sec001_bim_clash_jobs_all" ON bim_clash_jobs
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id());

-- BIM_CLASHES
CREATE POLICY "sec001_bim_clashes_all" ON bim_clashes
  FOR ALL TO authenticated
  USING (
    job_id IN (
      SELECT id FROM bim_clash_jobs WHERE company_id = public.get_my_company_id()
    )
  );


-- ============================================================
-- STEP 8: FIELD MANAGEMENT TABLES
-- ============================================================

-- RFIS
CREATE POLICY "sec001_rfis_all" ON rfis
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- SUBMITTALS
CREATE POLICY "sec001_submittals_all" ON submittals
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );

-- PUNCH_ITEMS
CREATE POLICY "sec001_punch_items_all" ON punch_items
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    )
  );


-- ============================================================
-- STEP 9: REFERENCE TABLES (read-only for all authenticated)
-- ============================================================

-- UNITS: reference data — SELECT only, no write
CREATE POLICY "sec001_units_select" ON units
  FOR SELECT TO authenticated
  USING (true);
-- USING(true) is intentional: units is a global reference table (m, m2, kg...).
-- No INSERT/UPDATE/DELETE policy means no writes are possible via RLS.


-- ============================================================
-- STEP 10: AUDIT LOGS (strict isolation, append-only)
-- ============================================================

CREATE POLICY "sec001_audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "sec001_audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

-- No UPDATE/DELETE — immutable audit trail


-- ============================================================
-- STEP 11: MATERIALS (conditional — table may not exist)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materials') THEN
    EXECUTE 'DROP POLICY IF EXISTS "materials_select_own" ON materials';
    EXECUTE 'DROP POLICY IF EXISTS "materials_insert_own" ON materials';
    EXECUTE 'DROP POLICY IF EXISTS "materials_update_own" ON materials';
    EXECUTE 'DROP POLICY IF EXISTS "materials_delete_own" ON materials';

    EXECUTE 'CREATE POLICY "sec001_materials_select" ON materials
      FOR SELECT TO authenticated
      USING (company_id = public.get_my_company_id() OR company_id IS NULL)';

    EXECUTE 'CREATE POLICY "sec001_materials_insert" ON materials
      FOR INSERT TO authenticated
      WITH CHECK (company_id = public.get_my_company_id())';

    EXECUTE 'CREATE POLICY "sec001_materials_update" ON materials
      FOR UPDATE TO authenticated
      USING (company_id = public.get_my_company_id())
      WITH CHECK (company_id = public.get_my_company_id())';

    EXECUTE 'CREATE POLICY "sec001_materials_delete" ON materials
      FOR DELETE TO authenticated
      USING (company_id = public.get_my_company_id())';
  END IF;
END $$;


-- ============================================================
-- VERIFICATION QUERIES (run separately after migration)
-- ============================================================

-- 1. Confirm zero "Allow all" policies remain:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE schemaname = 'public' AND policyname ILIKE '%allow all%';
-- Expected: 0 rows

-- 2. Confirm new sec001_* policies exist:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE 'sec001_%'
-- ORDER BY tablename;
-- Expected: ~40+ rows

-- 3. Confirm RLS is ON for all tables:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: rowsecurity = true for all

-- ============================================================
-- END OF HOTFIX SEC-001 v2
-- ============================================================
