import React, { useState, useRef } from 'react';
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
  GripVertical,
  AlertTriangle,
} from 'lucide-react';

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
  estimatedCostByStage?: Record<string, number>; // for over-budget alert
}

// Inline-editable cell – behaves like an Excel cell
interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  className?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
  bold?: boolean;
}

function EditableCell({ value, type = 'text', className = '', onChange, placeholder, align = 'left', bold }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const start = () => { setEditing(true); setTimeout(() => ref.current?.select(), 0); };
  const stop = (e: React.FocusEvent<HTMLInputElement>) => { setEditing(false); onChange(e.target.value); };

  return editing ? (
    <input
      ref={ref}
      defaultValue={value}
      type={type}
      onBlur={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') e.currentTarget.blur(); }}
      autoFocus
      placeholder={placeholder}
      className={`w-full bg-blue-600/20 border border-blue-500/60 rounded px-1.5 py-0.5 text-white text-sm outline-none text-${align} ${bold ? 'font-semibold' : ''} ${className}`}
    />
  ) : (
    <div
      onClick={start}
      title="Clic para editar"
      className={`px-1.5 py-0.5 rounded hover:bg-white/10 cursor-text transition-colors text-sm text-${align} ${bold ? 'font-semibold text-white' : 'text-gray-300'} ${!value && value !== 0 ? 'text-gray-600 italic' : ''} ${className}`}
    >
      {value !== '' && value !== 0 ? (type === 'number' ? Number(value).toLocaleString('es-CL') : value) : (
        <span className="text-gray-600 text-xs">{placeholder}</span>
      )}
    </div>
  );
}

// Unit dropdown cell
function UnitCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-gray-300 text-sm border-none outline-none cursor-pointer hover:text-white transition-colors w-full"
    >
      {UNITS.map((u) => <option key={u} value={u} className="bg-gray-800">{u}</option>)}
    </select>
  );
}

// Single stage section
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

function StageSection({
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const stageTotal = calcStageTotal(stage);
  const isOver = false; // could compare with budget allocation later

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-white/8 bg-gray-900/50">
      {/* Stage header */}
      <div className={`flex items-center gap-2 px-4 py-3 ${isOver ? 'bg-rose-900/30' : 'bg-gray-800/60'} backdrop-blur-sm`}>
        <button onClick={() => setCollapsed((c) => !c)} className="text-gray-400 hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="flex-1 text-sm font-bold text-white">
          <EditableCell
            value={stage.name}
            onChange={(v) => onUpdateStage({ name: v })}
            placeholder="Nombre de etapa"
            bold
          />
        </div>

        {/* Progress badge */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${stage.progress}%` }}
            />
          </div>
          <span className="w-8 text-right">{stage.progress}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={stage.progress}
            onChange={(e) => onUpdateStage({ progress: Number(e.target.value) })}
            className="w-16 accent-blue-500 cursor-pointer"
            title="Progreso"
          />
        </div>

        <span className="text-sm font-bold text-white tabular-nums ml-2">
          {formatCLP(stageTotal)}
        </span>

        {isOver && <AlertTriangle size={14} className="text-amber-400" />}

        {/* Stage actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onAddItem}
            title="Añadir partida"
            className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Partida
          </button>
          <button onClick={onDuplicate} title="Duplicar etapa" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors">
            <Copy size={13} />
          </button>
          <button onClick={onDelete} title="Eliminar etapa" className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Items table */}
      {!collapsed && (
        <div>
          {/* Header */}
          {stage.items.length > 0 && (
            <div className="grid grid-cols-[1fr_80px_72px_120px_120px_80px] gap-0 px-4 py-1.5 bg-gray-800/40 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Partida</span>
              <span className="text-right">Cantidad</span>
              <span className="text-center">Unidad</span>
              <span className="text-right">Precio Unit.</span>
              <span className="text-right">Total</span>
              <span />
            </div>
          )}

          {stage.items.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`grid grid-cols-[1fr_80px_72px_120px_120px_80px] gap-0 items-center px-4 py-1 border-b border-white/5 transition-colors ${
                hoveredItem === item.id ? 'bg-white/3' : ''
              }`}
            >
              <EditableCell
                value={item.name}
                onChange={(v) => onUpdateItem(item.id, { name: v })}
                placeholder="Nombre de partida"
              />
              <EditableCell
                value={item.quantity}
                type="number"
                onChange={(v) => onUpdateItem(item.id, { quantity: parseFloat(v) || 0 })}
                align="right"
              />
              <div className="px-1.5">
                <UnitCell value={item.unit} onChange={(v) => onUpdateItem(item.id, { unit: v })} />
              </div>
              <EditableCell
                value={item.unitPrice}
                type="number"
                onChange={(v) => onUpdateItem(item.id, { unitPrice: parseFloat(v) || 0 })}
                align="right"
              />
              <div className="text-right text-sm font-bold text-white tabular-nums px-1.5">
                {formatCLP(item.total)}
              </div>

              {/* Item actions – visible on hover */}
              <div className={`flex items-center justify-end gap-0.5 transition-opacity ${hoveredItem === item.id ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => onDuplicateItem(item.id)}
                  title="Duplicar"
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  title="Eliminar"
                  className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Add item row */}
          <button
            onClick={onAddItem}
            className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-gray-600 hover:text-blue-400 hover:bg-blue-500/5 transition-colors"
          >
            <Plus size={13} /> Añadir partida
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main BudgetTable ─────────────────────────────────────────────────────

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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <GripVertical size={28} className="text-blue-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">Sin etapas</h3>
          <p className="text-gray-500 text-sm mb-4">Crea tu primera etapa o aplica una plantilla</p>
          <button
            onClick={onAddStage}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Nueva etapa
          </button>
        </div>
      ) : (
        <>
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
            onClick={onAddStage}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-400 hover:bg-blue-500/5 px-4 py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/30 w-full transition-all"
          >
            <Plus size={15} /> Añadir etapa
          </button>
        </>
      )}
    </div>
  );
}
