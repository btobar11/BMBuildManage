/**
 * BimItemLinker — Modal to link a BIM element's quantity to a budget item
 * 
 * Shows all stages and items from the budget, allows the user to select
 * which partida to update with the extracted IFC quantity.
 * Validates unit compatibility and records audit log entries.
 */
import { useState, useMemo } from 'react';
import {
  X, Search, Link2, AlertTriangle, CheckCircle2, ArrowRight, Box,
  Columns3, Ruler, ChevronDown, ChevronRight, Layers, FileText
} from 'lucide-react';
import type { Stage, LineItem } from '../../budget/types';
import type { BimSelectedElement } from '../types';
import { getRecommendedQuantity, IFC_CATEGORY_UNITS } from '../types';
import toast from 'react-hot-toast';

interface BimItemLinkerProps {
  element: BimSelectedElement;
  stages: Stage[];
  onLink: (stageId: string, itemId: string, quantity: number, unit: string, element: BimSelectedElement) => void;
  onClose: () => void;
}

const UNIT_ICONS: Record<string, React.ReactNode> = {
  m3: <Box size={12} className="text-amber-400" />,
  m2: <Columns3 size={12} className="text-blue-400" />,
  ml: <Ruler size={12} className="text-emerald-400" />,
};

// Check if units are compatible for linking
function unitsCompatible(budgetUnit: string, bimUnit: string): boolean {
  // Exact match
  if (budgetUnit === bimUnit) return true;
  // Common aliases
  const aliases: Record<string, string[]> = {
    m2: ['m²', 'M2', 'metros cuadrados'],
    m3: ['m³', 'M3', 'metros cubicos'],
    ml: ['m', 'ML', 'metros lineales'],
  };
  for (const [canon, alts] of Object.entries(aliases)) {
    if ((budgetUnit === canon || alts.includes(budgetUnit)) &&
        (bimUnit === canon || alts.includes(bimUnit))) {
      return true;
    }
  }
  return false;
}

export function BimItemLinker({ element, stages, onLink, onClose }: BimItemLinkerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(stages.map(s => s.id)));
  const [confirmingItem, setConfirmingItem] = useState<{ stageId: string; item: LineItem } | null>(null);

  const recommended = getRecommendedQuantity(element);
  const categoryLabel = IFC_CATEGORY_UNITS[element.category]?.label || element.category.replace('Ifc', '');

  // Filter items by search
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return stages;
    const q = searchQuery.toLowerCase();
    return stages.map(stage => ({
      ...stage,
      items: stage.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        stage.name.toLowerCase().includes(q)
      ),
    })).filter(stage => stage.items.length > 0 || stage.name.toLowerCase().includes(q));
  }, [stages, searchQuery]);

  const toggleStage = (id: string) => {
    const next = new Set(expandedStages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedStages(next);
  };

  const handleConfirm = () => {
    if (!confirmingItem || recommended.value === null) return;

    onLink(
      confirmingItem.stageId,
      confirmingItem.item.id,
      recommended.value,
      recommended.unit,
      element,
    );

    toast.success(
      `Cubicación actualizada: ${recommended.value.toFixed(3)} ${recommended.unit}`,
      { icon: '🔗', duration: 4000 }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-indigo-600/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                <Link2 className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
                  Vincular a Partida
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categoryLabel}: <span className="font-bold text-foreground">{element.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-foreground/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Element summary bar */}
          <div className="mt-4 flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-4 py-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Valor a Vincular
              </span>
              <div className="flex items-center gap-2 mt-1">
                {UNIT_ICONS[recommended.unit] || <Box size={12} />}
                <span className="text-xl font-black text-foreground tabular-nums">
                  {recommended.value !== null
                    ? recommended.value.toLocaleString('es-CL', { maximumFractionDigits: 3 })
                    : '—'}
                </span>
                <span className="text-sm font-bold text-indigo-400">{recommended.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                GlobalId
              </span>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {element.globalId.substring(0, 22)}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar partida por nombre, unidad o etapa..."
              className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {filteredStages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron partidas</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {filteredStages.map((stage) => (
                <div key={stage.id} className="border border-border/50 rounded-xl overflow-hidden">
                  {/* Stage header */}
                  <button
                    onClick={() => toggleStage(stage.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  >
                    {expandedStages.has(stage.id) ? (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={14} className="text-muted-foreground" />
                    )}
                    <Layers size={13} className="text-blue-400" />
                    <span className="text-xs font-bold text-foreground flex-1">{stage.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {stage.items.length} partidas
                    </span>
                  </button>

                  {/* Items */}
                  {expandedStages.has(stage.id) && stage.items.length > 0 && (
                    <div className="border-t border-border/30">
                      {stage.items.map((item) => {
                        const isCompatible = unitsCompatible(item.unit, recommended.unit);
                        const isActive = confirmingItem?.item.id === item.id;
                        const hasExisting = item.ifc_global_id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfirmingItem({ stageId: stage.id, item })}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-border/20 last:border-b-0 ${
                              isActive
                                ? 'bg-indigo-500/10 border-indigo-500/20'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            {/* Compatibility indicator */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompatible
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}>
                              {isCompatible ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <AlertTriangle size={11} />
                              )}
                            </div>

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground truncate">
                                  {item.name || 'Partida sin nombre'}
                                </span>
                                {hasExisting && (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">
                                    BIM
                                  </span>
                                )}
                              </div>
                              {!isCompatible && (
                                <p className="text-[10px] text-amber-500/80 mt-0.5">
                                  Unidad diferente: {item.unit} ≠ {recommended.unit}
                                </p>
                              )}
                            </div>

                            {/* Current quantity & unit */}
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                                {item.quantity.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1">{item.unit}</span>
                            </div>

                            <ArrowRight size={12} className={`flex-shrink-0 transition-colors ${
                              isActive ? 'text-indigo-400' : 'text-muted-foreground/30'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation footer */}
        {confirmingItem && recommended.value !== null && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  Actualizar <span className="font-bold text-foreground">&quot;{confirmingItem.item.name || 'Partida'}&quot;</span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-muted-foreground line-through tabular-nums">
                    {confirmingItem.item.quantity.toLocaleString('es-CL', { maximumFractionDigits: 2 })} {confirmingItem.item.unit}
                  </span>
                  <ArrowRight size={10} className="text-muted-foreground" />
                  <span className="font-black text-indigo-500 tabular-nums">
                    {recommended.value.toLocaleString('es-CL', { maximumFractionDigits: 3 })} {recommended.unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingItem(null)}
                  className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                >
                  <Link2 size={13} />
                  Confirmar Vinculación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
