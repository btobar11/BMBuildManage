import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { Material } from './material.entity';

const createMockMaterial = (overrides?: Partial<Material>): Material =>
  ({
    id: 'material-1',
    name: 'Cement',
    category: 'construction',
    unit: 'kg',
    default_price: 0.5,
    supplier: 'Supplier 1',
    created_at: new Date(),
    ...overrides,
  }) as unknown as Material;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('MaterialsService', () => {
  let service: MaterialsService;
  let repository: jest.Mocked<Repository<Material>>;
  const companyId = 'test-company-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: getRepositoryToken(Material), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
    repository = module.get(getRepositoryToken(Material));
  });

  describe('create', () => {
    it('should create a material', async () => {
      const createDto = {
        name: 'Cement',
        category: 'construction',
        unit: 'kg',
        default_price: 0.5,
        supplier: 'Supplier 1',
      };
      const material = createMockMaterial({ company_id: companyId });
      repository.create.mockReturnValue(material);
      repository.save.mockResolvedValue(material);

      const result = await service.create(companyId, createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        company_id: companyId,
      });
      expect(repository.save).toHaveBeenCalledWith(material);
      expect(result).toEqual(material);
    });
  });

  describe('findAll', () => {
    it('should return all materials without search', async () => {
      const materials = [
        createMockMaterial({ id: '1', company_id: companyId }),
        createMockMaterial({ id: '2', company_id: companyId }),
      ];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll(companyId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { company_id: companyId },
      });
      expect(result).toEqual(materials);
    });

    it('should return materials matching search term in name', async () => {
      const materials = [
        createMockMaterial({ name: 'Cement', company_id: companyId }),
      ];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll(companyId, 'cement');

      expect(repository.find).toHaveBeenCalledWith({
        where: [
          { company_id: companyId, name: Like('%cement%') },
          { company_id: companyId, category: Like('%cement%') },
        ],
      });
      expect(result).toEqual(materials);
    });

    it('should return materials matching search term in category', async () => {
      const materials = [
        createMockMaterial({ category: 'construction', company_id: companyId }),
      ];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll(companyId, 'construction');

      expect(repository.find).toHaveBeenCalledWith({
        where: [
          { company_id: companyId, name: Like('%construction%') },
          { company_id: companyId, category: Like('%construction%') },
        ],
      });
      expect(result).toEqual(materials);
    });
  });

  describe('findOne', () => {
    it('should return material by id', async () => {
      const material = createMockMaterial({ company_id: companyId });
      repository.findOne.mockResolvedValue(material);

      const result = await service.findOne(companyId, 'material-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'material-1', company_id: companyId },
      });
      expect(result).toEqual(material);
    });

    it('should throw NotFoundException when material not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove material', async () => {
      const material = createMockMaterial({ company_id: companyId });
      repository.findOne.mockResolvedValue(material);
      repository.remove.mockResolvedValue(material);

      const result = await service.remove(companyId, 'material-1');

      expect(repository.remove).toHaveBeenCalledWith(material);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when removing nonexistent', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
