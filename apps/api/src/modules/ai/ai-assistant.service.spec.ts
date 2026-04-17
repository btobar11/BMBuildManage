import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AIAssistantService } from './ai-assistant.service';
import { Budget } from '../budgets/budget.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';
import OpenAI from 'openai';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('AIAssistantService', () => {
  let service: AIAssistantService;
  let mockBudgetRepository: any;
  let mockContingencyRepository: any;
  let configService: ConfigService;

  beforeEach(async () => {
    mockBudgetRepository = {
      findOne: jest.fn(),
    };
    mockContingencyRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAssistantService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GROQ_API_KEY') return 'test-key';
              if (key === 'GROQ_BASE_URL') return 'https://test.url';
              if (key === 'AI_MODEL') return 'test-model';
              return null;
            }),
          },
        },
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(ProjectContingency),
          useValue: mockContingencyRepository,
        },
      ],
    }).compile();

    service = module.get<AIAssistantService>(AIAssistantService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
    it('should log warning if API key is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const tempService = new AIAssistantService(
        configService,
        mockBudgetRepository,
        mockContingencyRepository,
      );
      expect(tempService.isAvailable()).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('should return true if client is initialized', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('analyzeBudget', () => {
    const budgetId = 'b-1';
    const companyId = 'c-1';

    it('should throw if Groq client is not available', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const tempService = new AIAssistantService(
        configService,
        mockBudgetRepository,
        mockContingencyRepository,
      );
      await expect(
        tempService.analyzeBudget(budgetId, companyId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw if budget is not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);
      await expect(service.analyzeBudget(budgetId, companyId)).rejects.toThrow(
        'Presupuesto no encontrado',
      );
    });

    it('should throw if budget belongs to different company', async () => {
      mockBudgetRepository.findOne.mockResolvedValue({
        id: budgetId,
        project: { company: { id: 'other-company' } },
      });
      await expect(service.analyzeBudget(budgetId, companyId)).rejects.toThrow(
        'Presupuesto no encontrado',
      );
    });

    it('should analyze budget successfully', async () => {
      const mockBudget = {
        id: budgetId,
        project: { name: 'Project A', company: { id: companyId } },
        stages: [
          {
            name: 'Stage 1',
            items: [
              {
                name: 'Item 1',
                quantity: 10,
                unit_cost: 100,
                unit_price: 150,
                quantity_executed: 5,
              },
            ],
          },
        ],
      };
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      const aiResponse = {
        summary: 'Budget analysis summary',
        healthStatus: 'healthy',
        keyInsights: [],
        varianceAnalysis: {
          totalVariance: 0,
          overBudgetItems: 0,
          underBudgetItems: 0,
          criticalItems: [],
        },
        recommendations: [],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(aiResponse) } }],
      });

      const result = await service.analyzeBudget(budgetId, companyId);
      expect(result.summary).toBe(aiResponse.summary);
      expect(result.metadata?.projectName).toBe('Project A');
      expect(result.metadata?.totalEstimated).toBe(1000);
      expect(result.metadata?.totalExecuted).toBe(500);
    });

    it('should use custom prompt if provided', async () => {
      mockBudgetRepository.findOne.mockResolvedValue({
        id: budgetId,
        project: { name: 'Project A', company: { id: companyId } },
        stages: [],
      });
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify({ summary: 'custom' }) } },
        ],
      });

      await service.analyzeBudget(budgetId, companyId, 'Custom Prompt');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'Custom Prompt' }),
          ]),
        }),
      );
    });

    it('should throw if AI response is empty', async () => {
      mockBudgetRepository.findOne.mockResolvedValue({
        id: budgetId,
        project: { company: { id: companyId } },
        stages: [],
      });
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(service.analyzeBudget(budgetId, companyId)).rejects.toThrow(
        'Error al analizar presupuesto con IA',
      );
    });

    it('should handle generic errors', async () => {
      mockBudgetRepository.findOne.mockRejectedValue(new Error('DB Error'));
      await expect(service.analyzeBudget(budgetId, companyId)).rejects.toThrow(
        'Error al analizar presupuesto con IA',
      );
    });
  });

  describe('analyzeContingencies', () => {
    const projectId = 'p-1';
    const companyId = 'c-1';

    it('should throw if Groq client is not available', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const tempService = new AIAssistantService(
        configService,
        mockBudgetRepository,
        mockContingencyRepository,
      );
      await expect(
        tempService.analyzeContingencies(projectId, companyId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw if no contingencies found for company', async () => {
      mockContingencyRepository.find.mockResolvedValue([
        { project: { company: { id: 'other' } } },
      ]);
      await expect(
        service.analyzeContingencies(projectId, companyId),
      ).rejects.toThrow('No se encontraron contingencias para este proyecto');
    });

    it('should analyze contingencies successfully', async () => {
      const mockContingencies = [
        {
          description: 'Risk A',
          quantity: 1,
          unit_cost: 1000,
          total_cost: 500,
          project: { company: { id: companyId } },
        },
      ];
      mockContingencyRepository.find.mockResolvedValue(mockContingencies);

      const aiResponse = { summary: 'Contingency analysis', insights: [] };
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(aiResponse) } }],
      });

      const result = await service.analyzeContingencies(projectId, companyId);
      expect(result.summary).toBe(aiResponse.summary);
    });

    it('should handle AI response errors', async () => {
      mockContingencyRepository.find.mockResolvedValue([
        { project: { company: { id: companyId } } },
      ]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        service.analyzeContingencies(projectId, companyId),
      ).rejects.toThrow('Error al analizar contingencias con IA');
    });
  });

  describe('Private helpers edge cases', () => {
    it('extractBudgetData should handle zero estimation to prevent division by zero', async () => {
      const mockBudget = {
        project: { name: 'P' },
        stages: [
          { items: [{ quantity: 0, unit_cost: 100, quantity_executed: 10 }] },
        ],
      } as any;
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{}' } }],
      });

      const result = await (service as any).extractBudgetData(mockBudget);
      expect(result.variance).toBe(0);
      expect(result.items[0].variance).toBe(0);
    });

    it('calculateContingencyStats should handle zero allocation', () => {
      const mockContingencies = [
        { description: null, quantity: 0, unit_cost: 0 },
      ] as any;
      const result = (service as any).calculateContingencyStats(
        mockContingencies,
      );
      expect(result.utilizationRate).toBe(0);
    });

    it('calculateContingencyStats should handle items with no description', () => {
      const mockContingencies = [
        { description: null, quantity: 1, unit_cost: 100 },
      ] as any;
      const result = (service as any).calculateContingencyStats(
        mockContingencies,
      );
      expect(result.byCategory['general']).toBeDefined();
    });
  });

  describe('generateConstructionAnalysis', () => {
    it('should throw if Groq client is not available', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const tempService = new AIAssistantService(
        configService,
        mockBudgetRepository,
        mockContingencyRepository,
      );
      await expect(
        tempService.generateConstructionAnalysis('test', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should analyze construction data successfully', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ ok: true }) } }],
      });
      const result = await service.generateConstructionAnalysis('test', {});
      expect(result.ok).toBe(true);
    });

    it('should throw if completion content is empty', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });
      await expect(
        service.generateConstructionAnalysis('test', {}),
      ).rejects.toThrow('Error al generar análisis de construcción');
    });

    it('should rethrow InternalServerErrorException', async () => {
      // simulate an internal error
      jest
        .spyOn(mockOpenAI.chat.completions, 'create')
        .mockRejectedValue(new InternalServerErrorException('AI Down'));
      await expect(
        service.generateConstructionAnalysis('test', {}),
      ).rejects.toThrow('AI Down');
    });
  });
});
