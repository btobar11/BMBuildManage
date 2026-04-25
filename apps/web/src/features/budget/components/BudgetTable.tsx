import React, { useState, useRef, useMemo, memo, useCallback } from 'react';
import type { Stage, LineItem } from '../types';
import { formatCLP } from '../helpers';
import { calcStageTotal } from '../helpers';
import { UNITS } from '../types';
import {
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calculator,
  Box,
  Ruler,
  CheckCircle2,
  Info,
  X,
  Sigma,
  TriangleAlert,
  Layers
} from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ApuPickerModal } from '../../apu/components/ApuPickerModal';
import type { ApuTemplate } from '../../apu/components/ApuPickerModal';
import { CubicacionModal } from './CubicacionModal';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import toast from 'react-hot-toast';

interface BudgetTableProps {
  stages: Stage[];
  onAddStage: () => void;
  onUpdateStage: (stageId: string, patch: Partial<Pick<Stage, 'name' | 'progress'>>) => void;
  onDuplicateStage: (stageId: string) => void;
  onDeleteStage: (stageId: string) => void;
  onAddItem: (stageId: string) => void;
  onUpdateItem: (stageId: string, itemId: string, patch: Partial<Omit<LineItem, 'id' | 'total'>>) => void;
  onDuplicateItem: (stageId: string, itemId: string) => void;
  onDeleteItem: (stageId: string, itemId: string) => void;
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
  mono?: boolean;
}

function EditableCell({ value, type = 'text', className = '', onChange, placeholder, align = 'left', bold, mono }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const start = () => { setEditing(true); setTimeout(() => ref.current?.select(), 0); };
  const stop = (e: React.FocusEvent<HTMLInputElement>) => { setEditing(false); onChange(e.target.value); };

  const monoClass = mono || type === 'number' ? 'font-mono tabular-nums' : '';

  return editing ? (
    <input
      ref={ref}
      defaultValue={value}
      type={type}
      onBlur={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') e.currentTarget.blur(); }}
      autoFocus
      placeholder={placeholder}
      className={`w-full bg-emerald-600/10 border border-emerald-500/40 rounded-md px-2 py-1 text-foreground text-sm outline-none text-${align} ${bold ? 'font-semibold' : ''} ${monoClass} ${className}`}
    />
  ) : (
    <div
      onClick={start}
      title="Clic para editar"
      className={`px-2 py-1 rounded-md hover:bg-muted/80 cursor-text transition-colors duration-150 text-sm text-${align} ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'} ${!value && value !== 0 ? 'text-muted-foreground/50 italic' : ''} ${monoClass} ${className}`}
    >
      {value !== '' && value !== 0 ? (type === 'number' ? Number(value).toLocaleString('es-CL') : value) : (
        <span className="text-muted-foreground/40 text-xs">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Unit Selector Cell ────────────────────────────────────────────────────
function UnitCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-muted-foreground text-sm font-mono border-none outline-none cursor-pointer hover:text-foreground transition-colors w-full"
    >
      {UNITS.map((u) => <option key={u} value={u} className="bg-card">{u}</option>)}
    </select>
  );
}

// ─── Stage Section ─────────────────────────────────────────────────────────
interface StageSectionProps {
  stage: Stage;
  onUpdateStage: (patch: Partial<Pick<Stage, 'name' | 'progress'>>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<Omit<LineItem, 'id' | 'total'>>) => void;
  onDuplicateItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

const columnHelper = createColumnHelper<LineItem>();

const StageSection = memo(function StageSection({
  stage,
  onUpdateStage,
  onDuplicate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
}: StageSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectingApuForItem, setSelectingApuForItem] = useState<string | null>(null);
  const [cubicandoItem, setCubicandoItem] = useState<LineItem | null>(null);
  const [cubicandoExecutionItem, setCubicandoExecutionItem] = useState<LineItem | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectApu = useCallback((apu: ApuTemplate) => {
    if (selectingApuForItem) {
      onUpdateItem(selectingApuForItem, {
        apu_template_id: apu.id,
        unit_price: apu.unit_cost,
        unit: apu.unit?.symbol || 'glb',
        is_price_overridden: false
      });
      setSelectingApuForItem(null);
      toast.success('Precio restaurado desde el APU base', { icon: '🔄' });
    }
  }, [selectingApuForItem, onUpdateItem]);

  const handleSaveCubication = useCallback((data: { 
    quantity: number; 
    cubication_mode: string; 
    dim_length?: number; 
    dim_width?: number; 
    dim_height?: number; 
    dim_thickness?: number; 
    dim_count?: number;
    dim_holes?: number;
    formula: string; 
    geometry_data: { area: number; perimetro: number; layer: string }; 
  }) => {
    if (cubicandoItem) {
      onUpdateItem(cubicandoItem.id, {
        quantity: data.quantity,
        cubication_mode: data.cubication_mode as LineItem['cubication_mode'],
        dim_length: data.dim_length,
        dim_width: data.dim_width,
        dim_height: data.dim_height,
        dim_thickness: data.dim_thickness,
        dim_count: data.dim_count,
        dim_holes: data.dim_holes,
        formula: data.formula,
        geometry_data: data.geometry_data,
      });
      setCubicandoItem(null);
      toast.success('Cubicación actualizada correctamente');
    }
  }, [cubicandoItem, onUpdateItem]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'itemType',
      header: () => <div className="text-center">Tipo</div>,
      cell: ({ row }) => {
        const type = row.original.item_type || 'material';
        const colors: Record<string, string> = {
          material: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
          labor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
          machinery: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
          subcontract: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
        };
        return (
          <select
            value={type}
            onChange={(e) => onUpdateItem(row.original.id, { item_type: e.target.value as LineItem['item_type'] })}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border cursor-pointer transition-colors ${colors[type] || colors.material}`}
          >
            <option value="material">M</option>
            <option value="labor">L</option>
            <option value="machinery">E</option>
            <option value="subcontract">S</option>
          </select>
        );
      },
      size: 40,
    }),
    columnHelper.display({
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <button
            onClick={() => toggleExpand(row.original.id)}
            className={`p-1 rounded-md transition-all duration-150 ${expandedItems.has(row.original.id) ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'}`}
          >
            <Info size={14} />
          </button>
        </div>
      ),
      size: 32,
    }),
    columnHelper.accessor('name', {
      header: 'Partida',
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-2">
          <EditableCell value={getValue() || ''} onChange={(v) => onUpdateItem(row.original.id, { name: v })} placeholder="Nombre de partida" />
          {row.original.apu_template_id && (
            <div title="Vinculado a APU" className="shrink-0">
              <Calculator size={12} className="text-blue-500" />
            </div>
          )}
          {row.original.ifc_global_id && (
            <div title={`Vinculado a IFC: ${row.original.ifc_global_id}`} className="shrink-0">
              <Box size={12} className={`${(row.original.quantity || 0) > 0 ? 'text-emerald-500' : 'text-slate-500'}`} />
            </div>
          )}
        </div>
      ),
      size: 250,
    }),
    columnHelper.accessor('quantity', {
      header: () => <div className="text-right font-mono">Cantidad</div>,
      cell: ({ row, getValue }) => (
        <div className="relative group flex justify-end">
          <EditableCell
            value={getValue() || 0}
            type="number"
            onChange={(v) => onUpdateItem(row.original.id, { quantity: parseFloat(v) || 0 })}
            align="right"
            bold
            mono
            className={row.original.formula ? "text-blue-400" : ""}
          />
          {row.original.formula && (
            <div className="absolute -top-1 -right-1" title={`Calculado: ${row.original.formula}`}>
              <Sigma size={10} className="text-blue-500 bg-card rounded-full" />
            </div>
          )}
        </div>
      ),
      size: 90,
    }),
    columnHelper.accessor('unit', {
      header: () => <div className="text-center font-mono">Unidad</div>,
      cell: ({ row, getValue }) => (
        <div className="px-1 text-center font-medium">
          <UnitCell value={getValue() as string} onChange={(v) => onUpdateItem(row.original.id, { unit: v })} />
        </div>
      ),
      size: 60,
    }),
    columnHelper.accessor('unit_price', {
      header: () => <div className="text-right font-mono">Costo Unit.</div>,
      cell: ({ row, getValue }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.is_price_overridden && (
             <span title="Precio modificado manualmente fuera del catálogo">
               <TriangleAlert size={14} className="text-amber-500 animate-pulse" />
             </span>
          )}
          <EditableCell
            value={getValue() || 0}
            type="number"
            onChange={(v) => {
              const num = parseFloat(v) || 0;
              if (num !== getValue()) {
                onUpdateItem(row.original.id, { unit_price: num, is_price_overridden: true });
                toast('Precio Unitario sobrescrito', { icon: '⚠️', style: { borderRadius: '10px', background: '#333', color: '#fff'} });
              }
            }}
            align="right"
            mono
            className={row.original.is_price_overridden ? "text-amber-400 font-bold" : "text-muted-foreground"}
          />
        </div>
      ),
      size: 110,
    }),
    columnHelper.accessor('total_price', {
      header: () => <div className="text-right font-mono">Total Est.</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-bold text-foreground font-mono tabular-nums px-2">
          {formatCLP(row.original.total_price || row.original.total || 0)}
        </div>
      ),
      size: 100,
    }),
    columnHelper.accessor('quantity_executed', {
      header: () => <div className="text-right font-mono text-emerald-400">Ejecutado</div>,
      cell: ({ row, getValue }) => (
        <div className="flex flex-col items-end px-2 relative group/exec">
          <EditableCell
            value={getValue() || 0}
            type="number"
            onChange={(v) => onUpdateItem(row.original.id, { quantity_executed: parseFloat(v) || 0 })}
            align="right"
            mono
            className="text-emerald-400 font-bold"
          />
          <button 
            onClick={() => setCubicandoExecutionItem(row.original)}
            className="absolute -right-6 top-1 text-emerald-500/30 hover:text-emerald-500 transition-all duration-150 opacity-0 group-hover/exec:opacity-100"
            title="Calcular avance ejecutado (CAD/Manual)"
          >
            <Ruler size={11} />
          </button>
          <div className="w-full h-1 bg-muted/50 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${(getValue() || 0) > (row.original.quantity || 1) ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, ((getValue() || 0) / (row.original.quantity || 1)) * 100)}%` }}
            />
          </div>
        </div>
      ),
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5">
          <button 
            onClick={() => setCubicandoItem(row.original)} 
            className="p-1.5 rounded-lg transition-all duration-150 text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10"
            title="Cubicación Inteligente (CAD/Manual)"
          >
            <Ruler size={13} />
          </button>
          <button onClick={() => onDuplicateItem(row.original.id)} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all duration-150">
            <Copy size={13} />
          </button>
          <button onClick={() => onDeleteItem(row.original.id)} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150">
            <Trash2 size={13} />
          </button>
        </div>
      ),
      size: 80,
    }),
  ], [expandedItems, onUpdateItem, onDuplicateItem, onDeleteItem, toggleExpand]);
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: stage.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const stageTotal = calcStageTotal(stage);

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-border/80 bg-card/50 shadow-lg shadow-black/[0.08] dark:shadow-black/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 backdrop-blur-sm border-b border-border/50">
        {/* Emerald accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/60 via-emerald-500/20 to-transparent" />

        <button onClick={() => setCollapsed((c) => !c)} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="flex-1 text-sm font-bold text-foreground">
          <EditableCell
            value={stage.name}
            onChange={(v) => onUpdateStage({ name: v })}
            placeholder="Nombre de etapa"
            bold
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono font-medium tabular-nums">{stage.progress}%</span>
          </div>
          <span className="text-sm font-bold text-foreground font-mono tabular-nums px-2 border-l border-border/50">
            {formatCLP(stageTotal)}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => { onAddItem(); toast.success('Nueva partida añadida'); }} className="text-xs bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 font-medium">
            <Plus size={12} /> Partida
          </button>
          <button onClick={() => { onDuplicate(); toast.success('Etapa duplicada'); }} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-lg transition-colors duration-150"><Copy size={13} /></button>
          <button onClick={() => { onDelete(); toast('Etapa eliminada', { icon: '🗑️'}); }} className="p-1.5 text-muted-foreground/50 hover:text-rose-400 rounded-lg transition-colors duration-150"><Trash2 size={13} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          {stage.items.length > 0 && (
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-muted/20 border-b border-border/50 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2.5 font-bold" style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className="border-b border-border/30 transition-colors duration-150 hover:bg-emerald-500/[0.03] dark:hover:bg-emerald-500/[0.04] group/row relative"
                      style={{ contain: 'content' }}
                    >
                      {/* Left accent bar on hover */}
                      <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500/0 group-hover/row:bg-emerald-500/40 transition-colors duration-200" style={{ padding: 0 }} />
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-1.5" style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Expansion Detail */}
                    {expandedItems.has(row.original.id) && (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <div className="bg-slate-950/40 dark:bg-slate-950/60 px-12 py-4 border-b border-border/30 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Box size={14} className="text-emerald-400" /> Sistema de Cubicación
                                  </h4>
                                  <div className="flex bg-muted rounded-lg p-1 border border-border/50">
                                    <button
                                      onClick={() => onUpdateItem(row.original.id, { cubication_mode: 'manual' })}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${row.original.cubication_mode === 'manual' || !row.original.cubication_mode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                      MANUAL
                                    </button>
                                    <button
                                      onClick={() => onUpdateItem(row.original.id, { cubication_mode: 'dimensions' })}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${row.original.cubication_mode === 'dimensions' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                      DIMENSIONES
                                    </button>
                                  </div>
                                </div>

                                {row.original.cubication_mode === 'dimensions' ? (
                                  <div className="grid grid-cols-4 gap-3">
                                    {[
                                      { label: 'Largo', key: 'dim_length' },
                                      { label: 'Ancho', key: 'dim_width' },
                                      { label: 'Alto', key: 'dim_height' },
                                      { label: 'Espesor', key: 'dim_thickness' }
                                    ].map((dim) => (
                                      <div key={dim.key}>
                                        <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wide">{dim.label}</label>
                                        <input
                                          type="number"
                                          value={(row.original as unknown as Record<string, unknown>)[dim.key] as number || 0}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const next = { ...row.original, [dim.key]: val };
                                            const q = (next.dim_length || 1) * (next.dim_width || 1) * (next.dim_height || 1) * (next.dim_thickness || 1);
                                            onUpdateItem(row.original.id, { [dim.key]: val, quantity: q });
                                          }}
                                          className="w-full bg-muted border border-border/50 rounded-lg px-2 py-1.5 text-foreground text-sm font-mono tabular-nums outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground/60 italic">Modo de entrada manual activado. Ingrese la cantidad directamente en la tabla.</p>
                                )}
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                  <Calculator size={14} className="text-emerald-400" /> Vinculación APU
                                </h4>
                                
                                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="text-foreground text-sm font-bold">{row.original.apu_template_id ? 'Análisis Vinculado' : 'Sin Análisis'}</p>
                                    <p className="text-muted-foreground/70 text-xs mt-1">
                                      {row.original.apu_template_id 
                                        ? 'Los costos pueden sincronizarse automáticamente con la biblioteca.' 
                                        : 'Vincule una partida de la biblioteca para calcular costos reales de materiales y labor.'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setSelectingApuForItem(row.original.id)}
                                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 px-4"
                                    >
                                      <Calculator size={14} />
                                      {row.original.apu_template_id ? 'Cambiar APU' : 'Vincular APU'}
                                    </button>
                                    {row.original.apu_template_id && (
                                      <button 
                                        onClick={() => onUpdateItem(row.original.id, { apu_template_id: undefined, is_price_overridden: true })}
                                        className="p-2.5 bg-muted hover:bg-muted-foreground/10 text-muted-foreground border border-border rounded-xl transition-all duration-150"
                                        title="Desvincular APU"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                                  <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 size={14} className="text-emerald-400" />
                                      <span className="text-xs text-muted-foreground">Avance: </span>
                                      <span className="text-xs font-bold text-foreground font-mono tabular-nums">
                                        {((row.original.quantity_executed || 0) / (row.original.quantity || 1) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/50 uppercase font-medium tracking-wide">Partida: {row.original.name}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          <button onClick={() => { onAddItem(); toast.success('Nueva partida añadida'); }} className="w-full flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground/50 hover:text-emerald-500 hover:bg-emerald-500/[0.03] transition-all duration-150 font-medium">
            <Plus size={14} /> Añadir partida a etapa
          </button>
        </div>
      )}

      {selectingApuForItem && (
        <ApuPickerModal 
          onSelect={handleSelectApu} 
          onClose={() => setSelectingApuForItem(null)} 
        />
      )}

      {cubicandoItem && (
        <CubicacionModal
          isOpen={!!cubicandoItem}
          onClose={() => setCubicandoItem(null)}
          onSave={handleSaveCubication}
          itemName={cubicandoItem.name}
          unit={cubicandoItem.unit}
          initialData={cubicandoItem}
        />
      )}

      {cubicandoExecutionItem && (
        <CubicacionModal
          isOpen={!!cubicandoExecutionItem}
          onClose={() => setCubicandoExecutionItem(null)}
          onSave={(data) => {
            onUpdateItem(cubicandoExecutionItem.id, { quantity_executed: data.quantity });
            setCubicandoExecutionItem(null);
            toast.success('Avance ejecutado actualizado');
          }}
          itemName={`${cubicandoExecutionItem.name} (EJECUCIÓN)`}
          unit={cubicandoExecutionItem.unit}
          budgetedLimit={cubicandoExecutionItem.quantity}
          initialData={{ ...cubicandoExecutionItem, quantity: cubicandoExecutionItem.quantity_executed }}
        />
      )}
    </div>
  );
});

// ─── Main BudgetTable ────────────────────────────────────────────────────────
export function BudgetTable({
  stages,
  onAddStage,
  onUpdateStage,
  onDuplicateStage,
  onDeleteStage,
  onAddItem,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
}: BudgetTableProps) {
  return (
    <div className="flex-1 min-w-0">
      {stages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Comienza a construir"
          description="Crea tu primera etapa del proyecto para empezar a añadir partidas de obra."
          size="lg"
          primaryAction={{
            label: 'Crear Primera Etapa',
            onClick: () => { onAddStage(); toast.success('Primera etapa creada'); }
          }}
        />
      ) : (
        <div className="space-y-6">
          {stages.map((stage) => (
            <StageSection
              key={stage.id}
              stage={stage}
              onUpdateStage={(p) => onUpdateStage(stage.id, p)}
              onDuplicate={() => onDuplicateStage(stage.id)}
              onDelete={() => onDeleteStage(stage.id)}
              onAddItem={() => onAddItem(stage.id)}
              onUpdateItem={(itemId, p) => onUpdateItem(stage.id, itemId, p)}
              onDuplicateItem={(itemId) => onDuplicateItem(stage.id, itemId)}
              onDeleteItem={(itemId) => onDeleteItem(stage.id, itemId)}
            />
          ))}

          <button
            onClick={() => { onAddStage(); toast.success('Nueva etapa añadida'); }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60 hover:text-emerald-500 hover:bg-emerald-500/[0.03] py-6 rounded-2xl border-2 border-dashed border-border/30 hover:border-emerald-500/30 w-full transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-200">
              <Plus size={16} />
            </div>
            Añadir Nueva Etapa de Obra
          </button>
        </div>
      )}
    </div>
  );
}
