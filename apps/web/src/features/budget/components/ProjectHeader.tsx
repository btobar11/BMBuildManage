import type { Budget, FinancialSummary } from '../types';
import { formatCLP } from '../helpers';
import { Building2, User, Tag, ChevronDown, Check, AlertTriangle, TrendingUp, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useUFValue } from '../../../hooks/useUFValue';
import { ExportActionMenu } from '../report/BudgetPDFDocument';

interface Props {
  budget: Budget;
  financials: FinancialSummary;
  onUpdate: (patch: Partial<Pick<Budget, 'projectName' | 'clientName' | 'clientPrice' | 'status' | 'professionalFeePercentage' | 'estimatedUtility' | 'markupPercentage' | 'targetMargin' | 'location' | 'start_date' | 'end_date'>>) => void;
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

  const { data: ufValue } = useUFValue();

  const isAutoCalculated = !budget.clientPrice || budget.clientPrice === financials.autoCalculatedPrice;

  const commitPrice = () => {
    const val = parseFloat(priceInput.replace(/\D/g, '')) || 0;
    onUpdate({ clientPrice: val });
    setEditingPrice(false);
  };

  const companyInitials = company?.name?.substring(0, 2).toUpperCase() || 'BM';

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 mb-6 relative overflow-hidden shadow-lg shadow-black/5">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary-500/10 via-primary-500/5 to-transparent rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      
      {/* 1. Header: Company & Status */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/20 shadow-md bg-white flex items-center justify-center shrink-0">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain p-2 mix-blend-multiply" />
            ) : (
              <span className="text-xl font-black text-slate-800">{companyInitials}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">{company?.name || 'Constructora'}</h2>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Calculator size={14} className="text-primary-500" /> Presupuesto de Proyecto
            </p>
          </div>
        </div>

        {/* Action Menu & Status Badge */}
        <div className="flex items-center gap-3 mt-1 md:mt-0 relative">
          <ExportActionMenu budget={budget} financials={financials} />

          <div className="relative">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg border transition-all ${
              statusOption.value === 'draft' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' :
              statusOption.value === 'editing' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10' :
              statusOption.value === 'approved' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' :
              'text-foreground border-border bg-background/50 hover:bg-background'
            }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${statusOption.value === 'draft' ? 'bg-amber-500' : statusOption.value === 'editing' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              {statusOption.label}
              <ChevronDown size={12} className="opacity-50 ml-1" />
            </button>
            
            {statusOpen && (
              <div className="absolute top-full mt-1 right-0 w-40 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onUpdate({ status: s.value }); setStatusOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors ${s.color}`}
                  >
                    {s.label}
                    {s.value === budget.status && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. General Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="group bg-background/30 hover:bg-background/60 border border-border/50 rounded-xl p-3.5 transition-all">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Building2 size={12} className="text-primary-400" /> Proyecto
          </label>
          <input
            value={budget.projectName}
            onChange={(e) => onUpdate({ projectName: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Nombre del proyecto"
          />
        </div>

        <div className="group bg-background/30 hover:bg-background/60 border border-border/50 rounded-xl p-3.5 transition-all">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <User size={12} className="text-primary-400" /> Cliente
          </label>
          <input
            value={budget.clientName}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Nombre del cliente"
          />
        </div>

        <div className="group bg-background/30 hover:bg-background/60 border border-border/50 rounded-xl p-3.5 transition-all">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Tag size={12} className="text-primary-400" /> Ubicación
          </label>
          <input
            value={budget.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Dirección del proyecto"
          />
        </div>

        <div className="border border-border/50 rounded-xl p-0 transition-all flex overflow-hidden">
          <div className="flex-1 bg-background/30 hover:bg-background/60 p-3.5 border-r border-border/50 transition-colors">
             <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Inicio</label>
             <input type="date" value={budget.start_date || ''} onChange={(e) => onUpdate({ start_date: e.target.value })} className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark] pointer-events-auto" />
          </div>
          <div className="flex-1 bg-background/30 hover:bg-background/60 p-3.5 transition-colors">
             <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Término</label>
             <input type="date" value={budget.end_date || ''} onChange={(e) => onUpdate({ end_date: e.target.value })} className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark] pointer-events-auto" />
          </div>
        </div>
      </div>

      {/* 3. Financial Dashboard */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 dark:from-black/20 dark:to-black/40 rounded-2xl p-5 border border-slate-800/50 dark:border-white/5 flex flex-col xl:flex-row justify-between gap-6 shadow-inner">
        
        {/* Core Metrics */}
        <div className="flex flex-wrap md:flex-nowrap gap-6 md:gap-10">
          <div>
            <p className="text-[11px] text-slate-400 mb-1 uppercase tracking-wider font-bold flex items-center gap-1.5">
              Venta (Neto)
              {isAutoCalculated && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm">AUTO</span>}
            </p>
            {editingPrice ? (
              <input
                value={priceInput}
                autoFocus
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
                className="text-2xl font-black text-indigo-400 bg-transparent border-b border-indigo-500/50 outline-none tabular-nums w-40"
              />
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => { setEditingPrice(true); setPriceInput(String(budget.clientPrice)); }}
                  className="text-2xl font-black text-indigo-400 hover:text-indigo-300 transition-colors tabular-nums text-left"
                  title="Clic para editar precio al cliente"
                >
                  {budget.currency === 'UF' ? `${Number(budget.clientPrice).toLocaleString('es-CL', { minimumFractionDigits: 2 })} UF` : formatCLP(budget.clientPrice)}
                </button>
                {budget.currency === 'UF' && ufValue && (
                  <span className="text-xs text-indigo-400/80 font-medium">
                    ≈ {formatCLP(budget.clientPrice * ufValue)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] text-slate-400 mb-1 uppercase tracking-wider font-bold">Costo Obra</p>
            <p className="text-2xl font-black text-slate-200 tabular-nums">{formatCLP(financials.estimatedCost)}</p>
          </div>

          <div className={`px-4 py-2 -my-2 -ml-2 rounded-xl border flex flex-col justify-center transition-all ${
            financials.margin < (budget.professionalFeePercentage ?? 10) 
              ? 'bg-rose-500/10 border-rose-500/20' 
              : financials.margin < (budget.professionalFeePercentage ?? 10) + 5
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-[11px] uppercase tracking-wider font-bold ${
                financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-400' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-400' : 'text-emerald-500'
              }`}>Tu Utilidad</p>
              {financials.margin < (budget.professionalFeePercentage ?? 10) && <AlertTriangle size={12} className="text-rose-400 animate-pulse" />}
              {financials.margin >= (budget.professionalFeePercentage ?? 10) + 5 && <TrendingUp size={12} className="text-emerald-500" />}
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-black tabular-nums ${
                financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-400' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatCLP(financials.projectedProfit)}
              </p>
              <span className={`text-sm font-bold ${financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-500/70' : 'text-emerald-500/70'}`}>
                {financials.margin}%
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Parameters */}
        <div className="flex gap-4 xl:border-l xl:border-white/10 xl:pl-6">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Honorarios</p>
            <div className="flex items-center bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
              <input type="number" value={budget.professionalFeePercentage ?? 10} onChange={(e) => onUpdate({ professionalFeePercentage: Number(e.target.value) })} className="text-base font-black text-blue-400 bg-transparent w-10 outline-none text-right" />
              <span className="text-base font-black text-blue-400/50">%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Utilidad</p>
            <div className="flex items-center bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
              <input type="number" value={budget.estimatedUtility ?? 15} onChange={(e) => onUpdate({ estimatedUtility: Number(e.target.value) })} className="text-base font-black text-purple-400 bg-transparent w-10 outline-none text-right" />
              <span className="text-base font-black text-purple-400/50">%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Markup</p>
            <div className="flex items-center bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1">
              <input type="number" value={budget.markupPercentage ?? 20} onChange={(e) => onUpdate({ markupPercentage: Number(e.target.value) })} className="text-base font-black text-orange-400 bg-transparent w-10 outline-none text-right" />
              <span className="text-base font-black text-orange-400/50">%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Margen</p>
            <div className="flex items-center bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2 py-1">
              <input type="number" value={budget.targetMargin ?? 25} onChange={(e) => onUpdate({ targetMargin: Number(e.target.value) })} className="text-base font-black text-cyan-400 bg-transparent w-10 outline-none text-right" />
              <span className="text-base font-black text-cyan-400/50">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
