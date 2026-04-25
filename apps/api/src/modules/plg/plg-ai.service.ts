import { Injectable, Logger } from '@nestjs/common';
import { OnboardingService, ONBOARDING_STEPS } from './onboarding.service';
import { ActivationService } from './activation.service';
import { RetentionService } from './retention.service';

export interface NextBestAction {
  action: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

@Injectable()
export class PlgAiService {
  private readonly logger = new Logger(PlgAiService.name);

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly activationService: ActivationService,
    private readonly retentionService: RetentionService,
  ) {}

  /**
   * Determine the Next Best Action for a user based on their PLG state.
   * Uses heuristics to push users down the funnel: Onboarding -> Activation -> Retention -> Expansion.
   */
  async getNextBestAction(companyId: string): Promise<NextBestAction> {
    try {
      // 1. Check Onboarding
      const onboarding = await this.onboardingService.getProgress(companyId);
      if (onboarding.percentage < 100) {
        // Find the first uncompleted step
        const nextStep = ONBOARDING_STEPS.find(
          (code) => !onboarding.steps.find((s) => s.code === code)?.completed,
        );
        if (nextStep) {
          return {
            action: nextStep,
            priority: 'high',
            reason: `Debes completar "${this.formatStepName(nextStep)}" para terminar tu configuración inicial.`,
          };
        }
      }

      // 2. Check Activation
      const activation = await this.activationService.getStatus(companyId);
      if (!activation || !activation.is_activated) {
        return {
          action: 'explore_features',
          priority: 'high',
          reason:
            'Aún no has descubierto el valor central. Crea más proyectos o presupuestos.',
        };
      }

      // 3. Check Retention (Churn Risk)
      const retention = await this.retentionService.getSignal(companyId);
      if (retention && retention.risk_level === 'HIGH') {
        return {
          action: 're_engage',
          priority: 'high',
          reason:
            'Hemos notado inactividad. ¿Necesitas ayuda con la plataforma?',
        };
      }

      // 4. Default to Expansion / Habit building
      return {
        action: 'invite_team',
        priority: 'medium',
        reason:
          'Invita a tu equipo para colaborar y aumentar la productividad.',
      };
    } catch (error) {
      this.logger.error(`Error getting NBA for ${companyId}`, error.stack);
      return {
        action: 'explore',
        priority: 'low',
        reason: 'Explora las funcionalidades de BM Build Manage.',
      };
    }
  }

  private formatStepName(step: string): string {
    const names: Record<string, string> = {
      create_project: 'Crear un Proyecto',
      create_budget: 'Crear Presupuesto',
      add_item: 'Añadir Partida',
      add_expense: 'Registrar Gasto',
      invite_user: 'Invitar Usuario',
      upload_document: 'Subir Documento',
    };
    return names[step] || step;
  }
}
