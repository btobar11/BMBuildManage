import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AIService } from './ai.service';
import { Project, ProjectStatus } from '../projects/project.entity';
import { Budget, BudgetStatus } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Worker } from '../workers/worker.entity';
import { FinancialService } from '../budgets/financial.service';
import { BIMAnalyticsService } from './bim-analytics.service';

const createMockProject = (overrides?: Partial<Project>): Project => {
  const project = {
    id: 'project-1',
    company_id: 'company-1',
    company: null,
    name: 'Test Project',
    description: 'Test description',
    status: ProjectStatus.IN_PROGRESS,
    client_id: null,
    client: null,
    location: 'Test location',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    estimated_budget: 100000,
    actual_cost: 50000,
    folder: null,
    created_at: new Date(),
    updated_at: new Date(),
    budgets: [],
    expenses: [],
    documents: [],
    stages: [],
    items: [],
    ...overrides,
  } as unknown as Project;
  return project;
};

const createMockBudget = (overrides?: Partial<Budget>): Budget => {
  const budget = {
    id: 'budget-1',
    project_id: 'project-1',
    company_id: 'company-1',
    name: 'Main Budget',
    status: 'active' as const,
    is_active: true,
    total_estimated_cost: 80000,
    total_estimated_price: 100000,
    total_executed_cost: 40000,
    version: 1,
    created_at: new Date(),
    updated_at: new Date(),
    project: null,
    stages: [],
    ...overrides,
  } as unknown as Budget;
  return budget;
};

const createMockStage = (overrides?: Partial<Stage>): Stage => {
  const stage = {
    id: 'stage-1',
    budget_id: 'budget-1',
    name: 'Foundation',
    order: 1,
    estimated_cost: 20000,
    executed_cost: 10000,
    created_at: new Date(),
    updated_at: new Date(),
    items: [],
    budget: null,
    ...overrides,
  } as unknown as Stage;
  return stage;
};

const createMockItem = (overrides?: Partial<Item>): Item => {
  const item = {
    id: 'item-1',
    stage_id: 'stage-1',
    name: 'Concrete',
    description: 'Concrete work',
    unit: 'm3',
    quantity: 100,
    quantity_executed: 50,
    unit_cost: 50,
    unit_price: 75,
    created_at: new Date(),
    updated_at: new Date(),
    stage: null,
    ...overrides,
  } as unknown as Item;
  return item;
};

const createMockWorker = (overrides?: Partial<Worker>): Worker => {
  const worker = {
    id: 'worker-1',
    company_id: 'company-1',
    name: 'John Doe',
    role: 'Mason',
    phone: '1234567890',
    email: 'john@test.com',
    daily_rate: 150,
    rating: 4.5,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as unknown as Worker;
  return worker;
};

const mockProjectRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockBudgetRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockStageRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockItemRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockWorkerRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockDataSource = () => ({
  createQueryRunner: jest.fn(),
});

const mockFinancialService = () => ({
  getProjectSummary: jest.fn(),
});

describe('AIService', () => {
  let service: AIService;
  let projectRepo: any;
  let budgetRepo: any;
  let stageRepo: any;
  let itemRepo: any;
  let workerRepo: any;
  let financialService: any;
  let bimAnalyticsService: any;

  const mockBIMAnalyticsService = {
    getModelStatistics: jest.fn().mockResolvedValue({
      total_elements: 0,
      by_discipline: {},
      by_ifc_type: {},
    }),
    generateProgressReport: jest.fn().mockResolvedValue({
      overall_progress: 0,
      by_phase: {},
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: getRepositoryToken(Project),
          useFactory: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(Budget),
          useFactory: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Stage),
          useFactory: mockStageRepository,
        },
        {
          provide: getRepositoryToken(Item),
          useFactory: mockItemRepository,
        },
        {
          provide: getRepositoryToken(Worker),
          useFactory: mockWorkerRepository,
        },
        { provide: DataSource, useFactory: mockDataSource },
        { provide: FinancialService, useFactory: mockFinancialService },
        { provide: BIMAnalyticsService, useValue: mockBIMAnalyticsService },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    projectRepo = module.get(getRepositoryToken(Project));
    budgetRepo = module.get(getRepositoryToken(Budget));
    stageRepo = module.get(getRepositoryToken(Stage));
    itemRepo = module.get(getRepositoryToken(Item));
    workerRepo = module.get(getRepositoryToken(Worker));
    financialService = module.get(FinancialService);
    bimAnalyticsService = module.get(BIMAnalyticsService);
  });

  describe('processNaturalLanguageQuery', () => {
    describe('project status intent', () => {
      it('should handle project status query with no projects', async () => {
        projectRepo.find.mockResolvedValue([]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result.answer).toBe('No tengo proyectos activos para mostrar.');
        expect(result.confidence).toBe(0.9);
      });

      it('should handle project status query with projects', async () => {
        const mockItem = createMockItem();
        const mockStage = createMockStage({ items: [mockItem] });
        const mockBudget = createMockBudget({ stages: [mockStage] });
        const project = createMockProject({ budgets: [mockBudget] });

        projectRepo.find.mockResolvedValue([project]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'cómo va el proyecto',
        );

        expect(result.answer).toContain('proyecto(s)');
        expect(result.data).toHaveProperty('projects');
        expect(result.confidence).toBe(0.85);
      });

      it('should handle project status query with specific project', async () => {
        const mockItem = createMockItem();
        const mockStage = createMockStage({ items: [mockItem] });
        const mockBudget = createMockBudget({ stages: [mockStage] });
        const project = createMockProject({ budgets: [mockBudget] });

        projectRepo.findOne.mockResolvedValue(project);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
          { projectId: 'project-1' },
        );

        expect(result.answer).toContain('proyecto(s)');
        expect(result.data).toHaveProperty('projects');
      });
    });

    describe('budget intent', () => {
      it('should handle budget query with no budgets', async () => {
        projectRepo.find.mockResolvedValue([]);
        budgetRepo.find.mockResolvedValue([]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'presupuesto',
        );

        expect(result.answer).toBe('No encontré presupuestos.');
        expect(result.confidence).toBe(0.9);
      });

      it('should handle budget query with budgets', async () => {
        const mockItem = createMockItem();
        const mockStage = createMockStage({ items: [mockItem] });
        const mockBudget = createMockBudget({
          stages: [mockStage],
          project: { name: 'Test Project' } as any,
        });
        const project = createMockProject();

        projectRepo.find.mockResolvedValue([project]);
        budgetRepo.find.mockResolvedValue([mockBudget]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'cuánto cuesta el presupuesto',
        );

        expect(result.answer).toContain('Presupuesto total');
        expect(result.data).toHaveProperty('budgets');
        expect(result.confidence).toBe(0.9);
      });

      it('should detect budget overrun', async () => {
        const expensiveItem = createMockItem({
          quantity: 100,
          quantity_executed: 120,
          unit_cost: 100,
          unit_price: 80,
        });
        const mockStage = createMockStage({ items: [expensiveItem] });
        const mockBudget = createMockBudget({
          stages: [mockStage],
          project: { name: 'Test Project' } as any,
        });
        const project = createMockProject();

        projectRepo.find.mockResolvedValue([project]);
        budgetRepo.find.mockResolvedValue([mockBudget]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'presupuesto',
        );

        expect(result.answer).toContain('sobrecostes');
      });
    });

    describe('schedule intent', () => {
      it('should handle schedule query with no projects', async () => {
        projectRepo.find.mockResolvedValue([]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'cronograma del proyecto',
        );

        expect(result.answer).toBe('No hay proyectos activos.');
        expect(result.confidence).toBe(0.9);
      });

      it('should handle schedule query with projects', async () => {
        const project = createMockProject({
          status: ProjectStatus.IN_PROGRESS,
        });

        projectRepo.find.mockResolvedValue([project]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'retraso del proyecto',
        );

        expect(result.data).toHaveProperty('schedule');
        expect(result.confidence).toBe(0.8);
      });
    });

    describe('workers intent', () => {
      it('should handle workers query with no workers', async () => {
        workerRepo.find.mockResolvedValue([]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'trabajadores',
        );

        expect(result.answer).toBe('No hay trabajadores registrados.');
        expect(result.confidence).toBe(0.9);
      });

      it('should handle workers query with workers', async () => {
        const worker1 = createMockWorker({
          role: 'Mason',
          rating: 4.5,
          daily_rate: 150,
        });
        const worker2 = createMockWorker({
          role: 'Carpenter',
          rating: 4.0,
          daily_rate: 140,
        });

        workerRepo.find.mockResolvedValue([worker1, worker2]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'equipo de trabajo',
        );

        expect(result.answer).toContain('trabajador(es)');
        expect(result.data).toHaveProperty('workers');
        expect(result.confidence).toBe(0.9);
      });
    });

    describe('recommendation intent', () => {
      it('should handle recommendation query', async () => {
        const mockItem = createMockItem({
          quantity: 100,
          quantity_executed: 50,
          unit_cost: 50,
        });
        const mockStage = createMockStage({ items: [mockItem] });
        const mockBudget = createMockBudget({ stages: [mockStage] });
        const project = createMockProject({
          budgets: [mockBudget],
          status: ProjectStatus.IN_PROGRESS,
        });

        projectRepo.find.mockResolvedValue([project]);

        const result = await service.generateRecommendations('company-1');

        expect(result.data).toHaveProperty('insights');
        expect(result.confidence).toBe(0.8);
      });
    });

    describe('prediction intent', () => {
      it('should handle prediction query', async () => {
        const project = createMockProject({
          status: ProjectStatus.IN_PROGRESS,
        });

        projectRepo.find.mockResolvedValue([project]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'pronóstico del proyecto',
        );

        expect(result.data).toHaveProperty('predictions');
        expect(result.confidence).toBe(0.75);
      });

      it('should return message when no projects for prediction', async () => {
        projectRepo.find.mockResolvedValue([]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'predice el resultado',
        );

        expect(result.answer).toBe('No hay proyectos para predecir.');
        expect(result.confidence).toBe(0.9);
      });
    });

    describe('general query handling', () => {
      it('should handle help query', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'ayuda',
        );

        expect(result.answer).toContain('estado de proyectos');
        expect(result.confidence).toBe(0.95);
      });

      it('should handle greeting', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'hola',
        );

        expect(result.answer).toContain('Hola');
        expect(result.confidence).toBe(0.95);
      });

      it('should handle unknown query', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'algo aleatorio',
        );

        expect(result.answer).toContain('No entendí');
        expect(result.confidence).toBe(0.6);
      });
    });
  });

  describe('generateRecommendations', () => {
    it('should return default insight when no projects', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await service.generateRecommendations('company-1');

      expect(result.data.insights).toHaveLength(1);
      expect(result.data.insights[0].title).toBe('Todo en orden');
      expect(result.confidence).toBe(0.8);
    });

    it('should generate warning for budget overspend', async () => {
      const overBudgetItem = createMockItem({
        quantity: 100,
        quantity_executed: 80,
        unit_cost: 100,
      });
      const stage = createMockStage({ items: [overBudgetItem] });
      const budget = createMockBudget({ stages: [stage] });
      const project = createMockProject({ budgets: [budget] });

      projectRepo.find.mockResolvedValue([project]);

      const result = await service.generateRecommendations('company-1');

      const warningInsight = result.data.insights.find(
        (i: any) => i.type === 'warning',
      );
      expect(warningInsight).toBeDefined();
      expect(warningInsight.title).toContain('Sobrecoste');
    });

    it('should generate recommendation for advanced project', async () => {
      const completedItem = createMockItem({
        quantity: 100,
        quantity_executed: 100,
        unit_cost: 50,
      });
      const stage = createMockStage({ items: [completedItem] });
      const budget = createMockBudget({
        stages: [stage],
        status: 'editing' as any,
      });
      const project = createMockProject({ budgets: [budget] });

      projectRepo.find.mockResolvedValue([project]);

      const result = await service.generateRecommendations('company-1');

      const recommendationInsight = result.data.insights.find(
        (i: any) => i.type === 'recommendation',
      );
      expect(recommendationInsight).toBeDefined();
    });

    it('should generate opportunity insight when everything is fine', async () => {
      const item = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 50,
        unit_price: 75,
      });
      const stage = createMockStage({ items: [item] });
      const budget = createMockBudget({
        stages: [stage],
        status: BudgetStatus.DRAFT,
      });
      const project = createMockProject({
        budgets: [budget],
        status: ProjectStatus.IN_PROGRESS,
      });

      projectRepo.find.mockResolvedValue([project]);

      const result = await service.generateRecommendations('company-1');

      expect(result.data.insights).toBeDefined();
      expect(result.data.insights.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('predictProjectOutcome', () => {
    it('should return message when no projects', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await service.predictProjectOutcome('company-1');

      expect(result.answer).toBe('No hay proyectos para predecir.');
      expect(result.confidence).toBe(0.9);
    });

    it('should generate predictions for projects', async () => {
      const item = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 50,
        unit_price: 75,
      });
      const stage = createMockStage({ items: [item] });
      const budget = createMockBudget({ stages: [stage] });
      const project = createMockProject({ budgets: [budget] });

      projectRepo.find.mockResolvedValue([project]);

      const result = await service.predictProjectOutcome('company-1');

      expect(result.data.predictions).toHaveLength(1);
      expect(result.data.predictions[0]).toHaveProperty('riskLevel');
    });

    it('should predict high risk for over budget project', async () => {
      const overBudgetItem = createMockItem({
        quantity: 100,
        quantity_executed: 120,
        unit_cost: 100,
        unit_price: 80,
      });
      const stage = createMockStage({ items: [overBudgetItem] });
      const budget = createMockBudget({ stages: [stage] });
      const project = createMockProject({ budgets: [budget] });

      projectRepo.find.mockResolvedValue([project]);

      const result = await service.predictProjectOutcome('company-1');

      expect(result.data.predictions[0].riskLevel).not.toBe('low');
    });
  });

  describe('analyzeBudgetDeviation', () => {
    it('should return null for non-existent budget', async () => {
      budgetRepo.findOne.mockResolvedValue(null);

      const result = await service.analyzeBudgetDeviation('nonexistent');

      expect(result).toBeNull();
    });

    it('should analyze budget deviation correctly', async () => {
      const item = createMockItem({
        quantity: 100,
        quantity_executed: 115,
        unit_cost: 50,
      });
      const stage = createMockStage({ items: [item] });
      const budget = createMockBudget({ stages: [stage] });

      budgetRepo.findOne.mockResolvedValue(budget);

      const result = await service.analyzeBudgetDeviation('budget-1');

      expect(result).toHaveProperty('totalEstimated');
      expect(result).toHaveProperty('totalExecuted');
      expect(result).toHaveProperty('variance');
      expect(result.items).toHaveLength(1);
    });

    it('should handle empty stages', async () => {
      const budget = createMockBudget({ stages: [] });

      budgetRepo.findOne.mockResolvedValue(budget);

      const result = await service.analyzeBudgetDeviation('budget-1');

      expect(result.totalEstimated).toBe(0);
      expect(result.totalExecuted).toBe(0);
    });
  });

  describe('generateProjectReport', () => {
    it('should return null for non-existent project', async () => {
      projectRepo.findOne.mockResolvedValue(null);

      const result = await service.generateProjectReport(
        'nonexistent',
        'executive',
      );

      expect(result).toBeNull();
    });

    it('should generate executive report', async () => {
      const project = createMockProject();

      projectRepo.findOne.mockResolvedValue(project);

      const result = await service.generateProjectReport(
        'project-1',
        'executive',
      );

      expect(result).toHaveProperty('projectName');
      expect(result.type).toBe('executive');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe('Resumen Ejecutivo');
    });

    it('should generate financial report', async () => {
      const project = createMockProject();
      const financialData = { total: 10000, breakdown: [] };

      projectRepo.findOne.mockResolvedValue(project);
      financialService.getProjectSummary.mockResolvedValue(financialData);

      const result = await service.generateProjectReport(
        'project-1',
        'financial',
      );

      expect(result.sections[0].title).toBe('Análisis Financiero');
      expect(financialService.getProjectSummary).toHaveBeenCalledWith(
        'project-1',
      );
    });

    it('should generate technical report', async () => {
      const project = createMockProject({ location: 'Test City' });

      projectRepo.findOne.mockResolvedValue(project);

      const result = await service.generateProjectReport(
        'project-1',
        'technical',
      );

      expect(result.sections[0].title).toBe('Resumen Técnico');
    });
  });

  describe('BIM-related queries', () => {
    beforeEach(() => {
      bimAnalyticsService.getBIMElements = jest.fn().mockResolvedValue([]);
      bimAnalyticsService.generateClashAnalysis = jest.fn().mockResolvedValue({
        totalClashes: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      });
      bimAnalyticsService.generateCostAnalysis = jest.fn().mockResolvedValue([]);
      bimAnalyticsService.getModelStatistics = jest.fn().mockResolvedValue({
        total_elements: 0,
        by_discipline: {},
      });
      bimAnalyticsService.generateQualityMetrics = jest.fn().mockResolvedValue({
        qualityScore: 100,
        elementsWithIssues: 0,
      });
      bimAnalyticsService.generateResourceOptimization = jest.fn().mockResolvedValue({
        laborEfficiency: [],
        materialWaste: [],
      });
    });

    describe('handleBIMElementsQuery', () => {
      it('should handle BIM elements query', async () => {
        const result = await (service as any).handleBIMElementsQuery(
          'company-1',
          'project-1',
          'elementos BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMClashesQuery', () => {
      it('should handle BIM clashes query', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 5,
          bySeverity: { critical: 1, high: 2, medium: 1, low: 1 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMQuantitiesQuery', () => {
      it('should handle BIM quantities query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'cubicaciones BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMStoreysQuery', () => {
      it('should handle BIM storeys query', async () => {
        bimAnalyticsService.getBIMElements.mockResolvedValue([]);

        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'pisos BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMDisciplinesQuery', () => {
      it('should handle BIM disciplines query', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 10,
          bySeverity: { critical: 2, high: 3, medium: 3, low: 2 },
          byDiscipline: { 'structure-MEP': 5, 'architecture-structure': 3 },
        });

        const result = await (service as any).handleBIMDisciplinesQuery(
          'company-1',
          'project-1',
          'disciplinas BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMQualityQuery', () => {
      it('should handle BIM quality query', async () => {
        bimAnalyticsService.generateQualityMetrics.mockResolvedValue({
          qualityScore: 85,
          elementsWithIssues: 5,
        });

        const result = await (service as any).handleBIMQualityQuery(
          'company-1',
          'project-1',
          'calidad BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMMaterialsQuery', () => {
      it('should handle BIM materials query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcWall', totalVolume: 100, totalCost: 50000 },
        ]);

        const result = await (service as any).handleBIMMaterialsQuery(
          'company-1',
          'project-1',
          'materiales BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('handleBIMOptimizationQuery', () => {
      it('should handle BIM optimization query', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          laborEfficiency: [],
          materialWaste: [],
        });

        const result = await (service as any).handleBIMOptimizationQuery(
          'company-1',
          'project-1',
          'optimizacion BIM',
          {},
        );

        expect(result).toHaveProperty('answer');
      });
    });
  });

  describe('extractEntities', () => {
    it('should extract currentPeriod from query', () => {
      const result = (service as any).extractEntities('proyectos de esta semana');
      expect(result).toHaveProperty('currentPeriod');
    });

    it('should return empty object for no matches', () => {
      const result = (service as any).extractEntities('test query');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('handleGeneralQuery', () => {
    it('should handle general query', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await (service as any).handleGeneralQuery('company-1', undefined, 'test query');

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
    });

    it('should include projects in general query', async () => {
      const project = createMockProject();
      projectRepo.find.mockResolvedValue([project]);

      const result = await (service as any).handleGeneralQuery('company-1', undefined, 'test query');

      expect(result.answer).toContain('proyecto');
    });
  });

  describe('handleWorkersQuery', () => {
    it('should handle workers query', async () => {
      const worker = createMockWorker();
      workerRepo.find.mockResolvedValue([worker]);

      const result = await (service as any).handleWorkersQuery('company-1');

      expect(result).toHaveProperty('answer');
      expect(result.data).toHaveProperty('workers');
    });

    it('should return message when no workers', async () => {
      workerRepo.find.mockResolvedValue([]);

      const result = await (service as any).handleWorkersQuery('company-1');

      expect(result.answer).toContain('trabajadores');
    });
  });

  describe('handleScheduleQuery', () => {
    it('should handle schedule query', async () => {
      const project = createMockProject();
      projectRepo.find.mockResolvedValue([project]);

      const result = await (service as any).handleScheduleQuery(
        'company-1',
        undefined,
        {},
      );

      expect(result).toHaveProperty('answer');
    });
  });
});
