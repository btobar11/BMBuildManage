import { BudgetExecutionLog } from './budget-execution-log.entity';

describe('BudgetExecutionLog Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a budget execution log with custom values', () => {
      const log = new BudgetExecutionLog();
      log.id = 'uuid-1';
      log.budget_item_id = 'item-uuid-1';
      log.quantity_executed = 100;
      log.real_cost = 5000;
      log.note = 'Test note';

      expect(log.id).toBe('uuid-1');
      expect(log.budget_item_id).toBe('item-uuid-1');
      expect(log.quantity_executed).toBe(100);
      expect(log.real_cost).toBe(5000);
      expect(log.note).toBe('Test note');
    });
  });

  describe('relationship fields', () => {
    it('should have budget_item relationship', () => {
      const log = new BudgetExecutionLog();
      log.budget_item = {} as any;
      expect(log.budget_item).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const log = new BudgetExecutionLog();
      const requiredFields = [
        'id',
        'budget_item_id',
        'quantity_executed',
        'real_cost',
        'note',
        'date',
      ];
      requiredFields.forEach((field) => {
        expect(log).toHaveProperty(field);
      });
    });
  });
});
