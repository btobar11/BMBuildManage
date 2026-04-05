import { useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  Plus, Search, X, Copy, Trash2, Pencil, Calculator,
  Package, HardHat, Wrench, Check, ChevronDown, ChevronRight,
  TrendingUp, Layers, DollarSign
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';

// ─── Types ────────────────────────────────────────────────────────────────────
type ResourceType = 'material' | 'labor' | 'equipment';
// ApuUnit type is deprecated in favor of standardized units

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  unit_id: string;
  unit?: { symbol: string; name: string };
  base_price: number;
  category?: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
}

interface ApuResourceEntry {
  id?: string;
  resource_id: string;
  resource_type: ResourceType;
  coefficient: number;
  resource?: Resource;
}

interface ApuTemplate {
  id: string;
  name: string;
  unit_id: string;
  unit?: Unit;
  description?: string;
  unit_cost: number;
  category?: string;
  company_id?: string | null;
  apu_resources: ApuResourceEntry[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

// APU_UNITS is now fetched from API

const RES_TYPE_ICONS: Record<ResourceType, ReactNode> = {
  material: <Package size={12} />,
  labor: <HardHat size={12} />,
  equipment: <Wrench size={12} />,
};

const RES_TYPE_COLORS: Record<ResourceType, string> = {
  material: 'text-blue-400 bg-blue-500/10',
  labor: 'text-violet-400 bg-violet-500/10',
  equipment: 'text-amber-400 bg-amber-500/10',
};

// ─── APU Editor Modal ─────────────────────────────────────────────────────────
interface ApuEditorProps {
  initial?: Partial<ApuTemplate>;
  resources: Resource[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  units: Unit[];
}

function ApuEditor({ initial, resources, onSave, onCancel, isLoading, units }: ApuEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [unitId, setUnitId] = useState(initial?.unit_id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [entries, setEntries] = useState<ApuResourceEntry[]>(
    initial?.apu_resources?.map((r) => ({
      resource_id: r.resource_id,
      resource_type: r.resource_type,
      coefficient: Number(r.coefficient),
      resource: r.resource,
    })) ?? []
  );
  const [resourceSearch, setResourceSearch] = useState('');

  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const addEntry = (resource: Resource) => {
    if (entries.some((e) => e.resource_id === resource.id)) return;
    setEntries([...entries, {
      resource_id: resource.id,
      resource_type: resource.type,
      coefficient: 1,
      resource,
    }]);
    setResourceSearch('');
  };

  const removeEntry = (resourceId: string) =>
    setEntries(entries.filter((e) => e.resource_id !== resourceId));

  const updateCoeff = (resourceId: string, coeff: number) =>
    setEntries(entries.map((e) => e.resource_id === resourceId ? { ...e, coefficient: coeff } : e));

  const unitCost = entries.reduce((sum, e) => {
    const price = Number(e.resource?.base_price ?? 0);
    return sum + price * e.coefficient;
  }, 0);

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    onSave({
      name,
      unit_id: unitId,
      description,
      category: category || undefined,
      apu_resources: entries.map((e) => ({
        resource_id: e.resource_id,
        resource_type: e.resource_type,
        coefficient: e.coefficient,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-card border border-border/50 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border relative bg-card/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <Calculator size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-xl">{initial?.id ? 'Editar Partida APU' : 'Crear Nueva Partida'}</h3>
                <p className="text-muted-foreground text-xs">Configure los recursos y rendimientos para su análisis</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nombre de la partida</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Radier..."
                className="w-full bg-card/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Unidad base</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                className="w-full bg-card/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar...</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Etapa / Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Hormigón..."
                className="w-full bg-card/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional de la partida..."
              className="w-full bg-card/50 border border-border/50 rounded-xl px-4 py-2 text-foreground text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none h-20"
            />
          </div>
        </div>

        {/* Resources Section */}
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                Matriz de Recursos
              </h4>
              <p className="text-muted-foreground text-[10px] mt-0.5">Defina materiales, mano de obra y equipos necesarios</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider">Costo Unit. Estimado</span>
              <div className="text-emerald-400 font-black text-lg tabular-nums">
                {formatCLP(unitCost)}<span className="text-xs opacity-60 ml-1">/ {units.find(u => u.id === unitId)?.symbol || '?'}</span>
              </div>
            </div>
          </div>

          {/* New Resource Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder="Escriba para buscar y agregar recursos..."
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground text-sm outline-none focus:border-blue-500/30 transition-all placeholder:text-muted-foreground"
            />
            {resourceSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl overflow-hidden z-20 shadow-2xl overflow-y-auto max-h-[250px] animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredResources.slice(0, 15).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addEntry(r)}
                    disabled={entries.some((e) => e.resource_id === r.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-left disabled:opacity-40 group"
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${RES_TYPE_COLORS[r.type]} group-hover:scale-110 transition-transform`}>
                      {RES_TYPE_ICONS[r.type]}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{r.name}</p>
                      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{r.type} · {r.unit?.symbol || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground text-sm font-bold tabular-nums">{formatCLP(Number(r.base_price))}</p>
                      <p className="text-muted-foreground text-[10px]">Precio base</p>
                    </div>
                  </button>
                ))}
                {filteredResources.length === 0 && (
                  <div className="p-8 text-center">
                    <Package size={32} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-xs">No se encontraron recursos</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resources List */}
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-card/20 border border-dashed border-border rounded-3xl">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Package size={20} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Agregue recursos para calcular el costo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Custom Table Component */}
                {entries.map((entry) => (
                  <div
                    key={entry.resource_id}
                    className="flex items-center gap-4 bg-card/40 hover:bg-card/60 border border-border rounded-2xl p-4 transition-all group"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${RES_TYPE_COLORS[entry.resource_type]} shrink-0`}>
                      {RES_TYPE_ICONS[entry.resource_type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-bold truncate">{entry.resource?.name}</p>
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold">{entry.resource?.unit?.symbol || '-'}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-tighter opacity-50 mb-0.5 whitespace-nowrap">Precio Unit.</p>
                      <p className="text-foreground text-sm font-bold tabular-nums">{formatCLP(Number(entry.resource?.base_price ?? 0))}</p>
                    </div>
                    <div className="w-24">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-tighter opacity-50 mb-0.5 whitespace-nowrap text-right pr-2">Rendimiento</p>
                      <input
                        type="number"
                        value={entry.coefficient}
                        onChange={(e) => updateCoeff(entry.resource_id, parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.001}
                        className="bg-card border border-border/50 rounded-xl px-3 py-1.5 text-foreground text-sm text-right outline-none focus:border-blue-500/50 w-full tabular-nums transition-all"
                      />
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-tighter opacity-50 mb-0.5 whitespace-nowrap">Subtotal</p>
                      <p className="text-emerald-400 text-sm font-bold tabular-nums">
                        {formatCLP(Number(entry.resource?.base_price ?? 0) * entry.coefficient)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.resource_id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border bg-card/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-border/50 text-muted-foreground text-sm font-semibold hover:bg-muted transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !name || entries.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={18} />
            )}
            <span>{initial?.id ? 'Guardar Cambios' : 'Crear Partida APU'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── APU Card ─────────────────────────────────────────────────────────────────
function ApuCard({
  apu,
  onEdit,
  onDuplicate,
  onDelete,
  isGlobal,
}: {
  apu: ApuTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isGlobal?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const materialCost = apu.apu_resources
    .filter((r) => r.resource_type === 'material')
    .reduce((s, r) => s + Number(r.resource?.base_price ?? 0) * Number(r.coefficient), 0);
  const laborCost = apu.apu_resources
    .filter((r) => r.resource_type === 'labor')
    .reduce((s, r) => s + Number(r.resource?.base_price ?? 0) * Number(r.coefficient), 0);
  const equipCost = apu.apu_resources
    .filter((r) => r.resource_type === 'equipment')
    .reduce((s, r) => s + Number(r.resource?.base_price ?? 0) * Number(r.coefficient), 0);

  return (
    <div className="group bg-card/40 border border-border rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col h-full">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Calculator size={22} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={onDuplicate}
              className="p-2 text-muted-foreground hover:text-emerald-400 bg-white/5 hover:bg-emerald-400/10 rounded-xl transition-all"
              title={isGlobal ? "Importar a mi biblioteca" : "Duplicar"}
            >
              {isGlobal ? <Plus size={16} /> : <Copy size={16} />}
            </button>
            {!isGlobal && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2 text-muted-foreground hover:text-blue-400 bg-white/5 hover:bg-blue-400/10 rounded-xl transition-all"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-muted-foreground hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-foreground font-bold text-lg group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-tight">
              {apu.name}
            </h3>
            <p className="text-muted-foreground text-xs mt-1.5 flex items-center gap-1.5">
              <Layers size={12} />
              <span>Unidad: {apu.unit?.symbol ?? '-'}</span>
            </p>
          </div>

          <div className="bg-muted rounded-xl p-3 border border-border">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Costo Unitario</span>
              <span className="text-emerald-400 font-black text-xl tabular-nums">
                {formatCLP(Number(apu.unit_cost))}
              </span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Expanded detail toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border mt-4"
          >
            <span className="font-medium">{expanded ? 'Ocultar detalles' : 'Ver desglose de recursos'}</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Breakdown section */}
        {expanded && (
          <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {apu.apu_resources.length === 0 ? (
              <p className="text-[10px] text-center text-muted-foreground py-2">Sin recursos asignados</p>
            ) : (
              apu.apu_resources.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-md ${RES_TYPE_COLORS[r.resource_type]} shrink-0`}>
                    {RES_TYPE_ICONS[r.resource_type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium truncate">{r.resource?.name}</p>
                    <p className="text-[10px] text-muted-foreground">×{Number(r.coefficient).toFixed(3)}</p>
                  </div>
                  <span className="text-[11px] text-foreground font-bold tabular-nums">
                    {formatCLP(Number(r.resource?.base_price ?? 0) * Number(r.coefficient))}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-muted border-t border-border flex items-center justify-between overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-4">
          {materialCost > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">Mat: <span className="text-foreground">{formatCLP(materialCost)}</span></span>
            </div>
          )}
          {laborCost > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[10px] text-muted-foreground">M.O: <span className="text-foreground">{formatCLP(laborCost)}</span></span>
            </div>
          )}
          {equipCost > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Eqp: <span className="text-foreground">{formatCLP(equipCost)}</span></span>
            </div>
          )}
        </div>
        {isGlobal && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Global</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ApuLibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('global');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ApuTemplate | null>(null);

  const { data: apus = [], isLoading } = useQuery<ApuTemplate[]>({
    queryKey: ['apu-templates', search, activeTab],
    queryFn: () => api.get('/apu', { params: { search: search || undefined, tab: activeTab } }).then((r) => r.data),
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then((r) => r.data),
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: () => api.get('/units').then((r) => r.data),
  });

  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => api.post('/apu', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['apu-templates'] }); setShowEditor(false); },
  });

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, ...data }: any) => api.patch(`/apu/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['apu-templates'] }); setEditing(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/apu/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apu-templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/apu/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apu-templates'] }),
  });

  // Calculate categories from apus
  const categories = Array.from(new Set(apus.map(a => a.category).filter(Boolean))) as string[];

  const filteredApus = apus.filter(a => {
    if (selectedCategory && a.category !== selectedCategory) return false;
    return true;
  });

  const totalItems = filteredApus.length;
  const avgCost = totalItems > 0 ? filteredApus.reduce((acc, cur) => acc + Number(cur.unit_cost), 0) / totalItems : 0;

  return (
    <div className="pb-12">
      <div className="max-w-[1600px] mx-auto px-6 pt-6">
        <PageHeader
          title="Biblioteca APU"
          icon={<Calculator size={24} className="text-foreground" />}
          breadcrumbs={[
            { label: 'Dashboard' },
            { label: 'Biblioteca APU', active: true }
          ]}
          actions={
            <div className="flex items-center gap-4">
              <div className="flex bg-card/60 backdrop-blur-md border border-border/50 p-1 rounded-2xl overflow-hidden shadow-inner">
                <button
                  onClick={() => { setActiveTab('personal'); setSelectedCategory(null); }}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Mi Biblioteca
                </button>
                <button
                  onClick={() => { setActiveTab('global'); setSelectedCategory(null); }}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'global' ? 'bg-emerald-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Catálogo Global
                </button>
              </div>
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Plus size={18} />
                <span>Nuevo APU</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 space-y-8 mt-2">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Layers size={64} className="text-blue-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Total Partidas</p>
            <h3 className="text-3xl font-bold text-foreground mb-2">{totalItems}</h3>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 w-fit px-2 py-1 rounded-full border border-blue-500/20">
              <TrendingUp size={12} />
              <span>Actualizado recientemente</span>
            </div>
          </div>

          <div className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={64} className="text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Costo Unit. Promedio</p>
            <h3 className="text-3xl font-bold text-foreground mb-2">{formatCLP(avgCost)}</h3>
            <p className="text-xs text-emerald-400">Promedio de las partidas actuales</p>
          </div>

          <div className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={64} className="text-amber-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Categorías</p>
            <h3 className="text-3xl font-bold text-foreground mb-2">{categories.length}</h3>
            <p className="text-xs text-muted-foreground">Etapas de construcción activas</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[450px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'global' ? "Buscar en el catálogo global..." : "Buscar en mi biblioteca..."}
              className="w-full bg-card border border-border/50 rounded-2xl pl-12 pr-4 py-3.5 text-foreground text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
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
          {activeTab === 'global' && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Package size={14} className="text-emerald-400" />
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">
                Mostrando Recursos Estándar
              </p>
            </div>
          )}
        </div>

        {/* Content Layout with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-2">Etapas / Categorías</h4>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedCategory ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                >
                  Todas las etapas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10">
              <h5 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                <TrendingUp size={14} />
                Tip de Pro
              </h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Utilice el catálogo global para basear sus presupuestos. Puede importar cualquier partida y ajustarla según su obra.
              </p>
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Cargando base de datos APU...</p>
              </div>
            ) : filteredApus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-3xl bg-card/10">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <Calculator size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron partidas</h3>
                <p className="text-muted-foreground max-w-sm text-center mb-8">
                  {search || selectedCategory
                    ? `No hay resultados para sus filtros actuales.`
                    : 'Aún no has creado ninguna partida APU. Comienza agregando una ahora.'}
                </p>
                {!search && !selectedCategory && (
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold px-6 py-3 rounded-xl border border-blue-400/20 hover:bg-blue-400/5 transition-all"
                  >
                    <Plus size={20} />
                    <span>Crear mi primer APU</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApus.map((apu) => (
                  <ApuCard
                    key={apu.id}
                    apu={apu}
                    isGlobal={!apu.company_id}
                    onEdit={() => setEditing(apu)}
                    onDuplicate={() => duplicateMutation.mutate(apu.id)}
                    onDelete={() => {
                      if (window.confirm(`¿Estás seguro de eliminar la partida "${apu.name}"? Esta acción no se puede deshacer.`)) {
                        deleteMutation.mutate(apu.id);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditor && (
        <ApuEditor
          resources={resources}
          units={units}
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowEditor(false)}
          isLoading={createMutation.isPending}
        />
      )}
      {editing && (
        <ApuEditor
          initial={editing}
          resources={resources}
          units={units}
          onSave={(data) => updateMutation.mutate({ id: editing.id, ...data })}
          onCancel={() => setEditing(null)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
