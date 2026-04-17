import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  receiveDelivery: jest.fn(),
  matchInvoice: jest.fn(),
  getMatchStatus: jest.fn(),
  getProjectMatchSummary: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [{ provide: PurchaseOrdersService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a purchase order', async () => {
      const dto = { project_id: 'proj-1', supplier_name: 'Test', items: [] };
      const mockResult = { id: 'po-1', ...dto };
      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto as any, { company_id: 'company-1' });

      expect(mockService.create).toHaveBeenCalledWith(dto, 'company-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all orders for company', async () => {
      const mockOrders = [{ id: 'po-1' }, { id: 'po-2' }];
      mockService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll('' as any, { company_id: 'company-1' });

      expect(mockService.findAll).toHaveBeenCalledWith('company-1', '');
      expect(result).toEqual(mockOrders);
    });

    it('should filter by project_id', async () => {
      const mockOrders = [{ id: 'po-1', project_id: 'proj-1' }];
      mockService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll('proj-1', { company_id: 'company-1' });

      expect(mockService.findAll).toHaveBeenCalledWith('company-1', 'proj-1');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findOne', () => {
    it('should return a purchase order by id', async () => {
      const mockOrder = { id: 'po-1', supplier_name: 'Test' };
      mockService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('po-1', { company_id: 'company-1' });

      expect(mockService.findOne).toHaveBeenCalledWith('po-1', 'company-1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('receiveDelivery', () => {
    it('should register a delivery', async () => {
      const dto = { received_by: 'Juan', reception_date: '2024-01-01', items: [] };
      const mockResult = { id: 'receipt-1' };
      mockService.receiveDelivery.mockResolvedValue(mockResult);

      const result = await controller.receiveDelivery('po-1', dto as any, { company_id: 'company-1' });

      expect(mockService.receiveDelivery).toHaveBeenCalledWith('po-1', dto, 'company-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('matchInvoice', () => {
    it('should match an invoice', async () => {
      const dto = { invoice_id: 'inv-1' };
      const mockResult = { matched: true };
      mockService.matchInvoice.mockResolvedValue(mockResult);

      const result = await controller.matchInvoice('po-1', dto, { company_id: 'company-1' });

      expect(mockService.matchInvoice).toHaveBeenCalledWith('po-1', dto, 'company-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMatchStatus', () => {
    it('should return match status', async () => {
      const mockStatus = { ready_for_payment: true };
      mockService.getMatchStatus.mockResolvedValue(mockStatus);

      const result = await controller.getMatchStatus('po-1', { company_id: 'company-1' });

      expect(mockService.getMatchStatus).toHaveBeenCalledWith('po-1', 'company-1');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getProjectSummary', () => {
    it('should return project summary', async () => {
      const mockSummary = { total_orders: 5 };
      mockService.getProjectMatchSummary.mockResolvedValue(mockSummary);

      const result = await controller.getProjectSummary('proj-1', { company_id: 'company-1' });

      expect(mockService.getProjectMatchSummary).toHaveBeenCalledWith('proj-1', 'company-1');
      expect(result).toEqual(mockSummary);
    });
  });
});