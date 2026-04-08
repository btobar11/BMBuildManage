import {
  Subcontractor,
  SubcontractorContract,
  SubcontractorPayment,
  SubcontractorRAM,
  SubcontractorStatus,
  ContractType,
} from './subcontractor.entity';

describe('Subcontractor Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a subcontractor with custom values', () => {
      const sub = new Subcontractor();
      sub.id = 'uuid-1';
      sub.company_id = 'company-uuid-1';
      sub.name = 'Test Subcontractor';
      sub.trade = 'Electrical';
      sub.nit = '12345678';
      sub.email = 'sub@example.com';
      sub.phone = '+1234567890';
      sub.address = 'Test Address';
      sub.contract_value = 100000;
      sub.status = SubcontractorStatus.ACTIVE;
      sub.rating = 4.5;
      sub.notes = 'Test notes';

      expect(sub.id).toBe('uuid-1');
      expect(sub.name).toBe('Test Subcontractor');
      expect(sub.status).toBe(SubcontractorStatus.ACTIVE);
      expect(sub.rating).toBe(4.5);
    });
  });

  describe('SubcontractorStatus enum', () => {
    it('should have all statuses defined', () => {
      expect(SubcontractorStatus.ACTIVE).toBe('active');
      expect(SubcontractorStatus.INACTIVE).toBe('inactive');
      expect(SubcontractorStatus.PENDING).toBe('pending');
      expect(SubcontractorStatus.SUSPENDED).toBe('suspended');
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const sub = new Subcontractor();
      sub.company = {} as any;
      expect(sub.company).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const sub = new Subcontractor();
      const requiredFields = [
        'id',
        'company_id',
        'name',
        'trade',
        'nit',
        'email',
        'phone',
        'address',
        'contract_value',
        'status',
        'rating',
        'notes',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(sub).toHaveProperty(field);
      });
    });
  });
});

describe('SubcontractorContract Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a contract with custom values', () => {
      const contract = new SubcontractorContract();
      contract.id = 'uuid-1';
      contract.project_id = 'project-uuid-1';
      contract.subcontractor_id = 'sub-uuid-1';
      contract.scope = 'Electrical Work';
      contract.description = 'Test description';
      contract.contract_type = ContractType.LUMP_SUM;
      contract.contract_amount = 50000;
      contract.approved_amount = 25000;
      contract.paid_amount = 10000;
      contract.start_date = new Date('2024-01-01');
      contract.end_date = new Date('2024-06-01');
      contract.is_completed = false;

      expect(contract.id).toBe('uuid-1');
      expect(contract.contract_type).toBe(ContractType.LUMP_SUM);
      expect(contract.contract_amount).toBe(50000);
    });
  });

  describe('ContractType enum', () => {
    it('should have all contract types defined', () => {
      expect(ContractType.LUMP_SUM).toBe('lump_sum');
      expect(ContractType.UNIT_PRICE).toBe('unit_price');
      expect(ContractType.COST_PLUS).toBe('cost_plus');
      expect(ContractType.TIME_AND_MATERIALS).toBe('time_and_materials');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const contract = new SubcontractorContract();
      contract.project = {} as any;
      expect(contract.project).toBeDefined();
    });

    it('should have subcontractor relationship', () => {
      const contract = new SubcontractorContract();
      contract.subcontractor = {} as any;
      expect(contract.subcontractor).toBeDefined();
    });
  });
});

describe('SubcontractorPayment Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a payment with custom values', () => {
      const payment = new SubcontractorPayment();
      payment.id = 'uuid-1';
      payment.contract_id = 'contract-uuid-1';
      payment.amount = 5000;
      payment.payment_date = new Date('2024-01-15');
      payment.invoice_number = 'INV-001';
      payment.description = 'Test payment';
      payment.approved = true;
      payment.approved_by = 'user-uuid-1';

      expect(payment.id).toBe('uuid-1');
      expect(payment.amount).toBe(5000);
      expect(payment.approved).toBe(true);
    });
  });

  describe('relationship fields', () => {
    it('should have contract relationship', () => {
      const payment = new SubcontractorPayment();
      payment.contract = {} as any;
      expect(payment.contract).toBeDefined();
    });
  });
});

describe('SubcontractorRAM Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a RAM with custom values', () => {
      const ram = new SubcontractorRAM();
      ram.id = 'uuid-1';
      ram.contract_id = 'contract-uuid-1';
      ram.item = 'Concrete';
      ram.description = 'Test item';
      ram.approved_quantity = 100;
      ram.unit_price = 50;
      ram.executed_quantity = 50;

      expect(ram.id).toBe('uuid-1');
      expect(ram.approved_quantity).toBe(100);
      expect(ram.executed_quantity).toBe(50);
    });
  });

  describe('relationship fields', () => {
    it('should have contract relationship', () => {
      const ram = new SubcontractorRAM();
      ram.contract = {} as any;
      expect(ram.contract).toBeDefined();
    });
  });
});
