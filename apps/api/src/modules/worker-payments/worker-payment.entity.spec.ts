import { WorkerPayment, PaymentType } from './worker-payment.entity';

describe('WorkerPayment Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a worker payment with custom values', () => {
      const payment = new WorkerPayment();
      payment.id = 'uuid-1';
      payment.worker_id = 'worker-uuid-1';
      payment.project_id = 'project-uuid-1';
      payment.amount = 500;
      payment.payment_type = PaymentType.TRANSFER;
      payment.date = new Date('2024-01-01');
      payment.notes = 'Test payment';

      expect(payment.id).toBe('uuid-1');
      expect(payment.worker_id).toBe('worker-uuid-1');
      expect(payment.project_id).toBe('project-uuid-1');
      expect(payment.amount).toBe(500);
      expect(payment.payment_type).toBe(PaymentType.TRANSFER);
      expect(payment.notes).toBe('Test payment');
    });
  });

  describe('PaymentType enum', () => {
    it('should have all payment types defined', () => {
      expect(PaymentType.CASH).toBe('cash');
      expect(PaymentType.TRANSFER).toBe('transfer');
      expect(PaymentType.CHECK).toBe('check');
      expect(PaymentType.OTHER).toBe('other');
    });
  });

  describe('relationship fields', () => {
    it('should have worker relationship', () => {
      const payment = new WorkerPayment();
      payment.worker = {} as any;
      expect(payment.worker).toBeDefined();
    });

    it('should have project relationship', () => {
      const payment = new WorkerPayment();
      payment.project = {} as any;
      expect(payment.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const payment = new WorkerPayment();
      const requiredFields = [
        'id',
        'worker_id',
        'project_id',
        'amount',
        'payment_type',
        'date',
        'notes',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(payment).toHaveProperty(field);
      });
    });
  });
});
