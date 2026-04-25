import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UpsellService, UpsellSuggestion } from '../billing/upsell.service';

export interface SalesContext {
  plan: string;
  plan_status: string;
  usage: Record<
    string,
    { used: number; limit: number; percentage: number; status: string }
  >;
  upsell_suggestions: UpsellSuggestion[];
  blocked_features: string[];
  days_since_subscription: number;
  is_trial: boolean;
}

@Injectable()
export class SalesContextService {
  private readonly logger = new Logger(SalesContextService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly upsellService: UpsellService,
  ) {}

  /**
   * Build comprehensive sales context for a company.
   */
  async buildContext(companyId: string): Promise<SalesContext> {
    const sub = await this.subscriptionsService.findByCompany(companyId);
    if (!sub) {
      return {
        plan: 'none',
        plan_status: 'inactive',
        usage: {},
        upsell_suggestions: [],
        blocked_features: [],
        days_since_subscription: 0,
        is_trial: false,
      };
    }

    const usageMetrics = [
      'projects',
      'users',
      'storage_mb',
      'ai_requests',
      'bim_models',
    ];
    const usage: SalesContext['usage'] = {};

    for (const metric of usageMetrics) {
      const status = await this.subscriptionsService.checkUsageStatus(
        companyId,
        metric,
      );
      usage[metric] = {
        used: status.used,
        limit: status.limit,
        percentage: status.percentage,
        status: status.status,
      };
    }

    const suggestions =
      await this.upsellService.getUpsellSuggestions(companyId);

    // Calculate days since subscription start
    const daysSince = sub.start_date
      ? Math.floor(
          (Date.now() - new Date(sub.start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const isTrial = sub.trial_ends_at
      ? new Date() < new Date(sub.trial_ends_at)
      : false;

    // Identify blocked features
    const allFeatures = [
      'bim_viewer',
      'ai_assistant',
      'advanced_analytics',
      'api_access',
    ];
    const blocked: string[] = [];
    for (const feature of allFeatures) {
      const has = await this.subscriptionsService.hasFeature(
        companyId,
        feature as any,
      );
      if (!has) blocked.push(feature);
    }

    return {
      plan: sub.plan,
      plan_status: sub.status,
      usage,
      upsell_suggestions: suggestions,
      blocked_features: blocked,
      days_since_subscription: daysSince,
      is_trial: isTrial,
    };
  }
}
