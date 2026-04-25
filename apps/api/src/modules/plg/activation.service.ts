import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivationStatus } from './entities/activation-status.entity';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Item } from '../items/item.entity';
import { Expense } from '../expenses/expense.entity';

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    @InjectRepository(ActivationStatus)
    private readonly activationRepo: Repository<ActivationStatus>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  /**
   * Calculate and update the activation score for a company.
   * Based on usage milestones that indicate a user has found core value.
   */
  async calculateActivation(companyId: string): Promise<ActivationStatus> {
    try {
      const projectsCount = await this.projectRepo.count({
        where: { company_id: companyId },
      });

      const budgetsCount = await this.budgetRepo
        .createQueryBuilder('budget')
        .innerJoin('budget.project', 'project')
        .where('project.company_id = :companyId', { companyId })
        .getCount();

      const itemsCount = await this.itemRepo
        .createQueryBuilder('item')
        .innerJoin('item.stage', 'stage')
        .innerJoin('stage.budget', 'budget')
        .innerJoin('budget.project', 'project')
        .where('project.company_id = :companyId', { companyId })
        .getCount();

      const expensesCount = await this.expenseRepo.count({
        where: { company_id: companyId },
      });

      let score = 0;
      if (projectsCount > 0) score += 25;
      if (budgetsCount > 0) score += 25;
      if (itemsCount >= 3) score += 25;
      if (expensesCount >= 1) score += 25;

      let status = await this.activationRepo.findOne({
        where: { company_id: companyId },
      });

      if (!status) {
        status = this.activationRepo.create({ company_id: companyId });
      }

      status.activation_score = score;
      status.last_calculated = new Date();

      if (score === 100 && !status.is_activated) {
        status.is_activated = true;
        status.activated_at = new Date();
        this.logger.log(`Company ${companyId} achieved full activation!`);
      }

      return await this.activationRepo.save(status);
    } catch (error) {
      this.logger.error(
        `Failed to calculate activation for ${companyId}`,
        error.stack,
      );
      throw error;
    }
  }

  async getStatus(companyId: string): Promise<ActivationStatus | null> {
    return this.activationRepo.findOne({ where: { company_id: companyId } });
  }
}
