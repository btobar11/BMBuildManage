import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectPayment } from './project-payment.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectPayment)
    private readonly paymentsRepository: Repository<ProjectPayment>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return await this.projectRepository.save(project);
  }

  async findAll(companyId: string): Promise<Project[]> {
    const projects = await this.projectRepository.find({
      where: { company_id: companyId },
      relations: ['budgets'],
      order: { created_at: 'DESC' },
    });

    // Patch projects with latest budget data for the dashboard to ensure consistency
    return projects.map((p) => {
      if (p.budgets && p.budgets.length > 0) {
        // Sort by version (highest first) to find the latest
        const sortedBudgets = [...p.budgets].sort(
          (a, b) => (b.version || 0) - (a.version || 0),
        );
        const latestBudget = sortedBudgets[0];
        // Ensure estimated_budget on the project record reflects the latest budget price
        p.estimated_budget = Number(latestBudget.total_estimated_price) || 0;
      }
      return p;
    });
  }

  async findOne(id: string, companyId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['budgets', 'expenses', 'documents'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(
    id: string,
    companyId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id, companyId);
    this.projectRepository.merge(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, company_id: string): Promise<{ deleted: boolean }> {
    const project = await this.findOne(id, company_id);
    await this.projectRepository.remove(project);
    return { deleted: true };
  }

  async bulkRemove(
    ids: string[],
    company_id: string,
  ): Promise<{ deleted: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete project-level dependencies that don't depend on structural elements
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('project_contingencies')
        .where('project_id IN (:...ids)', { ids })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('worker_assignments')
        .where('project_id IN (:...ids)', { ids })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('project_payments')
        .where('project_id IN (:...ids)', { ids })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('documents')
        .where('project_id IN (:...ids)', { ids })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('invoices')
        .where('project_id IN (:...ids)', { ids })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('expenses')
        .where('project_id IN (:...ids)', { ids })
        .execute();

      // 2. Get budgets, then stages, then items to handle item-level dependencies
      const budgets = await queryRunner.manager
        .getRepository(Budget)
        .find({ where: { project_id: In(ids) } });
      const budgetIds = budgets.map((b) => b.id);

      if (budgetIds.length > 0) {
        const stages = await queryRunner.manager
          .getRepository(Stage)
          .find({ where: { budget_id: In(budgetIds) } });
        const stageIds = stages.map((s) => s.id);

        if (stageIds.length > 0) {
          // Delete item-level dependencies (Budget execution logs and Resource consumption)
          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from('budget_execution_logs')
            .where(
              'budget_item_id IN (SELECT id FROM items WHERE stage_id IN (:...stageIds))',
              { stageIds },
            )
            .execute();
          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from('resource_consumption')
            .where('project_id IN (:...ids)', { ids })
            .execute();

          // Delete Items
          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from('items')
            .where('stage_id IN (:...stageIds)', { stageIds })
            .execute();
        }

        // Delete Stages
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from('stages')
          .where('budget_id IN (:...budgetIds)', { budgetIds })
          .execute();
      }

      // 3. Delete structural entities
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('budgets')
        .where('project_id IN (:...ids)', { ids })
        .execute();

      // 4. Finally delete the projects
      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Project)
        .where('id IN (:...ids) AND company_id = :company_id', {
          ids,
          company_id,
        })
        .execute();

      await queryRunner.commitTransaction();
      return { deleted: result.affected || 0 };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkUpdateFolder(
    ids: string[],
    folder: string | null,
    company_id: string,
  ): Promise<{ updated: number }> {
    const result = await this.projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({ folder: folder ?? undefined })
      .where('id IN (:...ids) AND company_id = :company_id', {
        ids,
        company_id,
      })
      .execute();
    return { updated: result.affected || 0 };
  }

  // Payments management
  async addPayment(projectId: string, companyId: string, data: any) {
    const project = await this.findOne(projectId, companyId);
    const payment = this.paymentsRepository.create({
      ...data,
      project_id: project.id,
    });
    return this.paymentsRepository.save(payment);
  }

  async findPayments(projectId: string, companyId: string) {
    const project = await this.findOne(projectId, companyId);
    return this.paymentsRepository.find({
      where: { project_id: project.id },
      order: { date: 'DESC' },
    });
  }

  async removePayment(paymentId: string, companyId: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['project'],
    });

    if (!payment || payment.project.company_id !== companyId) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    return this.paymentsRepository.remove(payment);
  }
}
