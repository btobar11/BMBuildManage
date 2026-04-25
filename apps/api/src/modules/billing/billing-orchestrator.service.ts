import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { Addon } from '../subscriptions/entities/addon.entity';
import {
  MercadoPagoService,
  PaymentMetadata,
} from '../subscriptions/mercadopago.service';
import { BillingService as PricingEngine } from '../subscriptions/billing.service';
import { BILLING_CYCLE_MONTHS } from '../subscriptions/plan.constants';

@Injectable()
export class BillingOrchestratorService {
  private readonly logger = new Logger(BillingOrchestratorService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(CompanyAddon)
    private readonly companyAddonRepo: Repository<CompanyAddon>,
    @InjectRepository(Addon)
    private readonly addonRepo: Repository<Addon>,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly pricingEngine: PricingEngine,
  ) {}

  /**
   * Create a payment preference for a subscription plan.
   */
  async createSubscriptionPayment(
    companyId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
  ) {
    const pricing = this.pricingEngine.calculatePrice(plan, billingCycle);

    const initPoint =
      await this.mercadoPagoService.createSubscriptionPreference(
        companyId,
        plan,
        billingCycle,
        pricing.total_price,
      );

    // Create pending payment record
    const payment = this.paymentRepo.create({
      company_id: companyId,
      amount: pricing.total_price,
      status: PaymentStatus.PENDING,
      plan,
    });
    await this.paymentRepo.save(payment);

    return {
      init_point: initPoint,
      payment_id: payment.id,
      pricing,
    };
  }

  /**
   * Create a payment preference for an addon purchase.
   */
  async createAddonPayment(
    companyId: string,
    addonCode: string,
    quantity: number = 1,
  ) {
    const addon = await this.addonRepo.findOne({
      where: { code: addonCode, is_active: true },
    });
    if (!addon) {
      throw new BadRequestException(
        `Addon "${addonCode}" not found or inactive`,
      );
    }

    // Validate plan compatibility
    const sub = await this.subscriptionRepo.findOne({
      where: { company_id: companyId },
    });
    if (sub && addon.required_plan) {
      const planHierarchy: PlanTier[] = [
        PlanTier.LITE,
        PlanTier.PRO,
        PlanTier.ENTERPRISE,
      ];
      const currentIndex = planHierarchy.indexOf(sub.plan);
      const requiredIndex = planHierarchy.indexOf(
        addon.required_plan as PlanTier,
      );
      if (currentIndex < requiredIndex) {
        throw new BadRequestException(
          `Addon "${addonCode}" requires plan "${addon.required_plan}" or higher. Current plan: "${sub.plan}"`,
        );
      }
    }

    const price = addon.price_monthly
      ? addon.price_monthly * quantity
      : (addon.price_one_time || 0) * quantity;

    const initPoint = await this.mercadoPagoService.createAddonPreference(
      companyId,
      addonCode,
      addon.price_monthly || addon.price_one_time || 0,
      quantity,
    );

    const payment = this.paymentRepo.create({
      company_id: companyId,
      amount: price,
      status: PaymentStatus.PENDING,
      addon_code: addonCode,
    });
    await this.paymentRepo.save(payment);

    return {
      init_point: initPoint,
      payment_id: payment.id,
      addon,
      total_price: price,
    };
  }

  /**
   * Handle incoming MercadoPago webhook.
   * This is the CRITICAL path that activates subscriptions and addons.
   */
  async handleWebhook(
    body: Record<string, any>,
  ): Promise<{ processed: boolean }> {
    // Only process payment events
    if (body.type !== 'payment') {
      return { processed: false };
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      this.logger.warn('Webhook received without payment ID');
      return { processed: false };
    }

    // Idempotency check — don't process the same payment twice
    const existingPayment = await this.paymentRepo.findOne({
      where: { mercadopago_payment_id: String(paymentId) },
    });
    if (existingPayment && existingPayment.status === PaymentStatus.APPROVED) {
      this.logger.warn(`Payment ${paymentId} already processed, skipping`);
      return { processed: false };
    }

    // Fetch payment details from MercadoPago
    let mpPayment: any;
    try {
      mpPayment = await this.mercadoPagoService.getPayment(Number(paymentId));
    } catch (error) {
      this.logger.error(
        `Failed to fetch payment ${paymentId} from MercadoPago`,
        error,
      );
      return { processed: false };
    }

    if (!mpPayment || mpPayment.status !== 'approved') {
      this.logger.log(
        `Payment ${paymentId} status: ${mpPayment?.status} — ignoring`,
      );
      return { processed: false };
    }

    const metadata = mpPayment.metadata as PaymentMetadata;
    if (!metadata?.company_id) {
      this.logger.error(`Payment ${paymentId} has no company_id in metadata`);
      return { processed: false };
    }

    // Record payment
    const payment = this.paymentRepo.create({
      company_id: metadata.company_id,
      mercadopago_payment_id: String(paymentId),
      amount: mpPayment.transaction_amount || 0,
      status: PaymentStatus.APPROVED,
      plan: metadata.plan || undefined,
      addon_code: metadata.addon_code || undefined,
    } as Partial<Payment>);
    await this.paymentRepo.save(payment);

    // Route to appropriate handler
    try {
      if (metadata.type === 'subscription' && metadata.plan) {
        await this.activateSubscription(
          metadata.company_id,
          metadata.plan as PlanTier,
          (metadata.billing_cycle || 'monthly') as BillingCycle,
          payment.id,
        );
      } else if (metadata.type === 'addon' && metadata.addon_code) {
        await this.activateAddon(
          metadata.company_id,
          metadata.addon_code,
          metadata.quantity || 1,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing payment ${paymentId}`, error);
      throw error;
    }

    return { processed: true };
  }

  /**
   * Activate (or update) a subscription after confirmed payment.
   */
  private async activateSubscription(
    companyId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
    paymentId: string,
  ): Promise<void> {
    const now = new Date();
    const endDate = this.calculateEndDate(now, billingCycle);
    const pricing = this.pricingEngine.calculatePrice(plan, billingCycle);

    let sub = await this.subscriptionRepo.findOne({
      where: { company_id: companyId },
    });

    if (sub) {
      sub.plan = plan;
      sub.billing_cycle = billingCycle;
      sub.status = SubscriptionStatus.ACTIVE;
      sub.start_date = now;
      sub.end_date = endDate;
      sub.next_billing_date = endDate;
      sub.last_payment_id = paymentId;
      sub.monthly_price = pricing.monthly_price;
      sub.total_price = pricing.total_price;
    } else {
      sub = this.subscriptionRepo.create({
        company_id: companyId,
        plan,
        billing_cycle: billingCycle,
        status: SubscriptionStatus.ACTIVE,
        start_date: now,
        end_date: endDate,
        next_billing_date: endDate,
        last_payment_id: paymentId,
        monthly_price: pricing.monthly_price,
        total_price: pricing.total_price,
        auto_renew: true,
        currency: 'CLP',
      });
    }

    await this.subscriptionRepo.save(sub);
    this.logger.log(
      `Subscription activated for company ${companyId}: ${plan}/${billingCycle}`,
    );
  }

  /**
   * Activate an addon for a company after confirmed payment.
   */
  private async activateAddon(
    companyId: string,
    addonCode: string,
    quantity: number,
  ): Promise<void> {
    // Check if already exists and extend, or create new
    const existing = await this.companyAddonRepo.findOne({
      where: {
        company_id: companyId,
        addon_code: addonCode,
        status: CompanyAddonStatus.ACTIVE,
      },
    });

    const addon = await this.addonRepo.findOne({ where: { code: addonCode } });
    const billingCycle = addon?.price_one_time
      ? AddonBillingCycle.ONE_TIME
      : AddonBillingCycle.MONTHLY;

    if (existing) {
      existing.quantity += quantity;
      await this.companyAddonRepo.save(existing);
      this.logger.log(
        `Addon ${addonCode} extended for company ${companyId} (qty +${quantity})`,
      );
    } else {
      const companyAddon = this.companyAddonRepo.create({
        company_id: companyId,
        addon_code: addonCode,
        quantity,
        billing_cycle: billingCycle,
        status: CompanyAddonStatus.ACTIVE,
      });
      await this.companyAddonRepo.save(companyAddon);
      this.logger.log(`Addon ${addonCode} activated for company ${companyId}`);
    }
  }

  /**
   * Calculate subscription end date from start + billing cycle.
   */
  private calculateEndDate(startDate: Date, cycle: BillingCycle): Date {
    const months = BILLING_CYCLE_MONTHS[cycle] || 1;
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + months);
    return end;
  }

  /**
   * Get payment history for a company.
   */
  async getPaymentHistory(companyId: string) {
    return this.paymentRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }
}
