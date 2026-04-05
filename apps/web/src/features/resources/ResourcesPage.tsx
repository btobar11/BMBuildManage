import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  Package, HardHat, Wrench, Plus, Trash2,
  Search, X, Check, History, LayoutGrid,
  RefreshCw, Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen, EmptyState, ConnectionError } from '../../components/common/LoadingStates';

type ResourceType = 'material' | 'labor' | 'equipment';

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  unit_id: string;
  unit?: { symbol: string; name: string };
  base_price: number;
  description?: string;
  category?: string;
  company_id?: string | null;
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

const TYPE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  material: { label: 'Material', icon: <Package size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  labor: { label: 'Mano de obra', icon: <HardHat size={14} />, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  equipment: { label: 'Equipos', icon: <Wrench size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  className?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
  readOnly?: boolean;
}

function EditableCell({ value, type = 'text', className = '', onChange, placeholder, bold, readOnly }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const start = () => { if (!readOnly) { setEditing(true); setTimeout(() => ref.current?.select(), 0); } };
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
      className={`w-full bg-slate-700/50 border border-emerald-500/50 rounded-lg px-2 py-1 text-foreground text-sm outline-none ${bold ? 'font-bold' : ''} ${className}`}
    />
  ) : (
    <div
      onClick={start}
      className={`px-2 py-1 rounded transition-all text-sm ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'} ${!value && value !== 0 ? 'italic' : ''} ${!readOnly ? 'hover:bg-white/5 hover:text-foreground cursor-text' : ''} ${className}`}
    >
      {value !== '' && value !== 0 ? (type === 'number' ? Number(value).toLocaleString('es-CL') : value) : (
        <span className="text-muted-foreground/60 text-xs">{placeholder}</span>
      )}
    </div>
  );
}

function UnitCell({ value, units, onChange }: { value: string; units: Unit[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-muted-foreground text-xs font-bold border-none outline-none cursor-pointer hover:text-foreground transition-all uppercase tabular-nums text-center"
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
    category: initial?.category ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <form
        onSubmit={(e) => { e.preventDefault(); onSave(form as Omit<Resource, 'id' | 'created_at'>); }}
        className="relative bg-card border border-border rounded-3xl w-full max-w-lg p-8 shadow-2xl z-10 space-y-6 animate-slide-up"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <Package size={24} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-xl">{initial?.id ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
            <p className="text-muted-foreground text-xs">Complete los datos del recurso</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-wider">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Ej: Hormigón H25"
            className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-wider">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detalles adicionales..."
            rows={2}
            className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-wider">Categoría</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Ej: Obra Gruesa, Terminaciones..."
            className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(TYPE_CONFIG) as ResourceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
                form.type === t
                  ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].border}`
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {TYPE_CONFIG[t].icon}
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-wider">Unidad</label>
            <select
              value={form.unit_id}
              onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
              required
              className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50"
            >
              <option value="" disabled>Seleccionar...</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-wider">Precio (CLP)</label>
            <input
              type="number"
              value={form.base_price || ''}
              onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
              min={0}
              required
              className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-border/50 text-muted-foreground text-sm font-semibold hover:bg-muted transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} />
                {initial?.id ? 'Guardar' : 'Crear'}
              </>
            )}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-sm p-6 shadow-2xl z-10 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-foreground font-bold text-lg">Historial de Precios</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{resourceName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Sin historial de cambios</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
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

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('global');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [showHistory, setShowHistory] = useState<Resource | null>(null);

  const { data: resources = [], isLoading, isError, refetch } = useQuery<Resource[]>({
    queryKey: ['resources', activeTab],
    queryFn: () => api.get('/resources', { params: { tab: activeTab } }).then((r) => r.data),
    retry: 2,
    staleTime: 30000,
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

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/resources/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setActiveTab('personal');
    },
  });

  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean))) as string[];

  const filtered = resources.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchCategory = !selectedCategory || r.category === selectedCategory;
    return matchSearch && matchType && matchCategory;
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Actualizar"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-card/60 backdrop-blur-md border border-border/50 p-1 rounded-2xl overflow-hidden shadow-inner">
              <button
                onClick={() => { setActiveTab('personal'); setSelectedCategory(null); }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mi Base
              </button>
              <button
                onClick={() => { setActiveTab('global'); setSelectedCategory(null); }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'global' ? 'bg-emerald-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Sparkles size={12} className="inline mr-1" />
                Catálogo Global
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={18} /> Nuevo Recurso
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        {(['all', 'material', 'labor', 'equipment'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
              typeFilter === t
                ? t === 'all'
                  ? 'bg-white/10 border-white/20 text-foreground font-bold shadow-xl'
                  : `${TYPE_CONFIG[t]?.bg} ${TYPE_CONFIG[t]?.color} border-current/30 font-bold shadow-xl`
                : 'bg-card/50 border-border text-muted-foreground hover:border-border'
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
              {t === 'all' && <Package size={80} className="text-white translate-x-8 -translate-y-4" />}
              {t === 'material' && <Package size={80} className="text-blue-400 translate-x-8 -translate-y-4" />}
              {t === 'labor' && <HardHat size={80} className="text-violet-400 translate-x-8 -translate-y-4" />}
              {t === 'equipment' && <Wrench size={80} className="text-amber-400 translate-x-8 -translate-y-4" />}
            </div>
            <div className="text-4xl font-black mb-1 tabular-nums group-hover:scale-105 transition-transform origin-left">
              {counts[t]}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              {t === 'all' ? 'Total' : TYPE_CONFIG[t].label + 's'}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar recursos por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/40 border border-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:bg-card transition-all shadow-inner"
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

      {isLoading ? (
        <LoadingScreen message="Cargando recursos..." submessage="Conectando con el servidor..." />
      ) : isError ? (
        <ConnectionError onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No se encontraron recursos"
          description={search ? `No hay resultados para "${search}" en la categoría seleccionada.` : 'La base de datos está vacía. Comienza agregando tu primer recurso.'}
          actionLabel={!search ? 'Crear recurso' : undefined}
          onAction={!search ? () => setShowForm(true) : undefined}
          variant="full"
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 space-y-6">
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-4 shadow-xl sticky top-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <LayoutGrid size={14} className="text-muted-foreground" />
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Categorías</h4>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedCategory ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                >
                  Todas ({resources.length})
                </button>
                {categories.sort().map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                  >
                    {cat} ({resources.filter(r => r.category === cat).length})
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 bg-card/30 rounded-3xl border border-border overflow-hidden shadow-2xl">
            <div className="grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 px-6 py-3 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-card/30">
              <span>Recurso</span>
              <span className="text-center">Tipo</span>
              <span className="text-center">Unidad</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-white/5">
              {filtered.map((r) => {
                const cfg = TYPE_CONFIG[r.type];
                const isGlobal = !r.company_id;
                return (
                  <div
                    key={r.id}
                    className="group grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <EditableCell
                          value={r.name}
                          onChange={(v) => updateMutation.mutate({ id: r.id, name: v })}
                          placeholder="Nombre"
                          bold
                          readOnly={isGlobal}
                          className="uppercase tracking-tight !px-0 flex-1"
                        />
                        {isGlobal && (
                          <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Global</span>
                        )}
                      </div>
                      <EditableCell
                        value={r.description || ''}
                        onChange={(v) => updateMutation.mutate({ id: r.id, description: v })}
                        placeholder="Sin descripción..."
                        readOnly={isGlobal}
                        className="text-[11px] !px-0 opacity-60"
                      />
                    </div>

                    <div className="flex justify-center">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${cfg.bg} ${cfg.color} border border-current/10`}>
                        {cfg.icon}
                        {cfg.label.substring(0, 4)}
                      </div>
                    </div>

                    <div className="text-center flex justify-center">
                      <div className={`bg-white/5 px-2 py-1 rounded-lg border border-border/50 group-hover:border-emerald-500/30 transition-colors ${isGlobal ? 'opacity-50' : ''}`}>
                        {isGlobal ? (
                          <span className="text-xs font-bold text-muted-foreground uppercase">{r.unit?.symbol || '-'}</span>
                        ) : (
                          <UnitCell
                            value={r.unit_id}
                            units={units}
                            onChange={(v) => updateMutation.mutate({ id: r.id, unit_id: v })}
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {formatCLP(r.base_price)}
                      </span>
                      <p className="text-[10px] opacity-40 uppercase">/ {r.unit?.symbol || 'un'}</p>
                    </div>

                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {isGlobal ? (
                        <button
                          onClick={() => duplicateMutation.mutate(r.id)}
                          title="Importar"
                          className="p-2 rounded-xl text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90"
                        >
                          <Plus size={15} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowHistory(r)}
                            title="Historial"
                            className="p-2 rounded-xl text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all active:scale-90"
                          >
                            <History size={15} />
                          </button>
                          <button
                            onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(r.id); }}
                            title="Eliminar"
                            className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
