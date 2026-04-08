import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FinancialService } from './financial.service';
import { Budget } from './budget.entity';
import { Expense } from '../expenses/expense.entity';
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

describe('FinancialService', () => {
  let service: FinancialService;

  const mockBudgetRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockExpenseRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockWorkerAssignmentRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockContingencyRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(WorkerAssignment),
          useValue: mockWorkerAssignmentRepository,
        },
        {
          provide: getRepositoryToken(ProjectContingency),
          useValue: mockContingencyRepository,
        },
      ],
    }).compile();

    service = module.get<FinancialService>(FinancialService);
  });

  const mockQueryBuilder = (total: number) => ({
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total }),
  });

  it('should calculate project summary correctly', async () => {
    const projectId = 'proj-123';

    mockBudgetRepository.findOne.mockResolvedValue({
      id: 'budget-1',
      total_estimated_cost: 500000,
      total_estimated_price: 1000000,
      version: 1,
    });

    mockExpenseRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(150000),
    );
    mockWorkerAssignmentRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(350000),
    );
    mockContingencyRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(25000),
    );

    const result = await service.getProjectSummary(projectId);

    expect(result.financials.estimatedCost).toBe(500000);
    expect(result.financials.totalRealCost).toBe(150000 + 350000 + 25000); // 525000
    expect(result.financials.variance).toBe(-25000);
    expect(result.financials.realMargin).toBe(47.5);
  });

  it('should handle zero estimated price gracefully', async () => {
    const projectId = 'proj-123';

    mockBudgetRepository.findOne.mockResolvedValue({
      id: 'budget-1',
      total_estimated_cost: 0,
      total_estimated_price: 0,
      version: 1,
    });

    mockExpenseRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(0),
    );
    mockWorkerAssignmentRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(0),
    );
    mockContingencyRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(0),
    );

    const result = await service.getProjectSummary(projectId);

    expect(result.financials.estimatedMargin).toBe(0);
    expect(result.financials.realMargin).toBe(0);
  });

  it('should handle null budget', async () => {
    const projectId = 'proj-123';

    mockBudgetRepository.findOne.mockResolvedValue(null);

    mockExpenseRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(100),
    );
    mockWorkerAssignmentRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(50),
    );
    mockContingencyRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(25),
    );

    const result = await service.getProjectSummary(projectId);

    expect(result.budgetId).toBeUndefined();
    expect(result.financials.estimatedCost).toBe(0);
    expect(result.financials.estimatedPrice).toBe(0);
  });

  describe('calculateBudgetTotals', () => {
    it('should calculate totals from stages and items', async () => {
      const budget = {
        id: 'budget-1',
        stages: [
          {
            id: 'stage-1',
            items: [
              { quantity: 10, unit_cost: 100, unit_price: 150 },
              { quantity: 5, unit_cost: 200, unit_price: 250 },
            ],
          },
          {
            id: 'stage-2',
            items: [{ quantity: 20, unit_cost: 50, unit_price: 75 }],
          },
        ],
      } as unknown as Budget;

      const result = await service.calculateBudgetTotals(budget);

      expect(result.total_estimated_cost).toBe(10 * 100 + 5 * 200 + 20 * 50); // 3000
      expect(result.total_estimated_price).toBe(10 * 150 + 5 * 250 + 20 * 75); // 4625
    });

    it('should handle budget with no stages', async () => {
      const budget = { id: 'budget-1', stages: null } as unknown as Budget;

      const result = await service.calculateBudgetTotals(budget);

      expect(result.total_estimated_cost).toBe(0);
      expect(result.total_estimated_price).toBe(0);
    });

    it('should handle stage with no items', async () => {
      const budget = {
        id: 'budget-1',
        stages: [{ id: 'stage-1', items: null }],
      } as unknown as Budget;

      const result = await service.calculateBudgetTotals(budget);

      expect(result.total_estimated_cost).toBe(0);
      expect(result.total_estimated_price).toBe(0);
    });

    it('should handle empty stages array', async () => {
      const budget = { id: 'budget-1', stages: [] } as unknown as Budget;

      const result = await service.calculateBudgetTotals(budget);

      expect(result.total_estimated_cost).toBe(0);
      expect(result.total_estimated_price).toBe(0);
    });
  });
});
