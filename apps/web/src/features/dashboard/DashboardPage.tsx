import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProjectModal } from './components/CreateProjectModal';
import { FolderSidebar } from './components/FolderSidebar';
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
  Building2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  progress?: number;
  folder?: string;
  budgets?: { id: string }[];
}

const ProjectStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    sent: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.draft}`}>
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
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setShowDeleteConfirm(false);
    setIsProcessing(true);
    
    const deletePromise = api.post('/projects/bulk-delete', { ids: selectedIds });
    
    toast.promise(deletePromise, {
      loading: 'Eliminando proyectos...',
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setSelectedIds([]);
        return `${selectedIds.length} proyectos eliminados`;
      },
      error: (err) => {
        const errorMsg = err.response?.data?.message || 'Error al eliminar';
        return errorMsg;
      }
    }).finally(() => {
      setIsProcessing(false);
    });
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

  const projectCounts: Record<string, number> = {};
  const folders = Array.from(new Set(projects?.map((p: Project) => p.folder).filter(Boolean) as string[]));
  projects?.forEach((p: Project) => {
    if (p.folder) {
      projectCounts[p.folder] = (projectCounts[p.folder] || 0) + 1;
    }
  });

  const filteredProjects = projects?.filter((p: Project) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.location?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = !selectedFolderFilter || p.folder === selectedFolderFilter;
    return matchesSearch && matchesFolder;
  });

  const totalBudget = projects?.reduce((acc: number, p: Project) => acc + (p.estimated_budget || 0), 0) || 0;

  return (
    <div className="h-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                  Panel de Proyectos
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground">
              Bienvenido, <span className="text-violet-400 font-bold">{user?.name}</span>. Tienes <span className="font-bold text-foreground">{projects?.length || 0}</span> proyectos activos.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              title="Sincronizar"
            >
              <RefreshCcw size={18} className={`text-muted-foreground group-hover:text-violet-400 transition-all ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 p-5 hover:border-violet-500/40 transition-all hover:shadow-xl hover:shadow-violet-500/10">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
            <DollarSign size={24} className="text-violet-400 mb-3" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Valor Total</p>
            <p className="text-2xl font-black text-foreground mt-1">
              ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalBudget)}
            </p>
            <p className="text-xs text-violet-400 font-medium mt-2">{projects?.length || 0} proyectos</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-5 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <Clock size={24} className="text-amber-400 mb-3" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Enviados</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {projects?.filter(p => p.status === 'sent').length || 0}
            </p>
            <p className="text-xs text-amber-400 font-medium mt-2">Pendientes</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <BarChart3 size={24} className="text-emerald-400 mb-3" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">En Obra</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {projects?.filter(p => p.status === 'in_progress').length || 0}
            </p>
            <p className="text-xs text-emerald-400 font-medium mt-2">Activos</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-600/5 border border-fuchsia-500/20 p-5 hover:border-fuchsia-500/40 transition-all hover:shadow-xl hover:shadow-fuchsia-500/10">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-all" />
            <CheckCircle2 size={24} className="text-fuchsia-400 mb-3" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Completados</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {projects?.filter(p => p.status === 'completed').length || 0}
            </p>
            <p className="text-xs text-fuchsia-400 font-medium mt-2">Histórico</p>
          </div>
        </div>

        {/* Dashboard Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          <FolderSidebar 
            folders={folders}
            selectedFolder={selectedFolderFilter}
            onSelectFolder={setSelectedFolderFilter}
            projectCounts={projectCounts}
            allProjectsCount={projects?.length || 0}
          />

          <div className="flex-1 space-y-6">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar proyectos..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>
              {selectedFolderFilter && (
                <button 
                  onClick={() => setSelectedFolderFilter(null)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-sm font-medium"
                >
                  <FolderOpen size={16} />
                  {selectedFolderFilter}
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Projects Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 transition-all duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              {isLoading && !projects ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                ))
              ) : filteredProjects?.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl border border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto text-violet-400">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Sin proyectos</h3>
                    <p className="text-muted-foreground mt-1">Crea tu primer proyecto para comenzar</p>
                  </div>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-500 transition-all"
                  >
                    <Sparkles size={16} /> Crear Proyecto
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
                    className={`
                      group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] 
                      border border-white/10 hover:border-violet-500/40 
                      transition-all duration-300 cursor-pointer 
                      hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1
                      ${selectedIds.includes(project.id) ? 'ring-2 ring-violet-500 bg-violet-500/5' : ''}
                    `}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      onClick={(e) => toggleSelect(project.id, e)}
                      className={`
                        absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                        ${selectedIds.includes(project.id) 
                          ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-600/40 scale-110' 
                          : 'bg-black/20 border-white/30 opacity-0 group-hover:opacity-100 hover:scale-105'
                        }
                      `}
                    >
                      {selectedIds.includes(project.id) && <CheckCircle2 size={14} className="text-white" />}
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-violet-500/10 transition-all" />

                    <div className="p-5 space-y-4 relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <ProjectStatusBadge status={project.status} />
                        <span className="text-lg font-black text-violet-400">
                          ${new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(project.estimated_budget || 0)}
                        </span>
                      </div>

                      {/* Project Info */}
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-violet-300 transition-colors truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                          <MapPin size={14} className="opacity-60" />
                          <span className="truncate">{project.location || 'Sin ubicación'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {project.description || 'Sin descripción'}
                      </p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Progreso</span>
                          <span className="text-violet-400 font-bold">{project.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-CL') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Abrir <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#12121a] border border-violet-500/30 shadow-2xl shadow-violet-500/20 rounded-2xl px-6 py-4 flex items-center gap-6 animate-slide-up backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-6 border-r border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-foreground">Seleccionados</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFolderPrompt(true)}
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors"
            >
              <FolderOpen size={18} />
              Organizar
            </button>

            <button 
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className={`flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-semibold transition-colors ${isProcessing ? 'opacity-50' : ''}`}
            >
              <Trash2 size={18} />
              Eliminar
            </button>

            <button 
              onClick={() => setSelectedIds([])}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

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
        message={
          <>¿Eliminar <strong>{selectedIds.length}</strong> proyecto{selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.</>
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
        message="Nombre de la carpeta destino:"
        placeholder="Mi Carpeta"
        submitText="Mover"
      />
    </div>
  );
};
