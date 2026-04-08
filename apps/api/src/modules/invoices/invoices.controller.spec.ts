import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockInvoicesService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create an invoice', async () => {
      const createDto: any = {
        project_id: 'proj-1',
        supplier: 'Test Supplier',
        invoice_number: 'INV-001',
        amount: 1000,
        date: '2024-01-01',
      };
      const expected = { id: 'invoice-1', ...createDto };
      mockInvoicesService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockInvoicesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all invoices by project', async () => {
      const expected = [{ id: 'invoice-1', number: 'INV-001' }];
      mockInvoicesService.findAllByProject.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockInvoicesService.findAllByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single invoice', async () => {
      const expected = { id: 'invoice-1', number: 'INV-001' };
      mockInvoicesService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('invoice-1');

      expect(mockInvoicesService.findOne).toHaveBeenCalledWith('invoice-1');
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an invoice', async () => {
      mockInvoicesService.remove.mockResolvedValue({ id: 'invoice-1' });

      const result = await controller.remove('invoice-1');

      expect(mockInvoicesService.remove).toHaveBeenCalledWith('invoice-1');
      expect(result).toEqual({ id: 'invoice-1' });
    });
  });
});
