import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import type { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { formatCLP } from '../helpers';
import { Plus, Trash2, Download, FileText, Link } from 'lucide-react';

interface Props {
  projectId: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  material: '🧱',
  transport: '🚛',
  tools: '🔧',
  contingency: '⚠️',
};

export function ExpensesTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    category: 'material',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    document_url: '',
    document_id: '',
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const res = await api.get(`/documents/project/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get(`/expenses?project_id=${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (newExpense: Omit<Expense, 'id'>) => {
      const payload = {
        ...newExpense,
        project_id: projectId,
        expense_type: newExpense.category // mapped according to backend entity
      };
      const res = await api.post('/expenses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', projectId] });
      setForm({ 
        category: 'material', 
        description: '', 
        amount: 0, 
        date: new Date().toISOString().split('T')[0], 
        document_url: '',
        document_id: ''
      });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', projectId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      const payload = {
        ...data,
        expense_type: data.category // mapping for backend
      };
      const res = await api.patch(`/expenses/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', projectId] });
      setOpen(false);
      setEditingId(null);
      setForm({ 
        category: 'material', 
        description: '', 
        amount: 0, 
        date: new Date().toISOString().split('T')[0], 
        document_url: '',
        document_id: ''
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.amount <= 0 || !projectId) return;
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      category: (expense.category || expense.expense_type) as any,
      description: expense.description || '',
      amount: Number(expense.amount),
      date: expense.date,
      document_url: expense.document_url || '',
      document_id: expense.document_id || '',
    });
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ 
      category: 'material', 
      description: '', 
      amount: 0, 
      date: new Date().toISOString().split('T')[0], 
      document_url: '',
      document_id: ''
    });
    setOpen(true);
  };

  const totalExpenses = expenses.reduce((s, e: Expense) => s + Number(e.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-bold">Gastos del Proyecto</h3>
          <p className="text-muted-foreground text-sm">Total: <span className="text-white font-bold">{formatCLP(totalExpenses)}</span></p>
        </div>
        <button
          onClick={handleOpenNew}
          disabled={!projectId}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> Registrar gasto
        </button>
      </div>

      {/* Form modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-card border border-border/50 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4"
          >
            <h3 className="text-foreground font-bold text-lg">
              {editingId ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })}
                className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{CATEGORY_ICONS[c.value]} {c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Cemento 20 sacos"
                required
                className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Monto ($)</label>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                  min={1}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Asociar Documento/Factura (Opcional)</label>
                <select
                  value={form.document_id || ''}
                  onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Ninguno</option>
                  {documents.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">O Link de Comprobante Externo (Opcional)</label>
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.document_url || ''}
                    onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                    placeholder="https://enlace-externo.com/..."
                    className="w-full bg-muted border border-border/50 rounded-xl pl-9 pr-3 py-2 text-foreground text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button disabled={createMutation.isPending || updateMutation.isPending} type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses list */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Cargando gastos...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📋</p>
          <p>Sin gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border group">
              <span className="text-2xl">{CATEGORY_ICONS[(e.category || e.expense_type) as string] || '📋'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm font-medium">{e.description}</p>
                  {e.document_url && (
                    <a 
                      href={e.document_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Download size={10} /> Link Externo
                    </a>
                  )}
                  {e.document?.url && (
                    <a 
                      href={e.document.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <FileText size={10} /> {e.document.name || 'Factura'}
                    </a>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{EXPENSE_CATEGORIES.find((c) => c.value === (e.category || e.expense_type))?.label || 'Gasto'} · {e.date}</p>
              </div>
              <span className="text-foreground font-bold tabular-nums">{formatCLP(e.amount)}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleEdit(e)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                >
                  <FileText size={13} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(e.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
