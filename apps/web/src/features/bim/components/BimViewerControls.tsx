import { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Box, 
  Maximize2,
  Ruler,
  Scissors,
  Trash2
} from 'lucide-react';
import type { BimEngineControls } from '../types';

interface BimViewerControlsProps {
  controls: BimEngineControls;
  isModelLoaded: boolean;
}

export function BimViewerControls({ controls, isModelLoaded }: BimViewerControlsProps) {
  const [measuring, setMeasuring] = useState(false);

  if (!isModelLoaded) return null;

  const toggleMeasure = () => {
    const newState = !measuring;
    setMeasuring(newState);
    controls.toggleMeasurement(newState);
  };

  const buttons = [
    { icon: <ZoomIn size={16} />, label: 'Zoom In', action: controls.zoomIn },
    { icon: <ZoomOut size={16} />, label: 'Zoom Out', action: controls.zoomOut },
    { icon: <RotateCcw size={16} />, label: 'Reset View', action: controls.resetView },
    { icon: <Box size={16} />, label: 'Proyección', action: controls.toggleProjection },
    { icon: <Maximize2 size={16} />, label: 'Ajustar', action: controls.fitToModel },
    { icon: <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />, label: '', action: () => {} },
    { icon: <Ruler size={16} className={measuring ? 'text-emerald-500' : ''} />, label: 'Medir Distancia', action: toggleMeasure },
    { icon: <Scissors size={16} />, label: 'Añadir Plano de Corte', action: controls.createClippingPlane },
    { icon: <Trash2 size={16} />, label: 'Borrar Cortes y Medidas', action: () => {
        controls.deleteClippingPlanes();
        // Disabling and re-enabling clears measurements in LengthMeasurement
        controls.toggleMeasurement(false);
        setMeasuring(false);
      } 
    },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-xl backdrop-blur-xl bg-card/70 border border-border shadow-xl shadow-black/10">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            btn.action();
          }}
          title={btn.label}
          className={`flex items-center justify-center ${btn.label ? 'w-9 h-9 hover:bg-muted/80 active:scale-90' : 'w-auto cursor-default'} rounded-lg text-muted-foreground hover:text-foreground transition-all`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
