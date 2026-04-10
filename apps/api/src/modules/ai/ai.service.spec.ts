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
    getBIMElements: jest.fn().mockResolvedValue([
      {
        id: 'elem-1',
        ifc_guid: 'guid-1',
        ifc_type: 'IfcWall',
        name: 'Wall 01',
        storey_name: 'Ground Floor',
        quantities: { netVolume: 5.0, netArea: 12.5 },
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 5,
          maxY: 2.5,
          maxZ: 3,
        },
        model_id: 'model-1',
        company_id: 'company-1',
      },
    ]),
    getBIMSummaryInsights: jest.fn().mockResolvedValue({
      totalElements: 150,
      totalVolume: 500.0,
      costAnalysis: [
        {
          ifcType: 'IfcWall',
          elementCount: 25,
          totalVolume: 125.0,
          totalCost: 15000,
          averageElementCost: 600,
        },
      ],
      clashAnalysis: {
        totalClashes: 12,
        bySeverity: { critical: 2, high: 4, medium: 4, low: 2 },
        byType: { hard: 8, soft: 3, clearance: 1 },
        totalVolume: 15.5,
      },
      progressAnalysis: {
        totalElements: 150,
        completedElements: 112,
        progressByType: { IfcWall: 0.8, IfcSlab: 0.9 },
        progressByStorey: { 'Ground Floor': 0.75, 'First Floor': 0.65 },
      },
      qualityMetrics: {
        elementsWithIssues: 8,
        qualityScore: 92.5,
        issuesByType: { 'Missing Properties': 3, 'Geometry Issues': 5 },
        recommendations: [
          'Review element properties',
          'Check geometry consistency',
        ],
      },
      resourceOptimization: {
        materialWaste: [{ material: 'Concrete', wastePercentage: 5.2 }],
        laborEfficiency: [{ category: 'Masonry', efficiency: 87.5 }],
        equipmentUtilization: [{ equipment: 'Crane', utilization: 76.3 }],
        totalSavings: 2500.0,
      },
    }),
    generateCostAnalysis: jest.fn().mockResolvedValue([
      {
        ifcType: 'IfcWall',
        elementCount: 25,
        totalVolume: 125.0,
        totalCost: 15000,
        averageElementCost: 600,
      },
    ]),
    generateClashAnalysis: jest.fn().mockResolvedValue({
      totalClashes: 12,
      bySeverity: { critical: 2, high: 4, medium: 4, low: 2 },
      byType: { hard: 8, soft: 3, clearance: 1 },
      totalVolume: 15.5,
    }),
    generateProgressAnalysis: jest.fn().mockResolvedValue({
      totalElements: 150,
      completedElements: 112,
      progressByType: { IfcWall: 0.8, IfcSlab: 0.9 },
      progressByStorey: { 'Ground Floor': 0.75, 'First Floor': 0.65 },
    }),
    generateQualityMetrics: jest.fn().mockResolvedValue({
      elementsWithIssues: 8,
      qualityScore: 92.5,
      issuesByType: { 'Missing Properties': 3, 'Geometry Issues': 5 },
      recommendations: [
        'Review element properties',
        'Check geometry consistency',
      ],
    }),
    generateResourceOptimization: jest.fn().mockResolvedValue({
      materialWaste: [{ material: 'Concrete', wastePercentage: 5.2 }],
      laborEfficiency: [{ category: 'Masonry', efficiency: 87.5 }],
      equipmentUtilization: [{ equipment: 'Crane', utilization: 76.3 }],
      totalSavings: 2500.0,
    }),
    // Legacy methods for backward compatibility
    getModelStatistics: jest.fn().mockResolvedValue({
      total_elements: 150,
      by_discipline: { architecture: 80, structure: 70 },
      by_ifc_type: { IfcWall: 25, IfcSlab: 15, IfcColumn: 30 },
    }),
    generateProgressReport: jest.fn().mockResolvedValue({
      overall_progress: 74.7,
      by_phase: { foundation: 1.0, structure: 0.8, finishing: 0.4 },
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
      bimAnalyticsService.generateCostAnalysis = jest
        .fn()
        .mockResolvedValue([]);
      bimAnalyticsService.getModelStatistics = jest.fn().mockResolvedValue({
        total_elements: 0,
        by_discipline: {},
      });
      bimAnalyticsService.generateQualityMetrics = jest.fn().mockResolvedValue({
        qualityScore: 100,
        elementsWithIssues: 0,
      });
      bimAnalyticsService.generateResourceOptimization = jest
        .fn()
        .mockResolvedValue({
          laborEfficiency: [],
          materialWaste: [],
        });

      // Add missing BIM analytics methods for coverage
      bimAnalyticsService.getBIMQuantities = jest.fn().mockResolvedValue({
        totalVolume: 1000,
        totalArea: 500,
        materials: [],
      });

      bimAnalyticsService.getStoreyBreakdown = jest
        .fn()
        .mockResolvedValue([{ name: 'Ground Floor', area: 200, elements: 50 }]);

      bimAnalyticsService.getDisciplineBreakdown = jest.fn().mockResolvedValue({
        architecture: { elements: 100, completeness: 95 },
        structure: { elements: 50, completeness: 85 },
      });

      bimAnalyticsService.getModelQualityReport = jest.fn().mockResolvedValue({
        overall_score: 85,
        issues: [],
        completeness: 90,
      });

      bimAnalyticsService.getMaterialBreakdown = jest
        .fn()
        .mockResolvedValue([{ material: 'Concrete', volume: 100, cost: 5000 }]);

      bimAnalyticsService.generateProgressAnalysis = jest
        .fn()
        .mockResolvedValue({
          overall: {
            percentage: 75,
            elementsCompleted: 300,
            elementsTotal: 400,
          },
          byStorey: {
            'Piso 1': { total: 100, percentage: 85.0, volume: 50.5 },
            'Piso 2': { total: 80, percentage: 60.0, volume: 40.2 },
            Basement: { total: 50, percentage: 45.0, volume: 30.0 },
          },
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

      it('should handle specific IFC type query with type mapping', async () => {
        // Test that covers lines 1115-1116 (typeMapping)
        bimAnalyticsService.getBIMSummaryInsights.mockResolvedValue({
          totalElements: 150,
          byCategory: {},
        });

        bimAnalyticsService.getBIMElements.mockResolvedValueOnce([
          {
            id: '1',
            ifcType: 'IfcWall',
            quantities: { netVolume: 10.5, netArea: 25.3 },
          },
          {
            id: '2',
            ifcType: 'IfcWall',
            quantities: { netVolume: 8.2, netArea: 20.1 },
          },
        ]);

        const result = await (service as any).handleBIMElementsQuery(
          'company-1',
          'project-1',
          'ifcwall del proyecto',
          {},
        );

        // Covers lines 1121-1144
        expect(result.answer).toContain('elementos');
        expect(result.confidence).toBeGreaterThan(0.8);
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

      it('should handle clashes with critical unresolved', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 20,
          criticalUnresolved: 5,
          resolvedPercentage: 65.0,
          avgResolutionTime: 3.5,
          bySeverity: { critical: 8, high: 6, medium: 4, low: 2 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones del proyecto',
          {},
        );

        expect(result.answer).toContain('20 colisiones detectadas');
        expect(result.answer).toContain('🚨 5 CRÍTICAS sin resolver');
        expect(result.answer).toContain('Resueltas: 65.0%');
        expect(result.answer).toContain(
          'Tiempo promedio de resolución: 3.5 días',
        );
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Resolver colisiones críticas inmediatamente',
        );
      });

      it('should handle query for critical severity clashes', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 15,
          criticalUnresolved: 0,
          resolvedPercentage: 90.0,
          avgResolutionTime: 2.0,
          bySeverity: { critical: 3, high: 5, medium: 4, low: 3 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones critical',
          {},
        );

        // Covers lines 1221-1246
        expect(result.answer).toContain('critical: 3');
      });

      it('should handle query for high severity clashes', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 15,
          criticalUnresolved: 0,
          resolvedPercentage: 90.0,
          avgResolutionTime: 2.0,
          bySeverity: { critical: 3, high: 7, medium: 4, low: 1 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones alto nivel',
          {},
        );

        expect(result.answer).toBe('Colisiones alto: 7.');
      });

      it('should handle low resolved percentage with actionable suggestions', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 30,
          criticalUnresolved: 0,
          resolvedPercentage: 45.0,
          avgResolutionTime: 2.0,
          bySeverity: { critical: 0, high: 10, medium: 15, low: 5 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones',
          {},
        );

        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Asignar recursos para resolución de colisiones',
        );
      });

      it('should handle high avg resolution time with optimization suggestion', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 10,
          criticalUnresolved: 0,
          resolvedPercentage: 85.0,
          avgResolutionTime: 10.5,
          bySeverity: { critical: 0, high: 2, medium: 5, low: 3 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones',
          {},
        );

        expect(result.suggestedActions).toContain(
          'Optimizar proceso de resolución de colisiones',
        );
      });

      it('should handle medium severity query in Spanish', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 12,
          criticalUnresolved: 0,
          resolvedPercentage: 88.0,
          avgResolutionTime: 3.0,
          bySeverity: { critical: 1, high: 3, medium: 6, low: 2 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones medio',
          {},
        );

        expect(result.answer).toBe('Colisiones medio: 6.');
      });

      it('should handle low severity query', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 8,
          criticalUnresolved: 0,
          resolvedPercentage: 95.0,
          avgResolutionTime: 1.5,
          bySeverity: { critical: 0, high: 1, medium: 2, low: 5 },
        });

        const result = await (service as any).handleBIMClashesQuery(
          'company-1',
          'project-1',
          'colisiones bajo',
          {},
        );

        expect(result.answer).toBe('Colisiones bajo: 5.');
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

      it('should handle concrete material specific query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcSlab', totalVolume: 150.5, totalCost: 45000 },
          { ifcType: 'IfcWall', totalVolume: 200.3, totalCost: 60000 },
          { ifcType: 'IfcColumn', totalVolume: 50.2, totalCost: 15000 },
          { ifcType: 'IfcBeam', totalVolume: 75.0, totalCost: 22500 },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'concreto del proyecto',
          {},
        );

        expect(result.answer).toContain('CONCRETO: 476.00 m³ planificados');
        expect(result.answer).toContain('Costo total:');
      });

      it('should handle hormigón (Spanish concrete) query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcSlab', totalVolume: 100.0, totalCost: 30000 },
          { ifcType: 'IfcFooting', totalVolume: 25.0, totalCost: 7500 },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'hormigón necesario',
          {},
        );

        expect(result.answer).toContain('HORMIGÓN: 125.00 m³ planificados');
        expect(result.answer).toContain('Costo total:');
      });

      it('should handle steel material query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcBeam', totalVolume: 30.5, totalCost: 45000 },
          { ifcType: 'IfcColumn', totalVolume: 20.3, totalCost: 30000 },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'acero estructural',
          {},
        );

        expect(result.answer).toContain('ACERO: 50.80 m³ planificados');
        expect(result.answer).toContain('Costo total:');
      });

      it('should handle wood material query', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcBeam', totalVolume: 15.0, totalCost: 8000 },
          { ifcType: 'IfcColumn', totalVolume: 10.0, totalCost: 5000 },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'madera del proyecto',
          {},
        );

        expect(result.answer).toContain('MADERA: 25.00 m³ planificados');
        expect(result.answer).toContain('Costo total:');
      });

      it('should handle material query with zero cost', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          { ifcType: 'IfcBeam', totalVolume: 20.0, totalCost: 0 },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'acero',
          {},
        );

        expect(result.answer).toContain('ACERO: 20.00 m³ planificados');
        expect(result.answer).not.toContain('Costo total');
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

      it('should handle specific storey query - Piso 1', async () => {
        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'progreso del piso 1',
          {},
        );

        expect(result.answer).toContain(
          'Piso 1: 100 elementos, 85.0% completado',
        );
        expect(result.answer).toContain('Volumen: 50.50 m³');
        expect(result.confidence).toBe(0.95);
        expect(result.actionable).toBe(false); // >80% no es actionable
      });

      it('should handle specific storey query - Piso 2 with low progress', async () => {
        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'estado piso 2',
          {},
        );

        // Covers lines 1427-1447
        expect(result.answer).toContain(
          'Piso 2: 80 elementos, 60.0% completado',
        );
        expect(result.answer).toContain('Volumen: 40.20 m³');
        expect(result.actionable).toBe(true); // <80% es actionable
        expect(result.suggestedActions).toEqual([]); // >50% no sugiere aceleración
      });

      it('should handle basement query with very low progress', async () => {
        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'progreso basement',
          {},
        );

        expect(result.answer).toContain(
          'Basement: 50 elementos, 45.0% completado',
        );
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Acelerar trabajo en este piso',
        );
      });

      it('should handle general storeys summary with slow storeys', async () => {
        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'resumen de pisos',
          {},
        );

        // Covers lines 1452-1469
        expect(result.answer).toContain('3 pisos/niveles en el proyecto');
        expect(result.answer).toContain('Progreso promedio: 63.3%');
        expect(result.answer).toContain('⚠️ Pisos con retraso:');
        expect(result.answer).toContain('Basement');
      });

      it('should handle storeys with all good progress', async () => {
        bimAnalyticsService.generateProgressAnalysis.mockResolvedValue({
          overall: {
            percentage: 90,
            elementsCompleted: 360,
            elementsTotal: 400,
          },
          byStorey: {
            'Piso 1': { total: 100, percentage: 95.0, volume: 50.5 },
            'Piso 2': { total: 80, percentage: 88.0, volume: 40.2 },
            'Piso 3': { total: 50, percentage: 85.0, volume: 30.0 },
          },
        });

        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'todos los pisos',
          {},
        );

        expect(result.answer).toContain('3 pisos/niveles en el proyecto');
        expect(result.answer).toContain(
          '✅ Todos los pisos van según cronograma',
        );
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
      const result = (service as any).extractEntities(
        'proyectos de esta semana',
      );
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

      const result = await (service as any).handleGeneralQuery(
        'company-1',
        undefined,
        'test query',
      );

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
    });

    it('should include projects in general query', async () => {
      const project = createMockProject();
      projectRepo.find.mockResolvedValue([project]);

      const result = await (service as any).handleGeneralQuery(
        'company-1',
        undefined,
        'test query',
      );

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

  describe('Edge cases and error handling', () => {
    describe('Intent detection edge cases', () => {
      it('should handle queries with multiple intents', async () => {
        projectRepo.find.mockResolvedValue([createMockProject()]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto y presupuesto y trabajadores',
        );

        expect(result).toHaveProperty('answer');
        expect(result.confidence).toBeGreaterThan(0);
      });

      it('should handle very short queries', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'ok',
        );

        expect(result).toHaveProperty('answer');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      });

      it('should handle very long queries', async () => {
        const longQuery =
          'cual es el estado muy detallado y completo del proyecto incluyendo todos los aspectos financieros presupuestarios de costos y gastos y tambien el estado de los trabajadores y su rendimiento y eficiencia en las tareas asignadas durante este periodo de tiempo';

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          longQuery,
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle queries with special characters', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          '¿Cómo está el proyecto? ¡Necesito información!',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle empty intent detection', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'xyz abc random text',
        );

        expect(result.answer).toContain('No entendí');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      });
    });

    describe('Data edge cases', () => {
      it('should handle projects with null dates', async () => {
        const projectWithNullDates = createMockProject({
          start_date: null,
          end_date: null,
        });
        projectRepo.find.mockResolvedValue([projectWithNullDates]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle projects with zero budget', async () => {
        const projectWithZeroBudget = createMockProject({
          estimated_budget: 0,
          actual_cost: 0,
        });
        projectRepo.find.mockResolvedValue([projectWithZeroBudget]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle budgets with zero totals', async () => {
        const budgetWithZeroTotals = createMockBudget({
          total_estimated_cost: 0,
          total_estimated_price: 0,
        });
        budgetRepo.find.mockResolvedValue([budgetWithZeroTotals]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'presupuesto',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle workers with null ratings', async () => {
        const workerWithNullRating = createMockWorker({ rating: null });
        workerRepo.find.mockResolvedValue([workerWithNullRating]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'trabajadores',
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('Repository error handling', () => {
      it('should handle project repository errors gracefully', async () => {
        projectRepo.find.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result.answer).toContain('problemas');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle budget repository errors gracefully', async () => {
        budgetRepo.find.mockRejectedValue(new Error('Database timeout'));

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'presupuesto',
        );

        expect(result.answer).toContain('Error');
      });

      it('should handle worker repository errors gracefully', async () => {
        workerRepo.find.mockRejectedValue(new Error('Connection lost'));

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'trabajadores',
        );

        expect(result.answer).toContain('Error');
      });
    });

    describe('Missing BIM intent handlers for coverage', () => {
      it('should handle BIM quantities intent', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'cantidades BIM del proyecto',
        );

        // The handler works correctly and returns quantities
        expect(result.answer).toContain('Cantidades totales');
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should handle BIM storeys intent', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'plantas del edificio',
          {},
        );

        // This works now with the proper mock
        expect(result.answer).toContain('pisos/niveles');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should handle BIM disciplines intent', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'disciplinas del modelo',
        );

        expect(result.answer).toContain('disciplinas');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle BIM quality intent', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'calidad BIM del proyecto',
        );

        expect(result.answer).toContain('calidad');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle BIM materials intent', async () => {
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'materiales del proyecto',
        );

        expect(result.answer).toContain('materiales');
        expect(result.confidence).toBeGreaterThan(0.7);
      });
    });

    describe('BIM Analytics service integration', () => {
      it('should handle BIM analytics service errors in elements query', async () => {
        bimAnalyticsService.getBIMSummaryInsights.mockRejectedValue(
          new Error('BIM service unavailable'),
        );

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'elementos BIM',
        );

        expect(result.answer).toContain('analizar los elementos BIM');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle BIM clash analysis errors', async () => {
        bimAnalyticsService.generateClashAnalysis.mockRejectedValue(
          new Error('Clash detection failed'),
        );

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'colisiones BIM',
        );

        expect(result.answer).toContain('analizar las colisiones BIM');
      });

      it('should handle undefined clash analysis data', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 5,
          bySeverity: { critical: 1, high: 2, medium: 1, low: 1 },
          // Missing totalVolume to trigger undefined.toFixed() error
        });

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'colisiones BIM',
        );

        expect(result.answer).toContain('analizar las colisiones BIM');
      });

      it('should handle quality metrics errors', async () => {
        bimAnalyticsService.generateQualityMetrics.mockRejectedValue(
          new Error('Quality analysis failed'),
        );

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'calidad BIM',
        );

        expect(result.answer).toContain('analizar la calidad del modelo BIM');
      });

      it('should handle undefined quality score', async () => {
        bimAnalyticsService.generateQualityMetrics.mockResolvedValue({
          elementsWithIssues: 5,
          issuesByType: { 'Missing Properties': 3 },
          // Missing qualityScore to trigger undefined.toFixed() error
        });

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'calidad BIM',
        );

        expect(result.answer).toContain('analizar la calidad del modelo BIM');
      });

      it('should handle resource optimization errors', async () => {
        bimAnalyticsService.generateResourceOptimization.mockRejectedValue(
          new Error('Optimization failed'),
        );

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'optimizacion recursos BIM',
        );

        expect(result.answer).toContain(
          'No pude generar análisis de optimización',
        );
        expect(result.confidence).toBe(0.5);
      });

      it('should handle undefined optimization data', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          totalSavings: 1500,
          materialWaste: undefined, // Missing arrays to trigger undefined.length error
          laborEfficiency: undefined,
          equipmentUtilization: undefined,
          optimizationRecommendations: [],
        });

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'optimizacion recursos BIM',
        );

        expect(result.answer).toContain(
          'No pude generar análisis de optimización',
        );
      });
    });

    describe('Complex calculations and edge cases', () => {
      it('should handle projects with negative costs', async () => {
        const projectWithNegativeCost = createMockProject({
          actual_cost: -5000,
        });
        projectRepo.find.mockResolvedValue([projectWithNegativeCost]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle division by zero in percentage calculations', async () => {
        const projectWithZeroBudget = createMockProject({
          estimated_budget: 0,
          actual_cost: 1000,
        });
        projectRepo.find.mockResolvedValue([projectWithZeroBudget]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });

      it('should handle very large numbers', async () => {
        const projectWithLargeNumbers = createMockProject({
          estimated_budget: Number.MAX_SAFE_INTEGER,
          actual_cost: Number.MAX_SAFE_INTEGER - 1000000,
        });
        projectRepo.find.mockResolvedValue([projectWithLargeNumbers]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('Intent classification comprehensive tests', () => {
      it('should classify project-related synonyms', async () => {
        projectRepo.find.mockResolvedValue([createMockProject()]);

        const queries = [
          'obra actual',
          'construccion estado',
          'avance trabajo',
          'situacion proyecto',
        ];

        for (const query of queries) {
          const result = await service.processNaturalLanguageQuery(
            'user-1',
            'company-1',
            query,
          );
          expect(result.confidence).toBeGreaterThan(0.5);
        }
      });

      it('should classify budget-related synonyms', async () => {
        budgetRepo.find.mockResolvedValue([createMockBudget()]);

        const queries = [
          'costos actuales',
          'gastos proyecto',
          'precio estimado',
          'financiamiento',
        ];

        for (const query of queries) {
          const result = await service.processNaturalLanguageQuery(
            'user-1',
            'company-1',
            query,
          );
          expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        }
      });

      it('should classify worker-related synonyms', async () => {
        workerRepo.find.mockResolvedValue([createMockWorker()]);

        const queries = [
          'personal obra',
          'empleados construccion',
          'equipo trabajo',
          'mano de obra',
        ];

        for (const query of queries) {
          const result = await service.processNaturalLanguageQuery(
            'user-1',
            'company-1',
            query,
          );
          expect(result.confidence).toBeGreaterThan(0.5);
        }
      });
    });

    describe('Response formatting edge cases', () => {
      it('should handle extremely long project names', async () => {
        const projectWithLongName = createMockProject({
          name: 'A'.repeat(1000),
        });
        projectRepo.find.mockResolvedValue([projectWithLongName]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result.answer.length).toBeLessThan(5000); // Should be reasonable
      });

      it('should handle special characters in project names', async () => {
        const projectWithSpecialChars = createMockProject({
          name: 'Proyecto #1 - Construcción & Desarrollo (2024)',
        });
        projectRepo.find.mockResolvedValue([projectWithSpecialChars]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
        expect(result.answer).toContain('proyecto');
      });

      it('should handle null or undefined project names', async () => {
        const projectWithNullName = createMockProject({
          name: null,
        });
        projectRepo.find.mockResolvedValue([projectWithNullName]);

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'estado del proyecto',
        );

        expect(result).toHaveProperty('answer');
      });
    });

    describe('Error handling tests for coverage', () => {
      it('should handle recommendation intent', async () => {
        projectRepo.find.mockResolvedValue([createMockProject()]);
        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'recomiendame algo para el proyecto',
        );

        expect(result.answer).toContain('Todo en orden');
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should handle schedule query errors', async () => {
        projectRepo.find.mockRejectedValue(new Error('Database error'));

        const result = await service.processNaturalLanguageQuery(
          'user-1',
          'company-1',
          'cronograma del proyecto',
        );

        expect(result.answer).toContain('Error al analizar cronograma');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle generateRecommendations errors', async () => {
        projectRepo.find.mockRejectedValue(new Error('Database error'));

        const result = await (service as any).generateRecommendations(
          'company-1',
          'project-1',
        );

        expect(result.answer).toContain('Error al generar recomendaciones');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle predictProjectOutcome errors', async () => {
        projectRepo.find.mockRejectedValue(new Error('Database error'));

        const result = await (service as any).predictProjectOutcome(
          'company-1',
          'project-1',
        );

        expect(result.answer).toContain('Error al predecir resultados');
        expect(result.confidence).toBe(0.5);
      });

      it('should handle budget query with specific budget ID', async () => {
        const budget = createMockBudget({ id: 'budget-specific' });
        budgetRepo.findOne.mockResolvedValue(budget);

        const result = await (service as any).handleBudgetQuery(
          'company-1',
          null,
          'budget-specific',
          {},
        );

        expect(result.answer).toContain('Presupuesto total');
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should handle budget query with project ID but no active budget', async () => {
        budgetRepo.findOne.mockResolvedValue(null);
        projectRepo.find.mockResolvedValue([]);
        budgetRepo.find.mockResolvedValue([]);

        const result = await (service as any).handleBudgetQuery(
          'company-1',
          'project-1',
          null,
          {},
        );

        expect(result.answer).toContain('No encontré presupuestos');
        expect(result.confidence).toBe(0.9);
      });

      it('should handle budget with zero variance (within expected)', async () => {
        const budget = createMockBudget({
          total_estimated_price: 50000,
          total_executed_cost: 50000, // Exact match
        });
        budgetRepo.find.mockResolvedValue([budget]);
        projectRepo.find.mockResolvedValue([createMockProject()]);

        const result = await (service as any).handleBudgetQuery(
          'company-1',
          null,
          null,
          {},
        );

        expect(result.answer).toContain('dentro de lo previsto');
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });

    describe('Additional coverage for uncovered lines', () => {
      // Lines 865, 906-907: Prediction with high risk and low execution
      it('should handle predictions with high risk projects', async () => {
        // Create high-risk scenario: High cost variance + schedule issues
        const mockStages = [
          {
            items: [
              {
                id: 'item-1',
                quantity_estimated: 100,
                quantity_executed: 80, // 80% executed
                unit_cost: 100,
              },
              {
                id: 'item-2',
                quantity_estimated: 50,
                quantity_executed: 10, // Only 20% executed
                unit_cost: 200,
              },
            ],
          },
        ];

        // Create budget with high execution cost relative to progress
        const budget1 = createMockBudget({
          id: 'budget-1',
          project_id: 'project-1',
          stages: mockStages,
        });

        const budget2 = createMockBudget({
          id: 'budget-2',
          project_id: 'project-2',
          stages: mockStages,
        });

        const project1 = createMockProject({
          id: 'project-1',
          name: 'Proyecto Alto Riesgo',
          progress: 25, // Low progress
          budgets: [budget1],
        });

        const project2 = createMockProject({
          id: 'project-2',
          name: 'Proyecto Crítico',
          progress: 30, // Low progress
          budgets: [budget2],
        });

        projectRepo.find.mockResolvedValue([project1, project2]);
        budgetRepo.findOne.mockImplementation(({ where }) => {
          if (where.project_id === 'project-1') return Promise.resolve(budget1);
          if (where.project_id === 'project-2') return Promise.resolve(budget2);
          return Promise.resolve(null);
        });

        const result = await (service as any).predictProjectOutcome(
          'company-1',
          null,
        );

        // Should mention high risk projects (lines 906-907)
        expect(result.answer).toContain('con riesgo alto');
        expect(result.answer).toContain('días de retraso');
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Revisar proyectos de riesgo',
        );
      });

      // Line 1015: analyzeBudgetDeviation error handler
      it('should return null when analyzeBudgetDeviation fails', async () => {
        budgetRepo.find.mockRejectedValue(new Error('Database error'));

        const result = await (service as any).analyzeBudgetDeviation(
          'company-1',
          'project-1',
        );

        expect(result).toBeNull();
      });

      // Line 1071: generateProjectReport error handler
      it('should return null when generateProjectReport fails', async () => {
        projectRepo.findOne.mockRejectedValue(new Error('Database error'));

        const result = await service.generateProjectReport(
          'project-1',
          'executive',
        );

        expect(result).toBeNull();
      });

      // Line 1116: BIM Elements with typeMapping - direct IFC type
      it('should handle BIM elements query with direct IFC type', async () => {
        bimAnalyticsService.getBIMSummaryInsights.mockResolvedValue({
          totalElements: 150,
          byCategory: {},
        });

        bimAnalyticsService.getBIMElements.mockResolvedValueOnce([
          {
            id: '1',
            ifcType: 'IfcStair',
            quantities: { netVolume: 5.5, netArea: 15.0 },
          },
          {
            id: '2',
            ifcType: 'IfcStair',
            quantities: { netVolume: 4.2, netArea: 12.3 },
          },
        ]);

        const result = await (service as any).handleBIMElementsQuery(
          'company-1',
          'project-1',
          'ifcstair del modelo', // Direct IFC type to test line 1116 assignment
          {},
        );

        expect(result.answer).toContain('2 elementos ifcstair');
        expect(result.answer).toContain('Volumen total:');
      });

      // Lines 1165-1168: BIM Elements with critical issues
      it('should handle BIM elements summary with critical issues', async () => {
        bimAnalyticsService.getBIMSummaryInsights.mockResolvedValue({
          totalElements: 250,
          byCategory: { walls: 100, slabs: 50, beams: 30, columns: 70 },
          totalVolume: 850.5,
          progressPercentage: 72,
          qualityScore: 68,
          criticalIssues: [
            'Geometría inválida en 15 elementos',
            'Propiedades faltantes',
          ],
          keyRecommendations: [
            'Revisar elementos con errores',
            'Completar información',
          ],
        });

        const result = await (service as any).handleBIMElementsQuery(
          'company-1',
          'project-1',
          'resumen de elementos BIM',
          {},
        );

        expect(result.answer).toContain(
          '⚠️ Problemas: Geometría inválida en 15 elementos',
        );
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toEqual([
          'Revisar elementos con errores',
          'Completar información',
        ]);
      });

      // Lines 1368, 1376, 1379-1381: BIM Quantities general summary with cost
      it('should handle BIM quantities general summary with costs', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          {
            ifcType: 'IfcSlab',
            totalVolume: 200.5,
            totalArea: 500.2,
            totalCost: 60000,
          },
          {
            ifcType: 'IfcWall',
            totalVolume: 300.8,
            totalArea: 800.5,
            totalCost: 90000,
          },
          {
            ifcType: 'IfcColumn',
            totalVolume: 80.3,
            totalArea: 150.0,
            totalCost: 24000,
          },
          {
            ifcType: 'IfcBeam',
            totalVolume: 120.0,
            totalArea: 280.0,
            totalCost: 36000,
          },
        ]);

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'cantidades totales del proyecto',
          {},
        );

        expect(result.answer).toContain('Cantidades totales:');
        expect(result.answer).toContain('m³');
        expect(result.answer).toContain('m²');
        expect(result.answer).toContain('Costo estimado:');
        expect(result.answer).toContain('Principales:');
        expect(result.actionable).toBe(true);
      });

      // Line 1399: BIM Quantities error handler
      it('should handle BIM quantities query errors gracefully', async () => {
        bimAnalyticsService.generateCostAnalysis.mockRejectedValue(
          new Error('Analysis error'),
        );

        const result = await (service as any).handleBIMQuantitiesQuery(
          'company-1',
          'project-1',
          'cubicaciones',
          {},
        );

        expect(result.answer).toContain('No pude analizar las cantidades BIM');
        expect(result.confidence).toBe(0.5);
      });

      // Line 1489: BIM Storeys error handler
      it('should handle BIM storeys query errors gracefully', async () => {
        bimAnalyticsService.generateProgressAnalysis.mockRejectedValue(
          new Error('Progress error'),
        );

        const result = await (service as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'pisos del proyecto',
          {},
        );

        expect(result.answer).toContain(
          'No pude analizar el progreso por pisos',
        );
        expect(result.confidence).toBe(0.5);
      });

      // Lines 1517-1537: BIM Disciplines with specific discipline
      it('should handle specific discipline query - arquitectura', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 25,
          bySeverity: { critical: 3, high: 8, medium: 10, low: 4 },
          byDiscipline: {
            'architecture-structure': 8,
            'architecture-mep': 5,
            'structure-mep': 12,
          },
        });

        const result = await (service as any).handleBIMDisciplinesQuery(
          'company-1',
          'project-1',
          'colisiones en arquitectura',
          {},
        );

        expect(result.answer).toContain('Disciplina arquitectura');
        expect(result.answer).toContain('colisiones detectadas');
        expect(result.data.discipline).toBe('architecture');
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions[0]).toContain(
          'Revisar colisiones en arquitectura',
        );
      });

      it('should handle specific discipline query - structure', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 20,
          bySeverity: { critical: 2, high: 6, medium: 8, low: 4 },
          byDiscipline: {
            'architecture-structure': 7,
            'structure-mep': 10,
            'mep-mep': 3,
          },
        });

        const result = await (service as any).handleBIMDisciplinesQuery(
          'company-1',
          'project-1',
          'problemas en estructura',
          {},
        );

        expect(result.answer).toContain('Disciplina estructura');
        expect(result.data.discipline).toBe('structure');
      });

      // Line 1563: BIM Disciplines with no clashes
      it('should handle BIM disciplines query with no clashes', async () => {
        bimAnalyticsService.generateClashAnalysis.mockResolvedValue({
          totalClashes: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byDiscipline: {},
        });

        const result = await (service as any).handleBIMDisciplinesQuery(
          'company-1',
          'project-1',
          'disciplinas del modelo',
          {},
        );

        expect(result.answer).toContain(
          'No hay colisiones interdisciplinarias detectadas',
        );
        expect(result.actionable).toBe(false);
        expect(result.suggestedActions).toEqual([]);
      });

      // Lines 1603-1631: BIM Quality with low scores
      it('should handle BIM quality with low quality score', async () => {
        bimAnalyticsService.generateQualityMetrics.mockResolvedValue({
          qualityScore: 65,
          modelCompleteness: 75,
          dataConsistency: 72,
          elementsWithIssues: 45,
          commonIssues: [
            { issue: 'Propiedades faltantes', count: 20, impact: 'high' },
            { issue: 'Geometría duplicada', count: 15, impact: 'critical' },
            {
              issue: 'Nomenclatura inconsistente',
              count: 10,
              impact: 'medium',
            },
          ],
        });

        const result = await (service as any).handleBIMQualityQuery(
          'company-1',
          'project-1',
          'calidad del modelo',
          {},
        );

        expect(result.answer).toContain('Calidad del modelo BIM: 65');
        expect(result.answer).toContain('⚠️ 45 elementos con problemas');
        expect(result.answer).toContain('Problemas principales:');
        expect(result.answer).toContain('Propiedades faltantes');
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Mejorar calidad de datos del modelo',
        );
        expect(result.suggestedActions).toContain(
          'Completar información faltante',
        );
        expect(result.suggestedActions).toContain(
          'Estandarizar nomenclatura de elementos',
        );
      });

      it('should handle BIM quality with low completeness only', async () => {
        bimAnalyticsService.generateQualityMetrics.mockResolvedValue({
          qualityScore: 82,
          modelCompleteness: 75,
          dataConsistency: 88,
          elementsWithIssues: 10,
          commonIssues: [],
        });

        const result = await (service as any).handleBIMQualityQuery(
          'company-1',
          'project-1',
          'completitud del modelo',
          {},
        );

        expect(result.suggestedActions).toContain(
          'Completar información faltante',
        );
        expect(result.actionable).toBe(false); // Score >= 80
      });

      it('should handle BIM quality with low consistency only', async () => {
        bimAnalyticsService.generateQualityMetrics.mockResolvedValue({
          qualityScore: 85,
          modelCompleteness: 92,
          dataConsistency: 75,
          elementsWithIssues: 5,
          commonIssues: [],
        });

        const result = await (service as any).handleBIMQualityQuery(
          'company-1',
          'project-1',
          'consistencia de datos',
          {},
        );

        expect(result.suggestedActions).toContain(
          'Estandarizar nomenclatura de elementos',
        );
        expect(result.actionable).toBe(false);
      });

      // Lines 1716, 1748, 1773-1797: BIM Materials
      it('should handle BIM materials with both volume and area', async () => {
        bimAnalyticsService.generateCostAnalysis.mockResolvedValue([
          {
            ifcType: 'IfcSlab',
            totalVolume: 150.5,
            totalArea: 400.2,
            totalCost: 45000,
          },
          { ifcType: 'IfcWall', totalVolume: 0, totalArea: 0, totalCost: 0 },
        ]);

        // Mock material breakdown to return materials with area
        const materialAnalysis = [
          { material: 'Concrete', volume: 150.5, area: 400.2, cost: 45000 },
        ];

        const result = await (service as any).handleBIMMaterialsQuery(
          'company-1',
          'project-1',
          'materiales del proyecto',
          {},
        );

        expect(result.answer).toContain('m³');
        expect(result.answer).toContain('m²'); // Line 1716
      });

      it('should handle BIM materials error', async () => {
        bimAnalyticsService.generateCostAnalysis.mockRejectedValue(
          new Error('Materials error'),
        );

        const result = await (service as any).handleBIMMaterialsQuery(
          'company-1',
          'project-1',
          'materiales',
          {},
        );

        expect(result.answer).toContain(
          'No pude analizar los materiales del modelo BIM',
        ); // Line 1748
        expect(result.confidence).toBe(0.5);
      });

      // Lines 1803-1831: BIM Optimization
      it('should handle BIM optimization with material waste', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          materialWaste: [
            { type: 'Concrete', wastePercentage: 12.5, costImpact: 15000 },
            { type: 'Steel', wastePercentage: 8.2, costImpact: 8000 },
          ],
          laborEfficiency: [],
          equipmentUtilization: [],
          optimizationRecommendations: [
            'Optimizar cortes de material',
            'Mejorar almacenamiento',
          ],
        });

        const result = await (service as any).handleBIMOptimizationQuery(
          'company-1',
          'project-1',
          'optimización del proyecto',
          {},
        );

        expect(result.answer).toContain('Desperdicio detectado');
        expect(result.answer).toContain('Mayor problema: Concrete');
        expect(result.answer).toContain('12.5% desperdicio');
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions).toContain(
          'Optimizar cortes de material',
        );
      });

      it('should handle BIM optimization with labor efficiency issues', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          materialWaste: [],
          laborEfficiency: [
            { zone: 'Zona A', efficiency: 65 },
            { zone: 'Zona B', efficiency: 78 },
            { zone: 'Zona C', efficiency: 92 },
          ],
          equipmentUtilization: [],
          optimizationRecommendations: [
            'Redistribuir personal en zonas de baja eficiencia',
          ],
        });

        const result = await (service as any).handleBIMOptimizationQuery(
          'company-1',
          'project-1',
          'eficiencia laboral',
          {},
        );

        expect(result.answer).toContain('Eficiencia laboral promedio');
        expect(result.answer).toContain(
          'Zonas con baja eficiencia: Zona A, Zona B',
        );
        expect(result.actionable).toBe(true);
      });

      it('should handle BIM optimization with equipment utilization', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          materialWaste: [],
          laborEfficiency: [{ zone: 'Zona A', efficiency: 90 }],
          equipmentUtilization: [
            { equipment: 'Grúa 1', utilization: 120 },
            { equipment: 'Excavadora', utilization: 55 },
            { equipment: 'Mixer', utilization: 85 },
          ],
          optimizationRecommendations: [
            'Agregar grúa adicional',
            'Reasignar excavadora',
          ],
        });

        const result = await (service as any).handleBIMOptimizationQuery(
          'company-1',
          'project-1',
          'uso de equipos',
          {},
        );

        expect(result.answer).toContain('Equipos sobrecargados: Grúa 1');
        expect(result.answer).toContain('Equipos subutilizados: Excavadora');
        expect(result.answer).toContain('💡 Recomendaciones principales:');
        expect(result.actionable).toBe(true);
      });

      it('should handle BIM optimization with all metrics', async () => {
        bimAnalyticsService.generateResourceOptimization.mockResolvedValue({
          materialWaste: [
            { type: 'Wood', wastePercentage: 15, costImpact: 5000 },
          ],
          laborEfficiency: [{ zone: 'Zona X', efficiency: 70 }],
          equipmentUtilization: [{ equipment: 'Bomba', utilization: 115 }],
          optimizationRecommendations: [
            'Optimizar uso de madera',
            'Mejorar eficiencia en Zona X',
            'Revisar programación de bomba',
          ],
        });

        const result = await (service as any).handleBIMOptimizationQuery(
          'company-1',
          'project-1',
          'análisis completo de optimización',
          {},
        );

        expect(result.answer).toContain('Desperdicio detectado');
        expect(result.answer).toContain('Eficiencia laboral promedio');
        expect(result.answer).toContain('Equipos sobrecargados');
        expect(result.answer).toContain('💡 Recomendaciones principales:');
        expect(result.actionable).toBe(true);
        expect(result.suggestedActions.length).toBeGreaterThan(0);
      });
    });
  });
});
