import type { Budget, FinancialSummary } from '../types';
import { formatCLP } from '../helpers';
import { Building2, User, Tag, ChevronDown, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

interface Props {
  budget: Budget;
  financials: FinancialSummary;
  onUpdate: (patch: Partial<Pick<Budget, 'projectName' | 'clientName' | 'clientPrice' | 'status' | 'professionalFeePercentage' | 'location' | 'start_date' | 'end_date'>>) => void;
}

const STATUS_OPTIONS: { value: Budget['status']; label: string; color: string }[] = [
  { value: 'draft', label: 'Borrador', color: 'text-muted-foreground' },
  { value: 'editing', label: 'En edición', color: 'text-blue-400' },
  { value: 'sent', label: 'Enviado', color: 'text-amber-400' },
  { value: 'approved', label: 'Aprobado', color: 'text-emerald-400' },
  { value: 'rejected', label: 'Rechazado', color: 'text-rose-400' },
  { value: 'counter_offer', label: 'Contraoferta', color: 'text-amber-400' },
];

export function ProjectHeader({ budget, financials, onUpdate }: Props) {
  const { user } = useAuth();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(budget.clientPrice));
  const [statusOpen, setStatusOpen] = useState(false);
  const statusOption = STATUS_OPTIONS.find((s) => s.value === budget.status)!;

  const { data: company } = useQuery({
    queryKey: ['company', user?.company_id],
    queryFn: () => api.get(`/companies/${user?.company_id}`).then(res => res.data),
    enabled: !!user?.company_id,
  });

  const commitPrice = () => {
    const val = parseFloat(priceInput.replace(/\D/g, '')) || 0;
    onUpdate({ clientPrice: val });
    setEditingPrice(false);
  };

  const companyInitials = company?.name?.substring(0, 2).toUpperCase() || 'BM';

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 mb-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-border shadow-md bg-white dark:bg-white flex items-center justify-center shrink-0">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">{companyInitials}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">{company?.name || 'Constructora'}</h2>
            <p className="text-sm text-muted-foreground">Presupuesto de Proyecto</p>
          </div>
        </div>
        
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Project name */}
          <div className="bg-white/5 border border-border/50 rounded-lg p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Building2 size={12} /> Proyecto
            </label>
            <input
              value={budget.projectName}
              onChange={(e) => onUpdate({ projectName: e.target.value })}
              className="text-sm font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary-500 outline-none transition-colors w-full pb-0.5"
              placeholder="Nombre del proyecto"
            />
          </div>

          {/* Client */}
          <div className="bg-white/5 border border-border/50 rounded-lg p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <User size={12} /> Cliente
            </label>
            <input
              value={budget.clientName}
              onChange={(e) => onUpdate({ clientName: e.target.value })}
              className="text-sm font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary-500 outline-none transition-colors w-full pb-0.5"
              placeholder="Nombre del cliente"
            />
          </div>

          {/* Status */}
          <div className="bg-white/5 border border-border/50 rounded-lg p-3 relative">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Tag size={12} /> Estado
            </label>
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={`w-full flex items-center justify-between text-sm font-medium px-2 py-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors ${statusOption.color}`}
            >
              {statusOption.label}
              <ChevronDown size={14} />
            </button>
            {statusOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onUpdate({ status: s.value }); setStatusOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors ${s.color}`}
                  >
                    {s.label}
                    {s.value === budget.status && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location and Dates Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-border/30">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ubicación</label>
          <div className="flex items-center gap-2 bg-white/5 border border-border/40 rounded-xl px-3 py-2 focus-within:border-primary-500/50 transition-all">
            <Building2 size={14} className="text-muted-foreground" />
            <input
              value={budget.location || ''}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder="Dirección del proyecto..."
              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Fecha Inicio</label>
          <div className="flex items-center gap-2 bg-white/5 border border-border/40 rounded-xl px-3 py-2 focus-within:border-primary-500/50 transition-all">
            <input
              type="date"
              value={budget.start_date || ''}
              onChange={(e) => onUpdate({ start_date: e.target.value })}
              className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Fecha Término</label>
          <div className="flex items-center gap-2 bg-white/5 border border-border/40 rounded-xl px-3 py-2 focus-within:border-primary-500/50 transition-all">
            <input
              type="date"
              value={budget.end_date || ''}
              onChange={(e) => onUpdate({ end_date: e.target.value })}
              className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Financial row */}
      <div className="flex flex-wrap gap-8 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 lowercase font-semibold">Venta (Neto)</p>
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
          <p className="text-xs text-muted-foreground mb-0.5 lowercase font-semibold">Costo Obra</p>
          <p className="text-xl font-black text-foreground tabular-nums">{formatCLP(financials.estimatedCost)}</p>
        </div>

        <div className="border-l border-border pl-8">
          <p className="text-xs text-muted-foreground mb-0.5 lowercase font-semibold text-blue-400/80 italic">Meta Honorarios</p>
          <div className="flex items-center gap-1">
            <input
              id="professional-fee-meta"
              type="number"
              value={budget.professionalFeePercentage ?? 10}
              onChange={(e) => onUpdate({ professionalFeePercentage: Number(e.target.value) })}
              className="text-xl font-black text-blue-400/80 bg-transparent w-16 outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 transition-all"
              min="0"
              max="100"
            />
            <span className="text-xl font-black text-blue-400/80">%</span>
          </div>
        </div>

        <div id="financial-health-alert" className={`px-4 py-2 border rounded-xl transition-all duration-300 ${
          financials.margin < (budget.professionalFeePercentage ?? 10) 
            ? 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
            : financials.margin < (budget.professionalFeePercentage ?? 10) + 5
            ? 'bg-amber-500/15 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-xs lowercase font-semibold ${
              financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-400' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-400' : 'text-emerald-500'
            }`}>Tu Utilidad</p>
            {financials.margin < (budget.professionalFeePercentage ?? 10) && <AlertTriangle size={12} className="text-rose-400 animate-pulse" />}
            {financials.margin >= (budget.professionalFeePercentage ?? 10) + 5 && <TrendingUp size={12} className="text-emerald-500" />}
          </div>
          <p className={`text-xl font-black tabular-nums ${
            financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-400' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {formatCLP(financials.projectedProfit)} <span className="text-sm opacity-70 font-medium">({financials.margin}%)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
