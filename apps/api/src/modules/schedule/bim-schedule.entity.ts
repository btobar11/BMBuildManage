import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('bim_schedule_elements')
@Index(['company_id', 'project_id'])
@Index(['company_id', 'ifc_global_id'])
@Index(['company_id', 'schedule_activity_id'])
export class BIMScheduleElement {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  company_id: string;

  @Column('uuid')
  @Index()
  project_id: string;

  @Column('text')
  @Index()
  ifc_global_id: string; // Links to BIM element

  @Column('text')
  schedule_activity_id: string; // Links to schedule activity

  @Column('text', { nullable: true })
  activity_name?: string;

  @Column('text', { nullable: true })
  activity_description?: string;

  @Column('timestamp with time zone')
  planned_start: Date;

  @Column('timestamp with time zone')
  planned_finish: Date;

  @Column('timestamp with time zone', { nullable: true })
  actual_start?: Date;

  @Column('timestamp with time zone', { nullable: true })
  actual_finish?: Date;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  progress_percentage: number; // 0-100

  @Column('text', { default: 'not_started' })
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';

  @Column('text', { nullable: true })
  construction_phase?: string; // e.g., 'foundations', 'structure', 'finishes'

  @Column('text', { nullable: true })
  work_package?: string; // Grouping for related activities

  @Column('integer', { nullable: true })
  sequence_order?: number; // Order within work package

  @Column('json', { nullable: true })
  dependencies?: {
    predecessors: string[];
    successors: string[];
    lag_days?: number;
    relationship_type?:
      | 'finish_to_start'
      | 'start_to_start'
      | 'finish_to_finish'
      | 'start_to_finish';
  };

  @Column('json', { nullable: true })
  resources?: {
    workers: {
      role: string;
      count: number;
      daily_cost: number;
    }[];
    equipment: {
      type: string;
      count: number;
      daily_cost: number;
    }[];
    materials: {
      name: string;
      quantity: number;
      unit: string;
      cost_per_unit: number;
    }[];
  };

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  planned_cost?: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  actual_cost?: number;

  @Column('text', { nullable: true })
  responsible_contractor?: string;

  @Column('text', { nullable: true })
  responsible_supervisor?: string;

  @Column('json', { nullable: true })
  quality_checkpoints?: {
    checkpoint: string;
    required: boolean;
    completed: boolean;
    completed_date?: string;
    inspector?: string;
    notes?: string;
  }[];

  @Column('json', { nullable: true })
  risk_factors?: {
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }[];

  @Column('text', { nullable: true })
  weather_dependent?: string; // 'yes' | 'no' | 'partially'

  @Column('integer', { nullable: true })
  buffer_days?: number; // Schedule buffer for this activity

  @Column('json', { nullable: true })
  performance_metrics?: {
    planned_duration_days: number;
    actual_duration_days?: number;
    productivity_rate?: number; // units per day
    efficiency_percentage?: number;
    quality_score?: number;
  };

  @Column('json', { nullable: true })
  coordination_notes?: {
    date: string;
    note: string;
    author: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual properties for computed values
  get is_critical_path(): boolean {
    return this.dependencies?.successors?.length === 0 || false;
  }

  get is_delayed(): boolean {
    if (!this.actual_start && this.planned_start < new Date()) return true;
    if (this.actual_finish && this.actual_finish > this.planned_finish)
      return true;
    if (this.status === 'delayed') return true;
    return false;
  }

  get duration_days(): number {
    return Math.ceil(
      (this.planned_finish.getTime() - this.planned_start.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  get actual_duration_days(): number | null {
    if (!this.actual_start || !this.actual_finish) return null;
    return Math.ceil(
      (this.actual_finish.getTime() - this.actual_start.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  get cost_variance(): number {
    if (!this.planned_cost || !this.actual_cost) return 0;
    return ((this.actual_cost - this.planned_cost) / this.planned_cost) * 100;
  }

  get schedule_variance_days(): number {
    if (!this.actual_finish) {
      // For ongoing activities, calculate based on current progress
      const today = new Date();
      const expectedProgress = Math.min(
        100,
        ((today.getTime() - this.planned_start.getTime()) /
          (this.planned_finish.getTime() - this.planned_start.getTime())) *
          100,
      );

      if (this.progress_percentage < expectedProgress) {
        return Math.ceil(
          ((expectedProgress - this.progress_percentage) / 100) *
            this.duration_days,
        );
      }
      return 0;
    }

    return Math.ceil(
      (this.actual_finish.getTime() - this.planned_finish.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }
}

@Entity('bim_4d_snapshots')
@Index(['company_id', 'project_id', 'snapshot_date'])
export class BIM4DSnapshot {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  company_id: string;

  @Column('uuid')
  @Index()
  project_id: string;

  @Column('date')
  @Index()
  snapshot_date: Date;

  @Column('text', { nullable: true })
  snapshot_name?: string;

  @Column('json')
  elements_state: {
    ifc_global_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    activity_id?: string;
    phase: string;
    visible: boolean;
    color?: string; // Hex color for visualization
  }[];

  @Column('json', { nullable: true })
  summary?: {
    total_elements: number;
    not_started: number;
    in_progress: number;
    completed: number;
    overall_progress: number;
  };

  @Column('json', { nullable: true })
  camera_position?: {
    x: number;
    y: number;
    z: number;
    target_x: number;
    target_y: number;
    target_z: number;
    zoom: number;
  };

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('bim_schedule_templates')
@Index(['company_id', 'template_type'])
export class BIMScheduleTemplate {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  company_id: string;

  @Column('text')
  template_name: string;

  @Column('text')
  template_type: string; // e.g., 'residential', 'commercial', 'industrial'

  @Column('text', { nullable: true })
  description?: string;

  @Column('json')
  phases: {
    phase_id: string;
    phase_name: string;
    duration_days: number;
    ifc_types: string[];
    dependencies: string[];
    resources: {
      workers_per_day: number;
      equipment_types: string[];
    };
    quality_checkpoints: string[];
  }[];

  @Column('json', { nullable: true })
  risk_factors?: {
    phase_id: string;
    risks: {
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high' | 'critical';
      mitigation: string;
    }[];
  }[];

  @Column('boolean', { default: true })
  is_active: boolean;

  @Column('text', { nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
