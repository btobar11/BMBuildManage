-- Create storage bucket for BIM models
INSERT INTO storage.buckets (id, name, public)
VALUES ('bim-models', 'bim-models', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for BIM models bucket
CREATE POLICY "BIM models: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bim-models');

CREATE POLICY "BIM models: users can view own company models" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'bim-models' AND 
  name LIKE concat(
    (SELECT company_id::text FROM users WHERE id = auth.uid()),
    '/%'
  )
);

CREATE POLICY "BIM models: users can delete own company models" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'bim-models' AND 
  name LIKE concat(
    (SELECT company_id::text FROM users WHERE id = auth.uid()),
    '/%'
  )
);