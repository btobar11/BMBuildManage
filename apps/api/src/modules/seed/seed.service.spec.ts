import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Company } from '../companies/company.entity';
import { Resource } from '../resources/resource.entity';
import { ApuTemplate } from '../apu/apu-template.entity';
import { Worker } from '../workers/worker.entity';
import { Unit } from '../units/unit.entity';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Expense } from '../expenses/expense.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';
import { User } from '../users/user.entity';

const createMockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  remove: jest.fn(),
});

describe('SeedService', () => {
  let service: SeedService;
  let companyRepo: any;
  let userRepo: any;
  let resourceRepo: any;
  let apuRepo: any;
  let workerRepo: any;
  let unitRepo: any;
  let projectRepo: any;
  let budgetRepo: any;
  let stageRepo: any;
  let itemRepo: any;
  let expenseRepo: any;
  let contingencyRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Company), useFactory: createMockRepo },
        { provide: getRepositoryToken(User), useFactory: createMockRepo },
        { provide: getRepositoryToken(Resource), useFactory: createMockRepo },
        {
          provide: getRepositoryToken(ApuTemplate),
          useFactory: createMockRepo,
        },
        { provide: getRepositoryToken(Worker), useFactory: createMockRepo },
        { provide: getRepositoryToken(Unit), useFactory: createMockRepo },
        { provide: getRepositoryToken(Project), useFactory: createMockRepo },
        { provide: getRepositoryToken(Budget), useFactory: createMockRepo },
        { provide: getRepositoryToken(Stage), useFactory: createMockRepo },
        { provide: getRepositoryToken(Item), useFactory: createMockRepo },
        { provide: getRepositoryToken(Expense), useFactory: createMockRepo },
        {
          provide: getRepositoryToken(ProjectContingency),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    companyRepo = module.get(getRepositoryToken(Company));
    userRepo = module.get(getRepositoryToken(User));
    resourceRepo = module.get(getRepositoryToken(Resource));
    apuRepo = module.get(getRepositoryToken(ApuTemplate));
    workerRepo = module.get(getRepositoryToken(Worker));
    unitRepo = module.get(getRepositoryToken(Unit));
    projectRepo = module.get(getRepositoryToken(Project));
    budgetRepo = module.get(getRepositoryToken(Budget));
    stageRepo = module.get(getRepositoryToken(Stage));
    itemRepo = module.get(getRepositoryToken(Item));
    expenseRepo = module.get(getRepositoryToken(Expense));
    contingencyRepo = module.get(getRepositoryToken(ProjectContingency));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedDemoData', () => {
    it('should create demo company when none exists', async () => {
      companyRepo.findOne.mockResolvedValue(null);
      companyRepo.create.mockReturnValue({
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Demo Constructora',
      });
      companyRepo.save.mockResolvedValue({});

      unitRepo.count.mockResolvedValue(0);
      unitRepo.find.mockReturnValue([]);
      unitRepo.create.mockReturnValue([]);
      unitRepo.save.mockResolvedValue([]);

      resourceRepo.count.mockResolvedValue(0);
      apuRepo.count.mockResolvedValue(0);
      workerRepo.count.mockResolvedValue(0);
      projectRepo.findOne.mockResolvedValue(null);
      projectRepo.save.mockResolvedValue({ id: 'project-id' });
      budgetRepo.findOne.mockResolvedValue(null);
      budgetRepo.count.mockResolvedValue(0);
      budgetRepo.create.mockReturnValue({});
      budgetRepo.save.mockResolvedValue({});
      stageRepo.findOne.mockResolvedValue(null);
      stageRepo.create.mockReturnValue({});
      stageRepo.save.mockResolvedValue({});
      itemRepo.count.mockResolvedValue(0);
      itemRepo.create.mockReturnValue([]);
      itemRepo.save.mockResolvedValue([]);
      expenseRepo.count.mockResolvedValue(0);
      expenseRepo.create.mockReturnValue([]);
      expenseRepo.save.mockResolvedValue([]);
      contingencyRepo.count.mockResolvedValue(0);
      contingencyRepo.create.mockReturnValue([]);
      contingencyRepo.save.mockResolvedValue([]);

      const result = await service.seedDemoData();

      expect(companyRepo.create).toHaveBeenCalled();
      expect(companyRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Demo data seeded successfully with realistic projects',
      });
    });

    it('should skip company creation when demo company exists', async () => {
      companyRepo.findOne.mockResolvedValue({
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Demo Constructora',
      });

      unitRepo.count.mockResolvedValue(0);
      unitRepo.find.mockReturnValue([]);
      unitRepo.create.mockReturnValue([]);
      unitRepo.save.mockResolvedValue([]);

      resourceRepo.count.mockResolvedValue(0);
      apuRepo.count.mockResolvedValue(0);
      workerRepo.count.mockResolvedValue(0);
      projectRepo.findOne.mockResolvedValue(null);
      projectRepo.save.mockResolvedValue({ id: 'project-id' });
      budgetRepo.findOne.mockResolvedValue(null);
      budgetRepo.count.mockResolvedValue(0);
      budgetRepo.create.mockReturnValue({});
      budgetRepo.save.mockResolvedValue({});
      stageRepo.findOne.mockResolvedValue(null);
      stageRepo.create.mockReturnValue({});
      stageRepo.save.mockResolvedValue({});
      itemRepo.count.mockResolvedValue(0);
      itemRepo.create.mockReturnValue([]);
      itemRepo.save.mockResolvedValue([]);
      expenseRepo.count.mockResolvedValue(0);
      expenseRepo.create.mockReturnValue([]);
      expenseRepo.save.mockResolvedValue([]);
      contingencyRepo.count.mockResolvedValue(0);
      contingencyRepo.create.mockReturnValue([]);
      contingencyRepo.save.mockResolvedValue([]);

      const result = await service.seedDemoData();

      expect(companyRepo.create).not.toHaveBeenCalled();
      expect(companyRepo.save).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should seed units when none exist', async () => {
      companyRepo.findOne.mockResolvedValue({
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Demo Constructora',
      });

      unitRepo.count.mockResolvedValue(0);
      unitRepo.find.mockReturnValue([]);
      unitRepo.create.mockImplementation((units: any) => units);
      unitRepo.save.mockResolvedValue([]);

      resourceRepo.count.mockResolvedValue(0);
      apuRepo.count.mockResolvedValue(0);
      workerRepo.count.mockResolvedValue(0);
      projectRepo.findOne.mockResolvedValue(null);
      projectRepo.save.mockResolvedValue({ id: 'project-id' });
      budgetRepo.findOne.mockResolvedValue(null);
      budgetRepo.count.mockResolvedValue(0);
      budgetRepo.create.mockReturnValue({});
      budgetRepo.save.mockResolvedValue({});
      stageRepo.findOne.mockResolvedValue(null);
      stageRepo.create.mockReturnValue({});
      stageRepo.save.mockResolvedValue({});
      itemRepo.count.mockResolvedValue(0);
      itemRepo.create.mockReturnValue([]);
      itemRepo.save.mockResolvedValue([]);
      expenseRepo.count.mockResolvedValue(0);
      expenseRepo.create.mockReturnValue([]);
      expenseRepo.save.mockResolvedValue([]);
      contingencyRepo.count.mockResolvedValue(0);
      contingencyRepo.create.mockReturnValue([]);
      contingencyRepo.save.mockResolvedValue([]);

      await service.seedDemoData();

      expect(unitRepo.create).toHaveBeenCalled();
      expect(unitRepo.save).toHaveBeenCalled();
    });

    it('should skip seeding units when they already exist', async () => {
      companyRepo.findOne.mockResolvedValue({
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Demo Constructora',
      });

      unitRepo.count.mockResolvedValue(8);
      unitRepo.find.mockReturnValue([
        { symbol: 'un', name: 'Unidad' },
        { symbol: 'm3', name: 'Metro Cubico' },
      ]);

      resourceRepo.count.mockResolvedValue(0);
      apuRepo.count.mockResolvedValue(0);
      workerRepo.count.mockResolvedValue(0);
      projectRepo.findOne.mockResolvedValue(null);
      projectRepo.save.mockResolvedValue({ id: 'project-id' });
      budgetRepo.findOne.mockResolvedValue(null);
      budgetRepo.count.mockResolvedValue(0);
      budgetRepo.create.mockReturnValue({});
      budgetRepo.save.mockResolvedValue({});
      stageRepo.findOne.mockResolvedValue(null);
      stageRepo.create.mockReturnValue({});
      stageRepo.save.mockResolvedValue({});
      itemRepo.count.mockResolvedValue(0);
      itemRepo.create.mockReturnValue([]);
      itemRepo.save.mockResolvedValue([]);
      expenseRepo.count.mockResolvedValue(0);
      expenseRepo.create.mockReturnValue([]);
      expenseRepo.save.mockResolvedValue([]);
      contingencyRepo.count.mockResolvedValue(0);
      contingencyRepo.create.mockReturnValue([]);
      contingencyRepo.save.mockResolvedValue([]);

      await service.seedDemoData();

      expect(unitRepo.create).not.toHaveBeenCalled();
    });

    it('should seed resources when none exist for company', async () => {
      companyRepo.findOne.mockResolvedValue({
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Demo Constructora',
      });

      unitRepo.count.mockResolvedValue(8);
      unitRepo.find.mockReturnValue([
        { symbol: 'un', name: 'Unidad' },
        { symbol: 'm3', name: 'Metro Cubico' },
        { symbol: 'día', name: 'Dia' },
      ]);
      unitRepo.create.mockImplementation((u: any) => u);
      unitRepo.save.mockResolvedValue([]);

      resourceRepo.count.mockResolvedValue(0);
      resourceRepo.create.mockImplementation((r: any) => r);
      resourceRepo.save.mockResolvedValue([]);

      apuRepo.count.mockResolvedValue(0);
      workerRepo.count.mockResolvedValue(0);
      projectRepo.findOne.mockResolvedValue(null);
      projectRepo.save.mockResolvedValue({ id: 'project-id' });
      budgetRepo.findOne.mockResolvedValue(null);
      budgetRepo.count.mockResolvedValue(0);
      budgetRepo.create.mockReturnValue({});
      budgetRepo.save.mockResolvedValue({});
      stageRepo.findOne.mockResolvedValue(null);
      stageRepo.create.mockReturnValue({});
      stageRepo.save.mockResolvedValue({});
      itemRepo.count.mockResolvedValue(0);
      itemRepo.create.mockReturnValue([]);
      itemRepo.save.mockResolvedValue([]);
      expenseRepo.count.mockResolvedValue(0);
      expenseRepo.create.mockReturnValue([]);
      expenseRepo.save.mockResolvedValue([]);
      contingencyRepo.count.mockResolvedValue(0);
      contingencyRepo.create.mockReturnValue([]);
      contingencyRepo.save.mockResolvedValue([]);

      await service.seedDemoData();

      expect(resourceRepo.save).toHaveBeenCalled();
    });

    it('should handle errors and throw exception', async () => {
      companyRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.seedDemoData()).rejects.toThrow('Database error');
    });
  });
});
