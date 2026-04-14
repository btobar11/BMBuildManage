import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { Project } from '../projects/project.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

const createMockInvoice = (overrides?: Partial<Invoice>): Invoice =>
  ({
    id: 'invoice-1',
    project_id: 'project-1',
    company_id: 'company-1',
    invoice_number: 'INV-001',
    supplier: 'Supplier 1',
    amount: 10000,
    date: new Date('2024-01-15'),
    tax_rate: 19,
    total_amount: 11900,
    status: 'issued' as any,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    project: {} as Project,
    ...overrides,
  }) as unknown as Invoice;

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: repository },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('create', () => {
    it('should create an invoice with company_id', async () => {
      const createDto = {
        project_id: 'project-1',
        invoice_number: 'INV-001',
        supplier: 'Supplier 1',
        amount: 10000,
        date: '2024-01-15',
        company_id: 'company-1',
      };
      const invoice = createMockInvoice();

      repository.create.mockImplementation((data) => ({ ...data }) as Invoice);
      repository.save.mockResolvedValue(invoice);

      const result = await service.create(createDto, 'company-1');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'project-1',
          company_id: 'company-1',
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(invoice);
    });

    it('should auto-inject company_id from parameter', async () => {
      const createDto = {
        project_id: 'project-1',
        invoice_number: 'INV-002',
        supplier: 'Supplier 2',
        amount: 5000,
        date: '2024-02-01',
      };
      const invoice = createMockInvoice({
        invoice_number: 'INV-002',
        amount: 5000,
        company_id: 'company-autoinjected',
      });

      repository.create.mockImplementation(
        (data) => ({ ...data, company_id: 'company-autoinjected' }) as Invoice,
      );
      repository.save.mockResolvedValue(invoice);

      const result = await service.create(createDto, 'company-autoinjected');

      expect(repository.save).toHaveBeenCalled();
      expect(result.company_id).toBe('company-autoinjected');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FIND TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('findAllByProject', () => {
    it('should return invoices for a project', async () => {
      const invoices = [
        createMockInvoice({ id: 'invoice-1' }),
        createMockInvoice({ id: 'invoice-2' }),
      ];
      repository.find.mockResolvedValue(invoices);

      const result = await service.findAllByProject('project-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['project'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(invoices);
    });

    it('should return empty array when no invoices', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAllByProject('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      const invoice = createMockInvoice();
      repository.findOne.mockResolvedValue(invoice);

      const result = await service.findOne('invoice-1', 'company-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'invoice-1', company_id: 'company-1' },
      });
      expect(result).toEqual(invoice);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOVE TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('remove', () => {
    it('should remove an invoice', async () => {
      const invoice = createMockInvoice();
      repository.findOne.mockResolvedValue(invoice);
      repository.remove.mockResolvedValue(invoice);

      const result = await service.remove('invoice-1', 'company-1');

      expect(repository.remove).toHaveBeenCalledWith(invoice);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when invoice not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
