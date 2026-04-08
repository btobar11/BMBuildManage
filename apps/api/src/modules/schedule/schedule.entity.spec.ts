import {
  ScheduleTask,
  ScheduleMilestone,
  ScheduleResource,
  TaskStatus,
  TaskPriority,
} from './schedule.entity';

describe('ScheduleTask Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a task with custom values', () => {
      const task = new ScheduleTask();
      task.id = 'uuid-1';
      task.project_id = 'project-uuid-1';
      task.name = 'Foundation Work';
      task.description = 'Test description';
      task.start_date = new Date('2024-01-01');
      task.end_date = new Date('2024-01-31');
      task.progress = 50;
      task.status = TaskStatus.IN_PROGRESS;
      task.priority = TaskPriority.HIGH;
      task.parent_id = 'parent-uuid-1';
      task.position = 1;
      task.duration = 30;
      task.dependency_days = 5;
      task.assigned_to = 'user-uuid-1';
      task.budget = 50000;

      expect(task.id).toBe('uuid-1');
      expect(task.name).toBe('Foundation Work');
      expect(task.progress).toBe(50);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task.priority).toBe(TaskPriority.HIGH);
    });
  });

  describe('TaskStatus enum', () => {
    it('should have all statuses defined', () => {
      expect(TaskStatus.PENDING).toBe('pending');
      expect(TaskStatus.IN_PROGRESS).toBe('in_progress');
      expect(TaskStatus.COMPLETED).toBe('completed');
      expect(TaskStatus.DELAYED).toBe('delayed');
    });
  });

  describe('TaskPriority enum', () => {
    it('should have all priorities defined', () => {
      expect(TaskPriority.LOW).toBe('low');
      expect(TaskPriority.MEDIUM).toBe('medium');
      expect(TaskPriority.HIGH).toBe('high');
      expect(TaskPriority.CRITICAL).toBe('critical');
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const task = new ScheduleTask();
      const requiredFields = [
        'id',
        'project_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'progress',
        'status',
        'priority',
        'parent_id',
        'position',
        'duration',
        'dependency_days',
        'assigned_to',
        'budget',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(task).toHaveProperty(field);
      });
    });
  });
});

describe('ScheduleMilestone Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a milestone with custom values', () => {
      const milestone = new ScheduleMilestone();
      milestone.id = 'uuid-1';
      milestone.project_id = 'project-uuid-1';
      milestone.name = 'Project Start';
      milestone.description = 'Test milestone';
      milestone.target_date = new Date('2024-01-01');
      milestone.completed = true;
      milestone.completed_date = new Date('2024-01-01');
      milestone.position = 1;

      expect(milestone.id).toBe('uuid-1');
      expect(milestone.name).toBe('Project Start');
      expect(milestone.completed).toBe(true);
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const milestone = new ScheduleMilestone();
      const requiredFields = [
        'id',
        'project_id',
        'name',
        'description',
        'target_date',
        'completed',
        'completed_date',
        'position',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(milestone).toHaveProperty(field);
      });
    });
  });
});

describe('ScheduleResource Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a resource with custom values', () => {
      const resource = new ScheduleResource();
      resource.id = 'uuid-1';
      resource.project_id = 'project-uuid-1';
      resource.resource_id = 'resource-uuid-1';
      resource.resource_type = 'labor';
      resource.start_date = new Date('2024-01-01');
      resource.end_date = new Date('2024-01-31');
      resource.allocation_percentage = 50;

      expect(resource.id).toBe('uuid-1');
      expect(resource.resource_type).toBe('labor');
      expect(resource.allocation_percentage).toBe(50);
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const resource = new ScheduleResource();
      const requiredFields = [
        'id',
        'project_id',
        'resource_id',
        'resource_type',
        'start_date',
        'end_date',
        'allocation_percentage',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(resource).toHaveProperty(field);
      });
    });
  });
});
