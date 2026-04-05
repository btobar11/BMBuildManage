/**
 * BIM 5D Module Type Definitions
 * 
 * Extends the existing BIM types with:
 * - Element states for 4D progress tracking
 * - Clash detection types
 * - Offline sync types
 */

// Re-export existing types
export type {
  BimSelectedElement,
  IfcQuantities,
  BimViewerState,
  BimEngineControls,
} from './types';

export { IFC_CATEGORY_UNITS, getRecommendedQuantity } from './types';

// ─── Element State (4D Progress) ─────────────────────────────────────────────

export type ElementStatus = 'no_iniciado' | 'en_progreso' | 'ejecutado' | 'verificado';

export interface BimElementState {
  id: string;
  element_id: string;
  company_id?: string;
  status: ElementStatus;
  progress_percent: number;
  assigned_to: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  local_version: number;
  server_version: number;
  last_synced_at: string | null;
}

export interface BimStateChange {
  id: string;
  element_state_id: string;
  previous_status: ElementStatus | null;
  new_status: ElementStatus;
  previous_progress: number | null;
  new_progress: number;
  changed_by: string | null;
  change_reason: string | null;
  changed_at: string;
}

export const STATUS_LABELS: Record<ElementStatus, string> = {
  no_iniciado: 'No Iniciado',
  en_progreso: 'En Progreso',
  ejecutado: 'Ejecutado',
  verificado: 'Verificado',
};

export const STATUS_COLORS: Record<ElementStatus, string> = {
  no_iniciado: '#64748b',    // slate-500
  en_progreso: '#f59e0b',   // amber-500
  ejecutado: '#10b981',     // emerald-500
  verificado: '#06b6d4',    // cyan-500
};

// ─── Clash Detection ──────────────────────────────────────────────────────────

export type ClashType = 'hard' | 'soft' | 'clearance';
export type ClashSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ClashStatus = 'pending' | 'accepted' | 'resolved' | 'ignored';

export interface BimClash {
  id: string;
  company_id?: string;
  model_a_id: string;
  model_b_id: string;
  element_a_id: string;
  element_b_id: string;
  element_a_guid: string;
  element_b_guid: string;
  element_a_name: string;
  element_b_name: string;
  clash_type: ClashType;
  severity: ClashSeverity;
  status: ClashStatus;
  intersection_volume: number | null;
  clearance_distance: number | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

export interface BimClashJob {
  id: string;
  company_id?: string;
  project_id: string;
  model_a_id: string;
  model_b_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  clashes_found: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export const CLASH_TYPE_LABELS: Record<ClashType, string> = {
  hard: 'Choque Duro',
  soft: 'Choque Blando',
  clearance: 'Distancia Mínima',
};

export const CLASH_SEVERITY_LABELS: Record<ClashSeverity, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
};

export const CLASH_STATUS_LABELS: Record<ClashStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  resolved: 'Resuelto',
  ignored: 'Ignorado',
};

// ─── Offline Sync ──────────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id: string;
  type: 'state_update' | 'clash_resolution';
  payload: StateUpdatePayload | ClashResolutionPayload;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}

export interface StateUpdatePayload {
  element_id: string;
  status: ElementStatus;
  progress_percent: number;
  notes?: string;
  local_version: number;
}

export interface ClashResolutionPayload {
  clash_id: string;
  status: ClashStatus;
  resolution_notes?: string;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors: string[];
}

// ─── Combined View Types ──────────────────────────────────────────────────────

export interface ElementWithState {
  id: string;
  ifc_guid: string;
  express_id: number | null;
  name: string;
  ifc_type: string;
  category: string | null;
  storey_name: string | null;
  quantities: {
    netVolume: number | null;
    netArea: number | null;
    length: number | null;
  };
  state?: BimElementState;
}

export interface ClashViewModel {
  clash: BimClash;
  elementA?: BimElementDB;
  elementB?: BimElementDB;
}

// ─── Database Types (mirror of Supabase) ──────────────────────────────────────

export interface BimModelDB {
  id: string;
  company_id: string;
  project_id: string;
  project_model_id: string | null;
  filename: string;
  version: number;
  file_size_bytes: number | null;
  element_count: number;
  spatial_tree: any | null;
  statistics: {
    byType: Record<string, number>;
    byStorey: Record<string, number>;
    totalVolume: number;
    totalArea: number;
    totalLength: number;
  } | null;
  uploaded_at: string;
  parsed_at: string | null;
  status: 'uploaded' | 'parsing' | 'parsed' | 'error';
  parse_error: string | null;
}

export interface BimElementDB {
  id: string;
  company_id: string;
  model_id: string;
  ifc_guid: string;
  express_id: number | null;
  name: string;
  object_type: string | null;
  ifc_type: string;
  category: string | null;
  storey_id: string | null;
  storey_name: string | null;
  bounding_box: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  } | null;
  spatial_location: any | null;
  quantities: {
    netVolume: number | null;
    netArea: number | null;
    length: number | null;
    [key: string]: number | null | any;
  } | null;
  linked_item_id: string | null;
}

export interface BimPropertyDB {
  id: string;
  company_id: string;
  element_id: string;
  property_set_name: string;
  property_name: string;
  property_type: string | null;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
}

// ─── IndexedDB Schema ─────────────────────────────────────────────────────────

export const IDB_STORES = {
  ELEMENT_STATES: 'bim_element_states',
  SYNC_QUEUE: 'bim_sync_queue',
  CACHED_ELEMENTS: 'bim_elements_cache',
} as const;

export interface IndexedDBElementState {
  id: string;
  element_id: string;
  status: ElementStatus;
  progress_percent: number;
  assigned_to: string | null;
  notes: string | null;
  local_version: number;
  server_version: number;
  last_synced_at: string | null;
  pending_sync: boolean;
}
