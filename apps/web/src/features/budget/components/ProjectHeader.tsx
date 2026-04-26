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
          <label className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">
            <span className="flex items-center gap-1.5">
              <Building2 size={12} className="text-primary-400" /> Proyecto
            </span>
            { (budget.code || budget.project?.code) && (
              <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-500/20 lowercase tracking-normal">
                {budget.code || budget.project?.code}
              </span>
            )}
          </label>
          <input
            value={budget.projectName || budget.project?.name || ''}
            onChange={(e) => onUpdate({ projectName: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Nombre del proyecto"
          />
        </div>

        <div className="group bg-background/30 hover:bg-background/60 border border-border/50 rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">
            <User size={12} className="text-primary-400" /> Cliente
          </label>
          <input
            value={budget.clientName || budget.project?.client?.name || ''}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Nombre del cliente"
          />
        </div>

        <div className="group bg-background/30 hover:bg-background/60 border border-border/50 rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">
            <Tag size={12} className="text-primary-400" /> Ubicación
          </label>
          <input
            value={budget.location || budget.project?.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent w-full outline-none placeholder:text-muted-foreground/30"
            placeholder="Dirección del proyecto"
          />
        </div>

        <div className="border border-border/50 rounded-xl p-0 transition-all flex overflow-hidden shadow-sm hover:shadow-md">
          <div className="flex-1 bg-background/30 hover:bg-background/60 p-3.5 border-r border-border/50 transition-colors">
             <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Inicio</label>
             <input type="date" value={budget.start_date || ''} onChange={(e) => onUpdate({ start_date: e.target.value })} className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark] pointer-events-auto" />
          </div>
          <div className="flex-1 bg-background/30 hover:bg-background/60 p-3.5 transition-colors">
             <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Término</label>
             <input type="date" value={budget.end_date || ''} onChange={(e) => onUpdate({ end_date: e.target.value })} className="bg-transparent border-none outline-none text-sm w-full text-foreground [color-scheme:dark] pointer-events-auto" />
          </div>
        </div>
      </div>

      {/* 3. Financial Dashboard */}
      <div className="bg-slate-900/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 flex flex-col xl:flex-row justify-between gap-8 shadow-inner ring-1 ring-black/5">
        
        {/* Core Metrics */}
        <div className="flex flex-wrap md:flex-nowrap gap-8 md:gap-12">
          {/* Venta Section */}
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] font-black flex items-center gap-2">
              Venta (Neto)
              {isAutoCalculated && <span className="text-[9px] bg-primary-500/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/20">AUTO</span>}
            </p>
            {editingPrice ? (
              <div className="relative">
                <input
                  value={priceInput}
                  autoFocus
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={commitPrice}
                  onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
                  className="text-3xl font-black text-primary-600 dark:text-primary-400 bg-transparent border-b-2 border-primary-500 outline-none tabular-nums w-48 transition-all"
                />
              </div>
            ) : (
              <div className="flex flex-col group cursor-pointer" onClick={() => { setEditingPrice(true); setPriceInput(String(budget.clientPrice)); }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors tabular-nums">
                    {budget.currency === 'UF' 
                      ? `${Number(budget.clientPrice).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`
                      : formatCLP(budget.clientPrice).replace('$', '')
                    }
                  </span>
                  <span className="text-lg font-bold text-slate-400 dark:text-slate-600 uppercase">
                    {budget.currency}
                  </span>
                </div>
                {budget.currency === 'UF' && ufValue && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    ≈ {formatCLP(budget.clientPrice * ufValue)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Costo Section */}
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] font-black">Costo Obra</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {budget.currency === 'UF' && ufValue 
                  ? (financials.estimatedCost / ufValue).toLocaleString('es-CL', { minimumFractionDigits: 2 })
                  : formatCLP(financials.estimatedCost).replace('$', '')
                }
              </span>
              <span className="text-lg font-bold text-slate-400 dark:text-slate-600 uppercase">
                {budget.currency}
              </span>
            </div>
            {budget.currency === 'UF' && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Total: {formatCLP(financials.estimatedCost)}
              </span>
            )}
          </div>

          {/* Utilidad Section */}
          <div className={`px-5 py-3 rounded-2xl border flex flex-col justify-center transition-all shadow-sm ${
            financials.margin < (budget.professionalFeePercentage ?? 10) 
              ? 'bg-rose-500/5 border-rose-500/20' 
              : financials.margin < (budget.professionalFeePercentage ?? 10) + 5
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${
                financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-600' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-600' : 'text-emerald-600'
              }`}>Tu Utilidad</p>
              {financials.margin < (budget.professionalFeePercentage ?? 10) && <AlertTriangle size={12} className="text-rose-600 animate-pulse" />}
              {financials.margin >= (budget.professionalFeePercentage ?? 10) + 5 && <TrendingUp size={12} className="text-emerald-600" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tabular-nums ${
                financials.margin < (budget.professionalFeePercentage ?? 10) ? 'text-rose-600' : financials.margin < (budget.professionalFeePercentage ?? 10) + 5 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {budget.currency === 'UF' && ufValue
                  ? (financials.projectedProfit / ufValue).toLocaleString('es-CL', { minimumFractionDigits: 2 })
                  : formatCLP(financials.projectedProfit).replace('$', '')
                }
              </span>
              <span className="text-sm font-bold opacity-60 uppercase">{budget.currency}</span>
              <span className={`ml-2 text-sm font-black px-2 py-0.5 rounded-lg ${
                financials.margin < (budget.professionalFeePercentage ?? 10) ? 'bg-rose-500/20 text-rose-700' : 'bg-emerald-500/20 text-emerald-700'
              }`}>
                {financials.margin}%
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:border-l xl:border-slate-300/30 xl:pl-8">
          {[
            { label: 'Honorarios', value: budget.professionalFeePercentage ?? 10, key: 'professionalFeePercentage', color: 'blue' },
            { label: 'Utilidad', value: budget.estimatedUtility ?? 15, key: 'estimatedUtility', color: 'purple' },
            { label: 'Markup', value: budget.markupPercentage ?? 20, key: 'markupPercentage', color: 'orange' },
            { label: 'Margen', value: budget.targetMargin ?? 25, key: 'targetMargin', color: 'cyan' },
          ].map((param) => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 text-blue-600/40',
              purple: 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40 text-purple-600 dark:text-purple-400 text-purple-600/40',
              orange: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40 text-orange-600 dark:text-orange-400 text-orange-600/40',
              cyan: 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40 text-cyan-600 dark:text-cyan-400 text-cyan-600/40',
            };
            const classes = colorMap[param.color].split(' ');
            
            return (
              <div key={param.key} className="flex flex-col gap-1.5">
                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">{param.label}</p>
                <div className={`flex items-center rounded-xl px-3 py-2 transition-all border ${classes[0]} ${classes[1]} ${classes[2]}`}>
                  <input 
                    type="number" 
                    value={param.value} 
                    onChange={(e) => onUpdate({ [param.key]: Number(e.target.value) })} 
                    className={`text-lg font-black bg-transparent w-full outline-none text-right tabular-nums ${classes[3]} ${classes[4]}`} 
                  />
                  <span className={`text-sm font-bold ml-1 ${classes[5]}`}>%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
