-- ============================================================
-- Migration: RLS Security Hardening & Business Integrity
-- Date: 2026-03-30
-- Priority: P0 - Critical Security Fix
-- ============================================================
--
-- This migration implements:
-- 1. Row Level Security (RLS) on all multi-tenant tables
-- 2. Tenant isolation policies via JWT claims
-- 3. CHECK constraints for financial integrity
-- 4. Immutable total_price calculation
-- 5. Restrictive audit_logs policies
--
-- ============================================================

-- ============================================================
-- PART 1: ENABLE RLS ON ALL TABLES
-- ============================================================

-- Core tenant tables (direct company_id)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_resources ENABLE ROW LEVEL SECURITY;

-- Project-scoped tables (via project -> company_id)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_execution_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: HELPER FUNCTION FOR COMPANY ID EXTRACTION
-- ============================================================

-- Create a function to safely extract company_id from JWT claims
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'company_id',
    current_setting('request.jwt.claims', true)::json->>'user_metadata'::json->>'company_id',
    NULL
  )::UUID;
$$;

-- Also create a function to check if user is superadmin (for future use)
CREATE OR REPLACE FUNCTION auth.is_superuser()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin',
    FALSE
  );
$$;

-- ============================================================
-- PART 3: RLS POLICIES - DIRECT company_id TABLES
-- ============================================================

-- ========================================
-- COMPANIES
-- ========================================
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT TO authenticated
  USING (id = auth.company_id());

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE TO authenticated
  USING (id = auth.company_id());

-- No INSERT/DELETE for regular users on companies

-- ========================================
-- USERS
-- ========================================
CREATE POLICY "users_select_own_company" ON users
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "users_insert_own_company" ON users
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "users_update_own_company" ON users
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "users_delete_own_company" ON users
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- CLIENTS
-- ========================================
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- PROJECTS
-- ========================================
CREATE POLICY "projects_select_own" ON projects
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- WORKERS
-- ========================================
CREATE POLICY "workers_select_own" ON workers
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "workers_insert_own" ON workers
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "workers_update_own" ON workers
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "workers_delete_own" ON workers
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- WORKER ASSIGNMENTS
-- ========================================
CREATE POLICY "worker_assignments_select_own" ON worker_assignments
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_assignments_insert_own" ON worker_assignments
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_assignments_update_own" ON worker_assignments
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_assignments_delete_own" ON worker_assignments
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- WORKER PAYMENTS
-- ========================================
CREATE POLICY "worker_payments_select_own" ON worker_payments
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_payments_insert_own" ON worker_payments
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_payments_update_own" ON worker_payments
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "worker_payments_delete_own" ON worker_payments
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- TEMPLATES
-- ========================================
CREATE POLICY "templates_select_own" ON templates
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "templates_insert_own" ON templates
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "templates_update_own" ON templates
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "templates_delete_own" ON templates
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- TEMPLATE STAGES
-- ========================================
CREATE POLICY "template_stages_select_own" ON template_stages
  FOR SELECT TO authenticated
  USING (template_id IN (SELECT id FROM templates WHERE company_id = auth.company_id()));

CREATE POLICY "template_stages_insert_own" ON template_stages
  FOR INSERT TO authenticated
  WITH CHECK (template_id IN (SELECT id FROM templates WHERE company_id = auth.company_id()));

CREATE POLICY "template_stages_update_own" ON template_stages
  FOR UPDATE TO authenticated
  USING (template_id IN (SELECT id FROM templates WHERE company_id = auth.company_id()))
  WITH CHECK (template_id IN (SELECT id FROM templates WHERE company_id = auth.company_id()));

CREATE POLICY "template_stages_delete_own" ON template_stages
  FOR DELETE TO authenticated
  USING (template_id IN (SELECT id FROM templates WHERE company_id = auth.company_id()));

-- ========================================
-- TEMPLATE ITEMS
-- ========================================
CREATE POLICY "template_items_select_own" ON template_items
  FOR SELECT TO authenticated
  USING (template_stage_id IN (
    SELECT ts.id FROM template_stages ts
    JOIN templates t ON t.id = ts.template_id
    WHERE t.company_id = auth.company_id()
  ));

CREATE POLICY "template_items_insert_own" ON template_items
  FOR INSERT TO authenticated
  WITH CHECK (template_stage_id IN (
    SELECT ts.id FROM template_stages ts
    JOIN templates t ON t.id = ts.template_id
    WHERE t.company_id = auth.company_id()
  ));

CREATE POLICY "template_items_update_own" ON template_items
  FOR UPDATE TO authenticated
  USING (template_stage_id IN (
    SELECT ts.id FROM template_stages ts
    JOIN templates t ON t.id = ts.template_id
    WHERE t.company_id = auth.company_id()
  ))
  WITH CHECK (template_stage_id IN (
    SELECT ts.id FROM template_stages ts
    JOIN templates t ON t.id = ts.template_id
    WHERE t.company_id = auth.company_id()
  ));

CREATE POLICY "template_items_delete_own" ON template_items
  FOR DELETE TO authenticated
  USING (template_stage_id IN (
    SELECT ts.id FROM template_stages ts
    JOIN templates t ON t.id = ts.template_id
    WHERE t.company_id = auth.company_id()
  ));

-- ========================================
-- MACHINERY
-- ========================================
CREATE POLICY "machinery_select_own" ON machinery
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "machinery_insert_own" ON machinery
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "machinery_update_own" ON machinery
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "machinery_delete_own" ON machinery
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ========================================
-- RESOURCES
-- ========================================
CREATE POLICY "resources_select_own" ON resources
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "resources_insert_own" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "resources_update_own" ON resources
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL)
  WITH CHECK (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "resources_delete_own" ON resources
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

-- ========================================
-- RESOURCE PRICE HISTORY
-- ========================================
CREATE POLICY "resource_price_history_select_own" ON resource_price_history
  FOR SELECT TO authenticated
  USING (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

CREATE POLICY "resource_price_history_insert_own" ON resource_price_history
  FOR INSERT TO authenticated
  WITH CHECK (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

CREATE POLICY "resource_price_history_delete_own" ON resource_price_history
  FOR DELETE TO authenticated
  USING (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

-- ========================================
-- APU TEMPLATES
-- ========================================
CREATE POLICY "apu_templates_select_own" ON apu_templates
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "apu_templates_insert_own" ON apu_templates
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "apu_templates_update_own" ON apu_templates
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL)
  WITH CHECK (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "apu_templates_delete_own" ON apu_templates
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

-- ========================================
-- APU RESOURCES
-- ========================================
CREATE POLICY "apu_resources_select_own" ON apu_resources
  FOR SELECT TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

CREATE POLICY "apu_resources_insert_own" ON apu_resources
  FOR INSERT TO authenticated
  WITH CHECK (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

CREATE POLICY "apu_resources_update_own" ON apu_resources
  FOR UPDATE TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ))
  WITH CHECK (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

CREATE POLICY "apu_resources_delete_own" ON apu_resources
  FOR DELETE TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

-- ============================================================
-- PART 4: RLS POLICIES - PROJECT-SCOPED TABLES
-- ============================================================

-- ========================================
-- BUDGETS
-- ========================================
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- STAGES
-- ========================================
CREATE POLICY "stages_select_own" ON stages
  FOR SELECT TO authenticated
  USING (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "stages_insert_own" ON stages
  FOR INSERT TO authenticated
  WITH CHECK (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "stages_update_own" ON stages
  FOR UPDATE TO authenticated
  USING (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ))
  WITH CHECK (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "stages_delete_own" ON stages
  FOR DELETE TO authenticated
  USING (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

-- ========================================
-- ITEMS
-- ========================================
CREATE POLICY "items_select_own" ON items
  FOR SELECT TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "items_insert_own" ON items
  FOR INSERT TO authenticated
  WITH CHECK (stage_id IN (
    SELECT s.id FROM stages s
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "items_update_own" ON items
  FOR UPDATE TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ))
  WITH CHECK (stage_id IN (
    SELECT s.id FROM stages s
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "items_delete_own" ON items
  FOR DELETE TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

-- ========================================
-- EXPENSES
-- ========================================
CREATE POLICY "expenses_select_own" ON expenses
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "expenses_insert_own" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "expenses_update_own" ON expenses
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "expenses_delete_own" ON expenses
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- DOCUMENTS
-- ========================================
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- INVOICES
-- ========================================
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "invoices_insert_own" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "invoices_update_own" ON invoices
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "invoices_delete_own" ON invoices
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- PROJECT CONTINGENCIES
-- ========================================
CREATE POLICY "contingencies_select_own" ON project_contingencies
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "contingencies_insert_own" ON project_contingencies
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "contingencies_update_own" ON project_contingencies
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

CREATE POLICY "contingencies_delete_own" ON project_contingencies
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id()));

-- ========================================
-- BUDGET EXECUTION LOGS
-- ========================================
CREATE POLICY "execution_logs_select_own" ON budget_execution_logs
  FOR SELECT TO authenticated
  USING (budget_item_id IN (
    SELECT i.id FROM items i
    JOIN stages s ON s.id = i.stage_id
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "execution_logs_insert_own" ON budget_execution_logs
  FOR INSERT TO authenticated
  WITH CHECK (budget_item_id IN (
    SELECT i.id FROM items i
    JOIN stages s ON s.id = i.stage_id
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

CREATE POLICY "execution_logs_delete_own" ON budget_execution_logs
  FOR DELETE TO authenticated
  USING (budget_item_id IN (
    SELECT i.id FROM items i
    JOIN stages s ON s.id = i.stage_id
    JOIN budgets b ON b.id = s.budget_id
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = auth.company_id()
  ));

-- ============================================================
-- PART 5: FIX AUDIT LOGS POLICIES (RESTRICTIVE)
-- ============================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON audit_logs;

-- Create restrictive policies
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "audit_logs_insert_own" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

-- No UPDATE or DELETE on audit logs (immutable audit trail)
-- Only superuser can manage audit logs directly

-- ============================================================
-- PART 6: CHECK CONSTRAINTS FOR FINANCIAL INTEGRITY
-- ============================================================

-- Ensure quantities are non-negative
ALTER TABLE items
  ADD CONSTRAINT chk_items_quantity_nonnegative
  CHECK (quantity >= 0);

ALTER TABLE items
  ADD CONSTRAINT chk_items_quantity_executed_nonnegative
  CHECK (quantity_executed >= 0);

-- Ensure unit costs/prices are non-negative
ALTER TABLE items
  ADD CONSTRAINT chk_items_unit_cost_nonnegative
  CHECK (unit_cost >= 0);

ALTER TABLE items
  ADD CONSTRAINT chk_items_unit_price_nonnegative
  CHECK (unit_price >= 0);

ALTER TABLE items
  ADD CONSTRAINT chk_items_real_cost_nonnegative
  CHECK (real_cost >= 0);

-- Ensure expenses are non-negative
ALTER TABLE expenses
  ADD CONSTRAINT chk_expenses_amount_nonnegative
  CHECK (amount >= 0);

-- Ensure worker payments are non-negative
ALTER TABLE worker_payments
  ADD CONSTRAINT chk_worker_payments_amount_nonnegative
  CHECK (amount >= 0);

-- Ensure worker daily rates are non-negative
ALTER TABLE workers
  ADD CONSTRAINT chk_workers_daily_rate_nonnegative
  CHECK (daily_rate >= 0);

ALTER TABLE worker_assignments
  ADD CONSTRAINT chk_worker_assignments_daily_rate_nonnegative
  CHECK (daily_rate IS NULL OR daily_rate >= 0);

-- Ensure resources have non-negative prices
ALTER TABLE resources
  ADD CONSTRAINT chk_resources_base_price_nonnegative
  CHECK (base_price >= 0);

ALTER TABLE resource_price_history
  ADD CONSTRAINT chk_resource_price_history_price_nonnegative
  CHECK (price >= 0);

-- Ensure contingencies are non-negative
ALTER TABLE project_contingencies
  ADD CONSTRAINT chk_contingencies_quantity_nonnegative
  CHECK (quantity >= 0);

ALTER TABLE project_contingencies
  ADD CONSTRAINT chk_contingencies_unit_cost_nonnegative
  CHECK (unit_cost >= 0);

ALTER TABLE project_contingencies
  ADD CONSTRAINT chk_contingencies_total_cost_nonnegative
  CHECK (total_cost >= 0);

-- Ensure budget totals are non-negative
ALTER TABLE budgets
  ADD CONSTRAINT chk_budgets_total_cost_nonnegative
  CHECK (total_estimated_cost >= 0);

ALTER TABLE budgets
  ADD CONSTRAINT chk_budgets_total_price_nonnegative
  CHECK (total_estimated_price >= 0);

-- Ensure project estimated budget is non-negative
ALTER TABLE projects
  ADD CONSTRAINT chk_projects_estimated_budget_nonnegative
  CHECK (estimated_budget IS NULL OR estimated_budget >= 0);

-- Ensure execution logs are non-negative
ALTER TABLE budget_execution_logs
  ADD CONSTRAINT chk_execution_logs_quantity_nonnegative
  CHECK (quantity_executed >= 0);

ALTER TABLE budget_execution_logs
  ADD CONSTRAINT chk_execution_logs_real_cost_nonnegative
  CHECK (real_cost >= 0);

-- Ensure invoices are non-negative
ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_amount_nonnegative
  CHECK (amount >= 0);

-- Ensure machinery prices are non-negative
ALTER TABLE machinery
  ADD CONSTRAINT chk_machinery_price_per_hour_nonnegative
  CHECK (price_per_hour >= 0);

ALTER TABLE machinery
  ADD CONSTRAINT chk_machinery_price_per_day_nonnegative
  CHECK (price_per_day >= 0);

-- ============================================================
-- PART 7: IMMUTABLE TOTAL_PRICE CALCULATION
-- ============================================================

-- First, we need to drop the existing total_cost generated column
-- and recreate it along with total_price as generated columns

-- Step 1: Drop the existing generated column (it was created in initial schema)
ALTER TABLE items DROP COLUMN IF EXISTS total_cost;

-- Step 2: Add both total_cost and total_price as GENERATED ALWAYS columns
ALTER TABLE items
  ADD COLUMN total_cost NUMERIC(15, 2)
  GENERATED ALWAYS AS (quantity * unit_cost) STORED;

ALTER TABLE items
  ADD COLUMN total_price NUMERIC(15, 2)
  GENERATED ALWAYS AS (quantity * unit_price) STORED;

-- Note: The above may fail if columns already exist with data.
-- Alternative approach if columns exist:

-- Safe alternative (uncomment if above fails):
/*
-- Create a trigger for total_price calculation (if generated column not possible)
CREATE OR REPLACE FUNCTION calculate_item_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_cost = NEW.quantity * NEW.unit_cost;
  NEW.total_price = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_calculate_item_totals ON items;

CREATE TRIGGER trg_calculate_item_totals
  BEFORE INSERT OR UPDATE OF quantity, unit_cost, unit_price ON items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_totals();
*/

-- ============================================================
-- PART 8: AUDIT TRIGGER FOR CRITICAL TABLES
-- ============================================================

-- Create a generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_action audit_action;
  old_data JSONB;
  new_data JSONB;
  company UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    audit_action := 'CREATE'::audit_action;
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := 'UPDATE'::audit_action;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE'::audit_action;
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Get company_id from context or record
  company := auth.company_id();

  -- If company_id not in JWT, try to get from the record
  IF company IS NULL THEN
    company := COALESCE(
      NEW.company_id,
      OLD.company_id,
      NULL
    );
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (company_id, user_id, entity_name, entity_id, action, old_value, new_value, description)
  VALUES (
    company,
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      NULL
    )::UUID,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_action,
    old_data,
    new_data,
    TG_OP || ' on ' || TG_TABLE_NAME
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Apply audit trigger to critical tables
DROP TRIGGER IF EXISTS trg_audit_items ON items;
CREATE TRIGGER trg_audit_items
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_budgets ON budgets;
CREATE TRIGGER trg_audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_stages ON stages;
CREATE TRIGGER trg_audit_stages
  AFTER INSERT OR UPDATE OR DELETE ON stages
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_expenses ON expenses;
CREATE TRIGGER trg_audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- PART 9: INDEXES FOR RLS PERFORMANCE
-- ============================================================

-- These indexes help RLS policies run efficiently
CREATE INDEX IF NOT EXISTS idx_projects_company_id_rls ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id_rls ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_budget_id_rls ON stages(budget_id);
CREATE INDEX IF NOT EXISTS idx_items_stage_id_rls ON items(stage_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id_rls ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id_rls ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id_rls ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_contingencies_project_id_rls ON project_contingencies(project_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_item_id_rls ON budget_execution_logs(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_resources_company_id_rls ON resources(company_id);
CREATE INDEX IF NOT EXISTS idx_apu_templates_company_id_rls ON apu_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_templates_company_id_rls ON templates(company_id);
CREATE INDEX IF NOT EXISTS idx_template_stages_template_id_rls ON template_stages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_items_stage_id_rls ON template_items(template_stage_id);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_project_id_rls ON worker_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_project_id_rls ON worker_payments(project_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_items_stage_budget_project ON items(stage_id);
CREATE INDEX IF NOT EXISTS idx_stages_budget_project ON stages(budget_id);

-- ============================================================
-- PART 10: VERIFICATION QUERIES
-- ============================================================

-- Run these queries after migration to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- ============================================================
-- END OF MIGRATION
-- ============================================================