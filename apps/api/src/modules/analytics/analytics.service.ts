import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface FinancialSummary {
  company_id: string;
  project_id: string;
  project_name: string;
  total_budgeted: number;
  total_spent: number;
  variance: number;
  percent_executed: number;
  material_budgeted: number;
  labor_budgeted: number;
  equipment_budgeted: number;
  material_spent: number;
  labor_spent: number;
  equipment_spent: number;
  calculated_at: Date;
}

export interface PhysicalProgress {
  company_id: string;
  project_id: string;
  project_name: string;
  total_quantity_budgeted: number;
  total_quantity_executed: number;
  physical_progress_percent: number;
  total_items: number;
  items_with_progress: number;
  completed_items: number;
  calculated_at: Date;
}

export interface ClashHealth {
  company_id: string;
  project_id: string;
  total_clashes: number;
  pending_clashes: number;
  accepted_clashes: number;
  resolved_clashes: number;
  ignored_clashes: number;
  resolution_rate_percent: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  calculated_at: Date;
}

export interface CashflowPoint {
  week: string;
  week_start: Date;
  week_end: Date;
  budget_total: number;
  expenses_total: number;
  worker_payments_total: number;
  accumulated_budget: number;
  accumulated_spent: number;
  available: number;
  utilization_percent: number;
}

export interface CashflowSummary {
  company_id: string;
  project_id: string;
  project_name: string;
  total_budgeted: number;
  total_expenses: number;
  total_worker_payments: number;
  total_spent: number;
  available: number;
  utilization_percent: number;
  time_series: CashflowPoint[];
  calculated_at: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getFinancialSummary(companyId: string): Promise<FinancialSummary[]> {
    const query = `
      SELECT 
        company_id,
        project_id,
        project_name,
        total_budgeted,
        total_spent,
        variance,
        percent_executed,
        material_budgeted,
        labor_budgeted,
        equipment_budgeted,
        material_spent,
        labor_spent,
        equipment_spent,
        calculated_at
      FROM bi_financial_summary
      WHERE company_id = $1
      ORDER BY project_name ASC
    `;

    return this.dataSource.query(query, [companyId]);
  }

  async getPhysicalProgress(companyId: string): Promise<PhysicalProgress[]> {
    const query = `
      SELECT 
        company_id,
        project_id,
        project_name,
        total_quantity_budgeted,
        total_quantity_executed,
        physical_progress_percent,
        total_items,
        items_with_progress,
        completed_items,
        calculated_at
      FROM bi_physical_progress
      WHERE company_id = $1
      ORDER BY project_name ASC
    `;

    return this.dataSource.query(query, [companyId]);
  }

  async getClashHealth(companyId: string): Promise<ClashHealth[]> {
    const query = `
      SELECT 
        company_id,
        project_id,
        total_clashes,
        pending_clashes,
        accepted_clashes,
        resolved_clashes,
        ignored_clashes,
        resolution_rate_percent,
        critical_count,
        high_count,
        medium_count,
        low_count,
        calculated_at
      FROM bi_clash_health
      WHERE company_id = $1
      ORDER BY total_clashes DESC
    `;

    return this.dataSource.query(query, [companyId]);
  }

  async getProjectFinancialDetails(
    companyId: string,
    projectId: string,
  ): Promise<FinancialSummary | null> {
    const query = `
      SELECT 
        company_id,
        project_id,
        project_name,
        total_budgeted,
        total_spent,
        variance,
        percent_executed,
        material_budgeted,
        labor_budgeted,
        equipment_budgeted,
        material_spent,
        labor_spent,
        equipment_spent,
        calculated_at
      FROM bi_financial_summary
      WHERE company_id = $1 AND project_id = $2
    `;

    const results = await this.dataSource.query(query, [companyId, projectId]);
    return results.length > 0 ? results[0] : null;
  }

  async getProjectPhysicalDetails(
    companyId: string,
    projectId: string,
  ): Promise<PhysicalProgress | null> {
    const query = `
      SELECT 
        company_id,
        project_id,
        project_name,
        total_quantity_budgeted,
        total_quantity_executed,
        physical_progress_percent,
        total_items,
        items_with_progress,
        completed_items,
        calculated_at
      FROM bi_physical_progress
      WHERE company_id = $1 AND project_id = $2
    `;

    const results = await this.dataSource.query(query, [companyId, projectId]);
    return results.length > 0 ? results[0] : null;
  }

  async getProjectClashHealth(
    companyId: string,
    projectId: string,
  ): Promise<ClashHealth | null> {
    const query = `
      SELECT 
        company_id,
        project_id,
        total_clashes,
        pending_clashes,
        accepted_clashes,
        resolved_clashes,
        ignored_clashes,
        resolution_rate_percent,
        critical_count,
        high_count,
        medium_count,
        low_count,
        calculated_at
      FROM bi_clash_health
      WHERE company_id = $1 AND project_id = $2
    `;

    const results = await this.dataSource.query(query, [companyId, projectId]);
    return results.length > 0 ? results[0] : null;
  }

  async getDashboardSummary(companyId: string): Promise<{
    financial: FinancialSummary[];
    physical: PhysicalProgress[];
    clash: ClashHealth[];
  }> {
    const [financial, physical, clash] = await Promise.all([
      this.getFinancialSummary(companyId),
      this.getPhysicalProgress(companyId),
      this.getClashHealth(companyId),
    ]);

    return { financial, physical, clash };
  }

  async getCashflow(companyId: string): Promise<CashflowSummary[]> {
    // Query optimizada para flujo de caja a nivel company
    const query = `
      WITH project_budgets AS (
        SELECT 
          p.company_id,
          p.id AS project_id,
          p.name AS project_name,
          COALESCE(SUM(b.total_estimated_price), 0) AS total_budget
        FROM projects p
        LEFT JOIN budgets b ON b.project_id = p.id AND b.is_active = true
        WHERE p.company_id = $1 AND p.status IN ('in_progress', 'approved')
        GROUP BY p.id, p.company_id, p.name
      ),
      project_expenses AS (
        SELECT 
          company_id,
          project_id,
          SUM(amount) AS total_expenses
        FROM expenses
        WHERE company_id = $1
        GROUP BY company_id, project_id
      ),
      project_worker_payments AS (
        SELECT 
          wp.company_id,
          wp.project_id,
          SUM(amount) AS total_worker_payments
        FROM worker_payments wp
        WHERE wp.company_id = $1
        GROUP BY wp.company_id, wp.project_id
      )
      SELECT 
        pb.company_id,
        pb.project_id,
        pb.project_name,
        pb.total_budget AS total_budgeted,
        COALESCE(pe.total_expenses, 0) AS total_expenses,
        COALESCE(pwp.total_worker_payments, 0) AS total_worker_payments,
        COALESCE(pe.total_expenses, 0) + COALESCE(pwp.total_worker_payments, 0) AS total_spent,
        pb.total_budget - COALESCE(pe.total_expenses, 0) - COALESCE(pwp.total_worker_payments, 0) AS available,
        CASE 
          WHEN pb.total_budget > 0 
          THEN ((COALESCE(pe.total_expenses, 0) + COALESCE(pwp.total_worker_payments, 0)) / pb.total_budget * 100)
          ELSE 0 
        END AS utilization_percent,
        NOW() AS calculated_at
      FROM project_budgets pb
      LEFT JOIN project_expenses pe ON pe.project_id = pb.project_id
      LEFT JOIN project_worker_payments pwp ON pwp.project_id = pb.project_id
      WHERE pb.total_budget > 0
      ORDER BY pb.project_name ASC
    `;

    const results = await this.dataSource.query(query, [companyId]);

    // Para cada proyecto, generamos time-series semanal
    const summaries: CashflowSummary[] = [];
    for (const row of results) {
      const timeSeries = await this.generateCashflowTimeSeries(
        companyId,
        row.project_id,
      );
      summaries.push({
        company_id: row.company_id,
        project_id: row.project_id,
        project_name: row.project_name,
        total_budgeted: Number(row.total_budgeted),
        total_expenses: Number(row.total_expenses),
        total_worker_payments: Number(row.total_worker_payments),
        total_spent: Number(row.total_spent),
        available: Number(row.available),
        utilization_percent: Number(row.utilization_percent),
        time_series: timeSeries,
        calculated_at: row.calculated_at,
      });
    }

    return summaries;
  }

  async getProjectCashflow(
    companyId: string,
    projectId: string,
  ): Promise<CashflowSummary | null> {
    // Query para un proyecto específico
    const query = `
      WITH budget AS (
        SELECT 
          COALESCE(SUM(total_estimated_price), 0) AS total_budget
        FROM budgets
        WHERE project_id = $1 AND is_active = true
      ),
      expenses AS (
        SELECT COALESCE(SUM(amount), 0) AS total_expenses
        FROM expenses
        WHERE project_id = $1 AND company_id = $2
      ),
      worker_payments AS (
        SELECT COALESCE(SUM(amount), 0) AS total_worker_payments
        FROM worker_payments
        WHERE project_id = $1 AND company_id = $2
      ),
      project_info AS (
        SELECT name FROM projects WHERE id = $1
      )
      SELECT 
        $2 AS company_id,
        $1 AS project_id,
        (SELECT name FROM project_info) AS project_name,
        (SELECT total_budget FROM budget) AS total_budgeted,
        (SELECT total_expenses FROM expenses) AS total_expenses,
        (SELECT total_worker_payments FROM worker_payments) AS total_worker_payments,
        (SELECT total_expenses FROM expenses) + (SELECT total_worker_payments FROM worker_payments) AS total_spent,
        (SELECT total_budget FROM budget) - (SELECT total_expenses FROM expenses) - (SELECT total_worker_payments FROM worker_payments) AS available,
        CASE 
          WHEN (SELECT total_budget FROM budget) > 0 
          THEN ((SELECT total_expenses FROM expenses) + (SELECT total_worker_payments FROM worker_payments)) / (SELECT total_budget FROM budget) * 100
          ELSE 0 
        END AS utilization_percent,
        NOW() AS calculated_at
    `;

    const results = await this.dataSource.query(query, [projectId, companyId]);
    if (results.length === 0) return null;

    const row = results[0];
    const timeSeries = await this.generateCashflowTimeSeries(
      companyId,
      projectId,
    );

    return {
      company_id: row.company_id,
      project_id: row.project_id,
      project_name: row.project_name,
      total_budgeted: Number(row.total_budgeted),
      total_expenses: Number(row.total_expenses),
      total_worker_payments: Number(row.total_worker_payments),
      total_spent: Number(row.total_spent),
      available: Number(row.available),
      utilization_percent: Number(row.utilization_percent),
      time_series: timeSeries,
      calculated_at: row.calculated_at,
    };
  }

  private async generateCashflowTimeSeries(
    companyId: string,
    projectId: string,
  ): Promise<CashflowPoint[]> {
    // Genera time-series semanal para el proyecto
    const query = `
      WITH project_period AS (
        SELECT 
          start_date,
          CURRENT_DATE AS end_date,
          EXTRACT(WEEK FROM start_date)::int AS start_week,
          EXTRACT(YEAR FROM start_date)::int AS start_year
        FROM projects
        WHERE id = $1 AND company_id = $2
      ),
      weekly_expenses AS (
        SELECT 
          DATE_TRUNC('week', date)::date AS week_start,
          SUM(amount) AS weekly_expenses
        FROM expenses
        WHERE project_id = $1 AND company_id = $2
        GROUP BY DATE_TRUNC('week', date)
      ),
      weekly_worker_payments AS (
        SELECT 
          DATE_TRUNC('week', date)::date AS week_start,
          SUM(amount) AS weekly_payments
        FROM worker_payments
        WHERE project_id = $1 AND company_id = $2
        GROUP BY DATE_TRUNC('week', date)
      )
      SELECT 
        TO_CHAR(week_start, 'IYYY-IW') AS week,
        week_start,
        week_start + INTERVAL '6 days' AS week_end,
        0 AS budget_total,
        COALESCE(we.weekly_expenses, 0) AS expenses_total,
        COALESCE(wwp.weekly_payments, 0) AS worker_payments_total,
        0 AS accumulated_budget,
        0 AS accumulated_spent,
        0 AS available,
        0 AS utilization_percent
      FROM generate_series(
        (SELECT start_date FROM project_period),
        (SELECT end_date FROM project_period),
        INTERVAL '1 week'
      ) AS week_start
      LEFT JOIN weekly_expenses we ON we.week_start = week_start
      LEFT JOIN weekly_worker_payments wwp ON wwp.week_start = week_start
      ORDER BY week_start ASC
    `;

    const rows = await this.dataSource.query(query, [projectId, companyId]);

    // Calcular acumulados
    const accumulatedBudget = 0;
    let accumulatedSpent = 0;
    const budgetTotal = rows.reduce(
      (sum: number, r: any) =>
        sum + Number(r.expenses_total) + Number(r.worker_payments_total),
      0,
    );

    return rows.map((row: any, index: number) => {
      const weekExpenses = Number(row.expenses_total);
      const weekPayments = Number(row.worker_payments_total);
      const weekSpent = weekExpenses + weekPayments;

      accumulatedSpent += weekSpent;

      return {
        week: row.week,
        week_start: row.week_start,
        week_end: row.week_end,
        budget_total: budgetTotal, // Asumimos budget evenly distributed
        expenses_total: weekExpenses,
        worker_payments_total: weekPayments,
        accumulated_budget: budgetTotal, // Total proyectado
        accumulated_spent: accumulatedSpent,
        available: budgetTotal - accumulatedSpent,
        utilization_percent:
          budgetTotal > 0 ? (accumulatedSpent / budgetTotal) * 100 : 0,
      };
    });
  }

  /**
   * Labor Productivity KPIs — Resumen de productividad laboral por proyecto.
   * Combina horas/jornadas trabajadas vs avance físico.
   */
  async getLaborProductivity(companyId: string): Promise<any[]> {
    try {
      const query = `
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          COUNT(DISTINCT wa.worker_id) AS total_workers_assigned,
          COALESCE(SUM(wp.amount), 0) AS total_labor_cost,
          COALESCE(
            (SELECT SUM(bel.quantity_executed) FROM budget_execution_logs bel
             JOIN items i ON i.id = bel.item_id
             JOIN stages s ON s.id = i.stage_id
             JOIN budgets b ON b.id = s.budget_id
             WHERE b.project_id = p.id AND b.is_active = true),
            0
          ) AS total_units_executed,
          CASE
            WHEN COALESCE(SUM(wp.amount), 0) > 0
            THEN COALESCE(
              (SELECT SUM(bel.quantity_executed) FROM budget_execution_logs bel
               JOIN items i ON i.id = bel.item_id
               JOIN stages s ON s.id = i.stage_id
               JOIN budgets b ON b.id = s.budget_id
               WHERE b.project_id = p.id AND b.is_active = true),
              0
            ) / (SUM(wp.amount) / 1000000)
            ELSE 0
          END AS productivity_index,
          NOW() AS calculated_at
        FROM projects p
        LEFT JOIN worker_assignments wa ON wa.project_id = p.id AND wa.company_id = $1
        LEFT JOIN worker_payments wp ON wp.project_id = p.id AND wp.company_id = $1
        WHERE p.company_id = $1 AND p.status IN ('in_progress', 'approved')
        GROUP BY p.id, p.name
        ORDER BY p.name ASC
      `;
      return await this.dataSource.query(query, [companyId]);
    } catch {
      return [];
    }
  }

  /**
   * Compliance Summary — Estado documental de subcontratistas por empresa.
   * Resume cuántos subcontratos están al día vs bloqueados.
   */
  async getComplianceSummary(companyId: string): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) AS total_subcontractors,
          COUNT(*) FILTER (WHERE compliance_status = 'compliant') AS compliant,
          COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') AS non_compliant,
          COUNT(*) FILTER (WHERE compliance_status = 'pending_review') AS pending_review,
          CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(*) FILTER (WHERE compliance_status = 'compliant')::decimal / COUNT(*) * 100)
            ELSE 0
          END AS compliance_rate_percent,
          NOW() AS calculated_at
        FROM subcontractors
        WHERE company_id = $1
      `;
      const results = await this.dataSource.query(query, [companyId]);
      return results.length > 0
        ? results[0]
        : {
            total_subcontractors: 0,
            compliant: 0,
            non_compliant: 0,
            pending_review: 0,
            compliance_rate_percent: 0,
            calculated_at: new Date(),
          };
    } catch {
      return {
        total_subcontractors: 0,
        compliant: 0,
        non_compliant: 0,
        pending_review: 0,
        compliance_rate_percent: 0,
        calculated_at: new Date(),
      };
    }
  }
}
