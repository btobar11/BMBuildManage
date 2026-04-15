import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Search, Send, CheckCircle, XCircle, X } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';

interface Submittal {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  spec_section: string;
  due_date: string;
  submitted_date: string;
  reviewed_date: string;
  comments: string;
  created_at: string;
  submitted_by?: string;
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-600' },
  under_review: { label: 'En Revisión', color: 'bg-amber-100 text-amber-600' },
  approved: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-600' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-600' },
  revision_requested: { label: 'Revisión Solicitada', color: 'bg-orange-100 text-orange-600' },
};

const typeLabels = {
  shop_drawings: 'Planos de Taller',
  product_data: 'Datos de Producto',
  samples: 'Muestras',
  certificates: 'Certificados',
  manuals: 'Manuales',
  other: 'Otro',
};

const priorityConfig = {
  low: { label: 'Baja', color: 'text-slate-500' },
  medium: { label: 'Media', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500 font-bold' },
};

export function SubmittalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects', { params: { company_id: user?.company_id } }).then(r => r.data),
    enabled: !!user?.company_id,
  });

  const { data: submittals, isLoading } = useQuery({
    queryKey: ['submittals', selectedProject],
    queryFn: () => api.get('/submittals', { params: { project_id: selectedProject } }).then(r => r.data),
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Submittal>) => api.post('/submittals', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['submittals'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; data: Partial<Submittal> }) => api.patch(`/submittals/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/submittals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] }),
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'shop_drawings' as const,
    priority: 'medium' as const,
    spec_section: '',
    due_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      project_id: selectedProject,
      submitted_by: user?.email,
      status: 'draft',
    });
  };

  const filteredSubmittals = submittals?.filter((s: Submittal) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 pb-32">
      <PageHeader
        title="Entregables"
        icon={<FileText size={22} />}
        breadcrumbs={[{ label: 'Gestión de Proyecto' }, { label: 'Entregables', active: true }]}
      />

      <div className="mb-6">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
        >
          <option value="">Seleccionar proyecto...</option>
          {projects?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedProject ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar entregables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background"
              >
                <option value="all">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="submitted">Enviado</option>
                <option value="under_review">En Revisión</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="revision_requested">Revisión Solicitada</option>
              </select>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
              >
                <Plus size={18} />
                Nuevo Entregable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{submittals?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-amber-600">{submittals?.filter((s: Submittal) => s.status === 'under_review').length || 0}</p>
              <p className="text-sm text-muted-foreground">En Revisión</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-emerald-600">{submittals?.filter((s: Submittal) => s.status === 'approved').length || 0}</p>
              <p className="text-sm text-muted-foreground">Aprobados</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600">{submittals?.filter((s: Submittal) => s.status === 'rejected').length || 0}</p>
              <p className="text-sm text-muted-foreground">Rechazados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filteredSubmittals?.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay entregables registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmittals?.map((sub: Submittal) => {
                const status = statusConfig[sub.status as keyof typeof statusConfig];
                const priority = priorityConfig[sub.priority as keyof typeof priorityConfig];

                return (
                  <div key={sub.id} className="bg-card border border-border rounded-lg p-4 hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className={`text-xs ${priority.color}`}>
                            {priority.label}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {typeLabels[sub.type as keyof typeof typeLabels] || sub.type}
                          </span>
                          {sub.spec_section && (
                            <span className="text-xs text-muted-foreground">
                              Sec: {sub.spec_section}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{sub.title}</h3>
                        {sub.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{sub.description}</p>
                        )}
                        {sub.comments && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Comentarios:</p>
                            <p className="text-sm text-foreground mt-1">{sub.comments}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Creado: {new Date(sub.created_at).toLocaleDateString()}</span>
                          {sub.due_date && <span>Vence: {new Date(sub.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {sub.status === 'draft' && (
                          <button onClick={() => updateMutation.mutate({ id: sub.id, data: { status: 'submitted', submitted_date: new Date().toISOString() } })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Enviar">
                            <Send size={16} />
                          </button>
                        )}
                        {sub.status === 'submitted' && (
                          <button onClick={() => updateMutation.mutate({ id: sub.id, data: { status: 'approved', reviewed_date: new Date().toISOString() } })} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Aprobar">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {sub.status === 'submitted' && (
                          <button onClick={() => updateMutation.mutate({ id: sub.id, data: { status: 'rejected', reviewed_date: new Date().toISOString() } })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Rechazar">
                            <XCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteMutation.mutate(sub.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Selecciona un proyecto para ver sus entregables</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Crear Nuevo Entregable</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Título</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" placeholder="Título del entregable" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" placeholder="Descripción detallada..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                    <option value="shop_drawings">Planos de Taller</option>
                    <option value="product_data">Datos de Producto</option>
                    <option value="samples">Muestras</option>
                    <option value="certificates">Certificados</option>
                    <option value="manuals">Manuales</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Prioridad</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Sección EETT</label>
                  <input type="text" value={formData.spec_section} onChange={(e) => setFormData({ ...formData, spec_section: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" placeholder="ej: 09 29 00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fecha de Vencimiento</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {createMutation.isPending ? 'Creando...' : 'Crear Entregable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}