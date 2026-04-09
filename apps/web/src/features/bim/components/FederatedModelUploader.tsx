/**
 * FederatedModelUploader — Multi-Discipline BIM/CAD File Upload Component
 * 
 * Extends BimModelUploader with:
 * - Support for multiple file types (IFC, DXF, PDF)
 * - Discipline classification (Architecture, Structure, MEP, etc.)
 * - Bulk upload capabilities for federated models
 * - Real-time progress tracking per model
 * - Visual discipline indicators with color coding
 */
import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X, 
  Plus,
  Building2,
  Zap,
  Wrench,
  MapPin,
  FileText,
  Settings,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { ModelDiscipline } from '../hooks/useFederatedBimEngine';
import { uploadModel } from '../services/bimStorageService';
import type { ProjectModel } from '../types';

interface PendingUpload {
  id: string;
  file: File;
  discipline: ModelDiscipline;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error' | 'conversion_needed';
  progress: number;
  error?: string;
  model?: ProjectModel;
  conversionInfo?: {
    format: string;
    guidance: string;
  };
}

interface FederatedModelUploaderProps {
  projectId: string;
  companyId: string;
  onUploadSuccess: (models: ProjectModel[]) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowedDisciplines?: ModelDiscipline[];
}

type FileType = 'ifc' | 'dxf' | 'pdf';

const DISCIPLINE_ICONS: Record<ModelDiscipline, any> = {
  [ModelDiscipline.ARCHITECTURE]: Building2,
  [ModelDiscipline.STRUCTURE]: Building2,
  [ModelDiscipline.MEP_HVAC]: Zap,
  [ModelDiscipline.MEP_PLUMBING]: Wrench,
  [ModelDiscipline.MEP_ELECTRICAL]: Zap,
  [ModelDiscipline.TOPOGRAPHY]: MapPin,
  [ModelDiscipline.LANDSCAPE]: MapPin,
};

const DISCIPLINE_COLORS: Record<ModelDiscipline, string> = {
  [ModelDiscipline.ARCHITECTURE]: '#6B7280', // Gray-500
  [ModelDiscipline.STRUCTURE]: '#DC2626', // Red-600
  [ModelDiscipline.MEP_HVAC]: '#2563EB', // Blue-600
  [ModelDiscipline.MEP_PLUMBING]: '#059669', // Emerald-600
  [ModelDiscipline.MEP_ELECTRICAL]: '#D97706', // Amber-600
  [ModelDiscipline.TOPOGRAPHY]: '#92400E', // Amber-800
  [ModelDiscipline.LANDSCAPE]: '#15803D', // Green-700
};

const DISCIPLINE_LABELS: Record<ModelDiscipline, string> = {
  [ModelDiscipline.ARCHITECTURE]: 'Arquitectura',
  [ModelDiscipline.STRUCTURE]: 'Estructura',
  [ModelDiscipline.MEP_HVAC]: 'Climatización',
  [ModelDiscipline.MEP_PLUMBING]: 'Sanitario',
  [ModelDiscipline.MEP_ELECTRICAL]: 'Eléctrico',
  [ModelDiscipline.TOPOGRAPHY]: 'Topografía',
  [ModelDiscipline.LANDSCAPE]: 'Paisajismo',
};

function getFileType(fileName: string): FileType | null {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'ifc':
      return 'ifc';
    case 'dxf':
      return 'dxf';
    case 'pdf':
      return 'pdf';
    case 'dwg':
      return 'dwg' as FileType; // Will be handled as conversion needed
    case 'rvt':
      return 'rvt' as FileType; // Will be handled as conversion needed
    default:
      return null;
  }
}

function isConversionNeeded(fileName: string): { needed: boolean; format?: string; guidance?: string } {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'dwg':
      return {
        needed: true,
        format: 'AutoCAD DWG',
        guidance: 'Exporta tu archivo .DWG como .IFC desde AutoCAD: Archivo → Exportar → IFC'
      };
    case 'rvt':
      return {
        needed: true,
        format: 'Revit RVT',
        guidance: 'Exporta tu archivo .RVT como .IFC desde Revit: Archivo → Exportar → IFC'
      };
    case 'skp':
      return {
        needed: true,
        format: 'SketchUp',
        guidance: 'Instala la extensión IFC en SketchUp y exporta como .IFC'
      };
    case '3dm':
      return {
        needed: true,
        format: 'Rhino 3D',
        guidance: 'Usa plugins IFC para exportar tu modelo como .IFC'
      };
    default:
      return { needed: false };
  }
}

function suggestDisciplineFromFileName(fileName: string): ModelDiscipline {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('struct') || lowerName.includes('estructur')) {
    return ModelDiscipline.STRUCTURE;
  }
  if (lowerName.includes('hvac') || lowerName.includes('climat')) {
    return ModelDiscipline.MEP_HVAC;
  }
  if (lowerName.includes('plumb') || lowerName.includes('sanitar')) {
    return ModelDiscipline.MEP_PLUMBING;
  }
  if (lowerName.includes('elec') || lowerName.includes('elect')) {
    return ModelDiscipline.MEP_ELECTRICAL;
  }
  if (lowerName.includes('topo') || lowerName.includes('site')) {
    return ModelDiscipline.TOPOGRAPHY;
  }
  
  return ModelDiscipline.ARCHITECTURE; // Default
}

export function FederatedModelUploader({
  projectId,
  companyId,
  onUploadSuccess,
  onClose,
  maxFiles = 8,
  allowedDisciplines = Object.values(ModelDiscipline),
}: FederatedModelUploaderProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: File[]) => {
    const newUploads: PendingUpload[] = files.slice(0, maxFiles - pendingUploads.length).map(file => {
      const conversionInfo = isConversionNeeded(file.name);
      
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        discipline: suggestDisciplineFromFileName(file.name),
        status: conversionInfo.needed ? 'conversion_needed' as any : 'pending',
        progress: 0,
        conversionInfo: conversionInfo.needed ? {
          format: conversionInfo.format!,
          guidance: conversionInfo.guidance!
        } : undefined,
      };
    });

    setPendingUploads(prev => [...prev, ...newUploads]);
  }, [pendingUploads.length, maxFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActive(false);
    addFiles(acceptedFiles);
  }, [addFiles]);

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/octet-stream': ['.ifc', '.dwg', '.rvt'],
      'application/x-step': ['.ifc'],
      'application/dxf': ['.dxf'],
      'image/vnd.dxf': ['.dxf'],
      'application/pdf': ['.pdf'],
      'application/x-autocad': ['.dwg'],
      'application/octet-stream.dwg': ['.dwg'],
      'application/acad': ['.dwg'],
      'application/x-revit': ['.rvt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    maxFiles: maxFiles,
    disabled: pendingUploads.length >= maxFiles,
    noClick: true, // Disable click to prevent conflicts with manual file selection
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleManualFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
    // Reset input
    event.target.value = '';
  };

  const removeUpload = (id: string) => {
    setPendingUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const updateDiscipline = (id: string, discipline: ModelDiscipline) => {
    setPendingUploads(prev =>
      prev.map(upload =>
        upload.id === id ? { ...upload, discipline } : upload
      )
    );
  };

  const processUpload = async (upload: PendingUpload) => {
    // Don't process files that need conversion
    if (upload.status === 'conversion_needed') {
      return;
    }

    try {
      setPendingUploads(prev =>
        prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u)
      );

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setPendingUploads(prev =>
          prev.map(u =>
            u.id === upload.id
              ? { ...u, progress: Math.min(u.progress + Math.random() * 15, 85) }
              : u
          )
        );
      }, 200);

      // Upload file
      const model = await uploadModel(upload.file, projectId, companyId, {
        discipline: upload.discipline,
        fileType: getFileType(upload.file.name) || 'ifc',
      });

      clearInterval(progressInterval);

      setPendingUploads(prev =>
        prev.map(u =>
          u.id === upload.id
            ? { ...u, status: 'success', progress: 100, model }
            : u
        )
      );

    } catch (error) {
      setPendingUploads(prev =>
        prev.map(u =>
          u.id === upload.id
            ? {
                ...u,
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            : u
        )
      );
    }
  };

  const processAllUploads = async () => {
    const pendingFiles = pendingUploads.filter(u => u.status === 'pending');
    
    // Process uploads sequentially to avoid overwhelming the server
    for (const upload of pendingFiles) {
      await processUpload(upload);
    }

    // Notify parent with successful uploads
    const successfulModels = pendingUploads
      .filter(u => u.status === 'success' && u.model)
      .map(u => u.model!);
    
    if (successfulModels.length > 0) {
      onUploadSuccess(successfulModels);
    }
  };

  const uploadableFiles = pendingUploads.filter(u => u.status === 'pending');
  const conversionNeededFiles = pendingUploads.filter(u => u.status === 'conversion_needed');
  const canStartUpload = uploadableFiles.length > 0;
  const isUploading = pendingUploads.some(u => u.status === 'uploading');

  const rejectionError = fileRejections.length > 0
    ? fileRejections[0].errors[0]?.code === 'file-too-large'
      ? 'Algunos archivos exceden el límite de 50MB.'
      : 'Formato de archivo no reconocido'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl glass rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Subir Modelos Federados
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Carga múltiples disciplinas (IFC, DXF, PDF) para coordinación BIM
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Drop zone and file selection */}
          <div className="flex-1 p-6">
            {pendingUploads.length === 0 ? (
              /* Initial dropzone */
              <div
                {...getRootProps()}
                className={`
                  flex flex-col items-center justify-center gap-6 p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all h-full min-h-[300px]
                  ${isDragActive
                    ? 'border-emerald-500 bg-emerald-500/5 scale-[1.02]'
                    : 'border-border hover:border-emerald-500/50 hover:bg-muted/30'
                  }
                `}
              >
                <input {...getInputProps()} />
                
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center border border-emerald-500/10">
                  <Upload size={36} className="text-emerald-500" />
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground mb-2">
                    {isDragActive 
                      ? 'Suelta los archivos aquí' 
                      : 'Arrastra tus modelos aquí'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Soporta IFC (BIM 3D), DXF (CAD 2D) y PDF (Planos)
                  </p>
                  <button
                    onClick={handleFileSelect}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Plus size={16} />
                    Seleccionar archivos
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground/60">
                  Hasta {maxFiles} archivos · Máximo 50MB cada uno
                </p>
              </div>
            ) : (
              /* File list and additional upload */
              <div className="space-y-4 h-full overflow-auto">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Archivos seleccionados ({pendingUploads.length}/{maxFiles})
                  </h4>
                  {pendingUploads.length < maxFiles && (
                    <button
                      onClick={handleFileSelect}
                      className="text-sm text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Agregar más
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {pendingUploads.map((upload) => {
                    const Icon = DISCIPLINE_ICONS[upload.discipline];
                    const fileType = getFileType(upload.file.name);
                    
                    return (
                      <div
                        key={upload.id}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50"
                      >
                        {/* File icon and type indicator */}
                        <div className="flex-shrink-0">
                          {upload.status === 'uploading' ? (
                            <Loader2 size={20} className="animate-spin text-emerald-500" />
                          ) : upload.status === 'success' ? (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          ) : upload.status === 'error' ? (
                            <AlertCircle size={20} className="text-red-500" />
                          ) : upload.status === 'conversion_needed' ? (
                            <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <RefreshCw size={16} className="text-amber-600 dark:text-amber-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              {fileType === 'ifc' && <Building2 size={16} className="text-blue-500" />}
                              {fileType === 'dxf' && <Settings size={16} className="text-amber-500" />}
                              {fileType === 'pdf' && <FileText size={16} className="text-red-500" />}
                              {fileType === 'dwg' && <Building2 size={16} className="text-orange-500" />}
                              {fileType === 'rvt' && <Building2 size={16} className="text-purple-500" />}
                            </div>
                          )}
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">
                              {upload.file.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              ({(upload.file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          
                          {upload.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Subiendo...</span>
                                <span>{Math.round(upload.progress)}%</span>
                              </div>
                              <div className="h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${upload.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {upload.error && (
                            <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                          )}

                          {upload.status === 'conversion_needed' && upload.conversionInfo && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Info size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                  Archivo {upload.conversionInfo.format} detectado
                                </p>
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                {upload.conversionInfo.guidance}
                              </p>
                              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-amber-200 dark:border-amber-800">
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  Formatos soportados: .IFC, .IFCXML
                                </span>
                                <ArrowRight size={12} className="text-amber-500" />
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  Procesamiento BIM
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Discipline selector */}
                        <div className="flex-shrink-0">
                          <select
                            value={upload.discipline}
                            onChange={(e) => updateDiscipline(upload.id, e.target.value as ModelDiscipline)}
                            disabled={upload.status !== 'pending' && upload.status !== 'conversion_needed'}
                            className="text-xs px-2 py-1 rounded border border-border/50 bg-background text-foreground disabled:opacity-50"
                            style={{ color: DISCIPLINE_COLORS[upload.discipline] }}
                          >
                            {allowedDisciplines.map(discipline => (
                              <option key={discipline} value={discipline}>
                                {DISCIPLINE_LABELS[discipline]}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove button */}
                        {(upload.status === 'pending' || upload.status === 'conversion_needed') && (
                          <button
                            onClick={() => removeUpload(upload.id)}
                            className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {pendingUploads.length > 0 && (
          <div className="border-t border-border/50 p-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <div>{pendingUploads.filter(u => u.status === 'success').length} de {pendingUploads.length} archivos procesados</div>
              {conversionNeededFiles.length > 0 && (
                <div className="text-amber-600 dark:text-amber-400 mt-1">
                  {conversionNeededFiles.length} archivo{conversionNeededFiles.length > 1 ? 's' : ''} necesita{conversionNeededFiles.length > 1 ? 'n' : ''} conversión
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cerrar
              </button>
              {uploadableFiles.length > 0 && (
                <button
                  onClick={processAllUploads}
                  disabled={!canStartUpload || isUploading}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isUploading ? 'Subiendo...' : `Subir ${uploadableFiles.length} archivo${uploadableFiles.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {rejectionError && (
          <div className="mx-6 mb-6 flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
            <AlertCircle size={16} />
            <span>{rejectionError}</span>
          </div>
        )}

        {/* Hidden file input for manual selection */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".ifc,.ifcxml,.dxf,.pdf,.dwg,.rvt"
          onChange={handleManualFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}