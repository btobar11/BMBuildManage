import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Worker } from '../workers/worker.entity';
import { FinancialService } from '../budgets/financial.service';
import { BIMAnalyticsService } from './bim-analytics.service';

export interface AIInsight {
  type: 'warning' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  metric?: {
    label: string;
    value: number;
    change?: number;
  };
}

export interface ProjectRiskPrediction {
  projectId: string;
  projectName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedDelay: number;
  probability: number;
  factors: {
    name: string;
    impact: number;
    weight: number;
  }[];
  recommendations: string[];
}

export interface NLPQueryResult {
  answer: string;
  data?: any;
  sources: string[];
  confidence: number;
  actionable?: boolean;
  suggestedActions?: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly groqClient: OpenAI | null = null;
  private readonly RISK_THRESHOLDS = {
    budget: 0.15,
    schedule: 0.2,
    resource: 0.25,
  };

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly dataSource: DataSource,
    private readonly financialService: FinancialService,
    private readonly bimAnalyticsService: BIMAnalyticsService,
    private readonly configService: ConfigService,
  ) {
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    const groqBaseUrl =
      this.configService.get<string>('GROQ_BASE_URL') ||
      'https://api.groq.com/openai/v1';

    if (groqApiKey) {
      this.groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: groqBaseUrl,
      });
      this.logger.log('Groq client initialized for AI Assistant');
    } else {
      this.logger.warn(
        'GROQ_API_KEY not configured - AI Assistant will use fallback logic',
      );
    }
  }

  async processNaturalLanguageQuery(
    userId: string,
    companyId: string,
    query: string,
    context?: { projectId?: string; budgetId?: string },
  ): Promise<NLPQueryResult> {
    const normalizedQuery = query.toLowerCase().trim();

    const intentPatterns = [
      {
        pattern: /^(estado|situación|cómo va|progreso|resumen)/i,
        intent: 'projectStatus',
      },
      {
        pattern: /^(presupuesto|costo|gasto|cuánto|precio|valor)/i,
        intent: 'budget',
      },
      {
        pattern: /^(retraso|demora|atrasado|cuando|plazo|cronograma)/i,
        intent: 'schedule',
      },
      {
        pattern: /^(trabajador|trabajadores|personal|equipo|obreros|workers)/i,
        intent: 'workers',
      },
      {
        pattern: /^(recomienda|sugiere|qué hacer|ayúdame|consejo|建议)/i,
        intent: 'recommendation',
      },
      {
        pattern:
          /^(pronóstico|predice|pronostica|estimado|predecir|previsión)/i,
        intent: 'prediction',
      },
      {
        pattern: /^(comparar|comparación|vs|versus|vs\.|diferencia)/i,
        intent: 'comparison',
      },
      { pattern: /^(gasto|gastos|expense|expenses)/i, intent: 'expenses' },
      {
        pattern: /^(documento|documentos|archivo|files)/i,
        intent: 'documents',
      },
      { pattern: /^(rfi|submittal|punch|qc|quality)/i, intent: 'quality' },
      {
        pattern: /^(cuál|cules|que es|qué es|explain|explica)/i,
        intent: 'explain',
      },
      // BIM optimization should come BEFORE general optimization to match correctly
      {
        pattern: /^(optimizaci[oó]n|eficiencia|desperdicio|waste|recursos)/i,
        intent: 'bimOptimization',
      },
      {
        pattern: /^(optimiz|mejora|eficiente|mejorar)/i,
        intent: 'optimization',
      },
      {
        pattern: /^(reporte|reporte|report|resumen|summary)/i,
        intent: 'report',
      },
      {
        pattern: /^(ayuda|help|comandos|commands|qué puedes)/i,
        intent: 'help',
      },
      { pattern: /^(hola|buenos|hi|hello)/i, intent: 'greeting' },
      // NEW BIM INTELLIGENT PATTERNS
      {
        pattern: /^(bim|modelo|modelos|elementos?|ifc|3d)/i,
        intent: 'bimElements',
      },
      {
        pattern: /^(colisiones?|clashes?|conflictos?|interferencias?)/i,
        intent: 'bimClashes',
      },
      {
        pattern:
          /^(cubicación|cubicaciones|cantidades?|volúmenes?|m3|m2|metros)/i,
        intent: 'bimQuantities',
      },
      {
        pattern: /^(pisos?|plantas?|storeys?|niveles?)/i,
        intent: 'bimStoreys',
      },
      {
        pattern:
          /^(disciplinas?|arquitectura|estructura|mep|hvac|plumbing|electrical)/i,
        intent: 'bimDisciplines',
      },
      {
        pattern: /^(calidad|quality|consistencia|completitud)/i,
        intent: 'bimQuality',
      },
      {
        pattern: /^(concreto|hormigón|acero|madera|materiales?)/i,
        intent: 'bimMaterials',
      },
    ];

    let detectedIntent = 'general';
    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(normalizedQuery)) {
        detectedIntent = intent;
        break;
      }
    }

    const entities = this.extractEntities(normalizedQuery);

    switch (detectedIntent) {
      case 'projectStatus':
        return await this.handleProjectStatus(
          companyId,
          context?.projectId,
          entities,
        );
      case 'budget':
        return await this.handleBudgetQuery(
          companyId,
          context?.projectId,
          context?.budgetId,
          entities,
        );
      case 'schedule':
        return await this.handleScheduleQuery(
          companyId,
          context?.projectId,
          entities,
        );
      case 'workers':
        return await this.handleWorkersQuery(companyId, context?.projectId);
      case 'recommendation':
        return await this.generateRecommendations(
          companyId,
          context?.projectId,
        );
      case 'prediction':
        return await this.predictProjectOutcome(companyId, context?.projectId);
      // NEW BIM INTELLIGENT HANDLERS
      case 'bimElements':
        return await this.handleBIMElementsQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimClashes':
        return await this.handleBIMClashesQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimQuantities':
        return await this.handleBIMQuantitiesQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimStoreys':
        return await this.handleBIMStoreysQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimDisciplines':
        return await this.handleBIMDisciplinesQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimQuality':
        return await this.handleBIMQualityQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimMaterials':
        return await this.handleBIMMaterialsQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      case 'bimOptimization':
        return await this.handleBIMOptimizationQuery(
          companyId,
          context?.projectId,
          query,
          entities,
        );
      default:
        return this.handleGeneralQuery(companyId, context?.projectId, query);
    }
  }

  private extractEntities(query: string): any {
    const entities: any = {};

    const timePatterns = [
      {
        regex: /(\d+)\s*(día|días|semana|semanas|mes|meses)/i,
        key: 'timeframe',
      },
      { regex: /esta\s*(semana|mes|año)/i, key: 'currentPeriod' },
      { regex: /próximo|siguiente/i, key: 'nextPeriod' },
    ];

    for (const { regex, key } of timePatterns) {
      const match = query.match(regex);
      if (match) entities[key] = match[0];
    }

    return entities;
  }

  private async handleProjectStatus(
    companyId: string,
    projectId?: string,
    _entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      let projects: Project[];

      if (projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: projectId, company_id: companyId },
          relations: ['budgets', 'budgets.stages', 'budgets.stages.items'],
        });
        projects = project ? [project] : [];
      } else {
        projects = await this.projectRepository.find({
          where: { company_id: companyId },
          relations: ['budgets', 'budgets.stages', 'budgets.stages.items'],
          order: { created_at: 'DESC' },
          take: 10,
        });
      }

      if (projects.length === 0) {
        return {
          answer: 'No tengo proyectos activos para mostrar.',
          confidence: 0.9,
          sources: [],
        };
      }

      const summaries = projects.map((p) => {
        const budget = p.budgets?.[0];
        let totalCost = 0;
        let totalExecuted = 0;
        let totalPrice = 0;
        let completedItems = 0;
        let totalItems = 0;

        if (budget?.stages?.length) {
          for (const stage of budget.stages) {
            if (stage.items) {
              for (const item of stage.items) {
                totalItems++;
                const qty = Number(item.quantity) || 0;
                const executed = Number(item.quantity_executed) || 0;
                const cost = Number(item.unit_cost) || 0;
                const price = Number(item.unit_price) || 0;

                totalCost += qty * cost;
                totalExecuted += executed * cost;
                totalPrice += qty * price;

                if (executed >= qty) completedItems++;
              }
            }
          }
        }

        const progress =
          totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        const executedPercentage =
          totalPrice > 0 ? (totalExecuted / totalPrice) * 100 : 0;

        return {
          name: p.name,
          status: p.status,
          progress: Math.round(progress),
          executed: Math.round(executedPercentage),
          startDate: p.start_date,
          endDate: p.end_date,
        };
      });

      const activeProjects = summaries.filter(
        (s) => s.status === 'in_progress',
      );
      const onTrack = summaries.filter((s) => s.progress > s.executed - 10);

      let answer = `Tienes ${summaries.length} proyecto(s). `;
      answer += `${activeProjects.length} están activos. `;
      if (onTrack.length > 0) {
        answer += `${onTrack.length} van según lo planeado.`;
      }

      return {
        answer,
        data: {
          projects: summaries,
          summary: { active: activeProjects.length, onTrack: onTrack.length },
        },
        sources: projects.map((p) => p.name),
        confidence: 0.85,
        actionable: true,
        suggestedActions:
          onTrack.length < summaries.length
            ? ['Revisar proyectos con desviación']
            : ['Continuar monitoreando'],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Tuve problemas al obtener el estado de los proyectos.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBudgetQuery(
    companyId: string,
    projectId?: string,
    budgetId?: string,
    _entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      let budgets: Budget[];

      if (budgetId) {
        const budget = await this.budgetRepository.findOne({
          where: { id: budgetId },
          relations: ['project', 'stages', 'stages.items'],
        });
        budgets = budget ? [budget] : [];
      } else if (projectId) {
        const budget = await this.budgetRepository.findOne({
          where: { project_id: projectId, is_active: true },
          relations: ['project', 'stages', 'stages.items'],
        });
        budgets = budget ? [budget] : [];
      } else {
        const projectIds = (
          await this.projectRepository.find({
            where: { company_id: companyId },
            select: ['id'],
            take: 5,
          })
        ).map((p) => p.id);

        budgets = await this.budgetRepository.find({
          where: { project_id: In(projectIds) },
          relations: ['project', 'stages', 'stages.items'],
          take: 5,
        });
      }

      if (budgets.length === 0) {
        return {
          answer: 'No encontré presupuestos.',
          confidence: 0.9,
          sources: [],
        };
      }

      const analysis = budgets.map((b) => {
        let totalEstimated = 0;
        let totalExecuted = 0;
        let totalPrice = 0;

        if (b.stages) {
          for (const stage of b.stages) {
            if (stage.items) {
              for (const item of stage.items) {
                const qty = Number(item.quantity) || 0;
                const executed = Number(item.quantity_executed) || 0;
                const cost = Number(item.unit_cost) || 0;
                const price = Number(item.unit_price) || 0;

                totalEstimated += qty * cost;
                totalExecuted += executed * cost;
                totalPrice += qty * price;
              }
            }
          }
        }

        const variance =
          totalPrice > 0
            ? ((totalExecuted - totalEstimated) / totalPrice) * 100
            : 0;

        return {
          project: b.project?.name || 'Sin proyecto',
          estimated: Math.round(totalEstimated),
          executed: Math.round(totalExecuted),
          price: Math.round(totalPrice),
          variance: Math.round(variance * 10) / 10,
          status:
            variance > 15 ? 'warning' : variance < -5 ? 'under' : 'on_track',
        };
      });

      const summary = analysis.reduce(
        (acc, b) => ({
          totalEstimated: acc.totalEstimated + b.estimated,
          totalExecuted: acc.totalExecuted + b.executed,
          totalPrice: acc.totalPrice + b.price,
        }),
        { totalEstimated: 0, totalExecuted: 0, totalPrice: 0 },
      );

      const avgVariance =
        summary.totalPrice > 0
          ? ((summary.totalExecuted - summary.totalEstimated) /
              summary.totalPrice) *
            100
          : 0;

      let answer = `Presupuesto total: $${summary.totalEstimated.toLocaleString()} estimado, $${summary.totalExecuted.toLocaleString()} ejecutado.`;
      if (avgVariance > 10) {
        answer += ' ⚠️ Hay sobrecostes significativos.';
      } else if (avgVariance < 0) {
        answer += ' 📉 Estás bajo presupuesto.';
      } else {
        answer += ' ✅ Todo dentro de lo previsto.';
      }

      return {
        answer,
        data: { budgets: analysis, summary },
        sources: analysis.map((b) => b.project),
        confidence: 0.9,
        actionable: true,
        suggestedActions:
          avgVariance > 10
            ? ['Analizar causas de sobrecoste']
            : avgVariance < 0
              ? ['Revisar estimación']
              : ['Mantener control'],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Error al consultar presupuestos.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleScheduleQuery(
    companyId: string,
    projectId?: string,
    _entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const whereCondition: any = { company_id: companyId };
      if (projectId) whereCondition.id = projectId;
      else whereCondition.status = 'in_progress';

      const projects = await this.projectRepository.find({
        where: whereCondition,
        take: 10,
      });

      if (!projects.length) {
        return {
          answer: 'No hay proyectos activos.',
          confidence: 0.9,
          sources: [],
        };
      }

      const today = new Date();
      const scheduleAnalysis = projects.map((p) => {
        const start = p.start_date ? new Date(p.start_date) : today;
        const end = p.end_date ? new Date(p.end_date) : today;
        const totalDays = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        const daysPassed = Math.floor(
          (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        const progress = Math.min(
          100,
          Math.max(0, totalDays > 0 ? (daysPassed / totalDays) * 100 : 0),
        );

        let status: 'on_track' | 'warning' | 'delayed' = 'on_track';
        if (progress > 110) status = 'delayed';
        else if (progress > 100) status = 'warning';

        const expectedEnd =
          totalDays > 0
            ? new Date(
                start.getTime() +
                  ((totalDays * 100) / Math.max(1, progress)) *
                    24 *
                    60 *
                    60 *
                    1000,
              )
            : end;
        const delayDays = Math.floor(
          (expectedEnd.getTime() - end.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          name: p.name,
          progress: Math.round(progress),
          status,
          expectedDelay: delayDays > 0 ? delayDays : 0,
          endDate: p.end_date,
        };
      });

      const delayed = scheduleAnalysis.filter(
        (s) => s.status === 'delayed',
      ).length;
      const warning = scheduleAnalysis.filter(
        (s) => s.status === 'warning',
      ).length;

      let answer = `${projects.length} proyectos activos. `;
      if (delayed > 0) answer += `${delayed} con retraso. `;
      if (warning > 0) answer += `${warning} en zona de riesgo.`;
      if (delayed === 0 && warning === 0)
        answer += ' Todos dentro del cronograma.';

      return {
        answer,
        data: { schedule: scheduleAnalysis },
        sources: projects.map((p) => p.name),
        confidence: 0.8,
        actionable: delayed + warning > 0,
        suggestedActions:
          delayed + warning > 0 ? ['Revisar cronogramas en riesgo'] : [],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Error al analizar cronograma.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleWorkersQuery(
    companyId: string,
    _projectId?: string,
  ): Promise<NLPQueryResult> {
    try {
      const workers = await this.workerRepository.find({
        where: { company_id: companyId },
      });

      if (!workers.length) {
        return {
          answer: 'No hay trabajadores registrados.',
          confidence: 0.9,
          sources: [],
        };
      }

      const avgRating =
        workers.reduce((sum, w) => sum + (w.rating || 0), 0) / workers.length;
      const avgRate =
        workers.reduce((sum, w) => sum + (Number(w.daily_rate) || 0), 0) /
        workers.length;
      const roles = [...new Set(workers.map((w) => w.role).filter(Boolean))];

      let answer = `Tienes ${workers.length} trabajador(es). `;
      answer += `Roles: ${roles.join(', ')}. `;
      answer += `Tarifa promedio: $${Math.round(avgRate)}/día. `;
      answer += `Calificación promedio: ${avgRating.toFixed(1)}/5.`;

      return {
        answer,
        data: {
          workers: workers.length,
          roles: roles.length,
          avgRate: Math.round(avgRate),
          avgRating: avgRating.toFixed(1),
        },
        sources: ['Workers'],
        confidence: 0.9,
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Error al consultar trabajadores.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  async generateRecommendations(
    companyId: string,
    projectId?: string,
  ): Promise<NLPQueryResult> {
    const insights: AIInsight[] = [];

    try {
      const whereCondition: any = {
        company_id: companyId,
        status: 'in_progress',
      };
      if (projectId) whereCondition.id = projectId;

      const projects = await this.projectRepository.find({
        where: whereCondition,
        relations: ['budgets', 'budgets.stages', 'budgets.stages.items'],
        take: 5,
      });

      for (const project of projects) {
        const budget = project.budgets?.[0];
        if (!budget) continue;

        let totalItems = 0;
        let completedItems = 0;
        let totalCost = 0;
        let executedCost = 0;

        if (budget.stages) {
          for (const stage of budget.stages) {
            if (stage.items) {
              for (const item of stage.items) {
                totalItems++;
                const qty = Number(item.quantity) || 0;
                const executed = Number(item.quantity_executed) || 0;
                const cost = Number(item.unit_cost) || 0;

                totalCost += qty * cost;
                executedCost += executed * cost;

                if (executed >= qty) completedItems++;
              }
            }
          }
        }

        const progress =
          totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        const budgetProgress =
          totalCost > 0 ? (executedCost / totalCost) * 100 : 0;

        if (budgetProgress > progress + 20) {
          insights.push({
            type: 'warning',
            title: `Sobrecoste en ${project.name}`,
            description: 'El gasto está superando el progreso físico.',
            confidence: 0.85,
            action: 'Revisar items con desviación',
            metric: {
              label: 'Desviación',
              value: Math.round(budgetProgress - progress),
              change: budgetProgress - progress,
            },
          });
        }

        if (progress > 80 && budget.status === 'editing') {
          insights.push({
            type: 'recommendation',
            title: `Finalizar presupuesto de ${project.name}`,
            description:
              'Proyecto avanzado, considera cerrar etapa de edición.',
            confidence: 0.9,
            action: 'Cambiar estado a completado',
          });
        }
      }

      if (insights.length === 0) {
        insights.push({
          type: 'opportunity',
          title: 'Todo en orden',
          description: 'No hay recomendaciones urgentes.',
          confidence: 0.95,
        });
      }

      return {
        answer: insights
          .map((i) => `• ${i.title}: ${i.description}`)
          .join('\n'),
        data: { insights },
        sources: [],
        confidence: 0.8,
        actionable: insights.some((i) => i.type === 'warning'),
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Error al generar recomendaciones.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  async predictProjectOutcome(
    companyId: string,
    projectId?: string,
  ): Promise<NLPQueryResult> {
    try {
      const whereCondition: any = {
        company_id: companyId,
        status: 'in_progress',
      };
      if (projectId) whereCondition.id = projectId;

      const projects = await this.projectRepository.find({
        where: whereCondition,
        relations: ['budgets', 'budgets.stages', 'budgets.stages.items'],
        take: 10,
      });

      if (!projects.length) {
        return {
          answer: 'No hay proyectos para predecir.',
          confidence: 0.9,
          sources: [],
        };
      }

      const predictions: ProjectRiskPrediction[] = projects.map((p) => {
        const budget = p.budgets?.[0];
        let progress = 0;
        let totalCost = 0;
        let executedCost = 0;
        let itemCount = 0;
        let completedItems = 0;

        if (budget?.stages) {
          for (const stage of budget.stages) {
            if (stage.items) {
              for (const item of stage.items) {
                itemCount++;
                const qty = Number(item.quantity) || 0;
                const executed = Number(item.quantity_executed) || 0;
                const cost = Number(item.unit_cost) || 0;

                totalCost += qty * cost;
                executedCost += executed * cost;

                if (executed >= qty) completedItems++;
              }
            }
          }
          if (itemCount > 0) progress = (completedItems / itemCount) * 100;
        }

        const costVariance =
          totalCost > 0 ? (executedCost - totalCost) / totalCost : 0;
        const scheduleVariance =
          progress > 0
            ? (executedCost / Math.max(1, totalCost)) * 100 - progress
            : 0;

        const factors: { name: string; impact: number; weight: number }[] = [];
        if (Math.abs(costVariance) > 0.1) {
          factors.push({
            name: 'Variación de costo',
            impact: Math.abs(costVariance) * 100,
            weight: 0.4,
          });
        }
        if (Math.abs(scheduleVariance) > 10) {
          factors.push({
            name: 'Variación de cronograma',
            impact: Math.abs(scheduleVariance),
            weight: 0.3,
          });
        }
        if (
          itemCount > 0 &&
          completedItems / itemCount < 0.5 &&
          progress > 50
        ) {
          factors.push({ name: 'Baja ejecución', impact: 20, weight: 0.3 });
        }

        const riskScore = factors.reduce(
          (sum, f) => sum + f.impact * f.weight,
          0,
        );

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (riskScore > 30) riskLevel = 'critical';
        else if (riskScore > 20) riskLevel = 'high';
        else if (riskScore > 10) riskLevel = 'medium';

        const predictedDelay = Math.round(riskScore * 0.5);
        const probability = Math.min(95, Math.round(riskScore * 2));

        const recommendations: string[] = [];
        if (riskLevel !== 'low') {
          recommendations.push('Revisar asignación de recursos');
          if (costVariance > 0)
            recommendations.push('Analizar causes de sobrecoste');
          if (scheduleVariance > 0) recommendations.push('Ajustar cronograma');
        }

        return {
          projectId: p.id,
          projectName: p.name,
          riskLevel,
          predictedDelay,
          probability,
          factors,
          recommendations,
        };
      });

      const highRisk = predictions.filter(
        (p) => p.riskLevel === 'high' || p.riskLevel === 'critical',
      );

      let answer = `Análisis de ${predictions.length} proyecto(s). `;
      if (highRisk.length > 0) {
        answer += `${highRisk.length} con riesgo alto. `;
        answer += `Predicción: hasta ${Math.max(...highRisk.map((p) => p.predictedDelay))} días de retraso.`;
      } else {
        answer += 'Todos los proyectos dentro de parámetros normales.';
      }

      return {
        answer,
        data: { predictions },
        sources: predictions.map((p) => p.projectName),
        confidence: 0.75,
        actionable: highRisk.length > 0,
        suggestedActions:
          highRisk.length > 0 ? ['Revisar proyectos de riesgo'] : [],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'Error al predecir resultados.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private handleGeneralQuery(
    _companyId: string,
    _projectId: string | undefined,
    query: string,
  ): NLPQueryResult {
    const keywords = query.toLowerCase();

    if (keywords.includes('ayuda')) {
      return {
        answer:
          'Puedo ayudarte con: estado de proyectos, presupuestos, cronograma, trabajadores, recomendaciones y predicciones. ¿Qué necesitas?',
        sources: [],
        confidence: 0.95,
      };
    }

    if (
      keywords.includes('hola') ||
      keywords.includes('buenos') ||
      keywords.includes('hello')
    ) {
      return {
        answer:
          '¡Hola! Soy tu asistente de construcción. Puedo analizar tus proyectos, presupuestos, cronograma y dar recomendaciones. ¿En qué puedo ayudarte?',
        sources: [],
        confidence: 0.95,
      };
    }

    return {
      answer:
        'No entendí tu pregunta. Puedo ayudarte con: estado de proyectos, presupuestos, cronograma, trabajadores, recomendaciones y predicciones.',
      sources: [],
      confidence: 0.6,
    };
  }

  async analyzeBudgetDeviation(budgetId: string): Promise<any> {
    try {
      const budget = await this.budgetRepository.findOne({
        where: { id: budgetId },
        relations: ['stages', 'stages.items'],
      });

      if (!budget) return null;

      const analysis = {
        totalEstimated: 0,
        totalExecuted: 0,
        variance: 0,
        items: [] as any[],
      };

      for (const stage of budget.stages || []) {
        for (const item of stage.items || []) {
          const estimated = Number(item.quantity) * Number(item.unit_cost);
          const executed =
            Number(item.quantity_executed) * Number(item.unit_cost);

          analysis.totalEstimated += estimated;
          analysis.totalExecuted += executed;

          if (executed > estimated * 1.1) {
            analysis.items.push({
              name: item.name,
              stage: stage.name,
              estimated,
              executed,
              variance: ((executed - estimated) / estimated) * 100,
            });
          }
        }
      }

      analysis.variance =
        analysis.totalEstimated > 0
          ? ((analysis.totalExecuted - analysis.totalEstimated) /
              analysis.totalEstimated) *
            100
          : 0;

      return analysis;
    } catch (error) {
      // Error logged internally
      return null;
    }
  }

  async analyzeBudgetWithAI(budgetId: string, prompt?: string): Promise<any> {
    if (!this.groqClient) {
      this.logger.warn(
        'Groq client not initialized - falling back to local analysis',
      );
      return this.analyzeBudgetDeviation(budgetId);
    }

    try {
      const budget = await this.budgetRepository.findOne({
        where: { id: budgetId },
        relations: ['project', 'stages', 'stages.items'],
      });

      if (!budget) {
        throw new Error('Presupuesto no encontrado');
      }

      let totalEstimated = 0;
      let totalExecuted = 0;
      const itemsData: any[] = [];

      for (const stage of budget.stages || []) {
        for (const item of stage.items || []) {
          const estimated = Number(item.quantity) * Number(item.unit_cost);
          const executed =
            Number(item.quantity_executed) * Number(item.unit_cost);
          totalEstimated += estimated;
          totalExecuted += executed;

          itemsData.push({
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

      const budgetSummary = {
        projectName: budget.project?.name || 'Sin proyecto',
        budgetId: budget.id,
        totalEstimated: Math.round(totalEstimated),
        totalExecuted: Math.round(totalExecuted),
        variance:
          totalEstimated > 0
            ? ((totalExecuted - totalEstimated) / totalEstimated) * 100
            : 0,
        items: itemsData,
      };

      const systemPrompt = `Eres un ingeniero civil experto en costos de construcción para Latinoamérica. 
Tu tarea es analizar presupuestos de obra y proporcionar insights técnicos precisos en formato JSON.

Analiza el siguiente presupuesto y devuelve un JSON con esta estructura exacta:
{
  "summary": "Resumen ejecutivo en 1-2 oraciones",
  "healthStatus": "healthy|warning|critical",
  "keyInsights": [
    {
      "type": "warning|opportunity|risk|recommendation",
      "title": "Título corto",
      "description": "Descripción detallada",
      "impact": "high|medium|low"
    }
  ],
  "varianceAnalysis": {
    "totalVariance": number,
    "overBudgetItems": number,
    "underBudgetItems": number,
    "criticalItems": []
  },
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ]
}

Responde ÚNICAMENTE con JSON válido, sin texto adicional.`;

      const userMessage =
        prompt ||
        `Analiza este presupuesto:
${JSON.stringify(budgetSummary, null, 2)}`;

      const model =
        this.configService.get<string>('AI_MODEL') || 'llama-3.1-70b-versatile';

      const completion = await this.groqClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      this.logger.log(`AI analysis completed for budget ${budgetId}`);

      return {
        ...parsed,
        budgetSummary: {
          projectName: budgetSummary.projectName,
          totalEstimated: budgetSummary.totalEstimated,
          totalExecuted: budgetSummary.totalExecuted,
          variance: budgetSummary.variance,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to analyze budget with AI: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al analizar presupuesto con IA. Por favor intenta más tarde.',
      );
    }
  }

  async generateProjectReport(
    projectId: string,
    type: 'executive' | 'financial' | 'technical',
  ): Promise<any> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: [
          'client',
          'budgets',
          'budgets.stages',
          'budgets.stages.items',
        ],
      });

      if (!project) return null;

      const report: any = {
        projectName: project.name,
        generatedAt: new Date().toISOString(),
        type,
        sections: [],
      };

      switch (type) {
        case 'executive':
          report.sections.push({
            title: 'Resumen Ejecutivo',
            content: `Proyecto ${project.name} - Estado: ${project.status}`,
          });
          break;
        case 'financial': {
          const financials =
            await this.financialService.getProjectSummary(projectId);
          report.sections.push({
            title: 'Análisis Financiero',
            content: financials,
          });
          break;
        }
        case 'technical': {
          report.sections.push({
            title: 'Resumen Técnico',
            content: `Ubicación: ${project.location || 'No especificada'}`,
          });
          break;
        }
      }

      return report;
    } catch (error) {
      // Error logged internally
      return null;
    }
  }

  // =====================================================
  // BIM INTELLIGENT QUERY HANDLERS
  // =====================================================

  private async handleBIMElementsQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const summary = await this.bimAnalyticsService.getBIMSummaryInsights(
        companyId,
        projectId,
      );

      // Extract specific IFC type from query
      const ifcTypeMatch = query?.match(
        /(ifc\w+|wall|slab|column|beam|door|window|stair)/i,
      );
      let specificType = ifcTypeMatch?.[1]?.toLowerCase();

      // Map common terms to IFC types
      const typeMapping: Record<string, string> = {
        wall: 'IfcWall',
        muro: 'IfcWall',
        slab: 'IfcSlab',
        losa: 'IfcSlab',
        column: 'IfcColumn',
        columna: 'IfcColumn',
        beam: 'IfcBeam',
        viga: 'IfcBeam',
        door: 'IfcDoor',
        puerta: 'IfcDoor',
        window: 'IfcWindow',
        ventana: 'IfcWindow',
        stair: 'IfcStair',
        escalera: 'IfcStair',
      };

      if (specificType && typeMapping[specificType]) {
        specificType = typeMapping[specificType];
      }

      if (specificType && specificType.startsWith('ifc')) {
        // Specific element type query
        const elements = await this.bimAnalyticsService.getBIMElements(
          companyId,
          {
            projectId,
            ifcType:
              specificType.charAt(0).toUpperCase() + specificType.slice(1),
          },
        );

        const totalVolume = elements.reduce(
          (sum, el) => sum + (el.quantities.netVolume || 0),
          0,
        );
        const totalArea = elements.reduce(
          (sum, el) => sum + (el.quantities.netArea || 0),
          0,
        );

        let answer = `Encontré ${elements.length} elementos ${specificType}. `;
        if (totalVolume > 0)
          answer += `Volumen total: ${totalVolume.toFixed(2)} m³. `;
        if (totalArea > 0) answer += `Área total: ${totalArea.toFixed(2)} m². `;

        return {
          answer,
          data: { elements: elements.slice(0, 10), totalVolume, totalArea },
          sources: ['BIM Model'],
          confidence: 0.95,
          actionable: true,
          suggestedActions:
            elements.length > 0
              ? ['Ver detalles de elementos', 'Generar reporte']
              : [],
        };
      }

      // General BIM elements summary
      let answer = `Tu modelo BIM tiene ${summary.totalElements} elementos. `;
      if (summary.totalVolume > 0)
        answer += `Volumen total: ${summary.totalVolume.toFixed(2)} m³. `;
      answer += `Progreso: ${summary.progressPercentage}%. `;
      answer += `Calidad: ${summary.qualityScore}%.`;

      if (summary.criticalIssues.length > 0) {
        answer += ` ⚠️ Problemas: ${summary.criticalIssues[0]}.`;
      }

      return {
        answer,
        data: summary,
        sources: ['BIM Model'],
        confidence: 0.9,
        actionable: summary.criticalIssues.length > 0,
        suggestedActions: summary.keyRecommendations,
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude analizar los elementos BIM. Verifica que tengas modelos cargados.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMClashesQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const clashAnalysis =
        await this.bimAnalyticsService.generateClashAnalysis(
          companyId,
          projectId,
        );

      // Check for specific severity or type queries
      const severityMatch = query?.match(
        /(critical|crítico|high|alto|medium|medio|low|bajo)/i,
      );
      const typeMatch = query?.match(
        /(hard|soft|clearance|estructural|instalaciones)/i,
      );

      let answer = `Tienes ${clashAnalysis.totalClashes} colisiones detectadas. `;

      if (clashAnalysis.criticalUnresolved > 0) {
        answer += `🚨 ${clashAnalysis.criticalUnresolved} CRÍTICAS sin resolver. `;
      }

      answer += `Resueltas: ${clashAnalysis.resolvedPercentage.toFixed(1)}%. `;

      if (clashAnalysis.avgResolutionTime > 0) {
        answer += `Tiempo promedio de resolución: ${clashAnalysis.avgResolutionTime.toFixed(1)} días.`;
      }

      // Specific filtering based on query
      if (severityMatch) {
        const severity = severityMatch[1].toLowerCase();
        const severityMap: Record<string, string> = {
          critical: 'critical',
          crítico: 'critical',
          high: 'high',
          alto: 'high',
          medium: 'medium',
          medio: 'medium',
          low: 'low',
          bajo: 'low',
        };

        const mappedSeverity = severityMap[severity];
        if (
          mappedSeverity &&
          clashAnalysis.bySeverity[
            mappedSeverity as keyof typeof clashAnalysis.bySeverity
          ] !== undefined
        ) {
          const count =
            clashAnalysis.bySeverity[
              mappedSeverity as keyof typeof clashAnalysis.bySeverity
            ];
          answer = `Colisiones ${severity}: ${count}.`;
        }
      }

      const actionable =
        clashAnalysis.criticalUnresolved > 0 ||
        clashAnalysis.resolvedPercentage < 80;
      const actions: string[] = [];

      if (clashAnalysis.criticalUnresolved > 0) {
        actions.push('Resolver colisiones críticas inmediatamente');
      }
      if (clashAnalysis.resolvedPercentage < 50) {
        actions.push('Asignar recursos para resolución de colisiones');
      }
      if (clashAnalysis.avgResolutionTime > 7) {
        actions.push('Optimizar proceso de resolución de colisiones');
      }

      return {
        answer,
        data: clashAnalysis,
        sources: ['BIM Clash Detection'],
        confidence: 0.95,
        actionable,
        suggestedActions: actions,
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude analizar las colisiones BIM. Ejecuta un análisis de colisiones primero.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMQuantitiesQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const costAnalysis = await this.bimAnalyticsService.generateCostAnalysis(
        companyId,
        projectId,
      );

      // Extract material type from query
      const materialMatch = query?.match(
        /(concreto|hormigón|concrete|acero|steel|madera|wood)/i,
      );

      if (materialMatch) {
        const material = materialMatch[1].toLowerCase();
        const materialTypes: Record<string, string[]> = {
          concreto: [
            'IfcSlab',
            'IfcWall',
            'IfcColumn',
            'IfcBeam',
            'IfcFooting',
          ],
          hormigón: [
            'IfcSlab',
            'IfcWall',
            'IfcColumn',
            'IfcBeam',
            'IfcFooting',
          ],
          concrete: [
            'IfcSlab',
            'IfcWall',
            'IfcColumn',
            'IfcBeam',
            'IfcFooting',
          ],
          acero: ['IfcBeam', 'IfcColumn'],
          steel: ['IfcBeam', 'IfcColumn'],
          madera: ['IfcBeam', 'IfcColumn'],
          wood: ['IfcBeam', 'IfcColumn'],
        };

        const relevantTypes = materialTypes[material] || [];
        const relevantAnalysis = costAnalysis.filter((ca) =>
          relevantTypes.includes(ca.ifcType),
        );

        const totalVolume = relevantAnalysis.reduce(
          (sum, ca) => sum + ca.totalVolume,
          0,
        );
        const totalCost = relevantAnalysis.reduce(
          (sum, ca) => sum + ca.totalCost,
          0,
        );

        let answer = `${material.toUpperCase()}: ${totalVolume.toFixed(2)} m³ planificados. `;
        if (totalCost > 0)
          answer += `Costo total: $${totalCost.toLocaleString()}. `;

        return {
          answer,
          data: {
            material,
            analysis: relevantAnalysis,
            totalVolume,
            totalCost,
          },
          sources: ['BIM Quantities'],
          confidence: 0.9,
          actionable: true,
          suggestedActions: [
            'Ver desglose por elemento',
            'Comparar con presupuesto',
          ],
        };
      }

      // General quantities summary
      const totalVolume = costAnalysis.reduce(
        (sum, ca) => sum + ca.totalVolume,
        0,
      );
      const totalArea = costAnalysis.reduce((sum, ca) => sum + ca.totalArea, 0);
      const totalCost = costAnalysis.reduce((sum, ca) => sum + ca.totalCost, 0);

      let answer = `Cantidades totales: ${totalVolume.toFixed(2)} m³, ${totalArea.toFixed(2)} m². `;
      if (totalCost > 0)
        answer += `Costo estimado: $${totalCost.toLocaleString()}. `;

      const topTypes = costAnalysis
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 3)
        .map((ca) => `${ca.ifcType}: ${ca.totalVolume.toFixed(1)}m³`)
        .join(', ');

      if (topTypes) answer += `Principales: ${topTypes}.`;

      return {
        answer,
        data: { costAnalysis, totalVolume, totalArea, totalCost },
        sources: ['BIM Quantities'],
        confidence: 0.9,
        actionable: true,
        suggestedActions: [
          'Ver análisis detallado por tipo',
          'Exportar cantidades',
        ],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude analizar las cantidades BIM. Verifica que tengas elementos con cubicación.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMStoreysQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const progressAnalysis =
        await this.bimAnalyticsService.generateProgressAnalysis(
          companyId,
          projectId,
        );

      // Extract specific storey from query
      const storeyMatch = query?.match(
        /(piso\s*\d+|planta\s*\d+|level\s*\d+|pB|pb|basement|sótano)/i,
      );

      if (storeyMatch) {
        const storeyQuery = storeyMatch[1];
        const storeyData = Object.entries(progressAnalysis.byStorey).find(
          ([storey]) =>
            storey.toLowerCase().includes(storeyQuery.toLowerCase()),
        );

        if (storeyData) {
          const [storeyName, data] = storeyData;
          let answer = `${storeyName}: ${data.total} elementos, ${data.percentage.toFixed(1)}% completado. `;
          if (data.volume > 0)
            answer += `Volumen: ${data.volume.toFixed(2)} m³.`;

          return {
            answer,
            data: { storey: storeyName, ...data },
            sources: ['BIM Progress'],
            confidence: 0.95,
            actionable: data.percentage < 80,
            suggestedActions:
              data.percentage < 50 ? ['Acelerar trabajo en este piso'] : [],
          };
        }
      }

      // General storeys summary
      const storeyCount = Object.keys(progressAnalysis.byStorey).length;
      const avgProgress =
        Object.values(progressAnalysis.byStorey).reduce(
          (sum, data) => sum + data.percentage,
          0,
        ) / storeyCount;

      const slowestStoreys = Object.entries(progressAnalysis.byStorey)
        .filter(([_, data]) => data.percentage < 50)
        .map(([storey]) => storey);

      let answer = `${storeyCount} pisos/niveles en el proyecto. Progreso promedio: ${avgProgress.toFixed(1)}%. `;

      if (slowestStoreys.length > 0) {
        answer += `⚠️ Pisos con retraso: ${slowestStoreys.join(', ')}.`;
      } else {
        answer += '✅ Todos los pisos van según cronograma.';
      }

      return {
        answer,
        data: {
          storeyCount,
          avgProgress,
          byStorey: progressAnalysis.byStorey,
          slowestStoreys,
        },
        sources: ['BIM Progress'],
        confidence: 0.9,
        actionable: slowestStoreys.length > 0,
        suggestedActions:
          slowestStoreys.length > 0
            ? ['Revisar recursos en pisos con retraso']
            : ['Mantener ritmo actual'],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude analizar el progreso por pisos. Verifica la asignación de elementos a niveles.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMDisciplinesQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const clashAnalysis =
        await this.bimAnalyticsService.generateClashAnalysis(
          companyId,
          projectId,
        );

      // Extract specific discipline from query
      const disciplineMatch = query?.match(
        /(arquitectura|architecture|estructura|structure|mep|hvac|plumbing|electrical)/i,
      );

      if (disciplineMatch) {
        const discipline = disciplineMatch[1].toLowerCase();
        const disciplineMap: Record<string, string> = {
          arquitectura: 'architecture',
          architecture: 'architecture',
          estructura: 'structure',
          structure: 'structure',
          mep: 'mep',
          hvac: 'mep_hvac',
          plumbing: 'mep_plumbing',
          electrical: 'mep_electrical',
        };

        const mappedDiscipline = disciplineMap[discipline];
        if (mappedDiscipline) {
          const disciplineClashes = Object.entries(clashAnalysis.byDiscipline)
            .filter(([key]) => key.includes(mappedDiscipline))
            .reduce((sum, [_, count]) => sum + count, 0);

          const answer = `Disciplina ${discipline}: ${disciplineClashes} colisiones detectadas.`;

          return {
            answer,
            data: { discipline: mappedDiscipline, clashes: disciplineClashes },
            sources: ['BIM Disciplines'],
            confidence: 0.9,
            actionable: disciplineClashes > 0,
            suggestedActions:
              disciplineClashes > 0
                ? [`Revisar colisiones en ${discipline}`]
                : [],
          };
        }
      }

      // General discipline analysis
      const disciplineStats = Object.entries(clashAnalysis.byDiscipline)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5);

      let answer = `Análisis por disciplinas: `;
      if (disciplineStats.length > 0) {
        const topClashes = disciplineStats
          .map(([disciplines, count]) => `${disciplines}: ${count}`)
          .join(', ');
        answer += topClashes + '.';
      } else {
        answer += 'No hay colisiones interdisciplinarias detectadas.';
      }

      return {
        answer,
        data: { byDiscipline: clashAnalysis.byDiscipline },
        sources: ['BIM Disciplines'],
        confidence: 0.85,
        actionable: disciplineStats.length > 0,
        suggestedActions:
          disciplineStats.length > 0
            ? ['Coordinar reunión interdisciplinaria']
            : [],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude analizar las disciplinas. Verifica que tengas modelos federados.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMQualityQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const qualityMetrics =
        await this.bimAnalyticsService.generateQualityMetrics(
          companyId,
          projectId,
        );

      let answer = `Calidad del modelo BIM: ${qualityMetrics.qualityScore.toFixed(1)}%. `;
      answer += `Completitud: ${qualityMetrics.modelCompleteness.toFixed(1)}%. `;
      answer += `Consistencia: ${qualityMetrics.dataConsistency.toFixed(1)}%. `;

      if (qualityMetrics.elementsWithIssues > 0) {
        answer += `⚠️ ${qualityMetrics.elementsWithIssues} elementos con problemas.`;
      }

      // Top issues
      const topIssues = qualityMetrics.commonIssues
        .filter(
          (issue) => issue.impact === 'high' || issue.impact === 'critical',
        )
        .slice(0, 3);

      if (topIssues.length > 0) {
        answer += ` Problemas principales: ${topIssues.map((i) => i.issue).join(', ')}.`;
      }

      const recommendations: string[] = [];
      if (qualityMetrics.qualityScore < 70) {
        recommendations.push('Mejorar calidad de datos del modelo');
      }
      if (qualityMetrics.modelCompleteness < 80) {
        recommendations.push('Completar información faltante');
      }
      if (qualityMetrics.dataConsistency < 80) {
        recommendations.push('Estandarizar nomenclatura de elementos');
      }

      return {
        answer,
        data: qualityMetrics,
        sources: ['BIM Quality Analysis'],
        confidence: 0.95,
        actionable: qualityMetrics.qualityScore < 80,
        suggestedActions: recommendations,
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'No pude analizar la calidad del modelo BIM.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMMaterialsQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const costAnalysis = await this.bimAnalyticsService.generateCostAnalysis(
        companyId,
        projectId,
      );

      // Material-specific analysis based on IFC types
      const materialMapping: Record<string, string[]> = {
        'Concreto/Hormigón': [
          'IfcSlab',
          'IfcWall',
          'IfcColumn',
          'IfcBeam',
          'IfcFooting',
        ],
        Acero: ['IfcBeam', 'IfcColumn'],
        Mampostería: ['IfcWall'],
        Madera: ['IfcBeam', 'IfcColumn'],
        Vidrio: ['IfcWindow', 'IfcCurtainWall'],
        Acabados: ['IfcCovering', 'IfcDoor'],
      };

      const materialAnalysis = Object.entries(materialMapping)
        .map(([material, ifcTypes]) => {
          const relevantAnalysis = costAnalysis.filter((ca) =>
            ifcTypes.includes(ca.ifcType),
          );
          return {
            material,
            volume: relevantAnalysis.reduce(
              (sum, ca) => sum + ca.totalVolume,
              0,
            ),
            area: relevantAnalysis.reduce((sum, ca) => sum + ca.totalArea, 0),
            cost: relevantAnalysis.reduce((sum, ca) => sum + ca.totalCost, 0),
            elements: relevantAnalysis.reduce(
              (sum, ca) => sum + ca.elementCount,
              0,
            ),
          };
        })
        .filter((ma) => ma.volume > 0 || ma.area > 0);

      if (materialAnalysis.length === 0) {
        return {
          answer: 'No encontré información de materiales en el modelo BIM.',
          confidence: 0.8,
          sources: [],
        };
      }

      // Sort by volume/cost
      materialAnalysis.sort((a, b) => b.volume + b.area - (a.volume + a.area));

      const topMaterial = materialAnalysis[0];
      const totalCost = materialAnalysis.reduce((sum, ma) => sum + ma.cost, 0);

      let answer = `Análisis de materiales: Material principal es ${topMaterial.material} `;
      if (topMaterial.volume > 0)
        answer += `(${topMaterial.volume.toFixed(2)} m³). `;
      if (topMaterial.area > 0)
        answer += `(${topMaterial.area.toFixed(2)} m²). `;

      if (totalCost > 0) {
        answer += `Costo total de materiales: $${totalCost.toLocaleString()}. `;
        const costShare = (topMaterial.cost / totalCost) * 100;
        answer += `${topMaterial.material} representa ${costShare.toFixed(1)}% del costo.`;
      }

      // Check for material optimization opportunities
      const optimizationTips: string[] = [];
      const highCostMaterials = materialAnalysis.filter(
        (ma) => ma.cost > totalCost * 0.3,
      );
      if (highCostMaterials.length > 0) {
        optimizationTips.push(
          `Evaluar alternativas para ${highCostMaterials.map((m) => m.material).join(', ')}`,
        );
      }

      return {
        answer,
        data: { materialAnalysis, totalCost },
        sources: ['BIM Materials Analysis'],
        confidence: 0.9,
        actionable: optimizationTips.length > 0,
        suggestedActions:
          optimizationTips.length > 0
            ? optimizationTips
            : ['Verificar especificaciones de materiales'],
      };
    } catch (error) {
      // Error logged internally
      return {
        answer: 'No pude analizar los materiales del modelo BIM.',
        confidence: 0.5,
        sources: [],
      };
    }
  }

  private async handleBIMOptimizationQuery(
    companyId: string,
    projectId?: string,
    query?: string,
    entities?: any,
  ): Promise<NLPQueryResult> {
    try {
      const optimization =
        await this.bimAnalyticsService.generateResourceOptimization(
          companyId,
          projectId,
        );

      let answer = 'Análisis de optimización BIM: ';

      // Material waste analysis
      if (optimization.materialWaste.length > 0) {
        const totalWaste = optimization.materialWaste.reduce(
          (sum, w) => sum + w.costImpact,
          0,
        );
        const highestWaste = optimization.materialWaste[0];

        answer += `Desperdicio detectado: $${totalWaste.toLocaleString()}. `;
        answer += `Mayor problema: ${highestWaste.type} (${highestWaste.wastePercentage.toFixed(1)}% desperdicio). `;
      }

      // Labor efficiency analysis
      if (optimization.laborEfficiency.length > 0) {
        const avgEfficiency =
          optimization.laborEfficiency.reduce(
            (sum, l) => sum + l.efficiency,
            0,
          ) / optimization.laborEfficiency.length;

        const inefficientZones = optimization.laborEfficiency.filter(
          (l) => l.efficiency < 80,
        );

        answer += `Eficiencia laboral promedio: ${avgEfficiency.toFixed(1)}%. `;
        if (inefficientZones.length > 0) {
          answer += `Zonas con baja eficiencia: ${inefficientZones.map((z) => z.zone).join(', ')}. `;
        }
      }

      // Equipment utilization
      if (optimization.equipmentUtilization.length > 0) {
        const overUtilized = optimization.equipmentUtilization.filter(
          (e) => e.utilization > 100,
        );
        const underUtilized = optimization.equipmentUtilization.filter(
          (e) => e.utilization < 70,
        );

        if (overUtilized.length > 0) {
          answer += `Equipos sobrecargados: ${overUtilized.map((e) => e.equipment).join(', ')}. `;
        }
        if (underUtilized.length > 0) {
          answer += `Equipos subutilizados: ${underUtilized.map((e) => e.equipment).join(', ')}. `;
        }
      }

      // Recommendations
      const recommendations = optimization.optimizationRecommendations;
      if (recommendations.length > 0) {
        answer += `💡 Recomendaciones principales: ${recommendations.slice(0, 2).join(', ')}.`;
      }

      const hasOptimizationOpportunities =
        optimization.materialWaste.length > 0 ||
        optimization.laborEfficiency.some((l) => l.efficiency < 85) ||
        optimization.equipmentUtilization.some(
          (e) => e.utilization < 70 || e.utilization > 110,
        );

      return {
        answer,
        data: optimization,
        sources: ['BIM Optimization Analysis'],
        confidence: 0.85,
        actionable: hasOptimizationOpportunities,
        suggestedActions: recommendations.slice(0, 3),
      };
    } catch (error) {
      // Error logged internally
      return {
        answer:
          'No pude generar análisis de optimización. Verifica que tengas suficientes datos.',
        confidence: 0.5,
        sources: [],
        suggestedActions: ['Asegurar integración BIM-presupuesto completa'],
      };
    }
  }
  /**
   * Genera una respuesta genérica usando el cliente de Groq
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    if (!this.groqClient) {
      throw new InternalServerErrorException(
        'AI Service not available (missing API Key)',
      );
    }

    try {
      const response = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              systemPrompt || 'Eres un asesor experto en SaaS y construcción.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error(`Error in generateResponse: ${error.message}`);
      throw new InternalServerErrorException('Error processing AI request');
    }
  }
}
