import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { AiSalesService } from './ai-sales.service';
import { SalesTrackingService } from './sales-tracking.service';

@Controller('ai-sales')
@UseGuards(SupabaseAuthGuard)
export class AiSalesController {
  constructor(
    private readonly aiSalesService: AiSalesService,
    private readonly trackingService: SalesTrackingService,
  ) {}

  /**
   * GET /ai-sales/opportunity
   * Get the current best sales opportunity for the authenticated user.
   */
  @Get('opportunity')
  async getOpportunity(@CurrentUser() user: RequestUser) {
    const result = await this.aiSalesService.processSalesOpportunity(
      user.company_id,
      user.id,
    );
    return result || { message: null };
  }

  /**
   * POST /ai-sales/track-click
   * Record that a user clicked on a sales CTA.
   */
  @Post('track-click')
  async trackClick(@Body() body: { interaction_id: string }) {
    await this.trackingService.trackClick(body.interaction_id);
    return { tracked: true };
  }

  /**
   * POST /ai-sales/track-conversion
   * Record a successful conversion (payment completed).
   */
  @Post('track-conversion')
  async trackConversion(
    @Body() body: { interaction_id: string; value: number },
  ) {
    await this.trackingService.trackConversion(body.interaction_id, body.value);
    return { tracked: true };
  }

  /**
   * POST /ai-sales/dismiss
   * User dismissed the sales prompt.
   */
  @Post('dismiss')
  async dismiss(@Body() body: { interaction_id: string }) {
    await this.trackingService.trackDismissal(body.interaction_id);
    return { dismissed: true };
  }

  /**
   * GET /ai-sales/metrics
   * Get conversion metrics for the company (admin only).
   */
  @Get('metrics')
  async getMetrics(@CurrentUser() user: RequestUser) {
    return this.trackingService.getMetrics(user.company_id);
  }
}
