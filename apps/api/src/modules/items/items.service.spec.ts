import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { Item, ItemType, CubicationMode } from './item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const createMockItem = (overrides?: Partial<Item>): Item =>
  ({
    id: 'test-id',
    stage_id: 'stage-1',
    name: 'Item 1',
    type: ItemType.MATERIAL,
    description: 'Test item',
    quantity: 10,
    unit: 'kg',
    unit_cost: 100,
    unit_price: 150,
    total_cost: 1000,
    total_price: 1500,
    cost_code: 'CC001',
    position: 1,
    apu_template_id: 'apu-1',
    cubication_mode: CubicationMode.MANUAL,
    dim_length: 1,
    dim_width: 1,
    dim_height: 1,
    dim_thickness: 1,
    dim_count: 1,
    dim_holes: 0,
    formula: '',
    geometry_data: {},
    ifc_global_id: 'ifc-1',
    quantity_executed: 5,
    real_cost: 500,
    is_price_overridden: false,
    created_at: new Date(),
    updated_at: new Date(),
    stage: {} as any,
    calculateTotals: () => {},
    ...overrides,
  }) as Item;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

const mockAuditLogsService = () => ({
  logEvent: jest.fn().mockResolvedValue({}),
});

describe('ItemsService', () => {
  let service: ItemsService;
  let repository: jest.Mocked<Repository<Item>>;
  let auditService: jest.Mocked<AuditLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: getRepositoryToken(Item), useFactory: mockRepository },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    repository = module.get(getRepositoryToken(Item));
    auditService = module.get(AuditLogsService);
  });

  describe('create', () => {
    it('should create an item', async () => {
      const createDto = {
        stage_id: 'stage-1',
        name: 'Item 1',
        quantity: 10,
        unit_cost: 100,
        unit_price: 150,
      };
      const item = createMockItem(createDto);
      repository.create.mockReturnValue(item);
      repository.save.mockResolvedValue(item);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(item);
      expect(result).toEqual(item);
    });
  });

  describe('findAllByStage', () => {
    it('should return items for a stage', async () => {
      const items = [createMockItem({ id: '1' }), createMockItem({ id: '2' })];
      repository.find.mockResolvedValue(items);

      const result = await service.findAllByStage('stage-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { stage_id: 'stage-1' },
      });
      expect(result).toEqual(items);
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      const item = createMockItem();
      repository.findOne.mockResolvedValue(item);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(item);
    });

    it('should throw NotFoundException if item not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an item and log audit', async () => {
      const item = createMockItem();
      const updatedItem = createMockItem({ ...item, name: 'Updated Item' });
      repository.findOne.mockResolvedValue(item);
      repository.merge.mockReturnValue(updatedItem);
      repository.save.mockResolvedValue(updatedItem);

      const result = await service.update(
        'test-id',
        { name: 'Updated Item' },
        'user-1',
        'company-1',
      );
      expect(result.name).toBe('Updated Item');
      expect(auditService.logEvent).toHaveBeenCalled();
    });

    it('should update without audit when no user context', async () => {
      const item = createMockItem();
      const updatedItem = createMockItem({ ...item, name: 'Updated Item' });
      repository.findOne.mockResolvedValue(item);
      repository.merge.mockReturnValue(updatedItem);
      repository.save.mockResolvedValue(updatedItem);

      const result = await service.update('test-id', { name: 'Updated Item' });
      expect(result.name).toBe('Updated Item');
    });
  });

  describe('remove', () => {
    it('should remove an item', async () => {
      const item = createMockItem();
      repository.findOne.mockResolvedValue(item);
      repository.remove.mockResolvedValue(item);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(item);
      expect(result).toEqual({ deleted: true });
    });
  });
});
