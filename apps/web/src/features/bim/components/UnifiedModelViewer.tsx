/**
 * UnifiedModelViewer — Combined BIM 3D + CAD 2D Viewer
 * 
 * Intelligent viewer that automatically switches between:
 * - 3D BIM viewer for IFC files (using FederatedBimViewer)
 * - 2D CAD viewer for DXF files (using CADViewer)  
 * - PDF viewer for PDF files
 * 
 * Provides unified interface for all model types with consistent UX.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { 
  FileType, 
  Building, 
  FileText, 
  Grid3X3,
  Eye,
  Layers,
  Download,
  Share2,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { FederatedBimViewer } from './FederatedBimViewer';
import { CADViewer } from './CADViewer';
import { FederatedModelUploader } from './FederatedModelUploader';
import { ModelDiscipline } from '../hooks/useFederatedBimEngine';

interface ModelFile {
  id: string;
  name: string;
  type: 'ifc' | 'dxf' | 'pdf';
  discipline: ModelDiscipline;
  url: string;
  size: number;
  uploadedAt: Date;
}

interface UnifiedModelViewerProps {
  projectId: string;
  companyId: string;
  initialFiles?: ModelFile[];
  className?: string;
}

type ViewerMode = 'bim3d' | 'cad2d' | 'pdf' | 'empty';

const FILE_TYPE_ICONS = {
  ifc: Building,
  dxf: Grid3X3,
  pdf: FileText,
};

const FILE_TYPE_LABELS = {
  ifc: 'Modelo BIM 3D',
  dxf: 'Plano CAD 2D',
  pdf: 'Documento PDF',
};

export function UnifiedModelViewer({
  projectId,
  companyId,
  initialFiles = [],
  className = '',
}: UnifiedModelViewerProps) {
  const [modelFiles, setModelFiles] = useState<ModelFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(
    initialFiles.length > 0 ? initialFiles[0].id : null
  );
  const [showUploader, setShowUploader] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);

  // Determine viewer mode based on active file
  const { viewerMode, activeFile } = useMemo(() => {
    if (!activeFileId) {
      return { viewerMode: 'empty' as ViewerMode, activeFile: null };
    }

    const file = modelFiles.find(f => f.id === activeFileId);
    if (!file) {
      return { viewerMode: 'empty' as ViewerMode, activeFile: null };
    }

    let mode: ViewerMode;
    switch (file.type) {
      case 'ifc':
        mode = 'bim3d';
        break;
      case 'dxf':
        mode = 'cad2d';
        break;
      case 'pdf':
        mode = 'pdf';
        break;
      default:
        mode = 'empty';
    }

    return { viewerMode: mode, activeFile: file };
  }, [activeFileId, modelFiles]);

  const handleUploadSuccess = useCallback((uploadedModels: any[]) => {
    const newFiles: ModelFile[] = uploadedModels.map(model => ({
      id: model.id,
      name: model.name,
      type: getFileType(model.name),
      discipline: model.discipline,
      url: model.url,
      size: model.size || 0,
      uploadedAt: new Date(),
    }));

    setModelFiles(prev => [...prev, ...newFiles]);
    
    // Auto-select first uploaded file if none is selected
    if (!activeFileId && newFiles.length > 0) {
      setActiveFileId(newFiles[0].id);
    }

    setShowUploader(false);
  }, [activeFileId]);

  const handleFileSelect = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const handleFileDelete = useCallback((fileId: string) => {
    setModelFiles(prev => prev.filter(f => f.id !== fileId));
    
    // If deleted file was active, select another or clear
    if (fileId === activeFileId) {
      const remaining = modelFiles.filter(f => f.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeFileId, modelFiles]);

  // Group files by type for better organization
  const filesByType = useMemo(() => {
    const groups = {
      ifc: modelFiles.filter(f => f.type === 'ifc'),
      dxf: modelFiles.filter(f => f.type === 'dxf'),
      pdf: modelFiles.filter(f => f.type === 'pdf'),
    };
    return groups;
  }, [modelFiles]);

  const renderViewer = () => {
    switch (viewerMode) {
      case 'bim3d':
        return (
          <FederatedBimViewer
            projectId={projectId}
            companyId={companyId}
            className="h-full"
          />
        );

      case 'cad2d':
        return (
          <CADViewer
            dxfUrl={activeFile?.url}
            className="h-full"
            onElementSelect={(element) => {
              console.log('CAD element selected:', element);
            }}
            onMeasurement={(measurement) => {
              console.log('CAD measurement:', measurement);
            }}
          />
        );

      case 'pdf':
        return (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <FileText size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">PDF Viewer</p>
              <p className="text-gray-500 text-sm mt-2">
                PDF viewing will be implemented in a future version
              </p>
              {activeFile && (
                <a
                  href={activeFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download size={16} />
                  Open PDF
                </a>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-6">
                <Layers size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay modelos cargados
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Sube archivos IFC (BIM 3D), DXF (CAD 2D) o PDF para comenzar la visualización
              </p>
              <button
                onClick={() => setShowUploader(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                <Building size={20} />
                Subir Modelos
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* File Manager Sidebar */}
      {showFileManager && (
        <div className="w-80 bg-background border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Archivos del Proyecto</h3>
              <button
                onClick={() => setShowUploader(true)}
                className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Subir
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              {modelFiles.length} archivo(s) • {Object.keys(filesByType).filter(type => filesByType[type as keyof typeof filesByType].length > 0).length} tipo(s)
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(filesByType).map(([fileType, files]) => {
              if (files.length === 0) return null;

              const Icon = FILE_TYPE_ICONS[fileType as keyof typeof FILE_TYPE_ICONS];
              const label = FILE_TYPE_LABELS[fileType as keyof typeof FILE_TYPE_LABELS];

              return (
                <div key={fileType} className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
                    <Icon size={16} />
                    <span>{label}</span>
                    <span className="text-muted-foreground">({files.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          file.id === activeFileId
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => handleFileSelect(file.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: getDisciplineColor(file.discipline) }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {getDisciplineLabel(file.discipline)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {formatFileSize(file.size)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {file.id === activeFileId && (
                            <Eye size={14} className="text-emerald-500" />
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDelete(file.id);
                            }}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar archivo"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {modelFiles.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay archivos cargados
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Viewer Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFileManager(!showFileManager)}
              className={`p-2 rounded-lg transition-colors ${
                showFileManager 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : 'hover:bg-muted/30 text-muted-foreground'
              }`}
              title="Gestor de archivos"
            >
              <Layers size={16} />
            </button>

            {activeFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg">
                {React.createElement(FILE_TYPE_ICONS[activeFile.type], { size: 14 })}
                <span className="text-sm font-medium text-foreground">
                  {activeFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({FILE_TYPE_LABELS[activeFile.type]})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!activeFile && (
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Building size={16} />
                Subir Modelos
              </button>
            )}
            
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/30 transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1">
          {renderViewer()}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <FederatedModelUploader
          projectId={projectId}
          companyId={companyId}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUploader(false)}
          maxFiles={10}
          allowedDisciplines={Object.values(ModelDiscipline)}
        />
      )}
    </div>
  );
}

// Helper functions
function getFileType(fileName: string): 'ifc' | 'dxf' | 'pdf' {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'ifc': return 'ifc';
    case 'dxf': return 'dxf';
    case 'pdf': return 'pdf';
    default: return 'ifc';
  }
}

function getDisciplineColor(discipline: ModelDiscipline): string {
  const colors = {
    [ModelDiscipline.ARCHITECTURE]: '#6B7280',
    [ModelDiscipline.STRUCTURE]: '#DC2626',
    [ModelDiscipline.MEP_HVAC]: '#2563EB',
    [ModelDiscipline.MEP_PLUMBING]: '#059669',
    [ModelDiscipline.MEP_ELECTRICAL]: '#D97706',
    [ModelDiscipline.TOPOGRAPHY]: '#92400E',
    [ModelDiscipline.LANDSCAPE]: '#15803D',
  };
  return colors[discipline] || '#6B7280';
}

function getDisciplineLabel(discipline: ModelDiscipline): string {
  const labels = {
    [ModelDiscipline.ARCHITECTURE]: 'Arquitectura',
    [ModelDiscipline.STRUCTURE]: 'Estructura',
    [ModelDiscipline.MEP_HVAC]: 'HVAC',
    [ModelDiscipline.MEP_PLUMBING]: 'Sanitario',
    [ModelDiscipline.MEP_ELECTRICAL]: 'Eléctrico',
    [ModelDiscipline.TOPOGRAPHY]: 'Topografía',
    [ModelDiscipline.LANDSCAPE]: 'Paisajismo',
  };
  return labels[discipline] || discipline;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}