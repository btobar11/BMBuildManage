import React, { useState } from 'react';
import { TEMPLATES } from '../templates';
import { X, Layers } from 'lucide-react';
import type { Template } from '../templates';

interface Props {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Layers size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Plantillas</h2>
              <p className="text-gray-400 text-xs">Selecciona para pre-cargar etapas y partidas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { onSelect(t); onClose(); }}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                hovered === t.id
                  ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <p className="text-white font-semibold text-sm mb-1">{t.name}</p>
              <p className="text-gray-400 text-xs">{t.stages.length} etapas · {t.stages.reduce((s, st) => s + st.items.length, 0)} partidas</p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
        >
          Empezar desde cero
        </button>
      </div>
    </div>
  );
}
