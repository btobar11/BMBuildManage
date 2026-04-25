import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingOrchestratorService } from './billing-orchestrator.service';
import { UpsellService } from './upsell.service';
import { PricingAIService } from './pricing-ai.service';
import {
  PlanTier,
  BillingCycle,
} from '../subscriptions/entities/subscription.entity';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

describe('BillingController', () => {
  let controller: BillingController;
  let orchestrator: jest.Mocked<BillingOrchestratorService>;
  let upsellService: jest.Mocked<UpsellService>;

  const mockUser: RequestUser = {
    id: 'user-1',
    email: 'test@bm.cl',
    company_id: 'company-1',
    role: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingOrchestratorService,
          useValue: {
            createSubscriptionPayment: jest.fn().mockResolvedValue({
              init_point: 'https://mp.url',
              payment_id: 'pay-1',
              pricing: { total_price: 49990 },
            }),
            createAddonPayment: jest.fn().mockResolvedValue({
              init_point: 'https://mp.addon.url',
              payment_id: 'pay-2',
              total_price: 19990,
            }),
            handleWebhook: jest.fn().mockResolvedValue({ processed: true }),
            getPaymentHistory: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: UpsellService,
          useValue: {
            getUpsellSuggestions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PricingAIService,
          useValue: {
            generateRecommendation: jest.fn().mockResolvedValue({
              suggested_price: 49990,
              reason: 'AI recommended',
            }),
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(BillingController);
    orchestrator = module.get(BillingOrchestratorService);
    upsellService = module.get(UpsellService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSubscriptionPayment', () => {
    it('should return init_point and payment_id', async () => {
      const result = await controller.createSubscriptionPayment(mockUser, {
        plan: PlanTier.PRO,
        billing_cycle: BillingCycle.MONTHLY,
      });
      expect(result.init_point).toBe('https://mp.url');
      expect(result.payment_id).toBe('pay-1');
      expect(orchestrator.createSubscriptionPayment).toHaveBeenCalledWith(
        'company-1',
        PlanTier.PRO,
        BillingCycle.MONTHLY,
      );
    });
  });

  describe('createAddonPayment', () => {
    it('should return init_point for addon purchase', async () => {
      const result = await controller.createAddonPayment(mockUser, {
        addon_code: 'ai_pack',
        quantity: 1,
      });
      expect(result.init_point).toBe('https://mp.addon.url');
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook and return 200', async () => {
      const res = { status: jest.fn().mockReturnThis() } as any;
      const result = await controller.handleWebhook(
        { type: 'payment', data: { id: '123' } },
        res,
      );
      expect(result.processed).toBe(true);
    });

    it('should return processed false on error without throwing', async () => {
      orchestrator.handleWebhook.mockRejectedValue(new Error('DB error'));
      const res = { status: jest.fn().mockReturnThis() } as any;
      const result = await controller.handleWebhook(
        { type: 'payment', data: { id: '123' } },
        res,
      );
      expect(result).toEqual({ processed: false, error: 'internal_error' });
    });
  });

  describe('getPaymentHistory', () => {
    it('should return company payments', async () => {
      const result = await controller.getPaymentHistory(mockUser);
      expect(result).toEqual([]);
      expect(orchestrator.getPaymentHistory).toHaveBeenCalledWith('company-1');
    });
  });

  describe('getUpsellSuggestions', () => {
    it('should return upsell suggestions', async () => {
      upsellService.getUpsellSuggestions.mockResolvedValue([
        {
          type: 'upgrade_plan',
          target: 'pro',
          reason: 'Estás al límite',
          priority: 'high',
          cta_text: 'Mejorar a Pro',
        },
      ]);

      const result = await controller.getUpsellSuggestions(mockUser);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('upgrade_plan');
    });
  });
});
