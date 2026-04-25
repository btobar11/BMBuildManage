import { useState, useEffect } from 'react';
import { X, Loader2, User, Phone, Briefcase, DollarSign, Star, FileText } from 'lucide-react';
import api from '../../../lib/api';

interface Worker {
  id: string;
  name: string;
  role: string;
  daily_rate: number;
  phone: string;
  skills: string;
  notes: string;
  rating: number;
}

export const EditWorkerModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  worker 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  worker: Worker | null;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    daily_rate: '',
    phone: '',
    skills: '',
    notes: '',
    rating: 5,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name || '',
        role: worker.role || '',
        daily_rate: worker.daily_rate?.toString() || '',
        phone: worker.phone || '',
        skills: worker.skills || '',
        notes: worker.notes || '',
        rating: worker.rating || 5,
      });
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !formData.name) return;

    setLoading(true);
    try {
      await api.patch(`/workers/${worker.id}`, {
        ...formData,
        daily_rate: Number(formData.daily_rate) || 0,
        rating: Number(formData.rating) || 5,
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error al actualizar el trabajador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Editar Trabajador</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Rol / Especialidad</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Tarifa Diaria ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="number" 
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Calificación</label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <select 
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="5">Excellent (5.0)</option>
                  <option value="4">Good (4.0)</option>
                  <option value="3">Regular (3.0)</option>
                  <option value="2">Poor (2.0)</option>
                  <option value="1">Bad (1.0)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Aptitudes (separadas por coma)</label>
            <input 
              type="text" 
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Notas de Desempeño</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || !formData.name}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Actualizar Trabajador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
