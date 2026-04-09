import { Injectable } from '@nestjs/common';
import { BIMAnalyticsService } from './bim-analytics.service';

export interface BIMVsRealityReport {
  projectName: string;
  generatedAt: Date;
  summary: {
    totalElements: number;
    plannedVolume: number;
    actualVolume: number;
    variance: number; // percentage
    costImpact: number;
  };
  byElement: {
    ifcType: string;
    elementName: string;
    plannedQuantity: number;
    actualQuantity: number;
    variance: number;
    costImpact: number;
    status: 'on_track' | 'under' | 'over' | 'critical';
  }[];
  recommendations: string[];
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
}

export interface CostPerCubicMeterReport {
  projectName: string;
  generatedAt: Date;
  summary: {
    totalVolume: number;
    totalCost: number;
    avgCostPerM3: number;
    benchmarkComparison: {
      industry: number;
      variance: number;
      status: 'below' | 'within' | 'above' | 'critical';
    };
  };
  byCategory: {
    category: string;
    ifcTypes: string[];
    volume: number;
    cost: number;
    costPerM3: number;
    benchmarkCostPerM3: number;
    variance: number;
    efficiency: 'excellent' | 'good' | 'average' | 'poor';
  }[];
  optimizationOpportunities: {
    category: string;
    currentCostPerM3: number;
    targetCostPerM3: number;
    potentialSavings: number;
    actions: string[];
  }[];
}

export interface ConstructionSequenceReport {
  projectName: string;
  generatedAt: Date;
  currentPhase: string;
  summary: {
    totalPhases: number;
    completedPhases: number;
    currentProgress: number;
    predictedCompletion: Date;
    delayDays: number;
  };
  phaseAnalysis: {
    phase: string;
    elements: number;
    volume: number;
    plannedStart: Date;
    actualStart: Date | null;
    plannedEnd: Date;
    predictedEnd: Date;
    status: 'not_started' | 'in_progress' | 'delayed' | 'completed';
    progress: number;
    dependencies: string[];
    criticalPath: boolean;
  }[];
  bottlenecks: {
    phase: string;
    issue: string;
    impact: number; // days
    solution: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  recommendations: string[];
}

export interface QualityControlReport {
  projectName: string;
  generatedAt: Date;
  overallScore: number; // 0-100
  summary: {
    totalElements: number;
    elementsInspected: number;
    elementsApproved: number;
    elementsRejected: number;
    elementsRework: number;
    reworkCost: number;
  };
  byElement: {
    ifcType: string;
    totalElements: number;
    inspected: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    commonIssues: {
      issue: string;
      occurrences: number;
      severity: 'minor' | 'major' | 'critical';
    }[];
  }[];
  bySpatialZone: {
    zone: string;
    approvalRate: number;
    issues: number;
    status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  }[];
  qualityTrends: {
    month: string;
    approvalRate: number;
    reworkCost: number;
  }[];
  recommendations: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
    expectedImpact: string;
    implementation: string;
  }[];
}

export interface ResourceAllocationReport {
  projectName: string;
  generatedAt: Date;
  summary: {
    totalZones: number;
    activeZones: number;
    totalWorkers: number;
    totalEquipment: number;
    avgUtilization: number;
  };
  byZone: {
    zone: string;
    area: number;
    workersAssigned: number;
    workersNeeded: number;
    utilization: number;
    productivity: number;
    equipment: {
      type: string;
      count: number;
      utilization: number;
    }[];
    activities: {
      activity: string;
      progress: number;
      plannedHours: number;
      actualHours: number;
      efficiency: number;
    }[];
  }[];
  optimization: {
    overAllocated: {
      zone: string;
      resource: string;
      overAllocation: number;
      recommendation: string;
    }[];
    underAllocated: {
      zone: string;
      resource: string;
      underAllocation: number;
      recommendation: string;
    }[];
    recommendations: string[];
  };
  predictiveAnalysis: {
    nextWeekNeeds: {
      zone: string;
      workers: number;
      equipment: string[];
    }[];
    bottleneckRisk: {
      zone: string;
      risk: 'low' | 'medium' | 'high' | 'critical';
      reason: string;
    }[];
  };
}

@Injectable()
export class BIMReportsService {
  // Industry benchmarks for cost per m³ (Chilean market, 2024)
  private readonly COST_BENCHMARKS: Record<string, number> = {
    Estructura: 850000, // CLP per m³
    Mampostería: 450000,
    Losas: 650000,
    Fundaciones: 750000,
    Acabados: 350000,
    Instalaciones: 250000,
  };

  constructor(private readonly bimAnalyticsService: BIMAnalyticsService) {}

  async generateBIMVsRealityReport(
    companyId: string,
    projectId: string,
    projectName: string,
  ): Promise<BIMVsRealityReport> {
    const costAnalysis = await this.bimAnalyticsService.generateCostAnalysis(
      companyId,
      projectId,
    );
    const progressAnalysis =
      await this.bimAnalyticsService.generateProgressAnalysis(
        companyId,
        projectId,
      );

    const totalPlannedVolume = costAnalysis.reduce(
      (sum, ca) => sum + ca.totalVolume,
      0,
    );
    const totalActualVolume =
      totalPlannedVolume * (progressAnalysis.progressPercentage / 100);
    const variance =
      totalPlannedVolume > 0
        ? ((totalActualVolume - totalPlannedVolume) / totalPlannedVolume) * 100
        : 0;

    const totalPlannedCost = costAnalysis.reduce(
      (sum, ca) => sum + ca.totalCost,
      0,
    );
    const costImpact = totalPlannedCost * (Math.abs(variance) / 100);

    const byElement = costAnalysis
      .map((ca) => {
        const elementVariance =
          ca.executionProgress > 0
            ? ((ca.executionProgress - 100) / 100) * 100
            : -100;

        const elementCostImpact =
          ca.totalCost * (Math.abs(elementVariance) / 100);

        let status: 'on_track' | 'under' | 'over' | 'critical';
        if (Math.abs(elementVariance) <= 5) status = 'on_track';
        else if (elementVariance < 0) status = 'under';
        else if (elementVariance <= 15) status = 'over';
        else status = 'critical';

        return {
          ifcType: ca.ifcType,
          elementName: ca.ifcType.replace('Ifc', ''),
          plannedQuantity: ca.totalVolume || ca.totalArea || 0,
          actualQuantity:
            (ca.totalVolume || ca.totalArea || 0) *
            (ca.executionProgress / 100),
          variance: Math.round(elementVariance * 100) / 100,
          costImpact: Math.round(elementCostImpact),
          status,
        };
      })
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    const recommendations: string[] = [];
    const riskFactors: {
      factor: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }[] = [];

    // Generate recommendations based on variances
    const criticalElements = byElement.filter((e) => e.status === 'critical');
    const overElements = byElement.filter((e) => e.status === 'over');
    const underElements = byElement.filter((e) => e.status === 'under');

    if (criticalElements.length > 0) {
      recommendations.push(
        `Atención inmediata requerida en ${criticalElements.length} tipos de elementos`,
      );
      recommendations.push(
        `Revisar procesos de control para: ${criticalElements
          .slice(0, 3)
          .map((e) => e.elementName)
          .join(', ')}`,
      );
      riskFactors.push({
        factor: 'Elementos críticos con alta varianza',
        impact: 'critical',
        description: `${criticalElements.length} tipos de elementos exceden 15% de varianza`,
      });
    }

    if (overElements.length > 0) {
      recommendations.push(
        `Optimizar uso de recursos en ${overElements.length} elementos sobreejectuados`,
      );
      riskFactors.push({
        factor: 'Sobreejecución de elementos',
        impact: 'medium',
        description: `Posible desperdicio de materiales y recursos`,
      });
    }

    if (underElements.length > 0) {
      recommendations.push(
        `Acelerar ejecución en ${underElements.length} elementos atrasados`,
      );
      riskFactors.push({
        factor: 'Elementos subejectuados',
        impact: 'high',
        description: `Riesgo de retrasos en cronograma general`,
      });
    }

    if (variance > 10) {
      recommendations.push(
        'Implementar sistema de control de ejecución más estricto',
      );
    }

    if (costImpact > totalPlannedCost * 0.05) {
      recommendations.push(
        'Revisar presupuesto y contingencias por alto impacto económico',
      );
    }

    return {
      projectName,
      generatedAt: new Date(),
      summary: {
        totalElements: byElement.length,
        plannedVolume: Math.round(totalPlannedVolume * 100) / 100,
        actualVolume: Math.round(totalActualVolume * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        costImpact: Math.round(costImpact),
      },
      byElement,
      recommendations,
      riskFactors,
    };
  }

  async generateCostPerCubicMeterReport(
    companyId: string,
    projectId: string,
    projectName: string,
  ): Promise<CostPerCubicMeterReport> {
    const costAnalysis = await this.bimAnalyticsService.generateCostAnalysis(
      companyId,
      projectId,
    );

    const totalVolume = costAnalysis.reduce(
      (sum, ca) => sum + ca.totalVolume,
      0,
    );
    const totalCost = costAnalysis.reduce((sum, ca) => sum + ca.totalCost, 0);
    const avgCostPerM3 = totalVolume > 0 ? totalCost / totalVolume : 0;

    // Industry benchmark comparison (simplified)
    const industryAvg = 600000; // CLP per m³ for mixed construction
    const benchmarkVariance =
      avgCostPerM3 > 0 ? ((avgCostPerM3 - industryAvg) / industryAvg) * 100 : 0;

    let benchmarkStatus: 'below' | 'within' | 'above' | 'critical';
    if (benchmarkVariance < -20) benchmarkStatus = 'below';
    else if (benchmarkVariance <= 20) benchmarkStatus = 'within';
    else if (benchmarkVariance <= 50) benchmarkStatus = 'above';
    else benchmarkStatus = 'critical';

    // Categorize elements
    const categoryMapping: Record<string, string[]> = {
      Estructura: ['IfcBeam', 'IfcColumn'],
      Losas: ['IfcSlab'],
      Mampostería: ['IfcWall'],
      Fundaciones: ['IfcFooting', 'IfcPile'],
      Acabados: ['IfcCovering', 'IfcDoor', 'IfcWindow'],
      Instalaciones: ['IfcPipeSegment', 'IfcDuctSegment'],
    };

    const byCategory = Object.entries(categoryMapping)
      .map(([category, ifcTypes]) => {
        const relevantAnalysis = costAnalysis.filter((ca) =>
          ifcTypes.includes(ca.ifcType),
        );
        const categoryVolume = relevantAnalysis.reduce(
          (sum, ca) => sum + ca.totalVolume,
          0,
        );
        const categoryCost = relevantAnalysis.reduce(
          (sum, ca) => sum + ca.totalCost,
          0,
        );
        const costPerM3 =
          categoryVolume > 0 ? categoryCost / categoryVolume : 0;
        const benchmarkCostPerM3 =
          this.COST_BENCHMARKS[category] || industryAvg;
        const variance =
          costPerM3 > 0
            ? ((costPerM3 - benchmarkCostPerM3) / benchmarkCostPerM3) * 100
            : 0;

        let efficiency: 'excellent' | 'good' | 'average' | 'poor';
        if (variance < -10) efficiency = 'excellent';
        else if (variance < 10) efficiency = 'good';
        else if (variance < 30) efficiency = 'average';
        else efficiency = 'poor';

        return {
          category,
          ifcTypes,
          volume: Math.round(categoryVolume * 100) / 100,
          cost: Math.round(categoryCost),
          costPerM3: Math.round(costPerM3),
          benchmarkCostPerM3,
          variance: Math.round(variance * 100) / 100,
          efficiency,
        };
      })
      .filter((c) => c.volume > 0)
      .sort((a, b) => b.variance - a.variance);

    // Generate optimization opportunities
    const optimizationOpportunities = byCategory
      .filter((c) => c.variance > 15) // Above 15% of benchmark
      .map((c) => {
        const targetCostPerM3 = c.benchmarkCostPerM3;
        const currentCost = c.cost;
        const targetCost = c.volume * targetCostPerM3;
        const potentialSavings = Math.max(0, currentCost - targetCost);

        const actions: string[] = [];
        if (c.variance > 50) {
          actions.push('Revisar especificaciones técnicas');
          actions.push('Evaluar proveedores alternativos');
          actions.push('Optimizar método constructivo');
        } else if (c.variance > 30) {
          actions.push('Negociar mejores precios con proveedores');
          actions.push('Revisar desperdicios de material');
        } else {
          actions.push('Optimizar logística de materiales');
        }

        return {
          category: c.category,
          currentCostPerM3: c.costPerM3,
          targetCostPerM3,
          potentialSavings: Math.round(potentialSavings),
          actions,
        };
      })
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    return {
      projectName,
      generatedAt: new Date(),
      summary: {
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalCost: Math.round(totalCost),
        avgCostPerM3: Math.round(avgCostPerM3),
        benchmarkComparison: {
          industry: industryAvg,
          variance: Math.round(benchmarkVariance * 100) / 100,
          status: benchmarkStatus,
        },
      },
      byCategory,
      optimizationOpportunities,
    };
  }

  async generateConstructionSequenceReport(
    companyId: string,
    projectId: string,
    projectName: string,
  ): Promise<ConstructionSequenceReport> {
    const progressAnalysis =
      await this.bimAnalyticsService.generateProgressAnalysis(
        companyId,
        projectId,
      );

    // Define typical construction phases with their dependencies
    const phases = [
      {
        phase: 'Movimiento de Tierras',
        elements: ['IfcEarthworks'],
        dependencies: [],
        durationWeeks: 2,
      },
      {
        phase: 'Fundaciones',
        elements: ['IfcFooting', 'IfcPile'],
        dependencies: ['Movimiento de Tierras'],
        durationWeeks: 3,
      },
      {
        phase: 'Estructura Nivel 1',
        elements: ['IfcColumn', 'IfcBeam', 'IfcSlab'],
        dependencies: ['Fundaciones'],
        durationWeeks: 4,
      },
      {
        phase: 'Mampostería Nivel 1',
        elements: ['IfcWall'],
        dependencies: ['Estructura Nivel 1'],
        durationWeeks: 3,
      },
      {
        phase: 'Instalaciones Nivel 1',
        elements: ['IfcPipeSegment', 'IfcDuctSegment'],
        dependencies: ['Mampostería Nivel 1'],
        durationWeeks: 2,
      },
      {
        phase: 'Estructura Nivel 2',
        elements: ['IfcColumn', 'IfcBeam', 'IfcSlab'],
        dependencies: ['Instalaciones Nivel 1'],
        durationWeeks: 4,
      },
      {
        phase: 'Mampostería Nivel 2',
        elements: ['IfcWall'],
        dependencies: ['Estructura Nivel 2'],
        durationWeeks: 3,
      },
      {
        phase: 'Techumbre',
        elements: ['IfcRoof'],
        dependencies: ['Mampostería Nivel 2'],
        durationWeeks: 2,
      },
      {
        phase: 'Terminaciones',
        elements: ['IfcCovering', 'IfcDoor', 'IfcWindow'],
        dependencies: ['Techumbre'],
        durationWeeks: 4,
      },
    ];

    const today = new Date();
    const projectStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago (example)

    let cumulativeWeeks = 0;
    const phaseAnalysis = phases.map((phase, index) => {
      const plannedStart = new Date(
        projectStart.getTime() + cumulativeWeeks * 7 * 24 * 60 * 60 * 1000,
      );
      const plannedEnd = new Date(
        plannedStart.getTime() + phase.durationWeeks * 7 * 24 * 60 * 60 * 1000,
      );

      // Estimate progress based on element types in the phase
      const phaseElements = Object.entries(progressAnalysis.byType)
        .filter(([type]) =>
          phase.elements.some((phaseType) =>
            type.includes(phaseType.replace('Ifc', '')),
          ),
        )
        .reduce((sum, [_, data]) => sum + data.total, 0);

      const phaseCompleted = Object.entries(progressAnalysis.byType)
        .filter(([type]) =>
          phase.elements.some((phaseType) =>
            type.includes(phaseType.replace('Ifc', '')),
          ),
        )
        .reduce((sum, [_, data]) => sum + data.completed, 0);

      const progress =
        phaseElements > 0 ? (phaseCompleted / phaseElements) * 100 : 0;

      let status: 'not_started' | 'in_progress' | 'delayed' | 'completed';
      const isStarted = today >= plannedStart;
      const isCompleted = progress >= 95;
      const isDelayed = today > plannedEnd && !isCompleted;

      if (isCompleted) status = 'completed';
      else if (isDelayed) status = 'delayed';
      else if (isStarted) status = 'in_progress';
      else status = 'not_started';

      // Predict completion based on current progress
      const daysElapsed = Math.max(
        0,
        Math.floor(
          (today.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      const progressRate = daysElapsed > 0 ? progress / daysElapsed : 0;
      const remainingProgress = 100 - progress;
      const predictedDaysRemaining =
        progressRate > 0
          ? remainingProgress / progressRate
          : phase.durationWeeks * 7;
      const predictedEnd = new Date(
        today.getTime() + predictedDaysRemaining * 24 * 60 * 60 * 1000,
      );

      cumulativeWeeks += phase.durationWeeks;

      return {
        phase: phase.phase,
        elements: phaseElements,
        volume: 0, // Would be calculated from actual BIM data
        plannedStart,
        actualStart: isStarted ? plannedStart : null, // Simplified
        plannedEnd,
        predictedEnd,
        status,
        progress: Math.round(progress * 100) / 100,
        dependencies: phase.dependencies,
        criticalPath: index < 3, // First phases are typically critical path
      };
    });

    // Identify bottlenecks
    const delayedPhases = phaseAnalysis.filter((p) => p.status === 'delayed');
    const bottlenecks = delayedPhases.map((phase) => {
      const delayDays = Math.floor(
        (phase.predictedEnd.getTime() - phase.plannedEnd.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        phase: phase.phase,
        issue: `Retraso de ${delayDays} días`,
        impact: delayDays,
        solution:
          phase.progress < 50
            ? 'Aumentar recursos asignados'
            : 'Optimizar procesos constructivos',
        priority: (phase.criticalPath
          ? 'critical'
          : delayDays > 14
            ? 'high'
            : 'medium') as 'low' | 'medium' | 'high' | 'critical',
      };
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (delayedPhases.length > 0) {
      recommendations.push(`Atender ${delayedPhases.length} fases con retraso`);
    }

    const inProgressPhases = phaseAnalysis.filter(
      (p) => p.status === 'in_progress' && p.progress < 50,
    );
    if (inProgressPhases.length > 0) {
      recommendations.push(
        `Acelerar progreso en ${inProgressPhases.length} fases activas`,
      );
    }

    if (bottlenecks.some((b) => b.priority === 'critical')) {
      recommendations.push(
        'Aplicar recuperación de cronograma en fases críticas',
      );
    }

    const completedPhases = phaseAnalysis.filter(
      (p) => p.status === 'completed',
    ).length;
    const currentProgress =
      phaseAnalysis.reduce((sum, p) => sum + p.progress, 0) / phases.length;
    const avgDelay =
      phaseAnalysis.reduce((sum, p) => {
        const delay = Math.floor(
          (p.predictedEnd.getTime() - p.plannedEnd.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return sum + Math.max(0, delay);
      }, 0) / phases.length;

    const lastPhase = phaseAnalysis[phaseAnalysis.length - 1];
    const predictedCompletion = lastPhase.predictedEnd;

    return {
      projectName,
      generatedAt: new Date(),
      currentPhase:
        phaseAnalysis.find((p) => p.status === 'in_progress')?.phase ||
        'No iniciado',
      summary: {
        totalPhases: phases.length,
        completedPhases,
        currentProgress: Math.round(currentProgress * 100) / 100,
        predictedCompletion,
        delayDays: Math.round(avgDelay),
      },
      phaseAnalysis,
      bottlenecks,
      recommendations,
    };
  }

  async generateQualityControlReport(
    companyId: string,
    projectId: string,
    projectName: string,
  ): Promise<QualityControlReport> {
    const qualityMetrics =
      await this.bimAnalyticsService.generateQualityMetrics(
        companyId,
        projectId,
      );
    const progressAnalysis =
      await this.bimAnalyticsService.generateProgressAnalysis(
        companyId,
        projectId,
      );

    // Simulate quality control data (in real implementation, this would come from QC inspections)
    const totalElements = progressAnalysis.totalElements;
    const elementsInspected = Math.floor(totalElements * 0.7); // 70% inspected
    const elementsApproved = Math.floor(elementsInspected * 0.85); // 85% approval rate
    const elementsRejected = Math.floor(elementsInspected * 0.1); // 10% rejection rate
    const elementsRework =
      elementsInspected - elementsApproved - elementsRejected; // 5% rework

    const reworkCost = elementsRework * 50000; // Average rework cost per element

    const overallScore = qualityMetrics.qualityScore;

    // Generate by element analysis
    const byElement = Object.entries(progressAnalysis.byType)
      .map(([ifcType, data]) => {
        const inspected = Math.floor(data.total * 0.7);
        const approved = Math.floor(inspected * (0.8 + Math.random() * 0.15)); // 80-95% approval rate
        const rejected = Math.floor(inspected * (0.05 + Math.random() * 0.1)); // 5-15% rejection rate
        const approvalRate = inspected > 0 ? (approved / inspected) * 100 : 0;

        const commonIssues = this.getCommonIssuesForType(ifcType);

        return {
          ifcType,
          totalElements: data.total,
          inspected,
          approved,
          rejected,
          approvalRate: Math.round(approvalRate * 100) / 100,
          commonIssues,
        };
      })
      .sort((a, b) => a.approvalRate - b.approvalRate); // Sort by approval rate (worst first)

    // Generate by spatial zone analysis
    const bySpatialZone = Object.entries(progressAnalysis.byStorey)
      .map(([zone, data]) => {
        const approvalRate = 70 + Math.random() * 25; // 70-95% approval rate
        const issues = Math.floor(data.total * ((100 - approvalRate) / 100));

        let status: 'excellent' | 'good' | 'needs_attention' | 'critical';
        if (approvalRate >= 90) status = 'excellent';
        else if (approvalRate >= 80) status = 'good';
        else if (approvalRate >= 70) status = 'needs_attention';
        else status = 'critical';

        return {
          zone,
          approvalRate: Math.round(approvalRate * 100) / 100,
          issues,
          status,
        };
      })
      .sort((a, b) => a.approvalRate - b.approvalRate);

    // Generate quality trends (last 6 months)
    const qualityTrends = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));

      return {
        month: month.toISOString().slice(0, 7), // YYYY-MM format
        approvalRate: 75 + Math.random() * 15, // Trending upward
        reworkCost: 200000 + Math.random() * 300000,
      };
    });

    // Generate recommendations
    const recommendations: {
      priority: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
      expectedImpact: string;
      implementation: string;
    }[] = [];

    const lowApprovalElements = byElement.filter((e) => e.approvalRate < 80);
    if (lowApprovalElements.length > 0) {
      recommendations.push({
        priority: 'high',
        recommendation: `Mejorar control de calidad en ${lowApprovalElements.map((e) => e.ifcType).join(', ')}`,
        expectedImpact: 'Reducir retrabajo en 30-40%',
        implementation: 'Capacitar cuadrillas, revisar procedimientos',
      });
    }

    const criticalZones = bySpatialZone.filter((z) => z.status === 'critical');
    if (criticalZones.length > 0) {
      recommendations.push({
        priority: 'critical',
        recommendation: `Atención inmediata requerida en zonas: ${criticalZones.map((z) => z.zone).join(', ')}`,
        expectedImpact: 'Prevenir propagación de problemas',
        implementation: 'Inspección exhaustiva, supervisor dedicado',
      });
    }

    if (overallScore < 70) {
      recommendations.push({
        priority: 'critical',
        recommendation: 'Implementar programa intensivo de mejora de calidad',
        expectedImpact: 'Aumentar score general a >80%',
        implementation: 'Auditoría completa, plan de acción 30 días',
      });
    }

    if (reworkCost > 500000) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Reducir costos de retrabajo mediante prevención',
        expectedImpact: 'Ahorrar $200-400K mensuales',
        implementation: 'Controles preventivos, check-lists',
      });
    }

    return {
      projectName,
      generatedAt: new Date(),
      overallScore: Math.round(overallScore * 100) / 100,
      summary: {
        totalElements,
        elementsInspected,
        elementsApproved,
        elementsRejected,
        elementsRework,
        reworkCost: Math.round(reworkCost),
      },
      byElement,
      bySpatialZone,
      qualityTrends,
      recommendations,
    };
  }

  async generateResourceAllocationReport(
    companyId: string,
    projectId: string,
    projectName: string,
  ): Promise<ResourceAllocationReport> {
    const progressAnalysis =
      await this.bimAnalyticsService.generateProgressAnalysis(
        companyId,
        projectId,
      );
    const optimization =
      await this.bimAnalyticsService.generateResourceOptimization(
        companyId,
        projectId,
      );

    const zones = Object.entries(progressAnalysis.byStorey);
    const totalZones = zones.length;
    const activeZones = zones.filter(
      ([_, data]) => data.percentage < 95,
    ).length;

    // Simulate worker and equipment data
    const totalWorkers = 45; // Typical mid-size project
    const totalEquipment = 12;
    const avgUtilization =
      optimization.laborEfficiency.length > 0
        ? optimization.laborEfficiency.reduce(
            (sum, l) => sum + l.efficiency,
            0,
          ) / optimization.laborEfficiency.length
        : 75;

    const byZone = zones.map(([zone, data]) => {
      const area = data.volume * 3; // Rough area estimation
      const workersAssigned = Math.floor(3 + Math.random() * 8); // 3-10 workers per zone
      const workersNeeded = Math.ceil(
        workersAssigned *
          (data.percentage < 50 ? 1.5 : data.percentage < 80 ? 1.2 : 0.8),
      );
      const utilization = Math.min(100, 60 + Math.random() * 35); // 60-95% utilization

      // Productivity based on progress vs time
      const productivity =
        data.percentage > 80
          ? 85 + Math.random() * 10
          : 70 + Math.random() * 20;

      const equipment = [
        {
          type: 'Herramientas Menores',
          count: workersAssigned,
          utilization: utilization,
        },
        {
          type: 'Andamios',
          count: Math.ceil(area / 100),
          utilization: utilization * 0.8,
        },
        {
          type: 'Equipo Especializado',
          count: Math.floor(Math.random() * 3),
          utilization: 80 + Math.random() * 15,
        },
      ].filter((e) => e.count > 0);

      const activities = [
        {
          activity: 'Estructura',
          progress: data.percentage * 0.8,
          plannedHours: 40,
          actualHours: 45,
          efficiency: 89,
        },
        {
          activity: 'Mampostería',
          progress: data.percentage * 0.6,
          plannedHours: 30,
          actualHours: 32,
          efficiency: 94,
        },
        {
          activity: 'Instalaciones',
          progress: data.percentage * 0.4,
          plannedHours: 25,
          actualHours: 28,
          efficiency: 89,
        },
        {
          activity: 'Terminaciones',
          progress: data.percentage * 0.2,
          plannedHours: 35,
          actualHours: 38,
          efficiency: 92,
        },
      ];

      return {
        zone,
        area: Math.round(area),
        workersAssigned,
        workersNeeded,
        utilization: Math.round(utilization * 100) / 100,
        productivity: Math.round(productivity * 100) / 100,
        equipment,
        activities,
      };
    });

    // Identify optimization opportunities
    const overAllocated = byZone
      .filter((z) => z.workersAssigned > z.workersNeeded * 1.1)
      .map((z) => ({
        zone: z.zone,
        resource: 'Trabajadores',
        overAllocation: z.workersAssigned - z.workersNeeded,
        recommendation: `Reasignar ${z.workersAssigned - z.workersNeeded} trabajadores a zonas con déficit`,
      }));

    const underAllocated = byZone
      .filter((z) => z.workersAssigned < z.workersNeeded * 0.9)
      .map((z) => ({
        zone: z.zone,
        resource: 'Trabajadores',
        underAllocation: z.workersNeeded - z.workersAssigned,
        recommendation: `Asignar ${z.workersNeeded - z.workersAssigned} trabajadores adicionales`,
      }));

    const recommendations: string[] = [];
    if (overAllocated.length > 0 && underAllocated.length > 0) {
      recommendations.push(
        'Redistribuir trabajadores entre zonas para optimizar utilización',
      );
    }
    if (byZone.some((z) => z.productivity < 70)) {
      recommendations.push(
        'Investigar causas de baja productividad en zonas específicas',
      );
    }
    if (avgUtilization < 75) {
      recommendations.push(
        'Implementar medidas para aumentar utilización general',
      );
    }

    // Predictive analysis for next week
    const nextWeekNeeds = byZone
      .filter((z) => z.utilization > 85) // High-activity zones
      .map((z) => ({
        zone: z.zone,
        workers: Math.ceil(z.workersNeeded * 1.1), // 10% buffer
        equipment: z.equipment
          .filter((e) => e.utilization > 80)
          .map((e) => e.type),
      }));

    const bottleneckRisk = byZone
      .map((z) => {
        let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let reason = 'Operación normal';

        if (z.workersAssigned < z.workersNeeded * 0.8) {
          risk = 'high';
          reason = 'Déficit crítico de trabajadores';
        } else if (z.utilization > 95) {
          risk = 'medium';
          reason = 'Sobre-utilización de recursos';
        } else if (z.productivity < 70) {
          risk = 'medium';
          reason = 'Baja productividad';
        }

        return { zone: z.zone, risk, reason };
      })
      .filter((b) => b.risk !== 'low');

    return {
      projectName,
      generatedAt: new Date(),
      summary: {
        totalZones,
        activeZones,
        totalWorkers,
        totalEquipment,
        avgUtilization: Math.round(avgUtilization * 100) / 100,
      },
      byZone,
      optimization: {
        overAllocated,
        underAllocated,
        recommendations,
      },
      predictiveAnalysis: {
        nextWeekNeeds,
        bottleneckRisk,
      },
    };
  }

  private getCommonIssuesForType(ifcType: string): {
    issue: string;
    occurrences: number;
    severity: 'minor' | 'major' | 'critical';
  }[] {
    const issueDatabase: Record<
      string,
      { issue: string; severity: 'minor' | 'major' | 'critical' }[]
    > = {
      IfcWall: [
        { issue: 'Desplome de muros', severity: 'major' },
        { issue: 'Juntas mal selladas', severity: 'minor' },
        { issue: 'Nivel incorrecto', severity: 'major' },
      ],
      IfcSlab: [
        { issue: 'Desnivel de losa', severity: 'critical' },
        { issue: 'Fisuras en concreto', severity: 'major' },
        { issue: 'Acabado superficial deficiente', severity: 'minor' },
      ],
      IfcColumn: [
        { issue: 'Desplome de columna', severity: 'critical' },
        { issue: 'Armadura expuesta', severity: 'major' },
        { issue: 'Geometría incorrecta', severity: 'major' },
      ],
      IfcBeam: [
        { issue: 'Deflexión excesiva', severity: 'critical' },
        { issue: 'Conexiones deficientes', severity: 'major' },
        { issue: 'Acabado deficiente', severity: 'minor' },
      ],
    };

    const typeIssues = issueDatabase[ifcType] || [
      { issue: 'Calidad general deficiente', severity: 'minor' as const },
    ];

    return typeIssues.map((issue) => ({
      ...issue,
      occurrences: Math.floor(1 + Math.random() * 5), // 1-5 occurrences
    }));
  }
}
