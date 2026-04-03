/**
 * BimViewer — Main 3D BIM viewer component
 * Renders IFC models in a WebGL canvas using ThatOpen/Three.js.
 * Supports element selection via the built-in Highlighter (auto click-to-select).
 */
import { useRef, useEffect, useCallback } from 'react';
import { useBimEngine } from '../hooks/useBimEngine';
import { BimViewerControls } from './BimViewerControls';
import { BimElementPopover } from './BimElementPopover';
import { Loader2, AlertCircle, RotateCcw, MousePointerClick } from 'lucide-react';
import type { BimSelectedElement } from '../types';

interface BimViewerProps {
  /** Storage path of the IFC file to load */
  storagePath: string;
  /** Function to get the file buffer */
  getModelBuffer: (storagePath: string) => Promise<Uint8Array>;
  /** Optional model name */
  modelName?: string;
  /** Callback fired when an element is selected via Highlighter */
  onElementSelect?: (element: BimSelectedElement) => void;
  /** Callback for linking element to a budget item */
  onLinkToItem?: (element: BimSelectedElement) => void;
  /** List of IFC GlobalIDs already linked to the budget */
  linkedIfcIds?: string[];
}

export function BimViewer({
  storagePath,
  getModelBuffer,
  modelName,
  onElementSelect,
  onLinkToItem,
  linkedIfcIds = [],
}: BimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const loadingPathRef = useRef<string>('');

  const {
    viewerState,
    selectedElement,
    initEngine,
    loadIfc,
    controls,
    clearSelection,
  } = useBimEngine(containerRef, { onElementSelect });

  const loadModel = useCallback(async () => {
    if (loadingPathRef.current === storagePath) return;
    loadingPathRef.current = storagePath;

    try {
      await initEngine();
      const buffer = await getModelBuffer(storagePath);
      await loadIfc(buffer, modelName);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading BIM model:', error);
    }
  }, [storagePath, getModelBuffer, modelName, initEngine, loadIfc]);

  // Load model when storagePath changes
  useEffect(() => {
    if (storagePath && !hasLoadedRef.current) {
      loadModel();
    }

    // Cleanup: Reset loading state if storagePath changes or unmounts
    return () => {
      hasLoadedRef.current = false;
      loadingPathRef.current = '';
    };
  }, [storagePath, loadModel]);

  // Sync linked elements highlighting
  useEffect(() => {
    if (viewerState.isModelLoaded) {
      console.log('[BimViewer] Syncing linked highlights:', linkedIfcIds.length);
      controls.highlightLinkedElements(linkedIfcIds);
    }
  }, [viewerState.isModelLoaded, linkedIfcIds, controls]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0c0e12] dark:to-[#111318]">
      {/* WebGL Container */}
      <div
        ref={containerRef}
        id="bim-container"
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: viewerState.isModelLoaded ? 'crosshair' : 'default' }}
      />

      {/* Loading Overlay */}
      {viewerState.isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mb-6">
            <Loader2
              size={48}
              className="text-indigo-500 animate-spin"
              strokeWidth={1.5}
            />
            {/* Progress circle around spinner */}
            <svg className="absolute inset-0 w-12 h-12" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-indigo-500/20"
              />
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${viewerState.progress * 1.38} 138`}
                className="text-indigo-500 transition-all duration-300"
                transform="rotate(-90 24 24)"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-foreground mb-1">
            {viewerState.progressMessage || 'Cargando modelo...'}
          </p>
          <p className="text-xs text-muted-foreground">
            {viewerState.progress}% completado
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-muted rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${viewerState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {viewerState.error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">
            Error de Carga
          </h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            {viewerState.error}
          </p>
          <button
            onClick={() => {
              hasLoadedRef.current = false;
              loadingPathRef.current = '';
              loadModel();
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
          >
            <RotateCcw size={14} />
            Reintentar
          </button>
        </div>
      )}

      {/* Floating Controls */}
      <BimViewerControls
        controls={controls}
        isModelLoaded={viewerState.isModelLoaded}
      />

      {/* Model name badge */}
      {viewerState.isModelLoaded && modelName && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-card/70 border border-border text-xs font-medium text-foreground shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {modelName}
        </div>
      )}

      {/* Selection hint badge */}
      {viewerState.isModelLoaded && !selectedElement && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-card/50 border border-border/50 text-[10px] font-medium text-muted-foreground shadow-sm animate-in fade-in duration-700">
          <MousePointerClick size={12} className="text-indigo-400" />
          Clic en un elemento para inspeccionar
        </div>
      )}

      {/* Element Popover — shows when an element is selected */}
      {selectedElement && (
        <BimElementPopover
          element={selectedElement}
          onClose={clearSelection}
          onLinkToItem={() => onLinkToItem?.(selectedElement)}
        />
      )}
    </div>
  );
}
