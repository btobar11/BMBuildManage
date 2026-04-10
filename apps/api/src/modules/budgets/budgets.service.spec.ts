import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, OptimisticLockVersionMismatchError } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetStatus } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Project } from '../projects/project.entity';
import { FinancialService } from './financial.service';
import { BusinessRulesService } from './business-rules.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const createMockBudget = (overrides?: Partial<Budget>): Budget =>
  ({
    id: 'budget-1',
    project_id: 'project-1',
    version: 1,
    status: BudgetStatus.DRAFT,
    is_active: true,
    total_estimated_cost: 100000,
    total_estimated_price: 150000,
    professional_fee_percentage: 10,
    estimated_utility: 15000,
    notes: 'Test budget',
    created_at: new Date(),
    updated_at: new Date(),
    stages: [],
    project: {} as Project,
    ...overrides,
  }) as unknown as Budget;

const mockBudgetRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
});

const mockStageRepository = () => ({
  create: jest.fn().mockImplementation((data) => data),
});

const mockItemRepository = () => ({
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn(),
});

const mockProjectRepository = () => ({
  update: jest.fn(),
});

const mockFinancialService = () => ({
  calculateBudgetTotals: jest.fn().mockResolvedValue(undefined),
  getProjectSummary: jest.fn().mockResolvedValue({ total: 100000 }),
});

const mockBusinessRulesService = () => ({
  validateBudget: jest.fn().mockResolvedValue([]),
});

const mockAuditLogsService = () => ({
  logEvent: jest.fn().mockResolvedValue({}),
});

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepo: jest.Mocked<Repository<Budget>>;
  let financialService: jest.Mocked<FinancialService>;
  let businessRulesService: jest.Mocked<BusinessRulesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useFactory: mockBudgetRepository,
        },
        { provide: getRepositoryToken(Stage), useFactory: mockStageRepository },
        { provide: getRepositoryToken(Item), useFactory: mockItemRepository },
        {
          provide: getRepositoryToken(Project),
          useFactory: mockProjectRepository,
        },
        { provide: FinancialService, useFactory: mockFinancialService },
        { provide: BusinessRulesService, useFactory: mockBusinessRulesService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    budgetRepo = module.get(getRepositoryToken(Budget));
    financialService = module.get(FinancialService);
    businessRulesService = module.get(BusinessRulesService);
  });

  describe('create', () => {
    it('should create a budget', async () => {
      const createDto = { project_id: 'project-1', version: 1 };
      const budget = createMockBudget(createDto);
      budgetRepo.create.mockReturnValue(budget);
      budgetRepo.save.mockResolvedValue(budget);
      budgetRepo.count.mockResolvedValue(1);
      budgetRepo.update.mockResolvedValue({} as any);

      const result = await service.create(createDto);
      expect(budgetRepo.create).toHaveBeenCalled();
      expect(budgetRepo.save).toHaveBeenCalled();
      expect(result).toEqual(budget);
    });

    it('should auto-set first budget as active', async () => {
      const createDto = { project_id: 'project-1', version: 1 };
      const budget = createMockBudget({ ...createDto, is_active: true });
      budgetRepo.create.mockReturnValue(budget);
      budgetRepo.save.mockResolvedValue(budget);
      budgetRepo.count.mockResolvedValue(1);

      await service.create(createDto);
      expect(budgetRepo.update).toHaveBeenCalledWith(budget.id, {
        is_active: true,
      });
    });
  });

  describe('findAllByProject', () => {
    it('should return budgets for a project', async () => {
      const budgets = [
        createMockBudget({ id: '1' }),
        createMockBudget({ id: '2' }),
      ];
      budgetRepo.find.mockResolvedValue(budgets);

      const result = await service.findAllByProject('project-1');
      expect(budgetRepo.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['stages', 'stages.items'],
        order: { version: 'DESC' },
      });
      expect(result).toEqual(budgets);
    });
  });

  describe('getActiveVersion', () => {
    it('should return active budget', async () => {
      const budget = createMockBudget({ is_active: true });
      budgetRepo.findOne.mockResolvedValue(budget);

      const result = await service.getActiveVersion('project-1');
      expect(budgetRepo.findOne).toHaveBeenCalledWith({
        where: { project_id: 'project-1', is_active: true },
        relations: ['stages', 'stages.items'],
      });
      expect(result).toEqual(budget);
    });
  });

  describe('findOne', () => {
    it('should return a budget by id', async () => {
      const budget = createMockBudget();
      budgetRepo.findOne.mockResolvedValue(budget);

      const result = await service.findOne('budget-1');
      expect(budgetRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        relations: ['stages', 'stages.items', 'project', 'project.company'],
      });
      expect(result).toEqual(budget);
    });

    it('should throw NotFoundException if budget not found', async () => {
      budgetRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a budget and calculate totals', async () => {
      const budget = createMockBudget({ notes: 'Test budget' });
      const updatedBudget = createMockBudget({ ...budget, notes: 'Updated' });
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.merge.mockImplementation((b: any, ...rest: any[]) => ({
        ...b,
        ...rest[0],
      }));
      budgetRepo.save.mockResolvedValue(updatedBudget);

      const result = await service.update('budget-1', { notes: 'Updated' });
      expect(financialService.calculateBudgetTotals).toHaveBeenCalled();
      expect(businessRulesService.validateBudget).toHaveBeenCalled();
    });

    it('should update budget with stages', async () => {
      const budget = createMockBudget();
      const updatedBudget = createMockBudget({ ...budget, stages: [] });
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.merge.mockImplementation((b: any, ...rest: any[]) => ({
        ...b,
        ...rest[0],
      }));
      budgetRepo.save.mockResolvedValue(updatedBudget);

      const mockStageRepo = {
        create: jest.fn().mockImplementation((data) => data),
      };
      const mockItemRepo = {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue([]),
      };
      (service as any).stageRepository = mockStageRepo;
      (service as any).itemRepository = mockItemRepo;

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
      expect(mockStageRepo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on optimistic lock failure', async () => {
      const budget = createMockBudget();
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.merge.mockImplementation((b: any, ...rest: any[]) => ({
        ...b,
        ...rest[0],
      }));

      budgetRepo.save.mockRejectedValue(
        new OptimisticLockVersionMismatchError(budget, 1, 2),
      );

      await expect(
        service.update('budget-1', { notes: 'Updated' }),
      ).rejects.toThrow('modificado por otro usuario');
    });
  });

  describe('setActiveVersion', () => {
    it('should set budget as active', async () => {
      const budget = createMockBudget({ is_active: false });
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.save.mockResolvedValue({ ...budget, is_active: true });

      const result = await service.setActiveVersion('budget-1');
      expect(budgetRepo.update).toHaveBeenCalled();
      expect(result.is_active).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should return project summary', async () => {
      const result = await service.getSummary('project-1');
      expect(financialService.getProjectSummary).toHaveBeenCalledWith(
        'project-1',
        undefined,
      );
      expect(result).toEqual({ total: 100000 });
    });
  });

  describe('createRevision', () => {
    it('should create a revision of a budget', async () => {
      const budget = createMockBudget({ version: 1, stages: [] });
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.create.mockReturnValue({ ...budget, version: 2 } as any);
      budgetRepo.save.mockResolvedValue({ ...budget, version: 2 });

      const result = await service.createRevision('budget-1');
      expect(budget.version).toBe(1);
    });
  });

  describe('remove', () => {
    it('should remove a budget', async () => {
      const budget = createMockBudget();
      budgetRepo.findOne.mockResolvedValue(budget);
      budgetRepo.remove.mockResolvedValue(budget);

      const result = await service.remove('budget-1');
      expect(budgetRepo.remove).toHaveBeenCalledWith(budget);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('bulkCreateItems', () => {
    it('should create items in bulk', async () => {
      const budget = createMockBudget();
      budgetRepo.findOne.mockResolvedValue(budget);

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

      const mockItemRepo = {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue([{ id: 'item-1' }]),
      };

      (service as any).itemRepository = mockItemRepo;

      const result = await service.bulkCreateItems('budget-1', items);
      expect(result.created).toBe(1);
      expect(financialService.calculateBudgetTotals).toHaveBeenCalled();
    });
  });
});
