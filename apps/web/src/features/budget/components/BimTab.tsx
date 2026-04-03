/**
 * BimTab — BIM 3D Viewer tab wrapper for BudgetEditor
 * 
 * Integrates:
 * - Model fetching and upload
 * - 3D viewer with element selection (Raycaster)
 * - Element popover with IFC quantities
 * - Item linker modal (Bridge to Budget)
 * - Audit logging for BIM-sourced cubication updates
 */
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BimViewer } from '../../bim/components/BimViewer';
import { BimErrorBoundaryWrapper } from '../../bim/components/BimErrorBoundary';
import { BimModelUploader } from '../../bim/components/BimModelUploader';
import { BimEmptyState } from '../../bim/components/BimEmptyState';
import { BimItemLinker } from '../../bim/components/BimItemLinker';
import {
  getProjectModels,
  downloadModelBuffer,
  deleteModel,
} from '../../bim/services/bimStorageService';
import { logBimCubicationUpdate } from '../../bim/services/bimAuditService';
import type { ProjectModel, BimSelectedElement } from '../../bim/types';
import { getRecommendedQuantity } from '../../bim/types';
import type { Stage, LineItem } from '../types';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Trash2, FileText, Calendar, HardDrive, Upload, AlertCircle, Link2 } from 'lucide-react';

interface BimTabProps {
  projectId: string;
  stages: Stage[];
  onUpdateItem: (stageId: string, itemId: string, patch: Partial<Omit<LineItem, 'id' | 'total'>>) => void;
}

export function BimTab({ projectId, stages, onUpdateItem }: BimTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [linkingElement, setLinkingElement] = useState<BimSelectedElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewerRetryCount, setViewerRetryCount] = useState(0);

  const { data: models, isLoading, error } = useQuery<ProjectModel[]>({
    queryKey: ['project-models', projectId],
    queryFn: async () => {
      const rawModels = await getProjectModels(projectId);
      // Deduplicate by storage_path to prevent same-file duplicates from appearing
      const uniqueModelsMap = new Map<string, ProjectModel>();
      rawModels.forEach(m => {
        if (!uniqueModelsMap.has(m.storage_path)) {
          uniqueModelsMap.set(m.storage_path, m);
        }
      });
      return Array.from(uniqueModelsMap.values());
    },
    enabled: !!projectId,
  });

  const activeModel = selectedModelId
    ? models?.find((m) => m.id === selectedModelId) || models?.[0]
    : models?.[0];

  // Extract all linked IFC GlobalIDs for visual feedback
  const linkedIfcIds = stages.flatMap(s => 
    s.items.filter(i => i.ifc_global_id).map(i => i.ifc_global_id!)
  );

  const handleUploadSuccess = useCallback(
    (model: ProjectModel) => {
      queryClient.invalidateQueries({ queryKey: ['project-models', projectId] });
      setSelectedModelId(model.id);
      setShowUploader(false);
    },
    [queryClient, projectId]
  );

  const handleDelete = useCallback(
    async (model: ProjectModel) => {
      console.log(`[BimTab] Starting deletion of model: ${model.id} (${model.name})`);
      setIsDeleting(true);
      try {
        // Reset active model if it was the one deleted, BEFORE the service call
        if (selectedModelId === model.id) {
          console.log('[BimTab] Clearing active model ID before deletion');
          setSelectedModelId(null);
        }

        await deleteModel(model.id, model.storage_path);
        console.log('[BimTab] Deletion service call successful');

        // Invalidate queries to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['project-models', projectId] });
        setDeleteConfirmId(null);
        console.log('[BimTab] Queries invalidated successfully');
      } catch (err) {
        console.error('[BimTab] Deletion process failed:', err);
        alert(err instanceof Error ? err.message : 'Error al eliminar el modelo');
      } finally {
        setIsDeleting(false);
      }
    },
    [queryClient, projectId, selectedModelId]
  );

  const getModelBuffer = useCallback(async (storagePath: string) => {
    return downloadModelBuffer(storagePath);
  }, []);

  /**
   * Handle linking a BIM element to a budget item.
   * Updates quantity, ifc_global_id, cubication_mode and logs audit entry.
   */
  const handleLinkToItem = useCallback(
    async (stageId: string, itemId: string, quantity: number, unit: string, element: BimSelectedElement) => {
      // Find the current item to get previous quantity for audit
      const stage = stages.find(s => s.id === stageId);
      const item = stage?.items.find(i => i.id === itemId);
      const previousQuantity = item?.quantity || 0;

      const loadingToast = toast.loading('Sincronizando con base de datos...');

      try {
        // 1. Immediate Persistence to Database
        await api.patch(`/items/${itemId}`, {
          quantity,
          unit,
          ifc_global_id: element.globalId,
          cubication_mode: 'bim',
          geometry_data: element.quantities, // Detailed IFC metrics
        });

        // 2. Update Local State (UI)
        onUpdateItem(stageId, itemId, {
          quantity,
          unit,
          ifc_global_id: element.globalId,
          cubication_mode: 'bim',
        });

        // 3. Log audit entry
        if (linkingElement) {
          const recommended = getRecommendedQuantity(linkingElement);
          await logBimCubicationUpdate({
            timestamp: new Date().toISOString(),
            elementGlobalId: element.globalId,
            elementCategory: linkingElement.category,
            elementName: linkingElement.name,
            quantityType: recommended.unit === 'm3' ? 'NetVolume' : recommended.unit === 'm2' ? 'NetArea' : 'Length',
            quantityValue: quantity,
            unit,
            targetItemName: item?.name || 'Partida',
            targetStageId: stageId,
            targetItemId: itemId,
            previousQuantity,
          });
        }

        toast.success('Vínculo BIM guardado correctamente', { id: loadingToast });
        setLinkingElement(null);
      } catch (err) {
        console.error('[BimTab] Sync error:', err);
        toast.error('Error al persistir vínculo en base de datos', { id: loadingToast });
      }
    },
    [stages, onUpdateItem, linkingElement]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle size={40} className="text-red-500/60" />
        <p className="text-muted-foreground text-sm">Error al cargar modelos BIM</p>
      </div>
    );
  }

  // No models — show empty state
  if (!models || models.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <BimEmptyState onUploadClick={() => setShowUploader(true)} />

        {showUploader && (
          <BimModelUploader
            projectId={projectId}
            companyId={user?.company_id || ''}
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploader(false)}
          />
        )}
      </div>
    );
  }

  // Has models — show viewer + model list
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Model selector bar (if multiple models) */}
      {models.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`
                  group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer
                  ${activeModel?.id === model.id
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-card/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <FileText size={13} />
                <span className="truncate max-w-[120px]">{model.name}</span>

                  {deleteConfirmId === model.id ? (
                    <div className="flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(model); }}
                        className="px-2 py-0.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                        className="px-2 py-0.5 rounded-md bg-muted text-foreground hover:bg-border transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(model.id);
                      }}
                      className={`
                        ml-1 p-1 rounded-lg transition-all
                        ${activeModel?.id === model.id 
                          ? 'opacity-100 text-red-500 hover:bg-red-500/10' 
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                        }
                        ${isDeleting ? 'animate-pulse cursor-not-allowed' : ''}
                      `}
                      title="Eliminar modelo"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* BIM link indicator */}
            {stages.some(s => s.items.some(i => i.ifc_global_id)) && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/15">
                <Link2 size={11} />
                {stages.reduce((c, s) => c + s.items.filter(i => i.ifc_global_id).length, 0)} vinculadas
              </div>
            )}

            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-all"
            >
              <Upload size={13} />
              Subir otro modelo
            </button>
          </div>
        </div>
      )}

      {/* Active Model Info */}
      {activeModel && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>{new Date(activeModel.created_at).toLocaleDateString()}</span>
          </div>
          {activeModel.file_size && (
            <div className="flex items-center gap-1.5">
              <HardDrive size={12} />
              <span>{(activeModel.file_size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            <span>{activeModel.file_name}</span>
          </div>
        </div>
      )}

      {/* 3D Viewer */}
      {activeModel && (
        <div className="h-[600px]">
          <BimErrorBoundaryWrapper
            modelName={activeModel.name}
            retryKey={`${activeModel.id}-${viewerRetryCount}`}
            onBack={() => setSelectedModelId(null)}
            onRetry={() => setViewerRetryCount(prev => prev + 1)}
          >
            <BimViewer
              storagePath={activeModel.storage_path}
              getModelBuffer={getModelBuffer}
              modelName={activeModel.name}
              onElementSelect={(element) => {
                console.log('[BimTab] Element selected:', element);
              }}
              onLinkToItem={(element) => {
                setLinkingElement(element);
              }}
              linkedIfcIds={linkedIfcIds}
            />
          </BimErrorBoundaryWrapper>
        </div>
      )}

      {/* Item Linker Modal */}
      {linkingElement && (
        <BimItemLinker
          element={linkingElement}
          stages={stages}
          onLink={handleLinkToItem}
          onClose={() => setLinkingElement(null)}
        />
      )}

      {/* Upload modal */}
      {showUploader && (
        <BimModelUploader
          projectId={projectId}
          companyId={user?.company_id || ''}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}
