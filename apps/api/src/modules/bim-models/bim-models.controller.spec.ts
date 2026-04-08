import { Test, TestingModule } from '@nestjs/testing';
import { BimModelsController } from './bim-models.controller';
import { BimModelsService } from './bim-models.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockBimModelsService = {
  getModelsByProject: jest.fn(),
  createModel: jest.fn(),
  deleteModel: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('BimModelsController', () => {
  let controller: BimModelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BimModelsController],
      providers: [
        { provide: BimModelsService, useValue: mockBimModelsService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BimModelsController>(BimModelsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getModels', () => {
    it('should return models by project', async () => {
      const mockResult = [{ id: 'model-1' }, { id: 'model-2' }];
      mockBimModelsService.getModelsByProject.mockResolvedValue(mockResult);

      const result = await controller.getModels('project-1');

      expect(mockBimModelsService.getModelsByProject).toHaveBeenCalledWith(
        'project-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createModel', () => {
    it('should create a model', async () => {
      const dto = { name: 'Test Model', file_url: 'http://test.com' };
      const mockResult = { id: 'model-1', project_id: 'project-1', ...dto };
      mockBimModelsService.createModel.mockResolvedValue(mockResult);

      const result = await controller.createModel('project-1', dto);

      expect(mockBimModelsService.createModel).toHaveBeenCalledWith(
        'project-1',
        dto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteModel', () => {
    it('should delete a model', async () => {
      const mockResult = { success: true };
      mockBimModelsService.deleteModel.mockResolvedValue(mockResult);

      const result = await controller.deleteModel('model-1');

      expect(mockBimModelsService.deleteModel).toHaveBeenCalledWith('model-1');
      expect(result).toEqual(mockResult);
    });
  });
});
