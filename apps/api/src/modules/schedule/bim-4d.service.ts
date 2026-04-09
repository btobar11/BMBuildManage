import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  BIMScheduleElement,
  BIM4DSnapshot,
  BIMScheduleTemplate,
} from './bim-schedule.entity';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Create4DScheduleDto {
  project_id: string;
  elements: {
    ifc_global_id: string;
    activity_name: string;
    activity_description?: string;
    planned_start: Date;
    planned_finish: Date;
    construction_phase: string;
    work_package?: string;
    sequence_order?: number;
    dependencies?: {
      predecessors: string[];
      successors: string[];
    };
    resources?: any;
    planned_cost?: number;
  }[];
}

export interface Update4DProgressDto {
  schedule_element_id: string;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';
  actual_start?: Date;
  actual_finish?: Date;
  actual_cost?: number;
  notes?: string;
}

export interface Create4DSnapshotDto {
  project_id: string;
  snapshot_date: Date;
  snapshot_name?: string;
  description?: string;
  camera_position?: {
    x: number;
    y: number;
    z: number;
    target_x: number;
    target_y: number;
    target_z: number;
    zoom: number;
  };
}

export interface Schedule4DAnalysis {
  project_id: string;
  analysis_date: Date;
  overall_progress: number;
  schedule_performance: {
    on_track: number;
    delayed: number;
    ahead: number;
    total_activities: number;
  };
  critical_path: {
    activities: BIMScheduleElement[];
    total_duration_days: number;
    delays_days: number;
  };
  phases: {
    phase: string;
    progress: number;
    elements_count: number;
    planned_start: Date;
    planned_finish: Date;
    actual_start?: Date;
    predicted_finish: Date;
    variance_days: number;
    status: 'not_started' | 'in_progress' | 'delayed' | 'completed';
  }[];
  resource_utilization: {
    date: Date;
    workers_planned: number;
    workers_actual: number;
    equipment_utilization: number;
    cost_performance: number;
  }[];
  risks: {
    activity_id: string;
    activity_name: string;
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
    status: 'active' | 'mitigated' | 'occurred';
  }[];
  recommendations: string[];
}

@Injectable()
export class BIM4DService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(BIMScheduleElement)
    private readonly scheduleElementRepository: Repository<BIMScheduleElement>,
    @InjectRepository(BIM4DSnapshot)
    private readonly snapshotRepository: Repository<BIM4DSnapshot>,
    @InjectRepository(BIMScheduleTemplate)
    private readonly templateRepository: Repository<BIMScheduleTemplate>,
    private readonly dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') ||
        process.env.SUPABASE_URL ||
        '',
      this.configService.get<string>('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );
  }

  async create4DSchedule(
    companyId: string,
    data: Create4DScheduleDto,
  ): Promise<BIMScheduleElement[]> {
    const scheduleElements: BIMScheduleElement[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const element of data.elements) {
        const scheduleElement = new BIMScheduleElement();
        scheduleElement.id = crypto.randomUUID();
        scheduleElement.company_id = companyId;
        scheduleElement.project_id = data.project_id;
        scheduleElement.ifc_global_id = element.ifc_global_id;
        scheduleElement.schedule_activity_id = `act_${scheduleElement.id}`;
        scheduleElement.activity_name = element.activity_name;
        scheduleElement.activity_description = element.activity_description;
        scheduleElement.planned_start = element.planned_start;
        scheduleElement.planned_finish = element.planned_finish;
        scheduleElement.construction_phase = element.construction_phase;
        scheduleElement.work_package = element.work_package;
        scheduleElement.sequence_order = element.sequence_order;
        scheduleElement.dependencies = element.dependencies;
        scheduleElement.resources = element.resources;
        scheduleElement.planned_cost = element.planned_cost;
        scheduleElement.status = 'not_started';
        scheduleElement.progress_percentage = 0;

        const saved = await manager.save(scheduleElement);
        scheduleElements.push(saved);
      }
    });

    return scheduleElements;
  }

  async update4DProgress(
    companyId: string,
    data: Update4DProgressDto,
  ): Promise<BIMScheduleElement> {
    const element = await this.scheduleElementRepository.findOne({
      where: {
        id: data.schedule_element_id,
        company_id: companyId,
      },
    });

    if (!element) {
      throw new Error('Schedule element not found');
    }

    element.progress_percentage = data.progress_percentage;
    element.status = data.status;

    if (data.actual_start) element.actual_start = data.actual_start;
    if (data.actual_finish) element.actual_finish = data.actual_finish;
    if (data.actual_cost !== undefined) element.actual_cost = data.actual_cost;

    // Auto-update status based on progress
    if (data.progress_percentage === 0) {
      element.status = 'not_started';
    } else if (data.progress_percentage === 100) {
      element.status = 'completed';
      if (!element.actual_finish) {
        element.actual_finish = new Date();
      }
    } else if (data.progress_percentage > 0) {
      if (!element.actual_start) {
        element.actual_start = new Date();
      }
      if (element.status === 'not_started') {
        element.status = 'in_progress';
      }
    }

    // Check for delays
    const today = new Date();
    if (element.planned_finish < today && element.status !== 'completed') {
      element.status = 'delayed';
    }

    return await this.scheduleElementRepository.save(element);
  }

  async create4DSnapshot(
    companyId: string,
    data: Create4DSnapshotDto,
  ): Promise<BIM4DSnapshot> {
    // Get current state of all scheduled elements
    const scheduleElements = await this.scheduleElementRepository.find({
      where: {
        company_id: companyId,
        project_id: data.project_id,
      },
    });

    const elementsState = scheduleElements.map((element) => ({
      ifc_global_id: element.ifc_global_id,
      status: element.status,
      progress_percentage: element.progress_percentage,
      activity_id: element.schedule_activity_id,
      phase: element.construction_phase || 'unknown',
      visible: true,
      color: this.getStatusColor(element.status, element.progress_percentage),
    }));

    const summary = {
      total_elements: scheduleElements.length,
      not_started: scheduleElements.filter((e) => e.status === 'not_started')
        .length,
      in_progress: scheduleElements.filter((e) => e.status === 'in_progress')
        .length,
      completed: scheduleElements.filter((e) => e.status === 'completed')
        .length,
      overall_progress:
        scheduleElements.length > 0
          ? scheduleElements.reduce(
              (sum, e) => sum + e.progress_percentage,
              0,
            ) / scheduleElements.length
          : 0,
    };

    const snapshot = new BIM4DSnapshot();
    snapshot.id = crypto.randomUUID();
    snapshot.company_id = companyId;
    snapshot.project_id = data.project_id;
    snapshot.snapshot_date = data.snapshot_date;
    snapshot.snapshot_name = data.snapshot_name;
    snapshot.description = data.description;
    snapshot.elements_state = elementsState;
    snapshot.summary = summary;
    snapshot.camera_position = data.camera_position;

    return await this.snapshotRepository.save(snapshot);
  }

  async get4DAnalysis(
    companyId: string,
    projectId: string,
  ): Promise<Schedule4DAnalysis> {
    const scheduleElements = await this.scheduleElementRepository.find({
      where: {
        company_id: companyId,
        project_id: projectId,
      },
      order: {
        planned_start: 'ASC',
      },
    });

    if (scheduleElements.length === 0) {
      throw new Error('No scheduled elements found for this project');
    }

    // Calculate overall progress
    const totalProgress = scheduleElements.reduce(
      (sum, e) => sum + e.progress_percentage,
      0,
    );
    const overall_progress = totalProgress / scheduleElements.length;

    // Schedule performance analysis
    const today = new Date();
    const schedule_performance = {
      on_track: 0,
      delayed: 0,
      ahead: 0,
      total_activities: scheduleElements.length,
    };

    scheduleElements.forEach((element) => {
      if (element.is_delayed) {
        schedule_performance.delayed++;
      } else {
        const expectedProgress = this.calculateExpectedProgress(element, today);
        if (element.progress_percentage >= expectedProgress * 0.9) {
          schedule_performance.on_track++;
        } else if (element.progress_percentage > expectedProgress * 1.1) {
          schedule_performance.ahead++;
        } else {
          schedule_performance.delayed++;
        }
      }
    });

    // Critical path analysis
    const criticalPathElements = this.calculateCriticalPath(scheduleElements);
    const critical_path = {
      activities: criticalPathElements,
      total_duration_days: criticalPathElements.reduce(
        (sum, e) => sum + e.duration_days,
        0,
      ),
      delays_days: criticalPathElements.reduce(
        (sum, e) => sum + Math.max(0, e.schedule_variance_days),
        0,
      ),
    };

    // Phase analysis
    const phaseMap = new Map<string, BIMScheduleElement[]>();
    scheduleElements.forEach((element) => {
      const phase = element.construction_phase || 'Unknown';
      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, []);
      }
      phaseMap.get(phase)!.push(element);
    });

    const phases = Array.from(phaseMap.entries()).map(([phase, elements]) => {
      const progress =
        elements.reduce((sum, e) => sum + e.progress_percentage, 0) /
        elements.length;
      const plannedStart = new Date(
        Math.min(...elements.map((e) => e.planned_start.getTime())),
      );
      const plannedFinish = new Date(
        Math.max(...elements.map((e) => e.planned_finish.getTime())),
      );

      let actualStart: Date | undefined;
      const startedElements = elements.filter((e) => e.actual_start);
      if (startedElements.length > 0) {
        actualStart = new Date(
          Math.min(...startedElements.map((e) => e.actual_start!.getTime())),
        );
      }

      // Predict finish based on current progress
      const avgVariance =
        elements.reduce((sum, e) => sum + e.schedule_variance_days, 0) /
        elements.length;
      const predictedFinish = new Date(
        plannedFinish.getTime() + avgVariance * 24 * 60 * 60 * 1000,
      );

      let status: 'not_started' | 'in_progress' | 'delayed' | 'completed';
      if (progress === 0) status = 'not_started';
      else if (progress === 100) status = 'completed';
      else if (avgVariance > 0 || plannedFinish < today) status = 'delayed';
      else status = 'in_progress';

      return {
        phase,
        progress: Math.round(progress * 100) / 100,
        elements_count: elements.length,
        planned_start: plannedStart,
        planned_finish: plannedFinish,
        actual_start: actualStart,
        predicted_finish: predictedFinish,
        variance_days: Math.round(avgVariance),
        status,
      };
    });

    // Resource utilization (simplified - would integrate with actual resource data)
    const resource_utilization =
      this.calculateResourceUtilization(scheduleElements);

    // Risk analysis
    const risks = this.analyzeRisks(scheduleElements);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      scheduleElements,
      phases,
    );

    return {
      project_id: projectId,
      analysis_date: new Date(),
      overall_progress: Math.round(overall_progress * 100) / 100,
      schedule_performance,
      critical_path,
      phases,
      resource_utilization,
      risks,
      recommendations,
    };
  }

  async getScheduleElementsByElement(
    companyId: string,
    ifcGlobalId: string,
  ): Promise<BIMScheduleElement[]> {
    return await this.scheduleElementRepository.find({
      where: {
        company_id: companyId,
        ifc_global_id: ifcGlobalId,
      },
      order: {
        planned_start: 'ASC',
      },
    });
  }

  async getScheduleElementsByPhase(
    companyId: string,
    projectId: string,
    phase: string,
  ): Promise<BIMScheduleElement[]> {
    return await this.scheduleElementRepository.find({
      where: {
        company_id: companyId,
        project_id: projectId,
        construction_phase: phase,
      },
      order: {
        sequence_order: 'ASC',
        planned_start: 'ASC',
      },
    });
  }

  async get4DSnapshots(
    companyId: string,
    projectId: string,
    limit: number = 10,
  ): Promise<BIM4DSnapshot[]> {
    return await this.snapshotRepository.find({
      where: {
        company_id: companyId,
        project_id: projectId,
      },
      order: {
        snapshot_date: 'DESC',
      },
      take: limit,
    });
  }

  async createScheduleTemplate(
    companyId: string,
    templateData: {
      template_name: string;
      template_type: string;
      description?: string;
      phases: any[];
      risk_factors?: any[];
    },
  ): Promise<BIMScheduleTemplate> {
    const template = new BIMScheduleTemplate();
    template.id = crypto.randomUUID();
    template.company_id = companyId;
    template.template_name = templateData.template_name;
    template.template_type = templateData.template_type;
    template.description = templateData.description;
    template.phases = templateData.phases;
    template.risk_factors = templateData.risk_factors;

    return await this.templateRepository.save(template);
  }

  async applyScheduleTemplate(
    companyId: string,
    projectId: string,
    templateId: string,
    projectStartDate: Date,
  ): Promise<BIMScheduleElement[]> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, company_id: companyId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Get BIM elements for the project to map to template phases
    const { data: bimElements } = await this.supabase
      .from('bim_elements')
      .select('ifc_guid, ifc_type, name')
      .eq('company_id', companyId)
      .in(
        'model_id',
        this.supabase
          .from('bim_models')
          .select('id')
          .eq('project_id', projectId),
      );

    const scheduleElements: BIMScheduleElement[] = [];
    let currentDate = new Date(projectStartDate);

    for (const phase of template.phases) {
      // Find elements that match this phase's IFC types
      const phaseElements = (bimElements || []).filter((element) =>
        phase.ifc_types.includes(element.ifc_type),
      );

      const phaseEndDate = new Date(
        currentDate.getTime() + phase.duration_days * 24 * 60 * 60 * 1000,
      );

      for (const element of phaseElements) {
        const scheduleElement = new BIMScheduleElement();
        scheduleElement.id = crypto.randomUUID();
        scheduleElement.company_id = companyId;
        scheduleElement.project_id = projectId;
        scheduleElement.ifc_global_id = element.ifc_guid;
        scheduleElement.schedule_activity_id = `${phase.phase_id}_${element.ifc_guid}`;
        scheduleElement.activity_name = `${phase.phase_name} - ${element.name}`;
        scheduleElement.activity_description = `${phase.phase_name} for ${element.ifc_type}`;
        scheduleElement.planned_start = new Date(currentDate);
        scheduleElement.planned_finish = new Date(phaseEndDate);
        scheduleElement.construction_phase = phase.phase_name;
        scheduleElement.work_package = phase.phase_id;
        scheduleElement.dependencies = {
          predecessors: phase.dependencies || [],
          successors: [],
        };
        scheduleElement.status = 'not_started';
        scheduleElement.progress_percentage = 0;

        scheduleElements.push(scheduleElement);
      }

      currentDate = new Date(phaseEndDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day buffer
    }

    return await this.scheduleElementRepository.save(scheduleElements);
  }

  private getStatusColor(status: string, progress: number): string {
    switch (status) {
      case 'not_started':
        return '#6B7280'; // Gray
      case 'in_progress':
        if (progress < 30) return '#F59E0B'; // Amber
        if (progress < 70) return '#3B82F6'; // Blue
        return '#10B981'; // Emerald
      case 'completed':
        return '#059669'; // Green
      case 'delayed':
        return '#EF4444'; // Red
      case 'on_hold':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280';
    }
  }

  private calculateExpectedProgress(
    element: BIMScheduleElement,
    currentDate: Date,
  ): number {
    if (currentDate < element.planned_start) return 0;
    if (currentDate > element.planned_finish) return 100;

    const totalDuration =
      element.planned_finish.getTime() - element.planned_start.getTime();
    const elapsed = currentDate.getTime() - element.planned_start.getTime();

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  private calculateCriticalPath(
    elements: BIMScheduleElement[],
  ): BIMScheduleElement[] {
    // Simplified critical path calculation
    // In a full implementation, this would use CPM algorithm
    return elements
      .filter(
        (e) => e.is_critical_path || e.dependencies?.successors?.length === 0,
      )
      .sort((a, b) => a.planned_start.getTime() - b.planned_start.getTime());
  }

  private calculateResourceUtilization(elements: BIMScheduleElement[]): any[] {
    // Simplified resource utilization calculation
    const utilizationData = [];
    const startDate = new Date(
      Math.min(...elements.map((e) => e.planned_start.getTime())),
    );
    const endDate = new Date(
      Math.max(...elements.map((e) => e.planned_finish.getTime())),
    );

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 7)
    ) {
      const activeElements = elements.filter(
        (e) => e.planned_start <= date && e.planned_finish >= date,
      );

      utilizationData.push({
        date: new Date(date),
        workers_planned: activeElements.length * 5, // Simplified
        workers_actual:
          activeElements.filter((e) => e.status === 'in_progress').length * 5,
        equipment_utilization: 75 + Math.random() * 20, // Simulated
        cost_performance: 95 + Math.random() * 10, // Simulated
      });
    }

    return utilizationData;
  }

  private analyzeRisks(elements: BIMScheduleElement[]): any[] {
    const risks = [];

    // Analyze for common risks
    const delayedElements = elements.filter((e) => e.is_delayed);
    if (delayedElements.length > 0) {
      risks.push({
        activity_id: 'multiple',
        activity_name: 'Multiple Activities',
        risk: `${delayedElements.length} activities are delayed`,
        probability: 'high',
        impact:
          delayedElements.length > elements.length * 0.2 ? 'critical' : 'high',
        mitigation:
          'Increase resources, parallel execution, schedule compression',
        status: 'active',
      });
    }

    // Weather-dependent activities
    const weatherDependentElements = elements.filter(
      (e) => e.weather_dependent === 'yes',
    );
    if (weatherDependentElements.length > 0) {
      risks.push({
        activity_id: 'weather',
        activity_name: 'Weather-Dependent Activities',
        risk: 'Weather conditions may delay outdoor activities',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Monitor weather forecasts, have indoor backup activities',
        status: 'active',
      });
    }

    return risks;
  }

  private generateRecommendations(
    elements: BIMScheduleElement[],
    phases: any[],
  ): string[] {
    const recommendations = [];

    const delayedPhases = phases.filter((p) => p.status === 'delayed');
    if (delayedPhases.length > 0) {
      recommendations.push(
        `Address delays in ${delayedPhases.length} construction phases`,
      );
    }

    const criticalActivities = elements.filter(
      (e) => e.is_critical_path && e.status === 'delayed',
    );
    if (criticalActivities.length > 0) {
      recommendations.push(
        'Focus resources on critical path activities to minimize project delay',
      );
    }

    const lowProgressActivities = elements.filter(
      (e) => e.status === 'in_progress' && e.progress_percentage < 25,
    );
    if (lowProgressActivities.length > 0) {
      recommendations.push(
        'Investigate and accelerate slow-progressing activities',
      );
    }

    const overBudgetActivities = elements.filter((e) => e.cost_variance > 15);
    if (overBudgetActivities.length > 0) {
      recommendations.push(
        'Review cost management for activities exceeding budget',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Project schedule is on track - continue current practices',
      );
    }

    return recommendations;
  }

  async generateGanttData(
    companyId: string,
    projectId: string,
  ): Promise<any[]> {
    const elements = await this.scheduleElementRepository.find({
      where: {
        company_id: companyId,
        project_id: projectId,
      },
      order: {
        planned_start: 'ASC',
      },
    });

    return elements.map((element) => ({
      id: element.schedule_activity_id,
      name: element.activity_name,
      start: element.planned_start,
      end: element.planned_finish,
      actualStart: element.actual_start,
      actualEnd: element.actual_finish,
      progress: element.progress_percentage / 100,
      status: element.status,
      phase: element.construction_phase,
      workPackage: element.work_package,
      ifcGlobalId: element.ifc_global_id,
      resources: element.resources,
      dependencies: element.dependencies?.predecessors || [],
      critical: element.is_critical_path,
      color: this.getStatusColor(element.status, element.progress_percentage),
    }));
  }
}
