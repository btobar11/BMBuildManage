import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiSalesService } from './ai-sales.service';
import {
  SalesInteraction,
  OpportunityType,
} from './entities/sales-interaction.entity';
import { SalesContextService } from './sales-context.service';
import { SalesDecisionEngine } from './sales-decision.engine';
import { SalesConversationEngine } from './sales-conversation.engine';
import { SalesTrackingService } from './sales-tracking.service';

describe('AiSalesService', () => {
  let service: AiSalesService;
  let trackingService: jest.Mocked<SalesTrackingService>;
  let contextService: jest.Mocked<SalesContextService>;
  let decisionEngine: jest.Mocked<SalesDecisionEngine>;
  let conversationEngine: jest.Mocked<SalesConversationEngine>;
  let interactionRepo: any;

  const mockCompanyId = 'company-1';
  const mockUserId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSalesService,
        {
          provide: getRepositoryToken(SalesInteraction),
          useValue: {
            create: jest.fn((data) => ({ id: 'int-uuid-1', ...data })),
            save: jest.fn((entity) => Promise.resolve(entity)),
          },
        },
        {
          provide: SalesContextService,
          useValue: {
            buildContext: jest.fn(),
          },
        },
        {
          provide: SalesDecisionEngine,
          useValue: {
            getSalesOpportunity: jest.fn(),
          },
        },
        {
          provide: SalesConversationEngine,
          useValue: {
            generateSalesMessage: jest.fn(),
          },
        },
        {
          provide: SalesTrackingService,
          useValue: {
            canShowPrompt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AiSalesService);
    interactionRepo = module.get(getRepositoryToken(SalesInteraction));
    trackingService = module.get(SalesTrackingService);
    contextService = module.get(SalesContextService);
    decisionEngine = module.get(SalesDecisionEngine);
    conversationEngine = module.get(SalesConversationEngine);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null if user has reached prompt limit', async () => {
    trackingService.canShowPrompt.mockResolvedValue(false);

    const result = await service.processSalesOpportunity(
      mockCompanyId,
      mockUserId,
    );
    expect(result).toBeNull();
    expect(contextService.buildContext).not.toHaveBeenCalled();
  });

  it('should return null if no opportunity detected', async () => {
    trackingService.canShowPrompt.mockResolvedValue(true);
    contextService.buildContext.mockResolvedValue({
      plan: 'enterprise',
      plan_status: 'active',
      usage: {},
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 30,
      is_trial: false,
    });
    decisionEngine.getSalesOpportunity.mockReturnValue(null);

    const result = await service.processSalesOpportunity(
      mockCompanyId,
      mockUserId,
    );
    expect(result).toBeNull();
  });

  it('should return full opportunity when conditions are met', async () => {
    trackingService.canShowPrompt.mockResolvedValue(true);
    contextService.buildContext.mockResolvedValue({
      plan: 'lite',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: 5, percentage: 100, status: 'blocked' },
      },
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 30,
      is_trial: false,
    });
    decisionEngine.getSalesOpportunity.mockReturnValue({
      type: OpportunityType.INCREASE_USAGE,
      addon_code: 'extra_project',
      trigger_reason: 'Proyectos al 100%',
      urgency: 'high',
    });
    conversationEngine.generateSalesMessage.mockResolvedValue({
      message: 'Tus proyectos están al máximo.',
      cta: 'Ampliar proyectos',
      urgency: 'high',
    });

    const result = await service.processSalesOpportunity(
      mockCompanyId,
      mockUserId,
    );

    expect(result).not.toBeNull();
    expect(result!.interaction_id).toBe('int-uuid-1');
    expect(result!.message).toBe('Tus proyectos están al máximo.');
    expect(result!.cta).toBe('Ampliar proyectos');
    expect(result!.urgency).toBe('high');
    expect(result!.opportunity_type).toBe(OpportunityType.INCREASE_USAGE);
    expect(interactionRepo.save).toHaveBeenCalled();
  });

  it('should return null if message generation fails', async () => {
    trackingService.canShowPrompt.mockResolvedValue(true);
    contextService.buildContext.mockResolvedValue({
      plan: 'lite',
      plan_status: 'active',
      usage: {},
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 5,
      is_trial: false,
    });
    decisionEngine.getSalesOpportunity.mockReturnValue({
      type: OpportunityType.UPGRADE_PLAN,
      target: 'pro',
      trigger_reason: 'Test',
      urgency: 'medium',
    });
    conversationEngine.generateSalesMessage.mockRejectedValue(
      new Error('AI down'),
    );

    const result = await service.processSalesOpportunity(
      mockCompanyId,
      mockUserId,
    );
    expect(result).toBeNull();
  });
});
