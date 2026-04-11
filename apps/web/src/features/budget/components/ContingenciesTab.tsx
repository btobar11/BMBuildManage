import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface Contingency {
  id: string;
  project_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  date: string;
  notes?: string;
}

interface Props {
  projectId: string;
}

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

export function ContingenciesTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: '', quantity: 1, unit_cost: 0, notes: '' });

  const { data: contingencies = [], isLoading } = useQuery<Contingency[]>({
    queryKey: ['contingencies', projectId],
    queryFn: () => api.get(`/contingencies/by-project/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/contingencies', { ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingencies', projectId] });
      queryClient.invalidateQueries({ queryKey: ['contingencies-summary', projectId] });
      setForm({ description: '', quantity: 1, unit_cost: 0, notes: '' });
      setOpen(false);
    },
    onError: () => {
      alert('Error al registrar la contingencia. Por favor, intente de nuevo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contingencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingencies', projectId] });
      queryClient.invalidateQueries({ queryKey: ['contingencies-summary', projectId] });
    },
    onError: () => {
      alert('Error al eliminar la contingencia.');
    },
  });

  const total = contingencies.reduce((s, c) => s + Number(c.total_cost), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.unit_cost <= 0) return;
    createMutation.mutate(form);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-foreground font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Contingencias e Imprevistos
          </h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            Total: <span className="text-amber-400 font-bold">{formatCLP(total)}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> Registrar imprevisto
        </button>
      </div>

      {/* Form modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-card border border-border/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl z-10 space-y-4"
          >
            <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Nueva Contingencia
            </h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Ej: Refuerzo estructura no contemplado"
                className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Motivo / Justificación</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Explica qué pasó y por qué es necesario este gasto..."
                rows={3}
                className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cantidad</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 1 })}
                  min={1}
                  step={0.1}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Costo unitario ($)</label>
                <input
                  type="number"
                  value={form.unit_cost || ''}
                  onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })}
                  required
                  min={1}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Total contingencia</p>
              <p className="text-amber-400 font-black text-lg">
                {formatCLP(form.quantity * form.unit_cost)}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-foreground text-sm font-medium transition-colors"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : contingencies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">⚠️</p>
          <p>Sin contingencias registradas</p>
          <p className="text-sm mt-1 text-muted-foreground">Los imprevistos se suman al costo real sin modificar el presupuesto</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contingencies.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl group hover:border-amber-500/30 transition-all">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{c.description}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {Number(c.quantity)} × {formatCLP(Number(c.unit_cost))} · {new Date(c.date).toLocaleDateString('es-CL')}
                </p>
                {c.notes && (
                  <p className="text-xs text-amber-300/80 mt-1.5 italic leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                    <span className="font-bold not-italic text-amber-500/50 mr-1">Motivo:</span>
                    “{c.notes}”
                  </p>
                )}
              </div>
              <span className="text-amber-400 font-bold tabular-nums">{formatCLP(Number(c.total_cost))}</span>
              <button
                onClick={() => { if (confirm('¿Eliminar esta contingencia?')) deleteMutation.mutate(c.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-3 mt-4">
            <span className="text-amber-300 font-semibold text-sm">Total imprevistos</span>
            <span className="text-amber-400 font-black text-lg tabular-nums">{formatCLP(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
