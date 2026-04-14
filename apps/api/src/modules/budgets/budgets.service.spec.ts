import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Repository,
  OptimisticLockVersionMismatchError,
  DataSource,
} from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetStatus } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Project } from '../projects/project.entity';
import { FinancialService } from './financial.service';
import { BusinessRulesService } from './business-rules.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Factory para crear instancias de Budget con version inicial.
 * El campo version es crucial para optimistic locking en TypeORM.
 */
const createMockBudget = (overrides?: Partial<Budget>): Budget => {
  const base: Budget = {
    id: 'budget-1',
    project_id: 'project-1',
    version: 1, // Version inicial requerida por @VersionColumn()
    status: BudgetStatus.DRAFT,
    is_active: true,
    total_estimated_cost: 100000,
    total_estimated_price: 150000,
    professional_fee_percentage: 10,
    estimated_utility: 15000,
    markup_percentage: 20,
    notes: 'Test budget',
    rejection_reason: null,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    stages: [],
    project: { id: 'project-1', company_id: 'company-1' } as Project,
  };
  return { ...base, ...overrides } as Budget;
};

/**
 * Factory para crear DTOs de creacion con version.
 */
const createMockCreateDto = (
  overrides?: Partial<CreateBudgetDto>,
): CreateBudgetDto => ({
  project_id: 'project-1',
  version: 1,
  status: BudgetStatus.DRAFT,
  notes: 'Test budget',
  total_estimated_cost: 100000,
  total_estimated_price: 150000,
  professional_fee_percentage: 10,
  estimated_utility: 15000,
  markup_percentage: 20,
  ...overrides,
});

/**
 * Factory para crear DTOs de actualizacion.
 */
const createMockUpdateDto = (
  overrides?: Partial<UpdateBudgetDto>,
): UpdateBudgetDto => ({
  notes: 'Updated notes',
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────────────────────────────────────

const createBudgetRepositoryMock = () => {
  const mockSave = jest.fn();
  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockCreate = jest.fn();
  const mockMerge = jest.fn();
  const mockRemove = jest.fn();
  const mockCount = jest.fn();
  const mockUpdate = jest.fn();

  return {
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    findOne: mockFindOne,
    remove: mockRemove,
    merge: mockMerge,
    count: mockCount,
    update: mockUpdate,
    // Expose for spyOn
    _mockSave: mockSave,
    _mockFindOne: mockFindOne,
    _mockFind: mockFind,
    _mockCreate: mockCreate,
    _mockMerge: mockMerge,
    _mockRemove: mockRemove,
    _mockCount: mockCount,
    _mockUpdate: mockUpdate,
  };
};

const createStageRepositoryMock = () => {
  const mockCreate = jest
    .fn()
    .mockImplementation((data) => ({ ...data, items: [] }));
  const mockSave = jest.fn();
  return {
    create: mockCreate,
    save: mockSave,
    _mockCreate: mockCreate,
    _mockSave: mockSave,
  };
};

const createItemRepositoryMock = () => {
  const mockCreate = jest.fn().mockImplementation((data) => data);
  const mockSave = jest.fn().mockResolvedValue([]);
  return {
    create: mockCreate,
    save: mockSave,
    _mockCreate: mockCreate,
    _mockSave: mockSave,
  };
};

const createProjectRepositoryMock = () => {
  const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });
  const mockFindOne = jest.fn();
  return {
    update: mockUpdate,
    findOne: mockFindOne,
    _mockUpdate: mockUpdate,
    _mockFindOne: mockFindOne,
  };
};

const createFinancialServiceMock = () => ({
  calculateBudgetTotals: jest.fn().mockResolvedValue(undefined),
  getProjectSummary: jest
    .fn()
    .mockResolvedValue({ total: 100000, costs: 100000, prices: 150000 }),
  calculateStageTotals: jest.fn(),
  calculateItemTotals: jest.fn(),
});

const createBusinessRulesServiceMock = () => ({
  validateBudget: jest.fn().mockResolvedValue([]),
  validateStage: jest.fn().mockResolvedValue([]),
  validateItem: jest.fn().mockResolvedValue([]),
});

const createAuditLogsServiceMock = () => ({
  logEvent: jest.fn().mockResolvedValue({ id: 'log-1' }),
  findByEntity: jest.fn().mockResolvedValue([]),
});

const createDataSourceMock = () => {
  const mockQuery = jest
    .fn()
    .mockResolvedValue([
      { inserted_count: 1, failed_count: 0, first_error: null },
    ]);
  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    const mockManager = {
      create: jest.fn().mockImplementation((entity, data) => ({ ...data })),
      save: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ total_cost: '100000', total_price: '150000' }),
      }),
    };
    return callback(mockManager);
  });

  return {
    query: mockQuery,
    transaction: mockTransaction,
    _mockQuery: mockQuery,
    _mockTransaction: mockTransaction,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepo: ReturnType<typeof createBudgetRepositoryMock>;
  let stageRepo: ReturnType<typeof createStageRepositoryMock>;
  let itemRepo: ReturnType<typeof createItemRepositoryMock>;
  let projectRepo: ReturnType<typeof createProjectRepositoryMock>;
  let financialService: ReturnType<typeof createFinancialServiceMock>;
  let businessRulesService: ReturnType<typeof createBusinessRulesServiceMock>;
  let dataSource: ReturnType<typeof createDataSourceMock>;

  beforeEach(async () => {
    budgetRepo = createBudgetRepositoryMock();
    stageRepo = createStageRepositoryMock();
    itemRepo = createItemRepositoryMock();
    projectRepo = createProjectRepositoryMock();
    financialService = createFinancialServiceMock();
    businessRulesService = createBusinessRulesServiceMock();
    dataSource = createDataSourceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: budgetRepo,
        },
        {
          provide: getRepositoryToken(Stage),
          useValue: stageRepo,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: itemRepo,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: FinancialService,
          useValue: financialService,
        },
        {
          provide: BusinessRulesService,
          useValue: businessRulesService,
        },
        {
          provide: AuditLogsService,
          useValue: createAuditLogsServiceMock(),
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('create', () => {
    it('should create a budget with version field', async () => {
      const createDto = createMockCreateDto();
      const savedBudget = createMockBudget({ version: 1 });

      budgetRepo._mockCreate.mockReturnValue(savedBudget);
      budgetRepo._mockSave.mockResolvedValue(savedBudget);
      budgetRepo._mockCount.mockResolvedValue(1);
      budgetRepo._mockUpdate.mockResolvedValue({ affected: 1 });

      const result = await service.create(createDto);

      expect(budgetRepo._mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'project-1',
          version: 1,
        }),
      );
      expect(budgetRepo._mockSave).toHaveBeenCalledWith(savedBudget);
      expect(result).toEqual(savedBudget);
    });

    it('should auto-set first budget as active', async () => {
      const createDto = createMockCreateDto();
      const savedBudget = createMockBudget({ is_active: true });

      budgetRepo._mockCreate.mockReturnValue(savedBudget);
      budgetRepo._mockSave.mockResolvedValue({
        ...savedBudget,
        is_active: true,
      });
      budgetRepo._mockCount.mockResolvedValue(1);
      budgetRepo._mockUpdate.mockResolvedValue({ affected: 1 });

      await service.create(createDto);

      expect(budgetRepo._mockUpdate).toHaveBeenCalledWith(
        savedBudget.id,
        expect.objectContaining({ is_active: true }),
      );
    });

    it('should not auto-set active if not first budget', async () => {
      const createDto = createMockCreateDto();
      const savedBudget = createMockBudget();

      budgetRepo._mockCreate.mockReturnValue(savedBudget);
      budgetRepo._mockSave.mockResolvedValue(savedBudget);
      budgetRepo._mockCount.mockResolvedValue(2); // Already has budgets

      await service.create(createDto);

      // Should not call update for is_active
      expect(budgetRepo._mockUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READ Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('findAllByProject', () => {
    it('should return budgets ordered by version DESC', async () => {
      const budgets = [
        createMockBudget({ id: '1', version: 2 }),
        createMockBudget({ id: '2', version: 1 }),
      ];
      budgetRepo._mockFind.mockResolvedValue(budgets);

      const result = await service.findAllByProject('project-1');

      expect(budgetRepo._mockFind).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['stages', 'stages.items'],
        order: { version: 'DESC' },
      });
      expect(result).toEqual(budgets);
    });

    it('should return empty array when no budgets exist', async () => {
      budgetRepo._mockFind.mockResolvedValue([]);

      const result = await service.findAllByProject('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveVersion', () => {
    it('should return active budget with relations', async () => {
      const budget = createMockBudget({ is_active: true, version: 3 });
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      const result = await service.getActiveVersion('project-1');

      expect(budgetRepo._mockFindOne).toHaveBeenCalledWith({
        where: { project_id: 'project-1', is_active: true },
        relations: ['stages', 'stages.items'],
      });
      expect(result).toEqual(budget);
    });

    it('should return null when no active budget', async () => {
      budgetRepo._mockFindOne.mockResolvedValue(null);

      const result = await service.getActiveVersion('project-1');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a budget by id with all relations', async () => {
      const budget = createMockBudget();
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      const result = await service.findOne('budget-1');

      expect(budgetRepo._mockFindOne).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        relations: ['stages', 'stages.items', 'project', 'project.company'],
      });
      expect(result).toEqual(budget);
    });

    it('should throw NotFoundException if budget not found', async () => {
      budgetRepo._mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate company_id when provided', async () => {
      const budget = createMockBudget({
        project: { id: 'project-1', company_id: 'company-1' } as Project,
      });
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      // Should succeed when company matches
      await service.findOne('budget-1', 'company-1');

      // Should throw when company doesn't match
      budgetRepo._mockFindOne.mockResolvedValue(budget);
      await expect(
        service.findOne('budget-1', 'different-company'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('update', () => {
    it('should update a budget and increment version', async () => {
      const existingBudget = createMockBudget({
        version: 1,
        notes: 'Original',
      });
      const updatedBudget = createMockBudget({ version: 2, notes: 'Updated' });

      budgetRepo._mockFindOne.mockResolvedValue(existingBudget);
      budgetRepo._mockMerge.mockImplementation(
        (target: Budget, ...sources: Partial<Budget>[]) => {
          return { ...target, ...sources[0] };
        },
      );
      budgetRepo._mockSave.mockResolvedValue(updatedBudget);

      const updateDto = createMockUpdateDto({ notes: 'Updated' });
      await service.update('budget-1', updateDto);

      expect(financialService.calculateBudgetTotals).toHaveBeenCalled();
      expect(businessRulesService.validateBudget).toHaveBeenCalled();
      expect(budgetRepo._mockSave).toHaveBeenCalled();
    });

    it('should update budget with stages and items', async () => {
      const existingBudget = createMockBudget({ version: 1 });
      const updatedBudget = createMockBudget({
        version: 2,
        stages: [
          {
            id: 'stage-1',
            name: 'Stage 1',
            position: 1,
            budget_id: 'budget-1',
            total_cost: 0,
            total_price: 0,
            items: [],
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      budgetRepo._mockFindOne.mockResolvedValue(existingBudget);
      budgetRepo._mockMerge.mockImplementation(
        (target: Budget, ...sources: Partial<Budget>[]) => {
          return { ...target, ...sources[0] };
        },
      );
      budgetRepo._mockSave.mockResolvedValue(updatedBudget);

      stageRepo._mockCreate.mockImplementation((data) => data);
      itemRepo._mockCreate.mockImplementation((data) => data);

      const updateDto = {
        notes: 'Updated with stages',
        stages: [
          {
            name: 'Stage 1',
            position: 1,
            items: [
              {
                name: 'Item 1',
                unit: 'kg',
                quantity: 10,
                unit_cost: 100,
                unit_price: 150,
              },
            ],
          },
        ],
      };

      await service.update('budget-1', updateDto);

      expect(stageRepo._mockCreate).toHaveBeenCalled();
      expect(itemRepo._mockCreate).toHaveBeenCalled();
    });

    it('should throw ConflictException on optimistic lock failure', async () => {
      const existingBudget = createMockBudget({ version: 1 });

      budgetRepo._mockFindOne.mockResolvedValue(existingBudget);
      budgetRepo._mockMerge.mockImplementation(
        (target: Budget, ...sources: Partial<Budget>[]) => {
          return { ...target, ...sources[0] };
        },
      );
      budgetRepo._mockSave.mockRejectedValue(
        new OptimisticLockVersionMismatchError(existingBudget, 1, 2),
      );

      await expect(
        service.update('budget-1', { notes: 'Updated' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle validation warnings', async () => {
      const existingBudget = createMockBudget({ version: 1 });
      const updatedBudget = createMockBudget({ version: 2 });

      businessRulesService.validateBudget = jest
        .fn()
        .mockResolvedValue(['Warning: Cost exceeds budget']);

      budgetRepo._mockFindOne.mockResolvedValue(existingBudget);
      budgetRepo._mockMerge.mockImplementation(
        (target: Budget, ...sources: Partial<Budget>[]) => {
          return { ...target, ...sources[0] };
        },
      );
      budgetRepo._mockSave.mockResolvedValue(updatedBudget);

      const result = await service.update('budget-1', { notes: 'Updated' });

      expect(result).toHaveProperty('warnings');
      expect(result.warnings).toContain('Warning: Cost exceeds budget');
    });

    it('should update project estimated budget when budget is active', async () => {
      const existingBudget = createMockBudget({ version: 1, is_active: true });

      // El merge debe modificar el objeto existente con los nuevos valores
      budgetRepo._mockFindOne.mockResolvedValue(existingBudget);
      budgetRepo._mockMerge.mockImplementation(
        (target: Budget, ...sources: Partial<Budget>[]) => {
          // Modificar el objeto target in-place para simular el comportamiento real de TypeORM
          Object.assign(target, sources[0]);
          return target;
        },
      );

      // El save debe devolver el objeto modificado (con los valores actualizados)
      budgetRepo._mockSave.mockImplementation((budget) =>
        Promise.resolve(budget as Budget),
      );

      await service.update('budget-1', { total_estimated_price: 200000 });

      expect(projectRepo._mockUpdate).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          estimated_budget: 200000,
          estimated_price: 200000,
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SET ACTIVE VERSION Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('setActiveVersion', () => {
    it('should set budget as active and update others to inactive', async () => {
      const budget = createMockBudget({ version: 2, is_active: false });

      budgetRepo._mockFindOne.mockResolvedValue(budget);
      budgetRepo._mockSave.mockResolvedValue({ ...budget, is_active: true });

      const result = await service.setActiveVersion('budget-1');

      // Should have deactivated previous active budgets
      expect(budgetRepo._mockUpdate).toHaveBeenCalledWith(
        { project_id: 'project-1' },
        { is_active: false },
      );
      // Should have saved the new active budget
      expect(budgetRepo._mockSave).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
      expect(result.is_active).toBe(true);
    });

    it('should update project with new budget totals', async () => {
      const budget = createMockBudget({
        version: 2,
        is_active: false,
        total_estimated_price: 250000,
      });

      budgetRepo._mockFindOne.mockResolvedValue(budget);
      budgetRepo._mockSave.mockResolvedValue({ ...budget, is_active: true });

      await service.setActiveVersion('budget-1');

      expect(projectRepo._mockUpdate).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          estimated_budget: 250000,
          estimated_price: 250000,
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SUMMARY Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getSummary', () => {
    it('should return project summary from financial service', async () => {
      const summary = {
        total: 150000,
        costs: 100000,
        prices: 150000,
        stages: [],
      };
      financialService.getProjectSummary = jest.fn().mockReturnValue(summary);

      const result = await service.getSummary('project-1', 'company-1');

      expect(financialService.getProjectSummary).toHaveBeenCalledWith(
        'project-1',
        'company-1',
      );
      expect(result).toEqual(summary);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE REVISION Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('createRevision', () => {
    it('should create a revision copy of budget with incremented version', async () => {
      const original = createMockBudget({ version: 1, stages: [] });
      const revision = createMockBudget({ version: 2, id: 'budget-2' });

      budgetRepo._mockFindOne.mockResolvedValue(original);
      budgetRepo._mockCreate.mockReturnValue(revision);
      budgetRepo._mockSave.mockResolvedValue(revision);

      const result = await service.createRevision('budget-1');

      expect(budgetRepo._mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: original.project_id,
          is_active: false,
          status: BudgetStatus.DRAFT,
        }),
      );
      expect(result.version).toBe(2);
    });

    it('should copy stages and items to revision', async () => {
      const original = createMockBudget({
        version: 1,
        stages: [
          {
            id: 'stage-1',
            name: 'Original Stage',
            position: 1,
            budget_id: 'budget-1',
            total_cost: 1000,
            total_price: 1500,
            items: [
              {
                id: 'item-1',
                name: 'Original Item',
                type: 'material',
                unit: 'kg',
                quantity: 10,
                unit_cost: 100,
                unit_price: 150,
                position: 1,
                total_cost: 1000,
                total_price: 1500,
              },
            ],
          },
        ],
      });
      const revision = createMockBudget({
        version: 2,
        id: 'budget-2',
        stages: [],
      });

      budgetRepo._mockFindOne.mockResolvedValue(original);
      budgetRepo._mockCreate.mockImplementation((data) => data as Budget);
      budgetRepo._mockSave.mockResolvedValue(revision);

      await service.createRevision('budget-1');

      expect(budgetRepo._mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stages: expect.arrayContaining([
            expect.objectContaining({
              name: 'Original Stage',
              items: expect.arrayContaining([
                expect.objectContaining({ name: 'Original Item' }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('should validate company access', async () => {
      const budget = createMockBudget({ version: 1 });
      const project = { id: 'project-1', company_id: 'company-1' };
      budget.project = project as Project;

      budgetRepo._mockFindOne.mockResolvedValue(budget);
      projectRepo._mockFindOne.mockResolvedValue(project);

      // Should allow access for correct company
      await service.createRevision('budget-1', undefined, 'company-1');

      // Should deny for different company
      projectRepo._mockFindOne.mockResolvedValue(project);
      await expect(
        service.createRevision('budget-1', undefined, 'different-company'),
      ).rejects.toThrow(expect.objectContaining({ message: 'Access denied' }));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOVE Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('remove', () => {
    it('should remove a budget', async () => {
      const budget = createMockBudget();
      budgetRepo._mockFindOne.mockResolvedValue(budget);
      budgetRepo._mockRemove.mockResolvedValue(budget);

      const result = await service.remove('budget-1');

      expect(budgetRepo._mockRemove).toHaveBeenCalledWith(budget);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when budget not found on remove', async () => {
      budgetRepo._mockFindOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK CREATE ITEMS Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('bulkCreateItems', () => {
    it('should create items in bulk via RPC', async () => {
      const budget = createMockBudget();
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      dataSource._mockQuery.mockResolvedValue([
        { inserted_count: 2, failed_count: 0, first_error: null },
      ]);

      const items = [
        {
          stage_id: 'stage-1',
          name: 'Item 1',
          quantity: 10,
          unit: 'kg',
          unit_cost: 100,
          unit_price: 150,
          position: 1,
        },
        {
          stage_id: 'stage-1',
          name: 'Item 2',
          quantity: 20,
          unit: 'kg',
          unit_cost: 200,
          unit_price: 300,
          position: 2,
        },
      ];

      const result = await service.bulkCreateItems(
        'budget-1',
        items,
        'company-1',
      );

      expect(result.inserted_count).toBe(2);
      expect(result.failed_count).toBe(0);
    });

    it('should throw BadRequestException for empty items array', async () => {
      await expect(service.bulkCreateItems('budget-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for items exceeding limit', async () => {
      const items = Array.from({ length: 2001 }, (_, i) => ({
        stage_id: 'stage-1',
        name: `Item ${i}`,
        quantity: 10,
        unit: 'kg',
        unit_cost: 100,
        unit_price: 150,
        position: i,
      }));

      await expect(service.bulkCreateItems('budget-1', items)).rejects.toThrow(
        expect.objectContaining({ message: expect.stringContaining('2000') }),
      );
    });

    it('should fallback to transaction when RPC not available', async () => {
      const budget = createMockBudget();
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      dataSource._mockQuery.mockRejectedValue(
        new Error('function does not exist'),
      );

      const items = [
        {
          stage_id: 'stage-1',
          name: 'Item 1',
          quantity: 10,
          unit: 'kg',
          unit_cost: 100,
          unit_price: 150,
          position: 1,
        },
      ];

      const result = await service.bulkCreateItems('budget-1', items);

      expect(result.inserted_count).toBe(1);
    });

    it('should handle validation errors from RPC', async () => {
      const budget = createMockBudget();
      budgetRepo._mockFindOne.mockResolvedValue(budget);

      const pgError = { code: '23503', message: 'Foreign key violation' };
      dataSource._mockQuery.mockRejectedValue(pgError);

      const items = [
        {
          stage_id: 'invalid-stage',
          name: 'Item 1',
          quantity: 10,
          unit: 'kg',
          unit_cost: 100,
          unit_price: 150,
          position: 1,
        },
      ];

      await expect(
        service.bulkCreateItems('budget-1', items, 'company-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
