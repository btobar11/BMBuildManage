import { Invoice } from './invoice.entity';

describe('Invoice Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create an invoice with custom values', () => {
      const invoice = new Invoice();
      invoice.id = 'uuid-1';
      invoice.project_id = 'project-uuid-1';
      invoice.supplier = 'Test Supplier';
      invoice.invoice_number = 'INV-001';
      invoice.amount = 5000;
      invoice.date = new Date('2024-01-01');
      invoice.file_url = 'https://example.com/invoice.pdf';

      expect(invoice.id).toBe('uuid-1');
      expect(invoice.project_id).toBe('project-uuid-1');
      expect(invoice.supplier).toBe('Test Supplier');
      expect(invoice.invoice_number).toBe('INV-001');
      expect(invoice.amount).toBe(5000);
      expect(invoice.file_url).toBe('https://example.com/invoice.pdf');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const invoice = new Invoice();
      invoice.project = {} as any;
      expect(invoice.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const invoice = new Invoice();
      const requiredFields = [
        'id',
        'project_id',
        'supplier',
        'invoice_number',
        'amount',
        'date',
        'file_url',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(invoice).toHaveProperty(field);
      });
    });
  });
});
