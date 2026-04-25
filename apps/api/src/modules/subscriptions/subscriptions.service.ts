import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import {
  CompanyAddon,
  CompanyAddonStatus,
} from './entities/company-addon.entity';
import {
  PLAN_FEATURE_MAP,
  PLAN_LIMITS,
  TRIAL_DURATION_DAYS,
  FeatureCode,
} from './plan.constants';
import { BillingService } from './billing.service';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentStatus, Payment as PaymentEntity } from './entities/payment.entity';

/**
 * Addon-to-feature mapping.
 * Defines which features each addon unlocks.
 */
const ADDON_FEATURE_MAP: Record<string, FeatureCode[]> = {
  bim_module: [
    'bim_viewer',
    'bim_4d',
    'bim_5d',
    'bim_clashes',
    'bim_apu_link',
  ] as FeatureCode[],
  ai_pack: ['ai_assistant'] as FeatureCode[],
  advanced_analytics: ['analytics_advanced'] as FeatureCode[],
  api_access: ['api_access'] as FeatureCode[],
};

/**
 * Addon-to-limit expansion mapping.
 * Defines how many units each addon adds to limits.
 */
const ADDON_LIMIT_EXPANSION: Record<string, Partial<Record<string, number>>> = {
  extra_user: { max_users: 1 },
  extra_project: { max_projects: 5 },
  extra_storage: { max_storage_mb: 5120 },
  extra_ai: { max_ai_requests_month: 500 },
  extra_bim_models: { max_bim_models: 10 },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(PlanFeature)
    private readonly planFeatureRepo: Repository<PlanFeature>,
    @InjectRepository(UsageLimits)
    private readonly usageLimitsRepo: Repository<UsageLimits>,
    @InjectRepository(SubscriptionAddon)
    private readonly subscriptionAddonRepo: Repository<SubscriptionAddon>,
    @InjectRepository(AddonFeature)
    private readonly addonFeatureRepo: Repository<AddonFeature>,
    @InjectRepository(UsageTracking)
    private readonly usageTrackingRepo: Repository<UsageTracking>,
    @InjectRepository(UpgradeAttempt)
    private readonly upgradeAttemptRepo: Repository<UpgradeAttempt>,
    @InjectRepository(CompanyAddon)
    private readonly companyAddonRepo: Repository<CompanyAddon>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(Addon)
    private readonly addonRepo: Repository<Addon>,
    private readonly billingService: BillingService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  private readonly logger = new Logger(SubscriptionsService.name);

  /**
   * Get active subscription for a company.
   * Returns null if no subscription exists (graceful for backward compatibility).
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async findByCompany(companyId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { company_id: companyId },
    });
  }

  /**
   * Get active subscription or throw.
   */
  async getActiveSubscription(companyId: string): Promise<Subscription> {
    const sub = await this.findByCompany(companyId);
    if (!sub) {
      throw new NotFoundException(
        `No subscription found for company ${companyId}`,
      );
    }
    return sub;
  }

  /**
   * Create initial subscription (called during onboarding).
   * Starts with a trial period.
   */
  async createSubscription(
    companyId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
  ): Promise<Subscription> {
    const existing = await this.findByCompany(companyId);
    if (existing) {
      throw new ForbiddenException('Company already has a subscription');
    }

    const pricing = this.billingService.calculatePrice(plan, billingCycle);
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

    const subscription = this.subscriptionRepo.create({
      company_id: companyId,
      plan,
      billing_cycle: billingCycle,
      status: SubscriptionStatus.TRIAL,
      start_date: now,
      end_date: trialEnd,
      trial_ends_at: trialEnd,
      auto_renew: true,
      monthly_price: pricing.final_monthly_price,
      total_price: pricing.final_total_price,
      currency: 'CLP',
    });

    return this.subscriptionRepo.save(subscription);
  }

  /**
   * Upgrade/downgrade subscription plan.
   */
  async changePlan(
    companyId: string,
    newPlan: PlanTier,
    newCycle: BillingCycle,
  ): Promise<Subscription> {
    const sub = await this.getActiveSubscription(companyId);
    const addons = await this.subscriptionAddonRepo.find({
      where: { subscription_id: sub.id },
    });
    const pricing = this.billingService.calculatePrice(
      newPlan,
      newCycle,
      addons,
    );

    sub.plan = newPlan;
    sub.billing_cycle = newCycle;
    sub.monthly_price = pricing.final_monthly_price;
    sub.total_price = pricing.final_total_price;

    return this.subscriptionRepo.save(sub);
  }

  /**
   * Activate subscription after trial/payment.
   */
  async activateSubscription(
    companyId: string,
    plan?: PlanTier,
    billingCycle?: BillingCycle,
  ): Promise<Subscription> {
    const sub = await this.getActiveSubscription(companyId);

    if (plan) sub.plan = plan;
    if (billingCycle) sub.billing_cycle = billingCycle;

    const addons = await this.subscriptionAddonRepo.find({
      where: { subscription_id: sub.id },
    });
    const pricing = this.billingService.calculatePrice(
      sub.plan,
      sub.billing_cycle,
      addons,
    );

    const now = new Date();
    sub.status = SubscriptionStatus.ACTIVE;
    sub.start_date = now;
    sub.end_date = this.billingService.calculateEndDate(now, sub.billing_cycle);
    sub.monthly_price = pricing.final_monthly_price;
    sub.total_price = pricing.final_total_price;

    return this.subscriptionRepo.save(sub);
  }

  /**
   * Cancel subscription.
   */
  async cancelSubscription(
    companyId: string,
    reason?: string,
  ): Promise<Subscription> {
    const sub = await this.getActiveSubscription(companyId);
    sub.status = SubscriptionStatus.CANCELLED;
    sub.auto_renew = false;
    sub.cancellation_reason = reason ?? '';
    sub.cancelled_at = new Date();
    return this.subscriptionRepo.save(sub);
  }

  // ─────────────────────────────────────────────────────
  // HYBRID FEATURE GATING: Plan + Addons
  // ─────────────────────────────────────────────────────

  /**
   * Check if a feature is available for a company.
   * Checks BOTH the plan AND active company_addons.
   *
   * BACKWARD COMPAT: If no subscription exists, grant ENTERPRISE access.
   */
  async hasFeature(
    companyId: string,
    featureCode: FeatureCode,
  ): Promise<boolean> {
    const sub = await this.findByCompany(companyId);

    // Backward compatibility: no subscription → full access
    if (!sub) {
      return true;
    }

    // Suspended/cancelled → block gated features
    if (
      sub.status === SubscriptionStatus.SUSPENDED ||
      sub.status === SubscriptionStatus.CANCELLED
    ) {
      return false;
    }

    // Check expiration (except for trials which have their own date)
    if (
      new Date() > new Date(sub.end_date) &&
      sub.status !== SubscriptionStatus.TRIAL
    ) {
      return false;
    }

    // 1) Check plan features (in-memory map)
    const planFeatures = PLAN_FEATURE_MAP[sub.plan] || [];
    if (planFeatures.includes(featureCode)) {
      return true;
    }

    // 2) Check plan_features table (DB override)
    const planFeature = await this.planFeatureRepo.findOne({
      where: { plan: sub.plan, feature_code: featureCode },
    });
    if (planFeature?.enabled) {
      return true;
    }

    // 3) Check legacy subscription_addons table
    const legacyAddon = await this.addonFeatureRepo
      .createQueryBuilder('af')
      .innerJoin(SubscriptionAddon, 'sa', 'sa.addon_code = af.addon_code')
      .where('sa.subscription_id = :subId', { subId: sub.id })
      .andWhere('af.feature_code = :featureCode', { featureCode })
      .getOne();
    if (legacyAddon) {
      return true;
    }

    // 4) Check company_addons (NEW: hybrid plan + addons)
    const activeAddons = await this.companyAddonRepo.find({
      where: { company_id: companyId, status: CompanyAddonStatus.ACTIVE },
    });

    for (const addon of activeAddons) {
      const addonFeatures = ADDON_FEATURE_MAP[addon.addon_code] || [];
      if (addonFeatures.includes(featureCode)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get ALL effective features for a company (plan + addons merged).
   */
  async getEffectiveFeatures(companyId: string): Promise<FeatureCode[]> {
    const sub = await this.findByCompany(companyId);

    // No subscription → full access (backward compat)
    if (!sub) {
      return PLAN_FEATURE_MAP[PlanTier.ENTERPRISE];
    }

    // Start with plan features
    const planFeatures = new Set<FeatureCode>(PLAN_FEATURE_MAP[sub.plan] || []);

    // Add legacy subscription addon features
    const legacyAddonFeatures = await this.addonFeatureRepo
      .createQueryBuilder('af')
      .innerJoin(SubscriptionAddon, 'sa', 'sa.addon_code = af.addon_code')
      .where('sa.subscription_id = :subId', { subId: sub.id })
      .getMany();

    for (const af of legacyAddonFeatures) {
      planFeatures.add(af.feature_code as FeatureCode);
    }

    // Add company_addons features
    const activeAddons = await this.companyAddonRepo.find({
      where: { company_id: companyId, status: CompanyAddonStatus.ACTIVE },
    });

    for (const addon of activeAddons) {
      const addonFeatures = ADDON_FEATURE_MAP[addon.addon_code] || [];
      for (const f of addonFeatures) {
        planFeatures.add(f);
      }
    }

    return Array.from(planFeatures);
  }

  /**
   * Get effective limits for a company (base plan limits + addon expansions).
   */
  async getEffectiveLimits(
    companyId: string,
  ): Promise<(typeof PLAN_LIMITS)[PlanTier]> {
    const sub = await this.findByCompany(companyId);

    // No subscription → unlimited (backward compat)
    if (!sub) {
      return PLAN_LIMITS[PlanTier.ENTERPRISE];
    }

    const baseLimits = { ...PLAN_LIMITS[sub.plan] };

    // Sum addon expansions from company_addons
    const activeAddons = await this.companyAddonRepo.find({
      where: { company_id: companyId, status: CompanyAddonStatus.ACTIVE },
    });

    for (const addon of activeAddons) {
      const expansion = ADDON_LIMIT_EXPANSION[addon.addon_code];
      if (expansion) {
        for (const [key, value] of Object.entries(expansion)) {
          if (key in baseLimits && (baseLimits as any)[key] !== -1) {
            (baseLimits as any)[key] += (value as number) * addon.quantity;
          }
        }
      }
    }

    return baseLimits;
  }

  /**
   * Get all features available for the company's current plan.
   * @deprecated Use getEffectiveFeatures instead
   */
  async getCompanyFeatures(companyId: string): Promise<FeatureCode[]> {
    return this.getEffectiveFeatures(companyId);
  }

  /**
   * Get usage limits for a company's plan.
   * @deprecated Use getEffectiveLimits instead
   */
  async getCompanyLimits(
    companyId: string,
  ): Promise<(typeof PLAN_LIMITS)[PlanTier]> {
    return this.getEffectiveLimits(companyId);
  }

  /**
   * Get full subscription status for the API response
   * (plan, features, limits, pricing, addons).
   */
  async getSubscriptionStatus(companyId: string) {
    const sub = await this.findByCompany(companyId);

    if (!sub) {
      return {
        has_subscription: false,
        plan: PlanTier.ENTERPRISE,
        status: 'legacy' as const,
        features: PLAN_FEATURE_MAP[PlanTier.ENTERPRISE],
        limits: PLAN_LIMITS[PlanTier.ENTERPRISE],
        billing: null,
      };
    }

    const activeAddons = await this.companyAddonRepo.find({
      where: { company_id: companyId, status: CompanyAddonStatus.ACTIVE },
    });

    return {
      has_subscription: true,
      plan: sub.plan,
      status: sub.status,
      billing_cycle: sub.billing_cycle,
      start_date: sub.start_date,
      end_date: sub.end_date,
      trial_ends_at: sub.trial_ends_at,
      auto_renew: sub.auto_renew,
      monthly_price: sub.monthly_price,
      total_price: sub.total_price,
      currency: sub.currency,
      next_billing_date: sub.next_billing_date,
      features: await this.getEffectiveFeatures(companyId),
      limits: await this.getEffectiveLimits(companyId),
      addons: activeAddons,
    };
  }

  // ─────────────────────────────────────────────────────
  // USAGE TRACKING
  // ─────────────────────────────────────────────────────

  /**
   * Track usage for a specific metric.
   */
  async trackUsage(
    companyId: string,
    metricCode: string,
    increment: number = 1,
  ): Promise<UsageTracking> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await this.usageTrackingRepo.findOne({
      where: {
        company_id: companyId,
        metric_code: metricCode,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    if (usage) {
      usage.usage_value += increment;
    } else {
      usage = this.usageTrackingRepo.create({
        company_id: companyId,
        metric_code: metricCode,
        usage_value: increment,
        period_start: periodStart,
        period_end: periodEnd,
      });
    }

    return this.usageTrackingRepo.save(usage);
  }

  /**
   * Get current usage for a specific metric.
   */
  async getUsage(companyId: string, metricCode: string): Promise<number> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await this.usageTrackingRepo.findOne({
      where: {
        company_id: companyId,
        metric_code: metricCode,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    return usage ? usage.usage_value : 0;
  }

  /**
   * Check usage against effective limits.
   * Returns status with threshold information.
   */
  async checkUsageStatus(companyId: string, metricCode: string) {
    const used = await this.getUsage(companyId, metricCode);
    const limits = await this.getEffectiveLimits(companyId);

    const limitMap: Record<string, number> = {
      projects: limits.max_projects,
      users: limits.max_users,
      storage_mb: limits.max_storage_mb,
      ai_requests: limits.max_ai_requests_month,
      bim_models: limits.max_bim_models,
    };

    const limit = limitMap[metricCode] ?? -1;

    // -1 means unlimited
    if (limit === -1) {
      return {
        feature: metricCode,
        used,
        limit: -1,
        percentage: 0,
        status: 'unlimited' as const,
      };
    }

    const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
    let status: 'ok' | 'warning' | 'danger' | 'blocked';

    if (percentage >= 100) {
      status = 'blocked';
    } else if (percentage >= 90) {
      status = 'danger';
    } else if (percentage >= 70) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return {
      feature: metricCode,
      used,
      limit,
      percentage,
      status,
    };
  }

  /**
   * Record upgrade attempt (upsell modal shown and interacted).
   */
  async recordUpgradeAttempt(
    companyId: string,
    userId: string,
    featureCode: string,
  ): Promise<UpgradeAttempt> {
    const attempt = this.upgradeAttemptRepo.create({
      company_id: companyId,
      user_id: userId,
      feature_code: featureCode,
    });
    return this.upgradeAttemptRepo.save(attempt);
  }

  /**
   * Add an Addon to Subscription (legacy method).
   */
  async addAddon(
    companyId: string,
    addonCode: string,
    price: number,
  ): Promise<SubscriptionAddon> {
    const sub = await this.getActiveSubscription(companyId);

    const existing = await this.subscriptionAddonRepo.findOne({
      where: { subscription_id: sub.id, addon_code: addonCode },
    });

    if (existing) {
      throw new ForbiddenException(`Company already has addon ${addonCode}`);
    }

    const addon = this.subscriptionAddonRepo.create({
      subscription_id: sub.id,
      addon_code: addonCode,
      price,
    });

    return this.subscriptionAddonRepo.save(addon);
  }

  // ─────────────────────────────────────────────────────
  // MERCADO PAGO INTEGRATION
  // ─────────────────────────────────────────────────────

  /**
   * Create a checkout preference for a plan upgrade/purchase.
   */
  async createCheckoutSession(
    companyId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
  ): Promise<{ checkout_url: string }> {
    const pricing = this.billingService.calculatePrice(plan, billingCycle);
    
    // Create a pending payment record
    const payment = this.paymentRepo.create({
      company_id: companyId,
      amount: pricing.final_total_price,
      status: PaymentStatus.PENDING,
      plan: plan,
    });
    await this.paymentRepo.save(payment);

    const checkoutUrl = await this.mercadoPagoService.createSubscriptionPreference(
      companyId,
      plan,
      billingCycle,
      pricing.final_total_price,
    );

    return { checkout_url: checkoutUrl };
  }

  /**
   * Create a checkout preference for an addon purchase.
   */
  async createAddonCheckoutSession(
    companyId: string,
    addonCode: string,
    quantity: number = 1,
  ): Promise<{ checkout_url: string }> {
    const addon = await this.addonRepo.findOne({ where: { code: addonCode } });
    if (!addon) {
      throw new NotFoundException(`Addon ${addonCode} not found`);
    }

    const price = addon.price_monthly || addon.price_one_time || 0;

    // Create a pending payment record
    const payment = this.paymentRepo.create({
      company_id: companyId,
      amount: price * quantity,
      status: PaymentStatus.PENDING,
      addon_code: addonCode,
    });
    await this.paymentRepo.save(payment);

    const checkoutUrl = await this.mercadoPagoService.createAddonPreference(
      companyId,
      addonCode,
      price,
      quantity,
    );

    return { checkout_url: checkoutUrl };
  }

  /**
   * Activate an addon for a company.
   */
  async activateAddon(companyId: string, addonCode: string): Promise<void> {
    const addon = await this.addonRepo.findOne({ where: { code: addonCode } });
    if (!addon) {
      throw new NotFoundException(`Addon ${addonCode} not found`);
    }

    const billingCycle = addon.price_one_time ? 'one_time' : 'monthly';

    // 1. Create or update company_addon record (new hybrid system)
    let companyAddon = await this.companyAddonRepo.findOne({
      where: { company_id: companyId, addon_code: addonCode },
    });

    if (companyAddon) {
      companyAddon.status = CompanyAddonStatus.ACTIVE;
      companyAddon.quantity += 1; // Increment if applicable
      companyAddon.updated_at = new Date();
    } else {
      companyAddon = this.companyAddonRepo.create({
        company_id: companyId,
        addon_code: addonCode,
        quantity: 1,
        billing_cycle: billingCycle as any,
        status: CompanyAddonStatus.ACTIVE,
      });
    }
    await this.companyAddonRepo.save(companyAddon);

    // 2. Also update legacy subscription_addons table for backward compat
    try {
      const sub = await this.findByCompany(companyId);
      if (sub) {
        const price = addon.price_monthly || addon.price_one_time || 0;
        await this.addAddon(companyId, addonCode, price);
      }
    } catch (error) {
      // Ignore if already exists or other legacy errors
      this.logger.warn(`Legacy addAddon failed for ${addonCode}: ${error.message}`);
    }
  }

  /**
   * Process Mercado Pago Webhook (IPN/Notifications).
   */
  async processWebhook(payload: any): Promise<void> {
    this.logger.log(`Received webhook: ${JSON.stringify(payload)}`);
    
    // Mercado Pago notifications can be 'payment' or 'plan' etc.
    // We mainly care about 'payment'.
    if (payload.type === 'payment' || payload.topic === 'payment' || payload.action?.startsWith('payment.')) {
      const paymentId = payload.data?.id || payload.id;
      if (!paymentId) {
        this.logger.warn('Webhook received without payment ID');
        return;
      }

      this.logger.log(`Processing payment ID: ${paymentId}`);

      const mpPaymentResponse = await this.mercadoPagoService.getPayment(Number(paymentId));
      
      // In SDK v2, the response might be the data directly or have a .body property
      const mpPayment = (mpPaymentResponse as any).body || mpPaymentResponse;
      const { status, metadata } = mpPayment;

      // Metadata contains company_id and type (subscription/addon)
      const companyId = metadata?.company_id;
      if (!companyId) {
        throw new Error(`[SEC] Missing company_id in payment metadata for MP ID: ${paymentId}`);
      }

      // Find or create our local payment record
      let localPayment = await this.paymentRepo.findOne({
        where: { mercadopago_payment_id: String(paymentId) },
      });

      if (!localPayment) {
        // If not found by MP ID, try to find a pending one for the company
        // (This happens if we didn't save the MP ID upfront)
        localPayment = await this.paymentRepo.findOne({
          where: { company_id: companyId, status: PaymentStatus.PENDING },
          order: { created_at: 'DESC' },
        });
        
        if (localPayment) {
          localPayment.mercadopago_payment_id = String(paymentId);
        }
      }

      if (status === 'approved') {
        this.logger.log(`Payment approved for company ${companyId}`);
        // 1. Update payment status
        if (localPayment) {
          localPayment.status = PaymentStatus.APPROVED;
          await this.paymentRepo.save(localPayment);
        }

        this.logger.log(`Activating ${metadata.type}: ${metadata.plan || metadata.addon_code}`);

        // 2. Activate subscription or addon
        if (metadata.type === 'subscription') {
          await this.activateSubscription(
            companyId,
            metadata.plan as any,
            metadata.billing_cycle as any,
          );
        } else if (metadata.type === 'addon') {
          await this.activateAddon(companyId, metadata.addon_code);
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        if (localPayment) {
          localPayment.status = status === 'rejected' ? PaymentStatus.REJECTED : PaymentStatus.CANCELLED;
          await this.paymentRepo.save(localPayment);
        }
      }
    }
  }
}
