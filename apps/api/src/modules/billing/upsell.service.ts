import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlanTier } from '../subscriptions/entities/subscription.entity';

export interface UpsellSuggestion {
  type: 'upgrade_plan' | 'addon' | 'usage_expansion';
  target?: string;
  addon_code?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  cta_text: string;
}

@Injectable()
export class UpsellService {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Generate smart upsell suggestions for a company based on their usage patterns.
   */
  async getUpsellSuggestions(companyId: string): Promise<UpsellSuggestion[]> {
    const suggestions: UpsellSuggestion[] = [];

    const sub = await this.subscriptionsService.findByCompany(companyId);
    if (!sub) return suggestions;

    const limits =
      await this.subscriptionsService.getEffectiveLimits(companyId);

    // Check each usage dimension for threshold triggers
    const usageMetrics = [
      'projects',
      'users',
      'storage_mb',
      'ai_requests',
      'bim_models',
    ];

    for (const metric of usageMetrics) {
      const status = await this.subscriptionsService.checkUsageStatus(
        companyId,
        metric,
      );

      if (status.status === 'unlimited') continue;

      if (status.status === 'blocked' || status.status === 'danger') {
        // High priority — near or at limit
        const addonSuggestion = this.getAddonForMetric(metric);
        if (addonSuggestion) {
          suggestions.push({
            type: 'usage_expansion',
            addon_code: addonSuggestion,
            reason: `Has usado el ${status.percentage}% de tu límite de ${this.metricDisplayName(metric)}`,
            priority: status.status === 'blocked' ? 'high' : 'medium',
            cta_text: `Ampliar ${this.metricDisplayName(metric)}`,
          });
        }
      } else if (status.status === 'warning') {
        // Medium priority — approaching limit
        suggestions.push({
          type: 'usage_expansion',
          addon_code: this.getAddonForMetric(metric),
          reason: `Te queda poco espacio en ${this.metricDisplayName(metric)} (${status.percentage}%)`,
          priority: 'low',
          cta_text: `Ampliar capacidad`,
        });
      }
    }

    // Plan upgrade suggestions based on tier
    if (sub.plan === PlanTier.LITE) {
      // Check if they're using features that suggest Pro readiness
      const highUsage = suggestions.filter(
        (s) => s.priority === 'high' || s.priority === 'medium',
      );
      if (highUsage.length >= 2) {
        suggestions.unshift({
          type: 'upgrade_plan',
          target: PlanTier.PRO,
          reason:
            'Estás alcanzando los límites de tu plan Lite en múltiples dimensiones. Pro te da más capacidad y funcionalidades avanzadas.',
          priority: 'high',
          cta_text: 'Mejorar a Pro',
        });
      }
    } else if (sub.plan === PlanTier.PRO) {
      // Check for Enterprise readiness (BIM/AI blocked)
      const blockedBim = !(await this.subscriptionsService.hasFeature(
        companyId,
        'bim_viewer' as any,
      ));
      const blockedAi = !(await this.subscriptionsService.hasFeature(
        companyId,
        'ai_assistant' as any,
      ));

      if (blockedBim) {
        suggestions.push({
          type: 'addon',
          addon_code: 'bim_module',
          reason: 'Desbloquea BIM 3D/4D/5D sin cambiar de plan',
          priority: 'medium',
          cta_text: 'Activar BIM',
        });
      }

      if (blockedAi) {
        suggestions.push({
          type: 'addon',
          addon_code: 'ai_pack',
          reason: 'Activa el asistente de IA para análisis inteligente',
          priority: 'medium',
          cta_text: 'Activar AI',
        });
      }
    }

    return suggestions;
  }

  private getAddonForMetric(metric: string): string | undefined {
    const map: Record<string, string> = {
      projects: 'extra_project',
      users: 'extra_user',
      storage_mb: 'extra_storage',
      ai_requests: 'extra_ai',
      bim_models: 'extra_bim_models',
    };
    return map[metric];
  }

  private metricDisplayName(metric: string): string {
    const names: Record<string, string> = {
      projects: 'proyectos',
      users: 'usuarios',
      storage_mb: 'almacenamiento',
      ai_requests: 'solicitudes AI',
      bim_models: 'modelos BIM',
    };
    return names[metric] || metric;
  }
}
