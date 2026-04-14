import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
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
    status: 'planning',
    address: 'Test address',
    region: 'Test region',
    commune: 'Test commune',
    type: ['construction'],
    start_date: new Date(),
    end_date: undefined,
    estimated_budget: 100000,
    estimated_price: 120000,
    estimated_area: 500,
    folder: undefined,
    created_at: new Date(),
    updated_at: new Date(),
    budgets: [],
    expenses: [],
    documents: [],
    stages: [],
    items: [],
    worker_assignments: [],
    worker_payments: [],
    project_payments: [],
    get location() {
      const parts = [this.address, this.commune, this.region].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '';
    },
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
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
        }),
      })),
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
      expect(projectRepo.create).toHaveBeenCalledWith(createDto);
      expect(projectRepo.save).toHaveBeenCalledWith(project);
      expect(result).toEqual(project);
    });
  });

  describe('findAll', () => {
    it('should return projects for a company', async () => {
      const projects = [
        createMockProject({ id: '1' }),
        createMockProject({ id: '2' }),
      ];
      projectRepo.find.mockResolvedValue(projects);

      const result = await service.findAll('company-1');
      expect(projectRepo.find).toHaveBeenCalledWith({
        where: { company_id: 'company-1' },
        relations: ['budgets'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(projects);
    });

    it('should patch estimated_budget from latest budget', async () => {
      const budget = {
        id: 'budget-1',
        project_id: 'test-id',
        total_estimated_price: 50000,
        version: 1,
      } as unknown as Budget;
      const projects = [createMockProject({ budgets: [budget] })];
      projectRepo.find.mockResolvedValue(projects);

      const result = await service.findAll('company-1');
      expect(result[0].estimated_budget).toBe(50000);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);

      const result = await service.findOne('test-id', 'company-1');
      expect(projectRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id', company_id: 'company-1' },
        relations: ['budgets', 'expenses', 'documents'],
      });
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = createMockProject();
      const updated = { ...project, name: 'Updated' };
      projectRepo.findOne.mockResolvedValue(project);
      projectRepo.merge.mockReturnValue(updated);
      projectRepo.save.mockResolvedValue(updated);

      const result = await service.update('test-id', 'company-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const project = createMockProject();
      projectRepo.findOne.mockResolvedValue(project);
      projectRepo.remove.mockResolvedValue(project);

      const result = await service.remove('test-id', 'company-1');
      expect(projectRepo.remove).toHaveBeenCalledWith(project);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('bulkUpdateFolder', () => {
    it('should update folder for multiple projects', async () => {
      const result = await service.bulkUpdateFolder(
        ['1', '2'],
        'folder-1',
        'company-1',
      );
      expect(result.updated).toBe(1);
    });
  });

  describe('addPayment', () => {
    it('should add a payment to a project', async () => {
      const project = createMockProject();
      const payment = createMockPayment();
      projectRepo.findOne.mockResolvedValue(project);
      paymentsRepo.create.mockReturnValue(payment);
      paymentsRepo.save.mockResolvedValue(payment);

      const result = await service.addPayment('test-id', 'company-1', {
        amount: 10000,
      });
      expect(paymentsRepo.create).toHaveBeenCalled();
      expect(paymentsRepo.save).toHaveBeenCalledWith(payment);
      expect(result).toEqual(payment);
    });
  });

  describe('findPayments', () => {
    it('should return payments for a project', async () => {
      const project = createMockProject();
      const payments = [createMockPayment()];
      projectRepo.findOne.mockResolvedValue(project);
      paymentsRepo.find.mockResolvedValue(payments);

      const result = await service.findPayments('test-id', 'company-1');
      expect(paymentsRepo.find).toHaveBeenCalledWith({
        where: { project_id: 'test-id' },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(payments);
    });
  });

  describe('removePayment', () => {
    it('should remove a payment', async () => {
      const payment = createMockPayment();
      paymentsRepo.findOne.mockResolvedValue(payment);
      paymentsRepo.remove.mockResolvedValue(payment);

      const result = await service.removePayment('payment-1', 'company-1');
      expect(paymentsRepo.remove).toHaveBeenCalledWith(payment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      paymentsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removePayment('nonexistent', 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if payment belongs to different company', async () => {
      const payment = createMockPayment({
        project: { company_id: 'other-company' } as Project,
      });
      paymentsRepo.findOne.mockResolvedValue(payment);

      await expect(
        service.removePayment('payment-1', 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkRemove', () => {
    it('should delete multiple projects and their dependencies', async () => {
      const queryRunner = {
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
        },
      };

      const dataSource = service['dataSource'] as jest.Mocked<DataSource>;
      dataSource.createQueryRunner.mockReturnValue(queryRunner as any);

      const result = await service.bulkRemove(['1', '2'], 'company-1');

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result.deleted).toBe(1);
    });

    it('should handle deletion with budgets and stages', async () => {
      const mockBudgets = [{ id: 'budget-1' } as Budget];
      const mockStages = [{ id: 'stage-1' } as Stage];

      const queryRunner = {
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
            find: jest
              .fn()
              .mockResolvedValueOnce(mockBudgets)
              .mockResolvedValueOnce(mockStages),
          }),
        },
      };

      const dataSource = service['dataSource'] as jest.Mocked<DataSource>;
      dataSource.createQueryRunner.mockReturnValue(queryRunner as any);

      const result = await service.bulkRemove(['1'], 'company-1');

      expect(queryRunner.manager.getRepository).toHaveBeenCalledWith(Budget);
      expect(queryRunner.manager.getRepository).toHaveBeenCalledWith(Stage);
      expect(result.deleted).toBe(1);
    });

    it('should rollback transaction on error', async () => {
      const queryRunner = {
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
            execute: jest.fn().mockRejectedValue(new Error('DB Error')),
          })),
          getRepository: jest.fn().mockReturnValue({
            find: jest.fn().mockResolvedValue([]),
          }),
        },
      };

      const dataSource = service['dataSource'] as jest.Mocked<DataSource>;
      dataSource.createQueryRunner.mockReturnValue(queryRunner as any);

      await expect(service.bulkRemove(['1'], 'company-1')).rejects.toThrow(
        'DB Error',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
