import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AIAssistantService } from './ai-assistant.service';
import { Budget } from '../budgets/budget.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

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
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    mockCreate = mockOpenAI.chat.completions.create;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: false,
        }),
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GROQ_API_KEY') return 'test-api-key';
              if (key === 'GROQ_BASE_URL') return 'https://test.groq.com';
              if (key === 'AI_MODEL') return 'llama3-70b-8192';
              return null;
            }),
          },
        },
        AIAssistantService,
        {
          provide: getRepositoryToken(Budget),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(ProjectContingency),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AIAssistantService>(AIAssistantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateConstructionAnalysis', () => {
    it('should return parsed JSON when API resolves successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test analysis',
                status: 'healthy',
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.generateConstructionAnalysis(
        'Analyze this',
        { projectId: 'test-123' },
      );

      expect(result).toEqual({
        summary: 'Test analysis',
        status: 'healthy',
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama3-70b-8192',
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should throw InternalServerErrorException when API returns error', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      await expect(
        service.generateConstructionAnalysis('Test prompt', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when no content in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        service.generateConstructionAnalysis('Test prompt', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('isAvailable', () => {
    it('should return true when client is initialized', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });
});
