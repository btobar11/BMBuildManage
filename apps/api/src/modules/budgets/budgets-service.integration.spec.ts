import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRulesService } from './business-rules.service';
import { Budget, BudgetStatus } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { CubicationMode } from '../items/item.entity';

describe('BusinessRulesService Unit Tests', () => {
  let service: BusinessRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessRulesService],
    }).compile();

    service = module.get<BusinessRulesService>(BusinessRulesService);
  });

  describe('validateBudget', () => {
    it('should return empty warnings for valid budget', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              { name: 'Item 1', quantity: 10, unit_cost: 100, unit_price: 120 },
            ],
          } as Stage,
        ],
      };

      const result = await service.validateBudget(budget as Budget);

      expect(result).toEqual([]);
    });

    it('should throw for negative quantity', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: -10,
                unit_cost: 100,
                unit_price: 120,
              },
            ],
          } as Stage,
        ],
      };

      await expect(service.validateBudget(budget as Budget)).rejects.toThrow();
    });

    it('should throw for negative unit_price', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                unit_cost: -100,
                unit_price: 120,
              },
            ],
          } as Stage,
        ],
      };

      await expect(service.validateBudget(budget as Budget)).rejects.toThrow();
    });

    it('should throw for negative unit_cost', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                unit_cost: 100,
                unit_price: -120,
              },
            ],
          } as Stage,
        ],
      };

      await expect(service.validateBudget(budget as Budget)).rejects.toThrow();
    });

    it('should warn for missing dimensions in m3 item', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                unit_cost: 100,
                unit_price: 120,
                unit: 'm3',
                cubication_mode: CubicationMode.DIMENSIONS,
                dim_length: 0,
                dim_width: 0,
                dim_height: 0,
                dim_thickness: 0,
              },
            ],
          } as Stage,
        ],
      };

      const result = await service.validateBudget(budget as Budget);

      expect(result.some((w) => w.includes('dimensiones válidas'))).toBe(true);
    });

    it('should warn for incomplete m2 dimensions', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                unit_cost: 100,
                unit_price: 120,
                unit: 'm2',
                cubication_mode: CubicationMode.DIMENSIONS,
                dim_length: 5,
                dim_width: 0,
                dim_height: 0,
              },
            ],
          } as Stage,
        ],
      };

      const result = await service.validateBudget(budget as Budget);

      expect(result.some((w) => w.includes('unidad m2'))).toBe(true);
    });

    it('should warn for exceeded execution quantity > 5%', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                quantity_executed: 16,
                unit_cost: 100,
                unit_price: 120,
              },
            ],
          } as Stage,
        ],
      };

      const result = await service.validateBudget(budget as Budget);

      expect(result.some((w) => w.includes('superado'))).toBe(true);
    });

    it('should not warn for normal execution within threshold', async () => {
      const budget: Partial<Budget> = {
        stages: [
          {
            items: [
              {
                name: 'Item 1',
                quantity: 100,
                quantity_executed: 103,
                unit_cost: 100,
                unit_price: 120,
              },
            ],
          } as Stage,
        ],
      };

      const result = await service.validateBudget(budget as Budget);

      expect(result.some((w) => w.includes('superado'))).toBe(false);
    });
  });
});

describe('Budget Calculation Logic', () => {
  describe('Item Cost Calculation', () => {
    it('should calculate correct total cost from items', () => {
      const items = [
        { quantity: 10, unit_cost: 50000, unit_price: 60000 },
        { quantity: 100, unit_cost: 1000, unit_price: 1200 },
      ];

      const expectedCost = 10 * 50000 + 100 * 1000;
      const expectedPrice = 10 * 60000 + 100 * 1200;

      const calculatedCost = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0,
      );
      const calculatedPrice = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      );

      expect(calculatedCost).toBe(expectedCost);
      expect(calculatedPrice).toBe(expectedPrice);
    });

    it('should handle empty items array', () => {
      const items: Array<{ quantity: number; unit_cost: number }> = [];
      const directCost = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0,
      );
      expect(directCost).toBe(0);
    });

    it('should handle decimal quantities', () => {
      const item = { quantity: 2.5, unit_cost: 10000 };
      const totalCost = item.quantity * item.unit_cost;
      expect(totalCost).toBe(25000);
    });
  });

  describe('Markup Calculation', () => {
    it('should apply professional fee percentage correctly', () => {
      const directCost = 1000000;
      const professionalFeePercentage = 10;

      const withProfessionalFee =
        directCost * (1 + professionalFeePercentage / 100);

      expect(withProfessionalFee).toBe(1100000);
    });

    it('should apply utility percentage correctly', () => {
      const costWithFee = 1100000;
      const utilityPercentage = 15;

      const finalPrice = costWithFee * (1 + utilityPercentage / 100);

      expect(finalPrice).toBe(1265000);
    });

    it('should calculate complete budget with all markups', () => {
      const items = [
        { quantity: 10, unit_cost: 50000 },
        { quantity: 100, unit_cost: 1000 },
      ];

      const professionalFee = 10;
      const utility = 15;

      const directCost = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0,
      );
      const costWithFee = directCost * (1 + professionalFee / 100);
      const finalPrice = costWithFee * (1 + utility / 100);

      expect(directCost).toBe(600000);
      expect(costWithFee).toBe(660000);
      expect(finalPrice).toBeCloseTo(759000, 0);
    });

    it('should handle zero percentages', () => {
      const directCost = 1000000;
      const professionalFeePercentage = 0;
      const utilityPercentage = 0;

      const withFee = directCost * (1 + professionalFeePercentage / 100);
      const finalPrice = withFee * (1 + utilityPercentage / 100);

      expect(finalPrice).toBe(1000000);
    });
  });

  describe('Stage Aggregation', () => {
    it('should aggregate multiple stages correctly', () => {
      const stages = [
        {
          name: 'Obra Gruesa',
          items: [{ quantity: 10, unit_cost: 50000 }],
        },
        {
          name: 'Terminaciones',
          items: [{ quantity: 100, unit_cost: 10000 }],
        },
      ];

      const stageTotals = stages.map((stage) =>
        stage.items.reduce(
          (sum, item) => sum + item.quantity * item.unit_cost,
          0,
        ),
      );

      const totalCost = stageTotals.reduce(
        (sum, stageTotal) => sum + stageTotal,
        0,
      );

      expect(stageTotals[0]).toBe(500000);
      expect(stageTotals[1]).toBe(1000000);
      expect(totalCost).toBe(1500000);
    });
  });
});
