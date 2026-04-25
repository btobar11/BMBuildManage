import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { BillingOrchestratorService } from './billing-orchestrator.service';
import { UpsellService } from './upsell.service';
import { PricingAIService } from './pricing-ai.service';
import {
  PlanTier,
  BillingCycle,
} from '../subscriptions/entities/subscription.entity';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingOrchestrator: BillingOrchestratorService,
    private readonly upsellService: UpsellService,
    private readonly pricingAIService: PricingAIService,
  ) {}

  /**
   * POST /billing/create-subscription-payment
   * Creates a MercadoPago preference for a subscription and returns the checkout URL.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('create-subscription-payment')
  async createSubscriptionPayment(
    @CurrentUser() user: RequestUser,
    @Body() body: { plan: PlanTier; billing_cycle: BillingCycle },
  ) {
    return this.billingOrchestrator.createSubscriptionPayment(
      user.company_id,
      body.plan,
      body.billing_cycle,
    );
  }

  /**
   * POST /billing/create-addon-payment
   * Creates a MercadoPago preference for an addon purchase.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('create-addon-payment')
  async createAddonPayment(
    @CurrentUser() user: RequestUser,
    @Body() body: { addon_code: string; quantity?: number },
  ) {
    return this.billingOrchestrator.createAddonPayment(
      user.company_id,
      body.addon_code,
      body.quantity || 1,
    );
  }

  /**
   * POST /billing/webhook
   * MercadoPago webhook handler.
   * NO auth guard — MercadoPago calls this directly.
   * Security: validates payment via MercadoPago API, not by trusting the payload.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Webhook received: type=${body.type}, action=${body.action}`,
    );

    try {
      const result = await this.billingOrchestrator.handleWebhook(body);
      return result;
    } catch (error) {
      this.logger.error('Webhook processing error', error);
      // Always return 200 to MercadoPago to prevent retries on our processing errors
      return { processed: false, error: 'internal_error' };
    }
  }

  /**
   * GET /billing/payments
   * Get payment history for the authenticated company.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('payments')
  async getPaymentHistory(@CurrentUser() user: RequestUser) {
    return this.billingOrchestrator.getPaymentHistory(user.company_id);
  }

  /**
   * GET /billing/upsells
   * Get smart upsell suggestions based on usage patterns.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('upsells')
  async getUpsellSuggestions(@CurrentUser() user: RequestUser) {
    return this.upsellService.getUpsellSuggestions(user.company_id);
  }

  /**
   * GET /billing/dynamic-pricing
   * Get AI-driven pricing recommendations based on usage.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('dynamic-pricing')
  async getDynamicPricing(@CurrentUser() user: RequestUser) {
    return this.pricingAIService.generateRecommendation(user.company_id);
  }
}
