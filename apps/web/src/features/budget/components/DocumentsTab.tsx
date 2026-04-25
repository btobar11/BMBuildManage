import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Trash2, 
  Loader2, 
  ExternalLink,
  UploadCloud,
  File,
  Eye,
  X,
  FileCode,
  Download,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import api from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { CADViewer } from './CADViewer';
import { 
  Link, 
  Search as SearchIcon
} from 'lucide-react';

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  file_url: string;
  created_at: string;
  uploaded_by?: string;
  project_id: string;
}

interface DocumentsTabProps {
  projectId: string;
}

// Map extensions to visual icons & colors
const getFileExt = (filename: string) => filename.split('.').pop()?.toLowerCase() || '';

const FILE_CATEGORIES = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
  pdf: ['pdf'],
  cad: ['dxf', 'dwg'],
  spreadsheet: ['xls', 'xlsx', 'csv'],
  document: ['doc', 'docx', 'txt', 'rtf'],
};

const getFileCategory = (filename: string) => {
  const ext = getFileExt(filename);
  for (const [cat, exts] of Object.entries(FILE_CATEGORIES)) {
    if (exts.includes(ext)) return cat;
  }
  return 'other';
};

const getFileIcon = (filename: string, className = '') => {
  const category = getFileCategory(filename);
  switch (category) {
    case 'image': return <ImageIcon className={`text-orange-500 ${className}`} />;
    case 'pdf': return <FileText className={`text-red-500 ${className}`} />;
    case 'cad': return <FileCode className={`text-violet-500 ${className}`} />;
    case 'spreadsheet': return <FileSpreadsheet className={`text-emerald-500 ${className}`} />;
    case 'document': return <FileText className={`text-sky-500 ${className}`} />;
    default: return <File className={`text-blue-500 ${className}`} />;
  }
};

const getCategoryLabel = (filename: string) => {
  const category = getFileCategory(filename);
  switch (category) {
    case 'image': return 'Imagen';
    case 'pdf': return 'Plano PDF';
    case 'cad': return 'AutoCAD';
    case 'spreadsheet': return 'Planilla';
    case 'document': return 'Documento';
    default: return 'Archivo';
  }
};

const getCategoryColor = (filename: string) => {
  const category = getFileCategory(filename);
  switch (category) {
    case 'image': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'pdf': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'cad': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'spreadsheet': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'document': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
};

const getDocType = (ext: string) => {
  if (['pdf'].includes(ext)) return 'plan';
  if (['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tiff'].includes(ext)) return 'photo';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'quantity_takeoff';
  if (['dxf', 'dwg'].includes(ext)) return 'plan';
  if (['doc', 'docx'].includes(ext)) return 'contract';
  return 'other';
};

// ─── Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({ 
  doc, 
  onClose, 
  projectId, 
  budget 
}: { 
  doc: ProjectDocument; 
  onClose: () => void; 
  projectId: string; 
  budget: any; 
}) {
  const queryClient = useQueryClient();
  const ext = getFileExt(doc.name);
  const category = getFileCategory(doc.name);
  const [dxfContent, setDxfContent] = useState<string | null>(null);
  const [dxfLoading, setDxfLoading] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  
  // Measurement Bridge States
  const [pendingMeasure, setPendingMeasure] = useState<{ area: number; length: number; layer: string } | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [searchTarget, setSearchTarget] = useState('');

  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return api.patch(`/budgets/items/${itemId}`, {
        quantity: quantity
      });
    },
    onSuccess: () => {
      toast.success('¡Cubicación vinculada con éxito!', { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['project-budget', projectId] });
      setIsLinking(false);
      setPendingMeasure(null);
    },
    onError: () => toast.error('Error al vincular medida')
  });

  const loadDxf = async () => {
    setDxfLoading(true);
    try {
      const resp = await fetch(doc.file_url);
      const text = await resp.text();
      setDxfContent(text);
    } catch {
      toast.error('No se pudo cargar el archivo DXF');
    } finally {
      setDxfLoading(false);
    }
  };

  // Auto-load DXF content
  if (ext === 'dxf' && !dxfContent && !dxfLoading) {
    loadDxf();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={onClose}>
      <div 
        className="relative bg-card border border-border rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-blue-600/5 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm shrink-0">
              {getFileIcon(doc.name, 'w-5 h-5')}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground truncate text-sm">{doc.name}</h3>
              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(doc.name)}`}>
                {getCategoryLabel(doc.name)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {category === 'image' && (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button 
                  onClick={() => setImgZoom(z => Math.max(0.25, z - 0.25))}
                  className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono text-muted-foreground w-10 text-center">{Math.round(imgZoom * 100)}%</span>
                <button 
                  onClick={() => setImgZoom(z => Math.min(4, z + 0.25))}
                  className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:bg-blue-500 hover:text-white transition-colors"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={18} />
            </a>
            <a
              href={doc.file_url}
              download={doc.name}
              className="p-2 rounded-lg text-muted-foreground hover:bg-emerald-500 hover:text-white transition-colors"
              title="Descargar"
            >
              <Download size={18} />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-foreground/10 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center min-h-[400px]">
          {category === 'image' && (
            <div className="overflow-auto w-full h-full flex items-center justify-center p-8">
              <img 
                src={doc.file_url} 
                alt={doc.name} 
                className="max-w-none transition-transform duration-200 rounded-lg shadow-xl"
                style={{ transform: `scale(${imgZoom})` }}
              />
            </div>
          )}

          {category === 'pdf' && (
            <iframe 
              src={doc.file_url}
              className="w-full h-[75vh] border-0"
              title={doc.name}
            />
          )}

          {ext === 'dxf' && (
            <div className="w-full h-[70vh] p-4">
              {dxfLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  <p className="text-sm text-muted-foreground font-medium">Cargando plano AutoCAD...</p>
                </div>
              ) : dxfContent ? (
                <CADViewer 
                  dxfString={dxfContent} 
                  onSelectGeometry={(area, length, layer) => {
                    setPendingMeasure({ area, length, layer });
                    toast.success(`Capturado: ${layer}`, { icon: '📏', duration: 2000 });
                  }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <FileCode size={48} className="text-violet-500/40" />
                  <p>No se pudo cargar el archivo DXF</p>
                </div>
              )}
            </div>
          )}

          {ext === 'dwg' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center">
                <FileCode size={40} className="text-violet-500" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-2">Archivo AutoCAD .DWG</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Los archivos <span className="font-bold">.DWG</span> no se pueden previsualizar directamente en el navegador.
                  <br />
                  Exporta tu plano como <span className="font-bold text-violet-600">.DXF</span> desde AutoCAD para poder verlo y medirlo aquí, 
                  o descárgalo para abrirlo localmente.
                </p>
              </div>
              <a 
                href={doc.file_url}
                download={doc.name}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all"
              >
                <Download size={16} />
                Descargar Archivo
              </a>
            </div>
          )}

          {!['image', 'pdf'].includes(category) && !['dxf', 'dwg'].includes(ext) && (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                {getFileIcon(doc.name, 'w-10 h-10')}
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-2">Previsualización no disponible</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Este tipo de archivo no se puede previsualizar directamente.
                  Descárgalo para verlo en tu computador.
                </p>
              </div>
              <a 
                href={doc.file_url}
                download={doc.name}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
              >
                <Download size={16} />
                Descargar
              </a>
            </div>
          )}
        </div>

        {/* Measurement Bridge UI */}
        {pendingMeasure && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-3 animate-in slide-in-from-bottom-8 duration-500">
            {isLinking ? (
              <div className="bg-card border border-border rounded-3xl shadow-2xl p-5 w-[350px] space-y-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <Link size={12} className="text-blue-500" /> Vincular a Partida
                  </h4>
                  <button onClick={() => setIsLinking(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Buscar ítem en el presupuesto..."
                    className="w-full bg-muted/50 border border-border rounded-xl text-xs py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    value={searchTarget}
                    onChange={e => setSearchTarget(e.target.value)}
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar p-1">
                  {budget?.stages?.flatMap((s: any) => 
                    s.items.filter((i: any) => 
                      i.name.toLowerCase().includes(searchTarget.toLowerCase()) ||
                      s.name.toLowerCase().includes(searchTarget.toLowerCase())
                    ).map((i: any) => ({
                      ...i,
                      stageName: s.name
                    }))
                  ).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: pendingMeasure.area })}
                      className="w-full text-left p-3 rounded-xl hover:bg-blue-600/10 border border-transparent hover:border-blue-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground group-hover:text-blue-500 transition-colors">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{item.unit}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.stageName}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-blue-600 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-blue-600/40 ring-4 ring-blue-600/10">
                <div className="flex items-center gap-3 pr-4 border-r border-white/20">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                    {pendingMeasure.area.toFixed(2)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Medida Capturada</p>
                    <p className="text-xs font-bold">{pendingMeasure.layer}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsLinking(true)}
                  className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all active:scale-95"
                >
                  <Link size={14} />
                  Vincular a Presupuesto
                </button>
                
                <button 
                  onClick={() => setPendingMeasure(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load Budget for linking
  const { data: budgetData } = useQuery({
    queryKey: ['project-budget', projectId],
    queryFn: async () => {
      const resp = await api.get(`/budgets/project/${projectId}`);
      return resp.data;
    },
    enabled: !!projectId
  });

  // 1. Load Documents
  const { data: documents = [], isLoading } = useQuery<ProjectDocument[]>({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const response = await api.get(`/documents?project_id=${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // 2. Upload Document Pipeline
  const { mutate: addDocument } = useMutation({
    mutationFn: async (payload: { name: string; file_url: string; type: string }) => {
      return api.post('/documents', {
        ...payload,
        project_id: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    },
    onError: () => {
      toast.error('Error al registrar el documento en la base de datos');
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress({ current: 0, total: acceptedFiles.length });
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress({ current: i + 1, total: acceptedFiles.length });
      
      try {
        const fileExt = getFileExt(file.name);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        addDocument({
          name: file.name,
          file_url: publicUrl,
          type: getDocType(fileExt)
        });

      } catch (err) {
        toast.error(`Error al subir "${file.name}". ¿Existe el bucket "documents"?`);
      }
    }
    
    toast.success(acceptedFiles.length > 1 
      ? `${acceptedFiles.length} archivos subidos con éxito` 
      : 'Documento subido con éxito'
    );
    setUploading(false);
    setUploadProgress(null);
  }, [projectId, addDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/dxf': ['.dxf'],
      'application/acad': ['.dwg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    }
  });

  // 3. Delete Document Pipeline
  const { mutate: deleteDocument } = useMutation({
    mutationFn: async (doc: ProjectDocument) => {
      await api.delete(`/documents/${doc.id}`);
      
      try {
        const urlObj = new URL(doc.file_url);
        const pathSegments = urlObj.pathname.split('documents/');
        if (pathSegments.length > 1) {
          const filePath = pathSegments[1];
          await supabase.storage.from('documents').remove([decodeURI(filePath)]);
        }
      } catch {
        // Silent fail - ignore
      }
    },
    onSuccess: () => {
      toast.success('Documento eliminado');
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    },
    onError: () => {
      toast.error('No se pudo eliminar el documento');
    }
  });

  // Filter logic
  const filteredDocs = filterCategory === 'all' 
    ? documents 
    : documents.filter(d => getFileCategory(d.name) === filterCategory);

  // Count by category
  const categoryCounts = documents.reduce((acc, d) => {
    const cat = getFileCategory(d.name);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filterOptions = [
    { id: 'all', label: 'Todos', count: documents.length },
    { id: 'pdf', label: 'Planos PDF', count: categoryCounts['pdf'] || 0 },
    { id: 'cad', label: 'AutoCAD', count: categoryCounts['cad'] || 0 },
    { id: 'image', label: 'Fotos', count: categoryCounts['image'] || 0 },
    { id: 'spreadsheet', label: 'Planillas', count: categoryCounts['spreadsheet'] || 0 },
    { id: 'document', label: 'Docs', count: categoryCounts['document'] || 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Archivos y Planos</h2>
          <p className="text-muted-foreground text-sm">Sube planos AutoCAD, PDFs, fotos, contratos y planillas del proyecto.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`relative group overflow-hidden border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center py-14 px-6 text-center ${
          isDragActive 
            ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
            : 'border-border hover:border-blue-500/50 hover:bg-muted/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div>
              <p className="text-foreground font-semibold">Subiendo archivos...</p>
              {uploadProgress && (
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress.current} de {uploadProgress.total}
                </p>
              )}
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: uploadProgress ? `${(uploadProgress.current / uploadProgress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${isDragActive ? 'scale-110 bg-blue-500 shadow-lg shadow-blue-500/20 text-white rotate-6' : 'bg-muted text-muted-foreground'}`}>
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {isDragActive ? '¡Suelta los archivos aquí!' : 'Sube archivos del proyecto'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-5">
              Arrastra archivos o haz clic para buscarlos. Acepta <span className="font-semibold text-foreground">PDF, AutoCAD (.dxf/.dwg), Imágenes, Excel, Word</span> y más.
            </p>
            {/* Format badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {[
                { label: '.PDF', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
                { label: '.DXF', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
                { label: '.DWG', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
                { label: '.JPG', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
                { label: '.PNG', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
                { label: '.XLSX', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
              ].map(f => (
                <span key={f.label} className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${f.color}`}>
                  {f.label}
                </span>
              ))}
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-background border border-border shadow-sm text-sm font-semibold text-foreground group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
              Explorar Archivos
            </div>
          </div>
        )}
      </div>

      {/* Filter Pills + Document Library */}
      <div className="space-y-5 pt-4 border-t border-border">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Biblioteca del Proyecto
            <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-bold">{documents.length}</span>
          </h3>
          
          {documents.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterOptions.filter(f => f.id === 'all' || f.count > 0).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    filterCategory === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {f.label}
                  {f.count > 0 && <span className="ml-1.5 opacity-70">{f.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse border border-border" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-card border border-border/50 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-5">
              <File className="text-muted-foreground" size={28} />
            </div>
            <p className="text-foreground font-bold text-lg">Aún no hay documentos</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Sube tu primer plano constructivo (.PDF o .DXF), contrato, foto o planilla para empezar a organizar el proyecto.
            </p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-muted/30 border border-border">
            <p className="text-muted-foreground text-sm">No hay archivos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const category = getFileCategory(doc.name);
              const isPreviewable = ['image', 'pdf', 'cad'].includes(category) || getFileExt(doc.name) === 'dwg';
              
              return (
                <div 
                  key={doc.id} 
                  className="group relative bg-card hover:bg-muted/30 border border-border rounded-2xl p-4 flex flex-col transition-all hover:shadow-lg hover:shadow-black/5 cursor-pointer"
                  onClick={() => isPreviewable && setPreviewDoc(doc)}
                >
                  {/* Thumbnail / Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm shrink-0">
                        {getFileIcon(doc.name, 'w-5 h-5')}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(doc.name)}`}>
                        {getCategoryLabel(doc.name)}
                      </span>
                    </div>
                    
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPreviewable && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-blue-500 hover:text-white transition-colors"
                          title="Previsualizar"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-blue-500 hover:text-white transition-colors"
                        title="Abrir / Descargar"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar archivo permanentemente?')) {
                            deleteDocument(doc);
                          }
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Image thumbnail */}
                  {category === 'image' && (
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-muted mb-3 border border-border">
                      <img 
                        src={doc.file_url} 
                        alt={doc.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <h4 className="text-sm font-semibold text-foreground line-clamp-2 mt-auto" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('es-CL')}
                    </span>
                    {isPreviewable && (
                      <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click para ver →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
          projectId={projectId}
          budget={budgetData}
        />
      )}
    </div>
  );
}
