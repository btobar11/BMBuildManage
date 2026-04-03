-- ============================================================
-- Script: Final Storage Validation (MVP)
-- Purpose: Verify existence of buckets and RLS policies
-- ============================================================

-- 1. Check if buckets exist
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('bim-models', 'invoices', 'documents');

-- 2. Verify RLS Policies for 'bim-models' 
-- Users should only access files where the path starts with their company_id
-- Expected path format: {company_id}/{project_id}/{filename}

-- Run this to see current policies:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. [OPTIONAL] Apply/Fix Policies if missing
-- NOTE: Replace 'auth.company_id()' with your custom function if named differently

/*
-- Policy for SELECT
CREATE POLICY "Users can only view their company models" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bim-models' AND (storage.foldername(name))[1] = auth.company_id()::text);

-- Policy for INSERT
CREATE POLICY "Users can only upload to their company folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bim-models' AND (storage.foldername(name))[1] = auth.company_id()::text);

-- Policy for DELETE
CREATE POLICY "Users can only delete their company models" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bim-models' AND (storage.foldername(name))[1] = auth.company_id()::text);
*/

-- 4. Test Query: Check orphaned files (files without a record in project_models)
SELECT name FROM storage.objects 
WHERE bucket_id = 'bim-models'
AND name NOT IN (SELECT storage_path FROM public.project_models);
