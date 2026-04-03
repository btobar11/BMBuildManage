import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, X, Calculator, Package, HardHat, Wrench, Check } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: 'material' | 'labor' | 'equipment';
  unit: string;
  base_price: number;
}

interface ApuResourceEntry {
  resource_id: string;
  resource_type: string;
  coefficient: number;
  resource?: Resource;
}

export interface ApuTemplate {
  id: string;
  name: string;
  unit_id: string;
  unit?: { id: string; name: string; symbol: string };
  description?: string;
  unit_cost: number;
  apu_resources: ApuResourceEntry[];
}

interface ApuPickerModalProps {
  onSelect: (apu: ApuTemplate) => void;
  onClose: () => void;
}

export function ApuPickerModal({ onSelect, onClose }: ApuPickerModalProps) {
  const [search, setSearch] = useState('');

  const { data: apus = [], isLoading } = useQuery<ApuTemplate[]>({
    queryKey: ['apu-templates', search],
    queryFn: () => api.get('/apu', { params: { search: search || undefined } }).then((r) => r.data),
  });

  const formatCLP = (v: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-background border border-border/50 rounded-2xl w-full max-w-2xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calculator size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">Biblioteca de APU</h3>
              <p className="text-muted-foreground text-xs">Selecciona un análisis de precio unitario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de partida (ej: Hormigón, Pintura...)"
              className="w-full bg-card border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-foreground text-sm outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-muted-foreground text-xs">Cargando biblioteca...</p>
            </div>
          ) : apus.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="text-gray-800 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No se encontraron análisis de precios</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {apus.map((apu) => (
                <button
                  key={apu.id}
                  onClick={() => onSelect(apu)}
                  className="w-full p-4 rounded-xl bg-white/5 hover:bg-muted border border-border hover:border-blue-500/30 transition-all text-left group flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground font-bold text-sm tracking-tight">{apu.name}</span>
                      <span className="text-[10px] bg-muted border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                        {apu.unit?.symbol ?? '-'}
                      </span>
                    </div>
                    {apu.description && (
                      <p className="text-muted-foreground text-xs line-clamp-1 mb-2">{apu.description}</p>
                    )}
                    <div className="flex gap-2">
                      {apu.apu_resources?.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-black/50 px-1.5 py-0.5 rounded">
                           {r.resource_type === 'material' && <Package size={10} className="text-blue-400" />}
                           {r.resource_type === 'labor' && <HardHat size={10} className="text-violet-400" />}
                           {r.resource_type === 'equipment' && <Wrench size={10} className="text-amber-400" />}
                           <span className="truncate max-w-[80px]">{r.resource?.name}</span>
                        </div>
                      ))}
                      {apu.apu_resources?.length > 3 && (
                        <span className="text-[10px] text-muted-foreground flex items-center">+{apu.apu_resources.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-muted-foreground mb-1">Costo Unit.</div>
                    <div className="text-emerald-400 font-black text-sm tracking-tighter">
                      {formatCLP(apu.unit_cost)}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex justify-end">
                      <div className="bg-blue-600 rounded-full p-1 text-white">
                        <Check size={12} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            ConstruPresupuestos • MVP v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
