import { Test, TestingModule } from '@nestjs/testing';
import { BIMReportsService } from './bim-reports.service';
import { BIMAnalyticsService } from './bim-analytics.service';

describe('BIMReportsService', () => {
  let service: BIMReportsService;
  let mockBIMAnalyticsService: jest.Mocked<BIMAnalyticsService>;

  beforeEach(async () => {
    const mockAnalyticsService = {
      generateCostAnalysis: jest.fn(),
      generateProgressAnalysis: jest.fn(),
      generateClashAnalysis: jest.fn(),
      generateQualityMetrics: jest.fn(),
      generateResourceOptimization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BIMReportsService,
        {
          provide: BIMAnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    service = module.get<BIMReportsService>(BIMReportsService);
    mockBIMAnalyticsService = module.get(BIMAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBIMVsRealityReport', () => {
    it('should generate accurate BIM vs Reality comparison', async () => {
      const mockCostAnalysis = [
        {
          ifcType: 'IfcWall',
          totalVolume: 100.0,
          totalCost: 50000,
          executionProgress: 110, // 10% over execution (variance = 10)
        },
        {
          ifcType: 'IfcSlab',
          totalVolume: 50.0,
          totalCost: 30000,
          executionProgress: 80, // 20% under execution
        },
      ];

      const mockProgressAnalysis = {
        progressPercentage: 85,
        totalElements: 150,
        completedElements: 128,
      };

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );

      const result = await service.generateBIMVsRealityReport(
        'company-1',
        'project-1',
        'Test Project',
      );

      expect(result.projectName).toBe('Test Project');
      expect(result.summary.totalElements).toBe(2);
      expect(result.summary.plannedVolume).toBe(150.0); // 100 + 50
      expect(result.summary.variance).toBeCloseTo(-15); // (127.5 - 150) / 150 * 100

      // Check element analysis (sorted by variance magnitude desc)
      expect(result.byElement).toHaveLength(2);
      expect(result.byElement[0].status).toBe('under'); // 20% under (highest variance)
      expect(result.byElement[1].status).toBe('over'); // 10% over (lower variance)

      // Check recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Check risk factors
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should classify element status correctly', async () => {
      const mockCostAnalysis = [
        {
          ifcType: 'IfcWall',
          totalVolume: 100.0,
          totalCost: 1000,
          executionProgress: 103,
        }, // on_track (within 5%)
        {
          ifcType: 'IfcSlab',
          totalVolume: 50.0,
          totalCost: 500,
          executionProgress: 85,
        }, // under
        {
          ifcType: 'IfcColumn',
          totalVolume: 25.0,
          totalCost: 250,
          executionProgress: 110,
        }, // over
        {
          ifcType: 'IfcBeam',
          totalVolume: 10.0,
          totalCost: 100,
          executionProgress: 130,
        }, // critical (>15% over)
      ];

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue({
        progressPercentage: 100,
      } as any);

      const result = await service.generateBIMVsRealityReport(
        'company-1',
        'project-1',
        'Test',
      );

      // Results are sorted by absolute variance descending, so critical first
      const statuses = result.byElement.map((e) => e.status);
      expect(statuses).toContain('critical');
      expect(statuses).toContain('over');
      expect(statuses).toContain('under');
      expect(statuses).toContain('on_track');
    });

    it('should generate appropriate recommendations based on variances', async () => {
      const mockCostAnalysis = [
        {
          ifcType: 'IfcWall',
          totalVolume: 100,
          totalCost: 10000,
          executionProgress: 130,
        }, // critical
      ];

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue({
        progressPercentage: 100,
      } as any);

      const result = await service.generateBIMVsRealityReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.recommendations).toContain(
        'Atención inmediata requerida en 1 tipos de elementos',
      );
      expect(result.riskFactors.some((rf) => rf.impact === 'critical')).toBe(
        true,
      );
    });
  });

  describe('generateCostPerCubicMeterReport', () => {
    it('should analyze cost efficiency by category', async () => {
      const mockCostAnalysis = [
        { ifcType: 'IfcWall', totalVolume: 100, totalCost: 45000000 }, // 450,000 CLP/m³
        { ifcType: 'IfcSlab', totalVolume: 50, totalCost: 32500000 }, // 650,000 CLP/m³
        { ifcType: 'IfcColumn', totalVolume: 10, totalCost: 12000000 }, // 1,200,000 CLP/m³ (high)
      ];

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );

      const result = await service.generateCostPerCubicMeterReport(
        'company-1',
        'project-1',
        'Test Project',
      );

      expect(result.summary.totalVolume).toBe(160);
      expect(result.summary.totalCost).toBe(89500000);
      expect(result.summary.avgCostPerM3).toBeCloseTo(559375);

      // Check benchmark comparison
      expect(result.summary.benchmarkComparison.status).toBeDefined();
      expect(['below', 'within', 'above', 'critical']).toContain(
        result.summary.benchmarkComparison.status,
      );

      // Check categorization
      expect(result.byCategory.length).toBeGreaterThan(0);
      expect(result.byCategory.some((c) => c.category === 'Mampostería')).toBe(
        true,
      ); // IfcWall
      expect(result.byCategory.some((c) => c.category === 'Losas')).toBe(true); // IfcSlab

      // Check optimization opportunities (high-cost items)
      expect(result.optimizationOpportunities.length).toBeGreaterThan(0);
    });

    it('should identify optimization opportunities correctly', async () => {
      const mockCostAnalysis = [
        { ifcType: 'IfcColumn', totalVolume: 10, totalCost: 15000000 }, // 1,500,000 CLP/m³ (very high)
      ];

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );

      const result = await service.generateCostPerCubicMeterReport(
        'company-1',
        'project-1',
        'Test',
      );

      const structureOpportunity = result.optimizationOpportunities.find(
        (o) => o.category === 'Estructura',
      );

      expect(structureOpportunity).toBeDefined();
      expect(structureOpportunity.potentialSavings).toBeGreaterThan(0);
      expect(structureOpportunity.actions).toContain(
        'Revisar especificaciones técnicas',
      );
    });

    it('should calculate efficiency ratings correctly', async () => {
      const mockCostAnalysis = [
        { ifcType: 'IfcWall', totalVolume: 100, totalCost: 35000000 }, // Below benchmark (excellent)
        { ifcType: 'IfcSlab', totalVolume: 50, totalCost: 50000000 }, // Above benchmark (poor)
      ];

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        mockCostAnalysis as any,
      );

      const result = await service.generateCostPerCubicMeterReport(
        'company-1',
        'project-1',
        'Test',
      );

      const wallCategory = result.byCategory.find(
        (c) => c.category === 'Mampostería',
      );
      const slabCategory = result.byCategory.find(
        (c) => c.category === 'Losas',
      );

      expect(wallCategory?.efficiency).toBe('excellent');
      expect(slabCategory?.efficiency).toBe('poor');
    });
  });

  describe('generateConstructionSequenceReport', () => {
    it('should analyze construction phases and dependencies', async () => {
      const mockProgressAnalysis = {
        byType: {
          IfcFooting: { total: 10, completed: 10, percentage: 100 },
          IfcColumn: { total: 20, completed: 15, percentage: 75 },
          IfcSlab: { total: 5, completed: 2, percentage: 40 },
          IfcWall: { total: 30, completed: 10, percentage: 33 },
        },
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );

      const result = await service.generateConstructionSequenceReport(
        'company-1',
        'project-1',
        'Test Project',
      );

      expect(result.summary.totalPhases).toBeGreaterThan(0);
      expect(result.phaseAnalysis.length).toBeGreaterThan(0);

      // Check phase sequencing
      const foundationsPhase = result.phaseAnalysis.find(
        (p) => p.phase === 'Fundaciones',
      );
      const structurePhase = result.phaseAnalysis.find((p) =>
        p.phase.includes('Estructura'),
      );

      expect(foundationsPhase).toBeDefined();
      expect(structurePhase).toBeDefined();
      expect(foundationsPhase?.status).toBe('completed');
      expect(structurePhase?.status).toBeDefined();

      // Check dependencies
      expect(foundationsPhase?.dependencies).toContain('Movimiento de Tierras');
      expect(structurePhase?.dependencies).toContain('Fundaciones');
    });

    it('should identify bottlenecks and delays', async () => {
      const mockProgressAnalysis = {
        byType: {
          IfcColumn: { total: 20, completed: 5, percentage: 25 }, // Very behind
          IfcSlab: { total: 10, completed: 1, percentage: 10 }, // Very behind
        },
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );

      const result = await service.generateConstructionSequenceReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some(
          (r) => r.includes('fases con retraso') || r.includes('fases activas'),
        ),
      ).toBe(true);

      // Check delay calculation
      const delayedPhases = result.phaseAnalysis.filter(
        (p) => p.status === 'delayed',
      );
      expect(delayedPhases.length).toBeGreaterThan(0);
    });

    it('should predict completion dates based on current progress', async () => {
      const mockProgressAnalysis = {
        byType: {
          IfcColumn: { total: 10, completed: 5, percentage: 50 },
        },
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );

      const result = await service.generateConstructionSequenceReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.summary.predictedCompletion).toBeInstanceOf(Date);
      expect(
        result.phaseAnalysis.every((p) => p.predictedEnd instanceof Date),
      ).toBe(true);
    });
  });

  describe('generateQualityControlReport', () => {
    it('should analyze quality metrics and generate recommendations', async () => {
      const mockQualityMetrics = {
        qualityScore: 65, // Below 70 to ensure recommendations are generated
        elementsWithIssues: 25,
        commonIssues: [
          { issue: 'Missing quantity data', count: 15, impact: 'major' },
          { issue: 'Generic names', count: 10, impact: 'minor' },
        ],
      };

      const mockProgressAnalysis = {
        totalElements: 100,
        byType: {
          IfcWall: { total: 50, completed: 40, percentage: 80 },
          IfcSlab: { total: 30, completed: 25, percentage: 83 },
        },
        byStorey: {
          'Level 1': { total: 40, completed: 35, percentage: 87.5 },
          'Level 2': { total: 30, completed: 20, percentage: 66.7 },
        },
      };

      mockBIMAnalyticsService.generateQualityMetrics.mockResolvedValue(
        mockQualityMetrics as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );

      const result = await service.generateQualityControlReport(
        'company-1',
        'project-1',
        'Test Project',
      );

      expect(result.overallScore).toBe(65);
      expect(result.summary.totalElements).toBe(100);
      expect(result.byElement.length).toBeGreaterThan(0);
      expect(result.bySpatialZone.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Check that critical recommendation was generated due to qualityScore < 70
      const criticalRec = result.recommendations.find(
        (r) => r.priority === 'critical',
      );
      expect(criticalRec).toBeDefined();
    });

    it('should generate critical recommendations for low quality', async () => {
      const mockQualityMetrics = {
        qualityScore: 60, // Below 70
        elementsWithIssues: 50,
        commonIssues: [
          { issue: 'Critical data missing', count: 30, impact: 'critical' },
        ],
      };

      mockBIMAnalyticsService.generateQualityMetrics.mockResolvedValue(
        mockQualityMetrics as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue({
        totalElements: 100,
        byType: {},
        byStorey: {},
      } as any);

      const result = await service.generateQualityControlReport(
        'company-1',
        'project-1',
        'Test',
      );

      const criticalRec = result.recommendations.find(
        (r) => r.priority === 'critical',
      );
      expect(criticalRec).toBeDefined();
      expect(criticalRec?.recommendation).toContain(
        'programa intensivo de mejora',
      );
    });

    it('should calculate quality trends over time', async () => {
      mockBIMAnalyticsService.generateQualityMetrics.mockResolvedValue({
        qualityScore: 80,
        elementsWithIssues: 10,
        commonIssues: [],
      } as any);

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue({
        totalElements: 100,
        byType: {},
        byStorey: {},
      } as any);

      const result = await service.generateQualityControlReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.qualityTrends).toHaveLength(6); // Last 6 months
      expect(
        result.qualityTrends.every(
          (t) =>
            typeof t.approvalRate === 'number' &&
            typeof t.reworkCost === 'number',
        ),
      ).toBe(true);
    });
  });

  describe('generateResourceAllocationReport', () => {
    it('should analyze resource allocation across zones', async () => {
      const mockProgressAnalysis = {
        byStorey: {
          'Level 1': { total: 50, completed: 40, percentage: 80, volume: 100 },
          'Level 2': { total: 30, completed: 15, percentage: 50, volume: 60 },
        },
      };

      const mockOptimization = {
        laborEfficiency: [
          { zone: 'Level 1', efficiency: 85 },
          { zone: 'Level 2', efficiency: 65 },
        ],
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );
      mockBIMAnalyticsService.generateResourceOptimization.mockResolvedValue(
        mockOptimization as any,
      );

      const result = await service.generateResourceAllocationReport(
        'company-1',
        'project-1',
        'Test Project',
      );

      expect(result.summary.totalZones).toBe(2);
      expect(result.byZone.length).toBeGreaterThan(0);

      // Check that optimization exists
      expect(result.optimization).toBeDefined();
    });

    it('should predict next week resource needs', async () => {
      const mockProgressAnalysis = {
        byStorey: {
          'Level 1': { total: 50, percentage: 85, volume: 100 }, // High activity
        },
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );
      mockBIMAnalyticsService.generateResourceOptimization.mockResolvedValue({
        laborEfficiency: [{ zone: 'Level 1', efficiency: 90 }],
      } as any);

      const result = await service.generateResourceAllocationReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.predictiveAnalysis).toBeDefined();
      expect(result.predictiveAnalysis.bottleneckRisk).toBeDefined();
      expect(Array.isArray(result.predictiveAnalysis.nextWeekNeeds)).toBe(true);
    });

    it('should identify bottleneck risks', async () => {
      const mockProgressAnalysis = {
        byStorey: {
          'Level 1': { total: 50, percentage: 30, volume: 100 }, // Behind schedule
        },
      };

      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        mockProgressAnalysis as any,
      );
      mockBIMAnalyticsService.generateResourceOptimization.mockResolvedValue({
        laborEfficiency: [{ zone: 'Level 1', efficiency: 60 }], // Low efficiency
      } as any);

      const result = await service.generateResourceAllocationReport(
        'company-1',
        'project-1',
        'Test',
      );

      expect(result.predictiveAnalysis).toBeDefined();
      expect(result.predictiveAnalysis.bottleneckRisk).toBeDefined();
      expect(Array.isArray(result.predictiveAnalysis.bottleneckRisk)).toBe(
        true,
      );
    });
  });

  describe('error handling', () => {
    it('should handle BIMAnalyticsService errors gracefully', async () => {
      mockBIMAnalyticsService.generateCostAnalysis.mockRejectedValue(
        new Error('Analytics service error'),
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockRejectedValue(
        new Error('Analytics service error'),
      );

      // Service propagates errors from analytics service
      await expect(
        service.generateBIMVsRealityReport('company-1', 'project-1', 'Test'),
      ).rejects.toThrow('Analytics service error');
    });

    it('should propagate errors from analytics service', async () => {
      mockBIMAnalyticsService.generateCostAnalysis.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.generateBIMVsRealityReport('company-1', 'project-1', 'Test'),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle large-scale projects efficiently', async () => {
      const largeCostAnalysis = Array.from({ length: 100 }, (_, i) => ({
        ifcType: `IfcType${i}`,
        totalVolume: 100 + i,
        totalCost: (100 + i) * 1000,
        executionProgress: 50 + Math.random() * 50,
      }));

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        largeCostAnalysis as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue({
        progressPercentage: 75,
      } as any);

      const result = await service.generateBIMVsRealityReport(
        'company-1',
        'project-1',
        'Large Project',
      );

      expect(result.byElement).toHaveLength(100);
      expect(result.summary.totalElements).toBe(100);
      // Should complete within reasonable time (test performance)
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should maintain data consistency across reports', async () => {
      const consistentData = {
        costAnalysis: [
          { ifcType: 'IfcWall', totalVolume: 100, totalCost: 50000 },
        ],
        progressAnalysis: {
          progressPercentage: 80,
          totalElements: 100,
          byType: {
            IfcWall: { total: 50, completed: 40, percentage: 80 },
          },
          byStorey: {
            'Level 1': { total: 50, completed: 40, percentage: 80 },
          },
        },
        qualityMetrics: { qualityScore: 85 },
      };

      mockBIMAnalyticsService.generateCostAnalysis.mockResolvedValue(
        consistentData.costAnalysis as any,
      );
      mockBIMAnalyticsService.generateProgressAnalysis.mockResolvedValue(
        consistentData.progressAnalysis as any,
      );
      mockBIMAnalyticsService.generateQualityMetrics.mockResolvedValue(
        consistentData.qualityMetrics as any,
      );

      const [realityReport, costReport, qualityReport] = await Promise.all([
        service.generateBIMVsRealityReport('company-1', 'project-1', 'Test'),
        service.generateCostPerCubicMeterReport(
          'company-1',
          'project-1',
          'Test',
        ),
        service.generateQualityControlReport('company-1', 'project-1', 'Test'),
      ]);

      // Data should be consistent across reports
      expect(realityReport.byElement[0].ifcType).toBe('IfcWall');
      expect(
        costReport.byCategory.some((c) => c.category === 'Mampostería'),
      ).toBe(true); // IfcWall maps to Mampostería
      expect(qualityReport.overallScore).toBe(85);
    });
  });
});
