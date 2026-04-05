import { useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  Plus, Search, X, Copy, Trash2, Pencil, Calculator,
  Package, HardHat, Wrench, Check, ChevronDown, ChevronRight,
  TrendingUp, Layers, DollarSign, RefreshCw, Sparkles, ClipboardList, Download
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen, EmptyState } from '../../components/common/LoadingStates';
import { useAuth } from '../../context/AuthContext';

type ResourceType = 'material' | 'labor' | 'equipment';

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

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

const RES_TYPE_ICONS: Record<ResourceType, ReactNode> = {
  material: <Package size={12} />,
  labor: <HardHat size={12} />,
  equipment: <Wrench size={12} />,
};

const RES_TYPE_COLORS: Record<ResourceType, string> = {
  material: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  labor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  equipment: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

interface ApuEditorProps {
  initial?: Partial<ApuTemplate>;
  resources: Resource[];
  onSave: (data: unknown) => void;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-card border border-border/50 rounded-3xl w-full max-w-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
      >
        <div className="px-8 pt-8 pb-6 border-b border-border bg-card/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                <Calculator size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-xl">{initial?.id ? 'Editar Partida APU' : 'Nueva Partida APU'}</h3>
                <p className="text-muted-foreground text-xs">Configure recursos y rendimientos</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Radier H20..."
                className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Unidad</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar...</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Hormigón..."
                className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional..."
              className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all resize-none h-16"
            />
          </div>
        </div>

        <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                Recursos de la Partida
              </h4>
              <p className="text-muted-foreground text-[10px] mt-0.5">Agregue materiales, mano de obra y equipos</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
              <span className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider block">Costo Unitario</span>
              <div className="text-emerald-400 font-black text-xl tabular-nums">
                {formatCLP(unitCost)}
                <span className="text-xs opacity-60 ml-1">/ {units.find(u => u.id === unitId)?.symbol || '?'}</span>
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder="Buscar recursos para agregar..."
              className="w-full bg-muted border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground text-sm outline-none focus:border-emerald-500/30 transition-all placeholder:text-muted-foreground"
            />
            {resourceSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl overflow-hidden z-20 shadow-2xl overflow-y-auto max-h-[250px] animate-fade-in">
                {filteredResources.slice(0, 15).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addEntry(r)}
                    disabled={entries.some((e) => e.resource_id === r.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-left disabled:opacity-40 group"
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg border ${RES_TYPE_COLORS[r.type]} group-hover:scale-110 transition-transform`}>
                      {RES_TYPE_ICONS[r.type]}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{r.name}</p>
                      <p className="text-muted-foreground text-[10px] uppercase">{r.type} · {r.unit?.symbol || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 text-sm font-bold tabular-nums">{formatCLP(Number(r.base_price))}</p>
                      <p className="text-muted-foreground text-[10px]">base</p>
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

          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-muted/30 border-2 border-dashed border-border/50 rounded-3xl">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Layers size={28} className="text-emerald-500/50" />
                </div>
                <p className="text-muted-foreground text-sm">Busque y agregue recursos para calcular el costo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.resource_id}
                    className="flex items-center gap-4 bg-card/50 hover:bg-card/70 border border-border/50 rounded-2xl p-4 transition-all group"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${RES_TYPE_COLORS[entry.resource_type]} shrink-0`}>
                      {RES_TYPE_ICONS[entry.resource_type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-bold truncate">{entry.resource?.name}</p>
                      <p className="text-muted-foreground text-[10px] uppercase font-semibold">{entry.resource?.unit?.symbol || '-'}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-muted-foreground text-[10px] uppercase opacity-50 mb-0.5">Precio</p>
                      <p className="text-foreground text-sm font-bold tabular-nums">{formatCLP(Number(entry.resource?.base_price ?? 0))}</p>
                    </div>
                    <div className="w-28">
                      <p className="text-muted-foreground text-[10px] uppercase opacity-50 mb-0.5 text-right">Rendimiento</p>
                      <input
                        type="number"
                        value={entry.coefficient}
                        onChange={(e) => updateCoeff(entry.resource_id, parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.001}
                        className="bg-muted border border-border/50 rounded-xl px-3 py-1.5 text-foreground text-sm text-right outline-none focus:border-emerald-500/50 w-full tabular-nums transition-all"
                      />
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-muted-foreground text-[10px] uppercase opacity-50 mb-0.5">Subtotal</p>
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
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={18} />
            )}
            <span>{initial?.id ? 'Guardar' : 'Crear Partida'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

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

  const totalCost = materialCost + laborCost + equipCost;
  const matPct = totalCost > 0 ? (materialCost / totalCost) * 100 : 0;
  const laborPct = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
  const equipPct = totalCost > 0 ? (equipCost / totalCost) * 100 : 0;

  return (
    <div className="group bg-card/50 border border-border/50 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col h-full">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
            <Calculator size={22} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={onDuplicate}
              className="p-2 text-muted-foreground hover:text-emerald-400 bg-white/5 hover:bg-emerald-400/10 rounded-xl transition-all"
              title={isGlobal ? "Importar" : "Duplicar"}
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
                  className="p-2 text-muted-foreground hover:text-rose-400 bg-white/5 hover:bg-rose-400/10 rounded-xl transition-all"
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
            <h3 className="text-foreground font-bold text-base group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2 leading-tight">
              {apu.name}
            </h3>
            <p className="text-muted-foreground text-xs mt-1.5 flex items-center gap-1.5">
              <Layers size={12} />
              <span>Unidad: {apu.unit?.symbol ?? '-'}</span>
              {apu.category && <span className="text-emerald-500/60">· {apu.category}</span>}
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Costo Unitario</span>
              <span className="text-emerald-400 font-black text-2xl tabular-nums">
                {formatCLP(Number(apu.unit_cost))}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-700/50">
              {matPct > 0 && (
                <div className="bg-blue-500 transition-all" style={{ width: `${matPct}%` }} title={`Material: ${matPct.toFixed(0)}%`} />
              )}
              {laborPct > 0 && (
                <div className="bg-violet-500 transition-all" style={{ width: `${laborPct}%` }} title={`Mano obra: ${laborPct.toFixed(0)}%`} />
              )}
              {equipPct > 0 && (
                <div className="bg-amber-500 transition-all" style={{ width: `${equipPct}%` }} title={`Equipos: ${equipPct.toFixed(0)}%`} />
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 mt-3 pt-3"
          >
            <span className="font-medium">{expanded ? 'Ocultar' : 'Ver'} desglose ({apu.apu_resources.length} recursos)</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-1.5 animate-fade-in">
            {apu.apu_resources.length === 0 ? (
              <p className="text-[10px] text-center text-muted-foreground py-3">Sin recursos</p>
            ) : (
              apu.apu_resources.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/30">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-md border ${RES_TYPE_COLORS[r.resource_type]} shrink-0`}>
                    {RES_TYPE_ICONS[r.resource_type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground font-medium truncate">{r.resource?.name}</p>
                    <p className="text-[9px] text-muted-foreground">×{Number(r.coefficient).toFixed(3)}</p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold tabular-nums shrink-0">
                    {formatCLP(Number(r.resource?.base_price ?? 0) * Number(r.coefficient))}
                  </span>
                </div>
              ))
            )}
            {apu.apu_resources.length > 10 && (
              <p className="text-[10px] text-center text-muted-foreground py-1">+{apu.apu_resources.length - 10} más...</p>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px]">
          {materialCost > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Mat: <span className="text-foreground font-semibold">{formatCLP(materialCost)}</span></span>
            </div>
          )}
          {laborCost > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-muted-foreground">MO: <span className="text-foreground font-semibold">{formatCLP(laborCost)}</span></span>
            </div>
          )}
          {equipCost > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Eq: <span className="text-foreground font-semibold">{formatCLP(equipCost)}</span></span>
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

export function ApuLibraryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('global');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ApuTemplate | null>(null);

  const { data: apus = [], isLoading, refetch } = useQuery<ApuTemplate[]>({
    queryKey: ['apu-templates', activeTab],
    queryFn: () => api.get('/apu', { params: { tab: activeTab } }).then((r) => r.data),
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources', { params: { tab: 'global' } }).then((r) => r.data),
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: () => api.get('/units').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => api.post('/apu', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['apu-templates'] }); setShowEditor(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; data: unknown }) => api.patch(`/apu/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['apu-templates'] }); setEditing(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/apu/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apu-templates'] });
      setActiveTab('personal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/apu/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apu-templates'] }),
  });

  const importGlobalMutation = useMutation({
    mutationFn: (companyId: string) => api.post('/apu/seed', { companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apu-templates'] });
      setActiveTab('personal');
    },
  });

  const handleImportGlobal = () => {
    const companyId = user?.company_id;
    if (!companyId) {
      alert('No se encontró el ID de empresa. Por favor, inicia sesión nuevamente.');
      return;
    }
    if (confirm('¿Importar toda la biblioteca global a tu cuenta? Esto copiará todas las partidas disponibles.')) {
      importGlobalMutation.mutate(companyId);
    }
  };

  const categories = Array.from(new Set(apus.map(a => a.category).filter(Boolean))) as string[];

  const filteredApus = apus.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
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
              <button
                onClick={() => refetch()}
                className="p-2.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Actualizar"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <div className="flex bg-card/60 backdrop-blur-md border border-border/50 p-1 rounded-2xl overflow-hidden shadow-inner">
                <button
                  onClick={() => { setActiveTab('personal'); setSelectedCategory(null); setSearch(''); }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Mi Biblioteca
                </button>
                <button
                  onClick={() => { setActiveTab('global'); setSelectedCategory(null); setSearch(''); }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'global' ? 'bg-emerald-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Sparkles size={12} className="inline mr-1" />
                  Catálogo Global
                </button>
              </div>
              {activeTab === 'global' && (
                <button
                  onClick={handleImportGlobal}
                  disabled={importGlobalMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Download size={16} className={importGlobalMutation.isPending ? 'animate-bounce' : ''} />
                  <span>{importGlobalMutation.isPending ? 'Importando...' : 'Importar a Mi Biblioteca'}</span>
                </button>
              )}
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Plus size={18} />
                <span>Nueva Partida</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 space-y-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ClipboardList size={64} className="text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Total Partidas</p>
            <h3 className="text-4xl font-bold text-foreground mb-3">{totalItems}</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">{activeTab === 'global' ? 'Catálogo global' : 'Mi biblioteca'}</span>
            </div>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={64} className="text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Costo Promedio</p>
            <h3 className="text-3xl font-bold text-emerald-400 mb-3 tabular-nums">{formatCLP(avgCost)}</h3>
            <p className="text-xs text-muted-foreground">Promedio de todas las partidas</p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Layers size={64} className="text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Categorías</p>
            <h3 className="text-4xl font-bold text-foreground mb-3">{categories.length}</h3>
            <p className="text-xs text-muted-foreground">Etapas de construcción</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'global' ? "Buscar en el catálogo global..." : "Buscar en mi biblioteca..."}
              className="w-full bg-card/40 border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground text-sm outline-none focus:border-emerald-500/50 transition-all shadow-inner"
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
            <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
              <Sparkles size={14} className="text-emerald-400" />
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">
                Recursos Estándar
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 space-y-6">
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-4 shadow-xl sticky top-4">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">Categorías</h4>
              <div className="space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedCategory ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                >
                  Todas ({apus.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                  >
                    {cat} ({apus.filter(a => a.category === cat).length})
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <h5 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <TrendingUp size={14} />
                Tip
              </h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Use el catálogo global para basear sus presupuestos. Importe y ajuste según su obra.
              </p>
            </div>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <LoadingScreen message="Cargando partidas APU..." />
            ) : filteredApus.length === 0 ? (
              <EmptyState
                icon={Calculator}
                title="No se encontraron partidas"
                description={search || selectedCategory ? 'Ajuste sus filtros de búsqueda.' : 'Cree su primera partida APU para comenzar.'}
                actionLabel={!search && !selectedCategory ? 'Crear partida' : undefined}
                onAction={!search && !selectedCategory ? () => setShowEditor(true) : undefined}
                variant="full"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredApus.map((apu) => (
                  <ApuCard
                    key={apu.id}
                    apu={apu}
                    isGlobal={!apu.company_id}
                    onEdit={() => setEditing(apu)}
                    onDuplicate={() => duplicateMutation.mutate(apu.id)}
                    onDelete={() => {
                      if (confirm(`¿Eliminar "${apu.name}"?`)) {
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
          onSave={(data) => updateMutation.mutate({ id: editing.id, data })}
          onCancel={() => setEditing(null)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
