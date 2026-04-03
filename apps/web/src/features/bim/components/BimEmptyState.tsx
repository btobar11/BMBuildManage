/**
 * BimEmptyState — Professional fallback when no BIM model exists
 * Invites the user to upload an IFC file
 */
import { Box, Upload } from 'lucide-react';

interface BimEmptyStateProps {
  onUploadClick: () => void;
}

export function BimEmptyState({ onUploadClick }: BimEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-12 text-center">
      {/* Animated 3D Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-indigo-500/10 shadow-lg shadow-indigo-500/5">
          <Box
            size={40}
            className="text-indigo-500 dark:text-indigo-400 animate-pulse"
            strokeWidth={1.5}
          />
        </div>
        {/* Subtle floating particles */}
        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-indigo-400/30 animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-blue-400/30 animate-bounce" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-cyan-400/30 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Text */}
      <h3 className="text-xl font-bold text-foreground mb-2">
        Visor BIM 3D
      </h3>
      <p className="text-muted-foreground max-w-md mb-2 text-sm leading-relaxed">
        No hay modelo BIM cargado para este proyecto. Sube un archivo <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">.ifc</code> para 
        visualizar la geometría 3D del proyecto directamente en el navegador.
      </p>
      <p className="text-muted-foreground/60 text-xs mb-8">
        Formatos soportados: IFC 2x3, IFC4 · Tamaño máx: 50MB
      </p>

      {/* Upload CTA */}
      <button
        onClick={onUploadClick}
        className="group flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
      >
        <Upload
          size={18}
          className="group-hover:-translate-y-0.5 transition-transform"
        />
        Subir Modelo IFC
      </button>
    </div>
  );
}
