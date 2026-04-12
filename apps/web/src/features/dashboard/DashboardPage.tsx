import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal, PromptModal } from '../../components/Modal';
import { MetricCard, Card } from '../../components/ui/Card';
import { Button, IconButton } from '../../components/ui/Button';
import { 
  Plus, 
  Search,
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle2,
  DollarSign,
  FolderOpen,
  X,
  RefreshCcw,
  ChevronRight,
  Building2,
  Trash2
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
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    completed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
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

  const { data: projects, isLoading, isError, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: { company_id: user?.company_id }
      });
      return response.data;
    },
    placeholderData: (previousData: Project[] | undefined) => previousData,
    retry: 1,
    retryDelay: 1000,
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
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido de nuevo, <span className="font-medium text-primary-600">{user?.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <IconButton 
            icon={RefreshCcw} 
            label="Actualizar datos"
            variant="outline"
            onClick={handleRefresh}
            className={isRefreshing ? 'animate-spin' : ''}
          />
          <Button 
            leftIcon={Plus} 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Stats Bento Grid Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Presupuesto Total"
          value={`$${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalBudget)}`}
          change={8.5}
          previousValue={`$${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalBudget * 0.92)}`}
          icon={DollarSign}
          iconColor="success"
          description="En todos los proyectos"
        />

        <MetricCard
          title="Proyectos Activos"
          value={projects?.filter(p => p.status === 'in_progress').length || 0}
          change={12.5}
          previousValue={(projects?.filter(p => p.status === 'in_progress').length || 0) - 1}
          icon={Building2}
          iconColor="primary"
          description="En construcción"
        />

        <MetricCard
          title="Pendientes"
          value={projects?.filter(p => p.status === 'sent' || p.status === 'approved').length || 0}
          icon={Clock}
          iconColor="warning"
          description="Esperando aprobación"
        />

        <MetricCard
          title="Completados"
          value={projects?.filter(p => p.status === 'completed').length || 0}
          change={5.2}
          icon={CheckCircle2}
          iconColor="info"
          description="Este año"
        />
      </div>

      {/* Search Premium */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar proyectos por nombre o ubicación..."
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && !projects ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border h-48 animate-pulse" />
          ))
        ) : filteredProjects?.length === 0 ? (
          <Card className="col-span-full py-16" variant="outlined">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl mb-4">
                <Search size={32} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin proyectos</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Crea tu primer proyecto para comenzar a gestionar tu construcción</p>
              <Button leftIcon={Plus} onClick={() => setIsCreateModalOpen(true)}>
                Crear Proyecto
              </Button>
            </div>
          </Card>
        ) : (
          filteredProjects?.map((project) => (
            <Card 
              key={project.id}
              variant="default"
              hoverable
              clickable
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
              className={selectedIds.includes(project.id) ? 'ring-2 ring-primary-500/30 border-primary-500' : ''}
            >
              <div className="flex items-start justify-between mb-4">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xl font-bold text-primary-600 data-mono">
                  ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(project.estimated_budget || 0)}
                </span>
              </div>

              <h3 className="font-semibold text-lg text-foreground mb-2 truncate">{project.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin size={14} />
                <span className="truncate">{project.location || 'Sin ubicación'}</span>
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium text-foreground">{project.progress || 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress || 0}%` }} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-CL') : 'Sin fecha'}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
                  Abrir <ChevronRight size={16} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions Premium */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl animate-scale-in">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium">Seleccionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFolderPrompt(true)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Mover a carpeta">
              <FolderOpen size={18} />
            </button>
            <button onClick={handleBulkDelete} className="p-2 hover:bg-danger-500/20 rounded-lg transition-colors text-danger-400 hover:text-danger-300" title="Eliminar">
              <Trash2 size={18} />
            </button>
            <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Cancelar">
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
