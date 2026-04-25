import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { MercadoPagoService } from './mercadopago.service';
import {
  Subscription,
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { UsageLimits } from './entities/usage-limits.entity';
import { SubscriptionAddon } from './entities/subscription-addon.entity';
import { AddonFeature } from './entities/addon-feature.entity';
import { UsageTracking } from './entities/usage-tracking.entity';
import { UpgradeAttempt } from './entities/upgrade-attempt.entity';
import { Addon } from './entities/addon.entity';
import { CompanyAddon } from './entities/company-addon.entity';
import { Payment } from './entities/payment.entity';
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
  let subscriptionRepo: any;
  let planFeatureRepo: any;
  let addonRepo: any;
  let companyAddonRepo: any;
  let subscriptionAddonRepo: any;
  let addonFeatureRepo: any;
  let billingService: BillingService;

  const mockMercadoPagoService = {
    createSubscriptionPreference: jest.fn().mockResolvedValue('https://mock.mp.url'),
    createAddonPreference: jest.fn().mockResolvedValue('https://mock.mp.url'),
    getPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        BillingService,
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlanFeature),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(UsageLimits),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(SubscriptionAddon),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AddonFeature),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
            }),
          },
        },
        {
          provide: getRepositoryToken(UsageTracking),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UpgradeAttempt),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompanyAddon),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Addon),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    planFeatureRepo = module.get(getRepositoryToken(PlanFeature));
    addonRepo = module.get(getRepositoryToken(Addon));
    companyAddonRepo = module.get(getRepositoryToken(CompanyAddon));
    subscriptionAddonRepo = module.get(getRepositoryToken(SubscriptionAddon));
    addonFeatureRepo = module.get(getRepositoryToken(AddonFeature));
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
      jest.spyOn(service, 'findByCompany').mockResolvedValue(mockSubscription as Subscription);
      planFeatureRepo.findOne.mockResolvedValue({
        id: '1',
        plan: PlanTier.PRO,
        feature_code: 'bim_clashes',
        enabled: true,
      });

      const result = await service.hasFeature('company-1', 'bim_clashes');
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
      companyAddonRepo.find.mockResolvedValue([]);
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
      subscriptionAddonRepo.find.mockResolvedValue([]);
      subscriptionRepo.save.mockImplementation(async (s: any) => s as Subscription);

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
      subscriptionRepo.save.mockImplementation(async (s: any) => s as Subscription);

      const result = await service.cancelSubscription(
        'company-1',
        'Too expensive',
      );
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.auto_renew).toBe(false);
    });
  });
});
