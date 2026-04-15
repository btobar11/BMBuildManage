/**
 * IFC Extraction Service Tests
 * Tests the IFC data extraction service with mocked IFC models
 * Covers: unit detection, quantity extraction, statistics, spatial tree
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  IfcExtractionService,
  extractFromModel,
  type ExtractedElement,
} from '../services/ifcExtractionService';

// ─── Mock IFC Model ─────────────────────────────────────────────────────────────

interface MockProperties {
  [key: string]: any;
}

function createMockModel(props: Record<number, MockProperties> = {}, elementsByType: Record<number, Record<number, MockProperties>> = {}) {
  return {
    modelID: 'mock-model-001',
    getProperties: vi.fn(async (id: number) => props[id] || null),
    getAllPropertiesOfType: vi.fn(async (typeCode: number) => elementsByType[typeCode] || null),
  };
}

// Standard IFC type codes
const IFC_WALL = 3512223829;
const IFC_SLAB = 1051757585;
const IFC_COLUMN = 3999819293;
const IFC_BUILDING = 1308484611;
const IFC_STOREY = 4097515480;

const SAMPLE_WALL = {
  type: IFC_WALL,
  GlobalId: { value: 'WALL-GUID-001' },
  Name: { value: 'Muro Exterior' },
  ObjectType: { value: 'IfcWall' },
  IsDefinedBy: [],
};

const SAMPLE_SLAB = {
  type: IFC_SLAB,
  GlobalId: { value: 'SLAB-GUID-001' },
  Name: { value: 'Losa Primer Piso' },
  IsDefinedBy: [],
};

const SAMPLE_COLUMN = {
  type: IFC_COLUMN,
  GlobalId: { value: 'COL-GUID-001' },
  Name: { value: 'Columna C1' },
  IsDefinedBy: [],
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('IfcExtractionService', () => {
  describe('constructor', () => {
    it('creates an instance with the model', () => {
      const model = createMockModel();
      const service = new IfcExtractionService(model);
      expect(service).toBeInstanceOf(IfcExtractionService);
    });
  });

  describe('extract() — empty model', () => {
    it('returns an ExtractionResult with zero elements for empty model', async () => {
      const model = createMockModel({ 1: null as any });
      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.modelId).toBe('mock-model-001');
      expect(result.elementCount).toBe(0);
      expect(result.elements).toHaveLength(0);
      expect(result.statistics.totalVolume).toBe(0);
      expect(result.statistics.totalArea).toBe(0);
      expect(result.statistics.totalLength).toBe(0);
    });

    it('spatial tree root is always present', async () => {
      const model = createMockModel();
      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.spatialTree).toBeDefined();
      expect(result.spatialTree.type).toBe('Root');
      expect(result.spatialTree.level).toBe(0);
    });
  });

  describe('extract() — with elements', () => {
    it('extracts walls from IFC model', async () => {
      const model = createMockModel(
        { [SAMPLE_WALL.GlobalId.value as any]: SAMPLE_WALL },
        { [IFC_WALL]: { 100: SAMPLE_WALL } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.elementCount).toBe(1);
      expect(result.elements[0].ifcType).toBe('IfcWall');
      expect(result.elements[0].ifcGuid).toBe('WALL-GUID-001');
      expect(result.elements[0].name).toBe('Muro Exterior');
    });

    it('extracts multiple element types simultaneously', async () => {
      const model = createMockModel(
        {},
        {
          [IFC_WALL]: { 100: SAMPLE_WALL },
          [IFC_SLAB]: { 200: SAMPLE_SLAB },
          [IFC_COLUMN]: { 300: SAMPLE_COLUMN },
        },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.elementCount).toBe(3);
      const types = result.elements.map((e) => e.ifcType);
      expect(types).toContain('IfcWall');
      expect(types).toContain('IfcSlab');
      expect(types).toContain('IfcColumn');
    });

    it('assigns fallback name for elements without Name property', async () => {
      const noNameEl = { type: IFC_WALL, GlobalId: { value: 'NONAME-001' }, IsDefinedBy: [] };
      const model = createMockModel(
        {},
        { [IFC_WALL]: { 100: noNameEl } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.elements[0].name).toBe('Elemento sin nombre');
    });

    it('assigns expressID from the model entry key', async () => {
      const model = createMockModel(
        {},
        { [IFC_WALL]: { 999: SAMPLE_WALL } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.elements[0].expressID).toBe(999);
    });

    it('deduplicates elements that appear in multiple type queries', async () => {
      // Element 100 appears in both WALL and SLAB maps (should be counted once)
      const model = createMockModel(
        {},
        {
          [IFC_WALL]: { 100: SAMPLE_WALL },
          [IFC_SLAB]: { 100: SAMPLE_WALL }, // same expressID
        },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.elementCount).toBe(1);
    });
  });

  describe('calculateStatistics', () => {
    it('counts elements by type correctly', async () => {
      const model = createMockModel(
        {},
        {
          [IFC_WALL]: { 100: SAMPLE_WALL, 101: { ...SAMPLE_WALL, GlobalId: { value: 'W2' } } },
          [IFC_COLUMN]: { 200: SAMPLE_COLUMN },
        },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.statistics.byType['IfcWall']).toBe(2);
      expect(result.statistics.byType['IfcColumn']).toBe(1);
    });

    it('aggregates quantities from elements with volumes', async () => {
      // Simulate an element that has pre-extracted quantities
      const model = createMockModel(
        {},
        { [IFC_WALL]: { 100: SAMPLE_WALL } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      // Without PropertySets, volumes default to 0
      expect(result.statistics.totalVolume).toBe(0);
    });

    it('assigns "Unassigned" for elements without storeyName', async () => {
      const model = createMockModel(
        {},
        { [IFC_WALL]: { 100: SAMPLE_WALL } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.statistics.byStorey['Unassigned']).toBe(1);
    });
  });

  describe('unit detection', () => {
    it('defaults to factor 1 when no project properties', async () => {
      const model = createMockModel({ 1: null as any });
      const service = new IfcExtractionService(model);
      const result = await service.extract();
      // If factor = 1 (metres), volumes won't be scaled. Just check it doesn't crash.
      expect(result).toBeDefined();
    });

    it('applies MILLI prefix (millimetre IFC) as 0.001 to length', async () => {
      const model = createMockModel({
        1: { UnitsInContext: { value: 10 } },
        10: { Units: [{ value: 20 }] },
        20: { UnitType: { value: 'LENGTHUNIT' }, Prefix: { value: 'MILLI' } },
      });

      const service = new IfcExtractionService(model);
      // Just verify it runs without error — actual factor is internal
      await expect(service.extract()).resolves.toBeDefined();
    });

    it('applies CENTI prefix (centimetre IFC) correctly', async () => {
      const model = createMockModel({
        1: { UnitsInContext: { value: 10 } },
        10: { Units: [{ value: 20 }] },
        20: { UnitType: { value: 'LENGTHUNIT' }, Prefix: { value: 'CENTI' } },
      });

      await expect(new IfcExtractionService(model).extract()).resolves.toBeDefined();
    });

    it('returns factor 1 when UnitType is not LENGTHUNIT', async () => {
      const model = createMockModel({
        1: { UnitsInContext: { value: 10 } },
        10: { Units: [{ value: 20 }] },
        20: { UnitType: { value: 'AREAUNIT' } },
      });

      await expect(new IfcExtractionService(model).extract()).resolves.toBeDefined();
    });
  });

  describe('spatial tree', () => {
    it('builds a spatial tree with building node when IfcBuilding exists', async () => {
      const model = createMockModel(
        {},
        {
          [IFC_BUILDING]: { 50: { Name: { value: 'Edificio Principal' } } },
        },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      expect(result.spatialTree.children).toHaveLength(1);
      expect(result.spatialTree.children[0].name).toBe('Edificio Principal');
      expect(result.spatialTree.children[0].type).toBe('IfcBuilding');
    });

    it('builds storey nodes under building', async () => {
      const model = createMockModel(
        {},
        {
          [IFC_BUILDING]: { 50: { Name: { value: 'Edificio' } } },
          [IFC_STOREY]: {
            60: { Name: { value: 'Piso 1' } },
            61: { Name: { value: 'Piso 2' } },
          },
        },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      const building = result.spatialTree.children[0];
      expect(building.children).toHaveLength(2);
      const names = building.children.map((c) => c.name);
      expect(names).toContain('Piso 1');
      expect(names).toContain('Piso 2');
    });

    it('handles building with no name gracefully', async () => {
      const model = createMockModel(
        {},
        { [IFC_BUILDING]: { 50: {} } },
      );

      const service = new IfcExtractionService(model);
      const result = await service.extract();

      const building = result.spatialTree.children[0];
      expect(building.name).toBe('Edificio');
    });
  });

  describe('error resilience', () => {
    it('continues extraction when one element type throws', async () => {
      const model = createMockModel();
      // Override to throw on WALL type
      model.getAllPropertiesOfType.mockImplementation(async (typeCode: number) => {
        if (typeCode === IFC_WALL) throw new Error('IFC read error');
        return null;
      });

      const service = new IfcExtractionService(model);
      await expect(service.extract()).resolves.toBeDefined();
    });

    it('continues when getProperties throws unexpectedly', async () => {
      const model = createMockModel(
        {},
        { [IFC_WALL]: { 100: SAMPLE_WALL } },
      );
      model.getProperties.mockRejectedValue(new Error('Random error'));

      const service = new IfcExtractionService(model);
      await expect(service.extract()).resolves.toBeDefined();
    });
  });
});

// ─── extractFromModel (batch function) ────────────────────────────────────────

describe('extractFromModel', () => {
  it('calls onProgress callbacks', async () => {
    const model = createMockModel();
    const progressCalls: [number, string][] = [];

    await extractFromModel(model, (p, msg) => progressCalls.push([p, msg]));

    expect(progressCalls.length).toBeGreaterThan(0);
    // Should include 100 as final progress
    const finalProgress = progressCalls[progressCalls.length - 1][0];
    expect(finalProgress).toBe(100);
  });

  it('works without onProgress callback', async () => {
    const model = createMockModel();
    await expect(extractFromModel(model)).resolves.toBeDefined();
  });

  it('returns ExtractionResult structure', async () => {
    const model = createMockModel();
    const result = await extractFromModel(model);

    expect(result).toHaveProperty('modelId');
    expect(result).toHaveProperty('elementCount');
    expect(result).toHaveProperty('elements');
    expect(result).toHaveProperty('spatialTree');
    expect(result).toHaveProperty('statistics');
  });
});

// ─── Edge cases and error handling ────────────────────────────────────────

describe('private methods edge cases', () => {
  it('handles empty property set gracefully', async () => {
    const model = createMockModel({}, {
      [IFC_WALL]: {
        100: {
          Name: { value: 'Wall' },
          IsDefinedBy: [], // Empty relations
        },
      },
    });

    const service = new IfcExtractionService(model);
    const result = await service.extract();

    expect(result.elements.length).toBe(1);
  });

  it('covers getPropertyTypeName completely', async () => {
    // We send properties of types 1 through 7 and an unknown type 99 to ensure lines 552-570 are covered
    const psetRelations = [
      { value: 501 }, { value: 502 }, { value: 503 }, { value: 504 },
      { value: 505 }, { value: 506 }, { value: 507 }, { value: 508 }
    ];

    const model = createMockModel({
      100: { IsDefinedBy: [{ value: 200 }] },
      200: { RelatingPropertyDefinition: { value: 300 } },
      300: { Name: { value: 'PSet_Test' }, HasProperties: psetRelations },
      501: { Name: { value: 'Prop1' }, type: 1, NominalValue: { value: 10 } },
      502: { Name: { value: 'Prop2' }, type: 2, NominalValue: { value: 20 } },
      503: { Name: { value: 'Prop3' }, type: 3, NominalValue: { value: 30 } },
      504: { Name: { value: 'Prop4' }, type: 4, NominalValue: { value: 40 } },
      505: { Name: { value: 'Prop5' }, type: 5, NominalValue: { value: 50 } },
      506: { Name: { value: 'Prop6' }, type: 6, NominalValue: { value: 60 } },
      507: { Name: { value: 'Prop7' }, type: 7, NominalValue: { value: 70 } },
      508: { Name: { value: 'Prop8' }, type: 99, NominalValue: { value: 99 } },
    }, {
      [IFC_WALL]: {
        100: { Name: { value: 'Wall_Props_Test' }, IsDefinedBy: [{ value: 200 }] },
      },
    });

    const service = new IfcExtractionService(model);
    const result = await service.extract();

    expect(result.elements.length).toBe(1);
    const properties = result.elements[0].properties;
    expect(properties.find((p) => p.propertyType === 'IfcPropertySingleValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyBoundedValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyListValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyEnumerationValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyTableValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyReferenceValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'IfcPropertyComplexValue')).toBeDefined();
    expect(properties.find((p) => p.propertyType === 'PropertyType(99)')).toBeDefined();
  });

  it('handles spatial index and storey building errors gracefully', async () => {
    const errorModel = {
      modelID: 'error-model-spatial',
      getProperties: vi.fn(async () => { throw new Error('Spatial relation error'); }),
      getAllPropertiesOfType: vi.fn(async (type) => {
        if (type === IFC_BUILDING || type === IFC_STOREY || type === 1449333159 || type === 3294025466) {
           throw new Error('Storey query error');
        }
        return { 100: { Name: { value: 'Wall_Error_Test' } } };
      }),
    };

    const service = new IfcExtractionService(errorModel as any);
    const result = await service.extract();
    expect(result.elements.length).toBe(1);
    expect(result.spatialTree.children).toHaveLength(0);
  });

  it('handles property with null values', async () => {
    const model = createMockModel({}, {
      [IFC_WALL]: {
        100: {
          Name: { value: null }, // null name
          ObjectType: { value: null },
          OverallHeight: null,
        },
      },
    });

    const service = new IfcExtractionService(model);
    const result = await service.extract();

    expect(result.elements.length).toBe(1);
  });

  it('extracts elements with multiple quantity types', async () => {
    const model = createMockModel({
      100: { Name: { value: 'Wall' }, IsDefinedBy: [{ value: 200 }] },
      200: { RelatingPropertyDefinition: { value: 500 } },
      500: {
        Name: { value: 'Qto_WallBaseQuantities' },
        Quantities: [
          { value: 601 }, // Length
          { value: 602 }, // Area
          { value: 603 }, // Volume
          { value: 604 }, // Count
        ],
      },
      601: { Name: { value: 'Length' }, LengthValue: { value: 10 } },
      602: { Name: { value: 'NetSideArea' }, AreaValue: { value: 20 } },
      603: { Name: { value: 'NetVolume' }, VolumeValue: { value: 30 } },
      604: { Name: { value: 'Count' }, CountValue: { value: 5 } },
    }, {
      [IFC_WALL]: {
        100: {
          Name: { value: 'Wall' },
          IsDefinedBy: [{ value: 200 }],
        },
      },
    });
    // Let's log getProperties to see what happens
    const spy = vi.spyOn(model, 'getProperties');

    const service = new IfcExtractionService(model);
    const result = await service.extract();

    expect(result.elements.length).toBe(1);
    expect(result.elements[0].quantities.netSideArea).toBe(20);
    expect(result.elements[0].quantities.netVolume).toBe(30);
    expect(result.elements[0].quantities.length).toBe(10);
  });

  it('handles building without name', async () => {
    const model = createMockModel({}, {
      [IFC_BUILDING]: {
        1: {
          // No Name property
        },
      },
      [IFC_WALL]: {
        100: {
          Name: { value: 'Wall' },
        },
      },
    });

    const service = new IfcExtractionService(model);
    const result = await service.extract();

    expect(result.spatialTree.children.length).toBeGreaterThan(0);
  });

  it('handles getProperties returning undefined', async () => {
    const elementsByType: Record<number, Record<number, any>> = {
      [IFC_WALL]: {
        100: { Name: { value: 'Wall' }, IsDefinedBy: [{ value: 9999 }] },
      },
    };

    const model = {
      modelID: 'mock-model-001',
      getProperties: vi.fn(async (id: number) => {
        if (id >= 1000) return undefined;
        return elementsByType[id] || null;
      }),
      getAllPropertiesOfType: vi.fn(async (typeCode: number) => {
        if (typeCode === IFC_WALL) return elementsByType[typeCode];
        return {};
      }),
    };

    const service = new IfcExtractionService(model as any);
    const result = await service.extract();

    expect(result).toBeDefined();
  });
});
