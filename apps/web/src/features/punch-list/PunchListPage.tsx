import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Search, X, Check, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';

interface PunchItem {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  due_date: string;
  created_at: string;
}

const statusConfig = {
  open: { label: 'Abierto', color: 'bg-red-100 text-red-600' },
  in_progress: { label: 'En Progreso', color: 'bg-amber-100 text-amber-600' },
  verified: { label: 'Verificado', color: 'bg-blue-100 text-blue-600' },
  closed: { label: 'Cerrado', color: 'bg-emerald-100 text-emerald-600' },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'text-slate-500' },
  medium: { label: 'Media', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-orange-500' },
  critical: { label: 'Crítica', color: 'text-red-600 font-bold' },
};

export function PunchListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects', { params: { company_id: user?.company_id } }).then(r => r.data), enabled: !!user?.company_id });
  const { data: items, isLoading } = useQuery({ queryKey: ['punch-items', selectedProject], queryFn: () => api.get('/punch-items', { params: { project_id: selectedProject } }).then(r => r.data), enabled: !!selectedProject });

  const createMutation = useMutation({ mutationFn: (data: any) => api.post('/punch-items', data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['punch-items'] }); setShowForm(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, ...data }: any) => api.patch(`/punch-items/${id}`, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['punch-items'] }) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/punch-items/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['punch-items'] }) });

  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', location: '', due_date: '' });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...formData, project_id: selectedProject, reported_by: user?.email }); };
  const filteredItems = items?.filter((i: PunchItem) => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 pb-32">
      <PageHeader title="Lista de Reparos" icon={<ClipboardCheck size={22} />} breadcrumbs={[{ label: 'Gestión de Proyecto' }, { label: 'Lista de Reparos', active: true }]} />
      <div className="mb-6">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
          <option value="">Seleccionar proyecto...</option>
          {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProject ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background" /></div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"><Plus size={18} />Nuevo Reparo</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4"><p className="text-2xl font-bold text-foreground">{items?.length || 0}</p><p className="text-sm text-muted-foreground">Total</p></div>
            <div className="bg-card border border-border rounded-lg p-4"><p className="text-2xl font-bold text-red-600">{items?.filter((i: PunchItem) => i.status === 'open').length || 0}</p><p className="text-sm text-muted-foreground">Abiertos</p></div>
            <div className="bg-card border border-border rounded-lg p-4"><p className="text-2xl font-bold text-amber-600">{items?.filter((i: PunchItem) => i.status === 'in_progress').length || 0}</p><p className="text-sm text-muted-foreground">En Progreso</p></div>
            <div className="bg-card border border-border rounded-lg p-4"><p className="text-2xl font-bold text-emerald-600">{items?.filter((i: PunchItem) => i.status === 'closed').length || 0}</p><p className="text-sm text-muted-foreground">Cerrados</p></div>
          </div>

          {isLoading ? <div className="text-center py-12 text-muted-foreground">Cargando...</div> : filteredItems?.length === 0 ? (
            <div className="text-center py-12"><ClipboardCheck size={48} className="mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No hay reparos registrados</p></div>
          ) : (
            <div className="space-y-3">
              {filteredItems?.map((item: PunchItem) => {
                const status = statusConfig[item.status as keyof typeof statusConfig];
                const priority = priorityConfig[item.priority as keyof typeof priorityConfig];
                return (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>{status.label}</span>
                          <span className={`text-xs ${priority.color}`}>{priority.label}</span>
                          {item.location && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.location}</span>}
                        </div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'open' && <button onClick={() => updateMutation.mutate({ id: item.id, status: 'in_progress' })} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Iniciar"><AlertTriangle size={16} /></button>}
                        {item.status === 'in_progress' && <button onClick={() => updateMutation.mutate({ id: item.id, status: 'verified' })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Verificar"><Check size={16} /></button>}
                        {item.status === 'verified' && <button onClick={() => updateMutation.mutate({ id: item.id, status: 'closed' })} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Cerrar"><Check size={16} /></button>}
                        <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : <div className="text-center py-12"><ClipboardCheck size={48} className="mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">Selecciona un proyecto</p></div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Nuevo Reparo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Título</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" /></div>
              <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Prioridad</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Ubicación</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Fecha Límite</label><input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted">Cancelar</button><button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">{createMutation.isPending ? 'Creando...' : 'Crear'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}