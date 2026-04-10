import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BIMAnalyticsService } from './bim-analytics.service';

function createMockQueryBuilder(data: any, error: any = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: undefined,
  };

  const resolveWithData = (resolvedData: any) => ({
    then: (resolve: any) => {
      resolve({ data: resolvedData, error: null });
      return { catch: () => ({}) };
    },
  });

  chain.order.mockImplementation(() => resolveWithData(data));
  chain.select.mockReturnThis();

  return chain;
}

function createMockSupabase() {
  return {
    from: jest.fn().mockImplementation(() => createMockQueryBuilder([])),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
}

describe('BIMAnalyticsService', () => {
  let service: BIMAnalyticsService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockBIMElement: any;
  let mockCostAnalysis: any[];
  let mockClashAnalysis: any;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BIMAnalyticsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'supabase.url':
                  return 'https://test.supabase.co';
                case 'supabase.anonKey':
                  return 'test-anon-key';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BIMAnalyticsService>(BIMAnalyticsService);
    mockSupabase = createMockSupabase();
    mockBIMElement = {
      id: 'bim-1',
      company_id: 'company-1',
      project_id: 'project-1',
      model_id: 'model-1',
      ifc_guid: 'ifc-guid-1',
      ifc_type: 'IfcWall',
      name: 'Test Wall',
      level: 'Level 1',
      category: 'Walls',
      quantities: {
        netVolume: 5.0,
        netArea: 10.0,
        grossVolume: 5.5,
        grossArea: 11.0,
      },
      bounding_box: { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 2, z: 3 } },
      material: 'Concrete',
      storey_name: 'Ground Floor',
      created_at: new Date().toISOString(),
    };
    mockCostAnalysis = [
      { ifc_type: 'IfcWall', element_count: 50, total_cost: 125000 },
      { ifc_type: 'IfcSlab', element_count: 20, total_cost: 80000 },
    ];
    mockClashAnalysis = {
      totalClashes: 15,
      bySeverity: { critical: 2, high: 5, medium: 6, low: 2 },
      byType: { wall_column: 5, MEP_structure: 3, door_wall: 7 },
    };
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }) as any,
    );
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  function createQueryBuilder(data: any[]) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockImplementation(() => ({
        then: (resolve: any) => {
          resolve({ data, error: null });
          return { catch: () => ({}) };
        },
      })),
    };
  }

  describe('Service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required public methods', () => {
      expect(typeof service.getBIMElements).toBe('function');
      expect(typeof service.generateCostAnalysis).toBe('function');
      expect(typeof service.generateClashAnalysis).toBe('function');
      expect(typeof service.generateProgressAnalysis).toBe('function');
      expect(typeof service.generateQualityMetrics).toBe('function');
      expect(typeof service.generateResourceOptimization).toBe('function');
      expect(typeof service.getBIMSummaryInsights).toBe('function');
    });

    it('should have supabase client initialized', () => {
      expect((service as any).supabase).toBeDefined();
      expect((service as any).supabase.from).toBeDefined();
      expect((service as any).supabase.rpc).toBeDefined();
    });
  });

  describe('getBIMElements', () => {
    it('should return empty array when no data exists', async () => {
      const mockSupabase = createMockSupabase();
      (service as any).supabase = mockSupabase;

      const result = await service.getBIMElements('company-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return elements when data exists', async () => {
      const mockElements = [
        { id: '1', ifc_guid: 'guid-1', ifc_type: 'IfcWall', name: 'Wall 1' },
        { id: '2', ifc_guid: 'guid-2', ifc_type: 'IfcSlab', name: 'Slab 1' },
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: mockElements, error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.getBIMElements('company-1');

      expect(result).toEqual(mockElements);
    });

    it('should handle projectId filter correctly', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: [], error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.getBIMElements('company-1', {
        projectId: 'project-1',
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateCostAnalysis', () => {
    it('should return array when RPC succeeds', async () => {
      const mockRpcData = [
        { ifc_type: 'IfcWall', element_count: 10, total_cost: 50000 },
      ];
      const mockSupabase = {
        from: jest.fn(),
        rpc: jest.fn().mockResolvedValue({ data: mockRpcData, error: null }),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateCostAnalysis('company-1');

      expect(result).toEqual(mockRpcData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'analyze_bim_costs_by_type',
        {
          p_company_id: 'company-1',
          p_project_id: null,
        },
      );
    });

    it('should return array when RPC fails and fallback works', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: [], error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'RPC failed' } }),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateCostAnalysis('company-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateClashAnalysis', () => {
    it('should return clash analysis with correct structure', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: [], error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateClashAnalysis('company-1');

      expect(result).toHaveProperty('totalClashes');
      expect(result).toHaveProperty('bySeverity');
      expect(result.totalClashes).toBe(0);
    });

    it('should return default analysis on error', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (_resolve: any, reject: any) => {
              reject(new Error('DB Error'));
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateClashAnalysis('company-1');

      expect(result.totalClashes).toBe(0);
      expect(result.bySeverity.critical).toBe(0);
    });
  });

  describe('generateProgressAnalysis', () => {
    it('should return progress analysis with correct structure', async () => {
      const mockElements = [
        { id: '1', ifc_type: 'IfcWall', storey_name: 'Level 1' },
      ];

      let fromCallCount = 0;
      const mockSupabase = {
        from: jest.fn().mockImplementation((table: string) => {
          fromCallCount++;
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            order: jest.fn().mockImplementation(() => ({
              then: (resolve: any) => {
                resolve({
                  data: table === 'bim_elements' ? mockElements : [],
                  error: null,
                });
                return { catch: () => ({}) };
              },
            })),
          };
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateProgressAnalysis(
        'company-1',
        'project-1',
      );

      expect(result).toHaveProperty('totalElements');
      expect(result).toHaveProperty('completedElements');
      expect(result).toHaveProperty('progressPercentage');
    });
  });

  describe('generateQualityMetrics', () => {
    it('should return quality metrics with correct structure', async () => {
      const mockElements = [
        { id: '1', ifc_type: 'IfcWall', storey_name: 'Level 1' },
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: mockElements, error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn(),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateQualityMetrics(
        'company-1',
        'project-1',
      );

      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('elementsWithIssues');
      expect(result).toHaveProperty('commonIssues');
    });
  });

  describe('generateResourceOptimization', () => {
    it('should return resource optimization with correct structure', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: [], error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.generateResourceOptimization(
        'company-1',
        'project-1',
      );

      expect(result).toHaveProperty('materialWaste');
      expect(result).toHaveProperty('laborEfficiency');
      expect(result).toHaveProperty('optimizationRecommendations');
      expect(Array.isArray(result.materialWaste)).toBe(true);
      expect(Array.isArray(result.laborEfficiency)).toBe(true);
    });
  });

  describe('getBIMSummaryInsights', () => {
    it('should return summary insights with correct structure', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => ({
            then: (resolve: any) => {
              resolve({ data: [], error: null });
              return { catch: () => ({}) };
            },
          })),
        }),
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (service as any).supabase = mockSupabase;

      const result = await service.getBIMSummaryInsights(
        'company-1',
        'project-1',
      );

      expect(result).toHaveProperty('totalElements');
      expect(result).toHaveProperty('totalVolume');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('activeClashes');
      expect(result).toHaveProperty('criticalIssues');
      expect(result).toHaveProperty('keyRecommendations');
    });
  });

  describe('Advanced coverage tests', () => {
    it('should handle external API 500 error in generateClashAnalysis', async () => {
      fetchSpy.mockClear();
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      } as any);

      const result = await service.generateClashAnalysis('company-1');
      expect(result.totalClashes).toBe(0);
    });

    it('should handle external API 404 error in generateClashAnalysis', async () => {
      fetchSpy.mockClear();
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      } as any);

      const result = await service.generateClashAnalysis('company-1');
      expect(result.totalClashes).toBe(0);
    });

    it('should handle network timeout in generateClashAnalysis', async () => {
      fetchSpy.mockClear();
      fetchSpy.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const result = await service.generateClashAnalysis('company-1');
      expect(result.totalClashes).toBe(0);
    });

    it('should handle malformed JSON responses in generateClashAnalysis', async () => {
      fetchSpy.mockClear();
      fetchSpy.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any);

      const result = await service.generateClashAnalysis('company-1');

      expect(result.totalClashes).toBe(0);
      expect(result.bySeverity).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    });

    it('should return default quality metrics structure', async () => {
      const result = await service.generateQualityMetrics(
        'company-1',
        'project-1',
      );
      expect(result).toHaveProperty('elementsWithIssues');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('commonIssues');
      expect(result).toHaveProperty('modelCompleteness');
      expect(result).toHaveProperty('dataConsistency');
    });

    it('should return default resource optimization structure', async () => {
      const result = await service.generateResourceOptimization(
        'company-1',
        'project-1',
      );
      expect(result).toHaveProperty('materialWaste');
      expect(result).toHaveProperty('laborEfficiency');
      expect(result).toHaveProperty('equipmentUtilization');
      expect(result).toHaveProperty('optimizationRecommendations');
    });
  });
});
