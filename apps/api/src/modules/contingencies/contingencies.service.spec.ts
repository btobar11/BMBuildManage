import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContingenciesService } from './contingencies.service';
import { ProjectContingency } from './project-contingency.entity';
import { CreateContingencyDto } from './dto/create-contingency.dto';

const createMockContingency = (
  overrides?: Partial<ProjectContingency>,
): ProjectContingency =>
  ({
    id: 'contingency-1',
    project_id: 'project-1',
    description: 'Test Contingency',
    quantity: 10,
    unit_cost: 5000,
    total_cost: 50000,
    date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as ProjectContingency;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  })),
});

describe('ContingenciesService', () => {
  let service: ContingenciesService;
  let repo: jest.Mocked<Repository<ProjectContingency>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingenciesService,
        {
          provide: getRepositoryToken(ProjectContingency),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContingenciesService>(ContingenciesService);
    repo = module.get(getRepositoryToken(ProjectContingency));
  });

  describe('create', () => {
    it('should create a contingency', async () => {
      const dto: CreateContingencyDto = {
        project_id: 'project-1',
        description: 'New Contingency',
        quantity: 10,
        unit_cost: 1000,
      };
      const contingency = createMockContingency({
        quantity: 10,
        unit_cost: 1000,
        total_cost: 10000,
      });
      repo.create.mockReturnValue(contingency);
      repo.save.mockResolvedValue(contingency);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(contingency);
    });
  });

  describe('findByProject', () => {
    it('should return all contingencies for a project', async () => {
      const contingencies = [
        createMockContingency(),
        createMockContingency({ id: 'contingency-2' }),
      ];
      repo.find.mockResolvedValue(contingencies);

      const result = await service.findByProject('project-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(contingencies);
    });
  });

  describe('remove', () => {
    it('should remove a contingency', async () => {
      const contingency = createMockContingency();
      repo.findOne.mockResolvedValue(contingency);
      repo.remove.mockResolvedValue(contingency);

      const result = await service.remove('contingency-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'contingency-1' },
      });
      expect(repo.remove).toHaveBeenCalledWith(contingency);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if contingency not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('totalByProject', () => {
    it('should return total cost for a project', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '100000' }),
      };
      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.totalByProject('project-1');

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'SUM(c.total_cost)',
        'total',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'c.project_id = :projectId',
        { projectId: 'project-1' },
      );
      expect(result).toBe(100000);
    });

    it('should return 0 when no contingencies exist', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.totalByProject('project-1');

      expect(result).toBe(0);
    });
  });
});
