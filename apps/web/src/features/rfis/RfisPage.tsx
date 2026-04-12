import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileQuestion, Plus, Search, Send, XCircle, X, CheckCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';

interface Rfi {
  id: string;
  project_id: string;
  title: string;
  question: string;
  answer: string;
  status: 'draft' | 'submitted' | 'under_review' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  answered_at: string;
  created_at: string;
  category: string;
  submitted_by: string;
  answered_by: string;
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileQuestion },
  submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-600', icon: Send },
  under_review: { label: 'En Revisión', color: 'bg-amber-100 text-amber-600', icon: Clock },
  answered: { label: 'Respondido', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-400', icon: XCircle },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'text-slate-500' },
  medium: { label: 'Media', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500 font-bold' },
};

const categories = ['Arquitectura', 'Estructura', 'MEP', 'Civil', 'Otro'];

export function RfisPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingRfi, setEditingRfi] = useState<Rfi | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects', { params: { company_id: user?.company_id } }).then(r => r.data),
    enabled: !!user?.company_id,
  });

  const { data: rfis, isLoading } = useQuery({
    queryKey: ['rfis', selectedProject],
    queryFn: () => api.get('/rfis', { params: { project_id: selectedProject } }).then(r => r.data),
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Rfi>) => api.post('/rfis', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rfis'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; data: Partial<Rfi> }) => api.patch(`/rfis/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rfis'] }); setEditingRfi(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rfis/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rfis'] }),
  });

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    priority: 'medium' as const,
    category: '',
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

  const filteredRfis = rfis?.filter((rfi: Rfi) => {
    const matchesSearch = rfi.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 pb-32">
      <PageHeader
        title="RFIs"
        icon={<FileQuestion size={22} />}
        breadcrumbs={[{ label: 'Gestión de Proyecto' }, { label: 'RFIs', active: true }]}
      />

      {/* Project Selector */}
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
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar RFIs..."
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
                <option value="answered">Respondido</option>
                <option value="closed">Cerrado</option>
              </select>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
              >
                <Plus size={18} />
                Nuevo RFI
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{rfis?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total RFIs</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{rfis?.filter((r: Rfi) => r.status === 'submitted' || r.status === 'under_review').length || 0}</p>
              <p className="text-sm text-muted-foreground">Abiertos</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-emerald-600">{rfis?.filter((r: Rfi) => r.status === 'answered').length || 0}</p>
              <p className="text-sm text-muted-foreground">Respondidos</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600">{rfis?.filter((r: Rfi) => r.due_date && new Date(r.due_date) < new Date() && r.status !== 'closed').length || 0}</p>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </div>
          </div>

          {/* RFIs List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filteredRfis?.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay RFIs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRfis?.map((rfi: Rfi) => {
                const status = statusConfig[rfi.status as keyof typeof statusConfig];
                const priority = priorityConfig[rfi.priority as keyof typeof priorityConfig];
                const isOverdue = rfi.due_date && new Date(rfi.due_date) < new Date() && rfi.status !== 'closed';

                return (
                  <div
                    key={rfi.id}
                    className={`bg-card border rounded-lg p-4 hover:border-emerald-500/50 transition-colors ${isOverdue ? 'border-red-300' : 'border-border'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className={`text-xs ${priority.color}`}>
                            {priority.label}
                          </span>
                          {rfi.category && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {rfi.category}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{rfi.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{rfi.question}</p>
                        {rfi.answer && (
                          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Respuesta:</p>
                            <p className="text-sm text-foreground mt-1">{rfi.answer}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Creado: {new Date(rfi.created_at).toLocaleDateString()}</span>
                          {rfi.due_date && (
                            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                              Vence: {new Date(rfi.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {rfi.status === 'draft' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: rfi.id, data: { status: 'submitted' } })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Enviar"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {rfi.status === 'submitted' && (
                          <button
                            onClick={() => setEditingRfi(rfi)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Responder"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(rfi.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
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
          <FileQuestion size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Selecciona un proyecto para ver sus RFIs</p>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Crear Nuevo RFI</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="Título del RFI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pregunta</label>
                <textarea
                  required
                  rows={4}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="Describe tu pregunta o solicitud..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {editingRfi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Responder RFI</h2>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">{editingRfi.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{editingRfi.question}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const answer = formData.get('answer') as string | null;
                updateMutation.mutate({
                  id: editingRfi.id,
                  data: {
                    answer: answer || undefined,
                    answered_by: user?.email,
                    status: 'answered',
                    answered_at: new Date().toISOString(),
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Respuesta</label>
                <textarea
                  name="answer"
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="Escribe tu respuesta..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingRfi(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Enviar Respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}