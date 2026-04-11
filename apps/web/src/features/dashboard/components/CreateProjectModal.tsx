import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '../../../lib/api';
import { projectSchema, type ProjectInput } from '../../../lib/schemas';

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (budgetId: string) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'residential',
    estimated_price: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const projectPayload = {
        name: formData.name,
        location: formData.location || undefined,
        type: formData.type || undefined,
        status: 'draft',
        estimated_price: formData.estimated_price ? Number(formData.estimated_price) : undefined,
        description: formData.description || undefined,
      };

      const projectResponse = await api.post('/projects', projectPayload);
      const newProject = projectResponse.data;

      const budgetResponse = await api.post('/budgets', {
        project_id: newProject.id,
        version: 1,
        status: 'draft',
        total_estimated_price: projectPayload.estimated_price || 0,
        total_estimated_cost: 0,
      });

      return { project: newProject, budget: budgetResponse.data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      onSuccess(data.budget.id);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', location: '', type: 'residential', estimated_price: '', description: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    createProjectMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Nuevo Proyecto</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Nombre del Proyecto</label>
            <input 
              required
              autoFocus
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej. Remodelación Casa Central"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dirección, Comuna..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Tipo de Obra</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="industrial">Industrial</option>
                <option value="infrastructure">Infraestructura</option>
                <option value="remodel">Remodelación</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Presupuesto Estimado (Cliente)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input 
                type="number" 
                value={formData.estimated_price}
                onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dejar en blanco si no se sabe aún"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Descripción / Notas</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              placeholder="Detalles adicionales sobre la obra..."
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={createProjectMutation.isPending || !formData.name}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {createProjectMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Crear e ir al Presupuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
