-- ============================================================
-- Migration: BIM 5D Foundation - Data Extraction Engine
-- Date: 2026-04-04
-- Priority: P0 - Core BIM Infrastructure
-- ============================================================
--
-- This migration implements:
-- 1. bim_models - Extracted metadata from IFC parsing (spatial tree, stats)
-- 2. bim_elements - All IFC elements with GUID, type, spatial location
-- 3. bim_properties - PropertySets and properties from IFC
-- 4. bim_element_states - 4D progress tracking (offline-first ready)
-- 5. bim_clashes - Clash detection results (FASE 3)
--
-- All tables include company_id for strict tenant isolation via RLS.
-- ============================================================

-- ============================================================
-- PART 0: HELPER FUNCTIONS (required for RLS)
-- ============================================================

-- Create function to safely extract company_id from JWT claims (in public schema)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
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

-- ============================================================
-- PART 1: CORE BIM TABLES
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BIM_MODELS: Stores extracted model metadata
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_model_id UUID REFERENCES project_models(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  file_size_bytes BIGINT,
  element_count INTEGER DEFAULT 0,
  spatial_tree JSONB,
  statistics JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'parsed', 'error')),
  parse_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bim_models IS 'Stores extracted BIM metadata from IFC files. Links to project_models for file storage.';

-- ─────────────────────────────────────────────────────────────
-- BIM_ELEMENTS: All IFC elements extracted from models
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  ifc_guid TEXT NOT NULL,
  express_id INTEGER,
  name TEXT,
  object_type TEXT,
  ifc_type TEXT NOT NULL,
  category TEXT,
  storey_id TEXT,
  storey_name TEXT,
  bounding_box JSONB,
  spatial_location JSONB,
  quantities JSONB,
  linked_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, ifc_guid)
);

COMMENT ON TABLE bim_elements IS 'Individual IFC elements extracted from BIM models with spatial and quantity data.';

-- ─────────────────────────────────────────────────────────────
-- BIM_PROPERTIES: PropertySets and properties from IFC
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES bim_elements(id) ON DELETE CASCADE,
  property_set_name TEXT NOT NULL,
  property_name TEXT NOT NULL,
  property_type TEXT,
  value TEXT,
  numeric_value DOUBLE PRECISION,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, property_set_name, property_name)
);

COMMENT ON TABLE bim_properties IS 'Individual IFC properties extracted from PropertySets per element.';

-- ============================================================
-- PART 2: 4D PROGRESS TRACKING (FASE 2)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BIM_ELEMENT_STATES: 4D progress state per element
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_element_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES bim_elements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'no_iniciado' 
    CHECK (status IN ('no_iniciado', 'en_progreso', 'ejecutado', 'verificado')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  local_version INTEGER DEFAULT 0,
  server_version INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id)
);

COMMENT ON TABLE bim_element_states IS '4D progress tracking state per BIM element. Supports offline-first sync.';

-- ─────────────────────────────────────────────────────────────
-- BIM_STATE_HISTORY: Audit trail for state changes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  element_state_id UUID NOT NULL REFERENCES bim_element_states(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  previous_progress INTEGER,
  new_progress INTEGER NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bim_state_history IS 'Immutable audit trail for BIM element state changes.';

-- ============================================================
-- PART 3: CLASH DETECTION (FASE 3)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BIM_CLASHES: Clash detection results
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_clashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_a_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  model_b_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  element_a_id UUID NOT NULL REFERENCES bim_elements(id) ON DELETE CASCADE,
  element_b_id UUID NOT NULL REFERENCES bim_elements(id) ON DELETE CASCADE,
  element_a_guid TEXT NOT NULL,
  element_b_guid TEXT NOT NULL,
  clash_type TEXT NOT NULL CHECK (clash_type IN ('hard', 'soft', 'clearance')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'resolved', 'ignored')),
  intersection_volume DOUBLE PRECISION,
  clearance_distance DOUBLE PRECISION,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bim_clashes IS 'Clash detection results between BIM elements from different models.';

-- ─────────────────────────────────────────────────────────────
-- BIM_CLASH_JOBS: Async clash detection job tracking
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bim_clash_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_a_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  model_b_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  clashes_found INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bim_clash_jobs IS 'Tracks async clash detection job execution.';

-- ============================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================================

-- bim_models indexes
CREATE INDEX idx_bim_models_company_id ON bim_models(company_id);
CREATE INDEX idx_bim_models_project_id ON bim_models(project_id);
CREATE INDEX idx_bim_models_status ON bim_models(status);
CREATE INDEX idx_bim_models_parsed_at ON bim_models(parsed_at);

-- bim_elements indexes
CREATE INDEX idx_bim_elements_company_id ON bim_elements(company_id);
CREATE INDEX idx_bim_elements_model_id ON bim_elements(model_id);
CREATE INDEX idx_bim_elements_ifc_guid ON bim_elements(ifc_guid);
CREATE INDEX idx_bim_elements_ifc_type ON bim_elements(ifc_type);
CREATE INDEX idx_bim_elements_category ON bim_elements(category);
CREATE INDEX idx_bim_elements_linked_item_id ON bim_elements(linked_item_id);
CREATE INDEX idx_bim_elements_spatial ON bim_elements USING GIN(spatial_location);
CREATE INDEX idx_bim_elements_bounding_box ON bim_elements USING GIN(bounding_box);

-- bim_properties indexes
CREATE INDEX idx_bim_properties_company_id ON bim_properties(company_id);
CREATE INDEX idx_bim_properties_element_id ON bim_properties(element_id);
CREATE INDEX idx_bim_properties_property_set ON bim_properties(property_set_name);
CREATE INDEX idx_bim_properties_property_name ON bim_properties(property_name);

-- bim_element_states indexes
CREATE INDEX idx_bim_element_states_company_id ON bim_element_states(company_id);
CREATE INDEX idx_bim_element_states_element_id ON bim_element_states(element_id);
CREATE INDEX idx_bim_element_states_status ON bim_element_states(status);
CREATE INDEX idx_bim_element_states_assigned_to ON bim_element_states(assigned_to);

-- bim_state_history indexes
CREATE INDEX idx_bim_state_history_company_id ON bim_state_history(company_id);
CREATE INDEX idx_bim_state_history_element_state_id ON bim_state_history(element_state_id);
CREATE INDEX idx_bim_state_history_changed_at ON bim_state_history(changed_at);

-- bim_clashes indexes
CREATE INDEX idx_bim_clashes_company_id ON bim_clashes(company_id);
CREATE INDEX idx_bim_clashes_model_a ON bim_clashes(model_a_id);
CREATE INDEX idx_bim_clashes_model_b ON bim_clashes(model_b_id);
CREATE INDEX idx_bim_clashes_element_a ON bim_clashes(element_a_id);
CREATE INDEX idx_bim_clashes_element_b ON bim_clashes(element_b_id);
CREATE INDEX idx_bim_clashes_status ON bim_clashes(status);
CREATE INDEX idx_bim_clashes_clash_type ON bim_clashes(clash_type);
CREATE INDEX idx_bim_clashes_severity ON bim_clashes(severity);

-- bim_clash_jobs indexes
CREATE INDEX idx_bim_clash_jobs_company_id ON bim_clash_jobs(company_id);
CREATE INDEX idx_bim_clash_jobs_project_id ON bim_clash_jobs(project_id);
CREATE INDEX idx_bim_clash_jobs_status ON bim_clash_jobs(status);

-- ============================================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_element_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clash_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 6: RLS POLICIES
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BIM_MODELS Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_models_select_own" ON bim_models
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_models_insert_own" ON bim_models
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_models_update_own" ON bim_models
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_models_delete_own" ON bim_models
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- ─────────────────────────────────────────────────────────────
-- BIM_ELEMENTS Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_elements_select_own" ON bim_elements
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_elements_insert_own" ON bim_elements
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_elements_insert_many" ON bim_elements
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_elements_update_own" ON bim_elements
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_elements_delete_own" ON bim_elements
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- ─────────────────────────────────────────────────────────────
-- BIM_PROPERTIES Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_properties_select_own" ON bim_properties
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_properties_insert_own" ON bim_properties
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_properties_insert_many" ON bim_properties
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_properties_update_own" ON bim_properties
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_properties_delete_own" ON bim_properties
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- ─────────────────────────────────────────────────────────────
-- BIM_ELEMENT_STATES Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_element_states_select_own" ON bim_element_states
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_element_states_insert_own" ON bim_element_states
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_element_states_update_own" ON bim_element_states
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_element_states_delete_own" ON bim_element_states
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- ─────────────────────────────────────────────────────────────
-- BIM_STATE_HISTORY Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_state_history_select_own" ON bim_state_history
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_state_history_insert_own" ON bim_state_history
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

-- No UPDATE/DELETE - immutable audit trail

-- ─────────────────────────────────────────────────────────────
-- BIM_CLASHES Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_clashes_select_own" ON bim_clashes
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_clashes_insert_own" ON bim_clashes
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_clashes_update_own" ON bim_clashes
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_clashes_delete_own" ON bim_clashes
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- ─────────────────────────────────────────────────────────────
-- BIM_CLASH_JOBS Policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bim_clash_jobs_select_own" ON bim_clash_jobs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "bim_clash_jobs_insert_own" ON bim_clash_jobs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "bim_clash_jobs_update_own" ON bim_clash_jobs
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ============================================================
-- PART 7: TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bim_models_updated_at
  BEFORE UPDATE ON bim_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_elements_updated_at
  BEFORE UPDATE ON bim_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_element_states_updated_at
  BEFORE UPDATE ON bim_element_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_clashes_updated_at
  BEFORE UPDATE ON bim_clashes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_clash_jobs_updated_at
  BEFORE UPDATE ON bim_clash_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 8: HELPER FUNCTIONS FOR OFFLINE SYNC
-- ============================================================

-- Function to get element state with sync info
CREATE OR REPLACE FUNCTION get_bim_element_state_with_sync(
  p_element_id UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', bes.id,
    'element_id', bes.element_id,
    'status', bes.status,
    'progress_percent', bes.progress_percent,
    'assigned_to', bes.assigned_to,
    'notes', bes.notes,
    'started_at', bes.started_at,
    'completed_at', bes.completed_at,
    'local_version', bes.local_version,
    'server_version', bes.server_version,
    'last_synced_at', bes.last_synced_at
  ) INTO result
  FROM bim_element_states bes
  WHERE bes.element_id = p_element_id;
  
  RETURN COALESCE(result, jsonb_build_object(
    'element_id', p_element_id,
    'status', 'no_iniciado',
    'progress_percent', 0,
    'local_version', 0,
    'server_version', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert element state with version conflict resolution
CREATE OR REPLACE FUNCTION upsert_bim_element_state(
  p_element_id UUID,
  p_status TEXT,
  p_progress INTEGER,
  p_local_version INTEGER,
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
  v_new_version INTEGER;
  v_result JSONB;
BEGIN
  -- Get existing state
  SELECT * INTO v_existing
  FROM bim_element_states
  WHERE element_id = p_element_id;
  
  IF v_existing IS NULL THEN
    -- Insert new
    INSERT INTO bim_element_states (
      element_id, company_id, status, progress_percent,
      started_at, completed_at, local_version, server_version, last_synced_at
    ) VALUES (
      p_element_id,
      public.get_user_company_id(),
      p_status,
      p_progress,
      CASE WHEN p_status != 'no_iniciado' THEN NOW() ELSE NULL END,
      CASE WHEN p_status = 'ejecutado' OR p_status = 'verificado' THEN NOW() ELSE NULL END,
      p_local_version,
      1,
      NOW()
    )
    RETURNING row_to_json(row) INTO v_result;
    
    RETURN v_result;
  ELSE
    -- Check version conflict
    IF p_local_version <= v_existing.server_version THEN
      -- Client is behind, return server version
      RETURN jsonb_build_object(
        'conflict', true,
        'server_version', v_existing.server_version,
        'server_state', jsonb_build_object(
          'id', v_existing.id,
          'status', v_existing.status,
          'progress_percent', v_existing.progress_percent,
          'server_version', v_existing.server_version
        )
      );
    END IF;
    
    -- Update with version increment
    v_new_version := v_existing.server_version + 1;
    
    UPDATE bim_element_states SET
      status = p_status,
      progress_percent = p_progress,
      started_at = CASE 
        WHEN p_status != 'no_iniciado' AND v_existing.started_at IS NULL THEN NOW()
        ELSE v_existing.started_at
      END,
      completed_at = CASE
        WHEN (p_status = 'ejecutado' OR p_status = 'verificado') AND v_existing.completed_at IS NULL THEN NOW()
        ELSE v_existing.completed_at
      END,
      server_version = v_new_version,
      last_synced_at = NOW(),
      updated_at = NOW()
    WHERE element_id = p_element_id
    RETURNING row_to_json(row) INTO v_result;
    
    -- Record history
    INSERT INTO bim_state_history (
      element_state_id, company_id, previous_status, new_status,
      previous_progress, new_progress, changed_by
    ) VALUES (
      v_existing.id, public.get_user_company_id(),
      v_existing.status, p_status,
      v_existing.progress_percent, p_progress,
      p_user_id
    );
    
    RETURN v_result;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'bim_%';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'bim_%';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
