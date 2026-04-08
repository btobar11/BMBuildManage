-- ============================================================
-- Migration: Profile Trigger Hardening + Existing User Backfill
-- Date: 2026-04-07
-- Purpose: Ensure every auth.users row has a profiles record,
--          and that company_id is populated from the users table.
-- ============================================================
--
-- Problem: handle_new_user() creates profiles with company_id = NULL.
--          After SEC-001 RLS lockdown, NULL company_id = blocked user.
--
-- Fix:
--   1. Improve trigger to pull company_id from public.users table
--   2. Backfill existing profiles that have company_id = NULL
--   3. Backfill missing profile rows for existing auth.users
-- ============================================================


-- ============================================================
-- STEP 1: IMPROVED TRIGGER FUNCTION
-- Tries to get company_id from public.users (linked by same id or email)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Try to find company_id from the public.users table
  -- (populated by the app during registration)
  SELECT company_id INTO v_company_id
  FROM public.users
  WHERE id = NEW.id OR email = NEW.email
  LIMIT 1;

  -- Insert/update profile with company_id if found
  INSERT INTO public.profiles (id, email, company_id, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_company_id,           -- NULL if not found yet — app must update later
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      company_id = COALESCE(profiles.company_id, EXCLUDED.company_id),
      full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- STEP 2: BACKFILL — sync profiles.company_id from public.users
-- Fixes existing profiles with company_id = NULL
-- ============================================================

UPDATE public.profiles p
SET
  company_id = u.company_id,
  updated_at = NOW()
FROM public.users u
WHERE
  (p.id = u.id OR p.email = u.email)
  AND p.company_id IS NULL
  AND u.company_id IS NOT NULL;


-- ============================================================
-- STEP 3: BACKFILL — create missing profiles for existing auth users
-- Any auth.users row without a profile gets one now
-- ============================================================

INSERT INTO public.profiles (id, email, company_id, full_name, role)
SELECT
  au.id,
  au.email,
  u.company_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  ),
  'user'
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id OR u.email = au.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STEP 4: Ensure profiles policies are correct (from SEC-001)
-- ============================================================

-- Admins of same company can also see their team's profiles
DROP POLICY IF EXISTS "sec001_profiles_select_company" ON profiles;
CREATE POLICY "sec001_profiles_select_company" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR company_id = public.get_my_company_id()
  );


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check profiles coverage:
-- SELECT
--   (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
--   (SELECT COUNT(*) FROM profiles) AS total_profiles,
--   (SELECT COUNT(*) FROM profiles WHERE company_id IS NULL) AS profiles_without_company;
-- Expected: total_profiles >= total_auth_users, profiles_without_company = 0

-- ============================================================
-- END OF MIGRATION
-- ============================================================
