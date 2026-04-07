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
  Target
} from 'lucide-react';

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

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const statusIcons = {
  pending: <Clock size={14} className="text-slate-500" />,
  in_progress: <Clock size={14} className="text-blue-500" />,
  completed: <CheckCircle2 size={14} className="text-emerald-500" />,
  delayed: <AlertTriangle size={14} className="text-red-500" />,
};

export function SchedulePage() {
  const { id: projectId } = useParams<{ id: string }>();
  // Auth context available via context if needed
  void useAuth;
  const queryClient = useQueryClient();
  const [viewStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

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
    onError: () => toast.error('Error al crear tarea'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => 
      api.patch(`/schedule/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });
      toast.success('Tarea actualizada');
      setEditingTask(null);
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/schedule/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });
      toast.success('Tarea eliminada');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const days = useMemo(() => {
    const result = [];
    const start = new Date(viewStartDate);
    for (let i = 0; i < 30; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      result.push(date);
    }
    return result;
  }, [viewStartDate]);

  const getTaskPosition = (task: ScheduleTask) => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const taskStart = Math.max(0, Math.floor((start.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const taskEnd = Math.min(29, Math.floor((end.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  return { start: taskStart, width: Math.max(1, taskEnd - taskStart + 1) };
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cronograma</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.stats.totalTasks || 0} tareas • {data?.stats.progress || 0}% completado
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.stats.totalTasks || 0}</p>
              <p className="text-xs text-muted-foreground">Total Tareas</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.stats.inProgressTasks || 0}</p>
              <p className="text-xs text-muted-foreground">En Progreso</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.stats.completedTasks || 0}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.stats.delayedTasks || 0}</p>
              <p className="text-xs text-muted-foreground">Retrasadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Timeline Header */}
        <div className="flex border-b border-border bg-muted/30">
          <div className="w-64 flex-shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border">
            Tarea
          </div>
          <div className="flex-1 flex">
            {days.map((day, i) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div 
                  key={i} 
                  className={`flex-1 min-w-[40px] p-2 text-center text-xs border-r border-border ${
                    isWeekend ? 'bg-slate-50' : ''
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="text-muted-foreground">
                    {['E', 'F', 'M', 'A', 'M', 'J', 'L'][day.getDay()] || ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="max-h-[500px] overflow-y-auto">
          {data?.tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay tareas. Crea tu primera tarea para comenzar.
            </div>
          ) : (
            data?.tasks.map((task) => {
              const pos = getTaskPosition(task);
              return (
                <div key={task.id} className="flex border-b border-border hover:bg-muted/20">
                  <div className="w-64 flex-shrink-0 p-3 border-r border-border flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      task.priority === 'critical' ? 'bg-red-500' :
                      task.priority === 'high' ? 'bg-amber-500' :
                      task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {statusIcons[task.status]}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-12">
                    <div 
                      className={`absolute top-2 h-8 rounded-md flex items-center px-2 cursor-pointer transition-all hover:scale-[1.02] ${
                        task.status === 'completed' ? 'bg-emerald-500 text-white' :
                        task.status === 'in_progress' ? 'bg-blue-500 text-white' :
                        task.status === 'delayed' ? 'bg-red-500 text-white' :
                        'bg-slate-300 text-slate-700'
                      }`}
                      style={{ 
                        left: `${pos.start * 3.33}%`, 
                        width: `${pos.width * 3.33}%` 
                      }}
                      onClick={() => setEditingTask(task)}
                    >
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium truncate">{task.name}</span>
                        <span className="text-xs opacity-80">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Milestones */}
      {data?.milestones && data.milestones.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target size={18} />
            Hitos
          </h3>
          <div className="space-y-2">
            {data.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    milestone.completed ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}>
                    {milestone.completed && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className={milestone.completed ? 'text-muted-foreground line-through' : ''}>
                    {milestone.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(milestone.target_date).toLocaleDateString('es-CL')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-semibold mb-4">Nueva Tarea</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              createTaskMutation.mutate({
                name: (form.elements.namedItem('name') as HTMLInputElement).value,
                description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
                start_date: (form.elements.namedItem('start_date') as HTMLInputElement).value,
                end_date: (form.elements.namedItem('end_date') as HTMLInputElement).value,
                priority: (form.elements.namedItem('priority') as HTMLSelectElement).value,
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input name="name" required className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea name="description" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Inicio</label>
                  <input type="date" name="start_date" required className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fin</label>
                  <input type="date" name="end_date" required className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select name="priority" className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                  <option value="low">Baja</option>
                  <option value="medium" selected>Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-semibold mb-4">Editar Tarea</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              updateTaskMutation.mutate({
                taskId: editingTask.id,
                data: {
                  name: (form.elements.namedItem('name') as HTMLInputElement).value,
                  progress: parseInt((form.elements.namedItem('progress') as HTMLInputElement).value),
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value,
                }
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input name="name" defaultValue={editingTask.name} required className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Progreso (%)</label>
                <input name="progress" type="number" min="0" max="100" defaultValue={editingTask.progress} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select name="status" defaultValue={editingTask.status} className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="delayed">Retrasada</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => deleteTaskMutation.mutate(editingTask.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
                <div className="flex-1 flex gap-3">
                  <button type="button" onClick={() => setEditingTask(null)} className="flex-1 px-4 py-2 border border-border rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}