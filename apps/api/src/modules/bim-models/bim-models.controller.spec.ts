import { Test, TestingModule } from '@nestjs/testing';
import { BimModelsController } from './bim-models.controller';
import { BimModelsService } from './bim-models.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockBimModelsService = {
  getModelsByProject: jest.fn(),
  uploadModel: jest.fn(),
  deleteModel: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('BimModelsController', () => {
  let controller: BimModelsController;

  const mockRequest = {
    user: {
      company_id: 'test-company-id',
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'admin',
    },
  };

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

      const result = await controller.getModels(mockRequest, 'project-1');

      expect(mockBimModelsService.getModelsByProject).toHaveBeenCalledWith(
        'project-1',
        'test-company-id',
      );
      expect(result).toEqual(mockResult);
    });

    it('should return empty array when no projectId provided', async () => {
      const result = await controller.getModels(mockRequest);
      expect(result).toEqual([]);
    });
  });

  describe('uploadModel', () => {
    it('should upload a model', async () => {
      const mockFile = {
        originalname: 'test.ifc',
        buffer: Buffer.from('test'),
        size: 1000,
        mimetype: 'application/octet-stream',
      };
      const mockResult = { success: true, model: { id: 'model-1' } };
      mockBimModelsService.uploadModel.mockResolvedValue(mockResult);

      const result = await controller.uploadModel(
        mockFile,
        'project-1',
        mockRequest,
      );

      expect(mockBimModelsService.uploadModel).toHaveBeenCalledWith(
        'project-1',
        mockFile,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteModel', () => {
    it('should delete a model', async () => {
      const mockResult = { success: true };
      mockBimModelsService.deleteModel.mockResolvedValue(mockResult);

      const result = await controller.deleteModel('model-1', mockRequest);

      expect(mockBimModelsService.deleteModel).toHaveBeenCalledWith(
        'model-1',
        'test-company-id',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
