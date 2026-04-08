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
      const material = createMockMaterial();
      repository.create.mockReturnValue(material);
      repository.save.mockResolvedValue(material);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(material);
      expect(result).toEqual(material);
    });
  });

  describe('findAll', () => {
    it('should return all materials without search', async () => {
      const materials = [
        createMockMaterial({ id: '1' }),
        createMockMaterial({ id: '2' }),
      ];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith();
      expect(result).toEqual(materials);
    });

    it('should return materials matching search term in name', async () => {
      const materials = [createMockMaterial({ name: 'Cement' })];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll('cement');

      expect(repository.find).toHaveBeenCalledWith({
        where: [{ name: Like('%cement%') }, { category: Like('%cement%') }],
      });
      expect(result).toEqual(materials);
    });

    it('should return materials matching search term in category', async () => {
      const materials = [createMockMaterial({ category: 'construction' })];
      repository.find.mockResolvedValue(materials);

      const result = await service.findAll('construction');

      expect(repository.find).toHaveBeenCalledWith({
        where: [
          { name: Like('%construction%') },
          { category: Like('%construction%') },
        ],
      });
      expect(result).toEqual(materials);
    });
  });

  describe('findOne', () => {
    it('should return material by id', async () => {
      const material = createMockMaterial();
      repository.findOne.mockResolvedValue(material);

      const result = await service.findOne('material-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'material-1' },
      });
      expect(result).toEqual(material);
    });

    it('should throw NotFoundException when material not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove material', async () => {
      const material = createMockMaterial();
      repository.findOne.mockResolvedValue(material);
      repository.remove.mockResolvedValue(material);

      const result = await service.remove('material-1');

      expect(repository.remove).toHaveBeenCalledWith(material);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when removing nonexistent', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
