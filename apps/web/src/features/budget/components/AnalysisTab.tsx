import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  AlertTriangle,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import type { Stage } from '../types';

interface AnalysisTabProps {
  stages: Stage[];
  contingenciesTotal: number;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ stages, contingenciesTotal }) => {
  const analysis = useMemo(() => {
    let estimatedTotal = 0;
    let realTotal = 0;
    
    (stages || []).forEach(stage => {
      (stage.items || []).forEach(item => {
        const itemEstimated = (item.quantity || 0) * (item.unit_price || 0);
        const itemReal = (item.quantity_executed || 0) * (item.unit_price || 0); 
        estimatedTotal += itemEstimated;
        realTotal += itemReal;
      });
    });

    const variance = estimatedTotal - realTotal;
    const progressPercent = estimatedTotal > 0 ? (realTotal / estimatedTotal) * 100 : 0;

    const stageBreakdown = (stages || []).map(stage => {
      const stageEst = (stage.items || []).reduce((acc, i) => acc + ((i.quantity || 0) * (i.unit_price || 0)), 0);
      const stageReal = (stage.items || []).reduce((acc, i) => acc + (((i.quantity_executed || 0) * (i.unit_price || 0))), 0);
      const stageProgress = stageEst > 0 ? (stageReal / stageEst) * 100 : 0;
      return { ...stage, stageEst, stageReal, stageProgress };
    });

    return {
      estimatedTotal,
      realTotal,
      variance,
      progressPercent,
      contingenciesTotal,
      stageBreakdown,
      topItems: stages.flatMap(s => (s.items || []).map(i => ({ 
        name: i.name, 
        total: (i.quantity || 0) * (i.unit_price || 0), 
        stage: s.name 
      }))).sort((a, b) => b.total - a.total).slice(0, 5)
    };
  }, [stages, contingenciesTotal]);

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-muted/40 border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm font-medium">Presupuesto Estimado</p>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <Target size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{formatCLP(analysis.estimatedTotal)}</h3>
          <p className="text-xs text-muted-foreground mt-2">Costo base de obra estimado</p>
        </div>

        <div className="bg-muted/40 border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm font-medium">Ejecución Real</p>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400">{formatCLP(analysis.realTotal)}</h3>
          <div className="flex items-center gap-1 mt-2">
             <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, analysis.progressPercent)}%` }}
                />
             </div>
             <span className="text-[10px] font-bold text-emerald-500">{analysis.progressPercent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-muted/40 border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm font-medium">Variación de Obra</p>
            <div className={`p-2 rounded-xl ${analysis.variance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <BarChart3 size={18} />
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${analysis.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCLP(analysis.variance)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            {analysis.variance >= 0 ? (
              <span className="text-emerald-500 flex items-center gap-0.5"><TrendingUp size={12} /> Bajo presupuesto</span>
            ) : (
              <span className="text-rose-500 flex items-center gap-0.5"><TrendingDown size={12} /> Sobre presupuesto</span>
            )}
          </p>
        </div>

        <div className="bg-muted/40 border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm font-medium">Contingencias</p>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-amber-500">{formatCLP(analysis.contingenciesTotal)}</h3>
          <p className="text-xs text-muted-foreground mt-2">Costos imprevistos registrados</p>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Comparison */}
        <div className="lg:col-span-2 bg-muted/40 border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" /> Comparativa por Etapa
            </h4>
            <span className="text-xs text-muted-foreground italic">Desglose de ejecución</span>
          </div>
          <div className="p-6 space-y-6">
            {analysis.stageBreakdown.map(stage => (
              <div key={stage.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">{stage.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-xs">Est: {formatCLP(stage.stageEst)}</span>
                    <span className="font-bold text-foreground">{formatCLP(stage.stageReal)}</span>
                  </div>
                </div>
                <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute h-full bg-blue-500/20 w-full" />
                  <div 
                    className={`absolute h-full transition-all duration-1000 ${stage.stageReal > stage.stageEst ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, stage.stageProgress)}%` }}
                  />
                  {stage.stageProgress > 100 && (
                     <div className="absolute inset-y-0 right-0 bg-rose-600 animate-pulse w-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variations Advice */}
        <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-6">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <ArrowUpRight size={16} className="text-amber-400" /> Hallazgos Críticos
          </h4>
          
          <div className="space-y-4">
            {analysis.topItems.length > 0 && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs font-bold text-blue-400 uppercase mb-3">Ítems de Mayor Impacto</p>
                <div className="space-y-3">
                  {analysis.topItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-[10px]">{item.stage}</span>
                      </div>
                      <span className="font-bold">{formatCLP(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.variance < 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3">
                <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-bold text-rose-400">Desvío de Costos</p>
                  <p className="text-xs text-muted-foreground mt-1">Tu obra está {formatCLP(Math.abs(analysis.variance))} sobre lo presupuestado. Revisa los rendimientos.</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 tracking-wider">Costo Proyectado Final</p>
               <div className="space-y-2">
                 <div className="flex justify-between text-xs">
                   <span className="text-muted-foreground">Costo Base</span>
                   <span className="text-foreground">{formatCLP(analysis.estimatedTotal)}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                   <span className="text-muted-foreground">Contingencias</span>
                   <span className="text-amber-400">+{formatCLP(analysis.contingenciesTotal)}</span>
                 </div>
                 <div className="h-px bg-white/5 my-2" />
                 <div className="flex justify-between text-sm font-bold">
                   <span className="text-foreground">Total</span>
                   <span className="text-blue-400">{formatCLP(analysis.estimatedTotal + analysis.contingenciesTotal)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
