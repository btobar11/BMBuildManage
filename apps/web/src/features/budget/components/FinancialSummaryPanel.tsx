import type { FinancialSummary } from '../types';
import { formatCLP } from '../helpers';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  financials: FinancialSummary;
  clientPrice: number;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'blue' }) {
  const colors = {
    green: 'text-emerald-400',
    red: 'text-rose-400',
    blue: 'text-blue-400',
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${highlight ? colors[highlight] : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export function FinancialSummaryPanel({ financials, clientPrice }: Props) {
  const isOverBudget = financials.totalRealCost > financials.estimatedCost;
  const pctReal = financials.estimatedCost > 0
    ? Math.min(100, Math.round((financials.totalRealCost / financials.estimatedCost) * 100))
    : 0;

  return (
    <aside className="w-64 shrink-0 sticky top-4 self-start bg-gray-900 rounded-2xl p-5 shadow-2xl border border-white/10 flex flex-col gap-1">
      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
        <TrendingUp size={15} className="text-blue-400" />
        Resumen Financiero
      </h3>

      {/* Budget progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Costo real vs estimado</span>
          <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-gray-300'}>{pctReal}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${pctReal}%` }}
          />
        </div>
      </div>

      <Row label="Precio cliente" value={formatCLP(clientPrice)} highlight="blue" />
      <Row label="Costo estimado" value={formatCLP(financials.estimatedCost)} />
      <Row label="Gastos reales" value={formatCLP(financials.realExpenses)} />
      <Row label="Pagos trabajadores" value={formatCLP(financials.workerPayments)} />
      <Row
        label="Costo total real"
        value={formatCLP(financials.totalRealCost)}
        highlight={isOverBudget ? 'red' : undefined}
      />

      <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
        <Row
          label="Ganancia proyectada"
          value={formatCLP(financials.projectedProfit)}
          highlight={financials.projectedProfit >= 0 ? 'green' : 'red'}
        />
        <Row
          label="Ganancia actual"
          value={formatCLP(financials.currentProfit)}
          highlight={financials.currentProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Margin badge */}
      <div className={`mt-3 rounded-xl p-3 text-center ${financials.margin >= 15 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-rose-500/20 border border-rose-500/30'}`}>
        <p className="text-xs text-gray-400 mb-0.5">Margen</p>
        <p className={`text-2xl font-black ${financials.margin >= 15 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {financials.margin}%
        </p>
      </div>

      {isOverBudget && (
        <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">Los gastos reales superan el costo estimado.</p>
        </div>
      )}
    </aside>
  );
}
