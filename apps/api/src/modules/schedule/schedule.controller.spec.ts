import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: ScheduleService;

  const mockScheduleService = {
    getProjectSchedule: jest.fn(),
    getGanttData: jest.fn(),
    calculateScheduleMetrics: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: ScheduleService,
          useValue: mockScheduleService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ScheduleController>(ScheduleController);
    service = module.get<ScheduleService>(ScheduleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:projectId', () => {
    it('should return project schedule', async () => {
      const expected = { tasks: [], milestones: [] };
      mockScheduleService.getProjectSchedule.mockResolvedValue(expected);

      const result = await controller.getSchedule('proj-1');

      expect(mockScheduleService.getProjectSchedule).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:projectId/gantt', () => {
    it('should return gantt data', async () => {
      const expected = { data: [] };
      mockScheduleService.getGanttData.mockResolvedValue(expected);

      const result = await controller.getGanttData('proj-1');

      expect(mockScheduleService.getGanttData).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:projectId/metrics', () => {
    it('should return schedule metrics', async () => {
      const expected = { progress: 50, onTime: true };
      mockScheduleService.calculateScheduleMetrics.mockResolvedValue(expected);

      const result = await controller.getMetrics('proj-1');

      expect(mockScheduleService.calculateScheduleMetrics).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });

    it('should handle metrics error', async () => {
      mockScheduleService.calculateScheduleMetrics.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(controller.getMetrics('proj-1')).rejects.toThrow();
    });
  });

  describe('POST /:projectId/tasks', () => {
    it('should create a task', async () => {
      const dto = {
        name: 'Task 1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      const expected = { id: 'task-1', ...dto };
      mockScheduleService.createTask.mockResolvedValue(expected);

      const result = await controller.createTask('proj-1', dto);

      expect(mockScheduleService.createTask).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('should create task with priority conversion', async () => {
      const dto = {
        name: 'Task 1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        priority: 'HIGH' as any,
      };
      mockScheduleService.createTask.mockResolvedValue({ id: 'task-1' });

      await controller.createTask('proj-1', dto);
      expect(mockScheduleService.createTask).toHaveBeenCalled();
    });

    it('should handle create task error', async () => {
      mockScheduleService.createTask.mockRejectedValue(
        new Error('Validation error'),
      );

      await expect(
        controller.createTask('proj-1', {
          name: 'Task',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        }),
      ).rejects.toThrow();
    });
  });

  describe('PATCH /tasks/:taskId', () => {
    it('should update a task', async () => {
      const dto = { progress: 50 };
      const expected = { id: 'task-1', ...dto };
      mockScheduleService.updateTask.mockResolvedValue(expected);

      const result = await controller.updateTask('task-1', dto);

      expect(mockScheduleService.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.any(Object),
      );
      expect(result).toEqual(expected);
    });

    it('should update task with status conversion', async () => {
      const dto = { status: 'in_progress' as any };
      mockScheduleService.updateTask.mockResolvedValue({ id: 'task-1' });

      await controller.updateTask('task-1', dto);
      expect(mockScheduleService.updateTask).toHaveBeenCalled();
    });

    it('should handle update task error', async () => {
      mockScheduleService.updateTask.mockRejectedValue(new Error('Not found'));

      await expect(controller.updateTask('fake-id', {})).rejects.toThrow();
    });
  });

  describe('DELETE /tasks/:taskId', () => {
    it('should delete a task', async () => {
      mockScheduleService.deleteTask.mockResolvedValue({ id: 'task-1' });

      const result = await controller.deleteTask('task-1');

      expect(mockScheduleService.deleteTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({ id: 'task-1' });
    });
  });

  describe('POST /:projectId/milestones', () => {
    it('should create a milestone', async () => {
      const dto = { name: 'Milestone 1', target_date: '2024-02-01' };
      const expected = { id: 'milestone-1', ...dto };
      mockScheduleService.createMilestone.mockResolvedValue(expected);

      const result = await controller.createMilestone('proj-1', dto);

      expect(mockScheduleService.createMilestone).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /milestones/:milestoneId', () => {
    it('should update a milestone', async () => {
      const dto = { target_date: '2024-03-01' };
      const expected = { id: 'milestone-1', ...dto };
      mockScheduleService.updateMilestone.mockResolvedValue(expected);

      const result = await controller.updateMilestone('milestone-1', dto);

      expect(mockScheduleService.updateMilestone).toHaveBeenCalledWith(
        'milestone-1',
        expect.any(Object),
      );
      expect(result).toEqual(expected);
    });

    it('should handle update milestone error', async () => {
      mockScheduleService.updateMilestone.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.updateMilestone('fake-id', {})).rejects.toThrow();
    });
  });
});
