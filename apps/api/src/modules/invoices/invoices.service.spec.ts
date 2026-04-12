import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { Project } from '../projects/project.entity';

const createMockInvoice = (overrides?: Partial<Invoice>): Invoice =>
  ({
    id: 'invoice-1',
    project_id: 'project-1',
    invoice_number: 'INV-001',
    supplier: 'Supplier 1',
    amount: 10000,
    date: new Date(),
    tax_rate: 19,
    total_amount: 11900,
    status: 'issued' as any,
    created_at: new Date(),
    updated_at: new Date(),
    project: {} as Project,
    ...overrides,
  }) as unknown as Invoice;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: jest.Mocked<Repository<Invoice>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    repository = module.get(getRepositoryToken(Invoice));
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createDto = {
        project_id: 'project-1',
        invoice_number: 'INV-001',
        supplier: 'Supplier 1',
        amount: 10000,
        date: '2024-01-15',
      };
      const invoice = createMockInvoice();
      repository.create.mockReturnValue(invoice);
      repository.save.mockResolvedValue(invoice);

      const result = await service.create(createDto, 'company-1');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(invoice);
      expect(result).toEqual(invoice);
    });
  });

  describe('findAllByProject', () => {
    it('should return invoices for a project', async () => {
      const invoices = [
        createMockInvoice({ id: '1' }),
        createMockInvoice({ id: '2' }),
      ];
      repository.find.mockResolvedValue(invoices);

      const result = await service.findAllByProject('project-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { created_at: 'DESC' },
        relations: ['project'],
      });
      expect(result).toEqual(invoices);
    });

    it('should return all invoices when no project filter', async () => {
      const invoices = [createMockInvoice()];
      repository.find.mockResolvedValue(invoices);

      const result = await service.findAllByProject();
      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { created_at: 'DESC' },
        relations: ['project'],
      });
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

  describe('remove', () => {
    it('should remove an invoice', async () => {
      const invoice = createMockInvoice();
      repository.findOne.mockResolvedValue(invoice);
      repository.remove.mockResolvedValue(invoice);

      const result = await service.remove('invoice-1', 'company-1');
      expect(repository.remove).toHaveBeenCalledWith(invoice);
      expect(result).toEqual({ deleted: true });
    });
  });
});
