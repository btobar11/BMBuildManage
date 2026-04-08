-- Create project_models table for BIM models storage
CREATE TABLE IF NOT EXISTS project_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  format VARCHAR(50),
  processing_status VARCHAR(50) DEFAULT 'pending',
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_project_models_project_id ON project_models(project_id);

-- RLS Policy for project_models
ALTER TABLE project_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_models_company_isolation" ON project_models
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
);