import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Link2, HardHat, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardEmptyStateProps {
  onFileUpload?: (file: File) => void;
  onCreateProject?: () => void;
}

export const DashboardEmptyState = ({ onFileUpload, onCreateProject }: DashboardEmptyStateProps) => {
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.name.endsWith('.ifc')) {
        onFileUpload?.(file);
      } else {
        // Silently ignore unsupported files
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive: isDropActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.ifc'],
      'model/x-ifc': ['.ifc'],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Bento Grid Layout */}
        <div className="grid gap-6">
          {/* Main Dropzone Card */}
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              ¿Qué quieres hacer hoy?
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Comienza importando un modelo IFC o creando un presupuesto desde cero
            </p>

            {/* Dropzone */}
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer
                ${isDropActive || isDragActive 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 animate-pulse' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }
              `}
            >
              <input {...getInputProps()} />
              
              <div className={`space-y-4 ${isDropActive ? 'scale-105' : ''} transition-transform`}>
                <div className={`
                  w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all
                  ${isDropActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }
                `}>
                  <Upload size={28} />
                </div>
                
                <div>
                  <p className="font-medium text-foreground">
                    {isDropActive ? '¡Suelta el archivo!' : 'Arrastra tu modelo IFC aquí'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    o haz clic para seleccionar un archivo
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileText size={14} />
                  <span>Archivos IFC soportados</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors hover-lift"
              >
                <Plus size={20} />
                Crear Presupuesto
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 hover:border-emerald-200 transition-colors hover-lift">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Upload size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Sube tu IFC</h3>
              <p className="text-sm text-muted-foreground">
                Importa modelos 3D de Revit, ArchiCAD u otros software BIM
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 hover:border-emerald-200 transition-colors hover-lift">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
                <Link2 size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Vincula Partidas</h3>
              <p className="text-sm text-muted-foreground">
                Conecta elementos del modelo con tu presupuesto APU
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 hover:border-emerald-200 transition-colors hover-lift">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                <HardHat size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Gestiona en Terreno</h3>
              <p className="text-sm text-muted-foreground">
                Controla avance, costos y recursos desde cualquier lugar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
