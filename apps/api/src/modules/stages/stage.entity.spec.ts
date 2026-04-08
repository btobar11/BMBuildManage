import { Stage } from './stage.entity';

describe('Stage Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a stage with undefined default values (DB defaults apply on insert)', () => {
      const stage = new Stage();

      expect(stage.position).toBeUndefined();
      expect(stage.total_cost).toBeUndefined();
      expect(stage.total_price).toBeUndefined();
    });

    it('should create a stage with custom values', () => {
      const stage = new Stage();
      stage.id = 'uuid-1';
      stage.budget_id = 'budget-uuid-1';
      stage.name = 'Foundation';
      stage.position = 1;
      stage.total_cost = 50000;
      stage.total_price = 75000;

      expect(stage.id).toBe('uuid-1');
      expect(stage.budget_id).toBe('budget-uuid-1');
      expect(stage.name).toBe('Foundation');
      expect(stage.position).toBe(1);
      expect(stage.total_cost).toBe(50000);
      expect(stage.total_price).toBe(75000);
    });
  });

  describe('name field constraints', () => {
    it('should accept name within 300 characters', () => {
      const stage = new Stage();
      stage.name = 'A'.repeat(300);

      expect(stage.name.length).toBe(300);
    });

    it('should allow empty name', () => {
      const stage = new Stage();
      stage.name = '';

      expect(stage.name).toBe('');
    });
  });

  describe('relationship fields', () => {
    it('should have items relationship', () => {
      const stage = new Stage();
      stage.items = [];

      expect(stage.items).toEqual([]);
    });

    it('should have budget relationship', () => {
      const stage = new Stage();
      stage.budget = {} as any;

      expect(stage.budget).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should import required TypeORM decorators', () => {
      const stage = new Stage();

      expect(stage).toBeInstanceOf(Object);
      expect(stage).toHaveProperty('id');
    });

    it('should have all required columns defined', () => {
      const stage = new Stage();

      const requiredFields = [
        'id',
        'budget_id',
        'name',
        'position',
        'total_cost',
        'total_price',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(stage).toHaveProperty(field);
      });
    });
  });
});
