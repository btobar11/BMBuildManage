import type { Budget, FinancialSummary } from '../types';
import { formatCLP } from '../helpers';
import { Building2, User, Tag, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  budget: Budget;
  financials: FinancialSummary;
  onUpdate: (patch: Partial<Pick<Budget, 'projectName' | 'clientName' | 'clientPrice' | 'status'>>) => void;
}

const STATUS_OPTIONS: { value: Budget['status']; label: string; color: string }[] = [
  { value: 'draft', label: 'Borrador', color: 'text-gray-400' },
  { value: 'editing', label: 'En edición', color: 'text-blue-400' },
  { value: 'sent', label: 'Enviado', color: 'text-amber-400' },
  { value: 'approved', label: 'Aprobado', color: 'text-emerald-400' },
];

export function ProjectHeader({ budget, financials, onUpdate }: Props) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(budget.clientPrice));
  const [statusOpen, setStatusOpen] = useState(false);
  const statusOption = STATUS_OPTIONS.find((s) => s.value === budget.status)!;

  const commitPrice = () => {
    const val = parseFloat(priceInput.replace(/\D/g, '')) || 0;
    onUpdate({ clientPrice: val });
    setEditingPrice(false);
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5 mb-5">
      <div className="flex flex-wrap items-start gap-4">
        {/* Project name */}
        <div className="flex-1 min-w-[200px]">
          <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Building2 size={11} /> Proyecto
          </label>
          <input
            value={budget.projectName}
            onChange={(e) => onUpdate({ projectName: e.target.value })}
            className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 outline-none transition-colors w-full pb-0.5"
            placeholder="Nombre del proyecto"
          />
        </div>

        {/* Client */}
        <div className="flex-1 min-w-[160px]">
          <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <User size={11} /> Cliente
          </label>
          <input
            value={budget.clientName}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="text-sm text-gray-200 bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 outline-none transition-colors w-full pb-0.5"
            placeholder="Nombre del cliente"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Tag size={11} /> Estado
          </label>
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${statusOption.color}`}
          >
            {statusOption.label}
            <ChevronDown size={12} />
          </button>
          {statusOpen && (
            <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden min-w-[140px]">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { onUpdate({ status: s.value }); setStatusOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/10 transition-colors ${s.color}`}
                >
                  {s.label}
                  {s.value === budget.status && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial row */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/8">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Precio Cliente</p>
          {editingPrice ? (
            <input
              value={priceInput}
              autoFocus
              onChange={(e) => setPriceInput(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
              className="text-xl font-black text-blue-400 bg-transparent border-b border-blue-500 outline-none tabular-nums"
            />
          ) : (
            <button
              onClick={() => { setEditingPrice(true); setPriceInput(String(budget.clientPrice)); }}
              className="text-xl font-black text-blue-400 hover:text-blue-300 transition-colors tabular-nums"
              title="Clic para editar"
            >
              {formatCLP(budget.clientPrice)}
            </button>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-0.5">Costo Estimado</p>
          <p className="text-xl font-black text-white tabular-nums">{formatCLP(financials.estimatedCost)}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-0.5">Margen</p>
          <p className={`text-xl font-black tabular-nums ${financials.margin >= 15 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCLP(financials.projectedProfit)} <span className="text-sm">({financials.margin}%)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
