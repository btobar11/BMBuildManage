import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { Resource, ResourceType } from './resource.entity';
import { ResourcePriceHistory } from './resource-price-history.entity';

const createMockResource = (overrides?: Partial<Resource>): Resource =>
  ({
    id: 'resource-1',
    company_id: 'company-1',
    name: 'Resource 1',
    type: 'material' as any,
    base_price: 100,
    unit_id: 'unit-1',
    supplier: 'Supplier 1',
    sku: 'SKU001',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as unknown as Resource;

const mockResourceRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

const mockHistoryRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockDataSource = () => ({
  query: jest.fn().mockResolvedValue([]),
});

let mockDS: { query: jest.Mock };

describe('ResourcesService', () => {
  let service: ResourcesService;
  let resourceRepo: jest.Mocked<Repository<Resource>>;
  let historyRepo: jest.Mocked<Repository<ResourcePriceHistory>>;
  const companyId = 'company-1';

  beforeEach(async () => {
    mockDS = mockDataSource();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getRepositoryToken(Resource), useFactory: mockResourceRepo },
        {
          provide: getRepositoryToken(ResourcePriceHistory),
          useFactory: mockHistoryRepo,
        },
        { provide: DataSource, useFactory: () => mockDS },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    resourceRepo = module.get(getRepositoryToken(Resource));
    historyRepo = module.get(getRepositoryToken(ResourcePriceHistory));
  });

  describe('create', () => {
    it('should create a resource', async () => {
      const createDto = {
        name: 'Resource 1',
        type: ResourceType.MATERIAL,
        base_price: 100,
      };
      const resource = createMockResource({
        company_id: companyId,
        ...createDto,
      });
      resourceRepo.create.mockReturnValue(resource);
      resourceRepo.save.mockResolvedValue(resource);

      const result = await service.create(companyId, createDto as any);
      expect(resourceRepo.create).toHaveBeenCalledWith({
        ...createDto,
        company_id: companyId,
      });
      expect(resourceRepo.save).toHaveBeenCalledWith(resource);
      expect(result).toEqual(resource);
    });
  });

  describe('findAll', () => {
    it('should return resources for a company', async () => {
      const resources = [
        createMockResource({ id: '1', company_id: companyId }),
        createMockResource({ id: '2', company_id: companyId }),
      ];
      resourceRepo.find.mockResolvedValue(resources);

      const result = await service.findAll({ companyId });
      expect(resourceRepo.find).toHaveBeenCalled();
      expect(result).toEqual(resources);
    });

    it('should return only global resources when tab is global', async () => {
      const resources = [createMockResource({ id: '1', company_id: undefined })];
      resourceRepo.find.mockResolvedValue(resources);

      const result = await service.findAll({ tab: 'global' });
      expect(result).toEqual(resources);
    });
  });

  describe('findOne', () => {
    it('should return a resource by id', async () => {
      const resource = createMockResource({ company_id: companyId });
      resourceRepo.findOne.mockResolvedValue(resource);

      const result = await service.findOne(companyId, 'resource-1');
      expect(resourceRepo.findOne).toHaveBeenCalledWith({
        where: [
          { id: 'resource-1', company_id: companyId },
          { id: 'resource-1', company_id: IsNull() },
        ],
        relations: ['price_history', 'unit'],
      });
      expect(result).toEqual(resource);
    });

    it('should throw NotFoundException if resource not found', async () => {
      resourceRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a resource', async () => {
      const resource = createMockResource({ company_id: companyId });
      const updated = { ...resource, base_price: 150 };
      resourceRepo.findOne.mockResolvedValue(resource);
      resourceRepo.merge.mockReturnValue(updated);
      resourceRepo.save.mockResolvedValue(updated);

      const result = await service.update(companyId, 'resource-1', {
        base_price: 150,
      });
      expect(result.base_price).toBe(150);
    });

    it('should record price history when price changes', async () => {
      const resource = createMockResource({
        company_id: companyId,
        base_price: 100,
      });
      const updated = { ...resource, base_price: 150 };
      resourceRepo.findOne.mockResolvedValue(resource);
      resourceRepo.merge.mockReturnValue(updated);
      resourceRepo.save.mockResolvedValue(updated);
      historyRepo.create.mockReturnValue({} as any);
      historyRepo.save.mockResolvedValue({} as any);

      await service.update(companyId, 'resource-1', { base_price: 150 });
      expect(historyRepo.create).toHaveBeenCalled();
      expect(historyRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a resource', async () => {
      const resource = createMockResource({ company_id: companyId });
      resourceRepo.findOne.mockResolvedValue(resource);
      resourceRepo.remove.mockResolvedValue(resource);

      const result = await service.remove(companyId, 'resource-1');
      expect(resourceRepo.remove).toHaveBeenCalledWith(resource);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw BadRequestException if resource is used', async () => {
      const resource = createMockResource({ company_id: companyId });
      resourceRepo.findOne.mockResolvedValue(resource);
      mockDS.query.mockResolvedValue([{ id: '1' }]);

      await expect(service.remove(companyId, 'resource-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findHistory', () => {
    it('should return price history for a resource', async () => {
      const resource = createMockResource({ company_id: companyId });
      resourceRepo.findOne.mockResolvedValue(resource);
      const history = [{ id: '1' }, { id: '2' }];
      historyRepo.find.mockResolvedValue(history as any);

      const result = await service.findHistory(companyId, 'resource-1');
      expect(historyRepo.find).toHaveBeenCalledWith({
        where: { resource_id: 'resource-1' },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(history);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple resources', async () => {
      const items = [{ name: 'R1' }, { name: 'R2' }];
      const resources = items.map((i, idx) =>
        createMockResource({
          id: String(idx),
          name: i.name,
          company_id: companyId,
        }),
      );
      resourceRepo.create.mockReturnValue(resources as any);
      resourceRepo.save.mockResolvedValue(resources as any);

      const result = await service.bulkCreate(companyId, items as any);
      expect(resourceRepo.save).toHaveBeenCalled();
      expect(result).toEqual(resources);
    });
  });
});
