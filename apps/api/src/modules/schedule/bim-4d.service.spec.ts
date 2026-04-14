import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BIM4DService } from './bim-4d.service';
import {
  BIMScheduleElement,
  BIM4DSnapshot,
  BIMScheduleTemplate,
} from './bim-schedule.entity';

describe('BIM4DService', () => {
  let service: BIM4DService;
  let scheduleElementRepository: jest.Mocked<Repository<BIMScheduleElement>>;
  let snapshotRepository: jest.Mocked<Repository<BIM4DSnapshot>>;
  let templateRepository: jest.Mocked<Repository<BIMScheduleTemplate>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockSupabase = {
    from: jest.fn(),
  };

  const createMockElement = (overrides = {}): BIMScheduleElement => ({
    id: 'elem-1',
    company_id: 'company-1',
    project_id: 'project-1',
    ifc_global_id: 'ifc-guid-1',
    schedule_activity_id: 'act_1',
    activity_name: 'Foundation Work',
    activity_description: 'Build foundation',
    planned_start: new Date('2026-01-01'),
    planned_finish: new Date('2026-01-15'),
    actual_start: undefined,
    actual_finish: undefined,
    progress_percentage: 0,
    status: 'not_started',
    construction_phase: 'foundation',
    work_package: 'pkg-1',
    sequence_order: 1,
    dependencies: { predecessors: [], successors: [] },
    resources: undefined,
    planned_cost: 10000,
    actual_cost: undefined,
    created_at: new Date(),
    updated_at: new Date(),
    get is_critical_path() {
      return this.dependencies?.successors?.length === 0 || false;
    },
    get is_delayed() {
      if (!this.actual_start && this.planned_start < new Date()) return true;
      if (this.actual_finish && this.actual_finish > this.planned_finish)
        return true;
      if (this.status === 'delayed') return true;
      return false;
    },
    get duration_days() {
      return Math.ceil(
        (this.planned_finish.getTime() - this.planned_start.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    },
    get actual_duration_days() {
      if (!this.actual_start || !this.actual_finish) return null;
      return Math.ceil(
        (this.actual_finish.getTime() - this.actual_start.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    },
    get cost_variance() {
      if (!this.planned_cost || !this.actual_cost) return 0;
      return ((this.actual_cost - this.planned_cost) / this.planned_cost) * 100;
    },
    get schedule_variance_days() {
      if (!this.actual_finish) {
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
    },
    ...overrides,
  });

  const createMockSnapshot = (overrides = {}): BIM4DSnapshot => ({
    id: 'snap-1',
    company_id: 'company-1',
    project_id: 'project-1',
    snapshot_date: new Date('2026-01-15'),
    snapshot_name: 'Week 2 Snapshot',
    elements_state: [],
    summary: {
      total_elements: 10,
      not_started: 3,
      in_progress: 5,
      completed: 2,
      overall_progress: 35,
    },
    camera_position: {
      x: 0,
      y: 0,
      z: 0,
      target_x: 10,
      target_y: 10,
      target_z: 10,
      zoom: 1,
    },
    description: 'Test snapshot',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  const createMockTemplate = (overrides = {}): BIMScheduleTemplate => ({
    id: 'tmpl-1',
    company_id: 'company-1',
    template_name: 'Residential Template',
    template_type: 'residential',
    description: 'Standard residential construction',
    phases: [
      {
        phase_id: 'phase-1',
        phase_name: 'Foundation',
        duration_days: 14,
        ifc_types: ['IfcFooting', 'IfcFoundation'],
        dependencies: [],
        resources: { workers_per_day: 5, equipment_types: ['excavator'] },
        quality_checkpoints: ['rebar inspection'],
      },
    ],
    risk_factors: undefined,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  const mockElementRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  });

  const mockSnapshotRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  });

  const mockTemplateRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  });

  const mockDataSource = () => ({
    transaction: jest.fn((cb) =>
      cb({
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      }),
    ),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BIM4DService,
        {
          provide: getRepositoryToken(BIMScheduleElement),
          useFactory: mockElementRepository,
        },
        {
          provide: getRepositoryToken(BIM4DSnapshot),
          useFactory: mockSnapshotRepository,
        },
        {
          provide: getRepositoryToken(BIMScheduleTemplate),
          useFactory: mockTemplateRepository,
        },
        {
          provide: DataSource,
          useFactory: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'supabase.url') return 'https://test.supabase.co';
              if (key === 'supabase.anonKey') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BIM4DService>(BIM4DService);
    scheduleElementRepository = module.get(
      getRepositoryToken(BIMScheduleElement),
    );
    snapshotRepository = module.get(getRepositoryToken(BIM4DSnapshot));
    templateRepository = module.get(getRepositoryToken(BIMScheduleTemplate));
    dataSource = module.get(DataSource);
    (service as any).supabase = mockSupabase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create4DSchedule', () => {
    it('should create schedule elements', async () => {
      const data = {
        project_id: 'project-1',
        elements: [
          {
            ifc_global_id: 'ifc-1',
            activity_name: 'Foundation',
            planned_start: new Date('2026-01-01'),
            planned_finish: new Date('2026-01-15'),
            construction_phase: 'foundation',
          },
        ],
      };

      const result = await service.create4DSchedule('company-1', data);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should create multiple schedule elements', async () => {
      const data = {
        project_id: 'project-1',
        elements: [
          {
            ifc_global_id: 'ifc-1',
            activity_name: 'Foundation',
            planned_start: new Date('2026-01-01'),
            planned_finish: new Date('2026-01-15'),
            construction_phase: 'foundation',
          },
          {
            ifc_global_id: 'ifc-2',
            activity_name: 'Structure',
            planned_start: new Date('2026-01-16'),
            planned_finish: new Date('2026-02-15'),
            construction_phase: 'structure',
          },
        ],
      };

      const result = await service.create4DSchedule('company-1', data);

      expect(result.length).toBe(2);
    });
  });

  describe('update4DProgress', () => {
    it('should update progress percentage', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const element = createMockElement({
        status: 'not_started',
        planned_finish: futureDate,
      });
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 50,
        status: 'in_progress',
      });

      expect(result.progress_percentage).toBe(50);
    });

    it('should set status to not_started when progress is 0', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const element = createMockElement({
        status: 'in_progress',
        planned_finish: futureDate,
      });
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 0,
        status: 'not_started',
      });

      expect(result.status).toBe('not_started');
    });

    it('should set status to completed when progress is 100', async () => {
      const element = createMockElement({ status: 'in_progress' });
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 100,
        status: 'completed',
      });

      expect(result.status).toBe('completed');
      expect(result.actual_finish).toBeDefined();
    });

    it('should set actual_start when progress > 0 and not started', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const element = createMockElement({
        status: 'not_started',
        actual_start: undefined,
        planned_finish: futureDate,
      });
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 25,
        status: 'in_progress',
      });

      expect(result.actual_start).toBeDefined();
    });

    it('should mark as delayed when past planned_finish', async () => {
      const element = createMockElement({
        status: 'in_progress',
        progress_percentage: 50,
        planned_finish: new Date('2020-01-01'),
      });
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 50,
        status: 'in_progress',
      });

      expect(result.status).toBe('delayed');
    });

    it('should throw error when element not found', async () => {
      scheduleElementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update4DProgress('company-1', {
          schedule_element_id: 'non-existent',
          progress_percentage: 50,
          status: 'in_progress',
        }),
      ).rejects.toThrow('Schedule element not found');
    });

    it('should update actual_cost when provided', async () => {
      const element = createMockElement();
      scheduleElementRepository.findOne.mockResolvedValue(element);
      scheduleElementRepository.save.mockImplementation((e) =>
        Promise.resolve(e as BIMScheduleElement),
      );

      const result = await service.update4DProgress('company-1', {
        schedule_element_id: 'elem-1',
        progress_percentage: 100,
        status: 'completed',
        actual_cost: 11000,
      });

      expect(result.actual_cost).toBe(11000);
    });
  });

  describe('create4DSnapshot', () => {
    it('should create snapshot with elements state', async () => {
      const elements = [
        createMockElement({ status: 'completed', progress_percentage: 100 }),
        createMockElement({ status: 'in_progress', progress_percentage: 50 }),
        createMockElement({ status: 'not_started', progress_percentage: 0 }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);
      snapshotRepository.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.create4DSnapshot('company-1', {
        project_id: 'project-1',
        snapshot_date: new Date('2026-01-15'),
        snapshot_name: 'Week 2',
      });

      expect(result.elements_state).toBeDefined();
      expect(result.elements_state.length).toBe(3);
      expect(result.summary.total_elements).toBe(3);
      expect(result.summary.completed).toBe(1);
      expect(result.summary.in_progress).toBe(1);
      expect(result.summary.not_started).toBe(1);
      expect(result.summary.overall_progress).toBeCloseTo(50, 0);
    });

    it('should calculate overall progress correctly', async () => {
      const elements = [
        createMockElement({ progress_percentage: 100 }),
        createMockElement({ progress_percentage: 50 }),
        createMockElement({ progress_percentage: 0 }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);
      snapshotRepository.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.create4DSnapshot('company-1', {
        project_id: 'project-1',
        snapshot_date: new Date(),
      });

      expect(result.summary.overall_progress).toBe(50);
    });

    it('should include camera position when provided', async () => {
      const elements = [createMockElement()];
      scheduleElementRepository.find.mockResolvedValue(elements);
      snapshotRepository.save.mockImplementation((s) => Promise.resolve(s));

      const cameraPos = {
        x: 100,
        y: 200,
        z: 300,
        target_x: 10,
        target_y: 20,
        target_z: 30,
        zoom: 1.5,
      };

      const result = await service.create4DSnapshot('company-1', {
        project_id: 'project-1',
        snapshot_date: new Date(),
        camera_position: cameraPos,
      });

      expect(result.camera_position).toEqual(cameraPos);
    });
  });

  describe('get4DAnalysis', () => {
    it('should throw error when no schedule elements found', async () => {
      scheduleElementRepository.find.mockResolvedValue([]);

      await expect(
        service.get4DAnalysis('company-1', 'project-1'),
      ).rejects.toThrow('No scheduled elements found for this project');
    });

    it('should calculate overall progress', async () => {
      const elements = [
        createMockElement({ progress_percentage: 100 }),
        createMockElement({ progress_percentage: 50 }),
        createMockElement({ progress_percentage: 25 }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.overall_progress).toBeCloseTo(58.33, 1);
    });

    it('should calculate schedule performance', async () => {
      const today = new Date();
      const mockElem1 = createMockElement({
        planned_start: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        planned_finish: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        progress_percentage: 50,
      });
      Object.defineProperty(mockElem1, 'is_delayed', {
        value: false,
        writable: true,
      });

      const mockElem2 = createMockElement({
        planned_start: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        planned_finish: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        progress_percentage: 30,
      });
      Object.defineProperty(mockElem2, 'is_delayed', {
        value: false,
        writable: true,
      });

      scheduleElementRepository.find.mockResolvedValue([mockElem1, mockElem2]);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.schedule_performance.total_activities).toBe(2);
      expect(
        result.schedule_performance.on_track +
          result.schedule_performance.delayed +
          result.schedule_performance.ahead,
      ).toBe(2);
    });

    it('should analyze phases correctly', async () => {
      const elements = [
        createMockElement({
          construction_phase: 'foundation',
          progress_percentage: 100,
        }),
        createMockElement({
          construction_phase: 'foundation',
          progress_percentage: 80,
        }),
        createMockElement({
          construction_phase: 'structure',
          progress_percentage: 30,
        }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.phases.length).toBe(2);
      const foundation = result.phases.find((p) => p.phase === 'foundation');
      expect(foundation.elements_count).toBe(2);
      expect(foundation.progress).toBeCloseTo(90, 0);
    });

    it('should generate recommendations for delayed phases', async () => {
      const mockElem = createMockElement({
        construction_phase: 'foundation',
        planned_start: new Date('2020-01-01'),
        planned_finish: new Date('2020-01-15'),
        progress_percentage: 50,
        status: 'delayed',
      });
      Object.defineProperty(mockElem, 'is_delayed', {
        value: true,
        writable: true,
      });

      scheduleElementRepository.find.mockResolvedValue([mockElem]);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.recommendations).toBeDefined();
    });

    it('should identify risks for delayed activities', async () => {
      const mockElem1 = createMockElement();
      Object.defineProperty(mockElem1, 'is_delayed', {
        value: true,
        writable: true,
      });

      const mockElem2 = createMockElement();
      Object.defineProperty(mockElem2, 'is_delayed', {
        value: true,
        writable: true,
      });

      const mockElem3 = createMockElement();
      Object.defineProperty(mockElem3, 'is_delayed', {
        value: false,
        writable: true,
      });

      scheduleElementRepository.find.mockResolvedValue([
        mockElem1,
        mockElem2,
        mockElem3,
      ]);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should include weather-dependent risks', async () => {
      const elements = [
        createMockElement({ weather_dependent: 'yes' }),
        createMockElement({ weather_dependent: 'no' }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.get4DAnalysis('company-1', 'project-1');

      expect(result.risks.some((r) => r.risk.includes('Weather'))).toBe(true);
    });
  });

  describe('getScheduleElementsByElement', () => {
    it('should return schedule elements for specific IFC global id', async () => {
      const elements = [
        createMockElement(),
        createMockElement({ id: 'elem-2' }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.getScheduleElementsByElement(
        'company-1',
        'ifc-guid-1',
      );

      expect(result.length).toBe(2);
      expect(scheduleElementRepository.find).toHaveBeenCalledWith({
        where: {
          company_id: 'company-1',
          ifc_global_id: 'ifc-guid-1',
        },
        order: { planned_start: 'ASC' },
      });
    });
  });

  describe('getScheduleElementsByPhase', () => {
    it('should return schedule elements for specific phase', async () => {
      const elements = [createMockElement()];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.getScheduleElementsByPhase(
        'company-1',
        'project-1',
        'foundation',
      );

      expect(result.length).toBe(1);
      expect(scheduleElementRepository.find).toHaveBeenCalledWith({
        where: {
          company_id: 'company-1',
          project_id: 'project-1',
          construction_phase: 'foundation',
        },
        order: { sequence_order: 'ASC', planned_start: 'ASC' },
      });
    });
  });

  describe('get4DSnapshots', () => {
    it('should return snapshots ordered by date descending', async () => {
      const snapshots = [
        createMockSnapshot(),
        createMockSnapshot({ id: 'snap-2' }),
      ];
      snapshotRepository.find.mockResolvedValue(snapshots);

      const result = await service.get4DSnapshots('company-1', 'project-1', 10);

      expect(result.length).toBe(2);
      expect(snapshotRepository.find).toHaveBeenCalledWith({
        where: {
          company_id: 'company-1',
          project_id: 'project-1',
        },
        order: { snapshot_date: 'DESC' },
        take: 10,
      });
    });

    it('should respect limit parameter', async () => {
      snapshotRepository.find.mockResolvedValue([]);

      await service.get4DSnapshots('company-1', 'project-1', 5);

      expect(snapshotRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('createScheduleTemplate', () => {
    it('should create schedule template', async () => {
      const templateData = {
        template_name: 'Commercial Template',
        template_type: 'commercial',
        phases: [
          {
            phase_id: 'phase-1',
            phase_name: 'Site Work',
            duration_days: 30,
            ifc_types: ['IfcSite'],
            dependencies: [],
            resources: { workers_per_day: 10, equipment_types: ['excavator'] },
            quality_checkpoints: [],
          },
        ],
      };
      templateRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.createScheduleTemplate(
        'company-1',
        templateData,
      );

      expect(result.template_name).toBe('Commercial Template');
      expect(result.phases.length).toBe(1);
    });
  });

  describe('applyScheduleTemplate', () => {
    it('should throw error when template not found', async () => {
      templateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.applyScheduleTemplate(
          'company-1',
          'project-1',
          'non-existent',
          new Date(),
        ),
      ).rejects.toThrow('Template not found');
    });

    it('should be defined as service method', () => {
      expect(service.applyScheduleTemplate).toBeDefined();
    });
  });

  describe('generateGanttData', () => {
    it('should generate gantt data with correct format', async () => {
      const elements = [
        createMockElement({
          progress_percentage: 75,
          status: 'in_progress',
          dependencies: { predecessors: ['act_0'], successors: [] },
        }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.generateGanttData('company-1', 'project-1');

      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        id: 'act_1',
        name: 'Foundation Work',
        progress: 0.75,
        status: 'in_progress',
        phase: 'foundation',
        dependencies: ['act_0'],
      });
      expect(result[0].color).toBeDefined();
    });

    it('should include ifcGlobalId in gantt data', async () => {
      const elements = [createMockElement()];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.generateGanttData('company-1', 'project-1');

      expect(result[0].ifcGlobalId).toBe('ifc-guid-1');
    });

    it('should mark critical path elements', async () => {
      const elements = [
        createMockElement({
          dependencies: { predecessors: [], successors: [] },
        }),
      ];
      scheduleElementRepository.find.mockResolvedValue(elements);

      const result = await service.generateGanttData('company-1', 'project-1');

      expect(result[0].critical).toBe(true);
    });
  });

  describe('getStatusColor', () => {
    it('should return gray for not_started', () => {
      const result = (service as any).getStatusColor('not_started', 0);
      expect(result).toBe('#6B7280');
    });

    it('should return amber for early in_progress', () => {
      const result = (service as any).getStatusColor('in_progress', 20);
      expect(result).toBe('#F59E0B');
    });

    it('should return blue for mid in_progress', () => {
      const result = (service as any).getStatusColor('in_progress', 50);
      expect(result).toBe('#3B82F6');
    });

    it('should return emerald for late in_progress', () => {
      const result = (service as any).getStatusColor('in_progress', 80);
      expect(result).toBe('#10B981');
    });

    it('should return green for completed', () => {
      const result = (service as any).getStatusColor('completed', 100);
      expect(result).toBe('#059669');
    });

    it('should return red for delayed', () => {
      const result = (service as any).getStatusColor('delayed', 50);
      expect(result).toBe('#EF4444');
    });

    it('should return purple for on_hold', () => {
      const result = (service as any).getStatusColor('on_hold', 50);
      expect(result).toBe('#8B5CF6');
    });
  });

  describe('calculateExpectedProgress', () => {
    it('should return 0 for dates before planned_start', () => {
      const element = createMockElement({
        planned_start: new Date('2026-02-01'),
        planned_finish: new Date('2026-02-15'),
      });

      const result = (service as any).calculateExpectedProgress(
        element,
        new Date('2026-01-15'),
      );

      expect(result).toBe(0);
    });

    it('should return 100 for dates after planned_finish', () => {
      const element = createMockElement({
        planned_start: new Date('2026-01-01'),
        planned_finish: new Date('2026-01-15'),
      });

      const result = (service as any).calculateExpectedProgress(
        element,
        new Date('2026-02-01'),
      );

      expect(result).toBe(100);
    });

    it('should calculate progress for mid-duration dates', () => {
      const element = createMockElement({
        planned_start: new Date('2026-01-01'),
        planned_finish: new Date('2026-01-11'),
      });

      const result = (service as any).calculateExpectedProgress(
        element,
        new Date('2026-01-06'),
      );

      expect(result).toBe(50);
    });
  });

  describe('calculateCriticalPath', () => {
    it('should return elements on critical path or with no successors', () => {
      const mockElem1 = createMockElement({
        planned_start: new Date('2026-01-01'),
      });
      Object.defineProperty(mockElem1, 'is_critical_path', {
        value: true,
        writable: true,
      });
      const mockElem2 = createMockElement({
        planned_start: new Date('2026-01-10'),
      });
      Object.defineProperty(mockElem2, 'is_critical_path', {
        value: false,
        writable: true,
      });
      mockElem2.dependencies = { successors: [] };

      const result = (service as any).calculateCriticalPath([
        mockElem1,
        mockElem2,
      ]);

      expect(result.length).toBe(2);
    });

    it('should return empty array for empty input', () => {
      const result = (service as any).calculateCriticalPath([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateResourceUtilization', () => {
    it('should calculate weekly utilization data', () => {
      const elements = [
        createMockElement({
          planned_start: new Date('2026-01-01'),
          planned_finish: new Date('2026-01-31'),
          status: 'in_progress',
        }),
        createMockElement({
          planned_start: new Date('2026-01-15'),
          planned_finish: new Date('2026-02-15'),
          status: 'not_started',
        }),
      ];

      const result = (service as any).calculateResourceUtilization(elements);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].workers_planned).toBeGreaterThan(0);
    });
  });

  describe('analyzeRisks', () => {
    it('should identify delayed activities risk', () => {
      const mockElem1 = createMockElement();
      Object.defineProperty(mockElem1, 'is_delayed', {
        value: true,
        writable: true,
      });
      const mockElem2 = createMockElement();
      Object.defineProperty(mockElem2, 'is_delayed', {
        value: true,
        writable: true,
      });
      const mockElem3 = createMockElement();
      Object.defineProperty(mockElem3, 'is_delayed', {
        value: false,
        writable: true,
      });

      const result = (service as any).analyzeRisks([
        mockElem1,
        mockElem2,
        mockElem3,
      ]);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should identify weather-dependent risks', () => {
      const elements = [createMockElement({ weather_dependent: 'yes' })];

      const result = (service as any).analyzeRisks(elements);

      expect(result.some((r) => r.risk.includes('Weather'))).toBe(true);
    });

    it('should return empty array for no risks', () => {
      const mockElem = createMockElement();
      Object.defineProperty(mockElem, 'is_delayed', {
        value: false,
        writable: true,
      });

      const result = (service as any).analyzeRisks([mockElem]);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend addressing delays when phases are delayed', () => {
      const elements = [createMockElement()];
      const phases = [{ status: 'delayed', phase: 'foundation' }];

      const result = (service as any).generateRecommendations(elements, phases);

      expect(
        result.some((r) => r.includes('delayed') || r.includes('phase')),
      ).toBe(true);
    });

    it('should recommend focusing on critical path when delayed', () => {
      const mockElem = createMockElement();
      Object.defineProperty(mockElem, 'is_critical_path', {
        value: true,
        writable: true,
      });
      mockElem.status = 'delayed';
      const elements = [mockElem];
      const phases = [];

      const result = (service as any).generateRecommendations(elements, phases);

      expect(result.some((r) => r.includes('critical path'))).toBe(true);
    });

    it('should recommend investigating slow progress', () => {
      const mockElem = createMockElement({
        status: 'in_progress',
        progress_percentage: 15,
      });
      const elements = [mockElem];
      const phases = [];

      const result = (service as any).generateRecommendations(elements, phases);

      expect(result.some((r) => r.includes('slow-progressing'))).toBe(true);
    });

    it('should recommend reviewing cost management for over-budget', () => {
      const mockElem = createMockElement();
      Object.defineProperty(mockElem, 'cost_variance', {
        value: 20,
        writable: true,
      });
      const elements = [mockElem];
      const phases = [];

      const result = (service as any).generateRecommendations(elements, phases);

      expect(result.some((r) => r.includes('cost management'))).toBe(true);
    });

    it('should return positive message when project is on track', () => {
      const mockElem = createMockElement({
        status: 'completed',
        progress_percentage: 100,
      });
      const elements = [mockElem];
      const phases = [{ status: 'completed', phase: 'foundation' }];

      const result = (service as any).generateRecommendations(elements, phases);

      expect(result.some((r) => r.includes('on track'))).toBe(true);
    });
  });
});
