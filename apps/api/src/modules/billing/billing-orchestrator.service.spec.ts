import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingOrchestratorService } from './billing-orchestrator.service';
import {
  Payment,
  PaymentStatus,
} from '../subscriptions/entities/payment.entity';
import {
  Subscription,
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import {
  CompanyAddon,
  CompanyAddonStatus,
  AddonBillingCycle,
} from '../subscriptions/entities/company-addon.entity';
import { Addon, AddonType } from '../subscriptions/entities/addon.entity';
import { MercadoPagoService } from '../subscriptions/mercadopago.service';
import { BillingService } from '../subscriptions/billing.service';

describe('BillingOrchestratorService', () => {
  let service: BillingOrchestratorService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;
  let subscriptionRepo: jest.Mocked<Repository<Subscription>>;
  let companyAddonRepo: jest.Mocked<Repository<CompanyAddon>>;
  let addonRepo: jest.Mocked<Repository<Addon>>;
  let mercadoPagoService: jest.Mocked<MercadoPagoService>;
  let pricingEngine: jest.Mocked<BillingService>;

  const mockCompanyId = 'company-uuid-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingOrchestratorService,
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            create: jest.fn((data) => ({ id: 'pay-uuid-1', ...data })),
            save: jest.fn((entity) => Promise.resolve(entity)),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            create: jest.fn((data) => ({ id: 'sub-uuid-1', ...data })),
            save: jest.fn((entity) => Promise.resolve(entity)),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompanyAddon),
          useValue: {
            create: jest.fn((data) => ({ id: 'ca-uuid-1', ...data })),
            save: jest.fn((entity) => Promise.resolve(entity)),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Addon),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MercadoPagoService,
          useValue: {
            createSubscriptionPreference: jest
              .fn()
              .mockResolvedValue('https://mp.checkout.url'),
            createAddonPreference: jest
              .fn()
              .mockResolvedValue('https://mp.addon.url'),
            getPayment: jest.fn(),
          },
        },
        {
          provide: BillingService,
          useValue: {
            calculatePrice: jest.fn().mockReturnValue({
              plan: PlanTier.PRO,
              billing_cycle: BillingCycle.MONTHLY,
              monthly_price: 49990,
              total_price: 49990,
              final_monthly_price: 49990,
              final_total_price: 49990,
              base_monthly_clp: 49990,
              discount_percentage: 0,
              addons_total_monthly: 0,
              usage_fees_total: 0,
              cycle_months: 1,
              savings_clp: 0,
              currency: 'CLP',
            }),
          },
        },
      ],
    }).compile();

    service = module.get(BillingOrchestratorService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    companyAddonRepo = module.get(getRepositoryToken(CompanyAddon));
    addonRepo = module.get(getRepositoryToken(Addon));
    mercadoPagoService = module.get(MercadoPagoService);
    pricingEngine = module.get(BillingService);
  });

  describe('createSubscriptionPayment', () => {
    it('should create a MercadoPago preference and pending payment record', async () => {
      const result = await service.createSubscriptionPayment(
        mockCompanyId,
        PlanTier.PRO,
        BillingCycle.MONTHLY,
      );

      expect(
        mercadoPagoService.createSubscriptionPreference,
      ).toHaveBeenCalledWith(
        mockCompanyId,
        PlanTier.PRO,
        BillingCycle.MONTHLY,
        49990,
      );
      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: mockCompanyId,
          status: PaymentStatus.PENDING,
          plan: PlanTier.PRO,
        }),
      );
      expect(result.init_point).toBe('https://mp.checkout.url');
      expect(result.payment_id).toBeDefined();
    });
  });

  describe('createAddonPayment', () => {
    it('should create addon payment preference', async () => {
      addonRepo.findOne.mockResolvedValue({
        id: 'addon-1',
        code: 'ai_pack',
        name: 'AI Pack',
        description: 'AI assistant',
        type: AddonType.FEATURE,
        price_monthly: 19990,
        price_one_time: null as any,
        required_plan: 'lite',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createAddonPayment(mockCompanyId, 'ai_pack');

      expect(mercadoPagoService.createAddonPreference).toHaveBeenCalledWith(
        mockCompanyId,
        'ai_pack',
        19990,
        1,
      );
      expect(result.init_point).toBe('https://mp.addon.url');
    });

    it('should throw if addon not found', async () => {
      addonRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createAddonPayment(mockCompanyId, 'fake_addon'),
      ).rejects.toThrow('not found or inactive');
    });
  });

  describe('handleWebhook', () => {
    it('should ignore non-payment events', async () => {
      const result = await service.handleWebhook({ type: 'merchant_order' });
      expect(result.processed).toBe(false);
    });

    it('should ignore events without payment ID', async () => {
      const result = await service.handleWebhook({ type: 'payment', data: {} });
      expect(result.processed).toBe(false);
    });

    it('should skip already-processed payments (idempotency)', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 'pay-1',
        mercadopago_payment_id: '12345',
        status: PaymentStatus.APPROVED,
      } as Payment);

      const result = await service.handleWebhook({
        type: 'payment',
        data: { id: '12345' },
      });

      expect(result.processed).toBe(false);
      expect(mercadoPagoService.getPayment).not.toHaveBeenCalled();
    });

    it('should ignore non-approved payments', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      mercadoPagoService.getPayment.mockResolvedValue({
        status: 'pending',
        metadata: {},
      } as any);

      const result = await service.handleWebhook({
        type: 'payment',
        data: { id: '99999' },
      });

      expect(result.processed).toBe(false);
    });

    it('should activate subscription on approved payment', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      subscriptionRepo.findOne.mockResolvedValue(null);
      mercadoPagoService.getPayment.mockResolvedValue({
        status: 'approved',
        transaction_amount: 49990,
        metadata: {
          company_id: mockCompanyId,
          type: 'subscription',
          plan: 'pro',
          billing_cycle: 'monthly',
        },
      } as any);

      const result = await service.handleWebhook({
        type: 'payment',
        data: { id: '55555' },
      });

      expect(result.processed).toBe(true);
      expect(subscriptionRepo.create).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should activate addon on approved payment', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      companyAddonRepo.findOne.mockResolvedValue(null);
      addonRepo.findOne.mockResolvedValue({
        code: 'ai_pack',
        price_monthly: 19990,
      } as Addon);
      mercadoPagoService.getPayment.mockResolvedValue({
        status: 'approved',
        transaction_amount: 19990,
        metadata: {
          company_id: mockCompanyId,
          type: 'addon',
          addon_code: 'ai_pack',
          quantity: 1,
        },
      } as any);

      const result = await service.handleWebhook({
        type: 'payment',
        data: { id: '66666' },
      });

      expect(result.processed).toBe(true);
      expect(companyAddonRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: mockCompanyId,
          addon_code: 'ai_pack',
          status: CompanyAddonStatus.ACTIVE,
        }),
      );
    });

    it('should extend existing addon quantity on duplicate purchase', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      const existingAddon = {
        id: 'ca-1',
        company_id: mockCompanyId,
        addon_code: 'extra_user',
        quantity: 3,
        status: CompanyAddonStatus.ACTIVE,
      } as CompanyAddon;
      companyAddonRepo.findOne.mockResolvedValue(existingAddon);
      addonRepo.findOne.mockResolvedValue({
        code: 'extra_user',
        price_monthly: 4990,
      } as Addon);
      mercadoPagoService.getPayment.mockResolvedValue({
        status: 'approved',
        transaction_amount: 9980,
        metadata: {
          company_id: mockCompanyId,
          type: 'addon',
          addon_code: 'extra_user',
          quantity: 2,
        },
      } as any);

      await service.handleWebhook({
        type: 'payment',
        data: { id: '77777' },
      });

      expect(existingAddon.quantity).toBe(5);
      expect(companyAddonRepo.save).toHaveBeenCalledWith(existingAddon);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payments for a company', async () => {
      paymentRepo.find.mockResolvedValue([
        { id: 'pay-1', company_id: mockCompanyId } as Payment,
      ]);

      const result = await service.getPaymentHistory(mockCompanyId);
      expect(result).toHaveLength(1);
      expect(paymentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { company_id: mockCompanyId },
        }),
      );
    });
  });
});
