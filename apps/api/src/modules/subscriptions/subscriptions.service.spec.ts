import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import {
  Subscription,
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { UsageLimits } from './entities/usage-limits.entity';
import { PLAN_FEATURE_MAP, PLAN_LIMITS } from './plan.constants';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockSubscription: Partial<Subscription> = {
  id: 'sub-1',
  company_id: 'company-1',
  plan: PlanTier.PRO,
  billing_cycle: BillingCycle.MONTHLY,
  status: SubscriptionStatus.ACTIVE,
  start_date: new Date('2026-01-01'),
  end_date: new Date('2027-01-01'),
  trial_ends_at: undefined,
  auto_renew: true,
  monthly_price: 89990,
  total_price: 89990,
  currency: 'CLP',
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepo: jest.Mocked<Repository<Subscription>>;
  let planFeatureRepo: jest.Mocked<Repository<PlanFeature>>;
  let billingService: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        BillingService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlanFeature),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UsageLimits),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    planFeatureRepo = module.get(getRepositoryToken(PlanFeature));
    billingService = module.get<BillingService>(BillingService);
  });

  describe('findByCompany', () => {
    it('should return subscription if exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      const result = await service.findByCompany('company-1');
      expect(result).toEqual(mockSubscription);
    });

    it('should return null if not exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const result = await service.findByCompany('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create a trial subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      subscriptionRepo.create.mockReturnValue(mockSubscription as Subscription);
      subscriptionRepo.save.mockResolvedValue(mockSubscription as Subscription);

      const result = await service.createSubscription(
        'company-1',
        PlanTier.PRO,
        BillingCycle.MONTHLY,
      );

      expect(subscriptionRepo.create).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should throw if company already has subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );

      await expect(
        service.createSubscription(
          'company-1',
          PlanTier.PRO,
          BillingCycle.MONTHLY,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hasFeature', () => {
    it('should return true for backward compat (no subscription)', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const result = await service.hasFeature('company-1', 'bim_viewer');
      expect(result).toBe(true);
    });

    it('should return false for suspended subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.SUSPENDED,
      } as Subscription);

      const result = await service.hasFeature('company-1', 'projects');
      expect(result).toBe(false);
    });

    it('should check plan_features table first', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      planFeatureRepo.findOne.mockResolvedValue({
        id: '1',
        plan: PlanTier.PRO,
        feature_code: 'apu',
        enabled: true,
      });

      const result = await service.hasFeature('company-1', 'apu');
      expect(result).toBe(true);
      expect(planFeatureRepo.findOne).toHaveBeenCalled();
    });

    it('should fallback to in-memory map if not in DB', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      planFeatureRepo.findOne.mockResolvedValue(null);

      const result = await service.hasFeature('company-1', 'apu');
      expect(result).toBe(true); // PRO has APU
    });

    it('should return false for enterprise features on PRO plan', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      planFeatureRepo.findOne.mockResolvedValue(null);

      const result = await service.hasFeature('company-1', 'bim_viewer');
      expect(result).toBe(false);
    });
  });

  describe('getCompanyFeatures', () => {
    it('should return enterprise features for backward compat', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const features = await service.getCompanyFeatures('company-1');
      expect(features).toEqual(PLAN_FEATURE_MAP[PlanTier.ENTERPRISE]);
    });

    it('should return PRO features for PRO plan', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      const features = await service.getCompanyFeatures('company-1');
      expect(features).toEqual(PLAN_FEATURE_MAP[PlanTier.PRO]);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return legacy status when no subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const status = await service.getSubscriptionStatus('company-1');
      expect(status.has_subscription).toBe(false);
      expect(status.status).toBe('legacy');
      expect(status.plan).toBe(PlanTier.ENTERPRISE);
    });

    it('should return full status for active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      const status = await service.getSubscriptionStatus('company-1');
      expect(status.has_subscription).toBe(true);
      expect(status.plan).toBe(PlanTier.PRO);
    });
  });

  describe('changePlan', () => {
    it('should update plan and pricing', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      subscriptionRepo.save.mockImplementation(async (s) => s as Subscription);

      const result = await service.changePlan(
        'company-1',
        PlanTier.ENTERPRISE,
        BillingCycle.ANNUAL,
      );

      expect(result.plan).toBe(PlanTier.ENTERPRISE);
    });

    it('should throw if no subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.changePlan(
          'company-1',
          PlanTier.ENTERPRISE,
          BillingCycle.ANNUAL,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should mark subscription as cancelled', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        mockSubscription as Subscription,
      );
      subscriptionRepo.save.mockImplementation(async (s) => s as Subscription);

      const result = await service.cancelSubscription(
        'company-1',
        'Too expensive',
      );
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.auto_renew).toBe(false);
    });
  });
});
