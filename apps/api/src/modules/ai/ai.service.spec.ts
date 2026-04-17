import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { AIService } from './ai.service';
import { Project, ProjectStatus } from '../projects/project.entity';
import { Budget, BudgetStatus } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Worker } from '../workers/worker.entity';
import { Company } from '../companies/company.entity';
import { Client } from '../clients/client.entity';
import { FinancialService } from '../budgets/financial.service';
import { BIMAnalyticsService } from './bim-analytics.service';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

const createMockProject = (overrides?: Partial<Project>): Project => {
  const project = {
    id: 'project-1',
    company_id: 'company-1',
    company: null as unknown as Company,
    name: 'Test Project',
    description: 'Test description',
    status: ProjectStatus.IN_PROGRESS,
    client_id: null,
    client: null as unknown as Client,
    address: 'Test address',
    region: 'Test region',
    commune: 'Test commune',
    type: ['construction'],
    folder: null,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    estimated_budget: 100000,
    estimated_price: 120000,
    estimated_area: 500,
    budgets: [],
    expenses: [],
    documents: [],
    stages: [],
    items: [],
    worker_assignments: [],
    worker_payments: [],
    project_payments: [],
    created_at: new Date(),
    updated_at: new Date(),
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

// ─────────────────────────────────────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────────────────────────────────────

const createProjectRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const createBudgetRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const createStageRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const createItemRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const createWorkerRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const createDataSourceMock = () => ({
  createQueryRunner: jest.fn(),
});

const createFinancialServiceMock = () => ({
  getProjectSummary: jest.fn(),
});

const createConfigServiceMock = () => ({
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      GROQ_API_KEY: 'test-groq-key',
      GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
      AI_MODEL: 'llama-3.1-70b-versatile',
    };
    return config[key];
  }),
});

const createBIMAnalyticsServiceMock = () => ({
  getBIMElements: jest.fn().mockResolvedValue([]),
  getBIMSummaryInsights: jest.fn().mockResolvedValue({
    totalElements: 150,
    totalVolume: 500.0,
    progressPercentage: 75,
    qualityScore: 92.5,
    criticalIssues: [],
    keyRecommendations: [],
  }),
  generateCostAnalysis: jest.fn().mockResolvedValue([]),
  generateClashAnalysis: jest.fn().mockResolvedValue({
    totalClashes: 0,
    criticalUnresolved: 0,
    resolvedPercentage: 100,
    avgResolutionTime: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byDiscipline: {},
  }),
  generateProgressAnalysis: jest.fn().mockResolvedValue({
    overall: { percentage: 75, elementsCompleted: 300, elementsTotal: 400 },
    byStorey: {
      'Piso 1': { total: 100, percentage: 85.0, volume: 50.5 },
      'Piso 2': { total: 80, percentage: 60.0, volume: 40.2 },
      Basement: { total: 50, percentage: 45.0, volume: 30.0 },
    },
  }),
  generateQualityMetrics: jest.fn().mockResolvedValue({
    elementsWithIssues: 0,
    qualityScore: 100,
    issuesByType: {},
    recommendations: [],
  }),
  generateResourceOptimization: jest.fn().mockResolvedValue({
    materialWaste: [],
    laborEfficiency: [],
    equipmentUtilization: [],
    totalSavings: 0,
  }),
  getModelStatistics: jest.fn().mockResolvedValue({
    total_elements: 150,
    by_discipline: { architecture: 80, structure: 70 },
    by_ifc_type: { IfcWall: 25, IfcSlab: 15, IfcColumn: 30 },
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('AIService', () => {
  let service: AIService;
  let projectRepo: ReturnType<typeof createProjectRepositoryMock>;
  let budgetRepo: ReturnType<typeof createBudgetRepositoryMock>;
  let configService: ReturnType<typeof createConfigServiceMock>;

  beforeEach(async () => {
    projectRepo = createProjectRepositoryMock();
    budgetRepo = createBudgetRepositoryMock();
    configService = createConfigServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepo,
        },
        {
          provide: getRepositoryToken(Budget),
          useValue: budgetRepo,
        },
        {
          provide: getRepositoryToken(Stage),
          useValue: createStageRepositoryMock(),
        },
        {
          provide: getRepositoryToken(Item),
          useValue: createItemRepositoryMock(),
        },
        {
          provide: getRepositoryToken(Worker),
          useValue: createWorkerRepositoryMock(),
        },
        { provide: DataSource, useValue: createDataSourceMock() },
        { provide: FinancialService, useValue: createFinancialServiceMock() },
        {
          provide: BIMAnalyticsService,
          useValue: createBIMAnalyticsServiceMock(),
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BASIC QUERY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

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
      });
    });

    describe('budget intent', () => {
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
          'presupuesto',
        );

        expect(result.answer).toContain('Presupuesto total');
        expect(result.data).toHaveProperty('budgets');
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
    });

    describe('handleBIMStoreysQuery', () => {
      it('should handle BIM storeys query', async () => {
        const mockBIMAnalytics = {
          getBIMElements: jest
            .fn()
            .mockResolvedValue([{ storey_name: 'Level 1' }]),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            AIService,
            {
              provide: getRepositoryToken(Project),
              useValue: projectRepo,
            },
            {
              provide: getRepositoryToken(Budget),
              useValue: budgetRepo,
            },
            {
              provide: getRepositoryToken(Stage),
              useValue: createStageRepositoryMock(),
            },
            {
              provide: getRepositoryToken(Item),
              useValue: createItemRepositoryMock(),
            },
            {
              provide: getRepositoryToken(Worker),
              useValue: createWorkerRepositoryMock(),
            },
            { provide: DataSource, useValue: createDataSourceMock() },
            {
              provide: FinancialService,
              useValue: createFinancialServiceMock(),
            },
            {
              provide: BIMAnalyticsService,
              useValue: mockBIMAnalytics,
            },
            { provide: ConfigService, useValue: configService },
          ],
        }).compile();

        const testService = module.get<AIService>(AIService);
        const result = await (testService as any).handleBIMStoreysQuery(
          'company-1',
          'project-1',
          'piso',
        );
        expect(result).toHaveProperty('answer');
      });
    });
  });

  describe('generateRecommendations', () => {
    it('should return default insight when no projects', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await service.generateRecommendations('company-1');

      expect(result.data.insights).toHaveLength(1);
      expect(result.data.insights[0].title).toBe('Todo en orden');
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
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES - GROQ API INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('analyzeBudgetWithAI - Edge Cases', () => {
    const mockGroqClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    beforeEach(() => {
      // Inject mock Groq client
      (service as any).groqClient = mockGroqClient;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should handle successful Groq response with json_object format', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Presupuesto saludable',
                healthStatus: 'healthy',
                keyInsights: [
                  {
                    type: 'recommendation',
                    title: 'Buen control de costos',
                    description: 'El presupuesto está bien balanceado',
                    impact: 'low',
                  },
                ],
                varianceAnalysis: {
                  totalVariance: 2.5,
                  overBudgetItems: 0,
                  underBudgetItems: 1,
                  criticalItems: [],
                },
                recommendations: ['Mantener el control de gastos'],
              }),
            },
          },
        ],
      };

      mockGroqClient.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.analyzeBudgetWithAI('budget-1');

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('healthStatus');
      expect(result.healthStatus).toBe('healthy');
      expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.1-70b-versatile',
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should throw InternalServerErrorException on Groq rate limit (429)', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockGroqClient.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(service.analyzeBudgetWithAI('budget-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on API timeout', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const timeoutError = new Error('API request timed out');
      mockGroqClient.chat.completions.create.mockRejectedValue(timeoutError);

      await expect(service.analyzeBudgetWithAI('budget-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle malformed JSON response from LLM', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: 'Esto no es un JSON válido: { invalid',
            },
          },
        ],
      };

      mockGroqClient.chat.completions.create.mockResolvedValue(mockAIResponse);

      await expect(service.analyzeBudgetWithAI('budget-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle LLM returning plain text instead of JSON', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: 'El presupuesto se ve bien, todo dentro de lo normal.',
            },
          },
        ],
      };

      mockGroqClient.chat.completions.create.mockResolvedValue(mockAIResponse);

      await expect(service.analyzeBudgetWithAI('budget-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle empty response from LLM', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };

      mockGroqClient.chat.completions.create.mockResolvedValue(mockAIResponse);

      await expect(service.analyzeBudgetWithAI('budget-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw when budget is not found', async () => {
      budgetRepo.findOne.mockResolvedValue(null);

      await expect(service.analyzeBudgetWithAI('nonexistent')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should fall back to local analysis when Groq client is not initialized', async () => {
      // Remove Groq client
      (service as any).groqClient = null;

      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const result = await service.analyzeBudgetWithAI('budget-1');

      // Should return local analysis without calling Groq
      expect(result).toHaveProperty('totalEstimated');
      expect(mockGroqClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should use configured AI model from ConfigService', async () => {
      // Update config to use different model
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GROQ_API_KEY: 'test-groq-key',
          AI_MODEL: 'llama-3.3-70b-versatile',
        };
        return config[key];
      });

      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test',
                healthStatus: 'healthy',
                keyInsights: [],
                varianceAnalysis: {
                  totalVariance: 0,
                  overBudgetItems: 0,
                  underBudgetItems: 0,
                  criticalItems: [],
                },
                recommendations: [],
              }),
            },
          },
        ],
      };

      mockGroqClient.chat.completions.create.mockResolvedValue(mockAIResponse);

      await service.analyzeBudgetWithAI('budget-1');

      expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REPOSITORY ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

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
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Data edge cases', () => {
    it('should handle projects with undefined dates', async () => {
      const projectWithNullDates = createMockProject({
        start_date: undefined,
        end_date: undefined,
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
        estimated_price: 0,
      });
      projectRepo.find.mockResolvedValue([projectWithZeroBudget]);

      const result = await service.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'estado del proyecto',
      );

      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBudgetQuery', () => {
    it('should return budgets when budgetId provided', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const result = await (service as any).handleBudgetQuery(
        'company-1',
        undefined,
        'budget-1',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should return budgets when projectId provided', async () => {
      const mockBudget = createMockBudget({
        stages: [createMockStage({ items: [createMockItem()] })],
        project: { name: 'Test Project' } as any,
      });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const result = await (service as any).handleBudgetQuery(
        'company-1',
        'project-1',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should return empty when no budgets found', async () => {
      budgetRepo.findOne.mockResolvedValue(null);

      const result = await (service as any).handleBudgetQuery(
        'company-1',
        'project-1',
      );
      expect(result.answer).toContain('No encontré');
    });
  });

  describe('handleScheduleQuery', () => {
    it('should return schedule analysis', async () => {
      projectRepo.find.mockResolvedValue([createMockProject()]);

      const result = await (service as any).handleScheduleQuery('company-1');
      expect(result).toHaveProperty('answer');
    });

    it('should return empty when no projects', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await (service as any).handleScheduleQuery('company-1');
      expect(result.answer).toContain('No hay proyectos');
    });
  });

  describe('handleWorkersQuery', () => {
    it('should return worker analysis', async () => {
      const workerMock = createWorkerRepositoryMock();
      workerMock.find.mockResolvedValue([createMockWorker()]);

      // Replace the worker repo in the module
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: workerMock,
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: createBIMAnalyticsServiceMock(),
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleWorkersQuery('company-1');
      expect(result).toHaveProperty('answer');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for projects', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({
        stages: [mockStage],
        status: 'active' as any,
      });
      const project = createMockProject({
        budgets: [mockBudget],
        status: 'in_progress' as any,
      });
      projectRepo.find.mockResolvedValue([project]);

      const result = await service.generateRecommendations('company-1');
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('data');
    });

    it('should return default insight when no projects', async () => {
      projectRepo.find.mockResolvedValue([]);

      const result = await service.generateRecommendations('company-1');
      expect(result.answer).toContain('No hay recomendaciones');
    });
  });

  describe('predictProjectOutcome', () => {
    it('should predict project outcome', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 30,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({ stages: [mockStage] });
      const project = createMockProject({
        budgets: [mockBudget],
        status: 'in_progress' as any,
      });
      projectRepo.find.mockResolvedValue([project]);

      const result = await service.predictProjectOutcome('company-1');
      expect(result).toHaveProperty('answer');
      expect(result.data.predictions[0]).toHaveProperty('riskLevel');
    });
  });

  describe('analyzeBudgetDeviation', () => {
    it('should analyze budget deviation', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({ stages: [mockStage] });
      budgetRepo.findOne.mockResolvedValue(mockBudget);

      const result = await service.analyzeBudgetDeviation('budget-1');
      expect(result).toHaveProperty('variance');
      expect(result).toHaveProperty('totalEstimated');
    });

    it('should return null when budget not found', async () => {
      budgetRepo.findOne.mockResolvedValue(null);

      const result = await service.analyzeBudgetDeviation('invalid');
      expect(result).toBeNull();
    });
  });

  describe('generateProjectReport', () => {
    it('should generate project report', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({
        stages: [mockStage],
        project: { name: 'Test' } as any,
      });
      const project = createMockProject({ budgets: [mockBudget] });
      projectRepo.findOne.mockResolvedValue(project);

      const result = await service.generateProjectReport(
        'project-1',
        'executive',
      );
      expect(result).toHaveProperty('projectName');
      expect(result).toHaveProperty('sections');
    });

    it('should handle project not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);

      const result = await service.generateProjectReport(
        'invalid',
        'financial',
      );
      expect(result).toBeNull();
    });
  });

  describe('handleBIMElementsQuery', () => {
    it('should handle BIM elements query', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 100,
          activeClashes: 5,
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleBIMElementsQuery(
        'company-1',
        'project-1',
        'wall',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle empty elements gracefully', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 0,
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleBIMElementsQuery(
        'company-1',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBIMClashesQuery', () => {
    it('should handle BIM clashes query', async () => {
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 10,
          critical: 2,
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleBIMClashesQuery(
        'company-1',
        'project-1',
        'clash',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBIMQuantitiesQuery', () => {
    it('should handle BIM quantities query', async () => {
      const mockBIMAnalytics = {
        generateCostAnalysis: jest
          .fn()
          .mockResolvedValue([{ ifc_type: 'IfcWall', element_count: 100 }]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleBIMQuantitiesQuery(
        'company-1',
        'project-1',
        'cantidad',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBIMStoreysQuery', () => {
    it('should handle BIM storeys query', async () => {
      const mockBIMAnalytics = {
        getBIMElements: jest
          .fn()
          .mockResolvedValue([{ storey_name: 'Level 1' }]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await (testService as any).handleBIMStoreysQuery(
        'company-1',
        'project-1',
        'piso',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('processNaturalLanguageQuery with BIM intents', () => {
    it('should process bimElements intent', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest
          .fn()
          .mockResolvedValue({ totalElements: 50 }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'elementos BIM del proyecto',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should process bimClashes intent', async () => {
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({ totalClashes: 5 }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: mockBIMAnalytics,
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'clashes en el modelo',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should process documents intent', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: createBIMAnalyticsServiceMock(),
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'documentos del proyecto',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('default intent fallback', () => {
    it('should handle unknown intent with fallback', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepo,
          },
          {
            provide: getRepositoryToken(Budget),
            useValue: budgetRepo,
          },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          {
            provide: BIMAnalyticsService,
            useValue: createBIMAnalyticsServiceMock(),
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'algo random xyz123',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('processNaturalLanguageQuery - BIM queries', () => {
    it('should handle BIM elements query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 100,
          totalVolume: 500,
          progressPercentage: 50,
          qualityScore: 85,
          criticalIssues: [],
          keyRecommendations: ['Revisar modelo'],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'elementos bim',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim clashes query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 10,
          criticalUnresolved: 2,
          resolvedPercentage: 80,
          avgResolutionTime: 5,
          bySeverity: { critical: 2, high: 3, medium: 3, low: 2 },
          byType: { hard: 5, soft: 3, clearance: 2 },
          byDiscipline: {},
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'colisiones bim',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim quantities query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateCostAnalysis: jest.fn().mockResolvedValue([
          {
            ifcType: 'IfcWall',
            elementCount: 100,
            totalVolume: 500,
            totalArea: 200,
            totalCost: 50000,
          },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'cubicación de concreto',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim storeys query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateProgressAnalysis: jest.fn().mockResolvedValue({
          totalElements: 100,
          completedElements: 50,
          progressPercentage: 50,
          byStorey: {
            'Ground Floor': {
              total: 50,
              completed: 25,
              percentage: 50,
              volume: 100,
            },
          },
          byType: {},
          predictedCompletion: null,
          delayRiskFactors: [],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'pisos del proyecto',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim disciplines query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 15,
          criticalUnresolved: 3,
          resolvedPercentage: 80,
          avgResolutionTime: 5,
          bySeverity: { critical: 3, high: 5, medium: 4, low: 3 },
          byType: { hard: 8, soft: 4, clearance: 3 },
          byDiscipline: { architecture: 5, structure: 4, mep: 6 },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'arquitectura y estructura',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim quality query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateQualityMetrics: jest.fn().mockResolvedValue({
          elementsWithIssues: 5,
          qualityScore: 85,
          commonIssues: [
            { issue: 'Missing properties', count: 3, impact: 'high' as const },
          ],
          modelCompleteness: 90,
          dataConsistency: 88,
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'calidad del modelo bim',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim materials query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateCostAnalysis: jest.fn().mockResolvedValue([
          {
            ifcType: 'IfcWall',
            elementCount: 50,
            totalVolume: 200,
            totalArea: 100,
            totalCost: 30000,
          },
          {
            ifcType: 'IfcSlab',
            elementCount: 20,
            totalVolume: 150,
            totalArea: 80,
            totalCost: 20000,
          },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'materiales del modelo',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle bim optimization query', async () => {
      projectRepo.find.mockResolvedValue([]);
      const mockBIMAnalytics = {
        generateResourceOptimization: jest.fn().mockResolvedValue({
          materialWaste: [
            {
              type: 'Concrete',
              plannedQuantity: 100,
              actualQuantity: 95,
              wastePercentage: 5,
              costImpact: 2500,
            },
          ],
          laborEfficiency: [
            {
              zone: 'Ground Floor',
              plannedHours: 100,
              actualHours: 90,
              efficiency: 90,
            },
          ],
          equipmentUtilization: [
            {
              equipment: 'Crane',
              plannedUsage: 8,
              actualUsage: 7,
              utilization: 87.5,
            },
          ],
          optimizationRecommendations: ['Optimizar uso de materiales'],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'optimización de recursos',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('generateProjectReport - additional types', () => {
    it('should generate financial report', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({
        stages: [mockStage],
        project: { name: 'Test Project' } as any,
      });
      const project = createMockProject({
        budgets: [mockBudget],
        id: 'project-finance',
        location: 'Test Location',
      });
      projectRepo.findOne.mockResolvedValue(project);

      const mockFinancialService = {
        getProjectSummary: jest
          .fn()
          .mockResolvedValue('Financial Summary: $50,000 executed'),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: mockFinancialService },
          {
            provide: BIMAnalyticsService,
            useValue: createBIMAnalyticsServiceMock(),
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.generateProjectReport(
        'project-finance',
        'financial',
      );
      expect(result).toHaveProperty('sections');
    });

    it('should generate technical report', async () => {
      const mockItem = createMockItem({
        quantity: 100,
        quantity_executed: 50,
        unit_cost: 100,
      });
      const mockStage = createMockStage({ items: [mockItem] });
      const mockBudget = createMockBudget({
        stages: [mockStage],
        project: { name: 'Test Project' } as any,
      });
      const project = createMockProject({
        budgets: [mockBudget],
        id: 'project-tech',
        location: 'Test Location',
      });
      projectRepo.findOne.mockResolvedValue(project);

      const mockFinancialService = {
        getProjectSummary: jest
          .fn()
          .mockResolvedValue('Financial Summary: $50,000 executed'),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: mockFinancialService },
          {
            provide: BIMAnalyticsService,
            useValue: createBIMAnalyticsServiceMock(),
          },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.generateProjectReport(
        'project-tech',
        'technical',
      );
      expect(result).toHaveProperty('sections');
    });
  });

  describe('handleBIMElementsQuery - specific IFC types', () => {
    it('should handle specific IFC wall query', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 100,
          totalVolume: 500,
          progressPercentage: 50,
          qualityScore: 85,
          criticalIssues: [],
          keyRecommendations: [],
        }),
        getBIMElements: jest.fn().mockResolvedValue([
          { id: 'el-1', quantities: { netVolume: 10, netArea: 20 } },
          { id: 'el-2', quantities: { netVolume: 15, netArea: 25 } },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'IfcWall',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle ifc type with quantities', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 100,
          totalVolume: 500,
          progressPercentage: 50,
          qualityScore: 85,
          criticalIssues: [],
          keyRecommendations: [],
        }),
        getBIMElements: jest.fn().mockResolvedValue([
          { id: 'el-1', quantities: { netVolume: 10, netArea: 0 } },
          { id: 'el-2', quantities: { netVolume: 15, netArea: 0 } },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'IfcSlab',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle elements with critical issues', async () => {
      const mockBIMAnalytics = {
        getBIMSummaryInsights: jest.fn().mockResolvedValue({
          totalElements: 100,
          totalVolume: 500,
          progressPercentage: 50,
          qualityScore: 85,
          criticalIssues: ['Missing load data'],
          keyRecommendations: ['Add load data'],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'modelos bim',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBIMClashesQuery - severity filters', () => {
    it('should filter by critical severity', async () => {
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 15,
          criticalUnresolved: 3,
          resolvedPercentage: 80,
          avgResolutionTime: 5,
          bySeverity: { critical: 3, high: 5, medium: 4, low: 3 },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'colisiones críticas',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should filter by high severity', async () => {
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 15,
          criticalUnresolved: 0,
          resolvedPercentage: 80,
          avgResolutionTime: 5,
          bySeverity: { critical: 0, high: 5, medium: 4, low: 3 },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'colisiones altas',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle high critical unresolved', async () => {
      const mockBIMAnalytics = {
        generateClashAnalysis: jest.fn().mockResolvedValue({
          totalClashes: 20,
          criticalUnresolved: 8,
          resolvedPercentage: 30,
          avgResolutionTime: 10,
          bySeverity: { critical: 8, high: 5, medium: 4, low: 3 },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'clashes',
      );
      expect(result.actionable).toBe(true);
    });
  });

  describe('handleBIMQuantitiesQuery - material specific', () => {
    it('should handle concrete quantities', async () => {
      const mockBIMAnalytics = {
        generateCostAnalysis: jest.fn().mockResolvedValue([
          {
            ifcType: 'IfcSlab',
            elementCount: 50,
            totalVolume: 200,
            totalArea: 100,
            totalCost: 30000,
          },
          {
            ifcType: 'IfcWall',
            elementCount: 30,
            totalVolume: 100,
            totalArea: 50,
            totalCost: 15000,
          },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'concreto',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle steel quantities', async () => {
      const mockBIMAnalytics = {
        generateCostAnalysis: jest.fn().mockResolvedValue([
          {
            ifcType: 'IfcBeam',
            elementCount: 20,
            totalVolume: 10,
            totalArea: 0,
            totalCost: 20000,
          },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'acero',
      );
      expect(result).toHaveProperty('answer');
    });
  });

  describe('handleBIMStoreysQuery - specific storey', () => {
    it('should handle specific floor query', async () => {
      const mockBIMAnalytics = {
        generateProgressAnalysis: jest.fn().mockResolvedValue({
          totalElements: 100,
          completedElements: 80,
          progressPercentage: 80,
          byStorey: {
            'Ground Floor': {
              total: 50,
              completed: 45,
              percentage: 90,
              volume: 100,
            },
            'Level 1': {
              total: 50,
              completed: 35,
              percentage: 70,
              volume: 120,
            },
          },
          byType: {},
          predictedCompletion: null,
          delayRiskFactors: [],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'piso 1',
      );
      expect(result).toHaveProperty('answer');
    });

    it('should handle slow storeys', async () => {
      const mockBIMAnalytics = {
        generateProgressAnalysis: jest.fn().mockResolvedValue({
          totalElements: 100,
          completedElements: 30,
          progressPercentage: 30,
          byStorey: {
            'Ground Floor': {
              total: 50,
              completed: 45,
              percentage: 90,
              volume: 100,
            },
            'Level 1': { total: 50, completed: 5, percentage: 10, volume: 120 },
          },
          byType: {},
          predictedCompletion: null,
          delayRiskFactors: [],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIService,
          { provide: getRepositoryToken(Project), useValue: projectRepo },
          { provide: getRepositoryToken(Budget), useValue: budgetRepo },
          {
            provide: getRepositoryToken(Stage),
            useValue: createStageRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Item),
            useValue: createItemRepositoryMock(),
          },
          {
            provide: getRepositoryToken(Worker),
            useValue: createWorkerRepositoryMock(),
          },
          { provide: DataSource, useValue: createDataSourceMock() },
          { provide: FinancialService, useValue: createFinancialServiceMock() },
          { provide: BIMAnalyticsService, useValue: mockBIMAnalytics },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const testService = module.get<AIService>(AIService);
      const result = await testService.processNaturalLanguageQuery(
        'user-1',
        'company-1',
        'pisos',
      );
      expect(result.answer).toContain('retraso');
    });
  });
});
