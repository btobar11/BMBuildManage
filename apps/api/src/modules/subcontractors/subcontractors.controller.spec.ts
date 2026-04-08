import { Test, TestingModule } from '@nestjs/testing';
import { SubcontractorsController } from './subcontractors.controller';
import { SubcontractorsService } from './subcontractors.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('SubcontractorsController', () => {
  let controller: SubcontractorsController;
  let service: SubcontractorsService;

  const mockSubcontractorsService = {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getContracts: jest.fn(),
    createContract: jest.fn(),
    getPayments: jest.fn(),
    createPayment: jest.fn(),
    getProjectSummary: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubcontractorsController],
      providers: [
        {
          provide: SubcontractorsService,
          useValue: mockSubcontractorsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SubcontractorsController>(SubcontractorsController);
    service = module.get<SubcontractorsService>(SubcontractorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all subcontractors', async () => {
      const expected = [{ id: 'sub-1', name: 'Sub 1' }];
      const user = { company_id: 'company-1' };
      mockSubcontractorsService.getAll.mockResolvedValue(expected);

      const result = await controller.getAll(user);

      expect(mockSubcontractorsService.getAll).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('POST /', () => {
    it('should create a subcontractor', async () => {
      const dto = { name: 'New Subcontractor' };
      const expected = { id: 'sub-1', ...dto };
      const user = { company_id: 'company-1' };
      mockSubcontractorsService.create.mockResolvedValue(expected);

      const result = await controller.create(user, dto);

      expect(mockSubcontractorsService.create).toHaveBeenCalledWith(
        'company-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a subcontractor', async () => {
      const dto = { name: 'Updated Sub' };
      const expected = { id: 'sub-1', ...dto };
      mockSubcontractorsService.update.mockResolvedValue(expected);

      const result = await controller.update('sub-1', dto);

      expect(mockSubcontractorsService.update).toHaveBeenCalledWith(
        'sub-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /project/:projectId/contracts', () => {
    it('should return contracts by project', async () => {
      const expected = [{ id: 'contract-1' }];
      mockSubcontractorsService.getContracts.mockResolvedValue(expected);

      const result = await controller.getContracts('proj-1');

      expect(mockSubcontractorsService.getContracts).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('POST /project/:projectId/contracts', () => {
    it('should create a contract', async () => {
      const dto = { subcontractor_id: 'sub-1', amount: 10000 };
      const expected = { id: 'contract-1', ...dto };
      mockSubcontractorsService.createContract.mockResolvedValue(expected);

      const result = await controller.createContract('proj-1', dto);

      expect(mockSubcontractorsService.createContract).toHaveBeenCalledWith(
        'proj-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /contracts/:contractId/payments', () => {
    it('should return payments by contract', async () => {
      const expected = [{ id: 'payment-1' }];
      mockSubcontractorsService.getPayments.mockResolvedValue(expected);

      const result = await controller.getPayments('contract-1');

      expect(mockSubcontractorsService.getPayments).toHaveBeenCalledWith(
        'contract-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('POST /contracts/:contractId/payments', () => {
    it('should create a payment', async () => {
      const dto = { amount: 5000 };
      const expected = { id: 'payment-1', ...dto };
      mockSubcontractorsService.createPayment.mockResolvedValue(expected);

      const result = await controller.createPayment('contract-1', dto);

      expect(mockSubcontractorsService.createPayment).toHaveBeenCalledWith(
        'contract-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /project/:projectId/summary', () => {
    it('should return project summary', async () => {
      const expected = { total: 50000, contracts: 5 };
      mockSubcontractorsService.getProjectSummary.mockResolvedValue(expected);

      const result = await controller.getProjectSummary('proj-1');

      expect(mockSubcontractorsService.getProjectSummary).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });
});
