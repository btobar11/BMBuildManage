/**
 * BimElementPanel — Linear-style right panel for BIM element inspection
 * 
 * Features:
 * - Clean, minimal design (Slate & Emerald theme)
 * - Element properties and quantities
 * - State mutation control (4D progress)
 * - Offline sync indicator
 */
import { useState, useEffect } from 'react';
import { 
  X, 
  Box, 
  Layers, 
  Ruler, 
  Hash,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  ChevronDown,
  Cloud,
  CloudOff,
  Link2,
  Building2,
} from 'lucide-react';
import type { 
  BimSelectedElement, 
  BimElementState, 
  ElementStatus,
} from '../types-bim5d';
import { STATUS_COLORS as COLORS } from '../types-bim5d';

interface BimElementPanelProps {
  element: BimSelectedElement;
  elementState?: BimElementState | null;
  onClose: () => void;
  onStateChange: (status: ElementStatus, progress: number) => Promise<void>;
  onLinkToItem: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSync: boolean;
}

const STATUS_OPTIONS: { value: ElementStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'no_iniciado', label: 'No Iniciado', icon: <Circle size={14} />, color: COLORS.no_iniciado },
  { value: 'en_progreso', label: 'En Progreso', icon: <Clock size={14} />, color: COLORS.en_progreso },
  { value: 'ejecutado', label: 'Ejecutado', icon: <CheckCircle2 size={14} />, color: COLORS.ejecutado },
  { value: 'verificado', label: 'Verificado', icon: <CheckCircle2 size={14} />, color: COLORS.verificado },
];

function formatQuantity(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('es-CL', { maximumFractionDigits: 3, minimumFractionDigits: 2 })} ${unit}`;
}

function getCategoryIcon(category: string): React.ReactNode {
  const icons: Record<string, string> = {
    IfcWall: 'M3 12h18M3 12l4-4m-4 4l4 4',
    IfcSlab: 'M4 6h16M4 6v12h16V6',
    IfcColumn: 'M12 4v16M8 4h8',
    IfcBeam: 'M4 8h16M4 8l4 4m-4 4l4-4',
    IfcDoor: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4',
    IfcWindow: 'M4 4h16v16H4zM4 12h16M12 4v16',
  };
  const path = icons[category] || icons.IfcWall;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function BimElementPanel({
  element,
  elementState,
  onClose,
  onStateChange,
  onLinkToItem,
  isOnline,
  isSyncing,
  pendingSync,
}: BimElementPanelProps) {
  const [isChangingState, setIsChangingState] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [progress, setProgress] = useState(elementState?.progress_percent ?? 0);

  useEffect(() => {
    setProgress(elementState?.progress_percent ?? 0);
  }, [elementState?.progress_percent]);

  const handleStatusChange = async (newStatus: ElementStatus) => {
    setShowStatusDropdown(false);
    setIsChangingState(true);
    
    const newProgress = newStatus === 'no_iniciado' ? 0 :
                        newStatus === 'en_progreso' ? 50 :
                        newStatus === 'ejecutado' ? 100 :
                        newStatus === 'verificado' ? 100 : 0;
    
    setProgress(newProgress);
    
    try {
      await onStateChange(newStatus, newProgress);
    } finally {
      setIsChangingState(false);
    }
  };

  const currentStatus = elementState?.status || 'no_iniciado';
  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  const quantityRows = [
    { key: 'netVolume', label: 'Volumen Neto', value: element.quantities.netVolume, unit: 'm³', icon: <Box size={14} /> },
    { key: 'netArea', label: 'Área Neta', value: element.quantities.netArea, unit: 'm²', icon: <Layers size={14} /> },
    { key: 'length', label: 'Longitud', value: element.quantities.length, unit: 'ml', icon: <Ruler size={14} /> },
  ].filter(row => row.value !== null);

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] bg-white dark:bg-[#0a0c10] border-l border-slate-200 dark:border-slate-800 z-30 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            {getCategoryIcon(element.category)}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {element.category.replace('Ifc', '')}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Elemento BIM
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Element Info */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1 leading-tight">
            {element.name}
          </h3>
          {element.objectType && element.objectType !== element.name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {element.objectType}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <Hash size={10} />
            <span className="truncate">{element.globalId}</span>
          </div>
        </div>

        {/* State Control (4D Progress) */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estado de Avance
            </span>
            
            {/* Sync indicator */}
            <div className="flex items-center gap-1.5">
              {isSyncing ? (
                <Loader2 size={10} className="text-emerald-500 animate-spin" />
              ) : pendingSync ? (
                <CloudOff size={10} className="text-amber-500" />
              ) : (
                <Cloud size={10} className={isOnline ? 'text-emerald-500' : 'text-slate-400'} />
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {isSyncing ? 'Sincronizando...' : 
                 pendingSync ? 'Pendiente' : 
                 isOnline ? 'Sincronizado' : 'Sin conexión'}
              </span>
            </div>
          </div>

          {/* Status Selector */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={isChangingState}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${currentStatusOption.color}20`, color: currentStatusOption.color }}
                >
                  {currentStatusOption.icon}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {currentStatusOption.label}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown */}
            {showStatusDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isChangingState}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      currentStatus === option.value ? 'bg-slate-100 dark:bg-slate-800' : ''
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${option.color}20`, color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {option.label}
                    </span>
                    {currentStatus === option.value && (
                      <CheckCircle2 size={14} className="ml-auto text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Progreso
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: currentStatusOption.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Quantities */}
        {quantityRows.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Box size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cantidades IFC
              </span>
            </div>
            
            <div className="space-y-2">
              {quantityRows.map((row) => (
                <div 
                  key={row.key}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    {row.icon}
                    <span className="text-xs">{row.label}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                    {formatQuantity(row.value, row.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <button
            onClick={onLinkToItem}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          >
            <Link2 size={14} />
            <span className="text-xs font-medium">Vincular a Partida</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
          <Building2 size={10} />
          <span>ExpressID: {element.expressID}</span>
        </div>
      </div>
    </div>
  );
}
