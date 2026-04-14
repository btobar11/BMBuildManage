import {
  BIMScheduleElement,
  BIM4DSnapshot,
  BIMScheduleTemplate,
} from './bim-schedule.entity';

describe('BIMScheduleElement Entity', () => {
  const createMockElement = (overrides = {}): BIMScheduleElement => {
    const element = new BIMScheduleElement();
    element.id = 'elem-1';
    element.company_id = 'company-1';
    element.project_id = 'project-1';
    element.ifc_global_id = 'ifc-guid-1';
    element.schedule_activity_id = 'act_1';
    element.activity_name = 'Foundation Work';
    element.activity_description = 'Build foundation';
    element.planned_start = new Date('2026-01-01');
    element.planned_finish = new Date('2026-01-15');
    element.actual_start = undefined;
    element.actual_finish = undefined;
    element.progress_percentage = 0;
    element.status = 'not_started';
    element.construction_phase = 'foundation';
    element.work_package = 'pkg-1';
    element.sequence_order = 1;
    element.dependencies = { predecessors: [], successors: [] };
    element.resources = undefined;
    element.planned_cost = 10000;
    element.actual_cost = undefined;
    return Object.assign(element, overrides);
  };

  describe('is_critical_path', () => {
    it('should return true when no successors', () => {
      const element = createMockElement({
        dependencies: { predecessors: ['act_0'], successors: [] },
      });
      expect(element.is_critical_path).toBe(true);
    });

    it('should return false when has successors', () => {
      const element = createMockElement({
        dependencies: { predecessors: [], successors: ['act_2'] },
      });
      expect(element.is_critical_path).toBe(false);
    });

    it('should return false when dependencies is undefined', () => {
      const element = createMockElement({ dependencies: undefined });
      expect(element.is_critical_path).toBe(false);
    });
  });

  describe('is_delayed', () => {
    it('should return true when planned_start is past and not started', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const element = createMockElement({
        planned_start: pastDate,
        actual_start: null,
        status: 'not_started',
      });
      expect(element.is_delayed).toBe(true);
    });

    it('should return true when actual_finish is past planned_finish', () => {
      const element = createMockElement({
        planned_finish: new Date('2026-01-15'),
        actual_finish: new Date('2026-01-20'),
      });
      expect(element.is_delayed).toBe(true);
    });

    it('should return true when status is delayed', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const element = createMockElement({
        planned_start: futureDate,
        planned_finish: futureDate,
        status: 'delayed',
      });
      expect(element.is_delayed).toBe(true);
    });

    it('should return false when project is on track', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const element = createMockElement({
        planned_start: futureDate,
        planned_finish: futureDate,
        status: 'in_progress',
        actual_start: null,
      });
      expect(element.is_delayed).toBe(false);
    });
  });

  describe('duration_days', () => {
    it('should calculate correct duration', () => {
      const element = createMockElement({
        planned_start: new Date('2026-01-01'),
        planned_finish: new Date('2026-01-15'),
      });
      expect(element.duration_days).toBe(14);
    });

    it('should return positive number for any dates', () => {
      const element = createMockElement();
      expect(element.duration_days).toBeGreaterThan(0);
    });
  });

  describe('actual_duration_days', () => {
    it('should calculate actual duration when both dates exist', () => {
      const element = createMockElement({
        actual_start: new Date('2026-01-01'),
        actual_finish: new Date('2026-01-10'),
      });
      expect(element.actual_duration_days).toBe(9);
    });

    it('should return null when actual_start is missing', () => {
      const element = createMockElement();
      (element as any).actual_start = null;
      expect(element.actual_duration_days).toBeNull();
    });

    it('should return null when actual_finish is missing', () => {
      const element = createMockElement();
      (element as any).actual_finish = null;
      expect(element.actual_duration_days).toBeNull();
    });
  });

  describe('cost_variance', () => {
    it('should calculate positive variance when over budget', () => {
      const element = createMockElement({
        planned_cost: 10000,
        actual_cost: 12000,
      });
      expect(element.cost_variance).toBe(20);
    });

    it('should calculate negative variance when under budget', () => {
      const element = createMockElement({
        planned_cost: 10000,
        actual_cost: 8000,
      });
      expect(element.cost_variance).toBe(-20);
    });

    it('should return 0 when planned_cost is null', () => {
      const element = createMockElement({
        planned_cost: null as any,
        actual_cost: 10000,
      });
      expect(element.cost_variance).toBe(0);
    });

    it('should return 0 when actual_cost is null', () => {
      const element = createMockElement({
        planned_cost: 10000,
        actual_cost: null as any,
      });
      expect(element.cost_variance).toBe(0);
    });

    it('should return 0 when both costs are null', () => {
      const element = createMockElement({
        planned_cost: null as any,
        actual_cost: null as any,
      });
      expect(element.cost_variance).toBe(0);
    });
  });

  describe('schedule_variance_days', () => {
    it('should calculate positive variance when late', () => {
      const element = createMockElement({
        planned_finish: new Date('2026-01-15'),
        actual_finish: new Date('2026-01-20'),
      });
      expect(element.schedule_variance_days).toBe(5);
    });

    it('should calculate negative variance when early', () => {
      const element = createMockElement({
        planned_finish: new Date('2026-01-15'),
        actual_finish: new Date('2026-01-10'),
      });
      expect(element.schedule_variance_days).toBe(-5);
    });

    it('should return number for ongoing activities', () => {
      const element = createMockElement();
      expect(typeof element.schedule_variance_days).toBe('number');
    });
  });
});

describe('BIM4DSnapshot Entity', () => {
  it('should create snapshot with required fields', () => {
    const snapshot = new BIM4DSnapshot();
    snapshot.id = 'snap-1';
    snapshot.company_id = 'company-1';
    snapshot.project_id = 'project-1';
    snapshot.snapshot_date = new Date('2026-01-15');
    snapshot.elements_state = [];

    expect(snapshot.id).toBe('snap-1');
    expect(snapshot.elements_state).toEqual([]);
  });

  it('should have optional summary field', () => {
    const snapshot = new BIM4DSnapshot();
    snapshot.summary = {
      total_elements: 10,
      not_started: 3,
      in_progress: 5,
      completed: 2,
      overall_progress: 35,
    };

    expect(snapshot.summary.total_elements).toBe(10);
    expect(snapshot.summary.overall_progress).toBe(35);
  });

  it('should have optional camera_position field', () => {
    const snapshot = new BIM4DSnapshot();
    snapshot.camera_position = {
      x: 100,
      y: 200,
      z: 300,
      target_x: 10,
      target_y: 20,
      target_z: 30,
      zoom: 1.5,
    };

    expect(snapshot.camera_position.zoom).toBe(1.5);
  });
});

describe('BIMScheduleTemplate Entity', () => {
  it('should create template with required fields', () => {
    const template = new BIMScheduleTemplate();
    template.id = 'tmpl-1';
    template.company_id = 'company-1';
    template.template_name = 'Residential Template';
    template.template_type = 'residential';
    template.phases = [
      {
        phase_id: 'phase-1',
        phase_name: 'Foundation',
        duration_days: 14,
        ifc_types: ['IfcFooting', 'IfcFoundation'],
        dependencies: [],
        resources: { workers_per_day: 5, equipment_types: ['excavator'] },
        quality_checkpoints: ['rebar inspection'],
      },
    ];

    expect(template.template_name).toBe('Residential Template');
    expect(template.phases.length).toBe(1);
    expect(template.phases[0].duration_days).toBe(14);
  });

  it('should have optional risk_factors', () => {
    const template = new BIMScheduleTemplate();
    template.risk_factors = [
      {
        phase_id: 'phase-1',
        risks: [
          {
            risk: 'Weather delays',
            probability: 'medium',
            impact: 'high',
            mitigation: 'Add buffer days',
          },
        ],
      },
    ];

    expect(template.risk_factors[0].risks[0].impact).toBe('high');
  });

  it('should allow setting is_active field', () => {
    const template = new BIMScheduleTemplate();
    template.is_active = true;
    expect(template.is_active).toBe(true);
  });
});
