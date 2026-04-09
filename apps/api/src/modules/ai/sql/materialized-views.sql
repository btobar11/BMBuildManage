-- =====================================================
-- BIM Performance Optimization: Materialized Views
-- =====================================================

-- 1. BIM Statistics by Company and Project (Refreshed hourly)
-- This view pre-calculates all the heavy statistics for instant queries
CREATE MATERIALIZED VIEW bim_statistics_mv AS
WITH base_stats AS (
  SELECT 
    be.company_id,
    bm.project_id,
    bm.discipline,
    be.ifc_type,
    be.storey_name,
    COUNT(be.id) as element_count,
    SUM(COALESCE((be.quantities->>'netVolume')::numeric, 0)) as total_net_volume,
    SUM(COALESCE((be.quantities->>'netArea')::numeric, 0)) as total_net_area,
    SUM(COALESCE((be.quantities->>'grossVolume')::numeric, 0)) as total_gross_volume,
    SUM(COALESCE((be.quantities->>'grossArea')::numeric, 0)) as total_gross_area,
    SUM(COALESCE((be.quantities->>'length')::numeric, 0)) as total_length,
    AVG(COALESCE((be.quantities->>'netVolume')::numeric, 0)) as avg_net_volume,
    AVG(COALESCE((be.quantities->>'netArea')::numeric, 0)) as avg_net_area,
    COUNT(CASE WHEN be.bounding_box IS NOT NULL THEN 1 END) as elements_with_geometry,
    COUNT(CASE WHEN be.name IS NOT NULL AND be.name != '' THEN 1 END) as elements_with_names,
    COUNT(CASE WHEN be.storey_name IS NOT NULL AND be.storey_name != '' THEN 1 END) as elements_with_storey
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  GROUP BY be.company_id, bm.project_id, bm.discipline, be.ifc_type, be.storey_name
),
budget_stats AS (
  SELECT 
    be.company_id,
    bm.project_id,
    be.ifc_type,
    COUNT(i.id) as budget_items_count,
    SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0)) as total_cost,
    SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_price, 0)) as total_price,
    SUM(COALESCE(i.quantity_executed, 0) * COALESCE(i.unit_cost, 0)) as executed_cost,
    AVG(CASE 
      WHEN COALESCE(i.quantity, 0) > 0 
      THEN (COALESCE(i.quantity_executed, 0) / i.quantity) * 100 
      ELSE 0 
    END) as avg_execution_percentage
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = be.company_id
  WHERE i.id IS NOT NULL
  GROUP BY be.company_id, bm.project_id, be.ifc_type
)
SELECT 
  bs.company_id,
  bs.project_id,
  bs.discipline,
  bs.ifc_type,
  bs.storey_name,
  bs.element_count,
  bs.total_net_volume,
  bs.total_net_area,
  bs.total_gross_volume,
  bs.total_gross_area,
  bs.total_length,
  bs.avg_net_volume,
  bs.avg_net_area,
  bs.elements_with_geometry,
  bs.elements_with_names,
  bs.elements_with_storey,
  -- Quality Score Calculation
  CASE 
    WHEN bs.element_count > 0 
    THEN (
      (bs.elements_with_geometry::numeric / bs.element_count * 30) + 
      (bs.elements_with_names::numeric / bs.element_count * 35) + 
      (bs.elements_with_storey::numeric / bs.element_count * 35)
    )
    ELSE 0 
  END as quality_score,
  -- Budget Integration
  COALESCE(bgs.budget_items_count, 0) as budget_items_count,
  COALESCE(bgs.total_cost, 0) as total_cost,
  COALESCE(bgs.total_price, 0) as total_price,
  COALESCE(bgs.executed_cost, 0) as executed_cost,
  COALESCE(bgs.avg_execution_percentage, 0) as avg_execution_percentage,
  -- Cost per unit calculations
  CASE 
    WHEN bs.total_net_volume > 0 AND COALESCE(bgs.total_cost, 0) > 0
    THEN bgs.total_cost / bs.total_net_volume
    ELSE 0
  END as cost_per_m3,
  CASE 
    WHEN bs.total_net_area > 0 AND COALESCE(bgs.total_cost, 0) > 0
    THEN bgs.total_cost / bs.total_net_area
    ELSE 0
  END as cost_per_m2,
  -- Timestamps
  NOW() as last_updated
FROM base_stats bs
LEFT JOIN budget_stats bgs ON bs.company_id = bgs.company_id 
  AND bs.project_id = bgs.project_id 
  AND bs.ifc_type = bgs.ifc_type;

-- Create indexes for fast queries
CREATE INDEX idx_bim_statistics_mv_company_project 
  ON bim_statistics_mv(company_id, project_id);
  
CREATE INDEX idx_bim_statistics_mv_company_type 
  ON bim_statistics_mv(company_id, ifc_type);
  
CREATE INDEX idx_bim_statistics_mv_discipline 
  ON bim_statistics_mv(company_id, project_id, discipline);

-- 2. BIM Clash Analysis Materialized View (Refreshed every 30 minutes)
CREATE MATERIALIZED VIEW bim_clash_analysis_mv AS
WITH clash_stats AS (
  SELECT 
    bc.company_id,
    bm_a.project_id,
    bc.clash_type,
    bc.severity,
    bc.status,
    COALESCE(bc.discipline_a, 'unknown') as discipline_a,
    COALESCE(bc.discipline_b, 'unknown') as discipline_b,
    COUNT(bc.id) as clash_count,
    AVG(COALESCE(bc.intersection_volume, 0)) as avg_intersection_volume,
    AVG(COALESCE(bc.clearance_distance, 0)) as avg_clearance_distance,
    COUNT(CASE WHEN bc.status IN ('resolved', 'ignored') THEN 1 END) as resolved_count,
    AVG(
      CASE 
        WHEN bc.resolved_at IS NOT NULL AND bc.detected_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (bc.resolved_at - bc.detected_at)) / (24 * 3600)
        ELSE NULL
      END
    ) as avg_resolution_days
  FROM bim_clashes bc
  LEFT JOIN bim_models bm_a ON bc.model_a_id = bm_a.id
  GROUP BY bc.company_id, bm_a.project_id, bc.clash_type, bc.severity, bc.status, 
           bc.discipline_a, bc.discipline_b
)
SELECT 
  company_id,
  project_id,
  clash_type,
  severity,
  status,
  discipline_a,
  discipline_b,
  clash_count,
  avg_intersection_volume,
  avg_clearance_distance,
  resolved_count,
  avg_resolution_days,
  CASE 
    WHEN clash_count > 0 
    THEN (resolved_count::numeric / clash_count) * 100 
    ELSE 0 
  END as resolution_percentage,
  NOW() as last_updated
FROM clash_stats;

-- Create indexes for clash analysis
CREATE INDEX idx_bim_clash_analysis_mv_company_project 
  ON bim_clash_analysis_mv(company_id, project_id);
  
CREATE INDEX idx_bim_clash_analysis_mv_severity 
  ON bim_clash_analysis_mv(company_id, project_id, severity);
  
CREATE INDEX idx_bim_clash_analysis_mv_status 
  ON bim_clash_analysis_mv(company_id, project_id, status);

-- 3. BIM Progress Analysis by Storey (Refreshed daily)
CREATE MATERIALIZED VIEW bim_progress_by_storey_mv AS
WITH storey_stats AS (
  SELECT 
    be.company_id,
    bm.project_id,
    COALESCE(be.storey_name, 'Unknown') as storey_name,
    COUNT(be.id) as total_elements,
    SUM(COALESCE((be.quantities->>'netVolume')::numeric, 0)) as total_volume,
    SUM(COALESCE((be.quantities->>'netArea')::numeric, 0)) as total_area,
    -- Budget integration
    COUNT(i.id) as budget_items,
    SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0)) as total_cost,
    SUM(COALESCE(i.quantity_executed, 0) * COALESCE(i.unit_cost, 0)) as executed_cost,
    SUM(
      CASE 
        WHEN COALESCE(i.quantity_executed, 0) >= COALESCE(i.quantity, 0) 
        AND COALESCE(i.quantity, 0) > 0
        THEN 1 
        ELSE 0 
      END
    ) as completed_elements,
    SUM(
      CASE 
        WHEN COALESCE(i.quantity_executed, 0) >= COALESCE(i.quantity, 0) 
        AND COALESCE(i.quantity, 0) > 0
        THEN COALESCE((be.quantities->>'netVolume')::numeric, 0)
        ELSE 0 
      END
    ) as completed_volume
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = be.company_id
  GROUP BY be.company_id, bm.project_id, be.storey_name
)
SELECT 
  company_id,
  project_id,
  storey_name,
  total_elements,
  total_volume,
  total_area,
  budget_items,
  total_cost,
  executed_cost,
  completed_elements,
  completed_volume,
  -- Progress calculations
  CASE 
    WHEN total_elements > 0 
    THEN (completed_elements::numeric / total_elements) * 100 
    ELSE 0 
  END as progress_percentage,
  CASE 
    WHEN total_volume > 0 
    THEN (completed_volume / total_volume) * 100 
    ELSE 0 
  END as volume_progress_percentage,
  CASE 
    WHEN total_cost > 0 
    THEN (executed_cost / total_cost) * 100 
    ELSE 0 
  END as cost_progress_percentage,
  NOW() as last_updated
FROM storey_stats
ORDER BY progress_percentage ASC; -- Lowest progress first for priority attention

-- Create indexes for progress analysis
CREATE INDEX idx_bim_progress_by_storey_mv_company_project 
  ON bim_progress_by_storey_mv(company_id, project_id);
  
CREATE INDEX idx_bim_progress_by_storey_mv_progress 
  ON bim_progress_by_storey_mv(company_id, project_id, progress_percentage);

-- 4. BIM Cost Analysis by IFC Type (Refreshed every 2 hours)
CREATE MATERIALIZED VIEW bim_cost_analysis_mv AS
WITH cost_analysis AS (
  SELECT 
    be.company_id,
    bm.project_id,
    be.ifc_type,
    COUNT(be.id) as element_count,
    SUM(COALESCE((be.quantities->>'netVolume')::numeric, 0)) as total_net_volume,
    SUM(COALESCE((be.quantities->>'netArea')::numeric, 0)) as total_net_area,
    -- Budget data
    COUNT(i.id) as budget_items,
    SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_cost, 0)) as total_cost,
    SUM(COALESCE(i.quantity, 0) * COALESCE(i.unit_price, 0)) as total_price,
    SUM(COALESCE(i.quantity_executed, 0) * COALESCE(i.unit_cost, 0)) as executed_cost,
    AVG(
      CASE 
        WHEN COALESCE(i.quantity, 0) > 0 
        THEN (COALESCE(i.quantity_executed, 0) / i.quantity) * 100 
        ELSE 0 
      END
    ) as avg_execution_percentage
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = be.company_id
  GROUP BY be.company_id, bm.project_id, be.ifc_type
)
SELECT 
  company_id,
  project_id,
  ifc_type,
  element_count,
  total_net_volume,
  total_net_area,
  budget_items,
  total_cost,
  total_price,
  executed_cost,
  avg_execution_percentage,
  -- Cost efficiency calculations
  CASE 
    WHEN total_net_volume > 0 AND total_cost > 0
    THEN total_cost / total_net_volume
    ELSE 0
  END as cost_per_m3,
  CASE 
    WHEN total_net_area > 0 AND total_cost > 0
    THEN total_cost / total_net_area
    ELSE 0
  END as cost_per_m2,
  CASE 
    WHEN element_count > 0 AND total_cost > 0
    THEN total_cost / element_count
    ELSE 0
  END as avg_cost_per_element,
  -- Budget variance
  CASE 
    WHEN total_cost > 0
    THEN ((executed_cost - total_cost) / total_cost) * 100
    ELSE 0
  END as cost_variance_percentage,
  NOW() as last_updated
FROM cost_analysis
ORDER BY total_cost DESC; -- Highest cost items first

-- Create indexes for cost analysis
CREATE INDEX idx_bim_cost_analysis_mv_company_project 
  ON bim_cost_analysis_mv(company_id, project_id);
  
CREATE INDEX idx_bim_cost_analysis_mv_cost 
  ON bim_cost_analysis_mv(company_id, project_id, total_cost DESC);
  
CREATE INDEX idx_bim_cost_analysis_mv_variance 
  ON bim_cost_analysis_mv(company_id, project_id, cost_variance_percentage DESC);

-- 5. BIM Quality Metrics Materialized View (Refreshed daily)
CREATE MATERIALIZED VIEW bim_quality_metrics_mv AS
WITH quality_stats AS (
  SELECT 
    be.company_id,
    bm.project_id,
    be.ifc_type,
    COALESCE(be.storey_name, 'Unknown') as storey_name,
    COUNT(be.id) as total_elements,
    -- Geometry quality
    COUNT(CASE WHEN be.bounding_box IS NOT NULL THEN 1 END) as elements_with_geometry,
    COUNT(CASE WHEN be.quantities IS NOT NULL AND be.quantities != '{}' THEN 1 END) as elements_with_quantities,
    -- Data quality
    COUNT(CASE WHEN be.name IS NOT NULL AND be.name != '' AND be.name != be.ifc_type THEN 1 END) as elements_with_meaningful_names,
    COUNT(CASE WHEN be.storey_name IS NOT NULL AND be.storey_name != '' THEN 1 END) as elements_with_storey,
    -- Budget integration quality
    COUNT(i.id) as elements_with_budget,
    COUNT(CASE WHEN i.ifc_global_id IS NOT NULL THEN 1 END) as elements_linked_to_budget
  FROM bim_elements be
  INNER JOIN bim_models bm ON be.model_id = bm.id
  LEFT JOIN items i ON be.ifc_guid = i.ifc_global_id AND i.company_id = be.company_id
  GROUP BY be.company_id, bm.project_id, be.ifc_type, be.storey_name
)
SELECT 
  company_id,
  project_id,
  ifc_type,
  storey_name,
  total_elements,
  elements_with_geometry,
  elements_with_quantities,
  elements_with_meaningful_names,
  elements_with_storey,
  elements_with_budget,
  elements_linked_to_budget,
  -- Quality scores (0-100)
  CASE 
    WHEN total_elements > 0 
    THEN (elements_with_geometry::numeric / total_elements * 100)
    ELSE 0 
  END as geometry_quality_score,
  CASE 
    WHEN total_elements > 0 
    THEN (elements_with_quantities::numeric / total_elements * 100)
    ELSE 0 
  END as quantities_quality_score,
  CASE 
    WHEN total_elements > 0 
    THEN (elements_with_meaningful_names::numeric / total_elements * 100)
    ELSE 0 
  END as naming_quality_score,
  CASE 
    WHEN total_elements > 0 
    THEN (elements_with_storey::numeric / total_elements * 100)
    ELSE 0 
  END as storey_assignment_quality_score,
  CASE 
    WHEN total_elements > 0 
    THEN (elements_with_budget::numeric / total_elements * 100)
    ELSE 0 
  END as budget_integration_score,
  -- Overall quality score (weighted average)
  CASE 
    WHEN total_elements > 0 
    THEN (
      (elements_with_geometry::numeric / total_elements * 25) +
      (elements_with_quantities::numeric / total_elements * 25) +
      (elements_with_meaningful_names::numeric / total_elements * 20) +
      (elements_with_storey::numeric / total_elements * 15) +
      (elements_with_budget::numeric / total_elements * 15)
    )
    ELSE 0 
  END as overall_quality_score,
  NOW() as last_updated
FROM quality_stats
ORDER BY overall_quality_score ASC; -- Lowest quality first for priority attention

-- Create indexes for quality metrics
CREATE INDEX idx_bim_quality_metrics_mv_company_project 
  ON bim_quality_metrics_mv(company_id, project_id);
  
CREATE INDEX idx_bim_quality_metrics_mv_quality_score 
  ON bim_quality_metrics_mv(company_id, project_id, overall_quality_score ASC);

-- =====================================================
-- Refresh Functions and Scheduling
-- =====================================================

-- Function to refresh all BIM materialized views
CREATE OR REPLACE FUNCTION refresh_all_bim_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY bim_statistics_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY bim_clash_analysis_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY bim_progress_by_storey_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY bim_cost_analysis_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY bim_quality_metrics_mv;
END;
$$;

-- Schedule automatic refresh (requires pg_cron extension)
-- Refresh every hour during work hours (8 AM to 6 PM, Monday to Friday)
SELECT cron.schedule(
  'refresh-bim-stats-work-hours',
  '0 8-18 * * 1-5',
  'SELECT refresh_all_bim_materialized_views();'
);

-- Refresh every 4 hours during off hours
SELECT cron.schedule(
  'refresh-bim-stats-off-hours',
  '0 0,4,20 * * *',
  'SELECT refresh_all_bim_materialized_views();'
);

-- Emergency refresh function for immediate updates
CREATE OR REPLACE FUNCTION emergency_refresh_bim_stats(
  p_company_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- If specific company/project is provided, consider partial refresh
  -- For now, refresh all (in production, we could implement partial refresh)
  PERFORM refresh_all_bim_materialized_views();
  
  -- Log the emergency refresh
  INSERT INTO bim_refresh_log (
    company_id,
    project_id,
    refresh_type,
    refreshed_at,
    triggered_by
  ) VALUES (
    p_company_id,
    p_project_id,
    'emergency',
    NOW(),
    current_user
  );
END;
$$;

-- Create refresh log table for monitoring
CREATE TABLE IF NOT EXISTS bim_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  project_id UUID,
  refresh_type TEXT NOT NULL,
  refreshed_at TIMESTAMP NOT NULL,
  triggered_by TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for refresh log
CREATE INDEX IF NOT EXISTS idx_bim_refresh_log_timestamp 
  ON bim_refresh_log(refreshed_at DESC);

-- Function to get refresh status
CREATE OR REPLACE FUNCTION get_bim_refresh_status()
RETURNS TABLE(
  view_name TEXT,
  last_refresh TIMESTAMP,
  next_scheduled_refresh TIMESTAMP,
  is_stale BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH view_info AS (
    SELECT 
      'bim_statistics_mv' as view_name,
      (SELECT last_updated FROM bim_statistics_mv LIMIT 1) as last_refresh
    UNION ALL
    SELECT 
      'bim_clash_analysis_mv',
      (SELECT last_updated FROM bim_clash_analysis_mv LIMIT 1)
    UNION ALL
    SELECT 
      'bim_progress_by_storey_mv',
      (SELECT last_updated FROM bim_progress_by_storey_mv LIMIT 1)
    UNION ALL
    SELECT 
      'bim_cost_analysis_mv',
      (SELECT last_updated FROM bim_cost_analysis_mv LIMIT 1)
    UNION ALL
    SELECT 
      'bim_quality_metrics_mv',
      (SELECT last_updated FROM bim_quality_metrics_mv LIMIT 1)
  )
  SELECT 
    vi.view_name,
    vi.last_refresh,
    vi.last_refresh + INTERVAL '1 hour' as next_scheduled_refresh,
    (vi.last_refresh < NOW() - INTERVAL '2 hours') as is_stale
  FROM view_info vi;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_bim_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_refresh_bim_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bim_refresh_status() TO authenticated;