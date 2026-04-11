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
}
