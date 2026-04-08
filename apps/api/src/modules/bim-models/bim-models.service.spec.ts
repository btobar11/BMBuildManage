import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BimModelsService } from './bim-models.service';
import { ProjectModel } from './project-model.entity';

const createMockModel = (overrides?: Partial<ProjectModel>): ProjectModel =>
  ({
    id: 'model-1',
    project_id: 'project-1',
    name: 'Test Model',
    storage_path: '/path/to/model.ifc',
    file_size: 1024000,
    created_at: new Date(),
    ...overrides,
  }) as ProjectModel;

const mockModelRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('BimModelsService', () => {
  let service: BimModelsService;
  let modelRepo: jest.Mocked<Repository<ProjectModel>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BimModelsService,
        {
          provide: getRepositoryToken(ProjectModel),
          useFactory: mockModelRepository,
        },
      ],
    }).compile();

    service = module.get<BimModelsService>(BimModelsService);
    modelRepo = module.get(getRepositoryToken(ProjectModel));
  });

  describe('getModelsByProject', () => {
    it('should return models for a project', async () => {
      const models = [createMockModel(), createMockModel({ id: 'model-2' })];
      modelRepo.find.mockResolvedValue(models);

      const result = await service.getModelsByProject('project-1');
      expect(modelRepo.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(models);
    });

    it('should return empty array when no models', async () => {
      modelRepo.find.mockResolvedValue([]);

      const result = await service.getModelsByProject('project-1');
      expect(result).toEqual([]);
    });
  });

  describe('createModel', () => {
    it('should create a model', async () => {
      const createData = { name: 'New Model', storage_path: '/path' };
      const model = createMockModel(createData);
      modelRepo.create.mockReturnValue(model);
      modelRepo.save.mockResolvedValue(model);

      const result = await service.createModel('project-1', createData);
      expect(modelRepo.create).toHaveBeenCalledWith({
        project_id: 'project-1',
        ...createData,
      });
      expect(modelRepo.save).toHaveBeenCalledWith(model);
      expect(result).toEqual(model);
    });
  });

  describe('deleteModel', () => {
    it('should delete a model', async () => {
      const model = createMockModel();
      modelRepo.findOne.mockResolvedValue(model);
      modelRepo.remove.mockResolvedValue(model);

      const result = await service.deleteModel('model-1');
      expect(modelRepo.remove).toHaveBeenCalledWith(model);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if model not found', async () => {
      modelRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteModel('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
