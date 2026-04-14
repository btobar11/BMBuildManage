import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import {
  ScheduleTask,
  ScheduleMilestone,
  ScheduleResource,
  TaskStatus,
  TaskPriority,
} from './schedule.entity';

const mockTask = (overrides = {}): ScheduleTask =>
  ({
    id: 'task-1',
    project_id: 'project-1',
    name: 'Foundation work',
    description: 'Build foundation',
    start_date: new Date('2026-01-01'),
    end_date: new Date('2026-01-15'),
    progress: 50,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    company_id: 'company-1',
    parent_id: undefined as any,
    position: 1,
    duration: 15,
    dependency_days: 0,
    assigned_to: undefined as any,
    budget: undefined as any,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as any;

const mockMilestone = (overrides = {}): ScheduleMilestone =>
  ({
    id: 'milestone-1',
    project_id: 'project-1',
    name: 'Project Start',
    description: 'Kickoff',
    target_date: new Date('2026-01-01'),
    completed: false,
    completed_date: undefined as any,
    position: 1,
    company_id: 'company-1',
    created_at: new Date(),
    ...overrides,
  }) as any;

const mockResource = (overrides = {}): ScheduleResource => ({
  id: 'resource-1',
  company_id: 'company-1',
  project_id: 'project-1',
  resource_id: 'worker-1',
  resource_type: 'worker',
  start_date: new Date('2026-01-01'),
  end_date: new Date('2026-01-15'),
  allocation_percentage: 100,
  created_at: new Date(),
  ...overrides,
});

const mockTaskRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockMilestoneRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockResourceRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('ScheduleService', () => {
  let service: ScheduleService;
  let taskRepository: jest.Mocked<Repository<ScheduleTask>>;
  let milestoneRepository: jest.Mocked<Repository<ScheduleMilestone>>;
  let resourceRepository: jest.Mocked<Repository<ScheduleResource>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getRepositoryToken(ScheduleTask),
          useFactory: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(ScheduleMilestone),
          useFactory: mockMilestoneRepository,
        },
        {
          provide: getRepositoryToken(ScheduleResource),
          useFactory: mockResourceRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    taskRepository = module.get(getRepositoryToken(ScheduleTask));
    milestoneRepository = module.get(getRepositoryToken(ScheduleMilestone));
    resourceRepository = module.get(getRepositoryToken(ScheduleResource));
  });

  describe('getProjectSchedule', () => {
    it('should return project schedule with tasks, milestones, resources', async () => {
      const tasks = [mockTask(), mockTask({ id: 'task-2' })];
      const milestones = [mockMilestone()];
      const resources = [mockResource()];

      taskRepository.find.mockResolvedValue(tasks);
      milestoneRepository.find.mockResolvedValue(milestones);
      resourceRepository.find.mockResolvedValue(resources);

      const result = await service.getProjectSchedule('project-1');
      expect(result.tasks).toEqual(tasks);
      expect(result.milestones).toEqual(milestones);
      expect(result.resources).toEqual(resources);
      expect(result.stats).toBeDefined();
    });

    it('should calculate correct stats', async () => {
      const tasks = [
        mockTask({ status: TaskStatus.COMPLETED }),
        mockTask({ status: TaskStatus.IN_PROGRESS }),
        mockTask({ status: TaskStatus.DELAYED }),
      ];
      const milestones = [
        mockMilestone({ completed: true }),
        mockMilestone({ completed: false }),
      ];

      taskRepository.find.mockResolvedValue(tasks);
      milestoneRepository.find.mockResolvedValue(milestones);
      resourceRepository.find.mockResolvedValue([]);

      const result = await service.getProjectSchedule('project-1');
      expect(result.stats.totalTasks).toBe(3);
      expect(result.stats.completedTasks).toBe(1);
      expect(result.stats.inProgressTasks).toBe(1);
      expect(result.stats.delayedTasks).toBe(1);
      expect(result.stats.progress).toBe(33);
      expect(result.stats.totalMilestones).toBe(2);
      expect(result.stats.completedMilestones).toBe(1);
    });
  });

  describe('createTask', () => {
    it('should create a task with project_id', async () => {
      const data = { name: 'New Task', duration: 5 };
      const task = mockTask(data);
      taskRepository.create.mockReturnValue(task);
      taskRepository.save.mockResolvedValue(task);

      const result = await service.createTask('project-1', data);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...data,
        project_id: 'project-1',
      });
      expect(result).toEqual(task);
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const task = mockTask({ status: TaskStatus.PENDING });
      const updatedTask = { ...task, name: 'Updated Task' };
      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.updateTask('task-1', {
        name: 'Updated Task',
      });
      expect(result.name).toBe('Updated Task');
    });

    it('should mark task as completed when progress >= 100', async () => {
      const task = mockTask({ status: TaskStatus.PENDING, progress: 50 });
      const updatedTask = {
        ...task,
        progress: 100,
        status: TaskStatus.COMPLETED,
      };
      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.updateTask('task-1', { progress: 100 });
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.updateTask('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const task = mockTask();
      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.remove.mockResolvedValue(task);

      const result = await service.deleteTask('task-1');
      expect(taskRepository.remove).toHaveBeenCalledWith(task);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMilestone', () => {
    it('should create a milestone with project_id', async () => {
      const data = {
        name: 'Project Start',
        target_date: new Date('2026-01-01'),
      };
      const milestone = mockMilestone(data);
      milestoneRepository.create.mockReturnValue(milestone);
      milestoneRepository.save.mockResolvedValue(milestone);

      const result = await service.createMilestone('project-1', data);
      expect(milestoneRepository.create).toHaveBeenCalledWith({
        ...data,
        project_id: 'project-1',
      });
      expect(result).toEqual(milestone);
    });
  });

  describe('updateMilestone', () => {
    it('should update a milestone', async () => {
      const milestone = mockMilestone({ name: 'Old Name' });
      const updatedMilestone = { ...milestone, name: 'New Name' };
      milestoneRepository.findOne.mockResolvedValue(milestone);
      milestoneRepository.save.mockResolvedValue(updatedMilestone);

      const result = await service.updateMilestone('milestone-1', {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if milestone not found', async () => {
      milestoneRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMilestone('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addResource', () => {
    it('should add a resource with project_id', async () => {
      const data = { resource_id: 'worker-1', resource_type: 'worker' };
      const resource = mockResource(data);
      resourceRepository.create.mockReturnValue(resource);
      resourceRepository.save.mockResolvedValue(resource);

      const result = await service.addResource('project-1', data);
      expect(resourceRepository.create).toHaveBeenCalledWith({
        ...data,
        project_id: 'project-1',
      });
      expect(result).toEqual(resource);
    });
  });

  describe('getGanttData', () => {
    it('should return formatted gantt data', async () => {
      const tasks = [mockTask({ id: 'task-1', name: 'Task 1' })];
      const milestones = [mockMilestone({ id: 'milestone-1', name: 'M1' })];

      taskRepository.find.mockResolvedValue(tasks);
      milestoneRepository.find.mockResolvedValue(milestones);

      const result = await service.getGanttData('project-1');
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]).toMatchObject({
        id: 'task-1',
        name: 'Task 1',
        start: tasks[0].start_date,
        end: tasks[0].end_date,
        progress: 50,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dependencies: 0,
      });
      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0]).toMatchObject({
        id: 'milestone-1',
        name: 'M1',
        date: milestones[0].target_date,
        completed: false,
      });
    });
  });

  describe('calculateScheduleMetrics', () => {
    it('should return correct metrics', async () => {
      const tasks = [
        mockTask({ duration: 10, status: TaskStatus.COMPLETED }),
        mockTask({ duration: 5, status: TaskStatus.IN_PROGRESS }),
        mockTask({ duration: 15, status: TaskStatus.PENDING }),
      ];
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.calculateScheduleMetrics('project-1');
      expect(result.totalDuration).toBe(30);
      expect(result.completedDuration).toBe(10);
      expect(result.remainingDuration).toBe(20);
      expect(result.completionPercentage).toBe(33);
      expect(result.taskCount).toBe(3);
    });

    it('should return zero for empty project', async () => {
      taskRepository.find.mockResolvedValue([]);

      const result = await service.calculateScheduleMetrics('project-1');
      expect(result.totalDuration).toBe(0);
      expect(result.completedDuration).toBe(0);
      expect(result.remainingDuration).toBe(0);
      expect(result.completionPercentage).toBe(0);
      expect(result.taskCount).toBe(0);
    });
  });
});
