import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { PlanTier, BillingCycle } from './entities/subscription.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingService: BillingService,
  ) {}

  /**
   * GET /subscriptions/status
   * Get current subscription status, features, and limits.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('status')
  async getStatus(@CurrentUser() user: RequestUser) {
    return this.subscriptionsService.getSubscriptionStatus(user.company_id);
  }

  /**
   * GET /subscriptions/features
   * Get list of features available for current plan.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('features')
  async getFeatures(@CurrentUser() user: RequestUser) {
    const features = await this.subscriptionsService.getCompanyFeatures(
      user.company_id,
    );
    return { features };
  }

  /**
   * GET /subscriptions/limits
   * Get usage limits for current plan.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('limits')
  async getLimits(@CurrentUser() user: RequestUser) {
    const limits = await this.subscriptionsService.getCompanyLimits(
      user.company_id,
    );
    return { limits };
  }

  /**
   * GET /subscriptions/pricing
   * Get pricing for all plans (public-friendly, but auth required).
   */
  @Get('pricing')
  async getPricing() {
    return {
      plans: this.billingService.getAllPricing(),
    };
  }

  /**
   * GET /subscriptions/calculate
   * Calculate price for a specific plan + cycle.
   */
  @Get('calculate')
  async calculatePrice(
    @Query('plan') plan: PlanTier,
    @Query('cycle') cycle: BillingCycle,
  ) {
    return this.billingService.calculatePrice(plan, cycle);
  }

  /**
   * POST /subscriptions
   * Create initial subscription (onboarding).
   */
  @UseGuards(SupabaseAuthGuard)
  @Post()
  async createSubscription(
    @CurrentUser() user: RequestUser,
    @Body() body: { plan: PlanTier; billing_cycle: BillingCycle },
  ) {
    return this.subscriptionsService.createSubscription(
      user.company_id,
      body.plan,
      body.billing_cycle,
    );
  }

  /**
   * PATCH /subscriptions/upgrade
   * Change plan and/or billing cycle.
   */
  @UseGuards(SupabaseAuthGuard)
  @Patch('upgrade')
  async upgradePlan(
    @CurrentUser() user: RequestUser,
    @Body() body: { plan: PlanTier; billing_cycle: BillingCycle },
  ) {
    return this.subscriptionsService.changePlan(
      user.company_id,
      body.plan,
      body.billing_cycle,
    );
  }

  /**
   * PATCH /subscriptions/activate
   * Activate subscription after trial/payment.
   */
  @UseGuards(SupabaseAuthGuard)
  @Patch('activate')
  async activateSubscription(@CurrentUser() user: RequestUser) {
    return this.subscriptionsService.activateSubscription(user.company_id);
  }

  /**
   * PATCH /subscriptions/cancel
   * Cancel subscription.
   */
  @UseGuards(SupabaseAuthGuard)
  @Patch('cancel')
  async cancelSubscription(
    @CurrentUser() user: RequestUser,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionsService.cancelSubscription(
      user.company_id,
      body.reason,
    );
  }

  /**
   * GET /subscriptions/usage
   * Get current usage for specific metric.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('usage')
  async getUsage(
    @CurrentUser() user: RequestUser,
    @Query('metric') metricCode: string,
  ) {
    const usage = await this.subscriptionsService.getUsage(
      user.company_id,
      metricCode,
    );
    return { metric: metricCode, usage };
  }

  /**
   * POST /subscriptions/upgrade-attempts
   * Record that a user encountered an upsell modal.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('upgrade-attempts')
  async recordUpgradeAttempt(
    @CurrentUser() user: RequestUser,
    @Body() body: { feature_code: string },
  ) {
    return this.subscriptionsService.recordUpgradeAttempt(
      user.company_id,
      user.id,
      body.feature_code,
    );
  }

  /**
   * POST /subscriptions/addons
   * Add a new addon to the subscription.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('addons')
  async addAddon(
    @CurrentUser() user: RequestUser,
    @Body() body: { addon_code: string; price: number },
  ) {
    return this.subscriptionsService.addAddon(
      user.company_id,
      body.addon_code,
      body.price,
    );
  }

  /**
   * GET /subscriptions/usage-status
   * Get usage status with threshold alerts (ok/warning/danger/blocked).
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('usage-status')
  async getUsageStatus(
    @CurrentUser() user: RequestUser,
    @Query('metric') metricCode: string,
  ) {
    return this.subscriptionsService.checkUsageStatus(
      user.company_id,
      metricCode,
    );
  }

  /**
   * GET /subscriptions/effective-features
   * Get all features available (plan + addons merged).
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('effective-features')
  async getEffectiveFeatures(@CurrentUser() user: RequestUser) {
    const features = await this.subscriptionsService.getEffectiveFeatures(
      user.company_id,
    );
    return { features };
  }

  /**
   * GET /subscriptions/effective-limits
   * Get effective limits (base plan + addon expansions).
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('effective-limits')
  async getEffectiveLimits(@CurrentUser() user: RequestUser) {
    const limits = await this.subscriptionsService.getEffectiveLimits(
      user.company_id,
    );
    return { limits };
  }

  /**
   * POST /subscriptions/checkout
   * Generate Mercado Pago checkout URL for plan purchase.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('checkout')
  async createCheckout(
    @CurrentUser() user: RequestUser,
    @Body() body: { plan: PlanTier; billing_cycle: BillingCycle },
  ) {
    return this.subscriptionsService.createCheckoutSession(
      user.company_id,
      body.plan,
      body.billing_cycle,
    );
  }

  /**
   * POST /subscriptions/addons/checkout
   * Generate Mercado Pago checkout URL for addon purchase.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('addons/checkout')
  async createAddonCheckout(
    @CurrentUser() user: RequestUser,
    @Body() body: { addon_code: string; quantity?: number },
  ) {
    return this.subscriptionsService.createAddonCheckoutSession(
      user.company_id,
      body.addon_code,
      body.quantity || 1,
    );
  }

  /**
   * POST /subscriptions/webhook
   * Public endpoint to receive Mercado Pago payment notifications.
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.subscriptionsService.processWebhook(body);
  }
}
