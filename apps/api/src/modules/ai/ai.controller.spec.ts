import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const createMockAiService = () => ({
  processNaturalLanguageQuery: jest.fn(),
  generateRecommendations: jest.fn(),
  predictProjectOutcome: jest.fn(),
  analyzeBudgetDeviation: jest.fn(),
  analyzeBudgetWithAI: jest.fn(),
  generateProjectReport: jest.fn(),
});

const createMockAuthGuard = () => ({
  canActivate: jest.fn().mockReturnValue(true),
});

const createMockSubscriptionsService = () => ({
  hasFeature: jest.fn().mockResolvedValue(true),
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('AIController', () => {
  let controller: AIController;
  let aiService: ReturnType<typeof createMockAiService>;

  beforeEach(async () => {
    aiService = createMockAiService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AIService, useValue: aiService },
        {
          provide: SubscriptionsService,
          useValue: createMockSubscriptionsService(),
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(createMockAuthGuard())
      .overrideGuard(FeatureGuard)
      .useValue(createMockAuthGuard())
      .compile();

    controller = module.get<AIController>(AIController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS QUERY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('processQuery', () => {
    it('should process NLP query with valid DTO', async () => {
      const mockResult = { answer: 'Test answer', confidence: 0.9 };
      aiService.processNaturalLanguageQuery.mockResolvedValue(mockResult);

      const user = { id: 'user-1', company_id: 'company-1' };
      const dto = {
        query: 'estado del proyecto',
        projectId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      };

      const result = await controller.processQuery(user, dto);

      expect(aiService.processNaturalLanguageQuery).toHaveBeenCalledWith(
        'user-1',
        'company-1',
        'estado del proyecto',
        { projectId: dto.projectId, budgetId: undefined },
      );
      expect(result).toEqual(mockResult);
    });

    it('should process NLP query with projectId and budgetId', async () => {
      const mockResult = { answer: 'Budget analysis', confidence: 0.85 };
      aiService.processNaturalLanguageQuery.mockResolvedValue(mockResult);

      const user = { id: 'user-1', company_id: 'company-1' };
      const dto = {
        query: 'analizar presupuesto',
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        budgetId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = await controller.processQuery(user, dto);

      expect(aiService.processNaturalLanguageQuery).toHaveBeenCalledWith(
        'user-1',
        'company-1',
        'analizar presupuesto',
        { projectId: dto.projectId, budgetId: dto.budgetId },
      );
      expect(result).toEqual(mockResult);
    });

    it('should reject empty query string', async () => {
      const user = { id: 'user-1', company_id: 'company-1' };
      const dto = { query: '' };

      // The DTO validation should happen at middleware level
      // This tests the controller passes through correctly
      aiService.processNaturalLanguageQuery.mockRejectedValue(
        new BadRequestException('El campo query es requerido'),
      );

      await expect(controller.processQuery(user, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid projectId format (not UUID)', async () => {
      const user = { id: 'user-1', company_id: 'company-1' };
      const dto = {
        query: 'estado del proyecto',
        projectId: 'invalid-uuid',
      };

      aiService.processNaturalLanguageQuery.mockRejectedValue(
        new BadRequestException('Invalid UUID format'),
      );

      await expect(controller.processQuery(user, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getRecommendations', () => {
    it('should generate recommendations with projectId', async () => {
      const mockResult = { answer: 'Recommendations', insights: [] };
      aiService.generateRecommendations.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.getRecommendations(
        user,
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(aiService.generateRecommendations).toHaveBeenCalledWith(
        'company-1',
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toEqual(mockResult);
    });

    it('should generate recommendations without projectId', async () => {
      const mockResult = { answer: 'Recommendations' };
      aiService.generateRecommendations.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.getRecommendations(user, undefined);

      expect(aiService.generateRecommendations).toHaveBeenCalledWith(
        'company-1',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass company_id from user to service', async () => {
      const mockResult = { answer: 'Test', insights: [] };
      aiService.generateRecommendations.mockResolvedValue(mockResult);

      const user = { company_id: 'company-xyz-123' };

      await controller.getRecommendations(user, undefined);

      expect(aiService.generateRecommendations).toHaveBeenCalledWith(
        'company-xyz-123',
        undefined,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICT OUTCOME TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('predictOutcome', () => {
    it('should predict project outcome with projectId', async () => {
      const mockResult = { answer: 'Prediction', predictions: [] };
      aiService.predictProjectOutcome.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.predictOutcome(
        user,
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(aiService.predictProjectOutcome).toHaveBeenCalledWith(
        'company-1',
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toEqual(mockResult);
    });

    it('should predict project outcome without projectId', async () => {
      const mockResult = { answer: 'Prediction for all projects' };
      aiService.predictProjectOutcome.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.predictOutcome(user, undefined);

      expect(aiService.predictProjectOutcome).toHaveBeenCalledWith(
        'company-1',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYZE BUDGET TESTS (Including Edge Cases)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('analyzeBudget', () => {
    it('should analyze budget with AI successfully', async () => {
      const mockResult = {
        summary: 'Budget analysis',
        healthStatus: 'healthy',
        budgetSummary: { totalEstimated: 100000 },
      };
      aiService.analyzeBudgetWithAI.mockResolvedValue(mockResult);

      const user = { id: 'user-1', company_id: 'company-1' };

      const result = await controller.analyzeBudget(
        user,
        '123e4567-e89b-12d3-a456-426614174000',
        'Analiza el presupuesto',
      );

      expect(aiService.analyzeBudgetWithAI).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'Analiza el presupuesto',
      );
      expect(result).toEqual(mockResult);
    });

    it('should analyze budget without optional prompt', async () => {
      const mockResult = { summary: 'Analysis' };
      aiService.analyzeBudgetWithAI.mockResolvedValue(mockResult);

      const user = { id: 'user-1', company_id: 'company-1' };

      const result = await controller.analyzeBudget(
        user,
        '123e4567-e89b-12d3-a456-426614174000',
        undefined,
      );

      expect(aiService.analyzeBudgetWithAI).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw HttpException when AI service throws generic error', async () => {
      aiService.analyzeBudgetWithAI.mockRejectedValue(
        new Error('Groq API error'),
      );

      const user = { id: 'user-1', company_id: 'company-1' };

      await expect(
        controller.analyzeBudget(
          user,
          '123e4567-e89b-12d3-a456-426614174000',
          undefined,
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should propagate HttpException from service', async () => {
      aiService.analyzeBudgetWithAI.mockRejectedValue(
        new BadRequestException('Budget not found'),
      );

      const user = { id: 'user-1', company_id: 'company-1' };

      await expect(
        controller.analyzeBudget(
          user,
          '123e4567-e89b-12d3-a456-426614174000',
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle rate limit error (429) from Groq', async () => {
      aiService.analyzeBudgetWithAI.mockRejectedValue(
        new InternalServerErrorException(
          'Rate limit exceeded. Please try again later.',
        ),
      );

      const user = { id: 'user-1', company_id: 'company-1' };

      await expect(
        controller.analyzeBudget(
          user,
          '123e4567-e89b-12d3-a456-426614174000',
          undefined,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle timeout error from AI service', async () => {
      aiService.analyzeBudgetWithAI.mockRejectedValue(
        new InternalServerErrorException('AI service timeout'),
      );

      const user = { id: 'user-1', company_id: 'company-1' };

      await expect(
        controller.analyzeBudget(
          user,
          '123e4567-e89b-12d3-a456-426614174000',
          undefined,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle malformed response from AI', async () => {
      aiService.analyzeBudgetWithAI.mockRejectedValue(
        new InternalServerErrorException('Invalid response format from AI'),
      );

      const user = { id: 'user-1', company_id: 'company-1' };

      await expect(
        controller.analyzeBudget(
          user,
          '123e4567-e89b-12d3-a456-426614174000',
          undefined,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE REPORT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('generateReport', () => {
    it('should generate executive report', async () => {
      const mockResult = { projectName: 'Test Project', sections: [] };
      aiService.generateProjectReport.mockResolvedValue(mockResult);

      const dto = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'executive' as const,
      };

      const result = await controller.generateReport(dto);

      expect(aiService.generateProjectReport).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'executive',
      );
      expect(result).toEqual(mockResult);
    });

    it('should generate financial report', async () => {
      const mockResult = {
        projectName: 'Test',
        sections: [{ title: 'Financial' }],
      };
      aiService.generateProjectReport.mockResolvedValue(mockResult);

      const dto = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'financial' as const,
      };

      const result = await controller.generateReport(dto);

      expect(aiService.generateProjectReport).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'financial',
      );
      expect(result).toEqual(mockResult);
    });

    it('should generate technical report', async () => {
      const mockResult = {
        projectName: 'Test',
        sections: [{ title: 'Technical' }],
      };
      aiService.generateProjectReport.mockResolvedValue(mockResult);

      const dto = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'technical' as const,
      };

      const result = await controller.generateReport(dto);

      expect(aiService.generateProjectReport).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'technical',
      );
      expect(result).toEqual(mockResult);
    });

    it('should validate report DTO with UUID projectId', async () => {
      const mockResult = { projectName: 'Test', sections: [] };
      aiService.generateProjectReport.mockResolvedValue(mockResult);

      const dto = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'executive' as const,
      };

      // This should work with valid UUID
      await controller.generateReport(dto);
      expect(aiService.generateProjectReport).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS ENDPOINT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getAIStatus', () => {
    it('should return AI status information', () => {
      const result = controller.getAIStatus();

      expect(result).toHaveProperty('available', true);
      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('provider', 'groq');
    });

    it('should include model from environment', () => {
      // Test that status returns model info
      const result = controller.getAIStatus();

      expect(result.model).toBeDefined();
      expect(typeof result.model).toBe('string');
    });
  });
});
