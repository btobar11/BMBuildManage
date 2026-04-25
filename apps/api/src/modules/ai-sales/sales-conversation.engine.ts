import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SalesContext } from './sales-context.service';
import { SalesOpportunity } from './sales-decision.engine';

export interface SalesMessage {
  message: string;
  cta: string;
  urgency: 'low' | 'medium' | 'high';
}

@Injectable()
export class SalesConversationEngine {
  private readonly logger = new Logger(SalesConversationEngine.name);
  private readonly groqClient: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqApiKey) {
      this.groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL:
          this.configService.get<string>('GROQ_BASE_URL') ||
          'https://api.groq.com/openai/v1',
      });
    }
  }

  /**
   * Generate a personalized sales message using AI.
   * Falls back to template-based messages if AI is unavailable.
   */
  async generateSalesMessage(
    context: SalesContext,
    opportunity: SalesOpportunity,
  ): Promise<SalesMessage> {
    if (this.groqClient) {
      try {
        return await this.generateAIMessage(context, opportunity);
      } catch (error) {
        this.logger.warn(
          'AI message generation failed, using template fallback',
        );
      }
    }

    return this.generateTemplateMessage(context, opportunity);
  }

  private async generateAIMessage(
    context: SalesContext,
    opportunity: SalesOpportunity,
  ): Promise<SalesMessage> {
    const systemPrompt = `Eres un asistente de ventas interno de BMBuildManage, una plataforma SaaS de gestión de construcción.
Tu objetivo es generar un mensaje corto, directo y empático para convencer al usuario de actualizar su plan o comprar un addon.

Reglas:
- Máximo 2 oraciones
- Lenguaje profesional pero cercano (español chileno formal)
- Menciona el problema real que tiene el usuario
- Ofrece la solución específica
- Incluye urgencia si corresponde
- NO uses emojis excesivos, máximo 1
- CTA debe ser un botón claro (3-5 palabras)

Responde SOLO en formato JSON:
{"message": "...", "cta": "...", "urgency": "low|medium|high"}`;

    const userPrompt = `Contexto de la empresa:
- Plan actual: ${context.plan}
- Estado: ${context.plan_status}
- Uso: ${JSON.stringify(context.usage)}
- Features bloqueadas: ${context.blocked_features.join(', ') || 'ninguna'}
- Días desde suscripción: ${context.days_since_subscription}
- En trial: ${context.is_trial}

Oportunidad detectada:
- Tipo: ${opportunity.type}
- Target: ${opportunity.target || opportunity.addon_code || 'N/A'}
- Razón: ${opportunity.trigger_reason}
- Urgencia: ${opportunity.urgency}

Genera el mensaje de venta.`;

    const completion = await this.groqClient!.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return this.generateTemplateMessage(context, opportunity);
    }

    const parsed = JSON.parse(content);
    return {
      message: parsed.message || 'Optimiza tu plan para seguir creciendo.',
      cta: parsed.cta || 'Ver opciones',
      urgency: parsed.urgency || opportunity.urgency,
    };
  }

  private generateTemplateMessage(
    context: SalesContext,
    opportunity: SalesOpportunity,
  ): SalesMessage {
    const templates: Record<string, SalesMessage> = {
      upgrade_plan: {
        message: `Tu plan ${context.plan} está alcanzando sus límites. ${opportunity.target ? `Con ${opportunity.target.charAt(0).toUpperCase() + opportunity.target.slice(1)} tendrás más capacidad y funcionalidades avanzadas.` : 'Considera actualizar para seguir creciendo.'}`,
        cta: opportunity.target
          ? `Mejorar a ${opportunity.target.charAt(0).toUpperCase() + opportunity.target.slice(1)}`
          : 'Ver planes',
        urgency: opportunity.urgency,
      },
      buy_addon: {
        message: `Desbloquea "${opportunity.addon_code ? this.addonName(opportunity.addon_code) : 'funcionalidad premium'}" para potenciar tu gestión de proyectos sin cambiar de plan.`,
        cta: 'Activar ahora',
        urgency: opportunity.urgency,
      },
      increase_usage_limit: {
        message: `${opportunity.trigger_reason}. Amplía tu capacidad para no interrumpir tu trabajo.`,
        cta: 'Ampliar límite',
        urgency: opportunity.urgency,
      },
      renew_subscription: {
        message:
          'Tu suscripción está por vencer. Renueva ahora para mantener acceso a todas tus funcionalidades.',
        cta: 'Renovar suscripción',
        urgency: 'high',
      },
    };

    return (
      templates[opportunity.type] || {
        message: 'Mejora tu experiencia en BMBuildManage.',
        cta: 'Ver opciones',
        urgency: 'low',
      }
    );
  }

  private addonName(code: string): string {
    const names: Record<string, string> = {
      bim_module: 'BIM 3D/4D/5D',
      ai_pack: 'Asistente IA',
      advanced_analytics: 'Analytics Avanzado',
      api_access: 'API Externa',
      extra_project: 'Proyectos adicionales',
      extra_user: 'Usuarios adicionales',
      extra_storage: 'Almacenamiento extra',
      extra_ai: 'Solicitudes AI extra',
      extra_bim_models: 'Modelos BIM extra',
    };
    return names[code] || code;
  }
}
