/**
 * BimViewerControls — Floating camera control buttons
 * Positioned over the 3D canvas with glassmorphism styling
 */
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Box, 
  Maximize2 
} from 'lucide-react';
import type { BimEngineControls } from '../types';

interface BimViewerControlsProps {
  controls: BimEngineControls;
  isModelLoaded: boolean;
}

export function BimViewerControls({ controls, isModelLoaded }: BimViewerControlsProps) {
  if (!isModelLoaded) return null;

  const buttons = [
    { icon: <ZoomIn size={16} />, label: 'Zoom In', action: controls.zoomIn },
    { icon: <ZoomOut size={16} />, label: 'Zoom Out', action: controls.zoomOut },
    { icon: <RotateCcw size={16} />, label: 'Reset View', action: controls.resetView },
    { icon: <Box size={16} />, label: 'Proyección', action: controls.toggleProjection },
    { icon: <Maximize2 size={16} />, label: 'Ajustar', action: controls.fitToModel },
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
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-90"
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
