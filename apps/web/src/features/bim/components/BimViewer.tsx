/**
 * BimViewer — Main 3D BIM viewer component (BIM 5D Enhanced)
 * 
 * Renders IFC models in a WebGL canvas using ThatOpen/Three.js.
 * Features:
 * - Element selection via Highlighter (auto click-to-select)
 * - 4D Progress tracking with state mutations
 * - Offline-first sync support
 * - Linear-style element panel
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { useBimEngine } from '../hooks/useBimEngine';
import { BimViewerControls } from './BimViewerControls';
import { BimElementPanel } from './BimElementPanel';
import { Loader2, AlertCircle, RotateCcw, MousePointerClick, Cloud, CloudOff } from 'lucide-react';
import type { BimSelectedElement } from '../types';
import type { ElementStatus, BimElementState } from '../types-bim5d';
import { updateElementState, getLocalElementState, fetchServerElementState, syncAllPendingStates } from '../services/bimOfflineService';

interface BimViewerProps {
  storagePath: string;
  getModelBuffer: (storagePath: string) => Promise<Uint8Array>;
  modelName?: string;
  modelId?: string;
  onElementSelect?: (element: BimSelectedElement) => void;
  onLinkToItem?: (element: BimSelectedElement) => void;
  linkedIfcIds?: string[];
  showElementPanel?: boolean;
}

export function BimViewer({
  storagePath,
  getModelBuffer,
  modelName,
  modelId,
  onElementSelect,
  onLinkToItem,
  linkedIfcIds = [],
  showElementPanel = true,
}: BimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const loadingPathRef = useRef<string>('');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [elementState, setElementState] = useState<BimElementState | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const {
    viewerState,
    selectedElement,
    initEngine,
    loadIfc,
    controls,
    clearSelection,
  } = useBimEngine(containerRef, { onElementSelect });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch element state when selection changes
  useEffect(() => {
    if (selectedElement) {
      loadElementState(selectedElement.globalId);
    } else {
      setElementState(null);
    }
  }, [selectedElement?.globalId]);

  const loadElementState = async (globalId: string) => {
    try {
      // First check local state
      const localState = await getLocalElementState(globalId);
      if (localState) {
        setElementState(localState as unknown as BimElementState);
        setPendingSync(localState.pending_sync);
      }

      // Then check server state if online
      if (isOnline && modelId) {
        const serverState = await fetchServerElementState(globalId);
        if (serverState) {
          setElementState(serverState);
          setPendingSync(false);
        }
      }
    } catch (error) {
      console.warn('[BimViewer] Error loading element state:', error);
    }
  };

  const handleStateChange = useCallback(async (status: ElementStatus, progress: number) => {
    if (!selectedElement) return;

    try {
      setIsSyncing(true);
      const result = await updateElementState(
        selectedElement.globalId,
        status,
        progress
      );

      if (result.localState) {
        setElementState(result.localState as unknown as BimElementState);
        setPendingSync(result.localState.pending_sync);
      }

      // If online and no conflict, sync immediately
      if (isOnline) {
        await syncAllPendingStates();
        setPendingSync(false);
      }
    } catch (error) {
      console.error('[BimViewer] Error updating state:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedElement, isOnline]);

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
              className="text-emerald-500 animate-spin"
              strokeWidth={1.5}
            />
            <svg className="absolute inset-0 w-12 h-12" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-emerald-500/20"
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
                className="text-emerald-500 transition-all duration-300"
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

          <div className="w-48 h-1 bg-muted rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
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
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
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

      {/* Model name badge with sync status */}
      {viewerState.isModelLoaded && modelName && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-card/70 border border-border text-xs font-medium text-foreground shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{modelName}</span>
          <div className="flex items-center gap-1 ml-1 text-[10px] text-muted-foreground">
            {isSyncing ? (
              <Loader2 size={10} className="animate-spin text-emerald-500" />
            ) : pendingSync ? (
              <CloudOff size={10} className="text-amber-500" />
            ) : (
              <Cloud size={10} className={isOnline ? 'text-emerald-500' : 'text-slate-400'} />
            )}
          </div>
        </div>
      )}

      {/* Selection hint badge */}
      {viewerState.isModelLoaded && !selectedElement && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-card/50 border border-border/50 text-[10px] font-medium text-muted-foreground shadow-sm animate-in fade-in duration-700">
          <MousePointerClick size={12} className="text-emerald-400" />
          Clic en un elemento para inspeccionar
        </div>
      )}

      {/* Element Panel — Right side Linear-style panel */}
      {showElementPanel && selectedElement && (
        <BimElementPanel
          element={selectedElement}
          elementState={elementState}
          onClose={clearSelection}
          onStateChange={handleStateChange}
          onLinkToItem={() => onLinkToItem?.(selectedElement)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingSync={pendingSync}
        />
      )}

      {/* Element Popover — Legacy floating popover (when panel is hidden) */}
      {!showElementPanel && selectedElement && (
        <BimElementPopover
          element={selectedElement}
          onClose={clearSelection}
          onLinkToItem={() => onLinkToItem?.(selectedElement)}
        />
      )}
    </div>
  );
}

// Re-export the old popover for backwards compatibility
import { BimElementPopover } from './BimElementPopover';
