import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { ProjectPayment } from './project-payment.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';

const createMockProject = (overrides?: Partial<Project>): Project =>
  ({
    id: 'test-id',
    company_id: 'company-1',
    name: 'Project 1',
    description: 'Test project',
    address: 'Test address',
    region: 'Test region',
    commune: 'Test commune',
    status: 'planning' as any,
    type: [],
    start_date: new Date(),
    end_date: null,
    estimated_budget: 100000,
    actual_cost: 0,
    folder: null,
    created_at: new Date(),
    updated_at: new Date(),
    budgets: [],
    expenses: [],
    documents: [],
    ...overrides,
  }) as unknown as Project;

const createMockPayment = (
  overrides?: Partial<ProjectPayment>,
): ProjectPayment =>
  ({
    id: 'payment-1',
    project_id: 'test-id',
    amount: 10000,
    date: new Date(),
    description: 'Test payment',
    created_at: new Date(),
    project: { company_id: 'company-1' } as Project,
    ...overrides,
  }) as unknown as ProjectPayment;

const mockProjectRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  })),
});

const mockPaymentsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockDataSource = () => ({
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      })),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
      remove: jest.fn().mockResolvedValue({}),
    },
  })),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: jest.Mocked<Repository<Project>>;
  let paymentsRepo: jest.Mocked<Repository<ProjectPayment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useFactory: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(ProjectPayment),
          useFactory: mockPaymentsRepository,
        },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get(getRepositoryToken(Project));
    paymentsRepo = module.get(getRepositoryToken(ProjectPayment));
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto = {
        company_id: 'company-1',
        name: 'Project 1',
        address: 'Test address',
        region: 'Test region',
        commune: 'Test commune',
      };
      const project = createMockProject(createDto);
      projectRepo.create.mockReturnValue(project);
      projectRepo.save.mockResolvedValue(project);

      const result = await service.create(createDto as any);
      expect(result).toEqual(project);
    });

    it('should throw BadRequestException for NOT NULL violation (23502)', async () => {
      projectRepo.save.mockRejectedValue({
        code: '23502',
        column: 'name',
        message: 'fail',
      });
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for UNIQUE violation (23505)', async () => {
      projectRepo.save.mockRejectedValue({ code: '23505', message: 'fail' });
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for data type mismatch (22P01)', async () => {
      projectRepo.save.mockRejectedValue({ code: '22P01', message: 'fail' });
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for dynamic type mismatch (42804)', async () => {
      projectRepo.save.mockRejectedValue({ code: '42804', message: 'fail' });
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for generic errors', async () => {
      projectRepo.save.mockRejectedValue(new Error('Generic Error'));
      await expect(service.create({} as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return projects for a company', async () => {
      const projects = [createMockProject({ id: '1' })];
      projectRepo.find.mockResolvedValue(projects);
      const result = await service.findAll('company-1');
      expect(result).toEqual(projects);
    });

    it('should patch estimated_budget from latest budget version', async () => {
      const budget1 = {
        id: 'b1',
        total_estimated_price: 100,
        version: 1,
      } as Budget;
      const budget2 = {
        id: 'b2',
        total_estimated_price: 200,
        version: 2,
      } as Budget;
      const project = createMockProject({ budgets: [budget1, budget2] });
      projectRepo.find.mockResolvedValue([project]);

      const result = await service.findAll('company-1');
      expect(result[0].estimated_budget).toBe(200);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      projectRepo.save.mockResolvedValue(project);
      const result = await service.update('test-id', 'company-1', {
        name: 'New',
      });
      expect(result).toBeDefined();
    });
  });

  describe('bulkUpdateFolder', () => {
    it('should handle null folder', async () => {
      const result = await service.bulkUpdateFolder(['1'], null, 'company-1');
      expect(result.updated).toBe(1);
    });
  });

  describe('bulkRemove', () => {
    it('should rollback and rethrow on error', async () => {
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          createQueryBuilder: jest.fn().mockImplementation(() => {
            throw new Error('Immediate Failure');
          }),
        },
      };
      (service as any).dataSource.createQueryRunner.mockReturnValue(
        queryRunner,
      );

      await expect(service.bulkRemove(['1'], 'company-1')).rejects.toThrow(
        'Immediate Failure',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      projectRepo.remove.mockResolvedValue(project);
      const result = await service.remove('test-id', 'company-1');
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      const result = await service.findOne('test-id', 'company-1');
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findOne('non-existent', 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPayment', () => {
    it('should add a payment to a project', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      const paymentData = {
        amount: 5000,
        date: new Date(),
        description: 'Payment 1',
      };
      paymentsRepo.create.mockReturnValue(paymentData as any);
      paymentsRepo.save.mockResolvedValue(paymentData as any);
      const result = await service.addPayment(
        'test-id',
        'company-1',
        paymentData,
      );
      expect(result).toEqual(paymentData);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.addPayment('non-existent', 'company-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPayments', () => {
    it('should return payments for a project', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      const payments = [
        createMockPayment({ id: 'p1' }),
        createMockPayment({ id: 'p2' }),
      ];
      paymentsRepo.find.mockResolvedValue(payments);
      const result = await service.findPayments('test-id', 'company-1');
      expect(result).toEqual(payments);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findPayments('non-existent', 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkRemove', () => {
    it('should delete projects and all dependencies', async () => {
      const mockBudgets = [{ id: 'budget-1' }];
      const mockStages = [{ id: 'stage-1', budget_id: 'budget-1' }];
      const mockItems = [{ id: 'item-1', stage_id: 'stage-1' }];

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      const mockBudgetRepo = { find: jest.fn().mockResolvedValue(mockBudgets) };
      const mockStageRepo = { find: jest.fn().mockResolvedValue(mockStages) };
      const mockItemRepo = { find: jest.fn().mockResolvedValue(mockItems) };

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Budget) return mockBudgetRepo;
            if (entity === Stage) return mockStageRepo;
            return mockItemRepo;
          }),
        },
      };

      (service as any).dataSource.createQueryRunner.mockReturnValue(
        queryRunner,
      );

      const result = await service.bulkRemove(['test-id'], 'company-1');
      expect(result.deleted).toBe(1);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle projects with no budgets', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      const mockBudgetRepo = { find: jest.fn().mockResolvedValue([]) };

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          getRepository: jest.fn().mockReturnValue(mockBudgetRepo),
        },
      };

      (service as any).dataSource.createQueryRunner.mockReturnValue(
        queryRunner,
      );

      const result = await service.bulkRemove(['test-id'], 'company-1');
      expect(result.deleted).toBe(1);
    });
  });

  describe('bulkUpdateFolder', () => {
    it('should update folder for multiple projects', async () => {
      const result = await service.bulkUpdateFolder(
        ['1', '2'],
        '/new-folder',
        'company-1',
      );
      expect(result.updated).toBe(1);
    });

    it('should handle empty ids array', async () => {
      (projectRepo.createQueryBuilder as any).mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      }));
      const result = await service.bulkUpdateFolder([], '/folder', 'company-1');
      expect(result.updated).toBe(0);
    });
  });
});
