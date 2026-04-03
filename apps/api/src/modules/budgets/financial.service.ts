import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { Expense } from '../expenses/expense.entity';
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(WorkerAssignment)
    private readonly workerAssignmentRepository: Repository<WorkerAssignment>,
    @InjectRepository(ProjectContingency)
    private readonly contingencyRepository: Repository<ProjectContingency>,
  ) {}

  /**
   * Sums all expenses for a project.
   */
  async getTotalExpenses(projectId: string): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.project_id = :projectId', { projectId })
      .select('SUM(expense.amount)', 'total')
      .getRawOne();
    return Number(result?.total || 0);
  }

  /**
   * Sums all worker payments for a project.
   */
  async getTotalWorkerPayments(projectId: string): Promise<number> {
    const result = await this.workerAssignmentRepository
      .createQueryBuilder('wa')
      .where('wa.project_id = :projectId', { projectId })
      .select('SUM(wa.total_paid)', 'total')
      .getRawOne();
    return Number(result?.total || 0);
  }

  /**
   * Sums all active contingencies for a project.
   */
  async getTotalContingencies(projectId: string): Promise<number> {
    const result = await this.contingencyRepository
      .createQueryBuilder('contingency')
      .where('contingency.project_id = :projectId', { projectId })
      .select('SUM(contingency.total_cost)', 'total')
      .getRawOne();
    return Number(result?.total || 0);
  }

  /**
   * Gets a complete financial summary for a project.
   */
  async getProjectSummary(projectId: string) {
    // 1. Get current approved budget (or most recent)
    const budget = await this.budgetRepository.findOne({
      where: { project_id: projectId },
      order: { created_at: 'DESC' }, // Pick the newest revision
    });

    const [realExpenses, workerPayments, contingenciesTotal] = await Promise.all([
      this.getTotalExpenses(projectId),
      this.getTotalWorkerPayments(projectId),
      this.getTotalContingencies(projectId),
    ]);

    const estimatedCost = Number(budget?.total_estimated_cost || 0);
    const estimatedPrice = Number(budget?.total_estimated_price || 0);
    const totalRealCost = realExpenses + workerPayments + contingenciesTotal;

    // Formulas
    const estimatedMargin = estimatedPrice > 0 
      ? ((estimatedPrice - estimatedCost) / estimatedPrice) * 100 
      : 0;

    const realMargin = estimatedPrice > 0 
      ? ((estimatedPrice - totalRealCost) / estimatedPrice) * 100 
      : 0;

    const variance = estimatedCost - totalRealCost; // positive = under budget, negative = over budget

    return {
      projectId,
      budgetId: budget?.id,
      version: budget?.version,
      financials: {
        estimatedCost,
        estimatedPrice,
        estimatedMargin,
        realExpenses,
        workerPayments,
        contingenciesTotal,
        totalRealCost,
        realMargin,
        variance,
      }
    };
  }

  /**
   * Internal helper to recalculate budget totals after items change.
   */
  async calculateBudgetTotals(budget: Budget): Promise<Budget> {
    let totalEstimatedCost = 0;
    let totalEstimatedPrice = 0;

    if (budget.stages) {
      for (const stage of budget.stages) {
        let stageCost = 0;
        let stagePrice = 0;
        if (stage.items) {
          for (const item of stage.items) {
            // Re-enforce entity calculation just in case
            item.total_cost = Number(item.quantity) * Number(item.unit_cost);
            item.total_price = Number(item.quantity) * Number(item.unit_price);
            stageCost += item.total_cost;
            stagePrice += item.total_price;
          }
        }
        stage.total_cost = stageCost;
        stage.total_price = stagePrice;
        totalEstimatedCost += stageCost;
        totalEstimatedPrice += stagePrice;
      }
    }

    budget.total_estimated_cost = totalEstimatedCost;
    budget.total_estimated_price = totalEstimatedPrice;

    return budget;
  }
}
