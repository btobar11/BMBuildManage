import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { formatCLP } from '../helpers';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Receipt,
  HardHat,
  AlertTriangle
} from 'lucide-react';

interface Props {
  projectId: string;
  totalClientPrice: number;
}

interface ProjectPayment {
  id: string;
  amount: number;
  date: string;
  description: string;
  payment_method: string;
}

export function CashflowTab({ projectId, totalClientPrice }: Props) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'transfer',
  });

  // Fetch Income (Payments from client)
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery<ProjectPayment[]>({
    queryKey: ['project-payments', projectId],
    queryFn: () => api.get(`/projects/${projectId}/payments`).then((r) => r.data),
    enabled: !!projectId,
  });

  // Fetch Expenses Summary
  const { data: summary } = useQuery({
    queryKey: ['project-financials-detailed', projectId],
    queryFn: () => api.get(`/budgets/project/${projectId}/summary`).then((r) => r.data),
    enabled: !!projectId,
  });

  const { mutate: addPayment, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => api.post(`/projects/${projectId}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments', projectId] });
      setShowAddForm(false);
      setNewPayment({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: 'transfer',
      });
    },
  });

  const { mutate: deletePayment } = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments', projectId] });
    },
  });

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = summary?.financials?.totalRealCost || 0;
  const netBalance = totalIncome - totalExpenses;
  const billingProgress = totalClientPrice > 0 ? (totalIncome / totalClientPrice) * 100 : 0;

  if (isLoadingPayments) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-emerald-500/80 uppercase tracking-wider">Ingresos Totales</span>
          </div>
          <p className="text-3xl font-black text-emerald-400 tabular-nums">{formatCLP(totalIncome)}</p>
          <div className="mt-3 flex items-center gap-2">
             <div className="flex-1 h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(billingProgress, 100)}%` }}
                ></div>
             </div>
             <span className="text-[10px] font-bold text-emerald-500/70">{billingProgress.toFixed(1)}% del Presupuesto</span>
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-rose-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-500">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-bold text-rose-500/80 uppercase tracking-wider">Gastos Totales</span>
          </div>
          <p className="text-3xl font-black text-rose-400 tabular-nums">{formatCLP(totalExpenses)}</p>
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400/70">
              <Receipt size={10} /> {formatCLP(summary?.financials?.realExpenses || 0)} Facturas
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400/70">
              <HardHat size={10} /> {formatCLP(summary?.financials?.workerPayments || 0)} Mano de obra
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-5 border relative overflow-hidden group transition-all ${
          netBalance >= 0 
            ? 'bg-blue-500/10 border-blue-500/20' 
            : 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
        }`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl group-hover:scale-110 transition-all duration-500 ${
            netBalance >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'
          }`}></div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${netBalance >= 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-500'}`}>
              <DollarSign size={20} />
            </div>
            <span className={`text-sm font-bold uppercase tracking-wider ${netBalance >= 0 ? 'text-blue-400/80' : 'text-amber-500/80'}`}>Flujo de Caja</span>
          </div>
          <p className={`text-3xl font-black tabular-nums ${netBalance >= 0 ? 'text-blue-400' : 'text-amber-500'}`}>{formatCLP(netBalance)}</p>
          <div className="mt-3 flex items-center gap-2">
            {netBalance >= 0 ? (
              <CheckCircle2 size={14} className="text-blue-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
            )}
            <span className={`text-[10px] font-bold ${netBalance >= 0 ? 'text-blue-400/70' : 'text-amber-500/70'}`}>
              {netBalance >= 0 ? 'Balance positivo' : 'Inversión mayor a ingresos'}
            </span>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-transparent to-primary-500/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">Registro de Pagos (Ingresos)</h3>
              <p className="text-xs text-muted-foreground font-medium">Control de estados de pago recibidos del cliente</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            Nuevo Ingreso
          </button>
        </div>

        {showAddForm && (
          <div className="p-6 bg-primary-500/5 border-b border-border animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="w-full bg-background border border-border rounded-xl px-7 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Fecha</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-10 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Descripción</label>
                <input
                  placeholder="Ej: Estado de pago #1"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => addPayment(newPayment)}
                  disabled={isAdding || newPayment.amount <= 0}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white h-[38px] rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  {isAdding ? 'Registrando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 bg-muted hover:bg-muted/80 text-muted-foreground h-[38px] rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertCircle size={32} className="opacity-20" />
                      <p className="text-sm font-medium">No hay ingresos registrados aún</p>
                      <button 
                        onClick={() => setShowAddForm(true)}
                        className="text-primary-500 hover:underline text-xs"
                      >
                        Registrar el primer pago
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-primary-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:border-primary-500/30 group-hover:text-primary-500 transition-all">
                           <Calendar size={14} />
                         </div>
                         <span className="text-sm font-medium text-foreground">{new Date(payment.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-foreground/80">{payment.description}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-emerald-400 font-black">{formatCLP(payment.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deletePayment(payment.id)}
                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot>
                <tr className="bg-muted/20">
                  <td colSpan={2} className="px-6 py-4 font-bold text-sm text-foreground">Total Recibido</td>
                  <td className="px-6 py-4 text-right text-emerald-400 text-lg font-black tabular-nums italic">{formatCLP(totalIncome)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Projection vs Reality Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card/40 border border-border rounded-3xl p-6">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Estado de Pagos vs Venta Total</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground font-medium">Avance de Facturación</span>
              <span className="font-bold tabular-nums">{billingProgress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${Math.min(billingProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recibido: {formatCLP(totalIncome)}</span>
              <span>Total Venta: {formatCLP(totalClientPrice)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card/40 border border-border rounded-3xl p-6">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Eficiencia Financiera</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground font-medium">Margen Real Actual</span>
              <span className="font-bold text-blue-400 tabular-nums">
                {totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                style={{ width: `${Math.max(0, Math.min(100, totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0))}%` }}
              ></div>
            </div>
             <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilidad: {formatCLP(netBalance)}</span>
              <span>Ingreso: {formatCLP(totalIncome)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
