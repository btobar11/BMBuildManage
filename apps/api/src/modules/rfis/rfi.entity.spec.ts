import { Rfi, RfiStatus, RfiPriority } from './rfi.entity';

describe('Rfi Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create an RFI with custom values', () => {
      const rfi = new Rfi();
      rfi.id = 'uuid-1';
      rfi.project_id = 'project-uuid-1';
      rfi.title = 'Clarification on concrete specs';
      rfi.question = 'What is the exact mix ratio?';
      rfi.answer = '1:2:4 mix ratio';
      rfi.submitted_by = 'user-uuid-1';
      rfi.answered_by = 'engineer-uuid-1';
      rfi.due_date = new Date('2024-01-15');
      rfi.answered_at = new Date('2024-01-10');
      rfi.status = RfiStatus.ANSWERED;
      rfi.priority = RfiPriority.HIGH;
      rfi.category = 'Structural';

      expect(rfi.id).toBe('uuid-1');
      expect(rfi.title).toBe('Clarification on concrete specs');
      expect(rfi.status).toBe(RfiStatus.ANSWERED);
      expect(rfi.priority).toBe(RfiPriority.HIGH);
    });
  });

  describe('RfiStatus enum', () => {
    it('should have all statuses defined', () => {
      expect(RfiStatus.DRAFT).toBe('draft');
      expect(RfiStatus.SUBMITTED).toBe('submitted');
      expect(RfiStatus.UNDER_REVIEW).toBe('under_review');
      expect(RfiStatus.ANSWERED).toBe('answered');
      expect(RfiStatus.CLOSED).toBe('closed');
    });
  });

  describe('RfiPriority enum', () => {
    it('should have all priorities defined', () => {
      expect(RfiPriority.LOW).toBe('low');
      expect(RfiPriority.MEDIUM).toBe('medium');
      expect(RfiPriority.HIGH).toBe('high');
      expect(RfiPriority.URGENT).toBe('urgent');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const rfi = new Rfi();
      rfi.project = {} as any;
      expect(rfi.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const rfi = new Rfi();
      const requiredFields = [
        'id',
        'project_id',
        'title',
        'question',
        'answer',
        'submitted_by',
        'answered_by',
        'due_date',
        'answered_at',
        'status',
        'priority',
        'category',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(rfi).toHaveProperty(field);
      });
    });
  });
});
