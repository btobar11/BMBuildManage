/**
 * BimLegend — Módulo 3: Legend & Filters
 *
 * Floating legend overlay for the 3D viewer showing color states
 * and a toggle to hide cubicated elements.
 */
import { Eye, EyeOff } from 'lucide-react';

interface BimLegendProps {
  stats: {
    cubicated: number;
    pending: number;
    total: number;
    percentage: number;
  };
  hideCubicated: boolean;
  onToggleHideCubicated: (value: boolean) => void;
  selectedInfo?: { name: string; stage: string } | null;
}

// ─── Custom Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 group cursor-pointer"
    >
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-emerald-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
}

// ─── Legend Component ──────────────────────────────────────────────────────────

export function BimLegend({
  stats,
  hideCubicated,
  onToggleHideCubicated,
  selectedInfo,
}: BimLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[260px]">
        {/* Progress bar */}
        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Title row */}
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
              Estado BIM
            </span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              {stats.percentage}% cubicado
            </span>
          </div>

          {/* Color legend dots */}
          <div className="flex items-center gap-5">
            <LegendDot
              color="#10B981"
              label="Cubicado"
              count={stats.cubicated}
              opacity={0.85}
            />
            <LegendDot
              color="#6B7280"
              label="Pendiente"
              count={stats.pending}
              opacity={1}
            />
            <LegendDot
              color="#F97316"
              label="Selección"
              opacity={1}
            />
          </div>

          {/* Selected element info */}
          {selectedInfo && (
            <>
              <div className="h-px bg-white/10" />
              <div className="bg-orange-500/10 rounded-lg px-3 py-2 border border-orange-500/20">
                <div className="text-[10px] font-bold uppercase text-orange-400/80 tracking-wider mb-0.5">
                  Elemento Seleccionado
                </div>
                <div className="text-xs font-semibold text-white truncate">{selectedInfo.name}</div>
                <div className="text-[10px] text-white/50 truncate">{selectedInfo.stage}</div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Filter toggle */}
          <div className="flex items-center justify-between">
            <ToggleSwitch
              checked={hideCubicated}
              onChange={onToggleHideCubicated}
              label="Ocultar Cubicados"
            />
            <div className="flex items-center gap-1 text-white/40">
              {hideCubicated ? (
                <EyeOff size={12} className="text-emerald-400" />
              ) : (
                <Eye size={12} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LegendDot({
  color,
  label,
  count,
  opacity = 1,
}: {
  color: string;
  label: string;
  count?: number;
  opacity?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
        style={{ backgroundColor: color, opacity }}
      />
      <span className="text-[10px] font-semibold text-white/70">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-bold text-white/40 tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}
