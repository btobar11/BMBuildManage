/**
 * BIM Feature — Public API (BIM 5D Enhanced)
 */
export { BimViewer } from './components/BimViewer';
export { BimModelUploader } from './components/BimModelUploader';
export { BimEmptyState } from './components/BimEmptyState';
export { BimViewerControls } from './components/BimViewerControls';
export { BimElementPopover } from './components/BimElementPopover';
export { BimElementPanel } from './components/BimElementPanel';
export { BimClashPanel } from './components/BimClashPanel';
export { BimItemLinker } from './components/BimItemLinker';
export { useBimEngine } from './hooks/useBimEngine';
export { useIfcQuantifier } from './hooks/useIfcQuantifier';
export * from './services/bimStorageService';
export * from './services/bimAuditService';
export * from './services/bimIngestionService';
export * from './services/bimOfflineService';
export * from './services/ifcExtractionService';
export * from './BimColorEngine';
export * from './BimProgressColorEngine';
export type {
  ProjectModel,
  BimViewerState,
  BimEngineControls,
  BimSelectedElement,
  IfcQuantities,
  BimAuditEntry,
} from './types';
export { getRecommendedQuantity, IFC_CATEGORY_UNITS } from './types';
export type {
  BimElementState,
  BimElementDB,
  BimModelDB,
  BimClash,
  BimClashJob,
  ElementStatus,
  ClashType,
  ClashSeverity,
  ClashStatus,
  SyncQueueItem,
  IndexedDBElementState,
} from './types-bim5d';
export {
  STATUS_LABELS,
  STATUS_COLORS,
  CLASH_TYPE_LABELS,
  CLASH_SEVERITY_LABELS,
  CLASH_STATUS_LABELS,
} from './types-bim5d';
