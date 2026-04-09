-- =====================================================
-- BIM Analytics SQL Functions for Performance Optimization
-- =====================================================

-- Function to analyze BIM costs by type with proper RLS
CREATE OR REPLACE FUNCTION analyze_bim_costs_by_type(
  p_company_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  ifc_type TEXT,
  element_count BIGINT,
  total_volume NUMERIC,
  total_area NUMERIC,
  total_cost NUMERIC,
  total_price NUMERIC,
  cost_per_m3 NUMERIC,
  cost_per_m2 NUMERIC,
  average_element_cost NUMERIC,
  budget_items BIGINT,
  execution_progress NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH bim_data AS (
    SELECT 
      be.ifc_type,
      COUNT(be.id) as element_count,
      COALESCE(SUM((be.quantities->>'netVolume')::numeric), 0) as total_volume,
      COALESCE(SUM((be.quantities->>'netArea')::numeric), 0) as total_area
    FROM bim_elements be
    INNER JOIN bim_models bm ON be.model_id = bm.id
    WHERE be.company_id = p_company_id
      AND (p_project_id IS NULL OR bm.project_id = p_project_id)
    GROUP BY be.ifc_type
  ),
  budget_data AS (
    SELECT 
      i.ifc_global_id,
      be.ifc_type,
      SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0)) as item_cost,
      SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_price, 0)) as item_price,
      COUNT(i.id) as budget_item_count,
      AVG(COALESCE(i.quantity_executed, 0) / NULLIF(COALESCE(i.quantity, 1), 0)) as avg_progress
    FROM items i
    INNER JOIN bim_elements be ON i.ifc_global_id = be.ifc_guid
    INNER JOIN bim_models bm ON be.model_id = bm.id
    WHERE i.company_id = p_company_id
      AND i.ifc_global_id IS NOT NULL
      AND (p_project_id IS NULL OR bm.project_id = p_project_id)
    GROUP BY i.ifc_global_id, be.ifc_type
  ),
  aggregated_budget AS (
    SELECT 
      ifc_type,
      SUM(item_cost) as total_cost,
      SUM(item_price) as total_price,
      SUM(budget_item_count) as budget_items,
      AVG(avg_progress) * 100 as execution_progress
    FROM budget_data
    GROUP BY ifc_type
  )
  SELECT 
    bd.ifc_type,
    bd.element_count,
    bd.total_volume,
    bd.total_area,
    COALESCE(ab.total_cost, 0) as total_cost,
    COALESCE(ab.total_price, 0) as total_price,
    CASE 
      WHEN bd.total_volume > 0 THEN COALESCE(ab.total_cost, 0) / bd.total_volume
      ELSE 0 
    END as cost_per_m3,
    CASE 
      WHEN bd.total_area > 0 THEN COALESCE(ab.total_cost, 0) / bd.total_area
      ELSE 0 
    END as cost_per_m2,
    CASE 
      WHEN bd.element_count > 0 THEN COALESCE(ab.total_cost, 0) / bd.element_count
      ELSE 0 
    END as average_element_cost,
    COALESCE(ab.budget_items, 0) as budget_items,
    COALESCE(ab.execution_progress, 0) as execution_progress
  FROM bim_data bd
  LEFT JOIN aggregated_budget ab ON bd.ifc_type = ab.ifc_type
  ORDER BY COALESCE(ab.total_cost, 0) DESC;
END;
$$;

-- Function to get potential clash pairs using spatial indexing
CREATE OR REPLACE FUNCTION get_potential_clash_pairs(
  p_company_id UUID,
  p_discipline_a TEXT,
  p_discipline_b TEXT,
  p_tolerance_mm NUMERIC DEFAULT 10
)
RETURNS TABLE (
  element_a_id UUID,
  element_b_id UUID,
  element_a_guid TEXT,
  element_b_guid TEXT,
  overlap_volume NUMERIC,
  distance NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH elements_a AS (
    SELECT 
      be.id,
      be.ifc_guid,
      be.bounding_box,
      bm.discipline
    FROM bim_elements be
    INNER JOIN bim_models bm ON be.model_id = bm.id
    WHERE be.company_id = p_company_id
      AND bm.discipline = p_discipline_a
      AND be.bounding_box IS NOT NULL
  ),
  elements_b AS (
    SELECT 
      be.id,
      be.ifc_guid,
      be.bounding_box,
      bm.discipline
    FROM bim_elements be
    INNER JOIN bim_models bm ON be.model_id = bm.id
    WHERE be.company_id = p_company_id
      AND bm.discipline = p_discipline_b
      AND be.bounding_box IS NOT NULL
  )
  SELECT 
    ea.id as element_a_id,
    eb.id as element_b_id,
    ea.ifc_guid as element_a_guid,
    eb.ifc_guid as element_b_guid,
    -- Calculate overlap volume using bounding box intersection
    GREATEST(0, 
      LEAST((ea.bounding_box->>'maxX')::numeric, (eb.bounding_box->>'maxX')::numeric) - 
      GREATEST((ea.bounding_box->>'minX')::numeric, (eb.bounding_box->>'minX')::numeric)
    ) *
    GREATEST(0,
      LEAST((ea.bounding_box->>'maxY')::numeric, (eb.bounding_box->>'maxY')::numeric) - 
      GREATEST((ea.bounding_box->>'minY')::numeric, (eb.bounding_box->>'minY')::numeric)
    ) *
    GREATEST(0,
      LEAST((ea.bounding_box->>'maxZ')::numeric, (eb.bounding_box->>'maxZ')::numeric) - 
      GREATEST((ea.bounding_box->>'minZ')::numeric, (eb.bounding_box->>'minZ')::numeric)
    ) as overlap_volume,
    -- Calculate minimum distance between bounding boxes
    SQRT(
      POWER(GREATEST(0, 
        GREATEST((ea.bounding_box->>'minX')::numeric, (eb.bounding_box->>'minX')::numeric) - 
        LEAST((ea.bounding_box->>'maxX')::numeric, (eb.bounding_box->>'maxX')::numeric)
      ), 2) +
      POWER(GREATEST(0, 
        GREATEST((ea.bounding_box->>'minY')::numeric, (eb.bounding_box->>'minY')::numeric) - 
        LEAST((ea.bounding_box->>'maxY')::numeric, (eb.bounding_box->>'maxY')::numeric)
      ), 2) +
      POWER(GREATEST(0, 
        GREATEST((ea.bounding_box->>'minZ')::numeric, (eb.bounding_box->>'minZ')::numeric) - 
        LEAST((ea.bounding_box->>'maxZ')::numeric, (eb.bounding_box->>'maxZ')::numeric)
      ), 2)
    ) as distance
  FROM elements_a ea
  CROSS JOIN elements_b eb
  WHERE ea.id != eb.id
    -- Pre-filter using bounding box overlap check for performance
    AND (ea.bounding_box->>'minX')::numeric <= (eb.bounding_box->>'maxX')::numeric + p_tolerance_mm
    AND (ea.bounding_box->>'maxX')::numeric >= (eb.bounding_box->>'minX')::numeric - p_tolerance_mm
    AND (ea.bounding_box->>'minY')::numeric <= (eb.bounding_box->>'maxY')::numeric + p_tolerance_mm
    AND (ea.bounding_box->>'maxY')::numeric >= (eb.bounding_box->>'minY')::numeric - p_tolerance_mm
    AND (ea.bounding_box->>'minZ')::numeric <= (eb.bounding_box->>'maxZ')::numeric + p_tolerance_mm
    AND (ea.bounding_box->>'maxZ')::numeric >= (eb.bounding_box->>'minZ')::numeric - p_tolerance_mm;
END;
$$;

-- Function to update federated job progress
CREATE OR REPLACE FUNCTION update_bim_federated_job_progress(
  p_job_id UUID,
  p_progress INTEGER,
  p_clashes_found INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bim_federated_clash_jobs
  SET 
    progress = p_progress,
    clashes_found = p_clashes_found,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Function to complete federated job
CREATE OR REPLACE FUNCTION complete_bim_federated_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bim_federated_clash_jobs
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    progress = CASE WHEN p_success THEN 100 ELSE progress END,
    completed_at = NOW(),
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Function to add clash comment
CREATE OR REPLACE FUNCTION add_clash_comment(
  p_clash_id UUID,
  p_company_id UUID,
  p_content TEXT,
  p_author_email TEXT,
  p_author_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comment_id UUID;
BEGIN
  comment_id := gen_random_uuid();
  
  INSERT INTO bim_clash_comments (
    id,
    clash_id,
    company_id,
    content,
    author_email,
    author_name,
    created_at,
    updated_at
  )
  VALUES (
    comment_id,
    p_clash_id,
    p_company_id,
    p_content,
    p_author_email,
    p_author_name,
    NOW(),
    NOW()
  );
  
  RETURN comment_id;
END;
$$;

-- Function to get BIM elements with budget integration
CREATE OR REPLACE FUNCTION get_bim_elements_with_budget(
  p_company_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_ifc_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  element_id UUID,
  ifc_guid TEXT,
  ifc_type TEXT,
  element_name TEXT,
  storey_name TEXT,
  net_volume NUMERIC,
  net_area NUMERIC,
  budget_quantity NUMERIC,
  executed_quantity NUMERIC,
  unit_cost NUMERIC,
  unit_price NUMERIC,
  total_cost NUMERIC,
  execution_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    be.id as element_id,
    be.ifc_guid,
    be.ifc_type,
    be.name as element_name,
    be.storey_name,
    (be.quantities->>'netVolume')::numeric as net_volume,
    (be.quantities->>'netArea')::numeric as net_area,
    COALESCE(i.quantity, 0) as budget_quantity,
    COALESCE(i.quantity_executed, 0) as executed_quantity,
    COALESCE(i.unit_cost, 0) as unit_cost,
    COALESCE(i.unit_price, 0) as unit_price,
    COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0) as total_cost,
    CASE 
      WHEN COALESCE(i.quantity, 0) > 0 
      THEN (COALESCE(i.quantity_executed, 0) / i.quantity) * 100
      ELSE 0 
    END as execution_percentage
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = p_company_id
  WHERE be.company_id = p_company_id
    AND (p_project_id IS NULL OR bm.project_id = p_project_id)
    AND (p_ifc_type IS NULL OR be.ifc_type = p_ifc_type)
  ORDER BY be.created_at DESC;
END;
$$;

-- Function for BIM progress analysis by storey
CREATE OR REPLACE FUNCTION analyze_bim_progress_by_storey(
  p_company_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  storey_name TEXT,
  total_elements BIGINT,
  completed_elements BIGINT,
  progress_percentage NUMERIC,
  total_volume NUMERIC,
  completed_volume NUMERIC,
  total_cost NUMERIC,
  executed_cost NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(be.storey_name, 'Unknown') as storey_name,
    COUNT(be.id) as total_elements,
    SUM(
      CASE 
        WHEN COALESCE(i.quantity_executed, 0) >= COALESCE(i.quantity, 0) 
        AND COALESCE(i.quantity, 0) > 0
        THEN 1 
        ELSE 0 
      END
    ) as completed_elements,
    CASE 
      WHEN COUNT(be.id) > 0 
      THEN (
        SUM(
          CASE 
            WHEN COALESCE(i.quantity_executed, 0) >= COALESCE(i.quantity, 0) 
            AND COALESCE(i.quantity, 0) > 0
            THEN 1 
            ELSE 0 
          END
        )::NUMERIC / COUNT(be.id)
      ) * 100
      ELSE 0 
    END as progress_percentage,
    COALESCE(SUM((be.quantities->>'netVolume')::numeric), 0) as total_volume,
    COALESCE(
      SUM(
        CASE 
          WHEN COALESCE(i.quantity_executed, 0) >= COALESCE(i.quantity, 0) 
          AND COALESCE(i.quantity, 0) > 0
          THEN (be.quantities->>'netVolume')::numeric
          ELSE 0 
        END
      ), 0
    ) as completed_volume,
    COALESCE(SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0)), 0) as total_cost,
    COALESCE(SUM(COALESCE(i.quantity_executed, 0) * COALESCE(i.unit_cost, 0)), 0) as executed_cost
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = p_company_id
  WHERE be.company_id = p_company_id
    AND (p_project_id IS NULL OR bm.project_id = p_project_id)
  GROUP BY COALESCE(be.storey_name, 'Unknown')
  ORDER BY progress_percentage DESC;
END;
$$;

-- Create indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bim_elements_company_type 
  ON bim_elements(company_id, ifc_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bim_elements_storey 
  ON bim_elements(company_id, storey_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bim_elements_bbox_gin 
  ON bim_elements USING GIN (bounding_box);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_ifc_global_id 
  ON items(company_id, ifc_global_id) 
  WHERE ifc_global_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bim_clashes_company_status 
  ON bim_clashes(company_id, status, severity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bim_clashes_disciplines 
  ON bim_clashes(company_id, discipline_a, discipline_b);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION analyze_bim_costs_by_type(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_potential_clash_pairs(UUID, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION update_bim_federated_job_progress(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_bim_federated_job(UUID, BOOLEAN, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION add_clash_comment(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bim_elements_with_budget(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_bim_progress_by_storey(UUID, UUID) TO authenticated;