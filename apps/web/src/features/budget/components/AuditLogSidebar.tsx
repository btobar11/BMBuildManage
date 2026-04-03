
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Clock, User, FileText, ChevronRight, X, History, AlertCircle, Trash2, Plus, Edit3 } from 'lucide-react';

interface AuditLog {
  id: string;
  entity_name: string;
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_value: any;
  new_value: any;
  description: string;
  created_at: string;
}

interface Props {
  projectId: string;
  onClose: () => void;
}

// Native date formatter for Spanish
const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
});

export function AuditLogSidebar({ projectId, onClose }: Props) {
  const { data: logs = [], isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', projectId],
    queryFn: async () => {
      const res = await api.get(`/audit-logs/project/${projectId}?limit=100`);
      return res.data;
    },
    enabled: !!projectId,
    refetchInterval: 30000, 
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus size={14} className="text-emerald-500" />;
      case 'UPDATE': return <Edit3 size={14} className="text-blue-500" />;
      case 'DELETE': return <Trash2 size={14} className="text-rose-500" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  const getEntityIcon = (name: string) => {
    switch (name) {
      case 'Item': return <FileText size={12} />;
      case 'Budget': return <History size={12} />;
      case 'Expense': return <AlertCircle size={12} />;
      default: return <ChevronRight size={12} />;
    }
  };

  const formatLogDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return dateFormatter.format(d);
    } catch {
      return 'Fecha N/A';
    }
  };

  const formatLogTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return timeFormatter.format(d);
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Historial de Cambios</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Cargando trazabilidad...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
            <p className="text-xs text-rose-500 font-bold">Error al cargar historial</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center gap-4 px-6">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center border border-border opacity-50">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1 uppercase tracking-tight">Sin registros aún</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Las acciones que realices en el presupuesto se guardarán aquí automáticamente.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-8 group">
                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-lg border-2 border-card z-10 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                  log.action === 'CREATE' ? 'bg-emerald-500/20' : 
                  log.action === 'UPDATE' ? 'bg-blue-500/20' : 
                  'bg-rose-500/20'
                }`}>
                  {getActionIcon(log.action)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500/80">
                      {log.action}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {formatLogTime(log.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-foreground font-bold leading-tight line-clamp-2">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium pt-0.5">
                    <div className="p-0.5 bg-muted rounded border border-border">
                      {getEntityIcon(log.entity_name)}
                    </div>
                    <span>{log.entity_name}</span>
                    <span className="opacity-30">·</span>
                    <span>{formatLogDate(log.created_at)}</span>
                  </div>

                  {log.action === 'UPDATE' && log.new_value?.quantity !== undefined && log.old_value?.quantity !== undefined && (
                    <div className="mt-2 p-2 bg-muted/40 rounded-lg border border-border/50 text-[10px] space-y-1">
                      <p className="text-muted-foreground">Cambio detectado:</p>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-rose-400/80 line-through">{Number(log.old_value.quantity).toFixed(2)}</span>
                        <ChevronRight size={10} className="text-muted-foreground" />
                        <span className="text-emerald-400 font-bold">{Number(log.new_value.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/20 border-t border-border mt-auto">
        <div className="flex items-start gap-2 pt-2">
            <User size={12} className="text-blue-500" />
            <p className="text-[9px] text-muted-foreground">Historial consolidado por proyecto.</p>
        </div>
      </div>
    </div>
  );
}
