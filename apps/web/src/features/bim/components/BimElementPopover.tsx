/**
 * BimElementPopover — Floating panel showing detected IFC element data
 * 
 * Glassmorphism design with:
 * - Category icon and IFC class
 * - Element name and GlobalId
 * - Extracted quantities table (Volume, Area, Length)
 * - "Link to Budget Item" action button
 */
import { X, Link2, Box, Columns3, Move3D, Ruler, ArrowRight, Layers, Hash, CopyCheck } from 'lucide-react';
import type { BimSelectedElement } from '../types';
import { getRecommendedQuantity, IFC_CATEGORY_UNITS } from '../types';
import { useState } from 'react';

interface BimElementPopoverProps {
  element: BimSelectedElement;
  onClose: () => void;
  onLinkToItem: () => void;
}

// Category colors for IFC types
const CATEGORY_COLORS: Record<string, string> = {
  IfcWall: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-500',
  IfcWallStandardCase: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-500',
  IfcSlab: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-500',
  IfcColumn: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-500',
  IfcBeam: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-500',
  IfcFooting: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-500',
  IfcRoof: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-500',
  IfcDoor: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-500',
  IfcWindow: 'from-sky-500/20 to-sky-600/5 border-sky-500/30 text-sky-500',
  IfcStair: 'from-pink-500/20 to-pink-600/5 border-pink-500/30 text-pink-500',
};

const getColor = (category: string) =>
  CATEGORY_COLORS[category] || 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-500';

function formatQuantity(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('es-CL', { maximumFractionDigits: 3, minimumFractionDigits: 2 })} ${unit}`;
}

export function BimElementPopover({ element, onClose, onLinkToItem }: BimElementPopoverProps) {
  const [copiedId, setCopiedId] = useState(false);
  const recommended = getRecommendedQuantity(element);
  const colorClass = getColor(element.category);
  const categoryLabel = IFC_CATEGORY_UNITS[element.category]?.label || element.category.replace('Ifc', '');

  const copyGlobalId = () => {
    navigator.clipboard.writeText(element.globalId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Build quantities list (only show non-null values)
  const quantityRows: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }[] = [];

  if (element.quantities.netVolume !== null) {
    quantityRows.push({
      icon: <Box size={13} className="text-amber-400" />,
      label: 'Volumen Neto',
      value: formatQuantity(element.quantities.netVolume, 'm³'),
      highlight: recommended.unit === 'm3',
    });
  }
  if (element.quantities.grossVolume !== null) {
    quantityRows.push({
      icon: <Box size={13} className="text-amber-300/60" />,
      label: 'Volumen Bruto',
      value: formatQuantity(element.quantities.grossVolume, 'm³'),
    });
  }
  if (element.quantities.netArea !== null) {
    quantityRows.push({
      icon: <Columns3 size={13} className="text-blue-400" />,
      label: 'Área Neta',
      value: formatQuantity(element.quantities.netArea, 'm²'),
      highlight: recommended.unit === 'm2',
    });
  }
  if (element.quantities.netSideArea !== null) {
    quantityRows.push({
      icon: <Columns3 size={13} className="text-blue-300/60" />,
      label: 'Área Lateral Neta',
      value: formatQuantity(element.quantities.netSideArea, 'm²'),
    });
  }
  if (element.quantities.length !== null) {
    quantityRows.push({
      icon: <Ruler size={13} className="text-emerald-400" />,
      label: 'Longitud',
      value: formatQuantity(element.quantities.length, 'ml'),
      highlight: recommended.unit === 'ml',
    });
  }
  if (element.quantities.height !== null) {
    quantityRows.push({
      icon: <Move3D size={13} className="text-violet-400" />,
      label: 'Altura',
      value: formatQuantity(element.quantities.height, 'm'),
    });
  }
  if (element.quantities.width !== null) {
    quantityRows.push({
      icon: <Move3D size={13} className="text-violet-300/60" />,
      label: 'Ancho',
      value: formatQuantity(element.quantities.width, 'm'),
    });
  }
  if (element.quantities.perimeter !== null) {
    quantityRows.push({
      icon: <Ruler size={13} className="text-cyan-400" />,
      label: 'Perímetro',
      value: formatQuantity(element.quantities.perimeter, 'ml'),
    });
  }

  return (
    <div
      data-bim-overlay
      className="absolute bottom-20 right-4 z-30 w-[340px] rounded-2xl overflow-hidden border border-border/80 shadow-2xl shadow-black/30 backdrop-blur-xl bg-card/90 animate-in slide-in-from-bottom-4 fade-in duration-400"
    >
      {/* Header with category badge */}
      <div className={`relative px-5 pt-5 pb-4 border-b border-border/50 bg-gradient-to-r ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colorClass}`}>
            {categoryLabel}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{element.category}</span>
        </div>

        {/* Element name */}
        <h3 className="text-sm font-bold text-foreground leading-tight truncate pr-6">
          {element.name}
        </h3>
        {element.objectType && element.objectType !== element.name && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {element.objectType}
          </p>
        )}

        {/* GlobalId */}
        <div className="flex items-center gap-2 mt-2">
          <Hash size={10} className="text-muted-foreground" />
          <button
            onClick={copyGlobalId}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Copiar GlobalId"
          >
            {element.globalId.substring(0, 22)}
            {copiedId ? (
              <CopyCheck size={10} className="text-emerald-400" />
            ) : null}
          </button>
        </div>
      </div>

      {/* Quantities Section */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={12} className="text-muted-foreground" />
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Cantidades IFC
          </h4>
        </div>

        {quantityRows.length > 0 ? (
          <div className="space-y-1.5">
            {quantityRows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  row.highlight
                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {row.icon}
                  <span className={`text-xs ${row.highlight ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {row.label}
                  </span>
                </div>
                <span className={`text-xs font-mono tabular-nums ${
                  row.highlight ? 'font-black text-indigo-500 dark:text-indigo-400' : 'font-bold text-foreground'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground italic">
              No se encontraron cantidades para este elemento.
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              El modelo IFC puede no incluir BaseQuantities.
            </p>
          </div>
        )}

        {/* Recommended quantity highlight */}
        {recommended.value !== null && (
          <div className="mt-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Valor Recomendado
              </span>
              <div className="text-lg font-black text-foreground tabular-nums">
                {recommended.value.toLocaleString('es-CL', { maximumFractionDigits: 3 })}
                <span className="text-xs font-bold text-indigo-400 ml-1">{recommended.unit}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-5 pb-5">
        <button
          onClick={onLinkToItem}
          className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/25 group"
        >
          <Link2 size={14} className="group-hover:rotate-[-15deg] transition-transform" />
          Vincular a Partida del Presupuesto
          <ArrowRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
