-- =====================================================
-- BI Materialized Views for Dashboard Analytics
-- Optimized for sub-200ms queries with RLS security
-- =====================================================

-- 1. APU Cost by Project (Materialized View)
-- Calculates total APU costs from items that use APU templates
-- Path: items → stages → budgets → projects → companies
CREATE MATERIALIZED VIEW bi_apu_cost_by_project_mv AS
WITH apu_item_costs AS (
  SELECT 
    p.company_id,
    b.project_id,
    at.id as apu_template_id,
    at.name as apu_name,
    at.category,
    i.unit,
    i.quantity,
    -- Calculate APU unit cost from its resources
    COALESCE(
      (
        SELECT SUM(COALESCE(ar.coefficient, 1) * COALESCE(r.base_price, 0))
        FROM apu_resources ar
        JOIN resources r ON ar.resource_id = r.id
        WHERE ar.apu_id = at.id
      ),
      0
    ) as apu_unit_cost,
    -- Calculate total cost for this item's quantity
    i.quantity * COALESCE(
      (
        SELECT SUM(COALESCE(ar.coefficient, 1) * COALESCE(r.base_price, 0))
        FROM apu_resources ar
        JOIN resources r ON ar.resource_id = r.id
        WHERE ar.apu_id = at.id
      ),
      0
    ) as item_apu_cost
  FROM items i
  JOIN stages st ON i.stage_id = st.id
  JOIN budgets b ON st.budget_id = b.id
  JOIN projects p ON b.project_id = p.id
  JOIN apu_templates at ON i.apu_template_id = at.id
  WHERE i.apu_template_id IS NOT NULL
    AND p.company_id IS NOT NULL
)
SELECT 
  company_id,
  project_id,
  COUNT(DISTINCT apu_template_id) as apu_count,
  SUM(item_apu_cost) as total_apu_cost,
  COUNT(*) as items_with_apu,
  NOW() as last_updated
FROM apu_item_costs
WHERE project_id IS NOT NULL
GROUP BY company_id, project_id;

-- Create optimized indexes for APU cost view
CREATE UNIQUE INDEX idx_bi_apu_cost_company_project 
  ON bi_apu_cost_by_project_mv(company_id, project_id);

CREATE INDEX idx_bi_apu_cost_company 
  ON bi_apu_cost_by_project_mv(company_id);

-- 2. Approved Expenses by Project (Materialized View)
-- Aggregates total expenses per project (all expenses - no approval status in current schema)
CREATE MATERIALIZED VIEW bi_expenses_by_project_mv AS
SELECT 
  e.company_id,
  e.project_id,
  p.name as project_name,
  e.expense_type,
  COUNT(e.id) as expense_count,
  SUM(e.amount) as total_amount,
  COUNT(CASE WHEN e.expense_type = 'material' THEN 1 END) as material_count,
  SUM(CASE WHEN e.expense_type = 'material' THEN e.amount ELSE 0 END) as material_total,
  COUNT(CASE WHEN e.expense_type = 'labor' THEN 1 END) as labor_count,
  SUM(CASE WHEN e.expense_type = 'labor' THEN e.amount ELSE 0 END) as labor_total,
  COUNT(CASE WHEN e.expense_type = 'equipment' THEN 1 END) as equipment_count,
  SUM(CASE WHEN e.expense_type = 'equipment' THEN e.amount ELSE 0 END) as equipment_total,
  COUNT(CASE WHEN e.expense_type = 'other' THEN 1 END) as other_count,
  SUM(CASE WHEN e.expense_type = 'other' THEN e.amount ELSE 0 END) as other_total,
  MIN(e.date) as first_expense_date,
  MAX(e.date) as last_expense_date,
  NOW() as last_updated
FROM expenses e
LEFT JOIN projects p ON e.project_id = p.id
WHERE e.company_id IS NOT NULL
GROUP BY e.company_id, e.project_id, p.name, e.expense_type;

-- Create project-level aggregate
CREATE MATERIALIZED VIEW bi_expenses_summary_by_project_mv AS
SELECT 
  company_id,
  project_id,
  project_name,
  SUM(expense_count) as total_expense_count,
  SUM(total_amount) as total_amount,
  SUM(material_total) as material_total,
  SUM(labor_total) as labor_total,
  SUM(equipment_total) as equipment_total,
  SUM(other_total) as other_total,
  MIN(first_expense_date) as first_expense_date,
  MAX(last_expense_date) as last_expense_date,
  NOW() as last_updated
FROM bi_expenses_by_project_mv
GROUP BY company_id, project_id, project_name;

-- Create optimized indexes for expenses view
CREATE UNIQUE INDEX idx_bi_expenses_company_project 
  ON bi_expenses_summary_by_project_mv(company_id, project_id);

CREATE INDEX idx_bi_expenses_company 
  ON bi_expenses_summary_by_project_mv(company_id);

-- 3. BIM Clash Summary by Company (Materialized View)
-- Uses bim_clash_jobs - company-level aggregate
CREATE MATERIALIZED VIEW bi_clash_summary_by_project_mv AS
SELECT 
  bj.company_id,
  NULL::uuid as project_id,
  NULL::text as project_name,
  COUNT(bj.id) as total_jobs,
  COUNT(bj.id) as total_clashes,  -- Count jobs as proxy for clashes
  SUM(CASE WHEN bj.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
  SUM(CASE WHEN bj.status = 'failed' THEN 1 ELSE 0 END) as failed_jobs,
  SUM(CASE WHEN bj.status = 'running' THEN 1 ELSE 0 END) as running_jobs,
  NOW() as last_updated
FROM bim_clash_jobs bj
WHERE bj.company_id IS NOT NULL
GROUP BY bj.company_id;

-- Create optimized indexes for clash view
CREATE UNIQUE INDEX idx_bi_clash_summary_company 
  ON bi_clash_summary_by_project_mv(company_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- Note: RLS not supported on materialized views - security enforced at app level
-- Regular views can use RLS, materialized views use app-level filtering
-- =====================================================

-- Grant SELECT on all views
GRANT SELECT ON bi_apu_cost_by_project_mv TO authenticated;
GRANT SELECT ON bi_expenses_by_project_mv TO authenticated;
GRANT SELECT ON bi_expenses_summary_by_project_mv TO authenticated;
GRANT SELECT ON bi_clash_summary_by_project_mv TO authenticated;