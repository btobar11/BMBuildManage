import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockUnitsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('UnitsController', () => {
  let controller: UnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [
        {
          provide: UnitsService,
          useValue: mockUnitsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all units', async () => {
      const expected = [{ id: 'unit-1', name: 'kg' }];
      mockUnitsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(mockUnitsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single unit', async () => {
      const expected = { id: 'unit-1', name: 'kg' };
      mockUnitsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('unit-1');

      expect(mockUnitsService.findOne).toHaveBeenCalledWith('unit-1');
      expect(result).toEqual(expected);
    });
  });

  describe('POST /', () => {
    it('should create a unit', async () => {
      const data: any = { name: 'kg', symbol: 'kg' };
      const expected = { id: 'unit-1', ...data };
      mockUnitsService.create.mockResolvedValue(expected);

      const result = await controller.create(data);

      expect(mockUnitsService.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expected);
    });
  });
});
