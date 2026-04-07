import { useState, useCallback } from 'react';
import { type MarkupConfig, useMarkup } from '../../hooks/useMarkup';
import { Can } from '../auth/Can';

interface MarkupPanelProps {
  directCost: number;
  onMarkupChange?: (unitPrice: number, config: MarkupConfig) => void;
  initialConfig?: Partial<MarkupConfig>;
  currency?: string;
  compact?: boolean;
}

/**
 * MarkupPanel — Visual component for configuring margin & viewing price breakdown.
 *
 * Usage:
 *   <MarkupPanel
 *     directCost={totalCost}
 *     onMarkupChange={(price, config) => updateBudget(price, config)}
 *   />
 */
export function MarkupPanel({
  directCost,
  onMarkupChange,
  initialConfig,
  currency = 'CLP',
  compact = false,
}: MarkupPanelProps) {
  const { config, setConfig, calculate, formatResult } = useMarkup(initialConfig);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const result = calculate(directCost);
  const formatted = formatResult(result, currency);

  const handleChange = useCallback(
    (field: keyof MarkupConfig, value: number | boolean) => {
      const newConfig = { ...config, [field]: value };
      setConfig(newConfig);
      if (onMarkupChange) {
        const newResult = calculate(directCost);
        onMarkupChange(newResult.totalPrice, newConfig);
      }
    },
    [config, setConfig, calculate, directCost, onMarkupChange],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            💰 Precio de Venta
          </span>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            {formatted.markupFactor}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-900">
            {formatted.totalPrice}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Sliders — only for users with set_markup permission */}
          <Can do="set_markup">
            <div className="space-y-3">
              <SliderField
                label="Gastos Generales"
                value={config.overhead}
                onChange={(v) => handleChange('overhead', v)}
                min={0} max={30} step={0.5}
                color="text-blue-600"
              />
              <SliderField
                label="Margen de Utilidad"
                value={config.profitMargin}
                onChange={(v) => handleChange('profitMargin', v)}
                min={0} max={50} step={0.5}
                color="text-emerald-600"
              />
              <SliderField
                label={`IVA (${config.taxRate}%)`}
                value={config.taxRate}
                onChange={(v) => handleChange('taxRate', v)}
                min={0} max={25} step={1}
                color="text-orange-600"
                disabled
              />
            </div>
            <hr className="border-slate-100" />
          </Can>

          {/* Breakdown */}
          <div className="space-y-1.5 text-sm">
            <BreakdownRow label="Costo Directo" value={formatted.directCost} />
            <BreakdownRow label={`Gastos Generales (${config.overhead}%)`} value={formatted.overhead} muted />
            <BreakdownRow label={`Utilidad (${config.profitMargin}%)`} value={formatted.profitMargin} muted />
            <BreakdownRow label="Subtotal" value={formatted.subtotal} bold />
            <BreakdownRow label={`IVA (${config.taxRate}%)`} value={formatted.tax} muted />
            <div className="border-t border-slate-200 pt-2">
              <BreakdownRow label="PRECIO TOTAL" value={formatted.totalPrice} highlight />
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Margen efectivo: {formatted.effectiveMargin}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  color: string;
  disabled?: boolean;
}

function SliderField({ label, value, onChange, min, max, step, color, disabled }: SliderFieldProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-slate-600">{label}</label>
        <span className={`text-xs font-semibold ${color}`}>{value}%</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full accent-current cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  highlight?: boolean;
}

function BreakdownRow({ label, value, muted, bold, highlight }: BreakdownRowProps) {
  return (
    <div className={`flex justify-between items-center ${highlight ? 'bg-emerald-50 -mx-1 px-1 py-1 rounded-lg' : ''}`}>
      <span className={`${muted ? 'text-slate-400' : bold || highlight ? 'font-semibold text-slate-800' : 'text-slate-600'} ${highlight ? 'text-emerald-800 font-bold' : ''}`}>
        {label}
      </span>
      <span className={`font-mono ${muted ? 'text-slate-400' : bold ? 'font-semibold text-slate-800' : 'text-slate-700'} ${highlight ? 'font-bold text-emerald-700' : ''}`}>
        {value}
      </span>
    </div>
  );
}
