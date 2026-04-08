import { Test, TestingModule } from '@nestjs/testing';
import { ContingenciesController } from './contingencies.controller';
import { ContingenciesService } from './contingencies.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('ContingenciesController', () => {
  let controller: ContingenciesController;
  let service: ContingenciesService;

  const mockContingenciesService = {
    create: jest.fn(),
    findByProject: jest.fn(),
    totalByProject: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContingenciesController],
      providers: [
        {
          provide: ContingenciesService,
          useValue: mockContingenciesService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ContingenciesController>(ContingenciesController);
    service = module.get<ContingenciesService>(ContingenciesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a contingency', async () => {
      const createDto: any = {
        name: 'Test Contingency',
        project_id: 'proj-1',
        amount: 1000,
      };
      const expected = { id: 'contingency-1', ...createDto };
      mockContingenciesService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockContingenciesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /by-project/:projectId', () => {
    it('should return contingencies by project', async () => {
      const expected = [{ id: 'contingency-1', name: 'Contingency 1' }];
      mockContingenciesService.findByProject.mockResolvedValue(expected);

      const result = await controller.findByProject('proj-1');

      expect(mockContingenciesService.findByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /summary/:projectId', () => {
    it('should return summary by project', async () => {
      const expected = { total: 5000 };
      mockContingenciesService.totalByProject.mockResolvedValue(5000);

      const result = await controller.getSummary('proj-1');

      expect(mockContingenciesService.totalByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /total/:projectId', () => {
    it('should return total by project', async () => {
      const expected = 5000;
      mockContingenciesService.totalByProject.mockResolvedValue(expected);

      const result = await controller.totalByProject('proj-1');

      expect(mockContingenciesService.totalByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(5000);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a contingency', async () => {
      mockContingenciesService.remove.mockResolvedValue({
        id: 'contingency-1',
      });

      const result = await controller.remove('contingency-1');

      expect(mockContingenciesService.remove).toHaveBeenCalledWith(
        'contingency-1',
      );
      expect(result).toEqual({ id: 'contingency-1' });
    });
  });
});
