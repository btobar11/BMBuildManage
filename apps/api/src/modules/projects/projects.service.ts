import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectPayment)
    private readonly paymentsRepository: Repository<ProjectPayment>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      const project = this.projectRepository.create(createProjectDto);
      return await this.projectRepository.save(project);
    } catch (error) {
      // Handle specific database errors
      if (error.code === '23502') {
        // NOT NULL violation
        throw new BadRequestException(
          `Campo requerido faltante: ${error.column || 'campo desconocido'}`,
        );
      }
      if (error.code === '23505') {
        // UNIQUE violation
        throw new BadRequestException('Ya existe un proyecto con estos datos.');
      }
      if (error.code === '22P01') {
        // Data type mismatch
        throw new BadRequestException(
          'El formato de los datos ingresados es inválido.',
        );
      }
      if (error.code === '42804') {
        // Data type mismatch (explicit)
        throw new BadRequestException(
          'El tipo de dato no corresponde al esperado.',
        );
      }

      // Generic error with message
      throw new InternalServerErrorException(
        `Error al crear proyecto: ${error.message}`,
      );
    }
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

  private async safeDelete(
    queryRunner: any,
    tableName: string,
    where: string,
    parameters: any,
  ) {
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(tableName)
        .where(where, parameters)
        .execute();
    } catch (error) {
      this.logger.warn(
        `Could not delete from table ${tableName} (it might not exist): ${error.message}`,
      );
    }
  }

  async remove(id: string, company_id: string): Promise<{ deleted: boolean }> {
    const project = await this.findOne(id, company_id);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get all budget IDs for this project
      const budgets = await queryRunner.manager
        .getRepository(Budget)
        .find({ where: { project_id: id } });
      const budgetIds = budgets.map((b) => b.id);

      if (budgetIds.length > 0) {
        // Get all stage IDs
        const stages = await queryRunner.manager
          .getRepository(Stage)
          .find({ where: { budget_id: In(budgetIds) } });
        const stageIds = stages.map((s) => s.id);

        if (stageIds.length > 0) {
          // Delete item-level dependencies
          await this.safeDelete(
            queryRunner,
            'budget_execution_log',
            'budget_item_id IN (SELECT id FROM items WHERE stage_id IN (:...stageIds))',
            { stageIds },
          );

          await this.safeDelete(
            queryRunner,
            'resource_consumption',
            'project_id = :id',
            { id },
          );

          await this.safeDelete(
            queryRunner,
            'items',
            'stage_id IN (:...stageIds)',
            { stageIds },
          );
        }

        await this.safeDelete(
          queryRunner,
          'stages',
          'budget_id IN (:...budgetIds)',
          { budgetIds },
        );
      }

      // 2. Delete structural project-level dependencies
      await this.safeDelete(queryRunner, 'budgets', 'project_id = :id', { id });
      await this.safeDelete(
        queryRunner,
        'project_contingencies',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'worker_assignments',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'project_payments',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(queryRunner, 'documents', 'project_id = :id', {
        id,
      });
      await this.safeDelete(queryRunner, 'invoices', 'project_id = :id', { id });
      await this.safeDelete(queryRunner, 'expenses', 'project_id = :id', { id });
      await this.safeDelete(
        queryRunner,
        'worker_payments',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'receipt_items',
        'purchase_order_item_id IN (SELECT id FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id = :id))',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_order_receipts',
        'purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_order_items',
        'purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_orders',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_payments',
        'contract_id IN (SELECT id FROM subcontractor_contracts WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_ram',
        'contract_id IN (SELECT id FROM subcontractor_contracts WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_contracts',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_clashes',
        'job_id IN (SELECT id FROM bim_clash_jobs WHERE model_a_id IN (SELECT id FROM project_models WHERE project_id = :id))',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_clash_jobs',
        'model_a_id IN (SELECT id FROM project_models WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_properties',
        'element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id = :id))',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_state_history',
        'element_state_id IN (SELECT id FROM bim_element_states WHERE element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id = :id)))',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_element_states',
        'element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id = :id))',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_elements',
        'model_id IN (SELECT id FROM project_models WHERE project_id = :id)',
        { id },
      );
      await this.safeDelete(queryRunner, 'bim_models', 'project_id = :id', {
        id,
      });
      await this.safeDelete(queryRunner, 'project_models', 'project_id = :id', {
        id,
      });
      await this.safeDelete(
        queryRunner,
        'subcontractor_rams',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(queryRunner, 'bim_apu_links', 'project_id = :id', {
        id,
      });
      await this.safeDelete(queryRunner, 'schedule_tasks', 'project_id = :id', {
        id,
      });
      await this.safeDelete(
        queryRunner,
        'schedule_milestones',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'schedule_resources',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_schedule_elements',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(
        queryRunner,
        'bim_4d_snapshots',
        'project_id = :id',
        { id },
      );
      await this.safeDelete(queryRunner, 'punch_items', 'project_id = :id', {
        id,
      });
      await this.safeDelete(queryRunner, 'submittals', 'project_id = :id', {
        id,
      });
      await this.safeDelete(queryRunner, 'rfis', 'project_id = :id', { id });
      await this.safeDelete(queryRunner, 'audit_logs', 'project_id = :id', {
        id,
      });

      await queryRunner.manager.remove(project);
      await queryRunner.commitTransaction();
      return { deleted: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkRemove(
    ids: string[],
    company_id: string,
  ): Promise<{ deleted: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete project-level dependencies
      await this.safeDelete(
        queryRunner,
        'bim_clashes',
        'job_id IN (SELECT id FROM bim_clash_jobs WHERE model_a_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids)))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_clash_jobs',
        'model_a_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_properties',
        'element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids)))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_state_history',
        'element_state_id IN (SELECT id FROM bim_element_states WHERE element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids))))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_element_states',
        'element_id IN (SELECT id FROM bim_elements WHERE model_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids)))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_elements',
        'model_id IN (SELECT id FROM project_models WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(queryRunner, 'bim_models', 'project_id IN (:...ids)', {
        ids,
      });
      await this.safeDelete(
        queryRunner,
        'project_models',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_rams',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'project_contingencies',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'worker_assignments',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'project_payments',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'documents',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'invoices',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'receipt_items',
        'purchase_order_item_id IN (SELECT id FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id IN (:...ids)))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_order_receipts',
        'purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_order_items',
        'purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'purchase_orders',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_payments',
        'contract_id IN (SELECT id FROM subcontractor_contracts WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_ram',
        'contract_id IN (SELECT id FROM subcontractor_contracts WHERE project_id IN (:...ids))',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'subcontractor_contracts',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_apu_links',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'schedule_tasks',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'schedule_milestones',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'schedule_resources',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_schedule_elements',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'bim_4d_snapshots',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'punch_items',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(
        queryRunner,
        'submittals',
        'project_id IN (:...ids)',
        { ids },
      );
      await this.safeDelete(queryRunner, 'rfis', 'project_id IN (:...ids)', {
        ids,
      });
      await this.safeDelete(
        queryRunner,
        'audit_logs',
        'project_id IN (:...ids)',
        { ids },
      );

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
          await this.safeDelete(
            queryRunner,
            'budget_execution_log',
            'budget_item_id IN (SELECT id FROM items WHERE stage_id IN (:...stageIds))',
            { stageIds },
          );
          await this.safeDelete(
            queryRunner,
            'resource_consumption',
            'project_id IN (:...ids)',
            { ids },
          );
          await this.safeDelete(
            queryRunner,
            'items',
            'stage_id IN (:...stageIds)',
            { stageIds },
          );
        }

        await this.safeDelete(
          queryRunner,
          'stages',
          'budget_id IN (:...budgetIds)',
          { budgetIds },
        );
      }

      await this.safeDelete(queryRunner, 'budgets', 'project_id IN (:...ids)', {
        ids,
      });

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
