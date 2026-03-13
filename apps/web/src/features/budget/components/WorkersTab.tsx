import React, { useState } from 'react';
import type { Worker } from '../types';
import { formatCLP } from '../helpers';
import { nanoid } from '../utils';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  workers: Worker[];
  onAdd: (w: Omit<Worker, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function WorkersTab({ workers, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Worker, 'id' | 'totalPaid'>>({
    name: '',
    specialty: '',
    dailyRate: 0,
    daysWorked: 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, totalPaid: form.dailyRate * form.daysWorked });
    setForm({ name: '', specialty: '', dailyRate: 0, daysWorked: 0 });
    setOpen(false);
  };

  const total = workers.reduce((s, w) => s + w.totalPaid, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Trabajadores</h3>
          <p className="text-gray-400 text-sm">Total pagado: <span className="text-white font-bold">{formatCLP(total)}</span></p>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form onSubmit={submit} className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4">
            <h3 className="text-white font-bold text-lg">Nuevo Trabajador</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Especialidad</label>
                <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Gasfiter, Electricista…"
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Jornal diario ($)</label>
                <input type="number" min={0} value={form.dailyRate || ''} onChange={(e) => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Días trabajados</label>
                <input type="number" min={0} value={form.daysWorked || ''} onChange={(e) => setForm({ ...form, daysWorked: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Total a pagar</p>
              <p className="text-white font-black text-xl">{formatCLP(form.dailyRate * form.daysWorked)}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="text-center py-16 text-gray-600"><p className="text-4xl mb-3">👷</p><p>Sin trabajadores registrados</p></div>
      ) : (
        <div className="space-y-2">
          {workers.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-white/5 group">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300 shrink-0">
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{w.name}</p>
                <p className="text-gray-500 text-xs">{w.specialty} · {w.daysWorked} días × {formatCLP(w.dailyRate)}</p>
              </div>
              <span className="text-white font-bold tabular-nums">{formatCLP(w.totalPaid)}</span>
              <button onClick={() => onDelete(w.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
