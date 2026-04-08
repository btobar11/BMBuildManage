import { Test, TestingModule } from '@nestjs/testing';
import { WorkerAssignmentsController } from './worker-assignments.controller';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockService = {
  create: jest.fn(),
  findAllByProject: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getSummaryByProject: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('WorkerAssignmentsController', () => {
  let controller: WorkerAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerAssignmentsController],
      providers: [
        {
          provide: WorkerAssignmentsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<WorkerAssignmentsController>(
      WorkerAssignmentsController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a worker assignment', async () => {
      const createDto: any = { worker_id: 'worker-1', project_id: 'proj-1' };
      const expected = { id: 'assignment-1', ...createDto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all assignments by project', async () => {
      const expected = [{ id: 'assignment-1', worker_id: 'worker-1' }];
      mockService.findAllByProject.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /summary/:projectId', () => {
    it('should return summary by project', async () => {
      const expected = { total: 10, active: 5 };
      mockService.getSummaryByProject.mockResolvedValue(expected);

      const result = await controller.getSummary('proj-1');

      expect(mockService.getSummaryByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single assignment', async () => {
      const expected = { id: 'assignment-1', worker_id: 'worker-1' };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('assignment-1');

      expect(mockService.findOne).toHaveBeenCalledWith('assignment-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update an assignment', async () => {
      const updateDto: any = { hours: 8 };
      const expected = { id: 'assignment-1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update('assignment-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith(
        'assignment-1',
        updateDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an assignment', async () => {
      mockService.remove.mockResolvedValue({ id: 'assignment-1' });

      const result = await controller.remove('assignment-1');

      expect(mockService.remove).toHaveBeenCalledWith('assignment-1');
      expect(result).toEqual({ id: 'assignment-1' });
    });
  });
});
