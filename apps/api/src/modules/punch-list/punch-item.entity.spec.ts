import {
  PunchItem,
  PunchItemStatus,
  PunchItemPriority,
} from './punch-item.entity';

describe('PunchItem Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a punch item with custom values', () => {
      const item = new PunchItem();
      item.id = 'uuid-1';
      item.project_id = 'project-uuid-1';
      item.title = 'Fix wall crack';
      item.description = 'Test description';
      item.status = PunchItemStatus.IN_PROGRESS;
      item.priority = PunchItemPriority.HIGH;
      item.location = 'Building A';
      item.reported_by = 'user-uuid-1';
      item.assigned_to = 'worker-uuid-1';
      item.due_date = new Date('2024-01-15');
      item.completed_date = new Date('2024-01-10');
      item.photo_url = 'https://example.com/photo.jpg';

      expect(item.id).toBe('uuid-1');
      expect(item.title).toBe('Fix wall crack');
      expect(item.status).toBe(PunchItemStatus.IN_PROGRESS);
      expect(item.priority).toBe(PunchItemPriority.HIGH);
    });
  });

  describe('PunchItemStatus enum', () => {
    it('should have all statuses defined', () => {
      expect(PunchItemStatus.OPEN).toBe('open');
      expect(PunchItemStatus.IN_PROGRESS).toBe('in_progress');
      expect(PunchItemStatus.VERIFIED).toBe('verified');
      expect(PunchItemStatus.CLOSED).toBe('closed');
    });
  });

  describe('PunchItemPriority enum', () => {
    it('should have all priorities defined', () => {
      expect(PunchItemPriority.LOW).toBe('low');
      expect(PunchItemPriority.MEDIUM).toBe('medium');
      expect(PunchItemPriority.HIGH).toBe('high');
      expect(PunchItemPriority.CRITICAL).toBe('critical');
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const item = new PunchItem();
      const requiredFields = [
        'id',
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'location',
        'reported_by',
        'assigned_to',
        'due_date',
        'completed_date',
        'photo_url',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  });
});
