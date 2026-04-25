import { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Calendar, 
  Clock, 
  History, 
  AlertCircle,
  Construction,
  Award,
  DollarSign
} from 'lucide-react';
import api from '../../../lib/api';

interface WorkerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string | null;
}

interface WorkerHistory {
  id: string;
  name: string;
  role: string;
  rating: number;
  daily_rate: number;
  skills: string;
  assignments: Array<{
    id: string;
    project: {
      name: string;
    };
    start_date: string;
    end_date: string;
    daily_rate: number;
    total_paid?: number;
    performance_rating?: number;
    performance_notes?: string;
    task_description?: string;
  }>;
}

export function WorkerHistoryModal({ isOpen, onClose, workerId }: WorkerHistoryModalProps) {
  const [history, setHistory] = useState<WorkerHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/workers/${workerId}`);
        setHistory(response.data);
      } catch {
        // Silent fail - ignore
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && workerId) {
      fetchHistory();
    }
  }, [isOpen, workerId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-background border border-border/50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {history?.name[0] || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">
                {history?.name || 'Cargando...'}
              </h2>
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                {history?.role || '---'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm animate-pulse">Consultando historial...</p>
            </div>
          ) : !history ? (
            <div className="text-center py-10">
              <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se pudo cargar la información.</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <History size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Obras</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">{history.assignments.length}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Star size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Puntos</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">{history.rating || '---'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <DollarSign size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Daily</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">${Number(history.daily_rate || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Assignments Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Trayectoria en Proyectos</h3>
                
                {history.assignments.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
                    Sin registros de obras anteriores.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.assignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className="group bg-[#15181e] border border-border rounded-2xl p-5 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                              <Construction size={16} />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{assignment.project.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-medium">
                                <Calendar size={12} />
                                <span>{new Date(assignment.start_date).toLocaleDateString()} - {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Activo'}</span>
                              </div>
                            </div>
                          </div>
                          {assignment.performance_rating && (
                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20">
                              <Award size={12} />
                              <span className="text-[10px] font-black">{assignment.performance_rating}</span>
                            </div>
                          )}
                        </div>

                        {assignment.task_description && (
                          <div className="mb-3 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Labor desempeñada</p>
                            <p className="text-xs text-foreground leading-relaxed">
                              {assignment.task_description}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border mb-3">
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Pago total acumulado:
                          </div>
                          <div className="text-sm font-black text-emerald-400">
                            ${Number(assignment.total_paid || 0).toLocaleString()}
                          </div>
                        </div>

                        {assignment.performance_notes && (
                          <div className="mt-3 p-3 bg-white/[0.02] rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              "{assignment.performance_notes}"
                            </p>
                          </div>
                        )}
                        
                        {!assignment.performance_notes && !assignment.performance_rating && (
                          <div className="mt-2 text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 uppercase tracking-wide">
                            <Clock size={12} /> 
                            Sin calificación registrada aún
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Tag Cloud */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {history.skills?.split(',').map((skill, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-indigo-500/5 text-indigo-400 rounded-xl text-[10px] font-bold border border-indigo-500/10 uppercase tracking-wider"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
