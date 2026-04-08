import { Test, TestingModule } from '@nestjs/testing';
import { BimClashesController } from './bim-clashes.controller';
import { BimClashesService } from './bim-clashes.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockBimClashesService = {
  createJob: jest.fn(),
  findAllJobs: jest.fn(),
  findOneJob: jest.fn(),
  getJobStatus: jest.fn(),
  findAllClashes: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeByJob: jest.fn(),
  getClashSummary: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('BimClashesController', () => {
  let controller: BimClashesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BimClashesController],
      providers: [
        { provide: BimClashesService, useValue: mockBimClashesService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BimClashesController>(BimClashesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = { user: { company_id: 'company-1' } };

  describe('createJob', () => {
    it('should create a clash job', async () => {
      const dto = {
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
      };
      const mockResult = { id: 'job-1', ...dto };
      mockBimClashesService.createJob.mockResolvedValue(mockResult);

      const result = await controller.createJob(dto, mockRequest);

      expect(mockBimClashesService.createJob).toHaveBeenCalledWith({
        ...dto,
        company_id: 'company-1',
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAllJobs', () => {
    it('should return all clash jobs', async () => {
      const mockResult = [{ id: 'job-1' }, { id: 'job-2' }];
      mockBimClashesService.findAllJobs.mockResolvedValue(mockResult);

      const result = await controller.findAllJobs(mockRequest);

      expect(mockBimClashesService.findAllJobs).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOneJob', () => {
    it('should return a single clash job', async () => {
      const mockResult = { id: 'job-1' };
      mockBimClashesService.findOneJob.mockResolvedValue(mockResult);

      const result = await controller.findOneJob('job-1', mockRequest);

      expect(mockBimClashesService.findOneJob).toHaveBeenCalledWith(
        'job-1',
        'company-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const mockResult = { status: 'completed', progress: 100 };
      mockBimClashesService.getJobStatus.mockResolvedValue(mockResult);

      const result = await controller.getJobStatus('job-1', mockRequest);

      expect(mockBimClashesService.getJobStatus).toHaveBeenCalledWith(
        'job-1',
        'company-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAllClashes', () => {
    it('should return all clashes with filters', async () => {
      const mockResult: any[] = [{ id: 'clash-1' }];
      mockBimClashesService.findAllClashes.mockResolvedValue(mockResult);

      const result = await controller.findAllClashes(
        mockRequest,
        'project-1',
        'model-1',
        'pending',
        'high',
        'hard',
      );

      expect(mockBimClashesService.findAllClashes).toHaveBeenCalledWith(
        'company-1',
        {
          projectId: 'project-1',
          modelId: 'model-1',
          status: 'pending',
          severity: 'high',
          type: 'hard',
        },
      );
      expect(result).toEqual(mockResult);
    });

    it('should return all clashes without filters', async () => {
      const mockResult: any[] = [];
      mockBimClashesService.findAllClashes.mockResolvedValue(mockResult);

      const result = await controller.findAllClashes(
        mockRequest,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(mockBimClashesService.findAllClashes).toHaveBeenCalledWith(
        'company-1',
        {
          projectId: undefined,
          modelId: undefined,
          status: undefined,
          severity: undefined,
          type: undefined,
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a single clash', async () => {
      const mockResult = { id: 'clash-1' };
      mockBimClashesService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('clash-1', mockRequest);

      expect(mockBimClashesService.findOne).toHaveBeenCalledWith(
        'clash-1',
        'company-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update a clash', async () => {
      const dto = { status: 'resolved' as const };
      const mockResult = { id: 'clash-1', status: 'resolved' };
      mockBimClashesService.update.mockResolvedValue(mockResult);

      const result = await controller.update('clash-1', dto, mockRequest);

      expect(mockBimClashesService.update).toHaveBeenCalledWith(
        'clash-1',
        'company-1',
        dto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should remove a clash', async () => {
      mockBimClashesService.remove.mockResolvedValue(undefined);

      await controller.remove('clash-1', mockRequest);

      expect(mockBimClashesService.remove).toHaveBeenCalledWith(
        'clash-1',
        'company-1',
      );
    });
  });

  describe('removeByJob', () => {
    it('should remove clashes by job', async () => {
      mockBimClashesService.removeByJob.mockResolvedValue(undefined);

      await controller.removeByJob('job-1', mockRequest);

      expect(mockBimClashesService.removeByJob).toHaveBeenCalledWith(
        'job-1',
        'company-1',
      );
    });
  });

  describe('getClashSummary', () => {
    it('should return clash summary', async () => {
      const mockResult = {
        totalJobs: 5,
        completedJobs: 3,
        totalClashes: 10,
      };
      mockBimClashesService.getClashSummary.mockResolvedValue(mockResult);

      const result = await controller.getClashSummary(mockRequest, 'project-1');

      expect(mockBimClashesService.getClashSummary).toHaveBeenCalledWith(
        'company-1',
        'project-1',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
