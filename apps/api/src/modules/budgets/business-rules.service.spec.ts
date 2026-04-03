import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRulesService } from './business-rules.service';
import { BadRequestException } from '@nestjs/common';
import { CubicationMode } from '../items/item.entity';

describe('BusinessRulesService', () => {
  let service: BusinessRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessRulesService],
    }).compile();

    service = module.get<BusinessRulesService>(BusinessRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException for negative quantity', async () => {
    const budget: any = {
      stages: [
        {
          items: [
            { name: 'Test Item', quantity: -10, unit_price: 100 }
          ]
        }
      ]
    };

    await expect(service.validateBudget(budget)).rejects.toThrow(BadRequestException);
  });

  it('should return warnings for missing dimensions in DIMENSIONS mode', async () => {
    const budget: any = {
      stages: [
        {
          items: [
            { 
              name: 'Test Item', 
              quantity: 10, 
              cubication_mode: CubicationMode.DIMENSIONS,
              dim_length: 0,
              dim_width: 0
            }
          ]
        }
      ]
    };

    const warnings = await service.validateBudget(budget);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('no tiene dimensiones válidas');
  });

  it('should return warnings for execution overage', async () => {
    const budget: any = {
      stages: [
        {
          items: [
            { 
              name: 'Test Item', 
              quantity: 100, 
              quantity_executed: 110,
              unit_price: 100 
            }
          ]
        }
      ]
    };

    const warnings = await service.validateBudget(budget);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('ha superado su cantidad presupuestada');
  });
});
