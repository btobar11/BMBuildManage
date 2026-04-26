import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { WorkerAssignment } from './worker-assignment.entity';

const mockAssignment = (overrides = {}): WorkerAssignment => ({
  id: 'test-id',
  company_id: 'company-1',
  worker_id: 'worker-1',
  project_id: 'project-1',
  daily_rate: 150,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-06-30'),
  performance_rating: 4.5,
  performance_notes: 'Good work',
  task_description: 'Engineering tasks',
  total_paid: 0,
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
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    getOne: jest.fn().mockResolvedValue(null),
  })),
});

describe('WorkerAssignmentsService', () => {
  let service: WorkerAssignmentsService;
  let repository: jest.Mocked<Repository<WorkerAssignment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerAssignmentsService,
        {
          provide: getRepositoryToken(WorkerAssignment),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkerAssignmentsService>(WorkerAssignmentsService);
    repository = module.get(getRepositoryToken(WorkerAssignment));
  });

  describe('create', () => {
    it('should create an assignment', async () => {
      const createDto = {
        worker_id: 'worker-1',
        project_id: 'project-1',
        daily_rate: 150,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };
      const assignment = mockAssignment();
      repository.create.mockReturnValue(assignment);
      repository.save.mockResolvedValue(assignment);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(assignment);
      expect(result).toEqual(assignment);
    });
  });

  describe('checkOverlap', () => {
    it('should throw error when start_date is after end_date', async () => {
      const createDto = {
        worker_id: 'worker-1',
        project_id: 'project-1',
        daily_rate: 150,
        start_date: '2024-06-30',
        end_date: '2024-01-01',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllByProject', () => {
    it('should return assignments for a project', async () => {
      const assignments = [mockAssignment(), mockAssignment({ id: '2' })];
      repository.find.mockResolvedValue(assignments);

      const result = await service.findAllByProject('project-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        relations: ['worker'],
      });
      expect(result).toEqual(assignments);
    });
  });

  describe('findOne', () => {
    it('should return an assignment by id', async () => {
      const assignment = mockAssignment();
      repository.findOne.mockResolvedValue(assignment);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['worker', 'project'],
      });
      expect(result).toEqual(assignment);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an assignment', async () => {
      const assignment = mockAssignment();
      const updatedAssignment = { ...assignment, daily_rate: 200 };
      repository.findOne.mockResolvedValue(assignment);
      repository.merge.mockReturnValue(updatedAssignment);
      repository.save.mockResolvedValue(updatedAssignment);

      const result = await service.update('test-id', { daily_rate: 200 });
      expect(result.daily_rate).toBe(200);
    });

    it('should check overlap when updating dates', async () => {
      const assignment = mockAssignment();
      const updatedAssignment = {
        ...assignment,
        end_date: new Date('2024-12-31'),
      };
      repository.findOne.mockResolvedValue(assignment);
      repository.merge.mockReturnValue(updatedAssignment);
      repository.save.mockResolvedValue(updatedAssignment);

      const result = await service.update('test-id', {
        end_date: '2024-12-31',
      });
      expect(repository.findOne).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an assignment', async () => {
      const assignment = mockAssignment();
      repository.findOne.mockResolvedValue(assignment);
      repository.remove.mockResolvedValue(assignment);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(assignment);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getSummaryByProject', () => {
    it('should return total paid for a project', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '50000' }),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getSummaryByProject('project-1');
      expect(qb.select).toHaveBeenCalledWith(
        'SUM(assignment.total_paid)',
        'total',
      );
      expect(result).toEqual({ total: 50000 });
    });

    it('should return 0 when no payments exist', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getSummaryByProject('project-1');
      expect(result).toEqual({ total: 0 });
    });
  });
});
