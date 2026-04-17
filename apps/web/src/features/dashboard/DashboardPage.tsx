import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Trash2,
} from 'lucide-react';
import { EmptyState, EmptyStatePresets } from '../../components/ui/EmptyState';

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

// ─── Stagger Animation Variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.2 },
  },
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────
const ProjectSkeleton = () => (
  <div className="bg-card rounded-xl border border-border p-4 space-y-4">
    {/* Status + Budget */}
    <div className="flex items-center justify-between">
      <div className="h-6 w-20 rounded-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
      <div className="h-6 w-24 rounded-lg bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    </div>
    {/* Title */}
    <div className="h-5 w-3/4 rounded-lg bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    {/* Location */}
    <div className="flex items-center gap-2">
      <div className="h-3.5 w-3.5 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
      <div className="h-3.5 w-32 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    </div>
    {/* Description */}
    <div className="space-y-1.5">
      <div className="h-3 w-full rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
      <div className="h-3 w-2/3 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    </div>
    {/* Progress */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-8 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>
      <div className="h-2 w-full rounded-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    </div>
    {/* Footer */}
    <div className="pt-3 border-t border-border/50 flex justify-between">
      <div className="h-3.5 w-24 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
      <div className="h-3.5 w-12 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
    </div>
  </div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────
const ProjectStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    draft: 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-400',
    sent: 'bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-900/20 dark:border-sky-800/50 dark:text-sky-400',
    approved: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400',
    in_progress: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-300',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────
export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFolderPrompt, setShowFolderPrompt] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: projects, isLoading, isError, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: { company_id: user?.company_id }
      });
      return response.data;
    },
    enabled: !!user?.company_id,
    placeholderData: (previousData: Project[] | undefined) => previousData,
    retry: 1,
    retryDelay: 1000,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
    );
  };

  const handleSingleDelete = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmSingleDelete = async () => {
    if (!projectToDelete) return;
    setShowDeleteConfirm(false);
    setIsProcessing(true);
    
    toast.promise(api.delete(`/projects/${projectToDelete.id}`), {
      loading: 'Eliminando...',
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setProjectToDelete(null);
        return 'Proyecto eliminado';
      },
      error: () => {
        setIsProcessing(false);
        return 'Error al eliminar proyecto';
      },
    });
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

  // Get user display name - prefer first_name from metadata, fallback to name or email prefix
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <>
      <div className="space-y-6">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido de nuevo, <span className="font-medium text-emerald-600 dark:text-emerald-400">{displayName}</span>
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
      </motion.div>

      {/* Stats Bento Grid Premium — Staggered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Presupuesto Total"
          value={`$${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalBudget)}`}
          icon={DollarSign}
          iconColor="success"
          description="En todos los proyectos"
        />

        <MetricCard
          title="Proyectos Activos"
          value={projects?.filter(p => p.status === 'in_progress').length || 0}
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
          icon={CheckCircle2}
          iconColor="info"
          description="Este año"
        />
      </div>

      {/* Search Premium — Glassmorphism Focus */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="relative"
      >
        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isSearchFocused ? 'text-emerald-500' : 'text-muted-foreground'}`} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Buscar proyectos por nombre o ubicación..."
          className={`
            w-full pl-11 pr-4 py-3.5 rounded-xl text-foreground text-sm
            placeholder:text-muted-foreground/60
            border transition-all duration-300 outline-none
            ${isSearchFocused 
              ? 'bg-card/80 backdrop-blur-xl border-emerald-500/30 ring-4 ring-emerald-500/[0.08] shadow-lg shadow-emerald-500/5' 
              : 'bg-card border-border hover:border-border/80'
            }
          `}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>

      {/* Projects Grid — Staggered Animation */}
      <AnimatePresence mode="wait">
        {isLoading && !projects ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ProjectSkeleton key={i} />
            ))}
          </motion.div>
        ) : filteredProjects?.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="col-span-full"
          >
            <EmptyState
              {...EmptyStatePresets.noProjects(() => setIsCreateModalOpen(true))}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects?.map((project) => (
              <motion.div key={project.id} variants={cardVariants} layout>
                <Card 
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
                  className={`group ${selectedIds.includes(project.id) ? 'ring-2 ring-emerald-500/30 border-emerald-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{project.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleDelete(project);
                        }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                        title="Eliminar proyecto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 data-mono tracking-tight shrink-0">
                      ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(project.estimated_budget || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <ProjectStatusBadge status={project.status} />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[50%]">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{project.location || 'Sin ubicación'}</span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4">{project.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold text-foreground data-mono">{project.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress || 0}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-CL') : 'Sin fecha'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform duration-200">
                      Abrir <ChevronRight size={16} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Premium */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl border border-slate-700/50"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium">Seleccionados</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowFolderPrompt(true)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Mover a carpeta">
                <FolderOpen size={18} />
              </button>
              <button onClick={handleBulkDelete} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300" title="Eliminar">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Cancelar">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        onClose={() => { setShowDeleteConfirm(false); setProjectToDelete(null); }}
        onConfirm={projectToDelete ? confirmSingleDelete : confirmBulkDelete}
        title={projectToDelete ? "Eliminar proyecto" : "Eliminar proyectos"}
        message={
          projectToDelete 
            ? <span>¿Eliminar el proyecto <strong>"{projectToDelete.name}"</strong>?</span>
            : <span>¿Eliminar <strong>{selectedIds.length}</strong> proyecto{selectedIds.length > 1 ? 's' : ''}?</span>
        }
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
