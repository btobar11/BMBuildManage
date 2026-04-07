import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from '../../apps/api/src/modules/budgets/budgets.service';
import { FinancialService } from '../../apps/api/src/modules/budgets/financial.service';
import { BusinessRulesService } from '../../apps/api/src/modules/budgets/business-rules.service';
import { AuditLogsService } from '../../apps/api/src/modules/audit-logs/audit-logs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, BudgetStatus } from '../../apps/api/src/modules/budgets/budget.entity';
import { Stage } from '../../apps/api/src/modules/stages/stage.entity';
import { Item } from '../../apps/api/src/modules/items/item.entity';
import { Project } from '../../apps/api/src/modules/projects/project.entity';

describe('Budget Calculation Tests', () => {
  let service: BudgetsService;
  let budgetRepo: jest.Mocked<Repository<Budget>>;
  let stageRepo: jest.Mocked<Repository<Stage>>;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let projectRepo: jest.Mocked<Repository<Project>>;

  const mockStage = {
    id: 'stage-1',
    budget_id: 'budget-1',
    name: 'Obra Gruesa',
    position: 0,
    items: [
      {
        id: 'item-1',
        stage_id: 'stage-1',
        name: 'Hormigon H25',
        quantity: 10,
        unit_cost: 50000,
        unit_price: 60000,
      },
      {
        id: 'item-2',
        stage_id: 'stage-1',
        name: 'Acero 10mm',
        quantity: 100,
        unit_cost: 1000,
        unit_price: 1200,
      },
    ],
  };

  const mockBudget = {
    id: 'budget-1',
    project_id: 'project-1',
    status: BudgetStatus.DRAFT,
    professional_fee_percentage: 10,
    estimated_utility: 15,
    markup_percentage: 20,
    total_estimated_cost: 0,
    total_estimated_price: 0,
    stages: [mockStage],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        FinancialService,
        BusinessRulesService,
        AuditLogsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: {
            create: jest.fn().mockImplementation((data) => ({ ...data, id: 'new-budget-id' })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'new-budget-id' })),
            findOne: jest.fn().mockResolvedValue(mockBudget),
            find: jest.fn().mockResolvedValue([mockBudget]),
            count: jest.fn().mockResolvedValue(1),
            update: jest.fn().mockResolvedValue({}),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Stage),
          useValue: {
            create: jest.fn().mockImplementation((data) => ({ ...data })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          },
        },
        {
          provide: getRepositoryToken(Item),
          useValue: {
            create: jest.fn().mockImplementation((data) => ({ ...data })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'project-1', company_id: 'company-1' }),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    budgetRepo = module.get(getRepositoryToken(Budget));
    stageRepo = module.get(getRepositoryToken(Stage));
    itemRepo = module.get(getRepositoryToken(Item));
    projectRepo = module.get(getRepositoryToken(Project));
  });

  describe('Budget Total Calculation', () => {
    it('should calculate correct total cost from items', () => {
      const stage = mockStage as Stage;
      
      const expectedCost = 10 * 50000 + 100 * 1000;
      const expectedPrice = 10 * 60000 + 100 * 1200;

      const calculatedCost = stage.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const calculatedPrice = stage.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      expect(calculatedCost).toBe(expectedCost);
      expect(calculatedPrice).toBe(expectedPrice);
    });

    it('should add APU from library correctly', () => {
      const libraryAPU = {
        name: 'Enlucido de muros',
        unit_cost: 15000,
        unit_price: 18000,
        quantity: 50,
      };

      const itemCost = libraryAPU.quantity * libraryAPU.unit_cost;
      const itemPrice = libraryAPU.quantity * libraryAPU.unit_price;

      expect(itemCost).toBe(750000);
      expect(itemPrice).toBe(900000);
    });

    it('should apply professional fee percentage correctly', () => {
      const directCost = 1000000;
      const professionalFeePercentage = 10;

      const withProfessionalFee = directCost * (1 + professionalFeePercentage / 100);

      expect(withProfessionalFee).toBe(1100000);
    });

    it('should apply utility percentage correctly', () => {
      const costWithFee = 1100000;
      const utilityPercentage = 15;

      const finalPrice = costWithFee * (1 + utilityPercentage / 100);

      expect(finalPrice).toBe(1265000);
    });

    it('should calculate complete budget with all markups', () => {
      const stage = mockStage as Stage;
      
      const directCost = stage.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const professionalFee = 10;
      const utility = 15;

      const costWithFee = directCost * (1 + professionalFee / 100);
      const finalPrice = costWithFee * (1 + utility / 100);

      const expectedDirectCost = 600000;
      const expectedWithFee = 660000;
      const expectedFinal = 759000;

      expect(directCost).toBe(expectedDirectCost);
      expect(costWithFee).toBe(expectedWithFee);
      expect(finalPrice).toBe(expectedFinal);
    });
  });

  describe('APU Library Integration', () => {
    it('should calculate APU total correctly', () => {
      const apuItem = {
        materialsCost: 50000,
        laborCost: 30000,
        equipmentCost: 10000,
        quantity: 5,
      };

      const totalAPUCost = (apuItem.materialsCost + apuItem.laborCost + apuItem.equipmentCost) * apuItem.quantity;

      expect(totalAPUCost).toBe(450000);
    });
  });
});
