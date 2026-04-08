import {
  Submittal,
  SubmittalStatus,
  SubmittalPriority,
  SubmittalType,
} from './submittal.entity';

describe('Submittal Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a submittal with custom values', () => {
      const submittal = new Submittal();
      submittal.id = 'uuid-1';
      submittal.project_id = 'project-uuid-1';
      submittal.title = 'Steel Shop Drawings';
      submittal.description = 'Test description';
      submittal.type = SubmittalType.SHOP_DRAWINGS;
      submittal.status = SubmittalStatus.SUBMITTED;
      submittal.priority = SubmittalPriority.HIGH;
      submittal.spec_section = '05 10 00';
      submittal.submitted_by = 'user-uuid-1';
      submittal.reviewed_by = 'engineer-uuid-1';
      submittal.due_date = new Date('2024-01-15');
      submittal.submitted_date = new Date('2024-01-10');
      submittal.reviewed_date = new Date('2024-01-12');
      submittal.comments = 'Approved with comments';
      submittal.document_url = 'https://example.com/doc.pdf';

      expect(submittal.id).toBe('uuid-1');
      expect(submittal.title).toBe('Steel Shop Drawings');
      expect(submittal.status).toBe(SubmittalStatus.SUBMITTED);
      expect(submittal.priority).toBe(SubmittalPriority.HIGH);
    });
  });

  describe('SubmittalStatus enum', () => {
    it('should have all statuses defined', () => {
      expect(SubmittalStatus.DRAFT).toBe('draft');
      expect(SubmittalStatus.SUBMITTED).toBe('submitted');
      expect(SubmittalStatus.UNDER_REVIEW).toBe('under_review');
      expect(SubmittalStatus.APPROVED).toBe('approved');
      expect(SubmittalStatus.REJECTED).toBe('rejected');
      expect(SubmittalStatus.REVISION_REQUESTED).toBe('revision_requested');
    });
  });

  describe('SubmittalPriority enum', () => {
    it('should have all priorities defined', () => {
      expect(SubmittalPriority.LOW).toBe('low');
      expect(SubmittalPriority.MEDIUM).toBe('medium');
      expect(SubmittalPriority.HIGH).toBe('high');
      expect(SubmittalPriority.URGENT).toBe('urgent');
    });
  });

  describe('SubmittalType enum', () => {
    it('should have all types defined', () => {
      expect(SubmittalType.SHOP_DRAWINGS).toBe('shop_drawings');
      expect(SubmittalType.PRODUCT_DATA).toBe('product_data');
      expect(SubmittalType.SAMPLES).toBe('samples');
      expect(SubmittalType.CERTIFICATES).toBe('certificates');
      expect(SubmittalType.MANUALS).toBe('manuals');
      expect(SubmittalType.OTHER).toBe('other');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const submittal = new Submittal();
      submittal.project = {} as any;
      expect(submittal.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const submittal = new Submittal();
      const requiredFields = [
        'id',
        'project_id',
        'title',
        'description',
        'type',
        'status',
        'priority',
        'spec_section',
        'submitted_by',
        'reviewed_by',
        'due_date',
        'submitted_date',
        'reviewed_date',
        'comments',
        'document_url',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(submittal).toHaveProperty(field);
      });
    });
  });
});
