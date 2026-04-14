import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubcontractorsService } from './subcontractors.service';
import {
  Subcontractor,
  SubcontractorContract,
  SubcontractorPayment,
  SubcontractorRAM,
} from './subcontractor.entity';
import { Document, DocumentType } from '../documents/document.entity';

const createMockSubcontractor = (
  overrides?: Partial<Subcontractor>,
): Subcontractor =>
  ({
    id: 'sub-1',
    company_id: 'company-1',
    name: 'Test Subcontractor',
    nit: '12345678-9',
    phone: '555-1234',
    email: 'test@subcontractor.com',
    address: 'Test Address',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as Subcontractor;

const createMockContract = (
  overrides?: Partial<SubcontractorContract>,
): SubcontractorContract =>
  ({
    id: 'contract-1',
    project_id: 'project-1',
    subcontractor_id: 'sub-1',
    contract_amount: 100000,
    paid_amount: 50000,
    approved_amount: 30000,
    is_completed: false,
    start_date: new Date(),
    end_date: new Date(),
    created_at: new Date(),
    subcontractor: {} as Subcontractor,
    payments: [],
    ...overrides,
  }) as SubcontractorContract;

const createMockPayment = (
  overrides?: Partial<SubcontractorPayment>,
): SubcontractorPayment =>
  ({
    id: 'payment-1',
    contract_id: 'contract-1',
    amount: 10000,
    payment_date: new Date(),
    status: 'pending',
    created_at: new Date(),
    ...overrides,
  }) as SubcontractorPayment;

const createMockRAM = (
  overrides?: Partial<SubcontractorRAM>,
): SubcontractorRAM =>
  ({
    id: 'ram-1',
    contract_id: 'contract-1',
    description: 'Test RAM Item',
    amount: 5000,
    created_at: new Date(),
    ...overrides,
  }) as SubcontractorRAM;

const mockSubcontractorRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockContractRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockPaymentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockRAMRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockDocumentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('SubcontractorsService', () => {
  let service: SubcontractorsService;
  let subcontractorRepo: jest.Mocked<Repository<Subcontractor>>;
  let contractRepo: jest.Mocked<Repository<SubcontractorContract>>;
  let paymentRepo: jest.Mocked<Repository<SubcontractorPayment>>;
  let ramRepo: jest.Mocked<Repository<SubcontractorRAM>>;
  let documentRepo: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubcontractorsService,
        {
          provide: getRepositoryToken(Subcontractor),
          useFactory: mockSubcontractorRepo,
        },
        {
          provide: getRepositoryToken(SubcontractorContract),
          useFactory: mockContractRepo,
        },
        {
          provide: getRepositoryToken(SubcontractorPayment),
          useFactory: mockPaymentRepo,
        },
        {
          provide: getRepositoryToken(SubcontractorRAM),
          useFactory: mockRAMRepo,
        },
        {
          provide: getRepositoryToken(Document),
          useFactory: mockDocumentRepo,
        },
      ],
    }).compile();

    service = module.get<SubcontractorsService>(SubcontractorsService);
    subcontractorRepo = module.get(getRepositoryToken(Subcontractor));
    contractRepo = module.get(getRepositoryToken(SubcontractorContract));
    paymentRepo = module.get(getRepositoryToken(SubcontractorPayment));
    ramRepo = module.get(getRepositoryToken(SubcontractorRAM));
    documentRepo = module.get(getRepositoryToken(Document));
  });

  describe('getAll', () => {
    it('should return all subcontractors for a company', async () => {
      const subcontractors = [
        createMockSubcontractor(),
        createMockSubcontractor({ id: 'sub-2' }),
      ];
      subcontractorRepo.find.mockResolvedValue(subcontractors);

      const result = await service.getAll('company-1');

      expect(subcontractorRepo.find).toHaveBeenCalledWith({
        where: { company_id: 'company-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(subcontractors);
    });
  });

  describe('create', () => {
    it('should create a subcontractor with company_id', async () => {
      const data = { name: 'New Subcontractor', nit: '11111111-1' };
      const subcontractor = createMockSubcontractor(data);
      subcontractorRepo.create.mockReturnValue(subcontractor);
      subcontractorRepo.save.mockResolvedValue(subcontractor);

      const result = await service.create('company-1', data);

      expect(subcontractorRepo.create).toHaveBeenCalledWith({
        ...data,
        company_id: 'company-1',
      });
      expect(subcontractorRepo.save).toHaveBeenCalled();
      expect(result).toEqual(subcontractor);
    });
  });

  describe('update', () => {
    it('should update a subcontractor', async () => {
      const sub = createMockSubcontractor();
      const updated = { ...sub, name: 'Updated Name' };
      subcontractorRepo.findOne.mockResolvedValue(sub);
      subcontractorRepo.save.mockResolvedValue(updated);

      const result = await service.update('sub-1', { name: 'Updated Name' });

      expect(subcontractorRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
      expect(subcontractorRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if subcontractor not found', async () => {
      subcontractorRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getContracts', () => {
    it('should return contracts for a project', async () => {
      const contracts = [
        createMockContract(),
        createMockContract({ id: 'contract-2' }),
      ];
      contractRepo.find.mockResolvedValue(contracts);

      const result = await service.getContracts('project-1');

      expect(contractRepo.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['subcontractor'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(contracts);
    });
  });

  describe('createContract', () => {
    it('should create a contract', async () => {
      const data = { subcontractor_id: 'sub-1', contract_amount: 50000 };
      const contract = createMockContract(data);
      contractRepo.create.mockReturnValue(contract);
      contractRepo.save.mockResolvedValue(contract);

      const result = await service.createContract('project-1', data);

      expect(contractRepo.create).toHaveBeenCalledWith({
        ...data,
        project_id: 'project-1',
      });
      expect(contractRepo.save).toHaveBeenCalled();
      expect(result).toEqual(contract);
    });
  });

  describe('updateContract', () => {
    it('should update a contract', async () => {
      const contract = createMockContract();
      const updated = { ...contract, contract_amount: 60000 };
      contractRepo.findOne.mockResolvedValue(contract);
      contractRepo.save.mockResolvedValue(updated);

      const result = await service.updateContract('contract-1', {
        contract_amount: 60000,
      });

      expect(contractRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
      });
      expect(contractRepo.save).toHaveBeenCalled();
      expect(result.contract_amount).toBe(60000);
    });

    it('should throw NotFoundException if contract not found', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      await expect(service.updateContract('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPayments', () => {
    it('should return payments for a contract', async () => {
      const payments = [
        createMockPayment(),
        createMockPayment({ id: 'payment-2' }),
      ];
      paymentRepo.find.mockResolvedValue(payments);

      const result = await service.getPayments('contract-1');

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { contract_id: 'contract-1' },
        order: { payment_date: 'DESC' },
      });
      expect(result).toEqual(payments);
    });
  });

  describe('createPayment', () => {
    it('should create a payment when compliance doc exists', async () => {
      const payment = createMockPayment({ amount: 10000 });
      const contract = createMockContract({
        paid_amount: 50000,
        subcontractor_id: 'sub-1',
      });

      contractRepo.findOne.mockResolvedValue(contract);
      documentRepo.findOne.mockResolvedValue({
        id: 'doc-1',
        type: DocumentType.LABOR_COMPLIANCE,
        period: expect.any(String),
      } as any);
      paymentRepo.create.mockReturnValue(payment);
      paymentRepo.save.mockResolvedValue(payment);
      contractRepo.save.mockResolvedValue({ ...contract, paid_amount: 60000 });

      const result = await service.createPayment('contract-1', {
        amount: 10000,
      });

      expect(paymentRepo.save).toHaveBeenCalled();
      expect(contractRepo.save).toHaveBeenCalled();
      expect(result).toEqual(payment);
    });

    it('should throw BadRequestException if contract not found', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment('contract-1', { amount: 10000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if compliance doc missing', async () => {
      const contract = createMockContract({ subcontractor_id: 'sub-1' });
      contractRepo.findOne.mockResolvedValue(contract);
      documentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment('contract-1', { amount: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRAM', () => {
    it('should return RAM items for a contract', async () => {
      const ramItems = [createMockRAM(), createMockRAM({ id: 'ram-2' })];
      ramRepo.find.mockResolvedValue(ramItems);

      const result = await service.getRAM('contract-1');

      expect(ramRepo.find).toHaveBeenCalledWith({
        where: { contract_id: 'contract-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(ramItems);
    });
  });

  describe('createRAMItem', () => {
    it('should create a RAM item', async () => {
      const data = { description: 'New RAM Item', amount: 5000 };
      const ram = createMockRAM(data);
      ramRepo.create.mockReturnValue(ram);
      ramRepo.save.mockResolvedValue(ram);

      const result = await service.createRAMItem('contract-1', data);

      expect(ramRepo.create).toHaveBeenCalledWith({
        ...data,
        contract_id: 'contract-1',
      });
      expect(ramRepo.save).toHaveBeenCalled();
      expect(result).toEqual(ram);
    });
  });

  describe('getProjectSummary', () => {
    it('should return project summary with contracts and totals', async () => {
      const contracts = [
        createMockContract({
          contract_amount: 100000,
          paid_amount: 30000,
          is_completed: false,
        }),
        createMockContract({
          contract_amount: 50000,
          paid_amount: 50000,
          is_completed: true,
        }),
      ];
      contractRepo.find.mockResolvedValue(contracts);

      const result = await service.getProjectSummary('project-1');

      expect(result.summary.totalContracts).toBe(2);
      expect(result.summary.totalValue).toBe(150000);
      expect(result.summary.totalPaid).toBe(80000);
      expect(result.summary.pendingPayments).toBe(1);
      expect(result.summary.completedContracts).toBe(1);
      expect(result.contracts).toEqual(contracts);
    });

    it('should handle empty contracts', async () => {
      contractRepo.find.mockResolvedValue([]);

      const result = await service.getProjectSummary('project-1');

      expect(result.summary.totalContracts).toBe(0);
      expect(result.summary.totalValue).toBe(0);
      expect(result.summary.totalPaid).toBe(0);
    });
  });
});
