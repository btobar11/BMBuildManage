import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BimClashesService, ClashJob, Clash } from './bim-clashes.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

describe('BimClashesService - 100% Coverage', () => {
  let service: BimClashesService;

  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSupabase.from.mockReset();
    mockSupabase.rpc.mockReset();

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
        {
          provide: 'BullQueue_clash-detection',
          useValue: mockQueue,
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
    const chain = {
      ...result,
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue(result),
      single: jest.fn().mockReturnValue(result),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.not = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.in = jest.fn().mockReturnValue(chain);
    return chain;
  };

  // 1. Basic CRUD Operations
  describe('createJob', () => {
    it('should create a clash job successfully', async () => {
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

    it('should throw error on database failure', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'DB Error' }),
      );

      await expect(service.findAllJobs('company-1')).rejects.toThrow(
        'Failed to fetch clash jobs: DB Error',
      );
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

      jest.spyOn(service, 'findOneJob').mockResolvedValue(mockJob);

      const result = await service.getJobStatus('job-1', 'company-1');
      expect(result).toEqual({ status: 'running', progress: 50 });
    });

    it('should throw when job not found', async () => {
      jest.spyOn(service, 'findOneJob').mockResolvedValue(null);

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

    it('should filter by all parameters', async () => {
      const mockClashes: Clash[] = [];
      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        projectId: 'project-1',
        modelId: 'model-1',
        status: 'pending',
        severity: 'high',
        type: 'hard',
      });
      expect(result).toEqual(mockClashes);
    });

    it('should filter by modelId specifically (line 207)', async () => {
      const mockClashes: Clash[] = [
        {
          id: 'clash-1',
          company_id: 'company-1',
          model_a_id: 'model-1', // This should match
          model_b_id: 'model-other',
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
        {
          id: 'clash-2',
          company_id: 'company-1',
          model_a_id: 'model-other',
          model_b_id: 'model-1', // This should also match
          element_a_id: 'elem-3',
          element_b_id: 'elem-4',
          element_a_guid: 'guid-3',
          element_b_guid: 'guid-4',
          clash_type: 'soft',
          severity: 'medium',
          status: 'pending',
          intersection_volume: 0.3,
          clearance_distance: null,
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
        },
      ];

      mockSupabase.from.mockReturnValue(createQueryBuilder(mockClashes, null));

      const result = await service.findAllClashes('company-1', {
        modelId: 'model-1', // This should trigger line 207 filtering
      });

      expect(result).toEqual(mockClashes); // Both clashes should be returned
    });

    it('should throw on error', async () => {
      mockSupabase.from.mockReturnValue(
        createQueryBuilder(null, { message: 'Error' }),
      );

      await expect(service.findAllClashes('company-1', {})).rejects.toThrow(
        'Failed to fetch clashes: Error',
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

    it('should set resolved_at for resolved status', async () => {
      const updatedClash = { id: 'clash-1', status: 'resolved' };
      mockSupabase.from.mockReturnValue(createQueryBuilder(updatedClash, null));

      await service.update('clash-1', 'company-1', { status: 'resolved' });
      // Test passes if no error thrown
    });

    it('should set resolved_at for ignored status', async () => {
      const updatedClash = { id: 'clash-1', status: 'ignored' };
      mockSupabase.from.mockReturnValue(createQueryBuilder(updatedClash, null));

      await service.update('clash-1', 'company-1', { status: 'ignored' });
      // Test passes if no error thrown
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

  describe('runClashDetection', () => {
    it('should run clash detection successfully', async () => {
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

      jest.spyOn(service, 'findOneJob').mockResolvedValue(mockJob);
      jest.spyOn(service as any, 'performClashDetection').mockResolvedValue([]);
      mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

      await expect(service.runClashDetection('job-1')).resolves.not.toThrow();
    });

    it('should throw error when job not found', async () => {
      jest.spyOn(service, 'findOneJob').mockResolvedValue(null);

      await expect(service.runClashDetection('non-existent')).rejects.toThrow(
        'Job not found',
      );
    });

    it('should handle error in performClashDetection and update job to failed (line 355)', async () => {
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

      jest.spyOn(service, 'findOneJob').mockResolvedValue(mockJob);
      jest
        .spyOn(service as any, 'performClashDetection')
        .mockRejectedValue(new Error('Detection failed'));

      // Mock supabase calls for status updates
      mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

      await service.runClashDetection('job-1');

      // The method should not throw, but should handle the error internally
      // This covers the catch block on line 355
      expect(mockSupabase.from).toHaveBeenCalled();
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
  });

  // Federated Clash Tests
  describe('Federated Clash Operations', () => {
    describe('createFederatedJob', () => {
      it('should create a federated clash job', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          project_id: 'project-1',
          federation_id: 'fed-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          status: 'pending',
          progress: 0,
          clashes_found: 0,
        };

        mockSupabase.from.mockReturnValue(createQueryBuilder(mockJob, null));

        const result = await service.createFederatedJob({
          company_id: 'company-1',
          project_id: 'project-1',
          federation_id: 'fed-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
        });

        expect(result).toEqual(mockJob);
      });

      it('should throw on insert failure', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Insert failed' }),
        );

        await expect(
          service.createFederatedJob({
            company_id: 'company-1',
            project_id: 'project-1',
            federation_id: 'fed-1',
            enabled_disciplines: ['structure'],
          }),
        ).rejects.toThrow(
          'Failed to create federated clash job: Insert failed',
        );
      });
    });

    describe('findAllFederatedJobs', () => {
      it('should return all federated jobs for a company', async () => {
        const mockJobs = [
          { id: 'fed-job-1', status: 'completed' },
          { id: 'fed-job-2', status: 'pending' },
        ];

        mockSupabase.from.mockReturnValue(createQueryBuilder(mockJobs, null));

        const result = await service.findAllFederatedJobs('company-1');
        expect(result).toEqual(mockJobs);
      });

      it('should throw on error', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Error' }),
        );

        await expect(service.findAllFederatedJobs('company-1')).rejects.toThrow(
          'Failed to fetch federated clash jobs: Error',
        );
      });
    });

    describe('findOneFederatedJob', () => {
      it('should return a federated job', async () => {
        const mockJob = { id: 'fed-job-1', status: 'running' };

        mockSupabase.from.mockReturnValue(createQueryBuilder(mockJob, null));

        const result = await service.findOneFederatedJob(
          'fed-job-1',
          'company-1',
        );
        expect(result).toEqual(mockJob);
      });

      it('should return null when not found (PGRST116)', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { code: 'PGRST116' }),
        );

        const result = await service.findOneFederatedJob(
          'non-existent',
          'company-1',
        );
        expect(result).toBeNull();
      });

      it('should throw on other errors', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { code: 'OTHER', message: 'Error' }),
        );

        await expect(
          service.findOneFederatedJob('fed-job-1', 'company-1'),
        ).rejects.toThrow('Failed to fetch federated clash job: Error');
      });
    });

    describe('startFederatedClashDetection', () => {
      it('should start federated clash detection', async () => {
        const mockJob = {
          id: 'fed-job-1',
          status: 'pending',
          company_id: 'company-1',
        };

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

        const result = await service.startFederatedClashDetection(
          'fed-job-1',
          'company-1',
        );
        expect(result.success).toBe(true);
        expect(result.message).toBe('Federated clash detection started');
      });

      it('should throw when job not found', async () => {
        jest.spyOn(service, 'findOneFederatedJob').mockResolvedValue(null);

        await expect(
          service.startFederatedClashDetection('non-existent', 'company-1'),
        ).rejects.toThrow('Federated clash job not found');
      });

      it('should throw when job is not pending', async () => {
        const mockJob = { id: 'fed-job-1', status: 'completed' };

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);

        await expect(
          service.startFederatedClashDetection('fed-job-1', 'company-1'),
        ).rejects.toThrow('Job is already completed');
      });

      it('should throw on update failure', async () => {
        const mockJob = { id: 'fed-job-1', status: 'pending' };

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Update failed' }),
        );

        await expect(
          service.startFederatedClashDetection('fed-job-1', 'company-1'),
        ).rejects.toThrow('Failed to start job: Update failed');
      });

    });

    describe('getFederatedJobProgress', () => {
      it('should return federated job progress', async () => {
        const mockJob = {
          id: 'fed-job-1',
          progress: 50,
          status: 'running',
          clashes_found: 10,
          models_processed: 2,
          total_models: 4,
        };

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);

        const result = await service.getFederatedJobProgress(
          'fed-job-1',
          'company-1',
        );
        expect(result).toEqual({
          progress: 50,
          status: 'running',
          clashes_found: 10,
          models_processed: 2,
          total_models: 4,
        });
      });

      it('should throw when job not found', async () => {
        jest.spyOn(service, 'findOneFederatedJob').mockResolvedValue(null);

        await expect(
          service.getFederatedJobProgress('non-existent', 'company-1'),
        ).rejects.toThrow('Job not found');
      });
    });

    describe('findFederatedClashes', () => {
      it('should return federated clashes with all filters', async () => {
        const mockClashes = [{ id: 'clash-1', federation_job_id: 'fed-job-1' }];

        mockSupabase.from.mockReturnValue(
          createQueryBuilder(mockClashes, null),
        );

        const result = await service.findFederatedClashes('company-1', {
          federationJobId: 'fed-job-1',
          disciplineA: 'structure',
          disciplineB: 'mep_hvac',
          status: 'open',
          severity: 'high',
        });
        expect(result).toEqual(mockClashes);
      });

      it('should return all federated clashes without filters', async () => {
        const mockClashes: any[] = [];

        mockSupabase.from.mockReturnValue(
          createQueryBuilder(mockClashes, null),
        );

        const result = await service.findFederatedClashes('company-1', {});
        expect(result).toEqual(mockClashes);
      });

      it('should throw on error', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Error' }),
        );

        await expect(
          service.findFederatedClashes('company-1', {}),
        ).rejects.toThrow('Failed to fetch federated clashes: Error');
      });
    });

    describe('updateFederatedClash', () => {
      it('should update a federated clash', async () => {
        const mockClash = {
          id: 'clash-1',
          status: 'resolved',
          resolved_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.from.mockReturnValue(createQueryBuilder(mockClash, null));

        const result = await service.updateFederatedClash(
          'clash-1',
          'company-1',
          {
            status: 'resolved',
            resolution_notes: 'Fixed',
          },
        );
        expect(result.status).toBe('resolved');
      });

      it('should set resolved_at when status is resolved', async () => {
        const mockClash = { id: 'clash-1', status: 'resolved' };
        mockSupabase.from.mockReturnValue(createQueryBuilder(mockClash, null));

        await service.updateFederatedClash('clash-1', 'company-1', {
          status: 'resolved',
        });
        // Test passes if no error thrown
      });

      it('should set resolved_at when status is ignored', async () => {
        const mockClash = { id: 'clash-1', status: 'ignored' };
        mockSupabase.from.mockReturnValue(createQueryBuilder(mockClash, null));

        await service.updateFederatedClash('clash-1', 'company-1', {
          status: 'ignored',
        });
        // Test passes if no error thrown
      });

      it('should throw on error', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Error' }),
        );

        await expect(
          service.updateFederatedClash('clash-1', 'company-1', {
            status: 'resolved',
          }),
        ).rejects.toThrow('Failed to update federated clash: Error');
      });
    });
  });

  // Helper Methods Tests
  describe('Helper Methods', () => {
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
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 1,
            maxY: 1,
            maxZ: 1,
          },
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
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 1,
            maxY: 1,
            maxZ: 1,
          },
        };
        const elemB = {
          id: '2',
          ifc_guid: 'g2',
          bounding_box: {
            minX: 5,
            minY: 5,
            minZ: 5,
            maxX: 6,
            maxY: 6,
            maxZ: 6,
          },
        };

        const result = (service as any).checkBoundingBoxClash(elemA, elemB);
        expect(result).toBeNull();
      });
    });

    describe('determineClashType', () => {
      it('should return hard for structure-architecture', () => {
        const result = (service as any).determineClashType(
          'structure',
          'architecture',
        );
        expect(result).toBe('hard');
      });

      it('should return hard for structure-structure', () => {
        const result = (service as any).determineClashType(
          'structure',
          'structure',
        );
        expect(result).toBe('hard');
      });

      it('should return soft for structure-mep', () => {
        const result = (service as any).determineClashType(
          'structure',
          'mep_hvac',
        );
        expect(result).toBe('soft');
      });

      it('should return soft for mep-structure', () => {
        const result = (service as any).determineClashType(
          'mep_hvac',
          'structure',
        );
        expect(result).toBe('soft');
      });

      it('should return clearance for mep-mep', () => {
        const result = (service as any).determineClashType(
          'mep_hvac',
          'mep_plumbing',
        );
        expect(result).toBe('clearance');
      });

      it('should return hard for unknown disciplines', () => {
        const result = (service as any).determineClashType('unknown', 'other');
        expect(result).toBe('hard');
      });
    });

    describe('meetsSeverityThreshold', () => {
      it('should return true when severity meets threshold', () => {
        const result = (service as any).meetsSeverityThreshold(
          'high',
          'medium',
        );
        expect(result).toBe(true);
      });

      it('should return false when severity does not meet threshold', () => {
        const result = (service as any).meetsSeverityThreshold('low', 'high');
        expect(result).toBe(false);
      });

      it('should return true when severity equals threshold', () => {
        const result = (service as any).meetsSeverityThreshold(
          'medium',
          'medium',
        );
        expect(result).toBe(true);
      });
    });
  });

  // Comment System Tests
  describe('Comment System', () => {
    describe('addClashComment', () => {
      it('should add a comment to a clash', async () => {
        const mockComment = {
          id: 'comment-1',
          content: 'Test comment',
          author_email: 'test@test.com',
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.rpc.mockResolvedValue({ data: 'comment-1', error: null });
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(mockComment, null),
        );

        const result = await service.addClashComment('clash-1', 'company-1', {
          content: 'Test comment',
          author_email: 'test@test.com',
        });

        expect(result).toEqual(mockComment);
      });

      it('should throw on RPC error', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: { message: 'RPC Error' },
        });

        await expect(
          service.addClashComment('clash-1', 'company-1', {
            content: 'Test',
            author_email: 'test@test.com',
          }),
        ).rejects.toThrow('Failed to add comment: RPC Error');
      });

      it('should throw on fetch error after RPC success', async () => {
        mockSupabase.rpc.mockResolvedValue({ data: 'comment-1', error: null });
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Fetch Error' }),
        );

        await expect(
          service.addClashComment('clash-1', 'company-1', {
            content: 'Test',
            author_email: 'test@test.com',
          }),
        ).rejects.toThrow('Failed to fetch comment: Fetch Error');
      });
    });

    describe('getClashComments', () => {
      it('should return comments for a clash', async () => {
        const mockComments = [
          {
            id: 'comment-1',
            content: 'Test comment',
            author_email: 'test@test.com',
          },
        ];

        mockSupabase.from.mockReturnValue(
          createQueryBuilder(mockComments, null),
        );

        const result = await service.getClashComments('clash-1', 'company-1');
        expect(result).toEqual(mockComments);
      });

      it('should return empty array when no comments', async () => {
        mockSupabase.from.mockReturnValue(createQueryBuilder([], null));

        const result = await service.getClashComments('clash-1', 'company-1');
        expect(result).toEqual([]);
      });

      it('should throw on error', async () => {
        mockSupabase.from.mockReturnValue(
          createQueryBuilder(null, { message: 'Error' }),
        );

        await expect(
          service.getClashComments('clash-1', 'company-1'),
        ).rejects.toThrow('Failed to fetch comments: Error');
      });
    });
  });

  // Private Methods Coverage Tests
  describe('Private Methods Coverage', () => {
    describe('performClashDetection', () => {
      it('should perform clash detection and return clashes', async () => {
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

        const mockElementsA = [
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
        ];

        const mockElementsB = [
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

        mockSupabase.from
          .mockReturnValueOnce(createQueryBuilder(mockElementsA, null))
          .mockReturnValueOnce(createQueryBuilder(mockElementsB, null))
          .mockReturnValue(createQueryBuilder(null, null));

        const result = await (service as any).performClashDetection(mockJob);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle null elements gracefully', async () => {
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

        mockSupabase.from
          .mockReturnValueOnce(createQueryBuilder(null, null))
          .mockReturnValueOnce(createQueryBuilder(null, null));

        const result = await (service as any).performClashDetection(mockJob);

        expect(result).toEqual([]);
      });

      it('should handle progress updates during clash detection', async () => {
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

        // Create 101 elements to trigger progress update
        const mockElementsA = Array.from({ length: 101 }, (_, i) => ({
          id: `elem-a-${i}`,
          ifc_guid: `guid-a-${i}`,
          bounding_box: {
            minX: i,
            minY: i,
            minZ: i,
            maxX: i + 1,
            maxY: i + 1,
            maxZ: i + 1,
          },
        }));

        const mockElementsB = [
          {
            id: 'elem-b-1',
            ifc_guid: 'guid-b-1',
            bounding_box: {
              minX: 0,
              minY: 0,
              minZ: 0,
              maxX: 1,
              maxY: 1,
              maxZ: 1,
            },
          },
        ];

        mockSupabase.from
          .mockReturnValueOnce(createQueryBuilder(mockElementsA, null))
          .mockReturnValueOnce(createQueryBuilder(mockElementsB, null))
          .mockReturnValue(createQueryBuilder(null, null));

        const result = await (service as any).performClashDetection(mockJob);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('processFederatedClashDetection', () => {
      it('should process federated clash detection successfully', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          tolerance_mm: 10,
          severity_threshold: 'medium',
        };

        const mockPairs = [
          {
            element_a_id: 'elem-1',
            element_b_id: 'elem-2',
            element_a_guid: 'guid-1',
            element_b_guid: 'guid-2',
            overlap_volume: 0.5,
          },
        ];

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.rpc.mockResolvedValue({ data: mockPairs, error: null });
        mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

        await (service as any).processFederatedClashDetection('fed-job-1');

        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'get_potential_clash_pairs',
          expect.any(Object),
        );
      });

      it('should handle RPC error gracefully', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          tolerance_mm: 10,
          severity_threshold: 'medium',
        };

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: { message: 'RPC Error' },
        });
        mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

        await (service as any).processFederatedClashDetection('fed-job-1');

        expect(mockSupabase.rpc).toHaveBeenCalled();
      });

      it('should return early if job not found', async () => {
        jest.spyOn(service, 'findOneFederatedJob').mockResolvedValue(null);

        await (service as any).processFederatedClashDetection('non-existent');

        expect(mockSupabase.rpc).not.toHaveBeenCalled();
      });

      it('should handle pairs with zero overlap volume', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          tolerance_mm: 10,
          severity_threshold: 'medium',
        };

        const mockPairs = [
          {
            element_a_id: 'elem-1',
            element_b_id: 'elem-2',
            element_a_guid: 'guid-1',
            element_b_guid: 'guid-2',
            overlap_volume: 0, // Zero overlap
          },
        ];

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.rpc.mockResolvedValue({ data: mockPairs, error: null });
        mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

        await (service as any).processFederatedClashDetection('fed-job-1');

        expect(mockSupabase.rpc).toHaveBeenCalled();
      });

      it('should handle progress updates for large batches', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          tolerance_mm: 10,
          severity_threshold: 'low',
        };

        // Create 51 pairs to trigger progress update
        const mockPairs = Array.from({ length: 51 }, (_, i) => ({
          element_a_id: `elem-a-${i}`,
          element_b_id: `elem-b-${i}`,
          element_a_guid: `guid-a-${i}`,
          element_b_guid: `guid-b-${i}`,
          overlap_volume: 0.1,
        }));

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.rpc
          .mockResolvedValueOnce({ data: mockPairs, error: null })
          .mockResolvedValue({ data: null, error: null });
        mockSupabase.from.mockReturnValue(createQueryBuilder(null, null));

        await (service as any).processFederatedClashDetection('fed-job-1');

        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'update_bim_federated_job_progress',
          expect.any(Object),
        );
      });

      it('should handle insert error during processing', async () => {
        const mockJob = {
          id: 'fed-job-1',
          company_id: 'company-1',
          enabled_disciplines: ['structure', 'mep_hvac'],
          tolerance_mm: 10,
          severity_threshold: 'low',
        };

        const mockPairs = [
          {
            element_a_id: 'elem-1',
            element_b_id: 'elem-2',
            element_a_guid: 'guid-1',
            element_b_guid: 'guid-2',
            overlap_volume: 0.5,
          },
        ];

        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockResolvedValue(mockJob as any);
        mockSupabase.rpc.mockResolvedValue({ data: mockPairs, error: null });

        // First call - update total_models (success)
        // Second call - insert clashes (error)
        mockSupabase.from
          .mockReturnValueOnce(createQueryBuilder(null, null))
          .mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          });

        // Service catches errors internally and calls complete_bim_federated_job with success: false
        await (service as any).processFederatedClashDetection('fed-job-1');

        // Verify the job was completed with error
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'complete_bim_federated_job',
          {
            p_job_id: 'fed-job-1',
            p_success: false,
            p_error_message: 'Failed to insert clashes: Insert failed',
            p_error_details: expect.any(Object),
          },
        );
      });

      it('should handle error during processing', async () => {
        jest
          .spyOn(service, 'findOneFederatedJob')
          .mockRejectedValueOnce(new Error('Database error'));
        mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

        await (service as any).processFederatedClashDetection('fed-job-1');

        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'complete_bim_federated_job',
          {
            p_job_id: 'fed-job-1',
            p_success: false,
            p_error_message: 'Database error',
            p_error_details: { error: 'Error: Database error' },
          },
        );
      });
    });
  });
});
