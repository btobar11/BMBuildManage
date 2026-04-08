import { Project, ProjectStatus } from './project.entity';

describe('Project Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a project with default status', () => {
      const project = new Project();

      expect(project.status).toBeUndefined();
      expect(project.estimated_budget).toBeUndefined();
      expect(project.estimated_price).toBeUndefined();
    });

    it('should create a project with custom values', () => {
      const project = new Project();
      project.id = 'uuid-1';
      project.company_id = 'company-uuid-1';
      project.client_id = 'client-uuid-1';
      project.name = 'Building A';
      project.description = 'Office building';
      project.location = 'Downtown';
      project.type = 'Commercial';
      project.folder = '/projects/building-a';
      project.status = ProjectStatus.IN_PROGRESS;
      project.start_date = new Date('2024-01-01');
      project.end_date = new Date('2025-01-01');
      project.estimated_budget = 1000000;
      project.estimated_price = 1500000;

      expect(project.id).toBe('uuid-1');
      expect(project.company_id).toBe('company-uuid-1');
      expect(project.name).toBe('Building A');
      expect(project.status).toBe(ProjectStatus.IN_PROGRESS);
    });
  });

  describe('ProjectStatus enum', () => {
    it('should have all required status values', () => {
      expect(ProjectStatus.DRAFT).toBe('draft');
      expect(ProjectStatus.SENT).toBe('sent');
      expect(ProjectStatus.APPROVED).toBe('approved');
      expect(ProjectStatus.IN_PROGRESS).toBe('in_progress');
      expect(ProjectStatus.COMPLETED).toBe('completed');
    });
  });

  describe('name field constraints', () => {
    it('should accept name within 300 characters', () => {
      const project = new Project();
      project.name = 'A'.repeat(300);

      expect(project.name.length).toBe(300);
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const project = new Project();
      project.company = {} as any;

      expect(project.company).toBeDefined();
    });

    it('should have client relationship', () => {
      const project = new Project();
      project.client = {} as any;

      expect(project.client).toBeDefined();
    });

    it('should have budgets relationship', () => {
      const project = new Project();
      project.budgets = [];

      expect(project.budgets).toEqual([]);
    });

    it('should have expenses relationship', () => {
      const project = new Project();
      project.expenses = [];

      expect(project.expenses).toEqual([]);
    });

    it('should have worker_assignments relationship', () => {
      const project = new Project();
      project.worker_assignments = [];

      expect(project.worker_assignments).toEqual([]);
    });

    it('should have worker_payments relationship', () => {
      const project = new Project();
      project.worker_payments = [];

      expect(project.worker_payments).toEqual([]);
    });

    it('should have documents relationship', () => {
      const project = new Project();
      project.documents = [];

      expect(project.documents).toEqual([]);
    });

    it('should have project_payments relationship', () => {
      const project = new Project();
      project.project_payments = [];

      expect(project.project_payments).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should import required TypeORM decorators', () => {
      const project = new Project();

      expect(project).toBeInstanceOf(Object);
      expect(project).toHaveProperty('id');
    });

    it('should have all required columns defined', () => {
      const project = new Project();

      const requiredFields = [
        'id',
        'company_id',
        'client_id',
        'name',
        'description',
        'location',
        'type',
        'folder',
        'status',
        'start_date',
        'end_date',
        'estimated_budget',
        'estimated_price',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(project).toHaveProperty(field);
      });
    });
  });
});
