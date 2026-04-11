import React, { useState } from 'react';
import type { Worker } from '../types';
import { formatCLP } from '../helpers';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

interface Props {
  projectId: string;
}

export function WorkersTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Worker, 'id' | 'totalPaid'>>({
    name: '',
    specialty: '',
    dailyRate: 0,
    daysWorked: 0,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['worker-assignments', projectId],
    queryFn: async () => {
      const response = await api.get('/worker-assignments', {
        params: { project_id: projectId }
      });
      return response.data;
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async (workerData: Omit<Worker, 'id' | 'totalPaid'>) => {
      // 1. Create Worker
      const wRes = await api.post('/workers', {
        name: workerData.name,
        role: workerData.specialty,
        daily_rate: workerData.dailyRate,
      });
      const worker = wRes.data;

      // 2. Assign to Project
      const totalPaid = workerData.dailyRate * workerData.daysWorked;
      const aRes = await api.post('/worker-assignments', {
        worker_id: worker.id,
        project_id: projectId,
        daily_rate: workerData.dailyRate,
        total_paid: totalPaid,
        start_date: new Date().toISOString().split('T')[0],
      });
      return aRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['workers-summary', projectId] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setForm({ name: '', specialty: '', dailyRate: 0, daysWorked: 0 });
      setOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/worker-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['workers-summary', projectId] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form);
  };

  const total = assignments.reduce((s: number, a: any) => s + Number(a.total_paid), 0);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando trabajadores...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-bold">Trabajadores</h3>
          <p className="text-muted-foreground text-sm">Total pagado: <span className="text-white font-bold">{formatCLP(total)}</span></p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> Añadir trabajador
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form onSubmit={submit} className="relative bg-card border border-border/50 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4">
            <h3 className="text-foreground font-bold text-lg">Nuevo Trabajador</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Especialidad</label>
                <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Gasfiter, Electricista…"
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Jornal diario ($)</label>
                <input type="number" min={0} value={form.dailyRate || ''} onChange={(e) => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Días trabajados</label>
                <input type="number" min={0} value={form.daysWorked || ''} onChange={(e) => setForm({ ...form, daysWorked: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="bg-muted/60 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Total a pagar</p>
              <p className="text-foreground font-black text-xl">{formatCLP(form.dailyRate * form.daysWorked)}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border/50 text-muted-foreground text-sm hover:bg-muted transition-colors" disabled={addMutation.isPending}>Cancelar</button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors" disabled={addMutation.isPending}>{addMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p className="text-4xl mb-3">👷</p><p>Sin trabajadores registrados</p></div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a: any) => {
            const daysCalc = Number(a.daily_rate) > 0 ? Number(a.total_paid)/Number(a.daily_rate) : 0;
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border group">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300 shrink-0">
                  {a.worker?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{a.worker?.name}</p>
                  <p className="text-muted-foreground text-xs">{a.worker?.role} · {daysCalc.toFixed(1)} días × {formatCLP(Number(a.daily_rate))}</p>
                </div>
                <span className="text-foreground font-bold tabular-nums">{formatCLP(Number(a.total_paid))}</span>
                <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(a.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
