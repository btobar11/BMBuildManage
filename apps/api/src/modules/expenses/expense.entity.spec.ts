import { Expense, ExpenseType } from './expense.entity';

describe('Expense Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create an expense with custom values', () => {
      const expense = new Expense();
      expense.id = 'uuid-1';
      expense.project_id = 'project-uuid-1';
      expense.company_id = 'company-uuid-1';
      expense.amount = 1000;
      expense.expense_type = ExpenseType.MATERIAL;
      expense.description = 'Test expense';
      expense.date = new Date('2024-01-01');

      expect(expense.id).toBe('uuid-1');
      expect(expense.project_id).toBe('project-uuid-1');
      expect(expense.company_id).toBe('company-uuid-1');
      expect(expense.amount).toBe(1000);
      expect(expense.expense_type).toBe(ExpenseType.MATERIAL);
      expect(expense.description).toBe('Test expense');
    });
  });

  describe('ExpenseType enum', () => {
    it('should have all expense types defined', () => {
      expect(ExpenseType.MATERIAL).toBe('material');
      expect(ExpenseType.LABOR).toBe('labor');
      expect(ExpenseType.EQUIPMENT).toBe('equipment');
      expect(ExpenseType.OTHER).toBe('other');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const expense = new Expense();
      expense.project = {} as any;
      expect(expense.project).toBeDefined();
    });

    it('should have company relationship', () => {
      const expense = new Expense();
      expense.company = {} as any;
      expect(expense.company).toBeDefined();
    });

    it('should allow null document', () => {
      const expense = new Expense();
      expense.document = null;
      expect(expense.document).toBeNull();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const expense = new Expense();
      const requiredFields = [
        'id',
        'project_id',
        'company_id',
        'item_id',
        'description',
        'amount',
        'expense_type',
        'date',
        'document_url',
        'document_id',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(expense).toHaveProperty(field);
      });
    });
  });
});
