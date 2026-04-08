-- ============================================================
-- Migration: Auto-create profile on user registration
-- Date: 2026-04-06
-- Purpose: Create profile automatically when new user registers
-- WARNING: Requires Supabase auth.users trigger setup
-- ============================================================

-- ============================================================
-- STEP 1: Create profiles table if not exists
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

-- ============================================================
-- STEP 2: Create function to handle new user registration
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default profile for new user
  INSERT INTO public.profiles (id, email, company_id, role)
  VALUES (NEW.id, NEW.email, NULL, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Create trigger on auth.users
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 4: Migration for existing users (optional - run manually)
-- ============================================================

-- To assign existing users to a default company, run:
-- UPDATE profiles 
-- SET company_id = (SELECT id FROM companies ORDER BY created_at LIMIT 1)
-- WHERE company_id IS NULL;

-- ============================================================
-- STEP 5: Enable Row Level Security on profiles
-- ============================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can read all profiles (requires company_id check)
DROP POLICY IF EXISTS "Admins can read company profiles" ON profiles;
CREATE POLICY "Admins can read company profiles" ON profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- ============================================================
-- Verification queries
-- ============================================================

-- Check if trigger exists:
-- SELECT tgname, tgrelname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check profiles:
-- SELECT * FROM profiles LIMIT 10;

-- Test: Create new user and check if profile is auto-created
-- ============================================================
-- END OF MIGRATION
-- ============================================================
