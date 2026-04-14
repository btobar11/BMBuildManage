import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { Budget } from '../budgets/budget.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

/**
 * Interfaz para respuesta de análisis de presupuesto
 */
export interface BudgetAnalysisResponse {
  summary: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  keyInsights: Array<{
    type: 'warning' | 'opportunity' | 'risk' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  varianceAnalysis: {
    totalVariance: number;
    overBudgetItems: number;
    underBudgetItems: number;
    criticalItems: Array<{
      name: string;
      stage: string;
      estimated: number;
      executed: number;
      variance: number;
    }>;
  };
  recommendations: string[];
  metadata?: {
    projectName: string;
    totalEstimated: number;
    totalExecuted: number;
    variance: number;
  };
}

/**
 * Interfaz para respuesta de análisis de contingencias
 */
export interface ContingencyAnalysisResponse {
  summary: string;
  contingencyStatus: 'adequate' | 'insufficient' | 'overused';
  utilizationRate: number;
  riskExposure: {
    current: number;
    projected: number;
    buffer: number;
  };
  insights: Array<{
    type: 'warning' | 'opportunity' | 'risk' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

/**
 * AI Assistant Service - Integración con Groq (Llama 3 70B)
 *
 * Proporciona análisis inteligente de presupuestos y contingencias
 * para proyectos de construcción en Latinoamérica.
 *
 * Características:
 * - Latencia objetivo < 500ms
 * - Response format JSON object para respuestas estructuradas
 * - Temperature 0.2 para mitigar alucinaciones
 * - System prompt especializado para ingenieros civiles LatAm
 */
@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private readonly groqClient: OpenAI | null = null;
  private readonly model: string;
  private readonly temperature = 0.2;
  private readonly maxTokens = 2000;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(ProjectContingency)
    private readonly contingencyRepository: Repository<ProjectContingency>,
  ) {
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    const groqBaseUrl =
      this.configService.get<string>('GROQ_BASE_URL') ||
      'https://api.groq.com/openai/v1';
    this.model =
      this.configService.get<string>('AI_MODEL') || 'llama-3.1-70b-versatile';

    if (groqApiKey) {
      this.groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: groqBaseUrl,
      });
      this.logger.log(`AI Assistant initialized with model: ${this.model}`);
    } else {
      this.logger.warn(
        'GROQ_API_KEY no configurada - AI Assistant no disponible',
      );
    }
  }

  /**
   * System Prompt para el modelo - Ingeniero Civil experto en LatAm
   * El modelo debe responder en JSON puro
   */
  private readonly SYSTEM_PROMPT = `Eres un Ingeniero Civil experto en gestión de proyectos de construcción para Latinoamérica.
Tu especialidad incluye:
- Análisis de presupuestos y costos de obra
- Control de contingencias y gestión de riesgos
- Optimización de recursos y programación de obra
- Normativas de construcción de países LatAm (Colombia, México, Chile, Perú, Argentina, etc.)
- Análisis de desviaciones y variaciones de presupuesto

DIRECTRICES DE RESPUESTA:
1. Respondes ÚNICAMENTE en formato JSON válido
2. No agregas texto adicional fuera del JSON
3. Usas terminología técnica apropiada para construcción
4. Consideras el contexto de proyectos de construcción en Latinoamérica
5. Proporcionas recomendaciones prácticas y accionables
6. Tu análisis debe ser riguroso y basado en datos, no especulaciones

ESTRUCTURA DE RESPUESTA PARA PRESUPUESTOS:
{
  "summary": "Resumen ejecutivo en 1-2 oraciones",
  "healthStatus": "healthy|warning|critical",
  "keyInsights": [
    {
      "type": "warning|opportunity|risk|recommendation",
      "title": "Título corto descriptivo",
      "description": "Descripción detallada con contexto",
      "impact": "high|medium|low"
    }
  ],
  "varianceAnalysis": {
    "totalVariance": número (porcentaje),
    "overBudgetItems": número,
    "underBudgetItems": número,
    "criticalItems": [
      {
        "name": "nombre del item",
        "stage": "nombre de la etapa",
        "estimated": número,
        "executed": número,
        "variance": número (porcentaje)
      }
    ]
  },
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ]
}

ESTRUCTURA DE RESPUESTA PARA CONTINGENCIAS:
{
  "summary": "Resumen ejecutivo del estado de contingencias",
  "contingencyStatus": "adequate|insufficient|overused",
  "utilizationRate": número (porcentaje),
  "riskExposure": {
    "current": número,
    "projected": número,
    "buffer": número
  },
  "insights": [
    {
      "type": "warning|opportunity|risk|recommendation",
      "title": "Título corto",
      "description": "Descripción detallada",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ]
}`;

  /**
   * Analiza un presupuesto con IA
   * @param budgetId ID del presupuesto a analizar
   * @param companyId ID de la empresa (para validación multi-tenant)
   * @param customPrompt Prompt opcional personalizado
   * @returns Análisis estructurado del presupuesto
   */
  async analyzeBudget(
    budgetId: string,
    companyId: string,
    customPrompt?: string,
  ): Promise<BudgetAnalysisResponse> {
    if (!this.groqClient) {
      this.logger.error('Groq client no disponible');
      throw new InternalServerErrorException(
        'Servicio de IA no disponible. Verifica la configuración de GROQ_API_KEY.',
      );
    }

    try {
      // Validar que el presupuesto pertenece a la empresa
      // Budget -> Project -> Company (para multi-tenant)
      const budget = await this.budgetRepository.findOne({
        where: { id: budgetId },
        relations: ['project', 'project.company', 'stages', 'stages.items'],
      });

      if (!budget) {
        throw new InternalServerErrorException('Presupuesto no encontrado');
      }

      // Validar que el presupuesto pertenece a la empresa del usuario
      if (budget.project?.company?.id !== companyId) {
        throw new InternalServerErrorException('Presupuesto no encontrado');
      }

      // Extraer datos del presupuesto
      const budgetData = this.extractBudgetData(budget);

      // Construir prompt del usuario
      const userPrompt = customPrompt || this.buildBudgetPrompt(budgetData);

      // Llamar a la API de Groq
      const completion = await this.groqClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.temperature,
        response_format: { type: 'json_object' as const },
        max_tokens: this.maxTokens,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No se recibió respuesta del modelo de IA');
      }

      const parsed = JSON.parse(content) as BudgetAnalysisResponse;
      this.logger.log(`Análisis de presupuesto ${budgetId} completado`);

      return {
        ...parsed,
        metadata: {
          projectName: budgetData.projectName,
          totalEstimated: budgetData.totalEstimated,
          totalExecuted: budgetData.totalExecuted,
          variance: budgetData.variance,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al analizar presupuesto ${budgetId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al analizar presupuesto con IA. Por favor intenta más tarde.',
      );
    }
  }

  /**
   * Analiza las contingencias de un proyecto con IA
   * @param projectId ID del proyecto
   * @param companyId ID de la empresa (para validación multi-tenant)
   * @returns Análisis estructurado de contingencias
   */
  async analyzeContingencies(
    projectId: string,
    companyId: string,
  ): Promise<ContingencyAnalysisResponse> {
    if (!this.groqClient) {
      this.logger.error('Groq client no disponible');
      throw new InternalServerErrorException(
        'Servicio de IA no disponible. Verifica la configuración de GROQ_API_KEY.',
      );
    }

    try {
      // Obtener contingencias del proyecto
      // ProjectContingency -> Project -> Company (para multi-tenant)
      const contingencies = await this.contingencyRepository.find({
        where: { project_id: projectId },
        relations: ['project', 'project.company'],
      });

      // Filtrar por company_id después de la query
      const filteredContingencies = contingencies.filter(
        (c) => c.project?.company?.id === companyId,
      );

      if (filteredContingencies.length === 0) {
        throw new InternalServerErrorException(
          'No se encontraron contingencias para este proyecto',
        );
      }

      // Calcular estadísticas de contingencias
      const contingencyData = this.calculateContingencyStats(
        filteredContingencies,
      );

      // Construir prompt para análisis de contingencias
      const userPrompt = this.buildContingencyPrompt(contingencyData);

      // Llamar a la API de Groq
      const completion = await this.groqClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.temperature,
        response_format: { type: 'json_object' as const },
        max_tokens: this.maxTokens,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No se recibió respuesta del modelo de IA');
      }

      const parsed = JSON.parse(content) as ContingencyAnalysisResponse;
      this.logger.log(
        `Análisis de contingencias para proyecto ${projectId} completado`,
      );

      return parsed;
    } catch (error) {
      this.logger.error(
        `Error al analizar contingencias del proyecto ${projectId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al analizar contingencias con IA. Por favor intenta más tarde.',
      );
    }
  }

  /**
   * Extrae datos relevantes del presupuesto para el análisis
   */
  private extractBudgetData(budget: Budget): {
    projectName: string;
    budgetName: string;
    totalEstimated: number;
    totalExecuted: number;
    variance: number;
    items: Array<{
      name: string;
      stage: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      executed: number;
      estimated: number;
      executedCost: number;
      variance: number;
    }>;
  } {
    let totalEstimated = 0;
    let totalExecuted = 0;
    const items: Array<any> = [];

    for (const stage of budget.stages || []) {
      for (const item of stage.items || []) {
        const estimated = Number(item.quantity) * Number(item.unit_cost);
        const executed =
          Number(item.quantity_executed) * Number(item.unit_cost);
        totalEstimated += estimated;
        totalExecuted += executed;

        items.push({
          name: item.name,
          stage: stage.name,
          quantity: item.quantity,
          unitCost: item.unit_cost,
          unitPrice: item.unit_price,
          executed: item.quantity_executed,
          estimated,
          executedCost: executed,
          variance:
            estimated > 0 ? ((executed - estimated) / estimated) * 100 : 0,
        });
      }
    }

    return {
      projectName: budget.project?.name || 'Sin proyecto',
      budgetName: budget.project?.name || 'Sin nombre',
      totalEstimated: Math.round(totalEstimated),
      totalExecuted: Math.round(totalExecuted),
      variance:
        totalEstimated > 0
          ? ((totalExecuted - totalEstimated) / totalEstimated) * 100
          : 0,
      items,
    };
  }

  /**
   * Construye el prompt para análisis de presupuesto
   */
  private buildBudgetPrompt(budgetData: {
    projectName: string;
    budgetName: string;
    totalEstimated: number;
    totalExecuted: number;
    variance: number;
    items: Array<any>;
  }): string {
    // Filtrar items críticos (con varianza > 10% o <-5%)
    const criticalItems = budgetData.items
      .filter((item) => Math.abs(item.variance) > 10)
      .slice(0, 20); // Limitar a 20 items para no exceder tokens

    const summary = {
      projectName: budgetData.projectName,
      budgetName: budgetData.budgetName,
      totalEstimated: budgetData.totalEstimated,
      totalExecuted: budgetData.totalExecuted,
      variance: Math.round(budgetData.variance * 10) / 10,
      criticalItemsCount: criticalItems.length,
    };

    return `Analiza el siguiente presupuesto de construcción:

PRESUPUETO:
${JSON.stringify(summary, null, 2)}

ITEMS CRÍTICOS (con desviación significativa):
${JSON.stringify(criticalItems, null, 2)}

Proporciona un análisis completo incluyendo:
1. Estado de salud del presupuesto
2. Insights sobre desviaciones y tendencias
3. Análisis de varianza por etapa
4. Recomendaciones técnicas específicas

Responde en formato JSON estructurado.`;
  }

  /**
   * Calcula estadísticas de contingencias
   */
  private calculateContingencyStats(contingencies: ProjectContingency[]): {
    totalAllocated: number;
    totalUsed: number;
    totalRemaining: number;
    utilizationRate: number;
    byCategory: Record<
      string,
      { allocated: number; used: number; remaining: number }
    >;
    risks: Array<{
      name: string;
      probability: number;
      impact: number;
      estimatedCost: number;
      status: string;
    }>;
  } {
    let totalAllocated = 0;
    let totalUsed = 0;
    const byCategory: Record<
      string,
      { allocated: number; used: number; remaining: number }
    > = {};
    const risks: Array<any> = [];

    for (const c of contingencies) {
      const allocated = Number(c.quantity) * Number(c.unit_cost);
      const used = Number(c.total_cost) || 0;
      const remaining = allocated - used;

      totalAllocated += allocated;
      totalUsed += used;

      const category =
        c.description?.split(' ').slice(0, 2).join(' ') || 'general';
      if (!byCategory[category]) {
        byCategory[category] = { allocated: 0, used: 0, remaining: 0 };
      }
      byCategory[category].allocated += allocated;
      byCategory[category].used += used;
      byCategory[category].remaining += remaining;

      if (c.description) {
        risks.push({
          name: c.description,
          probability: 0.5,
          impact: Number(c.total_cost) || 0,
          estimatedCost: allocated,
          status: remaining > 0 ? 'active' : 'exhausted',
        });
      }
    }

    const utilizationRate =
      totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalUsed,
      totalRemaining: totalAllocated - totalUsed,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      byCategory,
      risks: risks.slice(0, 10), // Limitar a 10 riesgos
    };
  }

  /**
   * Construye el prompt para análisis de contingencias
   */
  private buildContingencyPrompt(contingencyData: {
    totalAllocated: number;
    totalUsed: number;
    totalRemaining: number;
    utilizationRate: number;
    byCategory: Record<
      string,
      { allocated: number; used: number; remaining: number }
    >;
    risks: Array<any>;
  }): string {
    return `Analiza el estado de las contingencias del proyecto:

RESUMEN:
- Total allocated: $${contingencyData.totalAllocated.toLocaleString()}
- Total used: $${contingencyData.totalUsed.toLocaleString()}
- Remaining: $${contingencyData.totalRemaining.toLocaleString()}
- Utilization rate: ${contingencyData.utilizationRate}%

BY CATEGORY:
${JSON.stringify(contingencyData.byCategory, null, 2)}

RISKS:
${JSON.stringify(contingencyData.risks, null, 2)}

Proporciona un análisis completo incluyendo:
1. Estado de las contingencias (adecuadas, insuficientes, sobreusadas)
2. Exposición al riesgo actual y proyectada
3. Insights sobre patrones de uso
4. Recomendaciones para gestión de riesgos

Responde en formato JSON estructurado.`;
  }

  /**
   * Verifica si el servicio de IA está disponible
   */
  isAvailable(): boolean {
    return this.groqClient !== null;
  }

  /**
   * Genera un análisis de construcción con IA
   * @param prompt Prompt del usuario
   * @param context Contexto adicional para el análisis
   * @returns Análisis en formato JSON
   */
  async generateConstructionAnalysis(
    prompt: string,
    context: any,
  ): Promise<any> {
    if (!this.groqClient) {
      throw new InternalServerErrorException(
        'Servicio de IA no disponible. Verifica la configuración de GROQ_API_KEY.',
      );
    }

    const model = this.model;

    const systemPrompt = `Eres un Arquitecto e Ingeniero Civil experto en construcción con más de 20 años de experiencia en proyectos de construcción en Latinoamérica. Tu especialidad incluye análisis de costos, planificación de proyectos, gestión de presupuestos y análisis de viabilidad técnica. Debes responder STRICTAMENTE en formato JSON válido y puro, sin texto adicional antes o después del JSON.`;

    try {
      const completion = await this.groqClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Contexto: ${JSON.stringify(context)}\n\nSolicitud: ${prompt}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' as const },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No se recibió respuesta de la API de IA');
      }

      return JSON.parse(content);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error al generar análisis de construcción: ${error.message}`,
      );
    }
  }
}
