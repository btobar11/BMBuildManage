import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { BudgetsService } from './budgets.service';
import { FinancialService } from './financial.service';

const createMockBudget = () => ({
  id: 'budget-1',
  project_id: 'project-1',
  version: 1,
  total_estimated_cost: 100000,
  total_estimated_price: 150000,
  project: {
    name: 'Test Project',
  },
  stages: [
    {
      name: 'Stage 1',
      items: [
        {
          name: 'Item 1',
          quantity: 10,
          unit: 'kg',
          unit_price: 100,
          unit_cost: 80,
        },
      ],
    },
  ],
});

const mockBudgetsService = () => ({
  findOne: jest.fn(),
});

const mockFinancialService = () => ({
  calculateBudgetTotals: jest.fn().mockResolvedValue(undefined),
  getProjectSummary: jest.fn().mockResolvedValue({ total: 100000 }),
});

describe('ExportService', () => {
  let service: ExportService;
  let budgetsService: jest.Mocked<BudgetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: BudgetsService, useFactory: mockBudgetsService },
        { provide: FinancialService, useFactory: mockFinancialService },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    budgetsService = module.get(BudgetsService);
  });

  describe('exportBudgetToExcel', () => {
    it('should export budget to Excel buffer', async () => {
      const budget = createMockBudget();
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.exportBudgetToExcel('budget-1');

      expect(budgetsService.findOne).toHaveBeenCalledWith('budget-1');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle budget without project name', async () => {
      const budget = {
        ...createMockBudget(),
        project: null,
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.exportBudgetToExcel('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle budget without stages', async () => {
      const budget = {
        ...createMockBudget(),
        stages: [],
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.exportBudgetToExcel('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle stage without items', async () => {
      const budget = {
        ...createMockBudget(),
        stages: [
          {
            name: 'Empty Stage',
            items: [],
          },
        ],
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.exportBudgetToExcel('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should calculate correct totals', async () => {
      const budget = createMockBudget();
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.exportBudgetToExcel('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
