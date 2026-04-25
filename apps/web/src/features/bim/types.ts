/**
 * BIM Module Type Definitions
 * Types for project models, BIM viewer state management,
 * element selection, and IFC quantity extraction.
 */

// ─── Project Model (Supabase) ──────────────────────────────────────────────

export interface ProjectModel {
  id: string;
  project_id: string;
  company_id?: string;
  name: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// ─── Viewer State ──────────────────────────────────────────────────────────

export interface BimViewerState {
  isLoading: boolean;
  progress: number; // 0-100
  progressMessage: string;
  error: string | null;
  isModelLoaded: boolean;
}

export interface BimEngineControls {
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleProjection: () => void;
  fitToModel: () => void;
  highlightLinkedElements: (globalIds: string[]) => Promise<void>;
  goToPlan: (planId: string) => void;
  exitPlan: () => void;
  toggleMeasurement: (active: boolean) => void;
  createClippingPlane: () => void;
  deleteClippingPlanes: () => void;
  setCategoryVisibility: (category: string, visible: boolean) => void;
}

// ─── IFC Quantity Extraction (The Quantifier) ──────────────────────────────

/**
 * Extracted IFC quantities from BaseQuantities / QuantitySet.
 * All values are normalized to SI metric units used in Chilean construction:
 * - Volumes in m³
 * - Areas in m²
 * - Lengths in ml (metros lineales)
 */
export interface IfcQuantities {
  netVolume: number | null;     // m³ — Hormigón, relleno
  grossVolume: number | null;   // m³
  netArea: number | null;       // m² — Moldajes, pintura, revestimientos
  grossArea: number | null;     // m²
  netSideArea: number | null;   // m² — Pintura lateral de muros
  length: number | null;        // ml — Soleras, tuberías
  width: number | null;         // m
  height: number | null;        // m
  perimeter: number | null;     // ml
  rawProperties: Record<string, number>; // All quantities found in IFC
}

/**
 * Represents a selected element in the 3D BIM viewer.
 * Populated by the Raycaster → IfcQuantifier pipeline.
 */
export interface BimSelectedElement {
  expressID: number;
  modelID: string;
  globalId: string;
  name: string;
  objectType: string;          // e.g. "Muro de Hormigón 200mm"
  category: string;            // IFC class: IfcWall, IfcSlab, IfcColumn, etc.
  quantities: IfcQuantities;
}

// ─── Unit Mapping for IFC Categories ───────────────────────────────────────

/** Maps IFC categories to their primary measurement units for budget partidas */
export type NumericQuantityKey = Exclude<keyof IfcQuantities, 'rawProperties'>;

export const IFC_CATEGORY_UNITS: Record<string, { primary: string; label: string; quantityKey: NumericQuantityKey }> = {
  IfcWall:           { primary: 'm3', label: 'Muro',          quantityKey: 'netVolume' },
  IfcWallStandardCase: { primary: 'm3', label: 'Muro',       quantityKey: 'netVolume' },
  IfcSlab:           { primary: 'm3', label: 'Losa',          quantityKey: 'netVolume' },
  IfcColumn:         { primary: 'm3', label: 'Pilar',         quantityKey: 'netVolume' },
  IfcBeam:           { primary: 'ml', label: 'Viga',          quantityKey: 'length' },
  IfcFooting:        { primary: 'm3', label: 'Fundación',     quantityKey: 'netVolume' },
  IfcPile:           { primary: 'ml', label: 'Pilote',        quantityKey: 'length' },
  IfcStair:          { primary: 'm2', label: 'Escalera',      quantityKey: 'netArea' },
  IfcRailing:        { primary: 'ml', label: 'Baranda',       quantityKey: 'length' },
  IfcRoof:           { primary: 'm2', label: 'Techumbre',     quantityKey: 'netArea' },
  IfcDoor:           { primary: 'un', label: 'Puerta',        quantityKey: 'netArea' },
  IfcWindow:         { primary: 'un', label: 'Ventana',       quantityKey: 'netArea' },
  IfcCovering:       { primary: 'm2', label: 'Revestimiento', quantityKey: 'netArea' },
  IfcPlate:          { primary: 'm2', label: 'Placa',         quantityKey: 'netArea' },
  IfcMember:         { primary: 'ml', label: 'Elemento',      quantityKey: 'length' },
  IfcCurtainWall:    { primary: 'm2', label: 'Muro Cortina',  quantityKey: 'netArea' },
  IfcBuildingElementProxy: { primary: 'un', label: 'Elemento', quantityKey: 'netVolume' },
};

/**
 * Returns the recommended quantity value for a BIM element based on its IFC category.
 */
export function getRecommendedQuantity(element: BimSelectedElement): {
  value: number | null;
  unit: string;
  label: string;
} {
  const mapping = IFC_CATEGORY_UNITS[element.category];
  if (mapping) {
    return {
      value: element.quantities[mapping.quantityKey],
      unit: mapping.primary,
      label: mapping.label,
    };
  }
  // Fallback: try volume → area → length
  if (element.quantities.netVolume) return { value: element.quantities.netVolume, unit: 'm3', label: element.category };
  if (element.quantities.netArea) return { value: element.quantities.netArea, unit: 'm2', label: element.category };
  if (element.quantities.length) return { value: element.quantities.length, unit: 'ml', label: element.category };
  return { value: null, unit: 'un', label: element.category };
}

// ─── Audit Log Types ───────────────────────────────────────────────────────

export interface BimAuditEntry {
  timestamp: string;
  elementGlobalId: string;
  elementCategory: string;
  elementName: string;
  quantityType: string;       // 'NetVolume' | 'NetArea' | 'Length'
  quantityValue: number;
  unit: string;
  targetItemName: string;
  targetStageId: string;
  targetItemId: string;
  previousQuantity: number;
}
