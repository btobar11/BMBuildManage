/**
 * FederatedBimViewer — Advanced BIM Viewer with Federated Model Support
 * 
 * Enhanced 3D viewer with:
 * - Multi-discipline model federation
 * - Real-time clash visualization with highlighting
 * - Discipline-based visibility controls
 * - Advanced collision detection integration
 * - Smooth navigation between clashes
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Building2,
  Eye,
  EyeOff,
  Layers,
  Target,
  AlertTriangle,
  Zap,
  Wrench,
  MapPin,
  Settings,
  Navigation,
} from 'lucide-react';
import { useFederatedBimEngine, ModelDiscipline, DetectedClash, FederatedModel } from '../hooks/useFederatedBimEngine';
import { FederatedClashPanel } from './FederatedClashPanel';
import { FederatedModelUploader } from './FederatedModelUploader';
import { BimViewerControls } from './BimViewerControls';

interface FederatedBimViewerProps {
  projectId: string;
  companyId: string;
  className?: string;
}

const DISCIPLINE_ICONS: Record<ModelDiscipline, any> = {
  [ModelDiscipline.ARCHITECTURE]: Building2,
  [ModelDiscipline.STRUCTURE]: Building2,
  [ModelDiscipline.MEP_HVAC]: Zap,
  [ModelDiscipline.MEP_PLUMBING]: Wrench,
  [ModelDiscipline.MEP_ELECTRICAL]: Zap,
  [ModelDiscipline.TOPOGRAPHY]: MapPin,
  [ModelDiscipline.LANDSCAPE]: MapPin,
};

const DISCIPLINE_COLORS: Record<ModelDiscipline, string> = {
  [ModelDiscipline.ARCHITECTURE]: '#6B7280',
  [ModelDiscipline.STRUCTURE]: '#DC2626',
  [ModelDiscipline.MEP_HVAC]: '#2563EB',
  [ModelDiscipline.MEP_PLUMBING]: '#059669',
  [ModelDiscipline.MEP_ELECTRICAL]: '#D97706',
  [ModelDiscipline.TOPOGRAPHY]: '#92400E',
  [ModelDiscipline.LANDSCAPE]: '#15803D',
};

const DISCIPLINE_LABELS: Record<ModelDiscipline, string> = {
  [ModelDiscipline.ARCHITECTURE]: 'Arquitectura',
  [ModelDiscipline.STRUCTURE]: 'Estructura',
  [ModelDiscipline.MEP_HVAC]: 'HVAC',
  [ModelDiscipline.MEP_PLUMBING]: 'Sanitario',
  [ModelDiscipline.MEP_ELECTRICAL]: 'Eléctrico',
  [ModelDiscipline.TOPOGRAPHY]: 'Topografía',
  [ModelDiscipline.LANDSCAPE]: 'Paisajismo',
};

export function FederatedBimViewer({
  projectId,
  companyId,
  className = '',
}: FederatedBimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showClashPanel, setShowClashPanel] = useState(false);
  const [showDisciplinePanel, setShowDisciplinePanel] = useState(true);
  const [highlightedClash, setHighlightedClash] = useState<DetectedClash | null>(null);

  // Use federated BIM engine
  const federatedBim = useFederatedBimEngine(containerRef, {
    onElementSelect: () => {},
    onClashDetected: () => {},
    onModelLoaded: () => {},
  });

  const {
    viewerState,
    selectedElement,
    federatedState,
    addModel,
    removeModel,
    toggleDisciplineVisibility,
    detectClashes,
    navigateToClash,
    updateClashStatus,
    addClashComment,
    updateClashSettings,
    controls,
    initEngine,
  } = federatedBim;

  // Initialize engine on mount
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const handleUploadSuccess = useCallback(async (models: any[]) => {
    for (const modelData of models) {
      // Convert uploaded model to buffer and add to federation
      try {
        } catch (error) {
        }
    }
    
    setShowUploader(false);
  }, [addModel]);

  const handleClashNavigation = useCallback(async (clash: DetectedClash) => {
    setHighlightedClash(clash);
    await navigateToClash(clash);
    
    // Auto-hide clash highlight after 5 seconds
    setTimeout(() => {
      setHighlightedClash(null);
    }, 5000);
  }, [navigateToClash]);

  const handleClashStatusUpdate = useCallback((clashId: string, status: DetectedClash['status'], assignedTo?: string) => {
    updateClashStatus(clashId, status, assignedTo);
  }, [updateClashStatus]);

  const handleAddClashComment = useCallback((clashId: string, comment: string) => {
    addClashComment(clashId, comment);
  }, [addClashComment]);

  const loadedModels = Array.from(federatedState.models.values()).filter(m => m.isLoaded);
  const availableDisciplines = [...new Set(loadedModels.map(m => m.discipline))];

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Left Panel - Discipline Controls */}
      {showDisciplinePanel && (
        <div className="w-80 flex flex-col bg-background border-r border-border/50">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                  <Layers size={16} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Modelos Federados</h3>
                  <p className="text-xs text-muted-foreground">
                    {loadedModels.length} modelo(s) cargado(s)
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowUploader(true)}
                className="px-3 py-2 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Subir Modelos
              </button>
            </div>

            {/* Loading Progress */}
            {federatedState.totalModels > 0 && federatedState.loadedModels < federatedState.totalModels && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Cargando modelos...</span>
                  <span>{Math.round(federatedState.overallProgress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${federatedState.overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadedModels.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Building2 size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No hay modelos cargados
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Sube archivos IFC, DXF o PDF para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(new Set(loadedModels.map(m => m.discipline))).map(discipline => {
                  const disciplineModels = loadedModels.filter(m => m.discipline === discipline);
                  const Icon = DISCIPLINE_ICONS[discipline];
                  const isVisible = disciplineModels.every(m => m.isVisible);
                  
                  return (
                    <div key={discipline} className="space-y-2">
                      {/* Discipline Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon 
                            size={16} 
                            style={{ color: DISCIPLINE_COLORS[discipline] }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {DISCIPLINE_LABELS[discipline]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({disciplineModels.length})
                          </span>
                        </div>
                        
                        <button
                          onClick={() => toggleDisciplineVisibility(discipline)}
                          className="p-1.5 rounded hover:bg-muted/30 transition-colors"
                          title={isVisible ? 'Ocultar disciplina' : 'Mostrar disciplina'}
                        >
                          {isVisible ? (
                            <Eye size={14} className="text-emerald-500" />
                          ) : (
                            <EyeOff size={14} className="text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      {/* Models in Discipline */}
                      <div className="space-y-1 ml-6">
                        {disciplineModels.map(model => (
                          <div
                            key={model.id}
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                              model.isVisible 
                                ? 'bg-muted/20 hover:bg-muted/30' 
                                : 'bg-muted/10 opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {model.name}
                              </p>
                              {model.loadProgress < 100 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 transition-all duration-300"
                                      style={{ width: `${model.loadProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(model.loadProgress)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => toggleDisciplineVisibility(discipline)}
                                className="p-1 rounded hover:bg-muted/30 transition-colors"
                                title={model.isVisible ? 'Ocultar modelo' : 'Mostrar modelo'}
                              >
                                {model.isVisible ? (
                                  <Eye size={12} className="text-emerald-500" />
                                ) : (
                                  <EyeOff size={12} className="text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <button
              onClick={detectClashes}
              disabled={loadedModels.length < 2 || federatedState.isDetectingClashes}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg font-medium transition-colors"
            >
              {federatedState.isDetectingClashes ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Detectando...
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  Detectar Colisiones
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowClashPanel(!showClashPanel)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showClashPanel
                  ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Target size={14} />
              {showClashPanel ? 'Ocultar' : 'Ver'} Colisiones ({federatedState.detectedClashes.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Viewer Area */}
      <div className="flex-1 flex flex-col">
        {/* Viewer Controls */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDisciplinePanel(!showDisciplinePanel)}
              className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <Layers size={16} className="text-muted-foreground" />
            </button>
            
            {highlightedClash && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg border border-red-500/20">
                <AlertTriangle size={14} />
                <span className="text-sm font-medium">
                  Colisión resaltada: {highlightedClash.elementA.name} ↔ {highlightedClash.elementB.name}
                </span>
                <button
                  onClick={() => setHighlightedClash(null)}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {controls && (
            <BimViewerControls
              controls={controls}
              viewerState={viewerState}
              availablePlans={federatedBim.plans?.available || []}
              currentPlan={federatedBim.plans?.current || null}
            />
          )}
        </div>

        {/* 3D Viewer Container */}
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
          />

          {/* Loading Overlay */}
          {viewerState.isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {viewerState.progressMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(viewerState.progress)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {viewerState.error && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Error en el visor 3D
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewerState.error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Clash Detection */}
      {showClashPanel && (
        <div className="w-96 max-w-[40%]">
          <FederatedClashPanel
            models={federatedState.models}
            clashes={federatedState.detectedClashes}
            clashSettings={federatedState.clashDetectionSettings}
            isDetecting={federatedState.isDetectingClashes}
            detectionProgress={federatedState.isDetectingClashes ? 50 : 0} // Mock progress
            onDetectClashes={detectClashes}
            onNavigateToClash={handleClashNavigation}
            onUpdateClashStatus={handleClashStatusUpdate}
            onAddClashComment={handleAddClashComment}
            onUpdateSettings={updateClashSettings}
          />
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <FederatedModelUploader
          projectId={projectId}
          companyId={companyId}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUploader(false)}
          maxFiles={8}
          allowedDisciplines={Object.values(ModelDiscipline)}
        />
      )}
    </div>
  );
}