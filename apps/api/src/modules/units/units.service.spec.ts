import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitsService } from './units.service';
import { Unit, UnitCategory } from './unit.entity';

const createMockUnit = (overrides?: Partial<Unit>): Unit =>
  ({
    id: 'unit-1',
    name: 'Metro Cuadrado',
    symbol: 'm2',
    category: UnitCategory.AREA,
    ...overrides,
  }) as Unit;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
});

describe('UnitsService', () => {
  let service: UnitsService;
  let repository: jest.Mocked<Repository<Unit>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: getRepositoryToken(Unit), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    repository = module.get(getRepositoryToken(Unit));
  });

  describe('findAll', () => {
    it('should return all units', async () => {
      const units = [createMockUnit({ id: '1' }), createMockUnit({ id: '2' })];
      repository.find.mockResolvedValue(units);

      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalledWith({
        order: { category: 'ASC', name: 'ASC' },
      });
      expect(result).toEqual(units);
    });
  });

  describe('findOne', () => {
    it('should return a unit by id', async () => {
      const unit = createMockUnit();
      repository.findOne.mockResolvedValue(unit);

      const result = await service.findOne('unit-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
      });
      expect(result).toEqual(unit);
    });

    it('should return null if unit not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a unit', async () => {
      const data = {
        name: 'New Unit',
        symbol: 'nu',
        category: UnitCategory.QUANTITY,
      };
      const unit = createMockUnit(data);
      repository.create.mockReturnValue(unit);
      repository.save.mockResolvedValue(unit);

      const result = await service.create(data);
      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(unit);
      expect(result).toEqual(unit);
    });
  });

  describe('onModuleInit', () => {
    it('should seed defaults when count is 0', async () => {
      repository.count.mockResolvedValue(0);
      repository.create.mockImplementation((data) => data as Unit);
      repository.save.mockResolvedValue([]);

      await service.onModuleInit();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not seed when units exist', async () => {
      repository.count.mockResolvedValue(5);

      await service.onModuleInit();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
