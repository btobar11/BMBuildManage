import React, { useState } from 'react';
import type { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { formatCLP } from '../helpers';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  expenses: Expense[];
  onAdd: (e: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  material: '🧱',
  transport: '🚛',
  tools: '🔧',
  contingency: '⚠️',
};

export function ExpensesTab({ expenses, onAdd, onDelete }: Props) {
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    category: 'material',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.amount <= 0) return;
    onAdd(form);
    setForm({ category: 'material', description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    setOpen(false);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Gastos del Proyecto</h3>
          <p className="text-gray-400 text-sm">Total: <span className="text-white font-bold">{formatCLP(totalExpenses)}</span></p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> Registrar gasto
        </button>
      </div>

      {/* Form modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4"
          >
            <h3 className="text-white font-bold text-lg">Nuevo Gasto</h3>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{CATEGORY_ICONS[c.value]} {c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Cemento 20 sacos"
                required
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Monto ($)</label>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                  min={1}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses list */}
      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📋</p>
          <p>Sin gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-white/5 group">
              <span className="text-2xl">{CATEGORY_ICONS[e.category]}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{e.description}</p>
                <p className="text-gray-500 text-xs">{EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label} · {e.date}</p>
              </div>
              <span className="text-white font-bold tabular-nums">{formatCLP(e.amount)}</span>
              <button
                onClick={() => onDelete(e.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
