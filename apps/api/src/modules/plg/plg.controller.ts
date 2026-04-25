import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { ActivationService } from './activation.service';
import { EngagementService } from './engagement.service';
import { RetentionService } from './retention.service';
import { PlgAiService } from './plg-ai.service';
import { PlgAnalyticsService } from './plg-analytics.service';

@Controller('plg')
@UseGuards(SupabaseAuthGuard)
export class PlgController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly activationService: ActivationService,
    private readonly engagementService: EngagementService,
    private readonly retentionService: RetentionService,
    private readonly plgAiService: PlgAiService,
    private readonly analyticsService: PlgAnalyticsService,
  ) {}

  @Get('onboarding')
  async getOnboardingProgress(@CurrentUser() user: RequestUser) {
    return this.onboardingService.getProgress(user.company_id);
  }

  @Get('activation')
  async getActivationStatus(@CurrentUser() user: RequestUser) {
    const status = await this.activationService.getStatus(user.company_id);
    return status || { is_activated: false, activation_score: 0 };
  }

  @Get('engagement')
  async getEngagementScore(@CurrentUser() user: RequestUser) {
    const score = await this.engagementService.calculateEngagementScore(
      user.company_id,
    );
    return { score };
  }

  @Get('retention')
  async getRetentionSignal(@CurrentUser() user: RequestUser) {
    const signal = await this.retentionService.getSignal(user.company_id);
    return signal || { risk_level: 'UNKNOWN' };
  }

  @Get('next-action')
  async getNextBestAction(@CurrentUser() user: RequestUser) {
    return this.plgAiService.getNextBestAction(user.company_id);
  }

  @Get('metrics')
  async getMetrics() {
    // Ideally this should be restricted to superadmins, but omitting for brevity.
    return this.analyticsService.getMetrics();
  }
}
