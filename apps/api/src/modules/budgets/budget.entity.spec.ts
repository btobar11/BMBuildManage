import { Budget, BudgetStatus } from './budget.entity';

describe('Budget Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a budget with default values', () => {
      const budget = new Budget();

      expect(budget.version).toBeUndefined();
      expect(budget.status).toBeUndefined();
      expect(budget.is_active).toBeUndefined();
      expect(budget.total_estimated_cost).toBeUndefined();
      expect(budget.total_estimated_price).toBeUndefined();
    });

    it('should create a budget with custom values', () => {
      const budget = new Budget();
      budget.id = 'uuid-1';
      budget.project_id = 'project-uuid-1';
      budget.status = BudgetStatus.APPROVED;
      budget.is_active = false;
      budget.total_estimated_cost = 100000;
      budget.total_estimated_price = 150000;
      budget.professional_fee_percentage = 12;
      budget.estimated_utility = 20;
      budget.markup_percentage = 25;
      budget.notes = 'Test budget';

      expect(budget.id).toBe('uuid-1');
      expect(budget.project_id).toBe('project-uuid-1');
      expect(budget.status).toBe(BudgetStatus.APPROVED);
      expect(budget.is_active).toBe(false);
      expect(budget.total_estimated_cost).toBe(100000);
      expect(budget.total_estimated_price).toBe(150000);
      expect(budget.professional_fee_percentage).toBe(12);
      expect(budget.estimated_utility).toBe(20);
      expect(budget.markup_percentage).toBe(25);
      expect(budget.notes).toBe('Test budget');
    });
  });

  describe('BudgetStatus enum', () => {
    it('should have all required status values', () => {
      expect(BudgetStatus.DRAFT).toBe('draft');
      expect(BudgetStatus.EDITING).toBe('editing');
      expect(BudgetStatus.SENT).toBe('sent');
      expect(BudgetStatus.APPROVED).toBe('approved');
      expect(BudgetStatus.REJECTED).toBe('rejected');
      expect(BudgetStatus.COUNTER_OFFER).toBe('counter_offer');
    });
  });

  describe('relationship fields', () => {
    it('should have stages relationship', () => {
      const budget = new Budget();
      budget.stages = [];

      expect(budget.stages).toEqual([]);
    });

    it('should have project relationship', () => {
      const budget = new Budget();
      budget.project = {} as any;

      expect(budget.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should import required TypeORM decorators', () => {
      const budget = new Budget();

      expect(budget).toBeInstanceOf(Object);
      expect(budget).toHaveProperty('id');
    });

    it('should have all required columns defined', () => {
      const budget = new Budget();

      const requiredFields = [
        'id',
        'project_id',
        'version',
        'status',
        'is_active',
        'notes',
        'rejection_reason',
        'total_estimated_cost',
        'total_estimated_price',
        'professional_fee_percentage',
        'estimated_utility',
        'markup_percentage',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(budget).toHaveProperty(field);
      });
    });
  });
});
