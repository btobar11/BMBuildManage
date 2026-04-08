import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkerPaymentsService } from './worker-payments.service';
import { WorkerPayment, PaymentType } from './worker-payment.entity';

const mockPayment = (overrides = {}): WorkerPayment => ({
  id: 'test-id',
  worker_id: 'worker-1',
  project_id: 'project-1',
  amount: 1000,
  payment_type: PaymentType.CASH,
  date: new Date(),
  notes: 'Monthly payment',
  created_at: new Date(),
  worker: {} as any,
  project: {} as any,
  ...overrides,
});

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('WorkerPaymentsService', () => {
  let service: WorkerPaymentsService;
  let repository: jest.Mocked<Repository<WorkerPayment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerPaymentsService,
        {
          provide: getRepositoryToken(WorkerPayment),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkerPaymentsService>(WorkerPaymentsService);
    repository = module.get(getRepositoryToken(WorkerPayment));
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const createDto = {
        worker_id: 'worker-1',
        project_id: 'project-1',
        amount: 1000,
        date: '2024-01-15',
      };
      const payment = mockPayment();
      repository.create.mockReturnValue(payment);
      repository.save.mockResolvedValue(payment);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(payment);
      expect(result).toEqual(payment);
    });
  });

  describe('findAllByProject', () => {
    it('should return payments for a project', async () => {
      const payments = [mockPayment(), mockPayment({ id: '2' })];
      repository.find.mockResolvedValue(payments);

      const result = await service.findAllByProject('project-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['worker'],
      });
      expect(result).toEqual(payments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const payment = mockPayment();
      repository.findOne.mockResolvedValue(payment);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['worker', 'project'],
      });
      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const payment = mockPayment();
      const updatedPayment = { ...payment, amount: 2000 };
      repository.findOne.mockResolvedValue(payment);
      repository.merge.mockReturnValue(updatedPayment);
      repository.save.mockResolvedValue(updatedPayment);

      const result = await service.update('test-id', { amount: 2000 });
      expect(result.amount).toBe(2000);
    });
  });

  describe('remove', () => {
    it('should remove a payment', async () => {
      const payment = mockPayment();
      repository.findOne.mockResolvedValue(payment);
      repository.remove.mockResolvedValue(payment);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(payment);
      expect(result).toEqual({ deleted: true });
    });
  });
});
