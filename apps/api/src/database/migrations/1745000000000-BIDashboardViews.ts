import { MigrationInterface, QueryRunner } from 'typeorm';

export class BIDashboardViews1745000000000 implements MigrationInterface {
  name = 'BIDashboardViews1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================================================================
    // VIEW 1: bi_financial_summary - Curva S (Budget vs Actual)
    // =====================================================================
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_financial_summary AS
      SELECT
        p.company_id,
        p.id AS project_id,
        p.name AS project_name,
        COALESCE(budget_data.total_budgeted, 0)::numeric(15,2) AS total_budgeted,
        COALESCE(expense_data.total_spent, 0)::numeric(15,2) AS total_spent,
        COALESCE(budget_data.total_budgeted, 0)::numeric(15,2) - COALESCE(expense_data.total_spent, 0)::numeric(15,2) AS variance,
        CASE 
          WHEN COALESCE(budget_data.total_budgeted, 0) > 0 
          THEN (COALESCE(expense_data.total_spent, 0) / COALESCE(budget_data.total_budgeted, 0) * 100)::numeric(5,2)
          ELSE 0 
        END AS percent_executed,
        budget_data.material_budgeted,
        budget_data.labor_budgeted,
        budget_data.equipment_budgeted,
        expense_data.material_spent,
        expense_data.labor_spent,
        expense_data.equipment_spent,
        NOW() AS calculated_at
      FROM projects p
      LEFT JOIN (
        SELECT 
          b.project_id,
          SUM(b.total_material + b.total_labor + b.total_equipment + b.total_other + COALESCE(b.contingency_amount, 0)) AS total_budgeted,
          SUM(b.total_material) AS material_budgeted,
          SUM(b.total_labor) AS labor_budgeted,
          SUM(b.total_equipment) AS equipment_budgeted
        FROM budgets b
        WHERE b.status = 'approved'
        GROUP BY b.project_id
      ) budget_data ON p.id = budget_data.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(CASE WHEN expense_type = 'material' THEN amount ELSE 0 END) AS material_spent,
          SUM(CASE WHEN expense_type = 'labor' THEN amount ELSE 0 END) AS labor_spent,
          SUM(CASE WHEN expense_type = 'equipment' THEN amount ELSE 0 END) AS equipment_spent,
          SUM(amount) AS total_spent
        FROM expenses
        GROUP BY project_id
      ) expense_data ON p.id = expense_data.project_id
    `);

    // =====================================================================
    // VIEW 2: bi_physical_progress - Avance Físico por Proyecto
    // =====================================================================
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_physical_progress AS
      SELECT
        p.company_id,
        p.id AS project_id,
        p.name AS project_name,
        COALESCE(SUM(i.quantity), 0)::numeric(15,3) AS total_quantity_budgeted,
        COALESCE(SUM(i.quantity_executed), 0)::numeric(15,3) AS total_quantity_executed,
        CASE 
          WHEN SUM(i.quantity) > 0 
          THEN (SUM(i.quantity_executed) / SUM(i.quantity) * 100)::numeric(5,2)
          ELSE 0 
        END AS physical_progress_percent,
        COUNT(i.id)::integer AS total_items,
        COUNT(CASE WHEN i.quantity_executed > 0 THEN 1 END)::integer AS items_with_progress,
        COUNT(CASE WHEN i.quantity_executed >= i.quantity AND i.quantity > 0 THEN 1 END)::integer AS completed_items,
        NOW() AS calculated_at
      FROM projects p
      LEFT JOIN budgets b ON b.project_id = p.id AND b.status = 'approved'
      LEFT JOIN stages s ON s.budget_id = b.id
      LEFT JOIN items i ON i.stage_id = s.id
      GROUP BY p.company_id, p.id, p.name
    `);

    // =====================================================================
    // VIEW 3: bi_clash_health - Clash Detection Stats
    // =====================================================================
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_clash_health AS
      SELECT
        company_id,
        project_id,
        COUNT(*)::integer AS total_clashes,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer AS pending_clashes,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END)::integer AS accepted_clashes,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::integer AS resolved_clashes,
        COUNT(CASE WHEN status = 'ignored' THEN 1 END)::integer AS ignored_clashes,
        CASE 
          WHEN COUNT(*) > 0 
          THEN (COUNT(CASE WHEN status = 'resolved' THEN 1 END)::numeric(10,2) / COUNT(*) * 100)::numeric(5,2)
          ELSE 0 
        END AS resolution_rate_percent,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END)::integer AS critical_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END)::integer AS high_count,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END)::integer AS medium_count,
        COUNT(CASE WHEN severity = 'low' THEN 1 END)::integer AS low_count,
        NOW() AS calculated_at
      FROM bim_clashes
      GROUP BY company_id, project_id
    `);

    // =====================================================================
    // RLS POLICIES - Row Level Security para las vistas BI
    // =====================================================================

    // RLS for bi_financial_summary
    await queryRunner.query(`
      CREATE OR REPLACE POLICY "bi_financial_summary_company_isolation" 
      ON bi_financial_summary 
      FOR SELECT 
      USING (company_id = current_setting('app.company_id')::uuid)
    `);

    // RLS for bi_physical_progress
    await queryRunner.query(`
      CREATE OR REPLACE POLICY "bi_physical_progress_company_isolation" 
      ON bi_physical_progress 
      FOR SELECT 
      USING (company_id = current_setting('app.company_id')::uuid)
    `);

    // RLS for bi_clash_health
    await queryRunner.query(`
      CREATE OR REPLACE POLICY "bi_clash_health_company_isolation" 
      ON bi_clash_health 
      FOR SELECT 
      USING (company_id = current_setting('app.company_id')::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop RLS policies first
    await queryRunner.query(`
      DROP POLICY IF EXISTS "bi_financial_summary_company_isolation" ON bi_financial_summary
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS "bi_physical_progress_company_isolation" ON bi_physical_progress
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS "bi_clash_health_company_isolation" ON bi_clash_health
    `);

    // Drop views
    await queryRunner.query(`DROP VIEW IF EXISTS bi_financial_summary`);
    await queryRunner.query(`DROP VIEW IF EXISTS bi_physical_progress`);
    await queryRunner.query(`DROP VIEW IF EXISTS bi_clash_health`);
  }
}
