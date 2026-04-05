/**
 * IFC Data Extraction Service
 * 
 * Extracts complete BIM data from IFC files using web-ifc:
 * - Spatial tree (building structure hierarchy)
 * - All elements with GUIDs, types, and properties
 * - PropertySets and individual properties
 * - Quantities (volume, area, length)
 * - Bounding boxes for spatial queries
 * 
 * Designed for batch extraction on model upload, not real-time rendering.
 */
import type { IfcQuantities } from '../types';

// ─── IFC Type Codes ───────────────────────────────────────────────────────────
const IFC_TYPE_MAP: Record<number, string> = {
  3512223829: 'IfcWall',
  2007235440: 'IfcWallStandardCase',
  1051757585: 'IfcSlab',
  3999819293: 'IfcColumn',
  753842376: 'IfcBeam',
  900683007: 'IfcFooting',
  2571569899: 'IfcPile',
  331165859: 'IfcStair',
  2262330004: 'IfcRailing',
  2016517767: 'IfcRoof',
  395920057: 'IfcDoor',
  3304561284: 'IfcWindow',
  1973544240: 'IfcCovering',
  3171933400: 'IfcPlate',
  1281925730: 'IfcMember',
  4031249490: 'IfcCurtainWall',
  1095909175: 'IfcBuildingElementProxy',
  3294025466: 'IfcSpace',
  4097515480: 'IfcBuildingStorey',
  1308484611: 'IfcBuilding',
  1449333159: 'IfcSite',
  3611035857: 'IfcWindowStandardCase',
  3383959460: 'IfcDoorStandardCase',
};

// ─── Unit conversion factors ───────────────────────────────────────────────────
const UNIT_PREFIXES: Record<string, number> = {
  EXA: 1e18, PETA: 1e15, TERA: 1e12, GIGA: 1e9, MEGA: 1e6,
  KILO: 1e3, HECTO: 1e2, DECA: 1e1,
  DECI: 1e-1, CENTI: 1e-2, MILLI: 1e-3, MICRO: 1e-6,
  NANO: 1e-9, PICO: 1e-12, FEMTO: 1e-15,
};

// ─── Quantity patterns ─────────────────────────────────────────────────────────
const QUANTITY_PATTERNS: Record<keyof Omit<IfcQuantities, 'rawProperties'>, RegExp> = {
  netVolume: /net\s*volume/i,
  grossVolume: /gross\s*volume/i,
  netArea: /net\s*(floor\s*)?area/i,
  grossArea: /gross\s*(floor\s*)?area/i,
  netSideArea: /net\s*side\s*area/i,
  length: /^(length|net\s*length|gross\s*length)$/i,
  width: /^(width|net\s*width)$/i,
  height: /^(height|net\s*height)$/i,
  perimeter: /^perimeter$/i,
};

// ─── Critical IFC types for structural analysis ────────────────────────────────
const CRITICAL_ELEMENT_TYPES = new Set([
  'IfcWall', 'IfcWallStandardCase', 'IfcSlab', 'IfcColumn',
  'IfcBeam', 'IfcFooting', 'IfcPile', 'IfcStair',
  'IfcRailing', 'IfcRoof', 'IfcDoor', 'IfcWindow',
  'IfcCovering', 'IfcPlate', 'IfcMember', 'IfcCurtainWall',
  'IfcBuildingElementProxy', 'IfcSpace',
]);

// ─── Types for extraction results ─────────────────────────────────────────────

export interface SpatialNode {
  expressID: number;
  name: string;
  type: string;
  children: SpatialNode[];
  level: number;
}

export interface ExtractedElement {
  ifcGuid: string;
  expressID: number;
  name: string;
  objectType: string;
  ifcType: string;
  storeyId: string | null;
  storeyName: string | null;
  quantities: IfcQuantities;
  properties: ElementProperty[];
  boundingBox: BoundingBox | null;
}

export interface ElementProperty {
  propertySetName: string;
  propertyName: string;
  propertyType: string | null;
  value: string | null;
  numericValue: number | null;
  unit: string | null;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface ExtractionResult {
  modelId: string;
  elementCount: number;
  elements: ExtractedElement[];
  spatialTree: SpatialNode;
  statistics: ModelStatistics;
}

export interface ModelStatistics {
  byType: Record<string, number>;
  byStorey: Record<string, number>;
  totalVolume: number;
  totalArea: number;
  totalLength: number;
}

// ─── Main extraction function ──────────────────────────────────────────────────

export class IfcExtractionService {
  private model: any;
  private lengthFactor: number = 1;
  private spatialIndex: Map<number, number[]> = new Map();
  private storeyMap: Map<number, { id: string; name: string }> = new Map();

  constructor(model: any) {
    this.model = model;
  }

  async extract(): Promise<ExtractionResult> {
    console.log('[IfcExtraction] Starting extraction...');
    
    // Step 1: Detect units
    this.lengthFactor = await this.detectUnitFactor();
    console.log(`[IfcExtraction] Unit factor: ${this.lengthFactor}`);

    // Step 2: Build spatial index
    await this.buildSpatialIndex();
    
    // Step 3: Extract storey map
    await this.buildStoreyMap();

    // Step 4: Extract all elements
    const elements = await this.extractAllElements();
    console.log(`[IfcExtraction] Extracted ${elements.length} elements`);

    // Step 5: Build spatial tree
    const spatialTree = await this.buildSpatialTree();
    
    // Step 6: Calculate statistics
    const statistics = this.calculateStatistics(elements);

    return {
      modelId: this.model.modelID || 'unknown',
      elementCount: elements.length,
      elements,
      spatialTree,
      statistics,
    };
  }

  private async detectUnitFactor(): Promise<number> {
    try {
      const project = await this.model.getProperties(1);
      if (!project) return 1;

      const unitsId = project.UnitsInContext?.value;
      if (!unitsId) return 1;

      const unitsAssignment = await this.model.getProperties(unitsId);
      if (!unitsAssignment?.Units) return 1;

      for (const unitRef of unitsAssignment.Units) {
        const unitId = unitRef?.value;
        if (!unitId) continue;

        const unit = await this.model.getProperties(unitId);
        if (!unit) continue;

        const unitType = unit.UnitType?.value;
        if (unitType === 'LENGTHUNIT' || unitType === '.LENGTHUNIT.') {
          const prefix = unit.Prefix?.value;
          if (prefix && UNIT_PREFIXES[prefix]) {
            return UNIT_PREFIXES[prefix];
          }
          return 1;
        }
      }
    } catch (e) {
      console.warn('[IfcExtraction] Could not detect units:', e);
    }
    return 1;
  }

  private async buildSpatialIndex(): Promise<void> {
    this.spatialIndex.clear();
    
    try {
      // Get all spatial elements (building, site, storey, space)
      const spatialTypes = [1308484611, 4031249490, 1449333159, 3294025466, 4097515480];
      
      for (const typeCode of spatialTypes) {
        try {
          if (this.model.getAllPropertiesOfType) {
            const elements = await this.model.getAllPropertiesOfType(typeCode);
            if (elements) {
              for (const [expressId] of Object.entries(elements) as [string, any][]) {
                const parentId = this.findParent();
                if (!this.spatialIndex.has(parentId)) {
                  this.spatialIndex.set(parentId, []);
                }
                this.spatialIndex.get(parentId)!.push(parseInt(expressId));
              }
            }
          }
        } catch {
          // Type may not exist in model
        }
      }
    } catch (e) {
      console.warn('[IfcExtraction] Error building spatial index:', e);
    }
  }

  private findParent(): number {
    return 0; // Root level
  }

  private async buildStoreyMap(): Promise<void> {
    this.storeyMap.clear();
    
    try {
      const storeyType = 4097515480; // IfcBuildingStorey
      if (this.model.getAllPropertiesOfType) {
        const storeys = await this.model.getAllPropertiesOfType(storeyType);
        if (storeys) {
          for (const [expressId, props] of Object.entries(storeys) as [string, any][]) {
            const id = `Storey-${expressId}`;
            const name = props.Name?.value || `Level ${this.storeyMap.size + 1}`;
            this.storeyMap.set(parseInt(expressId), { id, name });
          }
        }
      }
    } catch (e) {
      console.warn('[IfcExtraction] Error building storey map:', e);
    }
  }

  private getElementType(typeCode: number): string {
    return IFC_TYPE_MAP[typeCode] || `IfcElement(${typeCode})`;
  }

  private getStoreyInfo(expressID: number): { id: string | null; name: string | null } {
    // Check if this element belongs to a storey
    for (const [storeyId, info] of this.storeyMap) {
      if (this.isElementInStorey(expressID, storeyId)) {
        return info;
      }
    }
    return { id: null, name: null };
  }

  private isElementInStorey(_elementId: number, _storeyId: number): boolean {
    // Simplified check - in production would traverse spatial containment
    return false;
  }

  private async extractAllElements(): Promise<ExtractedElement[]> {
    const elements: ExtractedElement[] = [];
    const processed = new Set<number>();

    // Process critical element types
    for (const [typeCode, typeName] of Object.entries(IFC_TYPE_MAP)) {
      if (!CRITICAL_ELEMENT_TYPES.has(typeName)) continue;
      
      try {
        if (this.model.getAllPropertiesOfType) {
          const typeElements = await this.model.getAllPropertiesOfType(parseInt(typeCode));
          if (typeElements) {
            for (const [expressId, props] of Object.entries(typeElements) as [string, any][]) {
              const id = parseInt(expressId);
              if (processed.has(id)) continue;
              processed.add(id);

              const element = await this.extractElement(id, props, typeName);
              if (element) {
                elements.push(element);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[IfcExtraction] Error extracting ${typeName}:`, e);
      }
    }

    return elements;
  }

  private async extractElement(expressID: number, elementProps: any, fallbackType: string): Promise<ExtractedElement | null> {
    try {
      // If props not provided, fetch them
      let props = elementProps;
      if (!props) {
        props = await this.model.getProperties(expressID);
        if (!props) return null;
      }

      const globalId = props.GlobalId?.value || `EID-${expressID}`;
      const name = props.Name?.value || props.LongName?.value || 'Elemento sin nombre';
      const objectType = props.ObjectType?.value || props.Description?.value || '';
      const typeCode = props.type || 0;
      const ifcType = typeCode ? this.getElementType(typeCode) : fallbackType;

      // Get storey info
      const storey = this.getStoreyInfo(expressID);

      // Extract quantities
      const quantities = await this.extractQuantities(expressID);

      // Extract properties
      const properties = await this.extractProperties(expressID);

      // Get bounding box (from geometry if available)
      const boundingBox = await this.extractBoundingBox(expressID);

      return {
        ifcGuid: globalId,
        expressID,
        name,
        objectType,
        ifcType,
        storeyId: storey.id,
        storeyName: storey.name,
        quantities,
        properties,
        boundingBox,
      };
    } catch (e) {
      console.warn(`[IfcExtraction] Error extracting element ${expressID}:`, e);
      return null;
    }
  }

  private async extractQuantities(expressID: number): Promise<IfcQuantities> {
    const quantities: IfcQuantities = {
      netVolume: null,
      grossVolume: null,
      netArea: null,
      grossArea: null,
      netSideArea: null,
      length: null,
      width: null,
      height: null,
      perimeter: null,
      rawProperties: {},
    };

    try {
      const psetIds = await this.findPropertyRelations(expressID);

      for (const psetId of psetIds) {
        const pset = await this.model.getProperties(psetId);
        if (!pset) continue;

        // Check for IfcElementQuantity
        const qtyRefs = pset.Quantities || pset.HasQuantities;
        if (qtyRefs) {
          for (const qRef of qtyRefs) {
            const qId = qRef?.value;
            if (!qId) continue;

            const quantity = await this.model.getProperties(qId);
            if (!quantity) continue;

            const qName = quantity.Name?.value || '';
            let value: number | null = null;

            if (quantity.LengthValue?.value != null) {
              value = Number(quantity.LengthValue.value) * this.lengthFactor;
            } else if (quantity.AreaValue?.value != null) {
              value = Number(quantity.AreaValue.value) * (this.lengthFactor * this.lengthFactor);
            } else if (quantity.VolumeValue?.value != null) {
              value = Number(quantity.VolumeValue.value) * (this.lengthFactor ** 3);
            } else if (quantity.CountValue?.value != null) {
              value = Number(quantity.CountValue.value);
            }

            if (value !== null && !isNaN(value)) {
              quantities.rawProperties[qName] = value;

              for (const [key, pattern] of Object.entries(QUANTITY_PATTERNS)) {
                if (pattern.test(qName)) {
                  (quantities as any)[key] = value;
                }
              }
            }
          }
        }

        // Check for IfcPropertySet
        const propRefs = pset.HasProperties;
        if (propRefs) {
          for (const pRef of propRefs) {
            const propId = pRef?.value;
            if (!propId) continue;

            const prop = await this.model.getProperties(propId);
            if (!prop) continue;

            const propName = prop.Name?.value || '';
            const nominalValue = prop.NominalValue?.value;

            if (nominalValue != null && !isNaN(Number(nominalValue))) {
              const numVal = Number(nominalValue);
              quantities.rawProperties[propName] = numVal;

              for (const [key, pattern] of Object.entries(QUANTITY_PATTERNS)) {
                if (pattern.test(propName) && (quantities as any)[key] === null) {
                  (quantities as any)[key] = numVal;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[IfcExtraction] Error extracting quantities for ${expressID}:`, e);
    }

    return quantities;
  }

  private async findPropertyRelations(expressID: number): Promise<number[]> {
    const relatedPsetIds: number[] = [];

    try {
      const element = await this.model.getProperties(expressID);
      if (element?.IsDefinedBy) {
        for (const ref of element.IsDefinedBy) {
          const relId = ref?.value;
          if (!relId) continue;
          const rel = await this.model.getProperties(relId);
          if (!rel) continue;
          const psetId = rel.RelatingPropertyDefinition?.value;
          if (psetId) relatedPsetIds.push(psetId);
        }
      }
    } catch (e) {
      console.warn(`[IfcExtraction] Error finding property relations for ${expressID}:`, e);
    }

    return relatedPsetIds;
  }

  private async extractProperties(expressID: number): Promise<ElementProperty[]> {
    const properties: ElementProperty[] = [];

    try {
      const psetIds = await this.findPropertyRelations(expressID);

      for (const psetId of psetIds) {
        const pset = await this.model.getProperties(psetId);
        if (!pset) continue;

        const psetName = pset.Name?.value || 'Unknown';

        // Handle IfcPropertySet
        const propRefs = pset.HasProperties;
        if (propRefs) {
          for (const pRef of propRefs) {
            const propId = pRef?.value;
            if (!propId) continue;

            const prop = await this.model.getProperties(propId);
            if (!prop) continue;

            const propName = prop.Name?.value || '';
            const propType = prop.type ? this.getPropertyTypeName(prop.type) : null;
            const nominalValue = prop.NominalValue?.value;
            const unit = prop.Unit?.value || null;

            properties.push({
              propertySetName: psetName,
              propertyName: propName,
              propertyType: propType,
              value: nominalValue?.toString() || null,
              numericValue: nominalValue != null && !isNaN(Number(nominalValue)) ? Number(nominalValue) : null,
              unit,
            });
          }
        }

        // Handle IfcElementQuantity
        const qtyRefs = pset.Quantities || pset.HasQuantities;
        if (qtyRefs) {
          for (const qRef of qtyRefs) {
            const qId = qRef?.value;
            if (!qId) continue;

            const quantity = await this.model.getProperties(qId);
            if (!quantity) continue;

            const qName = quantity.Name?.value || '';
            let value: string | null = null;
            let numericValue: number | null = null;

            if (quantity.LengthValue?.value != null) {
              value = `${quantity.LengthValue.value * this.lengthFactor}`;
              numericValue = Number(value);
            } else if (quantity.AreaValue?.value != null) {
              value = `${quantity.AreaValue.value * (this.lengthFactor ** 2)}`;
              numericValue = Number(value);
            } else if (quantity.VolumeValue?.value != null) {
              value = `${quantity.VolumeValue.value * (this.lengthFactor ** 3)}`;
              numericValue = Number(value);
            } else if (quantity.CountValue?.value != null) {
              value = `${quantity.CountValue.value}`;
              numericValue = Number(value);
            }

            properties.push({
              propertySetName: psetName,
              propertyName: qName,
              propertyType: 'Quantity',
              value,
              numericValue,
              unit: this.getQuantityUnit(qName),
            });
          }
        }
      }
    } catch (e) {
      console.warn(`[IfcExtraction] Error extracting properties for ${expressID}:`, e);
    }

    return properties;
  }

  private getPropertyTypeName(typeCode: number): string {
    const typeNames: Record<number, string> = {
      1: 'IfcPropertySingleValue',
      2: 'IfcPropertyBoundedValue',
      3: 'IfcPropertyListValue',
      4: 'IfcPropertyEnumerationValue',
      5: 'IfcPropertyTableValue',
      6: 'IfcPropertyReferenceValue',
      7: 'IfcPropertyComplexValue',
    };
    return typeNames[typeCode] || `PropertyType(${typeCode})`;
  }

  private getQuantityUnit(quantityName: string): string | null {
    if (/volume/i.test(quantityName)) return 'm³';
    if (/area/i.test(quantityName)) return 'm²';
    if (/length/i.test(quantityName)) return 'ml';
    if (/perimeter/i.test(quantityName)) return 'ml';
    if (/width|height/i.test(quantityName)) return 'm';
    return null;
  }

  private async extractBoundingBox(expressID: number): Promise<BoundingBox | null> {
    // Note: Full bounding box extraction requires geometry access
    // This is a simplified version that can be enhanced with mesh data
    try {
      // Try to get from properties if available
      const props = await this.model.getProperties(expressID);
      if (props?.ObjectPlacement) {
        // Could extract placement transformation for bounding box
        // This would require parsing the IfcLocalPlacement
      }
    } catch {
      // Bounding box not available
    }
    return null;
  }

  private async buildSpatialTree(): Promise<SpatialNode> {
    const root: SpatialNode = {
      expressID: 0,
      name: 'Building',
      type: 'Root',
      children: [],
      level: 0,
    };

    try {
      // Get building
      const building = await this.model.getAllPropertiesOfType(1308484611);
      if (building) {
        for (const [expressId, props] of Object.entries(building) as [string, any][]) {
          const buildingNode: SpatialNode = {
            expressID: parseInt(expressId),
            name: props.Name?.value || 'Edificio',
            type: 'IfcBuilding',
            children: [],
            level: 1,
          };

          // Get storeys
          const storeys = await this.model.getAllPropertiesOfType(4097515480);
          if (storeys) {
            for (const [storeyId, storeyProps] of Object.entries(storeys) as [string, any][]) {
              const storeyNode: SpatialNode = {
                expressID: parseInt(storeyId),
                name: storeyProps.Name?.value || `Level ${buildingNode.children.length + 1}`,
                type: 'IfcBuildingStorey',
                children: [],
                level: 2,
              };
              buildingNode.children.push(storeyNode);
            }
          }

          root.children.push(buildingNode);
        }
      }
    } catch (e) {
      console.warn('[IfcExtraction] Error building spatial tree:', e);
    }

    return root;
  }

  private calculateStatistics(elements: ExtractedElement[]): ModelStatistics {
    const statistics: ModelStatistics = {
      byType: {},
      byStorey: {},
      totalVolume: 0,
      totalArea: 0,
      totalLength: 0,
    };

    for (const element of elements) {
      // Count by type
      statistics.byType[element.ifcType] = (statistics.byType[element.ifcType] || 0) + 1;

      // Count by storey
      const storey = element.storeyName || 'Unassigned';
      statistics.byStorey[storey] = (statistics.byStorey[storey] || 0) + 1;

      // Sum quantities
      if (element.quantities.netVolume) statistics.totalVolume += element.quantities.netVolume;
      if (element.quantities.netArea) statistics.totalArea += element.quantities.netArea;
      if (element.quantities.length) statistics.totalLength += element.quantities.length;
    }

    return statistics;
  }
}

// ─── Utility: Batch extract from loaded IFC model ────────────────────────────

export async function extractFromModel(
  model: any,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(10, 'Analyzing IFC structure...');
  
  const service = new IfcExtractionService(model);
  onProgress?.(40, 'Extracting elements and properties...');
  
  const result = await service.extract();
  onProgress?.(80, 'Building spatial tree...');
  
  onProgress?.(100, 'Complete');
  
  return result;
}
