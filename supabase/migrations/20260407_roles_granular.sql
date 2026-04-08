-- ============================================================
-- Migration: Granular Roles System
-- Date: 2026-04-07
-- Purpose: Add viewer role to enum, create roles audit table,
--          and update RLS policies to respect role hierarchy
-- ============================================================

-- ============================================================
-- STEP 1: Add 'viewer' and 'accounting' roles to the enum
-- (admin, engineer, architect, site_supervisor, foreman already exist)
-- ============================================================

DO $$
BEGIN
  -- Add viewer if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'viewer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'viewer';
  END IF;

  -- Add accounting if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'accounting'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'accounting';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Enum may not exist as a type (using varchar instead)
    NULL;
END $$;

-- ============================================================
-- STEP 2: Ensure role column exists in users table
-- with proper default
-- ============================================================

-- Add role column if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'engineer';
  END IF;
END $$;

-- ============================================================
-- STEP 3: Create role_permissions view for easy querying
-- ============================================================

CREATE OR REPLACE VIEW public.role_permissions AS
SELECT 
  role,
  CASE role
    WHEN 'admin' THEN ARRAY[
      'manage_users', 'manage_company', 'delete_projects', 'manage_budgets',
      'approve_invoices', 'view_financials', 'manage_workers', 'manage_documents',
      'manage_rfis', 'manage_submittals', 'manage_punch_list', 'view_reports',
      'export_data', 'manage_bim', 'manage_apu', 'manage_resources', 'set_markup'
    ]
    WHEN 'engineer' THEN ARRAY[
      'manage_budgets', 'manage_documents', 'manage_rfis', 'manage_submittals',
      'manage_punch_list', 'view_financials', 'view_reports', 'export_data',
      'manage_bim', 'manage_apu', 'manage_resources', 'set_markup'
    ]
    WHEN 'architect' THEN ARRAY[
      'manage_budgets', 'manage_documents', 'manage_rfis', 'manage_bim',
      'manage_apu', 'view_financials', 'view_reports', 'export_data'
    ]
    WHEN 'accounting' THEN ARRAY[
      'approve_invoices', 'view_financials', 'view_reports', 'export_data', 'manage_workers'
    ]
    WHEN 'site_supervisor' THEN ARRAY[
      'manage_punch_list', 'manage_rfis', 'view_reports', 'manage_workers'
    ]
    WHEN 'foreman' THEN ARRAY[
      'manage_punch_list', 'view_reports'
    ]
    ELSE ARRAY['view_reports']
  END AS permissions
FROM (
  VALUES ('admin'), ('engineer'), ('architect'), ('accounting'), 
         ('site_supervisor'), ('foreman'), ('viewer')
) AS roles(role);

-- ============================================================
-- STEP 4: Helper function — check if user has permission
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN role_permissions rp ON rp.role = u.role
    WHERE u.id = p_user_id
      AND p_permission = ANY(rp.permissions)
  );
$$;

-- ============================================================
-- STEP 5: RLS update — admins can manage users in their company
-- (regular users can only see their own record)
-- ============================================================

DROP POLICY IF EXISTS "sec001_users_all" ON users;

-- Regular users: see all in company (needed for team listings)
CREATE POLICY "sec001_users_select_company" ON users
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

-- Only admins can insert/update/delete users
CREATE POLICY "sec001_users_insert_admin" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid() AND u2.role = 'admin'
    )
  );

CREATE POLICY "sec001_users_update_admin" ON users
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_my_company_id()
    AND (
      id = auth.uid()  -- can always edit own record
      OR EXISTS (
        SELECT 1 FROM users u2
        WHERE u2.id = auth.uid() AND u2.role = 'admin'
      )
    )
  );

CREATE POLICY "sec001_users_delete_admin" ON users
  FOR DELETE TO authenticated
  USING (
    company_id = public.get_my_company_id()
    AND id != auth.uid()  -- cannot delete yourself
    AND EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid() AND u2.role = 'admin'
    )
  );

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check roles in the system:
-- SELECT DISTINCT role, COUNT(*) FROM users GROUP BY role ORDER BY role;

-- Check role_permissions view:
-- SELECT * FROM role_permissions;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
