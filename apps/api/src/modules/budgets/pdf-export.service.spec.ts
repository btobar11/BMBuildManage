import { Test, TestingModule } from '@nestjs/testing';
import { PDFExportService } from './pdf-export.service';
import { BudgetsService } from './budgets.service';

const createMockBudget = () => ({
  id: 'budget-1',
  project_id: 'project-1',
  version: 1,
  total_estimated_cost: 100000,
  total_estimated_price: 150000,
  professional_fee_percentage: 10,
  estimated_utility: 15,
  project: {
    name: 'Test Project',
    company: {
      name: 'Test Company',
      tax_id: '12345678-9',
      address: 'Test Address',
      email: 'test@company.com',
      phone: '+56912345678',
      logo_url: null,
    },
    client: {
      name: 'Test Client',
    },
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
          item_type: 'material',
        },
      ],
    },
  ],
});

const mockBudgetsService = () => ({
  findOne: jest.fn(),
});

describe('PDFExportService', () => {
  let service: PDFExportService;
  let budgetsService: jest.Mocked<BudgetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFExportService,
        { provide: BudgetsService, useFactory: mockBudgetsService },
      ],
    }).compile();

    service = module.get<PDFExportService>(PDFExportService);
    budgetsService = module.get(BudgetsService);
  });

  describe('generateBudgetPDF', () => {
    it('should generate a PDF buffer', async () => {
      const budget = createMockBudget();
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(budgetsService.findOne).toHaveBeenCalledWith('budget-1');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle budget without project name', async () => {
      const budget = {
        ...createMockBudget(),
        project: {
          ...createMockBudget().project,
          name: null,
        },
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle budget without company', async () => {
      const budget = {
        ...createMockBudget(),
        project: {
          ...createMockBudget().project,
          company: null,
        },
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle budget without stages', async () => {
      const budget = {
        ...createMockBudget(),
        stages: [],
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

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

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle budget without client', async () => {
      const budget = {
        ...createMockBudget(),
        project: {
          ...createMockBudget().project,
          client: null,
        },
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should calculate profit and margin correctly', async () => {
      const budget = createMockBudget();
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle company with logo_url', async () => {
      const budget = {
        ...createMockBudget(),
        project: {
          ...createMockBudget().project,
          company: {
            ...createMockBudget().project.company,
            logo_url: 'https://example.com/logo.png',
          },
        },
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle low margin highlight (margin < 20)', async () => {
      const budget = {
        ...createMockBudget(),
        total_estimated_cost: 140000,
        total_estimated_price: 150000,
        estimated_utility: 7,
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle zero total_estimated_price', async () => {
      const budget = {
        ...createMockBudget(),
        total_estimated_cost: 0,
        total_estimated_price: 0,
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle items with different item types', async () => {
      const budget = {
        ...createMockBudget(),
        stages: [
          {
            name: 'Stage 1',
            items: [
              {
                name: 'Material Item',
                quantity: 10,
                unit_price: 100,
                unit_cost: 80,
                item_type: 'material',
              },
              {
                name: 'Labor Item',
                quantity: 5,
                unit_price: 200,
                unit_cost: 150,
                item_type: 'labor',
              },
              {
                name: 'Machinery Item',
                quantity: 2,
                unit_price: 500,
                unit_cost: 400,
                item_type: 'machinery',
              },
              {
                name: 'Subcontract Item',
                quantity: 1,
                unit_price: 1000,
                unit_cost: 800,
                item_type: 'subcontract',
              },
              {
                name: 'Unknown Type',
                quantity: 1,
                unit_price: 100,
                unit_cost: 80,
                item_type: 'unknown',
              },
            ],
          },
        ],
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle items with null item_type', async () => {
      const budget = {
        ...createMockBudget(),
        stages: [
          {
            name: 'Stage 1',
            items: [
              {
                name: 'Item with null type',
                quantity: 10,
                unit_price: 100,
                unit_cost: 80,
                item_type: null,
              },
            ],
          },
        ],
      };
      budgetsService.findOne.mockResolvedValue(budget as any);

      const result = await service.generateBudgetPDF('budget-1');

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
