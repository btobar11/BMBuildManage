-- Migration: Add company_id to Budgets, Stages, Items for Multi-Tenant Security
-- Created: 2026-04-24
-- Purpose: Fix security vulnerability - all users could see ALL budgets

-- 1. Add company_id columns to budgets, stages, items
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE stages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 2. Set company_id for existing records (derive from projects)
UPDATE budgets SET company_id = p.company_id
FROM projects p WHERE budgets.project_id = p.id AND budgets.company_id IS NULL;

UPDATE stages SET company_id = b.company_id
FROM budgets b WHERE stages.budget_id = b.id AND stages.company_id IS NULL;

UPDATE items SET company_id = s.company_id
FROM stages s WHERE items.stage_id = s.id AND items.company_id IS NULL;

-- 3. Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_stages_company ON stages(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company ON items(company_id);

-- 4. Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (strict - company isolation)
DROP POLICY IF EXISTS "budg_companies_can_select" ON budgets;
DROP POLICY IF EXISTS "budg_companies_can_insert" ON budgets;
DROP POLICY IF EXISTS "budg_companies_can_update" ON budgets;
DROP POLICY IF EXISTS "budg_companies_can_delete" ON budgets;

CREATE POLICY "budg_companies_can_select" ON budgets FOR SELECT USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "budg_companies_can_insert" ON budgets FOR INSERT WITH CHECK (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "budg_companies_can_update" ON budgets FOR UPDATE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "budg_companies_can_delete" ON budgets FOR DELETE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);

DROP POLICY IF EXISTS "stag_companies_can_select" ON stages;
DROP POLICY IF EXISTS "stag_companies_can_insert" ON stages;
DROP POLICY IF EXISTS "stag_companies_can_update" ON stages;
DROP POLICY IF EXISTS "stag_companies_can_delete" ON stages;

CREATE POLICY "stag_companies_can_select" ON stages FOR SELECT USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "stag_companies_can_insert" ON stages FOR INSERT WITH CHECK (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "stag_companies_can_update" ON stages FOR UPDATE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "stag_companies_can_delete" ON stages FOR DELETE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);

DROP POLICY IF EXISTS "item_companies_can_select" ON items;
DROP POLICY IF EXISTS "item_companies_can_insert" ON items;
DROP POLICY IF EXISTS "item_companies_can_update" ON items;
DROP POLICY IF EXISTS "item_companies_can_delete" ON items;

CREATE POLICY "item_companies_can_select" ON items FOR SELECT USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "item_companies_can_insert" ON items FOR INSERT WITH CHECK (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "item_companies_can_update" ON items FOR UPDATE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);
CREATE POLICY "item_companies_can_delete" ON items FOR DELETE USING (company_id = (SELECT auth.jwt() ->> 'company_id')::UUID);

-- 6. Make columns NOT NULL
ALTER TABLE budgets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE stages ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE items ALTER COLUMN company_id SET NOT NULL;

-- 7. Add foreign key constraints
ALTER TABLE budgets ADD CONSTRAINT fk_budgets_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE stages ADD CONSTRAINT fk_stages_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE items ADD CONSTRAINT fk_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

SELECT 'Migration complete: company_id added to budgets, stages, items' as result;