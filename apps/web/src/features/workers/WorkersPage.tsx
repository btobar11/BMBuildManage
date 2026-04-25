import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { CreateWorkerModal } from './components/CreateWorkerModal';
import { EditWorkerModal } from './components/EditWorkerModal';
import { WorkerHistoryModal } from './components/WorkerHistoryModal';
import { Trash2, Users, Plus, Search, Star, Phone, MoreVertical, Building2 as Briefcase, Award, DollarSign, Filter } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  role: string;
  daily_rate: number;
  phone: string;
  skills: string;
  rating: number;
  notes: string;
  assignmentsCount: number;
  created_at: string;
}

export function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = {
    mutate: async (id: string) => {
      try {
        await api.delete(`/workers/${id}`);
        toast.success('Trabajador eliminado');
        fetchWorkers();
      } catch (error) {
        toast.error('Error al eliminar trabajador');
      }
    },
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers');
      setWorkers(response.data);
    } catch (error) {
      toast.error('Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.skills?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate real stats
  const totalRegistered = workers.length;
  const highRated = workers.filter(w => Number(w.rating) >= 4.5).length;
  const activeInProjects = workers.filter(w => (w.assignmentsCount || 0) > 0).length;

  // Average rate only for those who have a rate > 0
  const workersWithRate = workers.filter(w => Number(w.daily_rate || 0) > 0);
  const averageDailyRate = workersWithRate.length > 0
    ? workersWithRate.reduce((acc, w) => acc + Number(w.daily_rate || 0), 0) / workersWithRate.length
    : 0;

  return (
    <div className="p-8 space-y-8">
      <WorkerHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        workerId={selectedWorkerId} 
      />

      <EditWorkerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setWorkerToEdit(null);
        }}
        onSuccess={() => {
          fetchWorkers();
        }}
        worker={workerToEdit}
      />
      <CreateWorkerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWorkers} 
      />
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="text-blue-500" size={32} />
            Gestión de Trabajadores
          </h1>
          <p className="text-muted-foreground mt-2">Administra tu red de contratistas, ingenieros y maestros.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          Nuevo Trabajador
        </button>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
            <Users size={24} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Total registrados</p>
            <p className="text-2xl font-bold text-foreground">{totalRegistered}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
            <Award size={24} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Mejor Calificados</p>
            <p className="text-2xl font-bold text-foreground">{highRated}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">En Obra</p>
            <p className="text-2xl font-bold text-foreground">{activeInProjects}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Promedio Diario</p>
            <p className="text-2xl font-bold text-foreground">
              ${(averageDailyRate / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, especialidad o habilidades..." 
            className="w-full bg-card border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-card border border-border text-muted-foreground p-3 rounded-xl hover:text-foreground transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <div 
              key={worker.id}
              className="bg-card rounded-2xl border border-border overflow-hidden group hover:border-blue-500/50 transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-foreground shadow-lg">
                      {worker.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-blue-400 transition-colors">
                        {worker.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                        {worker.role}
                      </span>
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button 
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // For simplicity, we just trigger edit directly on click of the dots for now
                        // or we could show a real dropdown. Let's make it a simple "Edit" button if they hover.
                      }}
                    >
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-card/80 border border-border/50 rounded-lg shadow-xl z-20 overflow-hidden min-w-[120px]">
                      <button 
                        onClick={() => {
                          setWorkerToEdit(worker);
                          setIsEditModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-blue-600 hover:text-foreground transition-colors"
                      >
                        Editar Perfil
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('¿Eliminar este trabajador?')) {
                            deleteMutation.mutate(worker.id);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="text-amber-500" size={16} fill="currentColor" />
                      <span>{Number(worker.rating).toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground">• {worker.assignmentsCount || 0} obras</span>
                    </div>
                    <div className="text-muted-foreground font-medium">
                      ${Number(worker.daily_rate).toLocaleString()} / día
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {worker.notes || 'Sin notas adicionales.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(worker.skills?.split(',') || []).map((skill, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted text-muted-foreground rounded-md">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-card/80 border-t border-border flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} />
                  {worker.phone || 'N/A'}
                </div>
                <button 
                  onClick={() => {
                    setSelectedWorkerId(worker.id);
                    setIsHistoryModalOpen(true);
                  }}
                  className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                >
                  Ver Historial
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredWorkers.length === 0 && (
            <div className="col-span-full py-20 bg-card rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
              <Users size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground">No se encontraron trabajadores</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Comienza agregando a tu equipo o ajusta los filtros de búsqueda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
