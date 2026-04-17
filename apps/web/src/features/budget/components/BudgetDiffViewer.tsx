/**
 * BudgetDiffViewer - Visual 3D Budget Comparison
 * 
 * Muestra diferencias entre versiones del presupuesto directamente
 * en el modelo BIM, resaltando elementos que cambiaron de precio.
 */
import { useState, useMemo } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import type { BudgetDiffResult } from '../budgetDiff';

interface BudgetDiffViewerProps {
  diff: BudgetDiffResult;
  onHighlightElement?: (ifcId: string | null) => void;
}

export function BudgetDiffViewer({ diff, onHighlightElement }: BudgetDiffViewerProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all');

  const filteredItems = useMemo(() => {
    return diff.items.filter(item => 
      filter === 'all' || item.changeType === filter
    );
  }, [diff.items, filter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ArrowRightLeft size={16} />
            Comparación de Presupuesto
          </h3>
          <div className="flex gap-2">
            {(['all', 'increase', 'decrease'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  filter === f 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'increase' ? 'Aumentos' : 'Disminuciones'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Anterior</p>
            <p className="text-lg font-bold">{formatCurrency(diff.totalPrevious)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-lg font-bold">{formatCurrency(diff.totalCurrent)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Diferencia</p>
            <p className={`text-lg font-bold flex items-center justify-center gap-1 ${
              diff.totalDifference > 0 ? 'text-red-500' : diff.totalDifference < 0 ? 'text-emerald-500' : ''
            }`}>
              {diff.totalDifference > 0 ? <TrendingUp size={16} /> : diff.totalDifference < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
              {formatCurrency(diff.totalDifference)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-center">
          <span className={`text-sm font-semibold ${
            diff.percentageChange > 0 ? 'text-red-500' : diff.percentageChange < 0 ? 'text-emerald-500' : ''
          }`}>
            {formatPercentage(diff.percentageChange)} vs versión anterior
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">
            {filteredItems.length} partidas modificadas
          </p>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {filteredItems.map(item => (
            <div
              key={item.itemId}
              onClick={() => {
                setSelectedItem(item.itemId);
                if (item.ifcGlobalId && onHighlightElement) {
                  onHighlightElement(item.ifcGlobalId);
                }
              }}
              className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedItem === item.itemId ? 'bg-emerald-500/10' : ''
              } ${item.ifcGlobalId ? 'cursor-crosshair' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground">{item.stageName}</p>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground line-through">
                    {formatCurrency(item.previousValue)}
                  </span>
                  <span className={`font-semibold ${
                    item.changeType === 'increase' ? 'text-red-500' : 
                    item.changeType === 'decrease' ? 'text-emerald-500' : ''
                  }`}>
                    {formatCurrency(item.currentValue)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.changeType === 'increase' ? 'bg-red-500/10 text-red-500' : 
                    item.changeType === 'decrease' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted'
                  }`}>
                    {formatPercentage(item.percentageChange)}
                  </span>
                  {item.ifcGlobalId && (
                    <Eye size={14} className="text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Legend */}
      {diff.affectedElements.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="text-xs font-semibold mb-3">Leyenda del Visor 3D</h4>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/60" />
              <span>Aumento de costo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/60" />
              <span>Reducción de costo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500/30" />
              <span>Sin cambios</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}