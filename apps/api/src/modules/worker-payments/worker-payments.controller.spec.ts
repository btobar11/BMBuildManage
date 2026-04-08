import { Test, TestingModule } from '@nestjs/testing';
import { WorkerPaymentsController } from './worker-payments.controller';
import { WorkerPaymentsService } from './worker-payments.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockService = {
  create: jest.fn(),
  findAllByProject: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('WorkerPaymentsController', () => {
  let controller: WorkerPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerPaymentsController],
      providers: [
        {
          provide: WorkerPaymentsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<WorkerPaymentsController>(WorkerPaymentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a worker payment', async () => {
      const createDto: any = { worker_id: 'worker-1', amount: 1000 };
      const expected = { id: 'payment-1', ...createDto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all payments by project', async () => {
      const expected = [{ id: 'payment-1', amount: 1000 }];
      mockService.findAllByProject.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single payment', async () => {
      const expected = { id: 'payment-1', amount: 1000 };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('payment-1');

      expect(mockService.findOne).toHaveBeenCalledWith('payment-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a payment', async () => {
      const updateDto: any = { amount: 1500 };
      const expected = { id: 'payment-1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update('payment-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('payment-1', updateDto);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a payment', async () => {
      mockService.remove.mockResolvedValue({ id: 'payment-1' });

      const result = await controller.remove('payment-1');

      expect(mockService.remove).toHaveBeenCalledWith('payment-1');
      expect(result).toEqual({ id: 'payment-1' });
    });
  });
});
