import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApuService } from './apu.service';
import { ApuTemplate } from './apu-template.entity';
import { ApuResource } from './apu-resource.entity';
import { Resource, ResourceType } from '../resources/resource.entity';

const createMockApuTemplate = (overrides?: Partial<ApuTemplate>): ApuTemplate =>
  ({
    id: 'apu-template-1',
    company_id: 'company-1',
    name: 'Test APU',
    unit_id: 'unit-1',
    description: 'Test description',
    category: 'category-1',
    apu_resources: [],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as unknown as ApuTemplate;

const createMockApuResource = (overrides?: Partial<ApuResource>): ApuResource =>
  ({
    id: 'apu-resource-1',
    apu_id: 'apu-template-1',
    resource_id: 'resource-1',
    resource_type: ResourceType.MATERIAL,
    coefficient: 1,
    resource: {
      id: 'resource-1',
      name: 'Test Resource',
      base_price: 100,
    },
    ...overrides,
  }) as unknown as ApuResource;

const mockApuTemplateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

const mockApuResourceRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockResourceRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
});

const mockDataSource = () => ({
  query: jest.fn(),
});

describe('ApuService', () => {
  let service: ApuService;
  let apuTemplateRepo: jest.Mocked<Repository<ApuTemplate>>;
  let apuResourceRepo: jest.Mocked<Repository<ApuResource>>;
  let resourceRepo: jest.Mocked<Repository<Resource>>;
  let dataSource: jest.Mocked<DataSource>;
  const companyId = 'company-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApuService,
        {
          provide: getRepositoryToken(ApuTemplate),
          useFactory: mockApuTemplateRepository,
        },
        {
          provide: getRepositoryToken(ApuResource),
          useFactory: mockApuResourceRepository,
        },
        {
          provide: getRepositoryToken(Resource),
          useFactory: mockResourceRepository,
        },
        {
          provide: DataSource,
          useFactory: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ApuService>(ApuService);
    apuTemplateRepo = module.get(getRepositoryToken(ApuTemplate));
    apuResourceRepo = module.get(getRepositoryToken(ApuResource));
    resourceRepo = module.get(getRepositoryToken(Resource));
    dataSource = module.get(DataSource);
  });

  describe('create', () => {
    it('should create an APU template without resources', async () => {
      const createDto = {
        name: 'New APU',
      };
      const apuTemplate = createMockApuTemplate({
        company_id: companyId,
        ...createDto,
        unit_cost: 0,
      });
      apuTemplateRepo.create.mockReturnValue(apuTemplate as any);
      apuTemplateRepo.save.mockResolvedValue(apuTemplate);
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);

      const result = await service.create(companyId, createDto);

      expect(apuTemplateRepo.create).toHaveBeenCalledWith({
        ...createDto,
        company_id: companyId,
      });
      expect(apuTemplateRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New APU');
    });

    it('should create an APU template with resources', async () => {
      const createDto = {
        name: 'New APU with Resources',
        apu_resources: [
          {
            resource_id: 'resource-1',
            resource_type: ResourceType.MATERIAL,
            coefficient: 2,
          },
        ],
      };
      const apuTemplate = createMockApuTemplate({
        name: 'New APU with Resources',
        company_id: companyId,
        unit_cost: 0,
      } as any);
      const apuResource = createMockApuResource();

      apuTemplateRepo.create.mockReturnValue({
        ...apuTemplate,
        apu_resources: [apuResource],
      } as any);
      apuTemplateRepo.save.mockResolvedValue(apuTemplate);
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);
      resourceRepo.find.mockResolvedValue([{} as any]);
      const result = await service.create(companyId, createDto);

      expect(apuTemplateRepo.create).toHaveBeenCalled();
      expect(result.name).toBe('New APU with Resources');
    });
  });

  describe('findAll', () => {
    it('should return all templates for a company', async () => {
      const templates = [
        createMockApuTemplate({
          id: '1',
          name: 'APU 1',
          company_id: companyId,
        }),
        createMockApuTemplate({
          id: '2',
          name: 'APU 2',
          company_id: companyId,
        }),
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(templates),
      };
      apuTemplateRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(companyId);

      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should filter by search term', async () => {
      const templates = [
        createMockApuTemplate({ name: 'Concrete', company_id: companyId }),
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(templates),
      };
      apuTemplateRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(companyId, 'concrete');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'apu.name ILIKE :search',
        { search: '%concrete%' },
      );
      expect(result).toHaveLength(1);
    });

    it('should return only global templates when tab is global', async () => {
      const templates = [createMockApuTemplate({ company_id: undefined })];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(templates),
      };
      apuTemplateRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(companyId, undefined, 'global');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'apu.company_id IS NULL',
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no templates found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      apuTemplateRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(companyId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an APU template by id', async () => {
      const apuTemplate = createMockApuTemplate({
        company_id: companyId,
        unit_cost: 0,
      });
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);

      const result = await service.findOne(companyId, 'apu-template-1');

      expect(apuTemplateRepo.findOne).toHaveBeenCalledWith({
        where: [
          { id: 'apu-template-1', company_id: companyId },
          { id: 'apu-template-1', company_id: IsNull() },
        ],
        relations: ['apu_resources', 'apu_resources.resource', 'unit'],
      });
      expect(result.name).toBe('Test APU');
    });

    it('should throw NotFoundException if template not found', async () => {
      apuTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate unit cost', async () => {
      const apuTemplate = createMockApuTemplate({
        company_id: companyId,
        apu_resources: [
          createMockApuResource({
            coefficient: 2,
            resource: { base_price: 100 } as any,
          }),
          createMockApuResource({
            coefficient: 3,
            resource: { base_price: 50 } as any,
          }),
        ],
      });
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);

      const result = await service.findOne(companyId, 'apu-template-1');

      expect(result.unit_cost).toBe(350);
    });

    it('should return 0 unit cost when no resources', async () => {
      const apuTemplate = createMockApuTemplate({
        company_id: companyId,
        apu_resources: [],
      });
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);

      const result = await service.findOne(companyId, 'apu-template-1');

      expect(result.unit_cost).toBe(0);
    });
  });

  describe('update', () => {
    it('should update an APU template', async () => {
      const existingTemplate = createMockApuTemplate({ company_id: companyId });
      const updatedTemplate = createMockApuTemplate({
        company_id: companyId,
        name: 'Updated Name',
      });

      apuTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      apuTemplateRepo.merge.mockReturnValue(updatedTemplate as any);
      apuTemplateRepo.save.mockResolvedValue(updatedTemplate);
      apuTemplateRepo.findOne
        .mockResolvedValueOnce(existingTemplate)
        .mockResolvedValueOnce(updatedTemplate);

      const result = await service.update(companyId, 'apu-template-1', {
        name: 'Updated Name',
      });

      expect(apuTemplateRepo.merge).toHaveBeenCalled();
      expect(apuTemplateRepo.save).toHaveBeenCalled();
    });

    it('should update APU resources', async () => {
      const existingTemplate = createMockApuTemplate({
        company_id: companyId,
        apu_resources: [createMockApuResource()],
      });
      const updatedTemplate = createMockApuTemplate({ company_id: companyId });

      apuTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      apuResourceRepo.delete.mockResolvedValue({ affected: 1 } as any);
      apuTemplateRepo.merge.mockReturnValue(updatedTemplate as any);
      apuTemplateRepo.save.mockResolvedValue(updatedTemplate);
      apuTemplateRepo.findOne
        .mockResolvedValueOnce(existingTemplate)
        .mockResolvedValueOnce(updatedTemplate);
      resourceRepo.find.mockResolvedValue([{} as any]);
      await service.update(companyId, 'apu-template-1', {
        apu_resources: [
          {
            resource_id: 'new-resource',
            resource_type: ResourceType.LABOR,
            coefficient: 1,
          },
        ],
      });

      expect(apuResourceRepo.delete).toHaveBeenCalledWith({
        apu_id: 'apu-template-1',
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      apuTemplateRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(companyId, 'nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('duplicate', () => {
    it('should duplicate an APU template', async () => {
      const original = createMockApuTemplate({
        company_id: companyId,
        name: 'Original APU',
        apu_resources: [createMockApuResource()],
      });
      apuTemplateRepo.findOne.mockResolvedValue(original);
      const newTemplate = createMockApuTemplate({
        company_id: companyId,
        name: 'Original APU (copia)',
      });
      apuTemplateRepo.create.mockReturnValue(newTemplate as any);
      apuTemplateRepo.save.mockResolvedValue(newTemplate);
      apuTemplateRepo.findOne.mockResolvedValue(newTemplate);

      const result = await service.duplicate(companyId, 'apu-template-1');

      expect(apuTemplateRepo.create).toHaveBeenCalled();
      expect(result.name).toBe('Original APU (copia)');
    });
  });

  describe('importGlobalLibrary', () => {
    it('should import global templates', async () => {
      const globalTemplates = [
        createMockApuTemplate({
          company_id: undefined,
          name: 'Global APU',
          apu_resources: [],
        }),
      ];

      apuTemplateRepo.find
        .mockResolvedValueOnce(globalTemplates)
        .mockResolvedValueOnce(null as any);
      apuResourceRepo.create.mockReturnValue({} as any);
      apuResourceRepo.save.mockResolvedValue({} as any);
      apuTemplateRepo.create.mockReturnValue({} as any);
      apuTemplateRepo.save.mockResolvedValue({} as any);

      const result = await service.importGlobalLibrary(companyId);

      expect(result.imported).toBe(1);
      expect(result.message).toContain('importaron');
    });

    it('should return message when no global templates', async () => {
      apuTemplateRepo.find.mockResolvedValue([]);

      const result = await service.importGlobalLibrary(companyId);

      expect(result.imported).toBe(0);
      expect(result.message).toBe('No hay plantillas globales para importar');
    });

    it('should skip existing templates', async () => {
      const globalTemplates = [
        createMockApuTemplate({ company_id: undefined, name: 'Existing APU' }),
      ];

      apuTemplateRepo.find
        .mockResolvedValueOnce(globalTemplates)
        .mockResolvedValueOnce(globalTemplates[0] as any);
      apuTemplateRepo.findOne.mockResolvedValue(globalTemplates[0] as any);

      const result = await service.importGlobalLibrary(companyId);

      expect(result.imported).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove an APU template', async () => {
      const apuTemplate = createMockApuTemplate({ company_id: companyId });
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);
      dataSource.query.mockResolvedValue([]);
      apuTemplateRepo.remove.mockResolvedValue(apuTemplate);

      const result = await service.remove(companyId, 'apu-template-1');

      expect(apuTemplateRepo.remove).toHaveBeenCalledWith(apuTemplate);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if template not found', async () => {
      apuTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if template is in use', async () => {
      const apuTemplate = createMockApuTemplate({ company_id: companyId });
      apuTemplateRepo.findOne.mockResolvedValue(apuTemplate);
      dataSource.query.mockResolvedValue([{ id: 'item-1' }]);

      await expect(service.remove(companyId, 'apu-template-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateUnitCost', () => {
    it('should calculate correct unit cost', () => {
      const template = createMockApuTemplate({
        apu_resources: [
          createMockApuResource({
            coefficient: 2,
            resource: { base_price: 100 } as any,
          }),
          createMockApuResource({
            coefficient: 0.5,
            resource: { base_price: 200 } as any,
          }),
        ],
      });

      const result = (service as any).calculateUnitCost(template);

      expect(result).toBe(300);
    });

    it('should handle null resource prices', () => {
      const template = createMockApuTemplate({
        apu_resources: [
          createMockApuResource({
            coefficient: 1,
            resource: { base_price: null } as any,
          }),
        ],
      });

      const result = (service as any).calculateUnitCost(template);

      expect(result).toBe(0);
    });

    it('should return 0 for template without resources', () => {
      const template = createMockApuTemplate({ apu_resources: undefined });

      const result = (service as any).calculateUnitCost(template);

      expect(result).toBe(0);
    });
  });
});
