import { MigrationInterface, QueryRunner } from 'typeorm';

export class CashflowEngine1746100000000 implements MigrationInterface {
  name = 'CashflowEngine1746100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================================================================
    // CASHFLOW ENGINE - Financial Analytics for Construction
    // =====================================================================

    // ------------------------------------------------------------------------
    // 1. Función: calculate_profit_margin()
    // Calcula Margen de Utilidad en tiempo real:
    // (Presupuesto_Total - Gastos_Reales - Pagos_ManoObra)
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_profit_margin(
        p_company_id UUID,
        p_project_id UUID DEFAULT NULL
      )
      RETURNS TABLE(
        project_id UUID,
        project_name TEXT,
        total_budget NUMERIC(15,2),
        total_expenses NUMERIC(15,2),
        labor_payments NUMERIC(15,2),
        profit_margin NUMERIC(15,2),
        margin_percentage NUMERIC(5,2)
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        WITH budget_totals AS (
          SELECT 
            b.project_id,
            SUM(
              b.total_material + b.total_labor + b.total_equipment + 
              b.total_other + COALESCE(b.contingency_amount, 0)
            ) AS total_budget
          FROM budgets b
          WHERE b.status = 'approved'
            AND b.company_id = p_company_id
            AND (p_project_id IS NULL OR b.project_id = p_project_id)
          GROUP BY b.project_id
        ),
        expense_totals AS (
          SELECT 
            e.project_id,
            SUM(e.amount) AS total_expenses
          FROM expenses e
          WHERE e.company_id = p_company_id
            AND (p_project_id IS NULL OR e.project_id = p_project_id)
          GROUP BY e.project_id
        ),
        labor_totals AS (
          SELECT 
            wp.project_id,
            SUM(wp.amount) AS labor_payments
          FROM worker_payments wp
          WHERE wp.company_id = p_company_id
            AND (p_project_id IS NULL OR wp.project_id = p_project_id)
          GROUP BY wp.project_id
        )
        SELECT 
          p.id AS project_id,
          p.name::TEXT AS project_name,
          COALESCE(bt.total_budget, 0)::NUMERIC(15,2) AS total_budget,
          COALESCE(et.total_expenses, 0)::NUMERIC(15,2) AS total_expenses,
          COALESCE(lt.labor_payments, 0)::NUMERIC(15,2) AS labor_payments,
          (
            COALESCE(bt.total_budget, 0) - 
            COALESCE(et.total_expenses, 0) - 
            COALESCE(lt.labor_payments, 0)
          )::NUMERIC(15,2) AS profit_margin,
          CASE 
            WHEN COALESCE(bt.total_budget, 0) > 0
            THEN (
              (COALESCE(bt.total_budget, 0) - COALESCE(et.total_expenses, 0) - COALESCE(lt.labor_payments, 0)) / 
              COALESCE(bt.total_budget, 0) * 100
            )::NUMERIC(5,2)
            ELSE 0
          END AS margin_percentage
        FROM projects p
        LEFT JOIN budget_totals bt ON p.id = bt.project_id
        LEFT JOIN expense_totals et ON p.id = et.project_id
        LEFT JOIN labor_totals lt ON p.id = lt.project_id
        WHERE p.company_id = p_company_id
          AND (p_project_id IS NULL OR p.id = p_project_id);
      END;
      $$;
    `);

    // ------------------------------------------------------------------------
    // 2. Función: get_cumulative_vs_projected()
    // Genera serie de tiempo: Gasto Acumulado vs Proyectado
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_cumulative_vs_projected(
        p_company_id UUID,
        p_project_id UUID DEFAULT NULL,
        p_months INTEGER DEFAULT 12
      )
      RETURNS TABLE(
        month DATE,
        projected_amount NUMERIC(15,2),
        actual_amount NUMERIC(15,2),
        cumulative_projected NUMERIC(15,2),
        cumulative_actual NUMERIC(15,2),
        variance NUMERIC(15,2)
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        start_date DATE;
        current_date DATE;
        total_budget NUMERIC(15,2);
        monthly_projected NUMERIC(15,2);
      BEGIN
        -- Calculate start date (first day of current month - p_months)
        start_date := DATE_TRUNC('month', CURRENT_DATE) - (p_months || ' months')::INTERVAL;
        
        -- Get total budget for the project
        SELECT COALESCE(SUM(
          b.total_material + b.total_labor + b.total_equipment + 
          b.total_other + COALESCE(b.contingency_amount, 0)
        ), 0)::NUMERIC(15,2)
        INTO total_budget
        FROM budgets b
        WHERE b.company_id = p_company_id
          AND b.status = 'approved'
          AND (p_project_id IS NULL OR b.project_id = p_project_id);
        
        -- Calculate monthly projected amount (linear distribution)
        monthly_projected := total_budget / p_months;
        
        -- Generate series
        current_date := start_date;
        WHILE current_date <= DATE_TRUNC('month', CURRENT_DATE) LOOP
          RETURN QUERY
          WITH expenses_to_date AS (
            SELECT COALESCE(SUM(amount), 0)::NUMERIC(15,2) AS actual
            FROM expenses e
            WHERE e.company_id = p_company_id
              AND (p_project_id IS NULL OR e.project_id = p_project_id)
              AND DATE_TRUNC('month', e.date) <= current_date
          ),
          labor_to_date AS (
            SELECT COALESCE(SUM(amount), 0)::NUMERIC(15,2) AS labor
            FROM worker_payments wp
            WHERE wp.company_id = p_company_id
              AND (p_project_id IS NULL OR wp.project_id = p_project_id)
              AND DATE_TRUNC('month', wp.payment_date) <= current_date
          )
          SELECT 
            current_date AS month,
            (monthly_projected * EXTRACT(MONTH FROM current_date))::NUMERIC(15,2) AS projected_amount,
            (COALESCE(e.actual, 0) + COALESCE(l.labor, 0))::NUMERIC(15,2) AS actual_amount,
            (monthly_projected * EXTRACT(MONTH FROM current_date))::NUMERIC(15,2) AS cumulative_projected,
            (COALESCE(e.actual, 0) + COALESCE(l.labor, 0))::NUMERIC(15,2) AS cumulative_actual,
            (
              (monthly_projected * EXTRACT(MONTH FROM current_date)) - 
              (COALESCE(e.actual, 0) + COALESCE(l.labor, 0))
            )::NUMERIC(15,2) AS variance
          FROM expenses_to_date e
          CROSS JOIN labor_to_date l;
          
          current_date := current_date + INTERVAL '1 month';
        END LOOP;
      END;
      $$;
    `);

    // ------------------------------------------------------------------------
    // 3. Vista: bi_cashflow_dashboard
    // Dashboard de Cashflow con métricas principales
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_cashflow_dashboard AS
      SELECT 
        p.company_id,
        p.id AS project_id,
        p.name AS project_name,
        p.status AS project_status,
        
        -- Budget
        COALESCE(budget_data.total_budgeted, 0)::NUMERIC(15,2) AS total_budgeted,
        
        -- Real Expenses
        COALESCE(expense_data.total_expenses, 0)::NUMERIC(15,2) AS total_expenses,
        
        -- Labor Payments
        COALESCE(labor_data.total_labor, 0)::NUMERIC(15,2) AS total_labor_payments,
        
        -- Total Outflow (Expenses + Labor)
        (COALESCE(expense_data.total_expenses, 0) + COALESCE(labor_data.total_labor, 0))::NUMERIC(15,2) AS total_outflow,
        
        -- Profit Margin
        (
          COALESCE(budget_data.total_budgeted, 0) - 
          COALESCE(expense_data.total_expenses, 0) - 
          COALESCE(labor_data.total_labor, 0)
        )::NUMERIC(15,2) AS profit_margin,
        
        -- Margin Percentage
        CASE 
          WHEN COALESCE(budget_data.total_budgeted, 0) > 0
          THEN (
            (
              COALESCE(budget_data.total_budgeted, 0) - 
              COALESCE(expense_data.total_expenses, 0) - 
              COALESCE(labor_data.total_labor, 0)
            ) / COALESCE(budget_data.total_budgeted, 0) * 100
          )::NUMERIC(5,2)
          ELSE 0
        END AS margin_percentage,
        
        -- Burn Rate (monthly average)
        CASE 
          WHEN EXTRACT(MONTH FROM AGE(NOW(), p.start_date)) > 0
          THEN (
            (COALESCE(expense_data.total_expenses, 0) + COALESCE(labor_data.total_labor, 0)) / 
            NULLIF(EXTRACT(MONTH FROM AGE(NOW(), p.start_date)), 0)
          )::NUMERIC(15,2)
          ELSE 0
        END AS monthly_burn_rate,
        
        -- Remaining Budget
        (
          COALESCE(budget_data.total_budgeted, 0) - 
          COALESCE(expense_data.total_expenses, 0) - 
          COALESCE(labor_data.total_labor, 0)
        )::NUMERIC(15,2) AS remaining_budget,
        
        -- Project Duration Info
        p.start_date,
        p.end_date,
        EXTRACT(MONTH FROM AGE(p.end_date, p.start_date)) AS planned_duration_months,
        EXTRACT(MONTH FROM AGE(NOW(), p.start_date)) AS months_elapsed,
        
        NOW() AS calculated_at
      FROM projects p
      LEFT JOIN (
        SELECT 
          b.project_id,
          SUM(
            b.total_material + b.total_labor + b.total_equipment + 
            b.total_other + COALESCE(b.contingency_amount, 0)
          ) AS total_budgeted
        FROM budgets b
        WHERE b.status = 'approved'
        GROUP BY b.project_id
      ) budget_data ON p.id = budget_data.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(amount) AS total_expenses
        FROM expenses
        GROUP BY project_id
      ) expense_data ON p.id = expense_data.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(amount) AS total_labor
        FROM worker_payments
        GROUP BY project_id
      ) labor_data ON p.id = labor_data.project_id;
    `);

    // ------------------------------------------------------------------------
    // 4. Vista: bi_cashflow_time_series
    // Serie de tiempo para gráfico Gasto Acumulado vs Proyectado
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_cashflow_time_series AS
      WITH monthly_data AS (
        SELECT 
          p.company_id,
          p.id AS project_id,
          p.name AS project_name,
          DATE_TRUNC('month', e.date)::DATE AS month,
          SUM(e.amount)::NUMERIC(15,2) AS monthly_expenses
        FROM projects p
        LEFT JOIN expenses e ON p.id = e.project_id
        GROUP BY p.company_id, p.id, p.name, DATE_TRUNC('month', e.date)
      ),
      labor_monthly AS (
        SELECT 
          p.company_id,
          p.id AS project_id,
          DATE_TRUNC('month', wp.payment_date)::DATE AS month,
          SUM(wp.amount)::NUMERIC(15,2) AS monthly_labor
        FROM projects p
        LEFT JOIN worker_payments wp ON p.id = wp.project_id
        GROUP BY p.company_id, p.id, DATE_TRUNC('month', wp.payment_date)
      ),
      budget_monthly AS (
        SELECT 
          p.company_id,
          p.id AS project_id,
          SUM(
            b.total_material + b.total_labor + b.total_equipment + 
            b.total_other + COALESCE(b.contingency_amount, 0)
          ) / 12 AS monthly_budget
        FROM projects p
        LEFT JOIN budgets b ON p.id = b.project_id AND b.status = 'approved'
        WHERE b.id IS NOT NULL
        GROUP BY p.company_id, p.id
      )
      SELECT 
        m.company_id,
        m.project_id,
        m.project_name,
        m.month,
        COALESCE(m.monthly_expenses, 0) + COALESCE(lm.monthly_labor, 0) AS actual_spent,
        COALESCE(bm.monthly_budget, 0) AS projected_monthly,
        
        -- Cumulative calculations using window functions
        SUM(COALESCE(m.monthly_expenses, 0) + COALESCE(lm.monthly_labor, 0)) OVER (
          PARTITION BY m.project_id 
          ORDER BY m.month 
          ROWS UNBOUNDED PRECEDING
        ) AS cumulative_actual,
        
        SUM(COALESCE(bm.monthly_budget, 0)) OVER (
          PARTITION BY m.project_id 
          ORDER BY m.month 
          ROWS UNBOUNDED PRECEDING
        ) AS cumulative_projected
      FROM monthly_data m
      LEFT JOIN labor_monthly lm ON m.project_id = lm.project_id AND m.month = lm.month
      LEFT JOIN budget_monthly bm ON m.project_id = bm.project_id
      WHERE m.month IS NOT NULL;
    `);

    // ------------------------------------------------------------------------
    // 5. RLS Policies - Seguridad Multi-Tenant
    // ------------------------------------------------------------------------

    // Enable RLS on views (they inherit from base tables but we add policy checks)
    await queryRunner.query(`
      -- View bi_cashflow_dashboard RLS
      CREATE POLICY "cashflow_dashboard_select_policy"
      ON bi_cashflow_dashboard
      FOR SELECT
      USING (company_id = current_setting('app.company_id', true)::uuid);
    `);

    await queryRunner.query(`
      -- View bi_cashflow_time_series RLS
      CREATE POLICY "cashflow_time_series_select_policy"
      ON bi_cashflow_time_series
      FOR SELECT
      USING (company_id = current_setting('app.company_id', true)::uuid);
    `);

    // ------------------------------------------------------------------------
    // 6. Índices para optimizar consultas de cashflow
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_expenses_company_month" 
      ON expenses (company_id, date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_worker_payments_company_month" 
      ON worker_payments (company_id, payment_date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_budgets_company_status" 
      ON budgets (company_id, status) 
      WHERE status = 'approved';
    `);

    // ------------------------------------------------------------------------
    // 7. Función helper: get_project_cashflow_summary()
    // Resumen rápido de cashflow por proyecto
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_project_cashflow_summary(p_project_id UUID)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
        v_company_id UUID;
      BEGIN
        -- Get company_id from project
        SELECT company_id INTO v_company_id
        FROM projects WHERE id = p_project_id;
        
        SELECT jsonb_build_object(
          'project_id', p.id,
          'project_name', p.name,
          'total_budgeted', COALESCE(bt.total_budget, 0),
          'total_expenses', COALESCE(et.total_expenses, 0),
          'total_labor', COALESCE(lt.labor_payments, 0),
          'profit_margin', COALESCE(bt.total_budget, 0) - COALESCE(et.total_expenses, 0) - COALESCE(lt.labor_payments, 0),
          'remaining_budget', COALESCE(bt.total_budget, 0) - COALESCE(et.total_expenses, 0) - COALESCE(lt.labor_payments, 0),
          'burn_rate_monthly', CASE 
            WHEN EXTRACT(MONTH FROM AGE(NOW(), p.start_date)) > 0 
            THEN (COALESCE(et.total_expenses, 0) + COALESCE(lt.labor_payments, 0)) / EXTRACT(MONTH FROM AGE(NOW(), p.start_date))
            ELSE 0
          END,
          'months_remaining', EXTRACT(MONTH FROM p.end_date - NOW())
        ) INTO result
        FROM projects p
        LEFT JOIN (
          SELECT project_id, SUM(
            total_material + total_labor + total_equipment + 
            total_other + COALESCE(contingency_amount, 0)
          ) AS total_budget
          FROM budgets WHERE status = 'approved'
          GROUP BY project_id
        ) bt ON p.id = bt.project_id
        LEFT JOIN (
          SELECT project_id, SUM(amount) AS total_expenses
          FROM expenses GROUP BY project_id
        ) et ON p.id = et.project_id
        LEFT JOIN (
          SELECT project_id, SUM(amount) AS labor_payments
          FROM worker_payments GROUP BY project_id
        ) lt ON p.id = lt.project_id
        WHERE p.id = p_project_id;
        
        RETURN result;
      END;
      $$;
    `);

    // ------------------------------------------------------------------------
    // 8. Actualizar bi_financial_summary con columnas de cashflow
    // ------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE OR REPLACE VIEW bi_financial_summary AS
      SELECT
        p.company_id,
        p.id AS project_id,
        p.name AS project_name,
        COALESCE(budget_data.total_budgeted, 0)::NUMERIC(15,2) AS total_budgeted,
        COALESCE(expense_data.total_spent, 0)::NUMERIC(15,2) AS total_spent,
        COALESCE(labor_data.labor_paid, 0)::NUMERIC(15,2) AS labor_paid,
        
        -- Cashflow columns
        (COALESCE(budget_data.total_budgeted, 0) - COALESCE(expense_data.total_spent, 0) - COALESCE(labor_data.labor_paid, 0))::NUMERIC(15,2) AS profit_margin,
        
        CASE 
          WHEN COALESCE(budget_data.total_budgeted, 0) > 0 
          THEN ((COALESCE(budget_data.total_budgeted, 0) - COALESCE(expense_data.total_spent, 0) - COALESCE(labor_data.labor_paid, 0)) / COALESCE(budget_data.total_budgeted, 0) * 100)::NUMERIC(5,2)
          ELSE 0 
        END AS margin_percentage,
        
        COALESCE(budget_data.total_budgeted, 0)::NUMERIC(15,2) - COALESCE(expense_data.total_spent, 0)::NUMERIC(15,2) - COALESCE(labor_data.labor_paid, 0)::NUMERIC(15,2) AS variance,
        
        CASE 
          WHEN COALESCE(budget_data.total_budgeted, 0) > 0 
          THEN (COALESCE(expense_data.total_spent, 0) / COALESCE(budget_data.total_budgeted, 0) * 100)::NUMERIC(5,2)
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
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(amount) AS labor_paid
        FROM worker_payments
        GROUP BY project_id
      ) labor_data ON p.id = labor_data.project_id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views
    await queryRunner.query(`DROP VIEW IF EXISTS bi_cashflow_time_series`);
    await queryRunner.query(`DROP VIEW IF EXISTS bi_cashflow_dashboard`);
    await queryRunner.query(`DROP VIEW IF EXISTS bi_financial_summary`);

    // Drop functions
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS calculate_profit_margin(UUID, UUID)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS get_cumulative_vs_projected(UUID, UUID, INTEGER)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS get_project_cashflow_summary(UUID)`,
    );

    // Drop policies
    await queryRunner.query(
      `DROP POLICY IF EXISTS "cashflow_dashboard_select_policy" ON bi_cashflow_dashboard`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "cashflow_time_series_select_policy" ON bi_cashflow_time_series`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_expenses_company_month"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_worker_payments_company_month"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_budgets_company_status"`,
    );
  }
}
