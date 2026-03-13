import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  budgets?: { id: string }[];
}

const ProjectStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const labels: Record<string, string> = {
    draft: 'Borrador',
    pending: 'Pendiente',
    approved: 'Aprobado',
    in_progress: 'En Obra',
    completed: 'Terminado',
    cancelled: 'Cancelado',
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

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', user?.company_id],
    enabled: !!user?.company_id,
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: { company_id: user?.company_id }
      });
      return response.data as Project[];
    }
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Panel de Proyectos
            </h1>
            <p className="text-slate-400 mt-1">
              Bienvenido de nuevo, <span className="text-indigo-400 font-medium">{user?.name}</span>.
            </p>
          </div>
          
          <button 
            onClick={() => {/* Open modal */}}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">+12% vs mes anterior</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Proyectos Activos</p>
              <h3 className="text-2xl font-bold mt-1">
                {projects?.filter(p => p.status === 'in_progress').length || 0}
              </h3>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-400">
                <Clock size={24} />
              </div>
              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg">4 esta semana</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">En Planificación</p>
              <h3 className="text-2xl font-bold mt-1">
                {projects?.filter(p => p.status === 'draft' || p.status === 'pending').length || 0}
              </h3>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg">Acumulado año</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Obras Terminadas</p>
              <h3 className="text-2xl font-bold mt-1">
                {projects?.filter(p => p.status === 'completed').length || 0}
              </h3>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ubicación..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="glass h-64 rounded-2xl animate-pulse border border-white/5"></div>
            ))
          ) : projects?.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold">No se encontraron proyectos</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Comienza creando tu primer proyecto para gestionar tus presupuestos y costos.</p>
            </div>
          ) : (
            projects?.map((project) => (
              <div 
                key={project.id}
                onClick={() => {
                  const budgetId = project.budgets?.[0]?.id;
                  if (budgetId) {
                    navigate(`/budget/${budgetId}`);
                  }
                }}
                className="group relative glass p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden shadow-xl"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <ProjectStatusBadge status={project.status} />
                    <span className="text-indigo-400 font-bold">
                      ${new Intl.NumberFormat().format(project.estimated_budget || 0)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                      <MapPin size={14} className="text-slate-500" />
                      <span className="truncate">{project.location || 'Sin ubicación'}</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'Sin descripción disponible para este proyecto.'}
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={12} />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
};
