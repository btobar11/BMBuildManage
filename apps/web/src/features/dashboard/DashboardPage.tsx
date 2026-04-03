import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProjectModal } from './components/CreateProjectModal';
import { FolderSidebar } from './components/FolderSidebar';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  BarChart3,
  Trash2,
  FolderOpen,
  X,
  RefreshCcw
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
    sent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
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
    
    // Custom prettier confirmation logic can be added later, for now we improve the process feedback
    const ok = window.confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.length} proyectos? Esta acción eliminará permanentemente todos los presupuestos, gastos y documentos asociados.`);
    if (!ok) return;

    setIsProcessing(true);
    
    const deletePromise = api.post('/projects/bulk-delete', { ids: selectedIds });
    
    toast.promise(deletePromise, {
      loading: 'Eliminando proyectos...',
      success: (response) => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setSelectedIds([]);
        return `${selectedIds.length} proyectos eliminados correctamente`;
      },
      error: (err) => {
        const errorMsg = err.response?.data?.message || 'Error al eliminar proyectos';
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
      // Artificial delay to show the animation as requested by user
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Datos actualizados');
    } catch (error) {
      toast.error('Error al actualizar datos');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkMove = async (folder: string | null) => {
    if (!selectedIds.length) return;
    try {
      await api.patch('/projects/bulk-update-folder', { ids: selectedIds, folder });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedIds([]);
    } catch (error) {
      console.error('Error in bulk move:', error);
      alert('Error al mover proyectos');
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

  return (
    <div className="h-full bg-background text-foreground p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Panel de Proyectos
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido de nuevo, <span className="text-indigo-400 font-medium">{user?.name}</span>.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border group transition-all"
              title="Sincronizar cambios"
            >
              <RefreshCcw size={18} className={`text-muted-foreground group-hover:text-primary transition-all ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Stats Summary - Executive View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={48} className="text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-xs uppercase font-black tracking-widest">Valor Total Cartera</p>
            <h3 className="text-2xl font-bold mt-2 text-foreground">
              ${new Intl.NumberFormat('es-CL').format(projects?.reduce((acc: number, p: Project) => acc + (p.estimated_budget || 0), 0) || 0)}
            </h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> Capital gestionado activo
            </p>
          </div>

          <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 size={48} className="text-blue-500" />
            </div>
            <p className="text-muted-foreground text-xs uppercase font-black tracking-widest">Margen Promedio</p>
            <h3 className="text-2xl font-bold mt-2 text-blue-400">15.2%</h3>
            <p className="text-[10px] text-blue-500/70 font-medium mt-2">Proyectado según presupuestos</p>
          </div>

          <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock size={48} className="text-amber-500" />
            </div>
            <p className="text-muted-foreground text-xs uppercase font-black tracking-widest">Obras en Curso</p>
            <h3 className="text-2xl font-bold mt-2 text-foreground">
              {projects?.filter(p => p.status === 'in_progress').length || 0}
            </h3>
            <p className="text-[10px] text-amber-500 font-bold mt-2">Requieren supervisión activa</p>
          </div>

          <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 size={48} className="text-indigo-500" />
            </div>
            <p className="text-muted-foreground text-xs uppercase font-black tracking-widest">Efectividad Entrega</p>
            <h3 className="text-2xl font-bold mt-2 text-indigo-400">98%</h3>
            <p className="text-[10px] text-indigo-500/70 font-medium mt-2">KPI de cumplimiento histórico</p>
          </div>
        </div>

        {/* Dashboard Content with Sidebar */}
        <div className="flex gap-8">
          <FolderSidebar 
            folders={folders}
            selectedFolder={selectedFolderFilter}
            onSelectFolder={setSelectedFolderFilter}
            projectCounts={projectCounts}
            allProjectsCount={projects?.length || 0}
          />

          <div className="flex-1 space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o ubicación..."
                  className="w-full bg-card/50 border border-border rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button className="flex items-center gap-2 bg-card/50 border border-border px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Filter size={18} />
                <span>Filtros</span>
              </button>
            </div>

            {/* Projects Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${isRefreshing ? 'opacity-50 blur-[1px] scale-[0.99]' : 'opacity-100'}`}>
              {isLoading && !projects ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass h-64 rounded-2xl animate-pulse"></div>
                ))
              ) : filteredProjects?.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 bg-secondary/10 rounded-3xl border border-dashed border-border">
                  <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">No se encontraron proyectos</h3>
                    <p className="text-muted-foreground">Intenta ajustar tus filtros o búsqueda</p>
                  </div>
                </div>
              ) : (
                filteredProjects?.map((project, index) => (
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
                          // If no budget exists, we can still navigate to a placeholder or show a message
                          toast.error('Este proyecto no tiene un presupuesto asociado.');
                        }
                      }
                    }}
                    className={`group bg-card hover:bg-secondary/30 border border-border hover:border-indigo-500/30 p-6 rounded-3xl transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 animate-in fade-in slide-in-from-top-4 fill-mode-both select-none ${selectedIds.includes(project.id) ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Selection Indicator */}
                    <div 
                      onClick={(e) => toggleSelect(project.id, e)}
                      className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedIds.includes(project.id) 
                          ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-lg shadow-indigo-600/40' 
                          : 'bg-black/20 border-white/20 opacity-0 group-hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {selectedIds.includes(project.id) && <CheckCircle2 size={14} className="text-white" />}
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <ProjectStatusBadge status={project.status} />
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">
                      ${new Intl.NumberFormat().format(project.estimated_budget || 0)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                      <MapPin size={14} className="opacity-70" />
                      <span className="truncate">{project.location || 'Sin ubicación'}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'Sin descripción disponible para este proyecto.'}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Progreso Real</span>
                      <span className="text-indigo-500 dark:text-indigo-400 font-bold">{project.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/20 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalles <ArrowRight size={14} />
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-card border border-indigo-500/30 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10 fade-in duration-300 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-8 border-r border-border">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-600/30">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-foreground">Proyectos seleccionados</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Create new folder trigger */}
            <button 
              onClick={() => {
                const name = prompt('Nombre de la nueva carpeta:');
                if (name) handleBulkMove(name);
              }}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors"
            >
              <FolderOpen size={18} />
              Organizar
            </button>

            <button 
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className={`flex items-center gap-2 text-rose-500 hover:text-rose-400 text-sm font-semibold transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 size={18} className={isProcessing ? 'animate-pulse' : ''} />
              {isProcessing ? 'Eliminando...' : 'Eliminar'}
            </button>

            <button 
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-muted rounded-lg transition-colors ml-4 text-muted-foreground"
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
    </div>
  );
};
