import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  Package, HardHat, Wrench, Plus, Trash2,
  Search, X, Check, History
} from 'lucide-react';

type ResourceType = 'material' | 'labor' | 'equipment';

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  unit_id: string;
  unit?: { symbol: string; name: string };
  base_price: number;
  description?: string;
  created_at: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
  category: string;
}

interface PriceHistory {
  id: string;
  price: number;
  date: string;
}

const TYPE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  material: { label: 'Material', icon: <Package size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  labor: { label: 'Mano de obra', icon: <HardHat size={14} />, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
  equipment: { label: 'Equipos', icon: <Wrench size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
};

// UNITS is now fetched from API

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

// ─── Inline Editable Cell ──────────────────────────────────────────────────
interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  className?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
}

function EditableCell({ value, type = 'text', className = '', onChange, placeholder, align = 'left', bold }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const start = () => { setEditing(true); setTimeout(() => ref.current?.select(), 0); };
  const stop = (e: React.FocusEvent<HTMLInputElement>) => { setEditing(false); if (String(e.target.value) !== String(value)) onChange(e.target.value); };

  return editing ? (
    <input
      ref={ref}
      defaultValue={value}
      type={type}
      onBlur={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') e.currentTarget.blur(); }}
      autoFocus
      placeholder={placeholder}
      className={`w-full bg-indigo-500/10 border border-indigo-500/40 rounded px-2 py-1 text-foreground text-sm outline-none text-${align} ${bold ? 'font-bold' : ''} ${className}`}
    />
  ) : (
    <div
      onClick={start}
      className={`px-2 py-1 rounded hover:bg-white/5 cursor-text transition-colors text-sm text-${align} ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'} ${!value && value !== 0 ? 'italic' : ''} ${className}`}
    >
      {value !== '' && value !== 0 ? (type === 'number' ? Number(value).toLocaleString('es-CL') : value) : (
        <span className="text-muted-foreground/60 text-xs">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Unit Selector Cell ────────────────────────────────────────────────────
function UnitCell({ value, units, onChange }: { value: string; units: Unit[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-muted-foreground text-xs font-bold border-none outline-none cursor-pointer hover:text-foreground transition-all uppercase tabular-nums tracking-widest text-center"
    >
      {units.map((u) => <option key={u.id} value={u.id} className="bg-card">{u.symbol}</option>)}
    </select>
  );
}

interface ResourceFormProps {
  initial?: Partial<Resource>;
  onSave: (data: Omit<Resource, 'id' | 'created_at'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  units: Unit[];
}

function ResourceForm({ initial, onSave, onCancel, isLoading, units }: ResourceFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'material' as ResourceType,
    unit_id: initial?.unit_id ?? '',
    base_price: initial?.base_price ?? 0,
    description: initial?.description ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <form
        onSubmit={(e) => { e.preventDefault(); onSave(form as Omit<Resource, 'id' | 'created_at'>); }}
        className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4"
      >
        <h3 className="text-foreground font-bold text-lg">{initial?.id ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Ej: Hormigón H25"
            className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descripción (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detalles adicionales..."
            rows={2}
            className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_CONFIG) as ResourceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                form.type === t
                  ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} border-opacity-80`
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {TYPE_CONFIG[t].icon}
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Unidad</label>
            <select
              value={form.unit_id}
              onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
              required
              className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-blue-500"
            >
              <option value="" disabled>Seleccionar...</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Precio base ($)</label>
            <input
              type="number"
              value={form.base_price || ''}
              onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
              min={0}
              required
              className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            {initial?.id ? 'Guardar cambios' : 'Crear recurso'}
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryModal({ resourceId, resourceName, onClose }: { resourceId: string; resourceName: string; onClose: () => void }) {
  const { data: history = [], isLoading } = useQuery<PriceHistory[]>({
    queryKey: ['resource-history', resourceId],
    queryFn: () => api.get(`/resources/${resourceId}/history`).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground font-bold">Historial de precios</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{resourceName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Sin historial de cambios</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground text-xs">{new Date(h.date).toLocaleDateString('es-CL')}</span>
                <span className="text-foreground font-bold text-sm tabular-nums">{formatCLP(Number(h.price))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { PageHeader } from '../../components/common/PageHeader';

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [showHistory, setShowHistory] = useState<Resource | null>(null);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then((r) => r.data),
  });
  
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: () => api.get('/units').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Resource, 'id' | 'created_at'>) => api.post('/resources', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resources'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Resource> & { id: string }) => api.patch(`/resources/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resources'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });

  const filtered = resources.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const counts = {
    all: resources.length,
    material: resources.filter((r) => r.type === 'material').length,
    labor: resources.filter((r) => r.type === 'labor').length,
    equipment: resources.filter((r) => r.type === 'equipment').length,
  };

  return (
    <div className="p-8 pb-32">
      <PageHeader 
        title="Base de Recursos" 
        icon={<Package size={22} />} 
        breadcrumbs={[{ label: 'Gestión de Costos' }, { label: 'Recursos', active: true }]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} /> Nuevo Recurso
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {(['all', 'material', 'labor', 'equipment'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`p-4 rounded-2xl border transition-all text-left group ${
              typeFilter === t
                ? t === 'all'
                  ? 'bg-white/10 border-border text-foreground font-bold ring-1 ring-white/10 shadow-xl'
                  : `${TYPE_CONFIG[t]?.bg} ${TYPE_CONFIG[t]?.color} border-current/20 font-bold ring-1 ring-current/10 shadow-xl`
                : 'bg-card/50 border-border text-muted-foreground hover:border-border'
            }`}
          >
            <div className="text-3xl font-black mb-1 tabular-nums transition-transform group-hover:scale-105 origin-left">
              {counts[t]}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">
              {t === 'all' ? 'Total Global' : TYPE_CONFIG[t].label + 's'}
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/40 border border-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 focus:bg-card transition-all shadow-inner shadow-black/20"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-muted rounded-3xl border border-border">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase animate-pulse">Sincronizando Base de Datos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-muted rounded-3xl border border-dashed border-border/50 max-w-2xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center text-muted-foreground mb-6 border border-border shadow-inner">
            <Package size={40} className="opacity-20 translate-y-1" />
          </div>
          <h3 className="text-foreground font-bold text-lg">No se encontraron recursos</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6 text-center px-8">
            {search 
              ? `No hay resultados para "${search}" en la categoría seleccionada.` 
              : 'La base de datos está vacía. Comienza agregando tu primer recurso.'}
          </p>
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); if (!search) setShowForm(true); }}
            className="bg-white/5 border border-border/50 hover:bg-muted text-foreground px-6 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
          >
            {search ? 'Limpiar Filtros' : 'Crear mi primer Recurso'}
          </button>
        </div>
      ) : (
        <div className="bg-muted rounded-3xl border border-border overflow-hidden shadow-2xl">
          <div className="grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 px-8 py-4 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-card/20">
            <span>Identificación y Descripción</span>
            <span className="text-center">Categoría</span>
            <span className="text-center">Unidad</span>
            <span className="text-right">Precio Base</span>
            <span className="text-right pr-4">Acciones</span>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.map((r) => {
              const cfg = TYPE_CONFIG[r.type];
              return (
                <div
                  key={r.id}
                  className="group grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 items-center px-8 py-4 hover:bg-white/[0.02] transition-colors relative"
                >
                  <div className="flex flex-col min-w-0">
                    <EditableCell
                      value={r.name}
                      onChange={(v) => updateMutation.mutate({ id: r.id, name: v })}
                      placeholder="Nombre del recurso"
                      bold
                      className="uppercase tracking-tight !px-0"
                    />
                    <EditableCell
                      value={r.description || ''}
                      onChange={(v) => updateMutation.mutate({ id: r.id, description: v })}
                      placeholder="Sin descripción adicional..."
                      className="text-[11px] !px-0 opacity-70"
                    />
                  </div>

                  <div className="flex justify-center">
                    <select
                      value={r.type}
                      onChange={(e) => updateMutation.mutate({ id: r.id, type: e.target.value as ResourceType })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${cfg.bg} ${cfg.color} border border-current/10 outline-none cursor-pointer appearance-none text-center`}
                    >
                      {(Object.keys(TYPE_CONFIG) as ResourceType[]).map(t => (
                        <option key={t} value={t} className="bg-card">{TYPE_CONFIG[t].label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-center flex justify-center">
                    <div className="bg-white/5 px-2 py-1 rounded-lg border border-border/50 group-hover:border-indigo-500/30 transition-colors">
                      <UnitCell
                        value={r.unit_id}
                        units={units}
                        onChange={(v) => updateMutation.mutate({ id: r.id, unit_id: v })}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase">$</span>
                        <EditableCell
                          value={r.base_price}
                          type="number"
                          onChange={(v) => updateMutation.mutate({ id: r.id, base_price: parseFloat(v) || 0 })}
                          align="right"
                          bold
                          className="!text-foreground !px-0"
                        />
                      </div>
                      <span className="text-[10px] opacity-40 font-bold uppercase tracking-[0.1em]">por {r.unit?.symbol || 'un'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 opacity-10 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                    <button
                      onClick={() => setShowHistory(r)}
                      title="Ver Historial"
                      className="p-2.5 rounded-xl text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all active:scale-90"
                    >
                      <History size={15} />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Deseas eliminar permanentemente este recurso?')) deleteMutation.mutate(r.id); }}
                      title="Eliminar"
                      className="p-2.5 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ResourceForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
          units={units}
        />
      )}
      {editing && (
        <ResourceForm
          initial={editing}
          onSave={(data) => updateMutation.mutate({ id: editing.id, ...data })}
          onCancel={() => setEditing(null)}
          isLoading={updateMutation.isPending}
          units={units}
        />
      )}
      {showHistory && (
        <HistoryModal
          resourceId={showHistory.id}
          resourceName={showHistory.name}
          onClose={() => setShowHistory(null)}
        />
      )}
    </div>
  );
}
