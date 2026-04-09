/**
 * FederatedClashPanel — Advanced Clash Detection Control Panel
 * 
 * Enhanced clash detection interface for federated BIM models with:
 * - Multi-discipline model selection
 * - Advanced tolerance controls
 * - Real-time detection progress
 * - Discipline-based filtering
 * - Enhanced clash management workflow
 */
import { useState, useCallback, useMemo } from 'react';
import { 
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Settings,
  Building2,
  Wrench,
  MapPin,
  Users,
  MessageSquare,
  Calendar,
  Target,
} from 'lucide-react';
import { 
  ModelDiscipline, 
  DetectedClash, 
  ClashDetectionSettings, 
  FederatedModel,
} from '../hooks/useFederatedBimEngine';

interface FederatedClashPanelProps {
  models: Map<string, FederatedModel>;
  clashes: DetectedClash[];
  clashSettings: ClashDetectionSettings;
  isDetecting: boolean;
  detectionProgress?: number;
  onDetectClashes: () => void;
  onNavigateToClash: (clash: DetectedClash) => void;
  onUpdateClashStatus: (clashId: string, status: DetectedClash['status'], assignedTo?: string) => void;
  onAddClashComment: (clashId: string, comment: string) => void;
  onUpdateSettings: (settings: Partial<ClashDetectionSettings>) => void;
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

const CLASH_TYPE_COLORS = {
  hard: 'bg-red-500/10 text-red-500 border-red-500/30',
  soft: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  clearance: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const STATUS_COLORS = {
  open: 'bg-amber-500/10 text-amber-600',
  assigned: 'bg-blue-500/10 text-blue-600',
  resolved: 'bg-emerald-500/10 text-emerald-600',
  ignored: 'bg-slate-500/10 text-slate-400',
};

export function FederatedClashPanel({
  models,
  clashes,
  clashSettings,
  isDetecting,
  detectionProgress = 0,
  onDetectClashes,
  onNavigateToClash,
  onUpdateClashStatus,
  onAddClashComment,
  onUpdateSettings,
}: FederatedClashPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DetectedClash['status'] | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<DetectedClash['severity'] | 'all'>('all');
  const [filterDisciplineA, setFilterDisciplineA] = useState<ModelDiscipline | 'all'>('all');
  const [filterDisciplineB, setFilterDisciplineB] = useState<ModelDiscipline | 'all'>('all');
  const [expandedClash, setExpandedClash] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');

  const loadedModels = useMemo(() => 
    Array.from(models.values()).filter(m => m.isLoaded), 
    [models]
  );

  const availableDisciplines = useMemo(() => 
    [...new Set(loadedModels.map(m => m.discipline))],
    [loadedModels]
  );

  const filteredClashes = useMemo(() => {
    return clashes.filter(clash => {
      if (filterStatus !== 'all' && clash.status !== filterStatus) return false;
      if (filterSeverity !== 'all' && clash.severity !== filterSeverity) return false;
      if (filterDisciplineA !== 'all' && clash.elementA.discipline !== filterDisciplineA) return false;
      if (filterDisciplineB !== 'all' && clash.elementB.discipline !== filterDisciplineB) return false;
      return true;
    });
  }, [clashes, filterStatus, filterSeverity, filterDisciplineA, filterDisciplineB]);

  const stats = useMemo(() => ({
    total: clashes.length,
    open: clashes.filter(c => c.status === 'open').length,
    assigned: clashes.filter(c => c.status === 'assigned').length,
    resolved: clashes.filter(c => c.status === 'resolved').length,
    critical: clashes.filter(c => c.severity === 'critical').length,
    high: clashes.filter(c => c.severity === 'high').length,
  }), [clashes]);

  const canDetectClashes = loadedModels.length >= 2;

  const handleStatusChange = useCallback((clashId: string, status: DetectedClash['status']) => {
    const assignedTo = status === 'assigned' && assigneeEmail ? assigneeEmail : undefined;
    onUpdateClashStatus(clashId, status, assignedTo);
    setAssigneeEmail('');
  }, [onUpdateClashStatus, assigneeEmail]);

  const handleAddComment = useCallback((clashId: string) => {
    if (commentText.trim()) {
      onAddClashComment(clashId, commentText.trim());
      setCommentText('');
    }
  }, [onAddClashComment, commentText]);

  const toggleDisciplineSelection = useCallback((discipline: ModelDiscipline) => {
    const newEnabled = clashSettings.enabledDisciplines.includes(discipline)
      ? clashSettings.enabledDisciplines.filter(d => d !== discipline)
      : [...clashSettings.enabledDisciplines, discipline];
    
    onUpdateSettings({ enabledDisciplines: newEnabled });
  }, [clashSettings.enabledDisciplines, onUpdateSettings]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0c10] border-l border-border/50">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Detección de Colisiones
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats.total} conflictos • {loadedModels.length} modelos cargados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onDetectClashes}
              disabled={!canDetectClashes || isDetecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-medium transition-colors"
            >
              {isDetecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {Math.round(detectionProgress)}%
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Detectar Choques
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="px-3 py-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase font-medium">Abiertos</p>
            <p className="text-xl font-bold text-amber-600">{stats.open}</p>
          </div>
          <div className="px-3 py-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase font-medium">Críticos</p>
            <p className="text-xl font-bold text-red-500">{stats.critical}</p>
          </div>
          <div className="px-3 py-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase font-medium">Resueltos</p>
            <p className="text-xl font-bold text-emerald-500">{stats.resolved}</p>
          </div>
          <div className="px-3 py-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase font-medium">Total</p>
            <p className="text-xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>

        {/* Detection Progress */}
        {isDetecting && (
          <div className="mt-4 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400 mb-2">
              <span>Detectando colisiones...</span>
              <span>{Math.round(detectionProgress)}%</span>
            </div>
            <div className="h-2 bg-emerald-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${detectionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-4 border-b border-border/50 bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground mb-3">Configuración de Detección</h3>
          
          {/* Tolerance Slider */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground block mb-2">
              Tolerancia: {clashSettings.tolerance}mm
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={clashSettings.tolerance}
              onChange={(e) => onUpdateSettings({ tolerance: parseInt(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0mm (Estricto)</span>
              <span>100mm (Permisivo)</span>
            </div>
          </div>

          {/* Discipline Selection */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground block mb-2">
              Disciplinas Activas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableDisciplines.map(discipline => {
                const Icon = DISCIPLINE_ICONS[discipline];
                const isEnabled = clashSettings.enabledDisciplines.includes(discipline);
                
                return (
                  <button
                    key={discipline}
                    onClick={() => toggleDisciplineSelection(discipline)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-colors ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon size={14} />
                    {DISCIPLINE_LABELS[discipline]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Threshold */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Umbral de Severidad
            </label>
            <select
              value={clashSettings.severityThreshold}
              onChange={(e) => onUpdateSettings({ severityThreshold: e.target.value as any })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="low">Bajo o superior</option>
              <option value="medium">Medio o superior</option>
              <option value="high">Alto o superior</option>
              <option value="critical">Solo críticos</option>
            </select>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">Filtros</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded border border-border/50 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="assigned">Asignados</option>
            <option value="resolved">Resueltos</option>
            <option value="ignored">Ignorados</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded border border-border/50 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>

          <select
            value={filterDisciplineA}
            onChange={(e) => setFilterDisciplineA(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded border border-border/50 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Disciplina A: Todas</option>
            {availableDisciplines.map(discipline => (
              <option key={discipline} value={discipline}>
                {DISCIPLINE_LABELS[discipline]}
              </option>
            ))}
          </select>

          <select
            value={filterDisciplineB}
            onChange={(e) => setFilterDisciplineB(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded border border-border/50 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Disciplina B: Todas</option>
            {availableDisciplines.map(discipline => (
              <option key={discipline} value={discipline}>
                {DISCIPLINE_LABELS[discipline]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clash List */}
      <div className="flex-1 overflow-y-auto">
        {filteredClashes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {clashes.length === 0 ? 'No hay conflictos detectados' : 'No hay conflictos que coincidan con los filtros'}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {clashes.length === 0 
                ? 'Ejecuta la detección para encontrar colisiones entre modelos'
                : 'Ajusta los filtros para ver más resultados'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredClashes.map((clash) => {
              const IconA = DISCIPLINE_ICONS[clash.elementA.discipline];
              const IconB = DISCIPLINE_ICONS[clash.elementB.discipline];
              const isExpanded = expandedClash === clash.id;
              
              return (
                <div
                  key={clash.id}
                  className={`px-4 py-4 hover:bg-muted/20 transition-colors ${
                    isExpanded ? 'bg-muted/20' : ''
                  }`}
                >
                  {/* Clash Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${SEVERITY_COLORS[clash.severity]}`}>
                          {clash.severity.toUpperCase()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_COLORS[clash.status]}`}>
                          {clash.status.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${CLASH_TYPE_COLORS[clash.clashType]}`}>
                          {clash.clashType.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Elements */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          <IconA size={14} style={{ color: DISCIPLINE_COLORS[clash.elementA.discipline] }} />
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {clash.elementA.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">↔</span>
                        <div className="flex items-center gap-1">
                          <IconB size={14} style={{ color: DISCIPLINE_COLORS[clash.elementB.discipline] }} />
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {clash.elementB.name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Volume */}
                      <p className="text-xs text-muted-foreground">
                        Intersección: {clash.intersectionVolume.toFixed(4)} m³
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedClash(isExpanded ? null : clash.id)}
                        className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => onNavigateToClash(clash)}
                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                        title="Ver en visor 3D"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border/50 space-y-4">
                      {/* Element Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-2">
                            <IconA size={16} style={{ color: DISCIPLINE_COLORS[clash.elementA.discipline] }} />
                            <span className="text-xs font-semibold text-foreground">
                              {DISCIPLINE_LABELS[clash.elementA.discipline]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            {clash.elementA.guid}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-2">
                            <IconB size={16} style={{ color: DISCIPLINE_COLORS[clash.elementB.discipline] }} />
                            <span className="text-xs font-semibold text-foreground">
                              {DISCIPLINE_LABELS[clash.elementB.discipline]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            {clash.elementB.guid}
                          </p>
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {clash.status === 'open' && (
                            <>
                              <input
                                type="email"
                                placeholder="Asignar a..."
                                value={assigneeEmail}
                                onChange={(e) => setAssigneeEmail(e.target.value)}
                                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                onClick={() => handleStatusChange(clash.id, 'assigned')}
                                disabled={!assigneeEmail.trim()}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                              >
                                <Users size={12} />
                                Asignar
                              </button>
                            </>
                          )}
                          
                          {clash.status !== 'resolved' && (
                            <button
                              onClick={() => handleStatusChange(clash.id, 'resolved')}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle2 size={12} />
                              Resolver
                            </button>
                          )}

                          {clash.status !== 'ignored' && (
                            <button
                              onClick={() => handleStatusChange(clash.id, 'ignored')}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors"
                            >
                              Ignorar
                            </button>
                          )}
                        </div>

                        {/* Comments */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Agregar comentario..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(clash.id)}
                            />
                            <button
                              onClick={() => handleAddComment(clash.id)}
                              disabled={!commentText.trim()}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                            >
                              <MessageSquare size={12} />
                              Comentar
                            </button>
                          </div>

                          {clash.comments && clash.comments.length > 0 && (
                            <div className="space-y-2">
                              {clash.comments.map((comment, index) => (
                                <div key={index} className="p-2 rounded bg-muted/20 text-xs text-muted-foreground">
                                  {comment}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(clash.createdAt).toLocaleDateString()}
                          </div>
                          {clash.assignedTo && (
                            <div className="flex items-center gap-1">
                              <Users size={12} />
                              {clash.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}