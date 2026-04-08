import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockAiService = {
  processNaturalLanguageQuery: jest.fn(),
  generateRecommendations: jest.fn(),
  predictProjectOutcome: jest.fn(),
  analyzeBudgetDeviation: jest.fn(),
  generateProjectReport: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('AIController', () => {
  let controller: AIController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [{ provide: AIService, useValue: mockAiService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AIController>(AIController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processQuery', () => {
    it('should process NLP query', async () => {
      const mockResult = { answer: 'Test answer', confidence: 0.9 };
      mockAiService.processNaturalLanguageQuery.mockResolvedValue(mockResult);

      const user = { id: 'user-1', company_id: 'company-1' };
      const dto = { query: 'estado del proyecto', projectId: 'project-1' };

      const result = await controller.processQuery(user, dto);

      expect(mockAiService.processNaturalLanguageQuery).toHaveBeenCalledWith(
        'user-1',
        'company-1',
        'estado del proyecto',
        { projectId: 'project-1', budgetId: undefined },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRecommendations', () => {
    it('should generate recommendations', async () => {
      const mockResult = { answer: 'Recommendations', insights: [] };
      mockAiService.generateRecommendations.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.getRecommendations(user, 'project-1');

      expect(mockAiService.generateRecommendations).toHaveBeenCalledWith(
        'company-1',
        'project-1',
      );
      expect(result).toEqual(mockResult);
    });

    it('should generate recommendations without projectId', async () => {
      const mockResult = { answer: 'Recommendations' };
      mockAiService.generateRecommendations.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.getRecommendations(user, undefined);

      expect(mockAiService.generateRecommendations).toHaveBeenCalledWith(
        'company-1',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('predictOutcome', () => {
    it('should predict project outcome', async () => {
      const mockResult = { answer: 'Prediction', predictions: [] };
      mockAiService.predictProjectOutcome.mockResolvedValue(mockResult);

      const user = { company_id: 'company-1' };

      const result = await controller.predictOutcome(user, 'project-1');

      expect(mockAiService.predictProjectOutcome).toHaveBeenCalledWith(
        'company-1',
        'project-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('analyzeBudget', () => {
    it('should analyze budget deviation', async () => {
      const mockResult = { totalEstimated: 1000, totalExecuted: 1200 };
      mockAiService.analyzeBudgetDeviation.mockResolvedValue(mockResult);

      const result = await controller.analyzeBudget('budget-1');

      expect(mockAiService.analyzeBudgetDeviation).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('generateReport', () => {
    it('should generate project report', async () => {
      const mockResult = { projectName: 'Test Project', sections: [] };
      mockAiService.generateProjectReport.mockResolvedValue(mockResult);

      const dto = { projectId: 'project-1', type: 'executive' as const };

      const result = await controller.generateReport(dto);

      expect(mockAiService.generateProjectReport).toHaveBeenCalledWith(
        'project-1',
        'executive',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
