import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  Plus,
  Loader2,
  TestTube
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BimViewerTest } from './components/BimViewerTest';

interface ProjectModel {
  id: string;
  project_id: string;
  name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

export function BimLibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects', { params: { company_id: user?.company_id } }).then(r => r.data),
  });

  const { data: models, isLoading, refetch } = useQuery<ProjectModel[]>({
    queryKey: ['bim-models', selectedProject],
    queryFn: () => api.get('/bim/models', { params: { projectId: selectedProject } }).then(r => r.data),
    enabled: !!selectedProject,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Box className="text-indigo-500" size={28} />
            Modelos BIM
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tus modelos 3D IFC
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <label className="block text-sm font-medium mb-2">Seleccionar Proyecto</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background"
        >
          <option value="">Selecciona un proyecto...</option>
          {projects?.map((project: any) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProject ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Box size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">Selecciona un proyecto</h3>
          <p className="text-muted-foreground">
            Elige un proyecto para ver sus modelos BIM
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : models?.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Box size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">Sin modelos BIM</h3>
          <p className="text-muted-foreground mb-4">
            Este proyecto no tiene modelos BIM cargados
          </p>
          <button 
            onClick={() => document.getElementById('bim-upload')?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Upload size={18} />
            Subir Modelo IFC
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models?.map((model) => (
            <div 
              key={model.id}
              className="bg-card rounded-xl border border-border p-4 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Box className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(model.file_size)} • {formatDate(model.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/budget/${selectedProject}?tab=bim`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <Eye size={16} />
                  Ver
                </button>
                <button className="p-2 border border-border rounded-lg hover:bg-muted">
                  <Download size={16} />
                </button>
                <button className="p-2 border border-border rounded-lg hover:bg-muted text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {selectedProject && (
        <div className="mt-6">
          <input
            type="file"
            id="bim-upload"
            accept=".ifc,.ifcxml"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              setIsUploading(true);
              try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('projectId', selectedProject);
                
                await api.post('/bim/models', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                refetch();
              } catch (error) {
                console.error('Upload error:', error);
              } finally {
                setIsUploading(false);
              }
            }}
          />
          <label 
            htmlFor="bim-upload"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin text-indigo-500" />
                <span>Subiendo modelo...</span>
              </>
            ) : (
              <>
                <Plus size={20} className="text-muted-foreground" />
                <span className="text-muted-foreground">Subir nuevo modelo IFC</span>
              </>
            )}
          </label>
        </div>
      )}

      {/* BIM Viewer Test */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <TestTube size={20} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-foreground">Prueba del Motor BIM 3D</h2>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Test del motor de renderizado Three.js + ThatOpen Components
          </p>
          <BimViewerTest />
        </div>
      </div>
    </div>
  );
}