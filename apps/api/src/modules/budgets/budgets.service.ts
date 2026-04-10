import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, OptimisticLockVersionMismatchError } from 'typeorm';
import { Budget, BudgetStatus } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

import { FinancialService } from './financial.service';
import { Project } from '../projects/project.entity';
import { BusinessRulesService } from './business-rules.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly financialService: FinancialService,
    private readonly businessRulesService: BusinessRulesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createBudgetDto: CreateBudgetDto,
    userId?: string,
  ): Promise<Budget> {
    const budget = this.budgetRepository.create(
      createBudgetDto as any,
    ) as unknown as Budget;
    const saved = await this.budgetRepository.save(budget);

    // Auto-set as active if it's the first one
    const count = await this.budgetRepository.count({
      where: { project_id: saved.project_id },
    });
    if (count === 1) {
      await this.budgetRepository.update(saved.id, { is_active: true });
      saved.is_active = true;
    }

    return saved;
  }

  findAllByProject(projectId: string) {
    return this.budgetRepository.find({
      where: { project_id: projectId },
      relations: ['stages', 'stages.items'],
      order: { version: 'DESC' },
    });
  }

  async getActiveVersion(projectId: string) {
    return this.budgetRepository.findOne({
      where: { project_id: projectId, is_active: true },
      relations: ['stages', 'stages.items'],
    });
  }

  async findOne(id: string, companyId?: string) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['stages', 'stages.items', 'project', 'project.company'],
    });
    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }

    // Security: Verify budget belongs to user's company
    if (companyId && budget.project?.company_id !== companyId) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }

    return budget;
  }

  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    userId?: string,
    companyId?: string,
  ) {
    const budget = await this.findOne(id, companyId);

    // Update scalar budget fields
    const { stages, ...scalarFields } = updateBudgetDto as any;
    this.budgetRepository.merge(budget, scalarFields);

    if (stages !== undefined) {
      // Build properly typed Stage + Item objects with FK set so TypeORM
      // can upsert existing rows and delete omitted ones via cascade.
      budget.stages = (stages as any[]).map((s) => {
        const stageEntity = this.stageRepository.create({
          ...(s.id ? { id: s.id } : {}),
          budget_id: id,
          name: s.name,
          position: s.position ?? 0,
        });
        stageEntity.items = (s.items ?? []).map((i: any) => {
          return this.itemRepository.create({
            ...(i.id ? { id: i.id } : {}),
            // stage_id will be filled by TypeORM after stage is saved
            name: i.name,
            unit: i.unit,
            quantity: Number(i.quantity) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            unit_price: Number(i.unit_price) || 0,
            position: Number(i.position) || 0,
            apu_template_id: i.apu_template_id ?? null,
            cubication_mode: i.cubication_mode ?? 'manual',
            dim_length:
              i.dim_length !== undefined ? Number(i.dim_length) : null,
            dim_width: i.dim_width !== undefined ? Number(i.dim_width) : null,
            dim_height:
              i.dim_height !== undefined ? Number(i.dim_height) : null,
            dim_thickness:
              i.dim_thickness !== undefined ? Number(i.dim_thickness) : null,
            formula: i.formula ?? null,
            geometry_data: i.geometry_data ?? null,
            quantity_executed: Number(i.quantity_executed) || 0,
          } as any);
        });
        return stageEntity;
      });
    }

    // 5. RECALCULATE financial totals (Backend Source of Truth)
    await this.financialService.calculateBudgetTotals(budget);

    // 5.b VALIDATE Business Rules (Phase 3)
    const warnings = await this.businessRulesService.validateBudget(budget);

    try {
      const savedBudget = await this.budgetRepository.save(budget);

      // 6. SYNC project totals if this is the active budget
      if (budget.is_active) {
        await this.projectRepository.update(budget.project_id, {
          estimated_budget: budget.total_estimated_price,
          estimated_price: budget.total_estimated_price,
        });
      }

      return {
        ...savedBudget,
        warnings,
      };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'El presupuesto ha sido modificado por otro usuario. Por favor, recargue la página para ver los cambios más recientes.',
        );
      }
      throw error;
    }
  }

  async setActiveVersion(id: string, userId?: string, companyId?: string) {
    const budget = await this.findOne(id, companyId);

    // Deactivate others for the same project
    await this.budgetRepository.update(
      { project_id: budget.project_id },
      { is_active: false },
    );

    // Activate this one
    budget.is_active = true;
    const saved = await this.budgetRepository.save(budget);

    // Sync project
    await this.projectRepository.update(budget.project_id, {
      estimated_budget: budget.total_estimated_price,
      estimated_price: budget.total_estimated_price,
    });

    return saved;
  }

  getSummary(projectId: string, companyId?: string) {
    return this.financialService.getProjectSummary(projectId, companyId);
  }

  async createRevision(id: string, userId?: string, companyId?: string) {
    const original = await this.budgetRepository.findOne({
      where: { id },
      relations: ['stages', 'stages.items'],
    });

    if (!original) throw new NotFoundException('Budget not found');

    // Create deep copy
    const newBudget = this.budgetRepository.create({
      project_id: original.project_id,
      version: (original.version || 1) + 1,
      status: BudgetStatus.DRAFT,
      is_active: false, // New revisions start as draft/inactive
      total_estimated_cost: original.total_estimated_cost,
      total_estimated_price: original.total_estimated_price,
      professional_fee_percentage: original.professional_fee_percentage,
      estimated_utility: original.estimated_utility,
      notes: `Revisión de presupuesto ${original.id} (copia)`,
      stages: original.stages.map((s) => ({
        name: s.name,
        position: s.position,
        total_cost: s.total_cost,
        total_price: s.total_price,
        items: s.items.map((i) => ({
          name: i.name,
          type: i.type,
          unit: i.unit,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          unit_price: i.unit_price,
          position: i.position,
          apu_template_id: i.apu_template_id,
          cubication_mode: i.cubication_mode,
          dim_length: i.dim_length,
          dim_width: i.dim_width,
          dim_height: i.dim_height,
          dim_thickness: i.dim_thickness,
          formula: i.formula,
          geometry_data: i.geometry_data,
        })),
      })),
    } as any) as unknown as Budget;

    const saved = await this.budgetRepository.save(newBudget);

    return saved;
  }

  async remove(id: string) {
    const budget = await this.findOne(id);
    await this.budgetRepository.remove(budget);
    return { deleted: true };
  }

  async bulkCreateItems(
    budgetId: string,
    items: Array<{
      stage_id: string;
      name: string;
      quantity: number;
      unit: string;
      unit_cost: number;
      unit_price: number;
      position: number;
    }>,
  ) {
    const budget = await this.findOne(budgetId);

    const newItems = items.map((item) => {
      const newItem = new Item();
      newItem.stage_id = item.stage_id;
      newItem.name = item.name;
      newItem.quantity = item.quantity;
      newItem.unit = item.unit;
      newItem.unit_cost = item.unit_cost;
      newItem.unit_price = item.unit_price;
      newItem.position = item.position;
      return newItem;
    });

    const savedItems = await this.itemRepository.save(newItems);

    await this.financialService.calculateBudgetTotals(budget);

    return { created: savedItems.length, items: savedItems };
  }
}
