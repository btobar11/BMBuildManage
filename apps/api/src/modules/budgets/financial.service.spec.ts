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
});
