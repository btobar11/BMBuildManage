import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BIMAnalyticsService } from './bim-analytics.service';

describe('BIMAnalyticsService', () => {
  let service: BIMAnalyticsService;
  let mockSupabase: any;
  let mockConfigService: any;

  // Helper to create a fluent mock for Supabase queries
  const createFluentMock = (data: any, error: any = null) => {
    const mock: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data, error }),
      then: (resolve: any) => resolve({ data, error }),
    };
    return mock;
  };

  beforeEach(async () => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'supabase.url') return 'https://test.supabase.co';
        if (key === 'supabase.anonKey') return 'test-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BIMAnalyticsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BIMAnalyticsService>(BIMAnalyticsService);
    (service as any).supabase = mockSupabase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBIMElements', () => {
    const companyId = 'c-1';

    it('should fetch elements with all filters', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bim_models') return createFluentMock([{ id: 'm-1' }]);
        if (table === 'bim_elements')
          return createFluentMock([
            { id: 'e-1', quantities: {}, ifc_type: 'Wall' },
          ]);
        return createFluentMock([]);
      });

      const result = await service.getBIMElements(companyId, {
        projectId: 'p-1',
        modelId: 'm-1',
        ifcType: 'IfcWall',
        storeyName: 'Level 1',
      });

      expect(result).toHaveLength(1);
    });

    it('should throw if model fetch fails', async () => {
      mockSupabase.from.mockReturnValue(
        createFluentMock(null, { message: 'DB fail' }),
      );
      await expect(
        service.getBIMElements(companyId, { projectId: 'p-1' }),
      ).rejects.toThrow('Failed to fetch BIM models: DB fail');
    });

    it('should return empty if no models found for project', async () => {
      mockSupabase.from.mockReturnValue(createFluentMock([]));
      const result = await service.getBIMElements(companyId, {
        projectId: 'p-1',
      });
      expect(result).toEqual([]);
    });

    it('should throw if elements fetch fails', async () => {
      mockSupabase.from.mockReturnValue(
        createFluentMock(null, { message: 'error' }),
      );
      await expect(service.getBIMElements(companyId)).rejects.toThrow(
        'Failed to fetch BIM elements: error',
      );
    });
  });

  describe('generateCostAnalysis', () => {
    it('should use RPC and return data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ totalCost: 100 }],
        error: null,
      });
      const result = await service.generateCostAnalysis('c-1');
      expect(result).toHaveLength(1);
    });

    it('should fallback to local analysis on error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC fail' },
      });
      jest.spyOn(service, 'getBIMElements').mockResolvedValue([]);
      mockSupabase.from.mockReturnValue(createFluentMock([]));

      const result = await service.generateCostAnalysis('c-1');
      expect(result).toEqual([]);
    });
  });

  describe('generateCostAnalysisLocal', () => {
    it('should calculate costs correctly and sort', async () => {
      const mockElements = [
        {
          ifc_guid: 'g1',
          ifc_type: 'Wall',
          quantities: { netVolume: 10, netArea: 5 },
        },
        {
          ifc_guid: 'g2',
          ifc_type: 'Slab',
          quantities: { netVolume: 20, netArea: 10 },
        },
      ] as any;
      jest.spyOn(service, 'getBIMElements').mockResolvedValue(mockElements);

      const budgetData = [
        {
          ifc_global_id: 'g1',
          quantity: 1,
          quantity_executed: 0.5,
          unit_cost: 100,
          unit_price: 150,
        },
        {
          ifc_global_id: 'g2',
          quantity: 1,
          quantity_executed: 0.1,
          unit_cost: 50,
          unit_price: 80,
        },
      ];
      mockSupabase.from.mockReturnValue(createFluentMock(budgetData));

      const result = await (service as any).generateCostAnalysisLocal('c-1');
      expect(result).toHaveLength(2);
      expect(result[0].totalCost).toBeGreaterThanOrEqual(result[1].totalCost);
    });

    it('should handle zero volume/area during calculation', async () => {
      const mockElements = [
        {
          ifc_guid: 'g1',
          ifc_type: 'Wall',
          quantities: { netVolume: 0, netArea: 0 },
        },
      ] as any;
      jest.spyOn(service, 'getBIMElements').mockResolvedValue(mockElements);
      mockSupabase.from.mockReturnValue(createFluentMock([]));

      const result = await (service as any).generateCostAnalysisLocal('c-1');
      expect(result[0].costPerM3).toBe(0);
      expect(result[0].costPerM2).toBe(0);
    });
  });

  describe('generateClashAnalysis', () => {
    it('should analyze clashes and handle project filtering', async () => {
      const mockClashes = [
        {
          severity: 'critical',
          clash_type: 'hard',
          status: 'pending',
          model_a_id: 'm1',
          model_b_id: 'm2',
          discipline_a: 'Arch',
          detected_at: '2023-01-01',
          resolved_at: '2023-01-05',
        },
        {
          severity: 'low',
          clash_type: 'soft',
          status: 'resolved',
          model_a_id: 'm1',
          model_b_id: 'm3',
          discipline_a: 'Arch',
          detected_at: '2023-01-01',
          resolved_at: '2023-01-05',
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bim_clashes') return createFluentMock(mockClashes);
        if (table === 'bim_models') return createFluentMock([{ id: 'm1' }]);
        return createFluentMock([]);
      });

      const result = await service.generateClashAnalysis('c-1', 'p-1');
      expect(result.totalClashes).toBe(2);
    });

    it('should handle zero clashes', async () => {
      mockSupabase.from.mockReturnValue(createFluentMock([]));
      const result = await service.generateClashAnalysis('c-1');
      expect(result.totalClashes).toBe(0);
    });

    it('should handle errors by returning empty analysis', async () => {
      mockSupabase.from.mockReturnValue(
        createFluentMock(null, { message: 'fail' }),
      );
      const result = await service.generateClashAnalysis('c-1');
      expect(result.totalClashes).toBe(0);
    });
  });

  describe('generateProgressAnalysis', () => {
    it('should identify risks and predict completion', async () => {
      const mockElements = [
        {
          ifc_guid: 'g1',
          ifc_type: 'Structure_Wall',
          storey_name: 'S1',
          quantities: { netVolume: 10 },
        },
      ] as any;
      jest.spyOn(service, 'getBIMElements').mockResolvedValue(mockElements);
      mockSupabase.from.mockReturnValue(
        createFluentMock([
          { ifc_global_id: 'g1', quantity: 1, quantity_executed: 0.1 },
        ]),
      );

      const result = await service.generateProgressAnalysis('c-1');
      expect(result.delayRiskFactors.length).toBeGreaterThan(0);
      // It should have caught the 'Structure_Wall' type risk
      expect(
        result.delayRiskFactors.some((f) => f.includes('Structure_Wall')),
      ).toBe(true);
    });

    it('should predicting completion if progress > 10%', async () => {
      const mockElements = [
        { ifc_guid: 'g', ifc_type: 'W', storey_name: 'S', quantities: {} },
      ] as any;
      jest.spyOn(service, 'getBIMElements').mockResolvedValue(mockElements);
      mockSupabase.from.mockReturnValue(
        createFluentMock([
          { ifc_global_id: 'g', quantity: 1, quantity_executed: 1 },
        ]),
      );
      const result = await service.generateProgressAnalysis('c-1');
      expect(result.progressPercentage).toBe(100);
    });

    it('should handle errors in progress analysis', async () => {
      jest
        .spyOn(service, 'getBIMElements')
        .mockRejectedValue(new Error('fail'));
      const result = await service.generateProgressAnalysis('c-1');
      expect(result.totalElements).toBe(0);
    });
  });

  describe('generateQualityMetrics', () => {
    it('should identify multiple quality issues', async () => {
      const mockElements = [
        {
          name: 'Wall',
          ifc_type: 'Wall',
          storey_name: ' ',
          quantities: {},
          bounding_box: null,
        },
      ] as any;
      jest.spyOn(service, 'getBIMElements').mockResolvedValue(mockElements);
      const result = await service.generateQualityMetrics('c-1');
      expect(result.elementsWithIssues).toBe(1);
    });

    it('should handle errors in quality metrics', async () => {
      jest
        .spyOn(service, 'getBIMElements')
        .mockRejectedValue(new Error('fail'));
      const result = await service.generateQualityMetrics('c-1');
      expect(result.elementsWithIssues).toBe(0);
    });
  });

  describe('generateResourceOptimization', () => {
    it('should generate recommendations based on analysis', async () => {
      jest.spyOn(service, 'generateCostAnalysis').mockResolvedValue([
        {
          ifcType: 'Concrete',
          totalVolume: 100,
          budgetItems: 1,
          totalCost: 1000,
          executionProgress: 160,
        } as any,
      ]);
      jest.spyOn(service, 'generateProgressAnalysis').mockResolvedValue({
        byStorey: { S1: { percentage: 50, total: 10 } },
      } as any);

      const result = await service.generateResourceOptimization('c-1');
      expect(result.materialWaste.length).toBe(1);
      expect(result.optimizationRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle errors in optimization', async () => {
      jest
        .spyOn(service, 'generateCostAnalysis')
        .mockRejectedValue(new Error('fail'));
      const result = await service.generateResourceOptimization('c-1');
      expect(result.optimizationRecommendations[0]).toContain('Unable');
    });
  });

  describe('getBIMSummaryInsights', () => {
    it('should aggregate all analyses and handle critical conditions', async () => {
      const mockElements = [{ id: 'e1', quantities: { netVolume: 10.555 } }];
      const mockCost = [{ totalCost: 500.4 }];
      const mockProgress = {
        progressPercentage: 40,
        delayRiskFactors: ['Risk 1'],
      };
      const mockQuality = { qualityScore: 65, elementsWithIssues: 5 };
      const mockClash = {
        totalClashes: 10,
        criticalUnresolved: 2,
        resolvedPercentage: 50,
      };

      // We need to bypass the method mocks to test the logic inside getBIMSummaryInsights
      // but since they are public methods, it's easier to mock them for this aggregate test
      const getBIMElementsSpy = jest
        .spyOn(service, 'getBIMElements')
        .mockResolvedValue(mockElements as any);
      const generateCostAnalysisSpy = jest
        .spyOn(service, 'generateCostAnalysis')
        .mockResolvedValue(mockCost as any);
      const generateProgressAnalysisSpy = jest
        .spyOn(service, 'generateProgressAnalysis')
        .mockResolvedValue(mockProgress as any);
      const generateQualityMetricsSpy = jest
        .spyOn(service, 'generateQualityMetrics')
        .mockResolvedValue(mockQuality as any);
      const generateClashAnalysisSpy = jest
        .spyOn(service, 'generateClashAnalysis')
        .mockResolvedValue(mockClash as any);

      const result = await service.getBIMSummaryInsights('c-1', 'p-1');

      expect(result.totalElements).toBe(1);
      expect(result.totalVolume).toBe(10.56);
      expect(result.totalCost).toBe(500);
      expect(result.progressPercentage).toBe(40);
      expect(result.qualityScore).toBe(65);
      expect(result.activeClashes).toBe(5);
      expect(result.criticalIssues.length).toBeGreaterThan(2);
      expect(result.criticalIssues).toContain('2 critical clashes unresolved');
      expect(result.criticalIssues).toContain('Risk 1');
      expect(result.keyRecommendations).toContain(
        'Prioritize resolution of critical clashes',
      );
      expect(result.keyRecommendations).toContain(
        'Accelerate construction progress',
      );
      expect(result.keyRecommendations).toContain('Improve model data quality');
    });

    it('should handle errors in aggregation by returning default structure', async () => {
      jest
        .spyOn(service, 'getBIMElements')
        .mockRejectedValue(new Error('fail'));
      const result = await service.getBIMSummaryInsights('c-1');
      expect(result.criticalIssues[0]).toContain('Unable');
    });
  });
});
