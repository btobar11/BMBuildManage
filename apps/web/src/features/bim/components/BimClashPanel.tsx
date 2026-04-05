/**
 * BimClashPanel — Clash Detection Management UI
 * 
 * Linear-style table view for managing BIM clashes.
 * Shows clash summary, list, and allows resolution.
 */
import { useState } from 'react';
import { 
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from 'lucide-react';
import type { 
  BimClash, 
  ClashSeverity, 
  ClashStatus,
} from '../types-bim5d';
import { 
  CLASH_TYPE_LABELS as TYPE_LABELS, 
  CLASH_SEVERITY_LABELS as SEVERITY_LABELS, 
  CLASH_STATUS_LABELS as STATUS_LABELS 
} from '../types-bim5d';

interface BimClashPanelProps {
  clashes: BimClash[];
  onClashSelect: (clash: BimClash) => void;
  onStatusChange: (clashId: string, status: ClashStatus) => Promise<void>;
  onRunDetection: () => Promise<void>;
  isRunning: boolean;
  progress: number;
}

const SEVERITY_COLORS: Record<ClashSeverity, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const STATUS_COLORS: Record<ClashStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  accepted: 'bg-blue-500/10 text-blue-500',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  ignored: 'bg-slate-500/10 text-slate-400',
};

export function BimClashPanel({
  clashes,
  onClashSelect,
  onStatusChange,
  onRunDetection,
  isRunning,
  progress,
}: BimClashPanelProps) {
  const [filterStatus, setFilterStatus] = useState<ClashStatus | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ClashSeverity | 'all'>('all');
  const [expandedClash, setExpandedClash] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  const filteredClashes = clashes.filter((clash) => {
    if (filterStatus !== 'all' && clash.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && clash.severity !== filterSeverity) return false;
    return true;
  });

  const stats = {
    total: clashes.length,
    pending: clashes.filter(c => c.status === 'pending').length,
    critical: clashes.filter(c => c.severity === 'critical').length,
    resolved: clashes.filter(c => c.status === 'resolved').length,
  };

  const handleStatusChange = async (clashId: string, status: ClashStatus) => {
    setChangingId(clashId);
    try {
      await onStatusChange(clashId, status);
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0c10]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Detección de Colisiones
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {stats.total} conflictos encontrados
              </p>
            </div>
          </div>
          
          <button
            onClick={onRunDetection}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-medium transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                {progress}%
              </>
            ) : (
              <>
                <Zap size={12} />
                Detectar
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Pendientes</p>
            <p className="text-lg font-bold text-amber-500">{stats.pending}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Críticos</p>
            <p className="text-lg font-bold text-red-500">{stats.critical}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Resueltos</p>
            <p className="text-lg font-bold text-emerald-500">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
        <Filter size={12} className="text-slate-400" />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ClashStatus | 'all')}
          className="text-[10px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="accepted">Aceptado</option>
          <option value="resolved">Resuelto</option>
          <option value="ignored">Ignorado</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as ClashSeverity | 'all')}
          className="text-[10px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Todas las severidades</option>
          <option value="critical">Crítico</option>
          <option value="high">Alto</option>
          <option value="medium">Medio</option>
          <option value="low">Bajo</option>
        </select>
      </div>

      {/* Clash List */}
      <div className="flex-1 overflow-y-auto">
        {filteredClashes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No hay conflictos
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Los conflictos detectados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredClashes.map((clash) => (
              <div
                key={clash.id}
                className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                  expandedClash === clash.id ? 'bg-slate-50 dark:bg-slate-800/30' : ''
                }`}
              >
                {/* Clash Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${SEVERITY_COLORS[clash.severity]}`}>
                        {SEVERITY_LABELS[clash.severity]}
                      </span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[clash.status]}`}>
                        {STATUS_LABELS[clash.status]}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {TYPE_LABELS[clash.clash_type]}
                      </span>
                    </div>
                    
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {clash.element_a_name || 'Elemento A'} ↔ {clash.element_b_name || 'Elemento B'}
                    </p>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {clash.element_a_guid.substring(0, 15)}... ↔ {clash.element_b_guid.substring(0, 15)}...
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedClash(expandedClash === clash.id ? null : clash.id)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                    >
                      {expandedClash === clash.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => onClashSelect(clash)}
                      className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-500"
                      title="Ver en visor 3D"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedClash === clash.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Elemento A</p>
                        <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate">
                          {clash.element_a_guid}
                        </p>
                      </div>
                      <div className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Elemento B</p>
                        <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate">
                          {clash.element_b_guid}
                        </p>
                      </div>
                    </div>

                    {clash.intersection_volume && (
                      <p className="text-[10px] text-slate-500 mb-3">
                        Volumen de intersección: <span className="font-mono font-medium">{clash.intersection_volume.toFixed(4)} m³</span>
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {clash.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(clash.id, 'accepted')}
                          disabled={changingId === clash.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          {changingId === clash.id ? <Loader2 size={10} className="animate-spin" /> : null}
                          Aceptar
                        </button>
                      )}
                      
                      {clash.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatusChange(clash.id, 'resolved')}
                          disabled={changingId === clash.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {changingId === clash.id ? <Loader2 size={10} className="animate-spin" /> : null}
                          Resolver
                        </button>
                      )}

                      {clash.status !== 'ignored' && (
                        <button
                          onClick={() => handleStatusChange(clash.id, 'ignored')}
                          disabled={changingId === clash.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 disabled:opacity-50"
                        >
                          {changingId === clash.id ? <Loader2 size={10} className="animate-spin" /> : null}
                          Ignorar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
