-- Migration: Federated Clash Detection Enhancement
-- Created: 2026-04-08
-- Purpose: Extend existing clash detection system for multi-discipline federation

-- 1. Add discipline tracking to existing bim_models table
ALTER TABLE bim_models 
ADD COLUMN IF NOT EXISTS discipline TEXT CHECK (discipline IN ('architecture', 'structure', 'mep_hvac', 'mep_plumbing', 'mep_electrical', 'topography', 'landscape')),
ADD COLUMN IF NOT EXISTS file_type TEXT CHECK (file_type IN ('ifc', 'dxf', 'pdf')) DEFAULT 'ifc',
ADD COLUMN IF NOT EXISTS federation_id UUID REFERENCES projects(id);

-- Create index for discipline queries
CREATE INDEX IF NOT EXISTS idx_bim_models_discipline ON bim_models(discipline);
CREATE INDEX IF NOT EXISTS idx_bim_models_federation ON bim_models(federation_id);

-- 2. Create federated clash detection jobs table
CREATE TABLE IF NOT EXISTS bim_federated_clash_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Detection parameters
  tolerance_mm INTEGER DEFAULT 10 CHECK (tolerance_mm >= 0 AND tolerance_mm <= 100),
  enabled_disciplines TEXT[] NOT NULL DEFAULT ARRAY['architecture', 'structure', 'mep_hvac', 'mep_plumbing', 'mep_electrical'],
  severity_threshold TEXT CHECK (severity_threshold IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  
  -- Job status
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Results
  clashes_found INTEGER DEFAULT 0,
  models_processed INTEGER DEFAULT 0,
  total_models INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_progress CHECK (
    (status = 'completed' AND progress = 100) OR 
    (status = 'failed' AND progress >= 0) OR 
    (status IN ('pending', 'running') AND progress >= 0 AND progress <= 100)
  )
);

-- 3. Enhance existing bim_clashes table with federation support
ALTER TABLE bim_clashes 
ADD COLUMN IF NOT EXISTS federation_job_id UUID REFERENCES bim_federated_clash_jobs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS discipline_a TEXT CHECK (discipline_a IN ('architecture', 'structure', 'mep_hvac', 'mep_plumbing', 'mep_electrical', 'topography', 'landscape')),
ADD COLUMN IF NOT EXISTS discipline_b TEXT CHECK (discipline_b IN ('architecture', 'structure', 'mep_hvac', 'mep_plumbing', 'mep_electrical', 'topography', 'landscape')),
ADD COLUMN IF NOT EXISTS element_a_name TEXT,
ADD COLUMN IF NOT EXISTS element_b_name TEXT,
ADD COLUMN IF NOT EXISTS clash_center_x DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS clash_center_y DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS clash_center_z DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS assigned_to TEXT, -- email of assignee
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tolerance_used INTEGER, -- tolerance used for this clash detection
ADD COLUMN IF NOT EXISTS detection_method TEXT DEFAULT 'bounding_box' CHECK (detection_method IN ('bounding_box', 'geometry_precise', 'spatial_index'));

-- Update status enum to match frontend expectations
ALTER TABLE bim_clashes DROP CONSTRAINT IF EXISTS bim_clashes_status_check;
ALTER TABLE bim_clashes ADD CONSTRAINT bim_clashes_status_check 
  CHECK (status IN ('open', 'assigned', 'resolved', 'ignored'));

-- Update existing 'pending' to 'open' and 'accepted' to 'assigned'
UPDATE bim_clashes 
SET status = CASE 
  WHEN status = 'pending' THEN 'open'
  WHEN status = 'accepted' THEN 'assigned'
  ELSE status
END
WHERE status IN ('pending', 'accepted');

-- 4. Create clash comments table for better comment management
CREATE TABLE IF NOT EXISTS bim_clash_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clash_id UUID NOT NULL REFERENCES bim_clashes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Comment content
  content TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_name TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- 5. Create spatial index for efficient clash detection
CREATE TABLE IF NOT EXISTS bim_spatial_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id UUID NOT NULL,
  model_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Spatial data (simplified R-tree node)
  min_x DOUBLE PRECISION NOT NULL,
  min_y DOUBLE PRECISION NOT NULL,
  min_z DOUBLE PRECISION NOT NULL,
  max_x DOUBLE PRECISION NOT NULL,
  max_y DOUBLE PRECISION NOT NULL,
  max_z DOUBLE PRECISION NOT NULL,
  
  -- Element metadata
  discipline TEXT NOT NULL,
  element_type TEXT,
  ifc_guid TEXT NOT NULL,
  
  -- Index optimization
  grid_x INTEGER GENERATED ALWAYS AS (FLOOR(((min_x + max_x) / 2) / 10)::INTEGER) STORED,
  grid_y INTEGER GENERATED ALWAYS AS (FLOOR(((min_y + max_y) / 2) / 10)::INTEGER) STORED,
  grid_z INTEGER GENERATED ALWAYS AS (FLOOR(((min_z + max_z) / 2) / 10)::INTEGER) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(element_id, model_id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_federated_clash_jobs_company_project ON bim_federated_clash_jobs(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_federated_clash_jobs_status ON bim_federated_clash_jobs(status);
CREATE INDEX IF NOT EXISTS idx_federated_clash_jobs_progress ON bim_federated_clash_jobs(progress) WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_clashes_federation_job ON bim_clashes(federation_job_id);
CREATE INDEX IF NOT EXISTS idx_clashes_disciplines ON bim_clashes(discipline_a, discipline_b);
CREATE INDEX IF NOT EXISTS idx_clashes_assigned_to ON bim_clashes(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clashes_status_severity ON bim_clashes(status, severity);

CREATE INDEX IF NOT EXISTS idx_clash_comments_clash ON bim_clash_comments(clash_id);
CREATE INDEX IF NOT EXISTS idx_clash_comments_active ON bim_clash_comments(clash_id) WHERE deleted_at IS NULL;

-- Spatial index for efficient collision detection
CREATE INDEX IF NOT EXISTS idx_spatial_grid ON bim_spatial_index(company_id, discipline, grid_x, grid_y, grid_z);
CREATE INDEX IF NOT EXISTS idx_spatial_bounds ON bim_spatial_index(company_id, min_x, max_x, min_y, max_y, min_z, max_z);
CREATE INDEX IF NOT EXISTS idx_spatial_element ON bim_spatial_index(element_id, ifc_guid);

-- 7. RLS Policies for new tables
ALTER TABLE bim_federated_clash_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clash_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_spatial_index ENABLE ROW LEVEL SECURITY;

-- Federated clash jobs policies
CREATE POLICY "federated_clash_jobs_select_own" ON bim_federated_clash_jobs
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "federated_clash_jobs_insert_own" ON bim_federated_clash_jobs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "federated_clash_jobs_update_own" ON bim_federated_clash_jobs
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "federated_clash_jobs_delete_own" ON bim_federated_clash_jobs
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());

-- Clash comments policies
CREATE POLICY "clash_comments_select_own" ON bim_clash_comments
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "clash_comments_insert_own" ON bim_clash_comments
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "clash_comments_update_own" ON bim_clash_comments
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id());

-- Spatial index policies
CREATE POLICY "spatial_index_select_own" ON bim_spatial_index
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "spatial_index_insert_own" ON bim_spatial_index
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "spatial_index_update_own" ON bim_spatial_index
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id());

CREATE POLICY "spatial_index_delete_own" ON bim_spatial_index
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());

-- 8. Utility functions for federated clash detection
CREATE OR REPLACE FUNCTION update_bim_federated_job_progress(
  p_job_id UUID,
  p_progress INTEGER,
  p_clashes_found INTEGER DEFAULT NULL,
  p_models_processed INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE bim_federated_clash_jobs
  SET 
    progress = p_progress,
    clashes_found = COALESCE(p_clashes_found, clashes_found),
    models_processed = COALESCE(p_models_processed, models_processed),
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_bim_federated_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE bim_federated_clash_jobs
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    progress = CASE WHEN p_success THEN 100 ELSE progress END,
    completed_at = NOW(),
    error_message = p_error_message,
    error_details = p_error_details,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_clash_comment(
  p_clash_id UUID,
  p_company_id UUID,
  p_content TEXT,
  p_author_email TEXT,
  p_author_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  comment_id UUID;
BEGIN
  INSERT INTO bim_clash_comments (clash_id, company_id, content, author_email, author_name)
  VALUES (p_clash_id, p_company_id, p_content, p_author_email, p_author_name)
  RETURNING id INTO comment_id;
  
  -- Update clash comments JSONB for backward compatibility
  UPDATE bim_clashes
  SET comments = COALESCE(comments, '[]'::jsonb) || jsonb_build_object(
    'id', comment_id,
    'content', p_content,
    'author', p_author_email,
    'createdAt', NOW()
  )
  WHERE id = p_clash_id AND company_id = p_company_id;
  
  RETURN comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for spatial query optimization
CREATE OR REPLACE FUNCTION get_potential_clash_pairs(
  p_company_id UUID,
  p_discipline_a TEXT,
  p_discipline_b TEXT,
  p_tolerance_mm INTEGER DEFAULT 10
) RETURNS TABLE (
  element_a_id UUID,
  element_a_guid TEXT,
  element_b_id UUID,
  element_b_guid TEXT,
  overlap_volume DOUBLE PRECISION
) AS $$
DECLARE
  tolerance_m DOUBLE PRECISION := p_tolerance_mm / 1000.0;
BEGIN
  RETURN QUERY
  SELECT 
    a.element_id,
    a.ifc_guid,
    b.element_id,
    b.ifc_guid,
    -- Calculate intersection volume
    GREATEST(0, 
      LEAST(a.max_x, b.max_x) - GREATEST(a.min_x, b.min_x)
    ) * GREATEST(0,
      LEAST(a.max_y, b.max_y) - GREATEST(a.min_y, b.min_y)  
    ) * GREATEST(0,
      LEAST(a.max_z, b.max_z) - GREATEST(a.min_z, b.min_z)
    ) AS overlap_volume
  FROM bim_spatial_index a
  JOIN bim_spatial_index b ON (
    a.company_id = b.company_id
    AND a.element_id != b.element_id
    AND a.discipline = p_discipline_a
    AND b.discipline = p_discipline_b
    -- Spatial overlap check with tolerance
    AND a.min_x - tolerance_m <= b.max_x 
    AND a.max_x + tolerance_m >= b.min_x
    AND a.min_y - tolerance_m <= b.max_y
    AND a.max_y + tolerance_m >= b.min_y
    AND a.min_z - tolerance_m <= b.max_z
    AND a.max_z + tolerance_m >= b.min_z
  )
  WHERE 
    a.company_id = p_company_id
    AND GREATEST(0, 
      LEAST(a.max_x, b.max_x) - GREATEST(a.min_x, b.min_x)
    ) * GREATEST(0,
      LEAST(a.max_y, b.max_y) - GREATEST(a.min_y, b.min_y)  
    ) * GREATEST(0,
      LEAST(a.max_z, b.max_z) - GREATEST(a.min_z, b.min_z)
    ) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_federated_clash_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_federated_clash_jobs_updated_at ON bim_federated_clash_jobs;
CREATE TRIGGER trigger_federated_clash_jobs_updated_at
  BEFORE UPDATE ON bim_federated_clash_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_federated_clash_job_timestamp();

DROP TRIGGER IF EXISTS trigger_clash_comments_updated_at ON bim_clash_comments;
CREATE TRIGGER trigger_clash_comments_updated_at
  BEFORE UPDATE ON bim_clash_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_federated_clash_job_timestamp();

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON bim_federated_clash_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bim_clash_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bim_spatial_index TO authenticated;

GRANT EXECUTE ON FUNCTION update_bim_federated_job_progress TO authenticated;
GRANT EXECUTE ON FUNCTION complete_bim_federated_job TO authenticated;
GRANT EXECUTE ON FUNCTION add_clash_comment TO authenticated;
GRANT EXECUTE ON FUNCTION get_potential_clash_pairs TO authenticated;

-- 11. Add helpful comments
COMMENT ON TABLE bim_federated_clash_jobs IS 'Federated clash detection jobs across multiple BIM disciplines';
COMMENT ON TABLE bim_clash_comments IS 'Comments and discussions for BIM clashes';
COMMENT ON TABLE bim_spatial_index IS 'Spatial index for efficient clash detection between BIM elements';

COMMENT ON FUNCTION get_potential_clash_pairs IS 'Optimized spatial query to find potential clash pairs between disciplines';
COMMENT ON FUNCTION add_clash_comment IS 'Add a comment to a clash with automatic JSONB update for compatibility';

-- Migration complete
SELECT 'Federated clash detection schema enhanced successfully' as result;