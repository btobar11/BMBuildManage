import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Plus, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Activity,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleTask {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  position: number;
  duration: number;
  assigned_to?: string;
  parent_id?: string;
}

interface ScheduleMilestone {
  id: string;
  name: string;
  target_date: string;
  completed: boolean;
}

interface ScheduleData {
  tasks: ScheduleTask[];
  milestones: ScheduleMilestone[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    delayedTasks: number;
    progress: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

const PRIORITY_THEMES = {
  low: {
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    bar: 'bg-slate-500/30'
  },
  medium: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bar: 'bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
  },
  high: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
  },
  critical: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    bar: 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
  },
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-slate-500', label: 'Pendiente' },
  in_progress: { icon: Activity, color: 'text-blue-500', label: 'En Progreso' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Terminado' },
  delayed: { icon: AlertTriangle, color: 'text-rose-500', label: 'Retrasado' },
};

export function SchedulePage() {
  const { id: projectId } = useParams<{ id: string }>();
  void useAuth;
  const queryClient = useQueryClient();
  
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Inicio de mes
    return d;
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery<ScheduleData>({
    queryKey: ['schedule', projectId],
    queryFn: () => api.get(`/schedule/${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => api.post(`/schedule/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });
      toast.success('Tarea creada');
      setShowAddModal(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => 
      api.patch(`/schedule/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });
      toast.success('Cambios guardados');
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/schedule/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });
      toast.success('Tarea eliminada');
      setEditingTask(null);
    },
  });

  // Timeline days (30 days viewport)
  const timelineDays = useMemo(() => {
    const days = [];
    const start = new Date(viewDate);
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewDate]);

  const getTaskGeometry = (task: ScheduleTask) => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    
    // Normalize to timeline start
    const diffStart = Math.floor((start.getTime() - viewDate.getTime()) / (1000 * 3600 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    
    const left = Math.max(0, diffStart * 32); // 32px is day width
    const width = duration * 32;
    
    const isVisible = diffStart + duration >= 0 && diffStart <= 35;
    
    return { left, width, isVisible };
  };

  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];
    if (!searchQuery) return data.tasks;
    return data.tasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data?.tasks, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full"
        />
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Sincronizando Cronograma...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card/40 backdrop-blur-xl border border-border rounded-3xl p-8 overflow-hidden shadow-2xl shadow-black/10"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-500/10 via-primary-500/5 to-transparent rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white shrink-0">
              <Calendar size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl font-black text-foreground tracking-tight">Cronograma 4D</h1>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20 tracking-tighter self-center">En Tiempo Real</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground max-w-md">
                Planificación maestra y control de hitos vinculados al presupuesto y modelo BIM.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Filtrar tareas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none w-48 transition-all focus:w-64"
                />
             </div>
             <button 
               onClick={() => setShowAddModal(true)}
               className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-95"
             >
               <Plus size={20} />
               <span className="hidden sm:inline">Nueva Tarea</span>
             </button>
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Avance General', value: `${data?.stats.progress || 0}%`, icon: Activity, color: 'text-blue-500' },
            { label: 'Tareas Activas', value: data?.stats.inProgressTasks || 0, icon: Clock, color: 'text-amber-500' },
            { label: 'Hitos Cumplidos', value: `${data?.stats.completedMilestones}/${data?.stats.totalMilestones}`, icon: Target, color: 'text-emerald-500' },
            { label: 'Retrasos Críticos', value: data?.stats.delayedTasks || 0, icon: AlertTriangle, color: 'text-rose-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-background/40 border border-border/50 rounded-2xl p-4 flex flex-col gap-1 ring-1 ring-white/5 shadow-sm">
               <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                  <stat.icon size={12} className={stat.color} />
                  {stat.label}
               </div>
               <div className="text-xl font-black text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gantt Experience */}
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-[2rem] overflow-hidden shadow-xl ring-1 ring-white/5">
        
        {/* Navigation Controls */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
           <div className="flex items-center gap-4">
              <div className="flex bg-background border border-border rounded-xl p-1 shadow-sm">
                 <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><LayoutGrid size={16} className="text-muted-foreground" /></button>
                 <button className="p-1.5 bg-primary-500 text-white rounded-lg shadow-sm"><List size={16} /></button>
              </div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                 <Calendar size={16} className="text-primary-500" />
                 {viewDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </h3>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const d = new Date(viewDate);
                  d.setMonth(d.getMonth() - 1);
                  setViewDate(d);
                }}
                className="p-2 border border-border rounded-xl bg-background hover:bg-muted text-muted-foreground transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setViewDate(new Date())}
                className="px-4 py-2 border border-border rounded-xl bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all shadow-sm"
              >
                Hoy
              </button>
              <button 
                onClick={() => {
                  const d = new Date(viewDate);
                  d.setMonth(d.getMonth() + 1);
                  setViewDate(d);
                }}
                className="p-2 border border-border rounded-xl bg-background hover:bg-muted text-muted-foreground transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>

        {/* Viewport Rendering */}
        <div className="relative overflow-x-auto overflow-y-visible">
          <div className="min-w-fit flex flex-col">
            
            {/* Days Header */}
            <div className="flex border-b border-border bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
               <div className="w-[300px] min-w-[300px] border-r border-border p-4 text-[11px] font-black uppercase text-muted-foreground tracking-widest bg-card/60">
                 Identificación de Tarea
               </div>
               <div className="flex flex-1">
                 {timelineDays.map((date, i) => {
                   const isToday = date.toDateString() === new Date().toDateString();
                   const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                   return (
                     <div 
                       key={i} 
                       className={`w-8 min-w-[32px] border-r border-border/30 flex flex-col items-center justify-center py-3 ${isWeekend ? 'bg-slate-500/5' : ''} ${isToday ? 'bg-primary-500/10' : ''}`}
                     >
                        <span className={`text-[10px] font-black ${isToday ? 'text-primary-500' : 'text-muted-foreground'}`}>
                           {['D','L','M','M','J','V','S'][date.getDay()]}
                        </span>
                        <span className={`text-xs font-bold mt-0.5 ${isToday ? 'text-primary-500 underline underline-offset-4' : 'text-foreground'}`}>
                           {date.getDate()}
                        </span>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Task Rows */}
            <div className="flex-1">
              <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 px-[400px]"
                  >
                     <div className="p-6 bg-muted/30 rounded-full mb-4">
                        <Layers size={40} className="text-muted-foreground/30" />
                     </div>
                     <p className="text-sm font-bold text-muted-foreground italic">No se encontraron tareas en este criterio</p>
                  </motion.div>
                ) : (
                  filteredTasks.map((task, idx) => {
                    const { left, width, isVisible } = getTaskGeometry(task);
                    const theme = PRIORITY_THEMES[task.priority];
                    const status = STATUS_CONFIG[task.status];
                    const StatusIcon = status.icon;

                    return (
                      <motion.div 
                        key={task.id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex border-b border-border group hover:bg-primary-500/[0.02] transition-all"
                      >
                        {/* Task Info Column */}
                        <div 
                          onClick={() => setEditingTask(task)}
                          className="w-[300px] min-w-[300px] border-r border-border p-4 flex gap-4 cursor-pointer"
                        >
                           <div className={`mt-1 h-3 w-1 rounded-full ${task.priority === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : task.priority === 'high' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                           <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary-500 transition-colors uppercase tracking-tight">{task.name}</h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <StatusIcon size={14} className={status.color} />
                                 <span className={`text-[10px] font-black uppercase tracking-tighter ${status.color}`}>{status.label}</span>
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${theme.badge}`}>
                                    {task.priority}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Gantt Bar Area */}
                        <div className="flex-1 relative h-16 bg-muted/[0.02] overflow-hidden">
                           {/* Grid overlay for days */}
                           <div className="absolute inset-0 flex">
                              {timelineDays.map((_, i) => (
                                <div key={i} className="w-8 border-r border-border/[0.05]" />
                              ))}
                           </div>

                           {isVisible && (
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width }}
                               className={`absolute top-4 h-8 rounded-xl cursor-pointer group/bar flex items-center px-4 overflow-hidden border border-white/10 ${theme.bar}`}
                               style={{ left }}
                               onClick={() => setEditingTask(task)}
                             >
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${task.progress}%` }}
                                  className="absolute left-0 h-full bg-white/20 -z-10"
                                />
                                <div className="flex items-center justify-between w-full min-w-0">
                                   <span className="text-[10px] font-black text-white uppercase truncate drop-shadow-sm">{task.name}</span>
                                   <span className="text-[10px] font-black text-white/90 drop-shadow-md ml-2">{task.progress}%</span>
                                </div>
                             </motion.div>
                           )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Edit & Add Modals would remain similar but with Premium UI - Redacted for brevity in output, assuming implementation follows the same glassmorphic pattern */}
      <AnimatePresence>
        {editingTask && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
           >
              <motion.div 
                layoutId={`task-${editingTask.id}`}
                className="bg-card/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl shadow-black ring-1 ring-white/10"
              >
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-500/20 rounded-2xl text-primary-500"><LayoutGrid size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Editar Tarea</h3>
                           <p className="text-xs font-bold text-muted-foreground lowercase">GlobalID: {editingTask.id.substring(0,8)}...</p>
                        </div>
                     </div>
                     <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><Plus className="rotate-45" /></button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nombre de la Tarea</label>
                       <input 
                         defaultValue={editingTask.name} 
                         id="edit-name"
                         className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-foreground font-bold focus:border-primary-500 outline-none transition-all shadow-inner"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Progreso (%)</label>
                          <input 
                            type="number" 
                            id="edit-progress"
                            defaultValue={editingTask.progress} 
                            max="100" 
                            className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-foreground font-black focus:border-primary-500 outline-none transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Estado</label>
                          <select 
                            id="edit-status"
                            defaultValue={editingTask.status}
                            className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-foreground font-bold focus:border-primary-500 outline-none transition-all shadow-inner uppercase text-[11px] appearance-none"
                          >
                             <option value="pending">Pendiente</option>
                             <option value="in_progress">En Progreso</option>
                             <option value="completed">Completado</option>
                             <option value="delayed">Retrasado</option>
                          </select>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                       <button 
                         onClick={() => deleteTaskMutation.mutate(editingTask.id)}
                         className="p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all border border-rose-500/20 shadow-lg shadow-rose-500/10"
                       >
                         <Trash2 size={24} />
                       </button>
                       <button 
                         onClick={() => setEditingTask(null)}
                         className="flex-1 py-4 px-6 border border-border rounded-2xl font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-white/5 transition-all"
                       >
                         Cerrar
                       </button>
                       <button 
                         onClick={() => {
                            const nameEl = document.getElementById('edit-name') as HTMLInputElement;
                            const progEl = document.getElementById('edit-progress') as HTMLInputElement;
                            const statEl = document.getElementById('edit-status') as HTMLSelectElement;
                            updateTaskMutation.mutate({
                               taskId: editingTask.id,
                               data: { name: nameEl.value, progress: parseInt(progEl.value), status: statEl.value }
                            });
                         }}
                         className="flex-[2] py-4 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-95"
                       >
                         Guardar Cambios
                       </button>
                    </div>
                  </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal Placeholder - Same logic as Edit but for creation */}
       {showAddModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-card/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8">Nueva Tarea Maestra</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target as HTMLFormElement;
                  createTaskMutation.mutate({
                     name: (f.elements.namedItem('name') as HTMLInputElement).value,
                     start_date: (f.elements.namedItem('start') as HTMLInputElement).value,
                     end_date: (f.elements.namedItem('end') as HTMLInputElement).value,
                     priority: (f.elements.namedItem('priority') as HTMLSelectElement).value,
                  });
                }} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                       <input name="name" required className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 font-bold" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inicio</label>
                        <input name="start" type="date" required className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 font-bold [color-scheme:dark]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Término</label>
                        <input name="end" type="date" required className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 font-bold [color-scheme:dark]" />
                      </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prioridad</label>
                       <select name="priority" className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 font-bold uppercase text-xs">
                           <option value="low">Baja</option>
                           <option value="medium" selected>Media</option>
                           <option value="high">Alta</option>
                           <option value="critical">Crítica</option>
                       </select>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-border rounded-2xl font-black uppercase text-xs tracking-widest">Cancelar</button>
                      <button type="submit" className="flex-[2] py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/20">Crear Tarea</button>
                   </div>
                </form>
            </div>
         </div>
       )}
    </div>
  );
}