import { Injectable } from '@nestjs/common';
import { SalesContext } from './sales-context.service';
import { OpportunityType } from './entities/sales-interaction.entity';

export interface SalesOpportunity {
  type: OpportunityType;
  target?: string;
  addon_code?: string;
  trigger_reason: string;
  urgency: 'low' | 'medium' | 'high';
  estimated_value?: number;
}

@Injectable()
export class SalesDecisionEngine {
  /**
   * Analyze context and determine the best sales opportunity to present.
   * Returns null if no opportunity is appropriate (cooldown, low priority, etc.)
   */
  getSalesOpportunity(context: SalesContext): SalesOpportunity | null {
    const opportunities: SalesOpportunity[] = [];

    // 1. Check for critical usage limits (blocked = immediate opportunity)
    for (const [metric, data] of Object.entries(context.usage)) {
      if (data.status === 'blocked') {
        opportunities.push({
          type: OpportunityType.INCREASE_USAGE,
          addon_code: this.getAddonForMetric(metric),
          trigger_reason: `${this.metricName(metric)} al 100% — bloqueado`,
          urgency: 'high',
        });
      } else if (data.status === 'danger') {
        opportunities.push({
          type: OpportunityType.INCREASE_USAGE,
          addon_code: this.getAddonForMetric(metric),
          trigger_reason: `${this.metricName(metric)} al ${data.percentage}%`,
          urgency: 'medium',
        });
      }
    }

    // 2. Check for blocked features users might want
    if (context.blocked_features.length > 0) {
      for (const feature of context.blocked_features) {
        const addon = this.getAddonForFeature(feature);
        if (addon) {
          opportunities.push({
            type: OpportunityType.BUY_ADDON,
            addon_code: addon,
            trigger_reason: `Funcionalidad "${this.featureName(feature)}" no disponible en plan actual`,
            urgency: 'medium',
          });
        }
      }
    }

    // 3. Plan upgrade if multiple limits are being hit
    const criticalMetrics = Object.values(context.usage).filter(
      (u) => u.status === 'blocked' || u.status === 'danger',
    );

    if (criticalMetrics.length >= 2 && context.plan !== 'enterprise') {
      const nextPlan = context.plan === 'lite' ? 'pro' : 'enterprise';
      opportunities.unshift({
        type: OpportunityType.UPGRADE_PLAN,
        target: nextPlan,
        trigger_reason: `Múltiples límites al máximo — plan ${context.plan} insuficiente`,
        urgency: 'high',
      });
    }

    // 4. Trial ending → upgrade push
    if (context.is_trial && context.days_since_subscription > 10) {
      opportunities.push({
        type: OpportunityType.UPGRADE_PLAN,
        target: 'pro',
        trigger_reason: 'Período de prueba próximo a finalizar',
        urgency: 'high',
      });
    }

    // Return the highest priority opportunity
    if (opportunities.length === 0) return null;

    opportunities.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    return opportunities[0];
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

  private getAddonForFeature(feature: string): string | undefined {
    const map: Record<string, string> = {
      bim_viewer: 'bim_module',
      ai_assistant: 'ai_pack',
      advanced_analytics: 'advanced_analytics',
      api_access: 'api_access',
    };
    return map[feature];
  }

  private metricName(metric: string): string {
    const names: Record<string, string> = {
      projects: 'Proyectos',
      users: 'Usuarios',
      storage_mb: 'Almacenamiento',
      ai_requests: 'Solicitudes AI',
      bim_models: 'Modelos BIM',
    };
    return names[metric] || metric;
  }

  private featureName(feature: string): string {
    const names: Record<string, string> = {
      bim_viewer: 'Visor BIM 3D',
      ai_assistant: 'Asistente IA',
      advanced_analytics: 'Analytics Avanzado',
      api_access: 'API Externa',
    };
    return names[feature] || feature;
  }
}
