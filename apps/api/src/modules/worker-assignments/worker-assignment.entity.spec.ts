import { WorkerAssignment } from './worker-assignment.entity';

describe('WorkerAssignment Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a worker assignment with custom values', () => {
      const assignment = new WorkerAssignment();
      assignment.id = 'uuid-1';
      assignment.worker_id = 'worker-uuid-1';
      assignment.project_id = 'project-uuid-1';
      assignment.daily_rate = 100;
      assignment.start_date = new Date('2024-01-01');
      assignment.end_date = new Date('2024-01-31');
      assignment.performance_rating = 4.5;
      assignment.performance_notes = 'Excellent work';
      assignment.task_description = 'Foundation work';
      assignment.total_paid = 2000;

      expect(assignment.id).toBe('uuid-1');
      expect(assignment.worker_id).toBe('worker-uuid-1');
      expect(assignment.project_id).toBe('project-uuid-1');
      expect(assignment.daily_rate).toBe(100);
      expect(assignment.performance_rating).toBe(4.5);
      expect(assignment.total_paid).toBe(2000);
    });
  });

  describe('relationship fields', () => {
    it('should have worker relationship', () => {
      const assignment = new WorkerAssignment();
      assignment.worker = {} as any;
      expect(assignment.worker).toBeDefined();
    });

    it('should have project relationship', () => {
      const assignment = new WorkerAssignment();
      assignment.project = {} as any;
      expect(assignment.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const assignment = new WorkerAssignment();
      const requiredFields = [
        'id',
        'worker_id',
        'project_id',
        'daily_rate',
        'start_date',
        'end_date',
        'performance_rating',
        'performance_notes',
        'task_description',
        'total_paid',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(assignment).toHaveProperty(field);
      });
    });
  });
});
