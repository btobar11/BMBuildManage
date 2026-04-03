/**
 * BIM Feature — Public API
 */
export { BimViewer } from './components/BimViewer';
export { BimModelUploader } from './components/BimModelUploader';
export { BimEmptyState } from './components/BimEmptyState';
export { BimViewerControls } from './components/BimViewerControls';
export { BimElementPopover } from './components/BimElementPopover';
export { BimItemLinker } from './components/BimItemLinker';
export { useBimEngine } from './hooks/useBimEngine';
export { useIfcQuantifier } from './hooks/useIfcQuantifier';
export * from './services/bimStorageService';
export * from './services/bimAuditService';
export type {
  ProjectModel,
  BimViewerState,
  BimEngineControls,
  BimSelectedElement,
  IfcQuantities,
  BimAuditEntry,
} from './types';
export { getRecommendedQuantity, IFC_CATEGORY_UNITS } from './types';
