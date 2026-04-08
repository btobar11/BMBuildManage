import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { Worker } from './worker.entity';

const mockWorker = (overrides = {}): Worker => ({
  id: 'test-id',
  company_id: 'company-1',
  name: 'John Doe',
  role: 'Engineer',
  daily_rate: 150,
  phone: '123456',
  skills: 'carpenter',
  rating: 4.5,
  notes: 'Good worker',
  assignments: [],
  payments: [],
  created_at: new Date(),
  updated_at: new Date(),
  company: {} as any,
  ...overrides,
});

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  })),
});

describe('WorkersService', () => {
  let service: WorkersService;
  let repository: jest.Mocked<Repository<Worker>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        { provide: getRepositoryToken(Worker), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<WorkersService>(WorkersService);
    repository = module.get(getRepositoryToken(Worker));
  });

  describe('create', () => {
    it('should create a worker', async () => {
      const createDto = {
        company_id: 'company-1',
        name: 'John Doe',
        role: 'Engineer',
        daily_rate: 150,
      };
      const worker = mockWorker(createDto);
      repository.create.mockReturnValue(worker);
      repository.save.mockResolvedValue(worker);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(worker);
      expect(result).toEqual(worker);
    });
  });

  describe('findAll', () => {
    it('should return all workers for a company', async () => {
      const workers = [
        mockWorker({ id: '1', name: 'John' }),
        mockWorker({ id: '2', name: 'Jane' }),
      ];
      const qb = {
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(workers),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAll('company-1');
      expect(qb.where).toHaveBeenCalledWith('worker.company_id = :companyId', {
        companyId: 'company-1',
      });
      expect(result).toEqual(workers);
    });

    it('should filter by project when projectId is provided', async () => {
      const qb = {
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll('company-1', 'project-1');
      expect(qb.innerJoin).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a worker by id', async () => {
      const worker = mockWorker();
      repository.findOne.mockResolvedValue(worker);

      const result = await service.findOne('test-id', 'company-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id', company_id: 'company-1' },
        relations: ['assignments', 'assignments.project', 'payments'],
      });
      expect(result).toEqual(worker);
    });

    it('should throw NotFoundException if worker not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a worker', async () => {
      const worker = mockWorker();
      const updatedWorker = { ...worker, name: 'Jane' };
      repository.findOne.mockResolvedValue(worker);
      repository.merge.mockReturnValue(updatedWorker);
      repository.save.mockResolvedValue(updatedWorker);

      const result = await service.update('test-id', 'company-1', {
        name: 'Jane',
      });
      expect(result.name).toBe('Jane');
    });
  });

  describe('remove', () => {
    it('should remove a worker without assignments', async () => {
      const worker = mockWorker({ assignments: [] });
      repository.findOne.mockResolvedValue(worker);
      repository.remove.mockResolvedValue(worker);

      const result = await service.remove('test-id', 'company-1');
      expect(repository.remove).toHaveBeenCalledWith(worker);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw BadRequestException if worker has assignments', async () => {
      const worker = mockWorker({ assignments: [{ id: '1' } as any] });
      repository.findOne.mockResolvedValue(worker);

      await expect(service.remove('test-id', 'company-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should remove worker with null assignments', async () => {
      const worker = mockWorker({ assignments: null });
      repository.findOne.mockResolvedValue(worker);
      repository.remove.mockResolvedValue(worker);

      const result = await service.remove('test-id', 'company-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
