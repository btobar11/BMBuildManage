import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  OptimisticLockVersionMismatchError,
  DeepPartial,
} from 'typeorm';
import { Budget, BudgetStatus } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item, CubicationMode } from '../items/item.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FinancialService } from './financial.service';
import { Project } from '../projects/project.entity';
import { BusinessRulesService } from './business-rules.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

// ─── Domain error codes ────────────────────────────────────────────────────
// These codes are part of the public API contract with the frontend.
// The frontend matches on these codes, not on message strings.
export const BudgetErrorCodes = {
  NOT_FOUND: 'BUDGET_NOT_FOUND',
  FORBIDDEN: 'BUDGET_FORBIDDEN',
  CONFLICT: 'BUDGET_CONFLICT',
  BULK_VALIDATION: 'BULK_VALIDATION_ERROR',
  BULK_TOO_LARGE: 'BULK_TOO_LARGE',
  BULK_EMPTY: 'BULK_EMPTY_PAYLOAD',
  RPC_ERROR: 'BULK_RPC_ERROR',
} as const;

// ─── Typed interfaces ──────────────────────────────────────────────────────

interface BulkImportItem {
  stage_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  unit_price: number;
  position: number;
}

export interface BulkImportResult {
  inserted_count: number;
  failed_count: number;
  first_error: string | null;
}

// ─── Service ───────────────────────────────────────────────────────────────

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly financialService: FinancialService,
    private readonly businessRulesService: BusinessRulesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(
    createBudgetDto: CreateBudgetDto,
    userId?: string,
    companyId?: string,
  ): Promise<Budget> {
    const project = await this.projectRepository.findOne({
      where: { id: createBudgetDto.project_id },
      relations: ['company'],
    });
    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: `Project ${createBudgetDto.project_id} not found`,
      });
    }
    const company_id = companyId || project.company_id;
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      company_id,
      code: createBudgetDto.code || this.generateBudgetCode(project),
    } as Parameters<typeof this.budgetRepository.create>[0]);
    const saved = await this.budgetRepository.save(budget);

    const count = await this.budgetRepository.count({
      where: { project_id: saved.project_id },
    });
    if (count === 1) {
      await this.budgetRepository.update(saved.id, { is_active: true });
      saved.is_active = true;
    }

    return saved;
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  findAllByProject(projectId: string, companyId?: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { project_id: projectId, company_id: companyId },
      relations: ['stages', 'stages.items'],
      order: { version: 'DESC' },
    });
  }

  async getActiveVersion(projectId: string): Promise<Budget | null> {
    return this.budgetRepository.findOne({
      where: { project_id: projectId, is_active: true },
      relations: ['stages', 'stages.items'],
    });
  }

  async findOne(id: string, companyId?: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['stages', 'stages.items', 'project', 'project.company', 'project.client'],
    });

    if (!budget) {
      throw new NotFoundException({
        code: BudgetErrorCodes.NOT_FOUND,
        message: `Budget ${id} not found`,
      });
    }

    if (companyId && budget.project?.company_id !== companyId) {
      // Return same 404 to avoid resource enumeration
      throw new NotFoundException({
        code: BudgetErrorCodes.NOT_FOUND,
        message: `Budget ${id} not found`,
      });
    }

    return budget;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    userId?: string,
    companyId?: string,
  ): Promise<Budget & { warnings: string[] }> {
    const budget = await this.findOne(id, companyId);
    const company_id = companyId || budget.company_id;

    const { stages, ...scalarFields } = updateBudgetDto as UpdateBudgetDto & {
      stages?: Array<{
        id?: string;
        name: string;
        position?: number;
        items?: Array<{
          id?: string;
          name: string;
          unit?: string;
          quantity: number;
          unit_cost: number;
          unit_price: number;
          position?: number;
          apu_template_id?: string;
          cubication_mode?: string;
          dim_length?: number;
          dim_width?: number;
          dim_height?: number;
          dim_thickness?: number;
          formula?: string;
          geometry_data?: string;
          quantity_executed?: number;
          is_price_overridden?: boolean;
          item_type?: string;
          markup_percentage?: number;
          ifc_global_id?: string;
        }>;
      }>;
    };

    this.budgetRepository.merge(budget, scalarFields);

    if (stages !== undefined) {
      budget.stages = stages.map((s) => {
        const stageEntity = this.stageRepository.create({
          ...(s.id ? { id: s.id } : {}),
          budget_id: id,
          company_id,
          name: s.name,
          position: s.position ?? 0,
        });
        stageEntity.items = (s.items ?? []).map((i) => {
          return this.itemRepository.create({
            ...(i.id ? { id: i.id } : {}),
            company_id,
            name: i.name,
            unit: i.unit,
            quantity: Number(i.quantity) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            unit_price: Number(i.unit_price) || 0,
            position: Number(i.position) || 0,
            apu_template_id: i.apu_template_id ?? null,
            cubication_mode:
              (i.cubication_mode as CubicationMode) ?? CubicationMode.MANUAL,
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
          } as DeepPartial<Item>);
        });
        return stageEntity;
      });
    }

    await this.financialService.calculateBudgetTotals(budget);
    const warnings = await this.businessRulesService.validateBudget(budget);

    try {
      const savedBudget = await this.budgetRepository.save(budget);

      if (budget.is_active) {
        await this.projectRepository.update(budget.project_id, {
          estimated_budget: budget.total_estimated_price,
          estimated_price: budget.total_estimated_price,
        });
      }

      return { ...savedBudget, warnings };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException({
          code: BudgetErrorCodes.CONFLICT,
          message:
            'El presupuesto fue modificado por otro usuario. Recargue para ver los cambios.',
        });
      }
      throw error;
    }
  }

  // ─── SET ACTIVE VERSION ───────────────────────────────────────────────────

  async setActiveVersion(
    id: string,
    userId?: string,
    companyId?: string,
  ): Promise<Budget> {
    const budget = await this.findOne(id, companyId);

    await this.budgetRepository.update(
      { project_id: budget.project_id },
      { is_active: false },
    );

    budget.is_active = true;
    const saved = await this.budgetRepository.save(budget);

    await this.projectRepository.update(budget.project_id, {
      estimated_budget: budget.total_estimated_price,
      estimated_price: budget.total_estimated_price,
    });

    return saved;
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  getSummary(
    projectId: string,
    companyId?: string,
  ): ReturnType<FinancialService['getProjectSummary']> {
    return this.financialService.getProjectSummary(projectId, companyId);
  }

  // ─── CREATE REVISION ──────────────────────────────────────────────────────

  async createRevision(
    id: string,
    userId?: string,
    companyId?: string,
  ): Promise<Budget> {
    const original = await this.budgetRepository.findOne({
      where: { id },
      relations: ['stages', 'stages.items'],
    });

    if (!original) {
      throw new NotFoundException({
        code: BudgetErrorCodes.NOT_FOUND,
        message: 'Budget not found',
      });
    }

    if (companyId) {
      const proj = await this.projectRepository.findOne({
        where: { id: original.project_id },
      });
      if (!proj || proj.company_id !== companyId) {
        throw new ForbiddenException({
          code: BudgetErrorCodes.FORBIDDEN,
          message: 'Access denied',
        });
      }
    }

    const newBudget = this.budgetRepository.create({
      project_id: original.project_id,
      company_id: original.company_id,
      status: BudgetStatus.DRAFT,
      code: original.code ? `${original.code}-REV` : null, // Indicate it's a revision if code exists
      is_active: false,
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
        company_id: original.company_id,
        items: s.items.map((i) => ({
          name: i.name,
          type: i.type,
          unit: i.unit,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          unit_price: i.unit_price,
          position: i.position,
          company_id: original.company_id,
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
    } as Parameters<typeof this.budgetRepository.create>[0]);

    return this.budgetRepository.save(newBudget);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ deleted: boolean }> {
    const budget = await this.findOne(id);
    await this.budgetRepository.remove(budget);
    return { deleted: true };
  }

  // ─── BULK IMPORT — ATOMIC VIA POSTGRES RPC ────────────────────────────────
  //
  // Strategy: delegate to the `bulk_import_budget_items` PG function which
  // runs the entire insert inside a single BEGIN/COMMIT block.
  // If ANY row fails a constraint, Postgres rolls back everything — no orphans.
  //
  // Fallback: if the RPC is not deployed yet, falls back to TypeORM transaction.

  async bulkCreateItems(
    budgetId: string,
    items: BulkImportItem[],
    companyId?: string,
  ): Promise<BulkImportResult> {
    if (items.length === 0) {
      throw new BadRequestException({
        code: BudgetErrorCodes.BULK_EMPTY,
        message: 'items array cannot be empty',
      });
    }

    if (items.length > 2000) {
      throw new BadRequestException({
        code: BudgetErrorCodes.BULK_TOO_LARGE,
        message: `Cannot import more than 2000 items per request. Got ${items.length}.`,
      });
    }

    // ── Attempt RPC (preferred — atomic at DB level) ──────────────────────
    if (companyId) {
      try {
        const result = await this.dataSource.query<BulkImportResult[]>(
          `SELECT * FROM bulk_import_budget_items($1::UUID, $2::UUID, $3::JSONB)`,
          [budgetId, companyId, JSON.stringify(items)],
        );
        return result[0];
      } catch (err: unknown) {
        const pgError = err as { code?: string; message?: string };

        // Known RPC validation errors → surface to client
        if (
          pgError.code === '23514' ||
          pgError.code === 'P0002' ||
          pgError.code === 'P0003' ||
          pgError.code === 'P0004' ||
          pgError.code === 'P0005' ||
          pgError.code === '23503'
        ) {
          throw new BadRequestException({
            code: BudgetErrorCodes.BULK_VALIDATION,
            message: pgError.message ?? 'Validation error in import data',
          });
        }

        // RPC not deployed → fall through to TypeORM fallback
        if (pgError.code === '42883') {
          // function does not exist
          return this.bulkCreateItemsFallback(budgetId, items);
        }

        throw new InternalServerErrorException({
          code: BudgetErrorCodes.RPC_ERROR,
          message: 'Database error during bulk import',
        });
      }
    }

    return this.bulkCreateItemsFallback(budgetId, items);
  }

  // ─── FALLBACK: TypeORM transaction (when RPC not deployed) ────────────────

  private async bulkCreateItemsFallback(
    budgetId: string,
    items: BulkImportItem[],
  ): Promise<BulkImportResult> {
    const budget = await this.findOne(budgetId);

    return this.dataSource.transaction(async (manager) => {
      const newItems = items.map((item) => {
        const entity = manager.create(Item, {
          stage_id: item.stage_id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          unit_price: item.unit_price,
          total_cost: item.quantity * item.unit_cost,
          total_price: item.quantity * item.unit_price,
          position: item.position,
          cubication_mode: CubicationMode.MANUAL,
        });
        return entity;
      });

      await manager.save(Item, newItems);

      // Recalculate totals inside the same transaction
      const totals = await manager
        .createQueryBuilder(Item, 'i')
        .innerJoin('i.stage', 's')
        .where('s.budget_id = :id', { id: budgetId })
        .select([
          'SUM(i.total_cost) as total_cost',
          'SUM(i.total_price) as total_price',
        ])
        .getRawOne<{ total_cost: string; total_price: string }>();

      await manager.update(Budget, budgetId, {
        total_estimated_cost: Number(totals?.total_cost ?? 0),
        total_estimated_price: Number(totals?.total_price ?? 0),
      });

      void budget; // suppress unused var lint
      return {
        inserted_count: newItems.length,
        failed_count: 0,
        first_error: null,
      };
    });
  }

  private generateBudgetCode(project: Project): string {
    const initials = (project.name || 'Budget')
      .split(' ')
      .filter((word) => word.length > 0)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.substring(1, 2).toLowerCase(),
      )
      .join('');

    const commune = (project.commune || 'GENERIC')
      .toUpperCase()
      .replace(/\s+/g, '');
    const year = new Date().getFullYear();

    return `${initials}-${commune}-${year}`;
  }
}
