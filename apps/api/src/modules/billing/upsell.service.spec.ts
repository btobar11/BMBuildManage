import { Test, TestingModule } from '@nestjs/testing';
import { UpsellService } from './upsell.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  PlanTier,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';

describe('UpsellService', () => {
  let service: UpsellService;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockCompanyId = 'company-uuid-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsellService,
        {
          provide: SubscriptionsService,
          useValue: {
            findByCompany: jest.fn(),
            getEffectiveLimits: jest.fn(),
            checkUsageStatus: jest.fn(),
            hasFeature: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UpsellService);
    subscriptionsService = module.get(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array when no subscription exists', async () => {
    subscriptionsService.findByCompany.mockResolvedValue(null);
    const result = await service.getUpsellSuggestions(mockCompanyId);
    expect(result).toEqual([]);
  });

  it('should suggest usage expansion when near limit', async () => {
    subscriptionsService.findByCompany.mockResolvedValue({
      id: 'sub-1',
      plan: PlanTier.LITE,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    subscriptionsService.getEffectiveLimits.mockResolvedValue({
      max_projects: 5,
      max_users: 3,
      max_storage_mb: 1024,
      max_ai_requests_month: 50,
      max_bim_models: 0,
    });

    subscriptionsService.checkUsageStatus.mockImplementation(
      async (_companyId, metric) => {
        if (metric === 'projects') {
          return {
            feature: 'projects',
            used: 5,
            limit: 5,
            percentage: 100,
            status: 'blocked' as const,
          };
        }
        return {
          feature: metric,
          used: 0,
          limit: 100,
          percentage: 0,
          status: 'ok' as const,
        };
      },
    );

    const result = await service.getUpsellSuggestions(mockCompanyId);
    const projectSuggestion = result.find(
      (s) => s.addon_code === 'extra_project',
    );
    expect(projectSuggestion).toBeDefined();
    expect(projectSuggestion!.priority).toBe('high');
  });

  it('should suggest plan upgrade for Lite users hitting multiple limits', async () => {
    subscriptionsService.findByCompany.mockResolvedValue({
      id: 'sub-1',
      plan: PlanTier.LITE,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    subscriptionsService.getEffectiveLimits.mockResolvedValue({
      max_projects: 5,
      max_users: 3,
      max_storage_mb: 1024,
      max_ai_requests_month: 50,
      max_bim_models: 0,
    });

    subscriptionsService.checkUsageStatus.mockImplementation(
      async (_companyId, metric) => {
        if (metric === 'projects' || metric === 'users') {
          return {
            feature: metric,
            used: 5,
            limit: 5,
            percentage: 100,
            status: 'blocked' as const,
          };
        }
        return {
          feature: metric,
          used: 0,
          limit: 100,
          percentage: 0,
          status: 'ok' as const,
        };
      },
    );

    const result = await service.getUpsellSuggestions(mockCompanyId);
    const planUpgrade = result.find((s) => s.type === 'upgrade_plan');
    expect(planUpgrade).toBeDefined();
    expect(planUpgrade!.target).toBe(PlanTier.PRO);
    expect(planUpgrade!.priority).toBe('high');
  });

  it('should suggest BIM addon for Pro users without BIM', async () => {
    subscriptionsService.findByCompany.mockResolvedValue({
      id: 'sub-1',
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    subscriptionsService.getEffectiveLimits.mockResolvedValue({
      max_projects: 20,
      max_users: 15,
      max_storage_mb: 5120,
      max_ai_requests_month: 500,
      max_bim_models: 5,
    });

    subscriptionsService.checkUsageStatus.mockResolvedValue({
      feature: 'projects',
      used: 5,
      limit: 20,
      percentage: 25,
      status: 'ok' as const,
    });

    subscriptionsService.hasFeature
      .mockResolvedValueOnce(false) // bim_viewer
      .mockResolvedValueOnce(true); // ai_assistant

    const result = await service.getUpsellSuggestions(mockCompanyId);
    const bimAddon = result.find((s) => s.addon_code === 'bim_module');
    expect(bimAddon).toBeDefined();
    expect(bimAddon!.cta_text).toBe('Activar BIM');
  });

  it('should not suggest upgrades when usage is low', async () => {
    subscriptionsService.findByCompany.mockResolvedValue({
      id: 'sub-1',
      plan: PlanTier.ENTERPRISE,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    subscriptionsService.getEffectiveLimits.mockResolvedValue({
      max_projects: -1,
      max_users: -1,
      max_storage_mb: -1,
      max_ai_requests_month: -1,
      max_bim_models: -1,
    });

    subscriptionsService.checkUsageStatus.mockResolvedValue({
      feature: 'projects',
      used: 0,
      limit: -1,
      percentage: 0,
      status: 'unlimited' as const,
    });

    const result = await service.getUpsellSuggestions(mockCompanyId);
    expect(result).toEqual([]);
  });
});
