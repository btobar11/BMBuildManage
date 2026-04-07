import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Worker } from '../workers/worker.entity';
import { FinancialService } from '../budgets/financial.service';

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
  ) {}

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
      console.error('Error in handleProjectStatus:', error);
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
      console.error('Error in handleBudgetQuery:', error);
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
      console.error('Error in handleScheduleQuery:', error);
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
      console.error('Error in handleWorkersQuery:', error);
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
      console.error('Error in generateRecommendations:', error);
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
      console.error('Error in predictProjectOutcome:', error);
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
      console.error('Error in analyzeBudgetDeviation:', error);
      return null;
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
      console.error('Error in generateProjectReport:', error);
      return null;
    }
  }
}
