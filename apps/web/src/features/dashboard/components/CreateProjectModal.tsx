import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '../../../lib/api';

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (budgetId: string) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    commune: '',
    type: ['residential'] as string[],
    estimated_price: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const projectTypes = [
    { value: 'residential', label: 'Residencial' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'infrastructure', label: 'Infraestructura' },
    { value: 'remodel', label: 'Remodelación' },
  ];

  const toggleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const projectPayload = {
        name: formData.name,
        address: formData.address || undefined,
        commune: formData.commune || undefined,
        type: formData.type || undefined,
        status: 'draft',
        estimated_price: formData.estimated_price ? Number(formData.estimated_price) : undefined,
        description: formData.description || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
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
    setFormData({ name: '', address: '', commune: '', type: ['residential'], estimated_price: '', description: '', start_date: '', end_date: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        alert('La fecha de término no puede ser anterior a la fecha de inicio');
        return;
      }
    }

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
              <label className="text-sm font-medium text-muted-foreground">Dirección de Obra</label>
              <input 
                required
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Calle Freire #123"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Comuna</label>
              <input 
                required
                type="text" 
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Santiago Centro"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Tipo de Obra</label>
            <div className="flex flex-wrap gap-2">
              {projectTypes.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => toggleType(pt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    formData.type.includes(pt.value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-background text-muted-foreground border-border hover:border-indigo-400'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio Estimada</label>
              <input 
                type="date" 
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Fecha de Término Estimada</label>
              <input 
                type="date" 
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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