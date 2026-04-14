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
import { FinancialService } from '../budgets/financial.service';
import { BIMAnalyticsService } from './bim-analytics.service';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

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
  });
});
