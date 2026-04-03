-- ============================================================
-- Migration: Critical RLS Fixes + Materials Table RLS
-- Date: 2026-03-30
-- Priority: P0 - Hotfix for Security Breaches
-- ============================================================
--
-- This migration fixes critical vulnerabilities found in QA testing:
-- 1. Resources/APU policies allowed modification of global data
-- 2. Materials table had no RLS
-- 3. Audit trigger function security improvement
--
-- ============================================================

-- ============================================================
-- PART 1: FIX RESOURCES POLICIES (CRITICAL)
-- ============================================================

-- Drop the vulnerable policies
DROP POLICY IF EXISTS "resources_select_own" ON resources;
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own" ON resources;
DROP POLICY IF EXISTS "resources_delete_own" ON resources;

-- SELECT: Allow reading own company OR global (read-only)
CREATE POLICY "resources_select_own" ON resources
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

-- INSERT: Only company-owned resources (no global modification)
CREATE POLICY "resources_insert_own" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

-- UPDATE: Only company-owned resources (no global modification)
CREATE POLICY "resources_update_own" ON resources
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

-- DELETE: Only company-owned resources (no global modification)
CREATE POLICY "resources_delete_own" ON resources
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ============================================================
-- PART 2: FIX RESOURCE PRICE HISTORY POLICIES (CRITICAL)
-- ============================================================

DROP POLICY IF EXISTS "resource_price_history_select_own" ON resource_price_history;
DROP POLICY IF EXISTS "resource_price_history_insert_own" ON resource_price_history;
DROP POLICY IF EXISTS "resource_price_history_delete_own" ON resource_price_history;

-- SELECT: Allow reading history for own or global resources
CREATE POLICY "resource_price_history_select_own" ON resource_price_history
  FOR SELECT TO authenticated
  USING (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

-- INSERT/DELETE: Only for company-owned resources
CREATE POLICY "resource_price_history_insert_own" ON resource_price_history
  FOR INSERT TO authenticated
  WITH CHECK (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id()
  ));

CREATE POLICY "resource_price_history_delete_own" ON resource_price_history
  FOR DELETE TO authenticated
  USING (resource_id IN (
    SELECT id FROM resources WHERE company_id = auth.company_id()
  ));

-- ============================================================
-- PART 3: FIX APU TEMPLATES POLICIES (CRITICAL)
-- ============================================================

DROP POLICY IF EXISTS "apu_templates_select_own" ON apu_templates;
DROP POLICY IF EXISTS "apu_templates_insert_own" ON apu_templates;
DROP POLICY IF EXISTS "apu_templates_update_own" ON apu_templates;
DROP POLICY IF EXISTS "apu_templates_delete_own" ON apu_templates;

-- SELECT: Allow reading own company OR global (read-only)
CREATE POLICY "apu_templates_select_own" ON apu_templates
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

-- INSERT: Only company-owned APU templates
CREATE POLICY "apu_templates_insert_own" ON apu_templates
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

-- UPDATE: Only company-owned APU templates
CREATE POLICY "apu_templates_update_own" ON apu_templates
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

-- DELETE: Only company-owned APU templates
CREATE POLICY "apu_templates_delete_own" ON apu_templates
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ============================================================
-- PART 4: FIX APU RESOURCES POLICIES (CRITICAL)
-- ============================================================

DROP POLICY IF EXISTS "apu_resources_select_own" ON apu_resources;
DROP POLICY IF EXISTS "apu_resources_insert_own" ON apu_resources;
DROP POLICY IF EXISTS "apu_resources_update_own" ON apu_resources;
DROP POLICY IF EXISTS "apu_resources_delete_own" ON apu_resources;

-- SELECT: Allow reading for own company OR global APU templates
CREATE POLICY "apu_resources_select_own" ON apu_resources
  FOR SELECT TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id() OR company_id IS NULL
  ));

-- INSERT/UPDATE/DELETE: Only for company-owned APU templates
CREATE POLICY "apu_resources_insert_own" ON apu_resources
  FOR INSERT TO authenticated
  WITH CHECK (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id()
  ));

CREATE POLICY "apu_resources_update_own" ON apu_resources
  FOR UPDATE TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id()
  ))
  WITH CHECK (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id()
  ));

CREATE POLICY "apu_resources_delete_own" ON apu_resources
  FOR DELETE TO authenticated
  USING (apu_id IN (
    SELECT id FROM apu_templates WHERE company_id = auth.company_id()
  ));

-- ============================================================
-- PART 5: ADD RLS TO MATERIALS TABLE (HIGH)
-- ============================================================

-- First, add company_id column to materials if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE materials ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_materials_company_id ON materials(company_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create policies (global materials are read-only)
CREATE POLICY "materials_select_own" ON materials
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id() OR company_id IS NULL);

CREATE POLICY "materials_insert_own" ON materials
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "materials_update_own" ON materials
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "materials_delete_own" ON materials
  FOR DELETE TO authenticated
  USING (company_id = auth.company_id());

-- ============================================================
-- PART 6: IMPROVE AUDIT TRIGGER SECURITY
-- ============================================================

-- Make audit trigger more robust
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_action_val audit_action;
  old_data JSONB;
  new_data JSONB;
  company UUID;
  user_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    audit_action_val := 'CREATE'::audit_action;
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action_val := 'UPDATE'::audit_action;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_action_val := 'DELETE'::audit_action;
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Get user_id from JWT claims (more secure)
  user_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::UUID,
    (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID,
    NULL
  );

  -- Get company_id - try multiple sources
  company := auth.company_id();

  -- Fallback: try to get from record
  IF company IS NULL THEN
    company := COALESCE(
      NEW.company_id,
      OLD.company_id,
      -- For project-scoped tables, traverse relationships
      NULL
    );
  END IF;

  -- Only insert audit log if we have required fields
  IF user_id IS NOT NULL THEN
    INSERT INTO audit_logs (company_id, user_id, entity_name, entity_id, action, old_value, new_value, description)
    VALUES (
      company,
      user_id,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      audit_action_val,
      old_data,
      new_data,
      TG_OP || ' on ' || TG_TABLE_NAME
    );
  END IF;

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================
-- PART 7: VERIFICATION
-- ============================================================

-- Run after migration to verify all tables have RLS
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Run to verify policies are restrictive
-- SELECT schemaname, tablename, policyname, permissive, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE '%_own' ORDER BY tablename, policyname;

-- ============================================================
-- END OF HOTFIX MIGRATION
-- ============================================================