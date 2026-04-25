/**
 * useIfcQuantifier — IFC Property & Quantity Extractor
 *
 * The Quantifier module. Given a model and an expressID from Raycaster,
 * this hook extracts IFC properties (GlobalId, Name, Category) and
 * quantity data (NetVolume, NetArea, Length) from IFC BaseQuantities.
 *
 * Handles strict unit conversion: IFC millimeters → meters for Chilean budgets.
 *
 * NOTE: Does NOT use OBC.IfcRelationsIndexer (removed in @thatopen/components v3.x).
 * Instead walks the model's property graph directly via model.getProperties().
 */
import { useCallback, useRef } from 'react';
import * as OBC from '@thatopen/components';
import type { IfcQuantities, BimSelectedElement } from '../types';

// ─── IFC4 Type Codes ───────────────────────────────────────────────────────
// These are the numeric IFC type codes used in web-ifc for common elements.
const IFC_TYPE_MAP: Record<number, string> = {
  3512223829: 'IfcWall',
  2007235440: 'IfcWallStandardCase',
  1051757585: 'IfcSlab',
  3999819293: 'IfcColumn',
  753842376:  'IfcBeam',
  900683007:  'IfcFooting',
  2571569899: 'IfcPile',
  331165859:  'IfcStair',
  2262330004: 'IfcRailing',
  2016517767: 'IfcRoof',
  395920057:  'IfcDoor',
  3304561284: 'IfcWindow',
  1973544240: 'IfcCovering',
  3171933400: 'IfcPlate',
  1281925730: 'IfcMember',
  4031249490: 'IfcCurtainWall',
  1095909175: 'IfcBuildingElementProxy',
};

// ─── IFC Relation Type Codes ────────────────────────────────────────────────
// Used to identify IfcRelDefinesByProperties relations
const IFCRELDEFINESBYPROPERTIES = 4186316022;

// ─── Unit conversion factors ───────────────────────────────────────────────
// IFC uses SI. When an IFC file uses mm (common in Revit export),
// the IfcUnitAssignment will indicate prefix MILLI.
// For safety, we detect and apply conversion.
const UNIT_PREFIXES: Record<string, number> = {
  EXA: 1e18, PETA: 1e15, TERA: 1e12, GIGA: 1e9, MEGA: 1e6,
  KILO: 1e3, HECTO: 1e2, DECA: 1e1,
  DECI: 1e-1, CENTI: 1e-2, MILLI: 1e-3, MICRO: 1e-6,
  NANO: 1e-9, PICO: 1e-12, FEMTO: 1e-15,
};

/**
 * Quantity name patterns to extract from IFC BaseQuantities
 */
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

export function useIfcQuantifier(_componentsRef: React.RefObject<OBC.Components | null>) {
  const lengthFactorRef = useRef<number>(1); // Will be detected per model

  /**
   * Detect the length unit factor from the IFC model.
   * Converts from model units → meters.
   */
  const detectUnitFactor = useCallback(async (model: any): Promise<number> => {
    try {
      // Try to get IfcProject (expressID 1 typically)
      const project = await model.getProperties(1);
      if (!project) return 1;

      // Look for UnitsInContext
      const unitsId = project.UnitsInContext?.value;
      if (!unitsId) return 1;

      const unitsAssignment = await model.getProperties(unitsId);
      if (!unitsAssignment?.Units) return 1;

      for (const unitRef of unitsAssignment.Units) {
        const unitId = unitRef?.value;
        if (!unitId) continue;

        const unit = await model.getProperties(unitId);
        if (!unit) continue;

        // Look for LENGTHUNIT
        const unitType = unit.UnitType?.value;
        if (unitType === 'LENGTHUNIT' || unitType === '.LENGTHUNIT.') {
          const prefix = unit.Prefix?.value;
          if (prefix && UNIT_PREFIXES[prefix]) {
            return UNIT_PREFIXES[prefix];
          }
          return 1; // Already in meters
        }
      }
    } catch (e) {
      // Unit detection failed — non-critical
    }
    return 1;
  }, []);

  /**
   * Extract IFC category name from the type code
   */
  const getElementCategory = useCallback((typeCode: number): string => {
    return IFC_TYPE_MAP[typeCode] || `IfcElement(${typeCode})`;
  }, []);

  /**
   * Find IfcRelDefinesByProperties relations that reference a given expressID.
   * This replaces the missing IfcRelationsIndexer by walking the model directly.
   */
  const findPropertyRelations = useCallback(async (
    model: any,
    expressID: number,
  ): Promise<number[]> => {
    const relatedPsetIds: number[] = [];

    try {
      // Strategy 1: Check if the element has direct IsDefinedBy inverse attribute
      const element = await model.getProperties(expressID);
      if (element?.IsDefinedBy) {
        for (const ref of element.IsDefinedBy) {
          const relId = ref?.value;
          if (!relId) continue;
          const rel = await model.getProperties(relId);
          if (!rel) continue;
          // Get the PropertyDefinition (the pset/qset itself)
          const psetId = rel.RelatingPropertyDefinition?.value;
          if (psetId) relatedPsetIds.push(psetId);
        }
      }

      // Strategy 2: If no IsDefinedBy found, scan all IfcRelDefinesByProperties
      // (slower but works as fallback for models that don't store inverse attributes)
      if (relatedPsetIds.length === 0 && model.getAllPropertiesOfType) {
        try {
          const allRels = await model.getAllPropertiesOfType(IFCRELDEFINESBYPROPERTIES);
          if (allRels) {
            const relEntries = Object.entries(allRels);
            
            // Safety limit: if there are > 1000 relations, only scan the first 1000 
            // to avoid freezing the main thread.
            const limit = Math.min(relEntries.length, 1000);
            
            for (let i = 0; i < limit; i++) {
              const [_relId, rel] = relEntries[i] as [string, any];
              if (!rel?.RelatedObjects) continue;

              const isRelated = rel.RelatedObjects.some(
                (obj: any) => obj?.value === expressID
              );

              if (isRelated) {
                const psetId = rel.RelatingPropertyDefinition?.value;
                if (psetId && !relatedPsetIds.includes(psetId)) {
                  relatedPsetIds.push(psetId);
                }
              }
            }
            
            if (relEntries.length > 1000) {
              // Scanned only 1000 of N relations for performance
            }
          }
        } catch {
          // getAllPropertiesOfType might not be available
        }
      }
    } catch (e) {
      // Property relations lookup failed — non-critical
    }

    return relatedPsetIds;
  }, []);

  /**
   * Extract all quantities from an element's property sets.
   * Walks through IsDefinedBy relations → IfcElementQuantity → IfcQuantityArea/Volume/Length.
   * No dependency on IfcRelationsIndexer.
   */
  const extractQuantities = useCallback(async (
    model: any,
    expressID: number,
    lengthFactor: number,
  ): Promise<IfcQuantities> => {
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
      // Get related property/quantity set IDs
      const psetIds = await findPropertyRelations(model, expressID);

      for (const psetId of psetIds) {
        const pset = await model.getProperties(psetId);
        if (!pset) continue;

        // === IfcElementQuantity → has Quantities ===
        const qtyRefs = pset.Quantities || pset.HasQuantities;
        if (qtyRefs) {
          for (const qRef of qtyRefs) {
            const qId = qRef?.value;
            if (!qId) continue;

            const quantity = await model.getProperties(qId);
            if (!quantity) continue;

            const qName = quantity.Name?.value || '';
            let value: number | null = null;

            if (quantity.LengthValue?.value != null) {
              value = Number(quantity.LengthValue.value) * lengthFactor;
            } else if (quantity.AreaValue?.value != null) {
              value = Number(quantity.AreaValue.value) * (lengthFactor * lengthFactor);
            } else if (quantity.VolumeValue?.value != null) {
              value = Number(quantity.VolumeValue.value) * (lengthFactor * lengthFactor * lengthFactor);
            } else if (quantity.CountValue?.value != null) {
              value = Number(quantity.CountValue.value);
            } else if (quantity.NominalValue?.value != null) {
              value = Number(quantity.NominalValue.value);
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

        // === IfcPropertySet → has HasProperties ===
        const propRefs = pset.HasProperties;
        if (propRefs) {
          for (const pRef of propRefs) {
            const propId = pRef?.value;
            if (!propId) continue;

            const prop = await model.getProperties(propId);
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
      // Quantity extraction failed — non-critical
    }

    return quantities;
  }, [findPropertyRelations]);

  /**
   * Main entry point: given a model and expressID, extract full element data.
   */
  const quantifyElement = useCallback(async (
    model: any,
    expressID: number,
    modelID: string,
  ): Promise<BimSelectedElement | null> => {
    try {
      // Detect unit factor on first call per model
      if (lengthFactorRef.current === 1) {
        lengthFactorRef.current = await detectUnitFactor(model);
      }

      // Get the element's own properties
      const props = await model.getProperties(expressID);
      if (!props) {
        return null;
      }

      // Extract basic attributes
      const globalId = props.GlobalId?.value || `EID-${expressID}`;
      const name = props.Name?.value || props.LongName?.value || 'Elemento sin nombre';
      const objectType = props.ObjectType?.value || props.Description?.value || '';
      const typeCode = props.type || 0;
      const category = getElementCategory(typeCode);

      // Extract quantities (no indexer needed)
      const quantities = await extractQuantities(model, expressID, lengthFactorRef.current);

      // If no quantities found from relations, try direct geometric dimensions
      if (Object.keys(quantities.rawProperties).length === 0) {
        if (props.OverallWidth?.value != null) {
          quantities.width = Number(props.OverallWidth.value) * lengthFactorRef.current;
          quantities.rawProperties['OverallWidth'] = quantities.width;
        }
        if (props.OverallHeight?.value != null) {
          quantities.height = Number(props.OverallHeight.value) * lengthFactorRef.current;
          quantities.rawProperties['OverallHeight'] = quantities.height;
        }
      }

      const element: BimSelectedElement = {
        expressID,
        modelID,
        globalId,
        name,
        objectType,
        category,
        quantities,
      };

      return element;
    } catch (e) {
      return null;
    }
  }, [detectUnitFactor, getElementCategory, extractQuantities]);

  return { quantifyElement };
}
