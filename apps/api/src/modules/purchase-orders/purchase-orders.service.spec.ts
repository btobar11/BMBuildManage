import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderReceipt,
  PurchaseOrderStatus,
  ReceiptItem,
} from './purchase-order.entity';
import { Invoice } from '../invoices/invoice.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let poRepo: jest.Mocked<Repository<PurchaseOrder>>;
  let poItemRepo: jest.Mocked<Repository<PurchaseOrderItem>>;
  let receiptRepo: jest.Mocked<Repository<PurchaseOrderReceipt>>;
  let receiptItemRepo: jest.Mocked<Repository<ReceiptItem>>;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockCompanyId = 'company-uuid-1';
  const mockProjectId = 'project-uuid-1';

  beforeEach(async () => {
    const mockRepoFactory = () => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(PurchaseOrderReceipt),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(ReceiptItem),
          useFactory: mockRepoFactory,
        },
        { provide: getRepositoryToken(Invoice), useFactory: mockRepoFactory },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    poRepo = module.get(getRepositoryToken(PurchaseOrder));
    poItemRepo = module.get(getRepositoryToken(PurchaseOrderItem));
    receiptRepo = module.get(getRepositoryToken(PurchaseOrderReceipt));
    receiptItemRepo = module.get(getRepositoryToken(ReceiptItem));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase order with items and calculate totals', async () => {
      const dto = {
        project_id: mockProjectId,
        supplier_name: 'Sodimac Chile',
        supplier_rut: '96.792.430-K',
        items: [
          {
            description: 'Cemento 42.5kg',
            quantity_ordered: 100,
            unit_price: 8500,
            unit: 'un',
          },
          {
            description: 'Arena Gruesa',
            quantity_ordered: 10,
            unit_price: 22000,
            unit: 'm3',
          },
        ],
      };

      const mockCreatedItem1 = {
        ...dto.items[0],
        total_price: 850000,
        id: 'item-1',
      };
      const mockCreatedItem2 = {
        ...dto.items[1],
        total_price: 220000,
        id: 'item-2',
      };

      poItemRepo.create
        .mockReturnValueOnce(mockCreatedItem1 as any)
        .mockReturnValueOnce(mockCreatedItem2 as any);

      const mockPO = {
        id: 'po-uuid-1',
        company_id: mockCompanyId,
        project_id: mockProjectId,
        supplier_name: 'Sodimac Chile',
        total_amount: 1070000,
        items: [mockCreatedItem1, mockCreatedItem2],
      };

      poRepo.create.mockReturnValue(mockPO as any);
      poRepo.save.mockResolvedValue(mockPO as any);

      const result = await service.create(dto, mockCompanyId);

      expect(result.total_amount).toBe(1070000);
      expect(result.company_id).toBe(mockCompanyId);
      expect(poRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: mockCompanyId,
          supplier_name: 'Sodimac Chile',
          total_amount: 1070000,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a purchase order by id and company', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        supplier_name: 'Test',
      };
      poRepo.findOne.mockResolvedValue(mockPO as any);

      const result = await service.findOne('po-1', mockCompanyId);
      expect(result.id).toBe('po-1');
    });

    it('should throw NotFoundException if PO does not exist', async () => {
      poRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('fake-id', mockCompanyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('receiveDelivery', () => {
    it('should register a delivery and update PO status to FULLY_RECEIVED', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.SENT,
        items: [
          {
            id: 'item-1',
            quantity_ordered: 100,
            quantity_received: 0,
            description: 'Cemento',
          },
        ],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      const mockManager = {
        create: jest.fn().mockImplementation((entity, data) => ({ ...data })),
        save: jest
          .fn()
          .mockImplementation((entity, data) => ({ ...data, id: 'receipt-1' })),
        find: jest
          .fn()
          .mockResolvedValue([
            { id: 'item-1', quantity_ordered: 100, quantity_received: 100 },
          ]),
        update: jest.fn().mockResolvedValue(undefined),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      const dto = {
        received_by: 'Juan Bodeguero',
        reception_date: '2024-06-15',
        guia_despacho_number: 'GD-12345',
        items: [{ purchase_order_item_id: 'item-1', quantity_received: 100 }],
      };

      const result = await service.receiveDelivery('po-1', dto, mockCompanyId);

      expect(mockManager.update).toHaveBeenCalledWith(
        PurchaseOrderItem,
        'item-1',
        expect.objectContaining({ quantity_received: 100 }),
      );
      expect(mockManager.update).toHaveBeenCalledWith(
        PurchaseOrder,
        'po-1',
        expect.objectContaining({ status: PurchaseOrderStatus.FULLY_RECEIVED }),
      );
    });

    it('should reject reception exceeding ordered quantity by >5%', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.SENT,
        items: [
          {
            id: 'item-1',
            quantity_ordered: 100,
            quantity_received: 0,
            description: 'Cemento',
          },
        ],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      const dto = {
        received_by: 'Juan Bodeguero',
        reception_date: '2024-06-15',
        items: [{ purchase_order_item_id: 'item-1', quantity_received: 200 }],
      };

      await expect(
        service.receiveDelivery('po-1', dto, mockCompanyId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject reception on a CLOSED PO', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.CLOSED,
        items: [],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      const dto = {
        received_by: 'Test',
        reception_date: '2024-06-15',
        items: [],
      };

      await expect(
        service.receiveDelivery('po-1', dto, mockCompanyId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('matchInvoice', () => {
    it('should match an invoice to a fully received PO', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.FULLY_RECEIVED,
        items: [],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      const mockInvoice = { id: 'inv-1', company_id: mockCompanyId };
      invoiceRepo.findOne.mockResolvedValue(mockInvoice as any);
      poRepo.update.mockResolvedValue(undefined as any);
      invoiceRepo.update.mockResolvedValue(undefined as any);

      const result = await service.matchInvoice(
        'po-1',
        { invoice_id: 'inv-1' },
        mockCompanyId,
      );

      expect(result.matched).toBe(true);
      expect(poRepo.update).toHaveBeenCalledWith(
        'po-1',
        expect.objectContaining({
          invoice_id: 'inv-1',
          status: PurchaseOrderStatus.INVOICED,
        }),
      );
    });

    it('should reject match if PO has no reception', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.DRAFT,
        items: [],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      await expect(
        service.matchInvoice('po-1', { invoice_id: 'inv-1' }, mockCompanyId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject match if invoice does not exist', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        status: PurchaseOrderStatus.FULLY_RECEIVED,
        items: [],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);
      invoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.matchInvoice('po-1', { invoice_id: 'fake' }, mockCompanyId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMatchStatus', () => {
    it('should return ready_for_payment=true when fully received and invoiced', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        po_number: 'OC-001',
        supplier_name: 'Sodimac',
        invoice_id: 'inv-1',
        items: [
          {
            id: 'item-1',
            quantity_ordered: 100,
            quantity_received: 100,
            unit_price: 8500,
          },
        ],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);
      invoiceRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        monto_total: 850000,
      } as any);

      const status = await service.getMatchStatus('po-1', mockCompanyId);

      expect(status.ordered).toBe(true);
      expect(status.received).toBe(true);
      expect(status.invoiced).toBe(true);
      expect(status.ready_for_payment).toBe(true);
      expect(status.reception_percentage).toBe(100);
    });

    it('should return ready_for_payment=false when not received', async () => {
      const mockPO = {
        id: 'po-1',
        company_id: mockCompanyId,
        po_number: 'OC-002',
        supplier_name: 'Easy',
        invoice_id: null,
        items: [
          {
            id: 'item-1',
            quantity_ordered: 50,
            quantity_received: 0,
            unit_price: 10000,
          },
        ],
        receipts: [],
      };

      poRepo.findOne.mockResolvedValue(mockPO as any);

      const status = await service.getMatchStatus('po-1', mockCompanyId);

      expect(status.received).toBe(false);
      expect(status.invoiced).toBe(false);
      expect(status.ready_for_payment).toBe(false);
      expect(status.reception_percentage).toBe(0);
    });
  });

  describe('getProjectMatchSummary', () => {
    it('should return summary counts by status', async () => {
      const mockOrders = [
        { status: PurchaseOrderStatus.DRAFT, total_amount: 100000 },
        { status: PurchaseOrderStatus.FULLY_RECEIVED, total_amount: 500000 },
        { status: PurchaseOrderStatus.INVOICED, total_amount: 300000 },
      ];

      poRepo.find.mockResolvedValue(mockOrders as any);

      const summary = await service.getProjectMatchSummary(
        mockProjectId,
        mockCompanyId,
      );

      expect(summary.total_orders).toBe(3);
      expect(summary.draft).toBe(1);
      expect(summary.fully_received).toBe(1);
      expect(summary.invoiced).toBe(1);
      expect(summary.total_amount).toBe(900000);
    });
  });
});
