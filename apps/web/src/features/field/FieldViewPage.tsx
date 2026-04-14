import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { HardHat, Info, ArrowLeft, Save, AlertTriangle, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FieldLineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  quantity_executed?: number;
}

interface FieldStage {
  id: string;
  name: string;
  items: FieldLineItem[];
}

interface ServerBudget {
  id: string;
  project_id: string;
  total_estimated_price: number;
  project?: { name: string };
  stages?: FieldStage[];
}

export function FieldViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // "Avance Diario" typed by the user
  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>({});

  const { data: budget, isLoading, error } = useQuery<ServerBudget>({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { mutate: performSave, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!budget || !budget.stages) return;

      // We need to fetch the original budget to preserve other fields like unit_cost if the backend requires them.
      // But the backend patch supports partial updates for items! Actually, let's just patch the modified items' quantity_executed.
      const updatedStages = budget.stages.map(s => ({
        id: s.id,
        items: s.items.map(i => {
          const added = dailyProgress[i.id] || 0;
          return {
            id: i.id,
            // Backend takes quantity_executed as the total execution
            quantity_executed: Number(i.quantity_executed || 0) + added
          };
        })
      }));

      return api.patch(`/budgets/${id}`, { stages: updatedStages });
    },
    onSuccess: () => {
      toast.success('¡Avance diario registrado correctamente!');
      setDailyProgress({});
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
    },
    onError: () => {
      toast.error('Error al guardar los avances.');
    }
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !budget) return <div className="p-6 text-center text-red-500">Error cargando el proyecto</div>;

  const handleProgressChange = (itemId: string, val: string) => {
    const num = parseFloat(val);
    setDailyProgress(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleSave = () => {
    // Check for "sobcubos" (over-execution)
    let hasOverExecution = false;
    budget.stages?.forEach(stage => {
      stage.items.forEach(item => {
        const added = dailyProgress[item.id] || 0;
        const totalNow = Number(item.quantity_executed || 0) + added;
        if (totalNow > Number(item.quantity)) {
          hasOverExecution = true;
        }
      });
    });

    if (hasOverExecution) {
      if (!window.confirm('⚠️ ALERTA DE SOBRECUBO: Estás reportando un avance que supera la cantidad presupuestada inicial. Esto podría afectar el margen del proyecto. ¿Deseas continuar y registrarlo como sobrecubo?')) {
        return;
      }
    }

    const totalAdded = Object.values(dailyProgress).reduce((a, b) => a + b, 0);
    if (totalAdded <= 0) {
      toast('No hay avance nuevo que registrar.', { icon: <Info size={16} className="text-blue-500"/> });
      return;
    }

    performSave();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Mobile-first Header */}
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center border-b border-slate-200">
        <button onClick={() => navigate(`/budget/${id}`)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="ml-2 flex-1">
          <h1 className="text-lg font-bold truncate pr-4">{budget.project?.name || 'Cargando Proyecto...'}</h1>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1">
            <HardHat size={12} /> App Terreno
          </p>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6">
        
        {/* Helper Banner */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 text-sm">Registro Diario de Avance</h3>
            <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
              Ingresa la cantidad ejecutada **hoy** para cada partida. El sistema alertará si superas el límite del presupuesto original.
            </p>
          </div>
        </div>

        {/* Stages List */}
        <div className="space-y-4">
          {budget.stages?.map(stage => {
            const hasItems = stage.items && stage.items.length > 0;
            if (!hasItems) return null;
            
            return (
              <div key={stage.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold text-slate-800 text-sm">
                  {stage.name}
                </div>
                
                <div className="divide-y divide-slate-100">
                  {stage.items.map(item => {
                    const added = dailyProgress[item.id] || 0;
                    const previouslyExecuted = Number(item.quantity_executed || 0);
                    const budgeted = Number(item.quantity);
                    const newTotal = previouslyExecuted + added;
                    const isOverLimit = newTotal > budgeted && added > 0;
                    const isCompleted = previouslyExecuted >= budgeted && added === 0;

                    return (
                      <div key={item.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-sm font-semibold text-slate-700 leading-snug">{item.name}</h4>
                          {isCompleted && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                          {isOverLimit && <AlertTriangle size={18} className="text-red-500 shrink-0 animate-pulse" />}
                        </div>

                        <div className="flex items-end justify-between gap-3 mt-1">
                          
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acumulado / Meta</span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-sm font-bold ${isOverLimit ? 'text-red-600' : 'text-slate-700'}`}>
                                {newTotal}
                              </span>
                              <span className="text-xs text-slate-500">/ {budgeted} {item.unit}</span>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden flex">
                              <div 
                                className="h-full bg-slate-300 transition-all" 
                                style={{ width: `${Math.min(100, (previouslyExecuted / budgeted) * 100)}%` }}
                              />
                              {added > 0 && (
                                <div 
                                  className={`h-full transition-all ${isOverLimit ? 'bg-red-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(100, (added / budgeted) * 100)}%` }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 items-end w-28">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avance Hoy</label>
                            <div className="relative w-full">
                              <input 
                                type="number" 
                                min="0"
                                step="any"
                                value={dailyProgress[item.id] || ''}
                                onChange={(e) => handleProgressChange(item.id, e.target.value)}
                                className={`w-full text-right pr-7 pl-2 py-2 border-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 transition-all bg-slate-50 ${isOverLimit ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 text-red-700' : 'border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500/20 text-indigo-900'} ${isCompleted ? 'opacity-50' : ''}`}
                                placeholder="0"
                                disabled={isSaving}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{item.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Inline Alert for Over execution */}
                        {isOverLimit && (
                          <div className="mt-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            Sobrecubo detectado. Supera la partida base.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40">
        <button 
          onClick={handleSave}
          disabled={isSaving || Object.values(dailyProgress).every(v => !v)}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando...</>
          ) : (
            <><Save size={20} /> Firmar Avance Diario</>
          )}
        </button>
      </div>
    </div>
  );
}
