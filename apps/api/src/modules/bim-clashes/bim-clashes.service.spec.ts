import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BimClashesService, ClashJob, Clash } from './bim-clashes.service';

describe('BimClashesService', () => {
  let service: BimClashesService;

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSupabase.from.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BimClashesService,
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

    service = module.get<BimClashesService>(BimClashesService);
    (service as any).supabase = mockSupabase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createMockResponse = (data: any, error: any = null) => ({
    data,
    error,
  });

  const createQueryBuilder = (data: any, error: any = null) => {
    const result = createMockResponse(data, error);
    const eqFn = jest.fn();
    const chain = {
      ...result,
      eq: eqFn,
      order: jest.fn().mockReturnValue(result),
      single: jest.fn().mockReturnValue(result),
      select: jest.fn().mockReturnValue({
        ...result,
        eq: eqFn,
        order: jest.fn().mockReturnValue(result),
        single: jest.fn().mockReturnValue(result),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue(result),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: eqFn,
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue(result),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: eqFn,
      }),
    };
    eqFn.mockReturnValue(chain);
    return chain;
  };

  describe('createJob', () => {
    it('should create a clash job', async () => {
      const mockJob: ClashJob = {
        id: 'job-1',
        company_id: 'company-1',
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        status: 'pending',
        progress: 0,
        clashes_found: 0,
        started_at: null,
        completed_at: null,
        error_message: null,
      };

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockJob, null));

      const result = await service.createJob({
        company_id: 'company-1',
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
      });

      expect(result).toEqual(mockJob);
    });

    it('should throw error on insert failure', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Insert failed' }),
      );

      await expect(
        service.createJob({
          company_id: 'company-1',
          project_id: 'project-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
        }),
      ).rejects.toThrow('Failed to create clash job: Insert failed');
    });
  });

  describe('findAllJobs', () => {
    it('should return all jobs for a company', async () => {
      const mockJobs: ClashJob[] = [
        {
          id: 'job-1',
          company_id: 'company-1',
          project_id: 'project-1',
          model_a_id: 'a',
          model_b_id: 'b',
          status: 'pending',
          progress: 0,
          clashes_found: 0,
          started_at: null,
          completed_at: null,
          error_message: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockJobs, null));

      const result = await service.findAllJobs('company-1');
      expect(result).toEqual(mockJobs);
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(service.findAllJobs('company-1')).rejects.toThrow(
        'Failed to fetch clash jobs: Error',
      );
    });
  });

  describe('getSeverityFromVolume', () => {
    it('should return critical for volume > 10', () => {
      const result = (service as any).getSeverityFromVolume(15);
      expect(result).toBe('critical');
    });

    it('should return high for volume > 1', () => {
      const result = (service as any).getSeverityFromVolume(5);
      expect(result).toBe('high');
    });

    it('should return medium for volume > 0.1', () => {
      const result = (service as any).getSeverityFromVolume(0.5);
      expect(result).toBe('medium');
    });

    it('should return low for volume <= 0.1', () => {
      const result = (service as any).getSeverityFromVolume(0.05);
      expect(result).toBe('low');
    });
  });

  describe('getOverlap', () => {
    it('should calculate overlap correctly', () => {
      const result = (service as any).getOverlap(0, 5, 3, 8);
      expect(result).toBe(2);
    });

    it('should return 0 when no overlap', () => {
      const result = (service as any).getOverlap(0, 2, 3, 5);
      expect(result).toBe(0);
    });
  });

  describe('checkBoundingBoxClash', () => {
    it('should detect clash when boxes overlap', () => {
      const elemA = {
        id: '1',
        ifc_guid: 'g1',
        bounding_box: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
      };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        bounding_box: {
          minX: 0.5,
          minY: 0.5,
          minZ: 0.5,
          maxX: 1.5,
          maxY: 1.5,
          maxZ: 1.5,
        },
      };

      const result = (service as any).checkBoundingBoxClash(elemA, elemB);
      expect(result).not.toBeNull();
      expect(result?.clashType).toBe('hard');
    });

    it('should return null when no bounding box', () => {
      const elemA = { id: '1', ifc_guid: 'g1', bounding_box: null };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        bounding_box: {
          minX: 0.5,
          minY: 0.5,
          minZ: 0.5,
          maxX: 1.5,
          maxY: 1.5,
          maxZ: 1.5,
        },
      };

      const result = (service as any).checkBoundingBoxClash(elemA, elemB);
      expect(result).toBeNull();
    });

    it('should return null when boxes do not overlap', () => {
      const elemA = {
        id: '1',
        ifc_guid: 'g1',
        bounding_box: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
      };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        bounding_box: { minX: 5, minY: 5, minZ: 5, maxX: 6, maxY: 6, maxZ: 6 },
      };

      const result = (service as any).checkBoundingBoxClash(elemA, elemB);
      expect(result).toBeNull();
    });

    it('should return null when elemA has no bounding box', () => {
      const elemA = { id: '1', ifc_guid: 'g1', bounding_box: null };
      const elemB = { id: '2', ifc_guid: 'g2', bounding_box: null };

      const result = (service as any).checkBoundingBoxClash(elemA, elemB);
      expect(result).toBeNull();
    });
  });

  describe('findOneJob', () => {
    it('should find a job by id', async () => {
      const mockJob: ClashJob = {
        id: 'job-1',
        company_id: 'company-1',
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        status: 'completed',
        progress: 100,
        clashes_found: 5,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:01:00Z',
        error_message: null,
      };

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockJob, null));

      const result = await service.findOneJob('job-1', 'company-1');
      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found (PGRST116)', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'PGRST116' }),
      );

      const result = await service.findOneJob('non-existent', 'company-1');
      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'OTHER', message: 'Error' }),
      );

      await expect(service.findOneJob('job-1', 'company-1')).rejects.toThrow(
        'Failed to fetch clash job: Error',
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status and progress', async () => {
      const mockJob: ClashJob = {
        id: 'job-1',
        company_id: 'company-1',
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        status: 'running',
        progress: 50,
        clashes_found: 0,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        error_message: null,
      };

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockJob, null));

      const result = await service.getJobStatus('job-1', 'company-1');
      expect(result).toEqual({ status: 'running', progress: 50 });
    });

    it('should throw when job not found', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'PGRST116' }),
      );

      await expect(
        service.getJobStatus('non-existent', 'company-1'),
      ).rejects.toThrow('Job not found');
    });
  });

  describe('findAllClashes', () => {
    it('should return all clashes for company', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'high',
          status: 'pending',
          intersection_volume: 0.5,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {});
      expect(result).toEqual(mockClashes);
    });

    it('should filter by status', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'high',
          status: 'resolved',
          intersection_volume: 0.5,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: '2024-01-01T00:01:00Z',
          resolved_by: 'user-1',
          resolution_notes: 'Fixed',
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        status: 'resolved',
      });
      expect(result).toEqual(mockClashes);
    });

    it('should filter by modelId', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'high',
          status: 'pending',
          intersection_volume: 0.5,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        modelId: 'model-a',
      });
      expect(result).toEqual(mockClashes);
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(service.findAllClashes('company-1', {})).rejects.toThrow(
        'Failed to fetch clashes: Error',
      );
    });

    it('should filter by severity', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'critical',
          status: 'pending',
          intersection_volume: 5,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        severity: 'critical',
      });
      expect(result).toEqual(mockClashes);
    });

    it('should filter by type', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'clearance',
          severity: 'medium',
          status: 'pending',
          intersection_volume: null,
          clearance_distance: 0.5,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        type: 'clearance',
      });
      expect(result).toEqual(mockClashes);
    });

    it('should filter by multiple criteria', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'high',
          status: 'pending',
          intersection_volume: 2,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        status: 'pending',
        severity: 'high',
        type: 'hard',
      });
      expect(result).toEqual(mockClashes);
    });
  });

  describe('runClashDetection', () => {
    it('should run clash detection and update job status', async () => {
      const mockJob: ClashJob = {
        id: 'job-1',
        company_id: 'company-1',
        project_id: 'project-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        status: 'pending',
        progress: 0,
        clashes_found: 0,
        started_at: null,
        completed_at: null,
        error_message: null,
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 1,
            maxY: 1,
            maxZ: 1,
          },
        },
        {
          id: 'elem-2',
          ifc_guid: 'guid-2',
          bounding_box: {
            minX: 0.5,
            minY: 0.5,
            minZ: 0.5,
            maxX: 1.5,
            maxY: 1.5,
            maxZ: 1.5,
          },
        },
      ];

      const findOneJobResponse = { data: mockJob, error: null };
      const elementsResponse = { data: mockElements, error: null };
      const updateResponse = { data: null, error: null };
      const insertResponse = { data: null, error: null };

      mockSupabase.from
        .mockReturnValueOnce({
          ...createQueryBuilder(mockJob, null),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(findOneJobResponse),
            order: jest.fn().mockReturnValue(findOneJobResponse),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(elementsResponse),
              single: jest.fn().mockReturnValue(elementsResponse),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(updateResponse),
            }),
            insert: jest.fn().mockReturnValue(insertResponse),
          }),
        })
        .mockReturnValueOnce({
          ...createQueryBuilder(mockElements, null),
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(elementsResponse),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(updateResponse),
            }),
            insert: jest.fn().mockReturnValue(insertResponse),
          }),
        })
        .mockReturnValueOnce({
          ...createQueryBuilder(null, null),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(updateResponse),
          }),
        })
        .mockReturnValueOnce({
          ...createQueryBuilder(null, null),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(updateResponse),
          }),
        })
        .mockReturnValueOnce({
          ...createQueryBuilder(null, null),
          insert: jest.fn().mockReturnValue(insertResponse),
        });

      await expect(service.runClashDetection('job-1')).resolves.not.toThrow();
    });

    it('should throw error when job not found', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'PGRST116' }),
      );

      await expect(service.runClashDetection('non-existent')).rejects.toThrow(
        'Job not found',
      );
    });
  });

  describe('findOne', () => {
    it('should find a clash by id', async () => {
      const mockClash: Clash = {
        id: 'clash-1',
        company_id: 'company-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        element_a_id: 'elem-1',
        element_b_id: 'elem-2',
        element_a_guid: 'guid-1',
        element_b_guid: 'guid-2',
        clash_type: 'hard',
        severity: 'high',
        status: 'pending',
        intersection_volume: 0.5,
        clearance_distance: null,
        detected_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
      };

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClash, null));

      const result = await service.findOne('clash-1', 'company-1');
      expect(result).toEqual(mockClash);
    });

    it('should return null when not found', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'PGRST116' }),
      );

      const result = await service.findOne('non-existent', 'company-1');
      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { code: 'OTHER', message: 'Error' }),
      );

      await expect(service.findOne('clash-1', 'company-1')).rejects.toThrow(
        'Failed to fetch clash: Error',
      );
    });
  });

  describe('update', () => {
    it('should update a clash', async () => {
      const updatedClash: Clash = {
        id: 'clash-1',
        company_id: 'company-1',
        model_a_id: 'model-a',
        model_b_id: 'model-b',
        element_a_id: 'elem-1',
        element_b_id: 'elem-2',
        element_a_guid: 'guid-1',
        element_b_guid: 'guid-2',
        clash_type: 'hard',
        severity: 'high',
        status: 'resolved',
        intersection_volume: 0.5,
        clearance_distance: null,
        detected_at: '2024-01-01T00:00:00Z',
        resolved_at: '2024-01-01T00:01:00Z',
        resolved_by: 'user-1',
        resolution_notes: 'Fixed',
      };

      mockSupabase.from.mockReturnValue(createQueryBuilder(updatedClash, null));

      const result = await service.update('clash-1', 'company-1', {
        status: 'resolved',
        resolution_notes: 'Fixed',
      });
      expect(result.status).toBe('resolved');
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(
        service.update('clash-1', 'company-1', { status: 'resolved' }),
      ).rejects.toThrow('Failed to update clash: Error');
    });
  });

  describe('remove', () => {
    it('should delete a clash', async () => {
      mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

      await expect(
        service.remove('clash-1', 'company-1'),
      ).resolves.not.toThrow();
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(service.remove('clash-1', 'company-1')).rejects.toThrow(
        'Failed to delete clash: Error',
      );
    });
  });

  describe('removeByJob', () => {
    it('should delete clashes by job id', async () => {
      mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

      await expect(
        service.removeByJob('job-1', 'company-1'),
      ).resolves.not.toThrow();
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(service.removeByJob('job-1', 'company-1')).rejects.toThrow(
        'Failed to delete clashes by job: Error',
      );
    });
  });

  describe('getClashSummary', () => {
    it('should return clash summary', async () => {
      const mockJobs: ClashJob[] = [
        {
          id: 'job-1',
          company_id: 'company-1',
          project_id: 'project-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          status: 'completed',
          progress: 100,
          clashes_found: 5,
          started_at: null,
          completed_at: null,
          error_message: null,
        },
        {
          id: 'job-2',
          company_id: 'company-1',
          project_id: 'project-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          status: 'failed',
          progress: 50,
          clashes_found: 0,
          started_at: null,
          completed_at: null,
          error_message: 'Error',
        },
      ];

      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-a',
          model_b_id: 'model-b',
          element_a_id: 'elem-1',
          element_b_id: 'elem-2',
          element_a_guid: 'guid-1',
          element_b_guid: 'guid-2',
          clash_type: 'hard',
          severity: 'high',
          status: 'pending',
          intersection_volume: 0.5,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce(createQueryBuilder(mockJobs, null))
        .mockReturnValueOnce(createQueryBuilder(mockClashes, null));

      const result = await service.getClashSummary('company-1', 'project-1');
      expect(result.totalJobs).toBe(2);
      expect(result.completedJobs).toBe(1);
      expect(result.failedJobs).toBe(1);
      expect(result.totalClashes).toBe(1);
    });

    it('should handle empty data', async () => {
      mockSupabase.from
        .mockReturnValueOnce(createQueryBuilder([], null))
        .mockReturnValueOnce(createQueryBuilder([], null));

      const result = await service.getClashSummary('company-1', 'project-1');
      expect(result.totalJobs).toBe(0);
      expect(result.totalClashes).toBe(0);
    });
  });
});
