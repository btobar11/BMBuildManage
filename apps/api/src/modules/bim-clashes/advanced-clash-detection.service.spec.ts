import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AdvancedClashDetectionService } from './advanced-clash-detection.service';

describe('AdvancedClashDetectionService', () => {
  let service: AdvancedClashDetectionService;

  const mockSupabase = {
    from: jest.fn(),
  };

  const createMockResponse = (data: any, error: any = null) => ({
    data,
    error,
  });

  const createQueryBuilder = (data: any, error: any = null) => {
    const result = createMockResponse(data, error);
    const eqFn = jest.fn();
    const selectFn = jest.fn();
    const inFn = jest.fn();
    const notFn = jest.fn();
    const singleFn = jest.fn().mockReturnValue(result);

    const selectChain = {
      ...result,
      eq: eqFn,
      select: selectFn,
      in: inFn,
      not: notFn,
      single: singleFn,
    };

    selectFn.mockReturnValue(selectChain);

    const eqChain = {
      ...result,
      eq: eqFn,
      select: selectFn,
      in: inFn,
      not: notFn,
      single: singleFn,
    };

    eqFn.mockReturnValue(eqChain);

    return {
      ...result,
      eq: eqFn,
      select: selectFn,
      in: inFn,
      not: notFn,
      single: singleFn,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSupabase.from.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedClashDetectionService,
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

    service = module.get<AdvancedClashDetectionService>(
      AdvancedClashDetectionService,
    );
    (service as any).supabase = mockSupabase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateBoundingBoxIntersection', () => {
    it('should calculate intersection volume when boxes overlap', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 10, maxY: 10, maxZ: 10 };
      const bboxB = { minX: 5, minY: 5, minZ: 5, maxX: 15, maxY: 15, maxZ: 15 };

      const result = (service as any).calculateBoundingBoxIntersection(
        bboxA,
        bboxB,
      );

      expect(result).not.toBeNull();
      expect(result.volume).toBe(125);
      expect(result.center.x).toBe(7.5);
      expect(result.center.y).toBe(7.5);
      expect(result.center.z).toBe(7.5);
    });

    it('should return null when boxes do not intersect', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 5, maxY: 5, maxZ: 5 };
      const bboxB = {
        minX: 10,
        minY: 10,
        minZ: 10,
        maxX: 15,
        maxY: 15,
        maxZ: 15,
      };

      const result = (service as any).calculateBoundingBoxIntersection(
        bboxA,
        bboxB,
      );

      expect(result).toBeNull();
    });

    it('should handle edge-to-edge contact', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 5, maxY: 5, maxZ: 5 };
      const bboxB = { minX: 5, minY: 5, minZ: 5, maxX: 10, maxY: 10, maxZ: 10 };

      const result = (service as any).calculateBoundingBoxIntersection(
        bboxA,
        bboxB,
      );

      expect(result.volume).toBe(0);
    });

    it('should handle partial overlap in one axis', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 10, maxY: 10, maxZ: 10 };
      const bboxB = {
        minX: 5,
        minY: 15,
        minZ: 15,
        maxX: 15,
        maxY: 20,
        maxZ: 20,
      };

      const result = (service as any).calculateBoundingBoxIntersection(
        bboxA,
        bboxB,
      );

      expect(result).toBeNull();
    });
  });

  describe('calculateMinimumDistance', () => {
    it('should return 0 for overlapping boxes', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 10, maxY: 10, maxZ: 10 };
      const bboxB = { minX: 5, minY: 5, minZ: 5, maxX: 15, maxY: 15, maxZ: 15 };

      const result = (service as any).calculateMinimumDistance(bboxA, bboxB);

      expect(result).toBe(0);
    });

    it('should calculate distance for separated boxes', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 10, maxY: 10, maxZ: 10 };
      const bboxB = {
        minX: 20,
        minY: 20,
        minZ: 20,
        maxX: 30,
        maxY: 30,
        maxZ: 30,
      };

      const result = (service as any).calculateMinimumDistance(bboxA, bboxB);

      expect(result).toBe(Math.sqrt(300)); // sqrt(10^2 + 10^2 + 10^2)
    });

    it('should calculate distance in one axis only', () => {
      const bboxA = { minX: 0, minY: 0, minZ: 0, maxX: 10, maxY: 10, maxZ: 10 };
      const bboxB = {
        minX: 20,
        minY: 0,
        minZ: 0,
        maxX: 30,
        maxY: 10,
        maxZ: 10,
      };

      const result = (service as any).calculateMinimumDistance(bboxA, bboxB);

      expect(result).toBe(10);
    });
  });

  describe('getGridCellsForBoundingBox', () => {
    it('should return grid cells for bounding box', () => {
      const bbox = {
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 500,
        maxY: 500,
        maxZ: 500,
      };
      const cellSize = 1000;

      const result = (service as any).getGridCellsForBoundingBox(
        bbox,
        cellSize,
      );

      expect(result).toContain('0,0,0');
      expect(result.length).toBe(1);
    });

    it('should return multiple cells for large bounding box', () => {
      const bbox = {
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 2500,
        maxY: 1500,
        maxZ: 1500,
      };
      const cellSize = 1000;

      const result = (service as any).getGridCellsForBoundingBox(
        bbox,
        cellSize,
      );

      expect(result.length).toBe(12); // 3 * 2 * 2 cells
    });

    it('should handle negative coordinates', () => {
      const bbox = {
        minX: -500,
        minY: -500,
        minZ: -500,
        maxX: 500,
        maxY: 500,
        maxZ: 500,
      };
      const cellSize = 1000;

      const result = (service as any).getGridCellsForBoundingBox(
        bbox,
        cellSize,
      );

      expect(result).toContain('-1,-1,-1');
      expect(result).toContain('0,0,0');
    });
  });

  describe('buildSpatialIndex', () => {
    it('should build spatial index with correct cell size for balanced mode', () => {
      const elements = [
        {
          id: '1',
          ifc_guid: 'g1',
          ifc_type: 'IfcColumn',
          name: 'Column 1',
          model_id: 'model-a',
          discipline: 'structure',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
        },
      ];
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: {},
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'balanced' as const,
      };

      const result = (service as any).buildSpatialIndex(elements, config);

      expect(result.cellSize).toBe(1000);
      expect(result.elements.size).toBe(1);
      expect(result.grid.size).toBe(1);
    });

    it('should use larger cells for fast mode', () => {
      const elements: any[] = [];
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: {},
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'fast' as const,
      };

      const result = (service as any).buildSpatialIndex(elements, config);

      expect(result.cellSize).toBe(2000);
    });

    it('should use smaller cells for accurate mode', () => {
      const elements: any[] = [];
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: {},
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'accurate' as const,
      };

      const result = (service as any).buildSpatialIndex(elements, config);

      expect(result.cellSize).toBe(500);
    });
  });

  describe('shouldCheckDisciplinePair', () => {
    it('should return false for same discipline pairs', () => {
      expect(
        (service as any).shouldCheckDisciplinePair('structure', 'structure'),
      ).toBe(false);
      expect(
        (service as any).shouldCheckDisciplinePair(
          'architecture',
          'architecture',
        ),
      ).toBe(false);
      expect(
        (service as any).shouldCheckDisciplinePair('mep_hvac', 'mep_hvac'),
      ).toBe(false);
    });

    it('should return true for different discipline pairs', () => {
      expect(
        (service as any).shouldCheckDisciplinePair('structure', 'mep_hvac'),
      ).toBe(true);
      expect(
        (service as any).shouldCheckDisciplinePair(
          'mep_electrical',
          'architecture',
        ),
      ).toBe(true);
    });
  });

  describe('isStructuralElement', () => {
    it('should return true for structural elements', () => {
      const column = { ifc_type: 'IfcColumn' } as any;
      const beam = { ifc_type: 'IfcBeam' } as any;
      const slab = { ifc_type: 'IfcSlab' } as any;

      expect((service as any).isStructuralElement(column)).toBe(true);
      expect((service as any).isStructuralElement(beam)).toBe(true);
      expect((service as any).isStructuralElement(slab)).toBe(true);
    });

    it('should return false for non-structural elements', () => {
      const duct = { ifc_type: 'IfcDuctSegment' } as any;
      const door = { ifc_type: 'IfcDoor' } as any;

      expect((service as any).isStructuralElement(duct)).toBe(false);
      expect((service as any).isStructuralElement(door)).toBe(false);
    });
  });

  describe('isMEPElement', () => {
    it('should return true for MEP elements', () => {
      const duct = { ifc_type: 'IfcDuctSegment' } as any;
      const pipe = { ifc_type: 'IfcPipeSegment' } as any;
      const cable = { ifc_type: 'IfcCableSegment' } as any;
      const pump = { ifc_type: 'IfcPump' } as any;

      expect((service as any).isMEPElement(duct)).toBe(true);
      expect((service as any).isMEPElement(pipe)).toBe(true);
      expect((service as any).isMEPElement(cable)).toBe(true);
      expect((service as any).isMEPElement(pump)).toBe(true);
    });

    it('should return false for non-MEP elements', () => {
      const column = { ifc_type: 'IfcColumn' } as any;
      const wall = { ifc_type: 'IfcWall' } as any;

      expect((service as any).isMEPElement(column)).toBe(false);
      expect((service as any).isMEPElement(wall)).toBe(false);
    });
  });

  describe('determineClashType', () => {
    it('should return hard for structural-structural clashes', () => {
      const column = { ifc_type: 'IfcColumn', priority: 1 } as any;
      const beam = { ifc_type: 'IfcBeam', priority: 1 } as any;

      const result = (service as any).determineClashType(column, beam);

      expect(result).toBe('hard');
    });

    it('should return hard for structural-MEP clashes', () => {
      const column = { ifc_type: 'IfcColumn', priority: 1 } as any;
      const duct = { ifc_type: 'IfcDuctSegment', priority: 2 } as any;

      const result = (service as any).determineClashType(column, duct);

      expect(result).toBe('hard');
    });

    it('should return soft for same-type MEP clashes', () => {
      const duct1 = { ifc_type: 'IfcDuctSegment', priority: 2 } as any;
      const duct2 = { ifc_type: 'IfcDuctSegment', priority: 2 } as any;

      const result = (service as any).determineClashType(duct1, duct2);

      expect(result).toBe('soft');
    });

    it('should return hard for different-type MEP clashes', () => {
      const duct = { ifc_type: 'IfcDuctSegment', priority: 2 } as any;
      const pipe = { ifc_type: 'IfcPipeSegment', priority: 2 } as any;

      const result = (service as any).determineClashType(duct, pipe);

      expect(result).toBe('hard');
    });

    it('should return soft as default', () => {
      const door = { ifc_type: 'IfcDoor', priority: 5 } as any;
      const window = { ifc_type: 'IfcWindow', priority: 5 } as any;

      const result = (service as any).determineClashType(door, window);

      expect(result).toBe('soft');
    });
  });

  describe('calculateClashSeverity', () => {
    it('should return critical for hard clashes between critical elements', () => {
      const elemA = { priority: 1 } as any;
      const elemB = { priority: 2 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'hard',
        100,
        0,
        0,
      );

      expect(result).toBe('critical');
    });

    it('should return critical for large intersection volumes (>1m³)', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'hard',
        2000000,
        0,
        0,
      );

      expect(result).toBe('critical');
    });

    it('should return high for significant hard clashes (>0.1m³)', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'hard',
        200000,
        0,
        0,
      );

      expect(result).toBe('high');
    });

    it('should return high for major clearance violations (>100mm)', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'clearance',
        0,
        50,
        200,
      );

      expect(result).toBe('high');
    });

    it('should return medium for moderate intersections', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'soft',
        50000,
        0,
        0,
      );

      expect(result).toBe('medium');
    });

    it('should return low for minor clashes', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateClashSeverity(
        elemA,
        elemB,
        'soft',
        1000,
        0,
        0,
      );

      expect(result).toBe('low');
    });
  });

  describe('calculateClashConfidence', () => {
    it('should return higher confidence for larger intersections', () => {
      const elemA = { ifc_type: 'IfcColumn' } as any;
      const elemB = { ifc_type: 'IfcColumn' } as any;

      const result1 = (service as any).calculateClashConfidence(
        elemA,
        elemB,
        100,
        0,
      );
      const result2 = (service as any).calculateClashConfidence(
        elemA,
        elemB,
        200000,
        0,
      );

      expect(result2).toBeGreaterThan(result1);
    });

    it('should return lower confidence for very small intersections', () => {
      const elemA = { ifc_type: 'IfcColumn' } as any;
      const elemB = { ifc_type: 'IfcColumn' } as any;

      const result = (service as any).calculateClashConfidence(
        elemA,
        elemB,
        5,
        0.5,
      );

      expect(result).toBeLessThan(0.7);
    });

    it('should increase confidence for well-defined types', () => {
      const wellDefinedA = { ifc_type: 'IfcColumn' } as any;
      const wellDefinedB = { ifc_type: 'IfcBeam' } as any;
      const notWellDefined = { ifc_type: 'IfcCovering' } as any;

      const result1 = (service as any).calculateClashConfidence(
        wellDefinedA,
        wellDefinedB,
        1000,
        0,
      );
      const result2 = (service as any).calculateClashConfidence(
        wellDefinedA,
        notWellDefined,
        1000,
        0,
      );

      expect(result1).toBeGreaterThan(result2);
    });

    it('should clamp confidence between 0.1 and 1.0', () => {
      const elemA = { ifc_type: 'IfcColumn' } as any;
      const elemB = { ifc_type: 'IfcColumn' } as any;

      const verySmall = (service as any).calculateClashConfidence(
        elemA,
        elemB,
        1,
        0.1,
      );
      const veryLarge = (service as any).calculateClashConfidence(
        elemA,
        elemB,
        1000000000,
        0,
      );

      expect(verySmall).toBeGreaterThanOrEqual(0.1);
      expect(veryLarge).toBeLessThanOrEqual(1.0);
    });
  });

  describe('calculateResolutionPriority', () => {
    it('should calculate different priorities based on severity', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const critical = (service as any).calculateResolutionPriority(
        elemA,
        elemB,
        'critical',
        'clearance',
      );
      const low = (service as any).calculateResolutionPriority(
        elemA,
        elemB,
        'low',
        'clearance',
      );

      expect(critical).toBeGreaterThan(low);
    });

    it('should prioritize lower-numbered elements', () => {
      const highPriorityA = { priority: 1 } as any;
      const highPriorityB = { priority: 1 } as any;
      const lowPriorityA = { priority: 5 } as any;
      const lowPriorityB = { priority: 5 } as any;

      const highPriority = (service as any).calculateResolutionPriority(
        highPriorityA,
        highPriorityB,
        'low',
        'clearance',
      );
      const lowerPriority = (service as any).calculateResolutionPriority(
        lowPriorityA,
        lowPriorityB,
        'low',
        'clearance',
      );

      expect(highPriority).toBeGreaterThan(lowerPriority);
    });

    it('should clamp priority between 1 and 10', () => {
      const elemA = { priority: 1 } as any;
      const elemB = { priority: 1 } as any;

      const result = (service as any).calculateResolutionPriority(
        elemA,
        elemB,
        'critical',
        'hard',
      );

      expect(result).toBeLessThanOrEqual(10);
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should return valid priority for low severity with high element priorities', () => {
      const elemA = { priority: 5 } as any;
      const elemB = { priority: 5 } as any;

      const result = (service as any).calculateResolutionPriority(
        elemA,
        elemB,
        'low',
        'soft',
      );

      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateElementsCentroid', () => {
    it('should calculate correct centroid between two elements', () => {
      const elemA = {
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 10,
          maxY: 10,
          maxZ: 10,
        },
      } as any;
      const elemB = {
        bounding_box: {
          minX: 20,
          minY: 20,
          minZ: 20,
          maxX: 30,
          maxY: 30,
          maxZ: 30,
        },
      } as any;

      const result = (service as any).calculateElementsCentroid(elemA, elemB);

      expect(result.x).toBe(15);
      expect(result.y).toBe(15);
      expect(result.z).toBe(15);
    });
  });

  describe('getRequiredClearance', () => {
    it('should return discipline-specific clearance from config', () => {
      const elemA = { discipline: 'structure' } as any;
      const elemB = { discipline: 'mep_hvac' } as any;
      const config = {
        clearance_requirements: {
          structure: { mep_hvac: 200 },
        },
      } as any;

      const result = (service as any).getRequiredClearance(
        elemA,
        elemB,
        config,
      );

      expect(result).toBe(200);
    });

    it('should return reverse lookup clearance', () => {
      const elemA = { discipline: 'mep_hvac' } as any;
      const elemB = { discipline: 'structure' } as any;
      const config = {
        clearance_requirements: {
          structure: { mep_hvac: 150 },
        },
      } as any;

      const result = (service as any).getRequiredClearance(
        elemA,
        elemB,
        config,
      );

      expect(result).toBe(150);
    });

    it('should return 50mm for structural elements with no specific clearance', () => {
      const elemA = { discipline: 'other', ifc_type: 'IfcColumn' } as any;
      const elemB = { discipline: 'other', ifc_type: 'IfcDoor' } as any;
      const config = { clearance_requirements: {} } as any;

      const result = (service as any).getRequiredClearance(
        elemA,
        elemB,
        config,
      );

      expect(result).toBe(50);
    });

    it('should return 100mm for MEP-MEP elements', () => {
      const elemA = { discipline: 'other', ifc_type: 'IfcDuctSegment' } as any;
      const elemB = { discipline: 'other', ifc_type: 'IfcPipeSegment' } as any;
      const config = { clearance_requirements: {} } as any;

      const result = (service as any).getRequiredClearance(
        elemA,
        elemB,
        config,
      );

      expect(result).toBe(100);
    });

    it('should return tolerance as default', () => {
      const elemA = { discipline: 'other', ifc_type: 'IfcCovering' } as any;
      const elemB = { discipline: 'other', ifc_type: 'IfcCovering' } as any;
      const config = {
        clearance_requirements: {},
        tolerance_mm: 25,
      } as any;

      const result = (service as any).getRequiredClearance(
        elemA,
        elemB,
        config,
      );

      expect(result).toBe(25);
    });
  });

  describe('postProcessClashes', () => {
    it('should remove low-confidence clashes', () => {
      const clashes = [
        {
          confidence: 0.2,
          element_a_guid: 'a',
          element_b_guid: 'b',
          resolution_priority: 1,
        },
        {
          confidence: 0.8,
          element_a_guid: 'c',
          element_b_guid: 'd',
          resolution_priority: 2,
        },
      ];
      const config = { performance_mode: 'balanced' } as any;

      const result = (service as any).postProcessClashes(clashes, config);

      expect(result.length).toBe(1);
      expect(result[0].confidence).toBe(0.8);
    });

    it('should remove low severity clashes in fast mode', () => {
      const clashes = [
        {
          confidence: 0.8,
          severity: 'low',
          element_a_guid: 'a',
          element_b_guid: 'b',
          resolution_priority: 1,
        },
        {
          confidence: 0.8,
          severity: 'high',
          element_a_guid: 'c',
          element_b_guid: 'd',
          resolution_priority: 2,
        },
      ];
      const config = { performance_mode: 'fast' } as any;

      const result = (service as any).postProcessClashes(clashes, config);

      expect(result.length).toBe(1);
      expect(result[0].severity).toBe('high');
    });
  });

  describe('removeDuplicateClashes', () => {
    it('should keep clash with higher confidence when duplicates found', () => {
      const clashes = [
        {
          confidence: 0.5,
          resolution_priority: 1,
          element_a_guid: 'a',
          element_b_guid: 'b',
        },
        {
          confidence: 0.8,
          resolution_priority: 1,
          element_a_guid: 'a',
          element_b_guid: 'b',
        },
      ];

      const result = (service as any).removeDuplicateClashes(clashes);

      expect(result.length).toBe(1);
      expect(result[0].confidence).toBe(0.8);
    });

    it('should keep clash with higher priority when same confidence', () => {
      const clashes = [
        {
          confidence: 0.8,
          resolution_priority: 2,
          element_a_guid: 'a',
          element_b_guid: 'b',
        },
        {
          confidence: 0.8,
          resolution_priority: 5,
          element_a_guid: 'a',
          element_b_guid: 'b',
        },
      ];

      const result = (service as any).removeDuplicateClashes(clashes);

      expect(result.length).toBe(1);
      expect(result[0].resolution_priority).toBe(5);
    });

    it('should handle reverse-order duplicates', () => {
      const clashes = [
        {
          confidence: 0.8,
          resolution_priority: 3,
          element_a_guid: 'b',
          element_b_guid: 'a',
        },
        {
          confidence: 0.5,
          resolution_priority: 1,
          element_a_guid: 'a',
          element_b_guid: 'b',
        },
      ];

      const result = (service as any).removeDuplicateClashes(clashes);

      expect(result.length).toBe(1);
      expect(result[0].confidence).toBe(0.8);
    });
  });

  describe('performAdvancedClashDetection', () => {
    it('should perform advanced clash detection with full flow', async () => {
      const mockJob = {
        enabled_disciplines: ['structure', 'mep_hvac'],
        federation_id: 'fed-1',
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          ifc_type: 'IfcColumn',
          name: 'Column 1',
          model_id: 'model-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'structure' },
        },
        {
          id: 'elem-2',
          ifc_guid: 'guid-2',
          ifc_type: 'IfcDuctSegment',
          name: 'Duct 1',
          model_id: 'model-2',
          bounding_box: {
            minX: 50,
            minY: 50,
            minZ: 50,
            maxX: 150,
            maxY: 150,
            maxZ: 150,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'mep_hvac' },
        },
      ];

      // Mock the supabase calls
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest
                  .fn()
                  .mockReturnValue({ data: mockElements, error: null }),
              }),
            }),
          }),
        });

      const result = await service.performAdvancedClashDetection(
        'company-1',
        'job-1',
        {
          performance_mode: 'balanced',
          tolerance_mm: 10,
        },
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for less than 2 elements', async () => {
      const mockJob = {
        enabled_disciplines: ['structure'],
        federation_id: 'fed-1',
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          ifc_type: 'IfcColumn',
          name: 'Column 1',
          model_id: 'model-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'structure' },
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest
                  .fn()
                  .mockReturnValue({ data: mockElements, error: null }),
              }),
            }),
          }),
        });

      const result = await service.performAdvancedClashDetection(
        'company-1',
        'job-1',
      );

      expect(result).toEqual([]);
    });

    it('should throw error when job not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      await expect(
        service.performAdvancedClashDetection('company-1', 'non-existent'),
      ).rejects.toThrow('Clash detection job not found');
    });

    it('should throw error when fetching elements fails', async () => {
      const mockJob = {
        enabled_disciplines: ['structure'],
        federation_id: 'fed-1',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  data: null,
                  error: { message: 'DB Error' },
                }),
              }),
            }),
          }),
        });

      await expect(
        service.performAdvancedClashDetection('company-1', 'job-1'),
      ).rejects.toThrow('Error fetching BIM elements: DB Error');
    });
  });

  describe('getBIMElementsForClashDetection (private method)', () => {
    it('should map elements correctly', async () => {
      const mockJob = {
        enabled_disciplines: ['structure'],
        federation_id: 'fed-1',
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          ifc_type: 'IfcColumn',
          name: 'Column 1',
          model_id: 'model-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'structure' },
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest
                  .fn()
                  .mockReturnValue({ data: mockElements, error: null }),
              }),
            }),
          }),
        });

      const result = await (service as any).getBIMElementsForClashDetection(
        'company-1',
        'job-1',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'elem-1',
        ifc_guid: 'guid-1',
        ifc_type: 'IfcColumn',
        name: 'Column 1',
        model_id: 'model-1',
        discipline: 'structure',
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 100,
          maxY: 100,
          maxZ: 100,
        },
        storey_name: 'Level 1',
        priority: 1, // From ELEMENT_TYPE_PRIORITIES
      });
    });

    it('should handle unknown element types with default priority', async () => {
      const mockJob = {
        enabled_disciplines: ['structure'],
        federation_id: 'fed-1',
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          ifc_type: 'IfcUnknownType',
          name: 'Unknown Element',
          model_id: 'model-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'structure' },
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest
                  .fn()
                  .mockReturnValue({ data: mockElements, error: null }),
              }),
            }),
          }),
        });

      const result = await (service as any).getBIMElementsForClashDetection(
        'company-1',
        'job-1',
      );

      expect(result[0].priority).toBe(5); // Default priority
    });
  });

  describe('detectClashesWithSpatialIndex (private method)', () => {
    it('should handle same model skip', async () => {
      const spatialIndex = {
        elements: new Map([
          [
            'elem-1',
            {
              id: 'elem-1',
              model_id: 'model-1',
              discipline: 'structure',
              bounding_box: {
                minX: 0,
                minY: 0,
                minZ: 0,
                maxX: 100,
                maxY: 100,
                maxZ: 100,
              },
            },
          ],
          [
            'elem-2',
            {
              id: 'elem-2',
              model_id: 'model-1',
              discipline: 'structure',
              bounding_box: {
                minX: 50,
                minY: 50,
                minZ: 50,
                maxX: 150,
                maxY: 150,
                maxZ: 150,
              },
            },
          ],
        ]),
        grid: new Map([['0,0,0', new Set(['elem-1', 'elem-2'])]]),
        cellSize: 1000,
      };

      const config = { performance_mode: 'balanced' } as any;

      const result = await (service as any).detectClashesWithSpatialIndex(
        spatialIndex,
        config,
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle discipline filtering', async () => {
      const spatialIndex = {
        elements: new Map([
          [
            'elem-1',
            {
              id: 'elem-1',
              model_id: 'model-1',
              discipline: 'structure',
              bounding_box: {
                minX: 0,
                minY: 0,
                minZ: 0,
                maxX: 100,
                maxY: 100,
                maxZ: 100,
              },
            },
          ],
          [
            'elem-2',
            {
              id: 'elem-2',
              model_id: 'model-2',
              discipline: 'structure', // Same discipline - should be skipped
              bounding_box: {
                minX: 50,
                minY: 50,
                minZ: 50,
                maxX: 150,
                maxY: 150,
                maxZ: 150,
              },
            },
          ],
        ]),
        grid: new Map([['0,0,0', new Set(['elem-1', 'elem-2'])]]),
        cellSize: 1000,
      };

      const config = { performance_mode: 'balanced' } as any;

      // Mock shouldCheckDisciplinePair to return false
      jest
        .spyOn(service as any, 'shouldCheckDisciplinePair')
        .mockReturnValue(false);

      const result = await (service as any).detectClashesWithSpatialIndex(
        spatialIndex,
        config,
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle progress updates', async () => {
      const spatialIndex = {
        elements: new Map(),
        grid: new Map(),
        cellSize: 1000,
      };

      // Create 1001 elements to trigger progress update
      for (let i = 0; i < 1001; i++) {
        spatialIndex.elements.set(`elem-${i}`, {
          id: `elem-${i}`,
          model_id: i % 2 === 0 ? 'model-1' : 'model-2',
          discipline: i % 2 === 0 ? 'structure' : 'mep_hvac',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
        });
      }

      spatialIndex.grid.set(
        '0,0,0',
        new Set(Array.from({ length: 1001 }, (_, i) => `elem-${i}`)),
      );

      const config = { performance_mode: 'balanced' } as any;

      // Mock shouldCheckDisciplinePair to return true
      jest
        .spyOn(service as any, 'shouldCheckDisciplinePair')
        .mockReturnValue(true);

      // Mock updateJobProgress
      jest
        .spyOn(service as any, 'updateJobProgress')
        .mockResolvedValue(undefined);

      const result = await (service as any).detectClashesWithSpatialIndex(
        spatialIndex,
        config,
      );

      expect(Array.isArray(result)).toBe(true);
      expect((service as any).updateJobProgress).toHaveBeenCalled();
    });

    it('should handle processed pairs deduplication', async () => {
      const spatialIndex = {
        elements: new Map([
          [
            'elem-1',
            {
              id: 'elem-1',
              model_id: 'model-1',
              discipline: 'structure',
              bounding_box: {
                minX: 0,
                minY: 0,
                minZ: 0,
                maxX: 100,
                maxY: 100,
                maxZ: 100,
              },
            },
          ],
          [
            'elem-2',
            {
              id: 'elem-2',
              model_id: 'model-2',
              discipline: 'mep_hvac',
              bounding_box: {
                minX: 50,
                minY: 50,
                minZ: 50,
                maxX: 150,
                maxY: 150,
                maxZ: 150,
              },
            },
          ],
        ]),
        grid: new Map([['0,0,0', new Set(['elem-1', 'elem-2'])]]),
        cellSize: 1000,
      };

      const config = { performance_mode: 'balanced' } as any;

      // Mock shouldCheckDisciplinePair to return true
      jest
        .spyOn(service as any, 'shouldCheckDisciplinePair')
        .mockReturnValue(true);

      // Mock detectClashBetweenElements to return a clash
      jest.spyOn(service as any, 'detectClashBetweenElements').mockReturnValue({
        clash_type: 'hard',
        severity: 'high',
        resolution_priority: 10,
      });

      const result = await (service as any).detectClashesWithSpatialIndex(
        spatialIndex,
        config,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('performAdvancedClashDetection - sorting', () => {
    it('should sort clashes by resolution priority', async () => {
      const mockJob = {
        enabled_disciplines: ['structure', 'mep_hvac'],
        federation_id: 'fed-1',
      };

      const mockElements = [
        {
          id: 'elem-1',
          ifc_guid: 'guid-1',
          ifc_type: 'IfcColumn',
          name: 'Column 1',
          model_id: 'model-1',
          bounding_box: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 100,
            maxY: 100,
            maxZ: 100,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'structure' },
        },
        {
          id: 'elem-2',
          ifc_guid: 'guid-2',
          ifc_type: 'IfcDuctSegment',
          name: 'Duct 1',
          model_id: 'model-2',
          bounding_box: {
            minX: 50,
            minY: 50,
            minZ: 50,
            maxX: 150,
            maxY: 150,
            maxZ: 150,
          },
          storey_name: 'Level 1',
          bim_models: { discipline: 'mep_hvac' },
        },
      ];

      // Mock supabase calls
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockReturnValue({ data: mockJob, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                not: jest
                  .fn()
                  .mockReturnValue({ data: mockElements, error: null }),
              }),
            }),
          }),
        });

      // Mock postProcessClashes to return clashes with different priorities
      jest
        .spyOn(service as any, 'postProcessClashes')
        .mockReturnValue([
          { resolution_priority: 5 },
          { resolution_priority: 10 },
          { resolution_priority: 1 },
        ]);

      const result = await service.performAdvancedClashDetection(
        'company-1',
        'job-1',
      );

      expect(result[0].resolution_priority).toBe(10);
      expect(result[1].resolution_priority).toBe(5);
      expect(result[2].resolution_priority).toBe(1);
    });
  });

  describe('updateJobProgress (private method)', () => {
    it('should log progress correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (service as any).updateJobProgress(100, 50, 200);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Progress: 50/200 checks completed (100 elements)',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getClashDetectionStats', () => {
    it('should return null when no clashes found', async () => {
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({ data: null, error: null }),
        }),
      });

      const result = await service.getClashDetectionStats('company-1');

      expect(result).toBeNull();
    });

    it('should calculate stats correctly', async () => {
      const mockClashes = [
        { severity: 'critical', clash_type: 'hard', status: 'pending' },
        { severity: 'high', clash_type: 'hard', status: 'pending' },
        { severity: 'high', clash_type: 'soft', status: 'resolved' },
        { severity: 'medium', clash_type: 'clearance', status: 'accepted' },
        { severity: 'low', clash_type: 'soft', status: 'ignored' },
      ];

      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({ data: mockClashes, error: null }),
        }),
      });

      const result = await service.getClashDetectionStats('company-1');

      expect(result.totalClashes).toBe(5);
      expect(result.bySeverity.critical).toBe(1);
      expect(result.bySeverity.high).toBe(2);
      expect(result.byType.hard).toBe(2);
      expect(result.byType.soft).toBe(2);
      expect(result.byType.clearance).toBe(1);
      expect(result.byStatus.pending).toBe(2);
      expect(result.byStatus.resolved).toBe(1);
    });

    it('should filter by project when projectId provided', async () => {
      const mockClashes = [
        { severity: 'high', clash_type: 'hard', status: 'pending' },
      ];

      const mockModels = [
        { id: 'model-1' },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bim_models') {
          return {
            select: () => ({
              eq: () => ({ data: mockModels, error: null }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              in: () => ({ data: mockClashes, error: null }),
            }),
          }),
        };
      });

      const result = await service.getClashDetectionStats(
        'company-1',
        'project-1',
      );

      expect(result.totalClashes).toBe(1);
    });
  });

  describe('detectClashBetweenElements', () => {
    it('should detect clash when bounding boxes intersect', () => {
      const elemA = {
        id: '1',
        ifc_guid: 'g1',
        ifc_type: 'IfcColumn',
        discipline: 'structure',
        priority: 1,
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 100,
          maxY: 100,
          maxZ: 100,
        },
      };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        ifc_type: 'IfcDuctSegment',
        discipline: 'mep_hvac',
        priority: 2,
        bounding_box: {
          minX: 50,
          minY: 50,
          minZ: 50,
          maxX: 150,
          maxY: 150,
          maxZ: 150,
        },
      };
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: {},
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'balanced' as const,
      };

      const result = (service as any).detectClashBetweenElements(
        elemA,
        elemB,
        config,
      );

      expect(result).not.toBeNull();
      expect(result.clash_type).toBe('hard');
      expect(result.element_a_id).toBe('1');
      expect(result.element_b_id).toBe('2');
    });

    it('should detect clearance violation when boxes are close', () => {
      const elemA = {
        id: '1',
        ifc_guid: 'g1',
        ifc_type: 'IfcColumn',
        discipline: 'structure',
        priority: 1,
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 100,
          maxY: 100,
          maxZ: 100,
        },
      };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        ifc_type: 'IfcDuctSegment',
        discipline: 'mep_hvac',
        priority: 2,
        bounding_box: {
          minX: 150,
          minY: 150,
          minZ: 150,
          maxX: 200,
          maxY: 200,
          maxZ: 200,
        },
      };
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: { structure: { mep_hvac: 100 } },
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'balanced' as const,
      };

      const result = (service as any).detectClashBetweenElements(
        elemA,
        elemB,
        config,
      );

      expect(result).not.toBeNull();
      expect(result.clash_type).toBe('clearance');
      expect(result.clearance_distance).toBeGreaterThan(0);
    });

    it('should return null when no clash or clearance violation', () => {
      const elemA = {
        id: '1',
        ifc_guid: 'g1',
        ifc_type: 'IfcColumn',
        discipline: 'structure',
        priority: 1,
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 100,
          maxY: 100,
          maxZ: 100,
        },
      };
      const elemB = {
        id: '2',
        ifc_guid: 'g2',
        ifc_type: 'IfcDuctSegment',
        discipline: 'mep_hvac',
        priority: 2,
        bounding_box: {
          minX: 500,
          minY: 500,
          minZ: 500,
          maxX: 600,
          maxY: 600,
          maxZ: 600,
        },
      };
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: { structure: { mep_hvac: 50 } },
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'balanced' as const,
      };

      const result = (service as any).detectClashBetweenElements(
        elemA,
        elemB,
        config,
      );

      expect(result).toBeNull();
    });
  });

  describe('detectClashesWithSpatialIndex', () => {
    it('should process elements in spatial grid', () => {
      const elem1 = {
        id: '1',
        ifc_guid: 'g1',
        ifc_type: 'IfcColumn',
        discipline: 'structure',
        priority: 1,
        model_id: 'model-a',
        bounding_box: {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: 100,
          maxY: 100,
          maxZ: 100,
        },
      };

      const spatialIndex = {
        elements: new Map([['1', elem1]]),
        grid: new Map([['0,0,0', new Set(['1'])]]),
        cellSize: 1000,
      };
      const config = {
        tolerance_mm: 10,
        hard_clash_threshold: 0.1,
        soft_clash_buffer: 50,
        clearance_requirements: {},
        discipline_priorities: {},
        element_type_priorities: {},
        performance_mode: 'balanced' as const,
      };

      const result = (service as any).detectClashesWithSpatialIndex(
        spatialIndex,
        config,
      );

      expect(result).toBeDefined();
    });
  });
});
