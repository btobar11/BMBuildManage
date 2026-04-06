import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal, PromptModal } from '../../components/Modal';
import { 
  Plus, 
  Search,
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Trash2,
  FolderOpen,
  X,
  RefreshCcw,
  ChevronRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  estimated_budget: number;
  progress?: number;
  folder?: string;
  budgets?: { id: string }[];
}

const ProjectStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-violet-100 text-violet-700',
    approved: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-200 text-slate-700',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFolderPrompt, setShowFolderPrompt] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: { company_id: user?.company_id }
      });
      return response.data;
    },
    placeholderData: (previousData: Project[] | undefined) => previousData,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setShowDeleteConfirm(false);
    setIsProcessing(true);
    
    toast.promise(api.post('/projects/bulk-delete', { ids: selectedIds }), {
      loading: 'Eliminando...',
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setSelectedIds([]);
        return `${selectedIds.length} proyectos eliminados`;
      },
      error: (err) => err.response?.data?.message || 'Error al eliminar',
    }).finally(() => setIsProcessing(false));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Datos actualizados');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setIsRefreshing(false);
    }
  };

  const confirmBulkMove = async (folderName: string) => {
    setShowFolderPrompt(false);
    try {
      await api.patch('/projects/bulk-update-folder', { ids: selectedIds, folder: folderName });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedIds([]);
      toast.success(`Proyectos movidos a "${folderName}"`);
    } catch {
      toast.error('Error al mover proyectos');
    }
  };

  const filteredProjects = projects?.filter((p: Project) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.location?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const totalBudget = projects?.reduce((acc: number, p: Project) => acc + (p.estimated_budget || 0), 0) || 0;

  return (
    <>
      <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, <span className="font-medium text-emerald-600">{user?.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus size={18} />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <DollarSign size={20} className="text-emerald-500 mb-3" />
          <p className="text-2xl font-bold text-foreground data-mono">
            ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalBudget)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Valor Total</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <BarChart3 size={20} className="text-amber-500 mb-3" />
          <p className="text-2xl font-bold text-foreground">{projects?.filter(p => p.status === 'sent').length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <Clock size={20} className="text-emerald-500 mb-3" />
          <p className="text-2xl font-bold text-foreground">{projects?.filter(p => p.status === 'in_progress').length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">En Obra</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <CheckCircle2 size={20} className="text-slate-500 mb-3" />
          <p className="text-2xl font-bold text-foreground">{projects?.filter(p => p.status === 'completed').length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Completados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar proyectos..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && !projects ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border h-48 animate-pulse" />
          ))
        ) : filteredProjects?.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Sin proyectos</h3>
            <p className="text-sm text-muted-foreground mb-4">Crea tu primer proyecto para comenzar</p>
            <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
              <Plus size={16} /> Crear Proyecto
            </button>
          </div>
        ) : (
          filteredProjects?.map((project) => (
            <div 
              key={project.id}
              onClick={() => {
                if (selectedIds.length > 0) {
                  toggleSelect(project.id);
                } else {
                  const budgetId = project.budgets?.[0]?.id;
                  if (budgetId) {
                    navigate(`/budget/${budgetId}`);
                  } else {
                    toast.error('Este proyecto no tiene presupuesto asociado');
                  }
                }
              }}
              className={`bg-card rounded-xl border cursor-pointer transition-all hover-lift ${
                selectedIds.includes(project.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-border hover:border-emerald-300'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <ProjectStatusBadge status={project.status} />
                  <span className="text-lg font-bold text-emerald-600 data-mono">
                    ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(project.estimated_budget || 0)}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground mb-1 truncate">{project.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin size={12} />
                  <span className="truncate">{project.location || 'Sin ubicación'}</span>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium text-foreground">{project.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-CL') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    Abrir <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl px-6 py-4 flex items-center gap-6 shadow-xl">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium">Seleccionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFolderPrompt(true)} className="text-sm font-medium hover:text-emerald-400 transition-colors">
              <FolderOpen size={18} />
            </button>
            <button onClick={handleBulkDelete} className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors">
              <Trash2 size={18} />
            </button>
            <button onClick={() => setSelectedIds([])} className="p-1 hover:bg-slate-700 rounded transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={(budgetId) => {
          setIsCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          navigate(`/budget/${budgetId}`);
        }}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Eliminar proyectos"
        message={<span>¿Eliminar <strong>{selectedIds.length}</strong> proyecto{selectedIds.length > 1 ? 's' : ''}?</span>}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isProcessing}
      />

      <PromptModal
        isOpen={showFolderPrompt}
        onClose={() => setShowFolderPrompt(false)}
        onSubmit={confirmBulkMove}
        title="Organizar en carpeta"
        message="Nombre de la carpeta:"
        placeholder="Mi Carpeta"
        submitText="Mover"
      />
    </>
  );
};
