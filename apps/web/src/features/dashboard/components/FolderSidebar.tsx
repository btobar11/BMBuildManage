import React from 'react';
import { Folder, Inbox, AlertCircle, MapPin, ChevronRight, Layers } from 'lucide-react';

interface FolderSidebarProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  projectCounts: Record<string, number>;
  allProjectsCount: number;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({ 
  folders, 
  selectedFolder, 
  onSelectFolder,
  projectCounts,
  allProjectsCount
}) => {
  const totalProjects = allProjectsCount;

  return (
    <div className="w-56 xl:w-64 flex-shrink-0 space-y-6 pr-4 border-r border-white/5 hidden lg:block">
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Layers size={14} className="text-violet-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40">
            Organizar
          </h3>
        </div>
        
        <div className="space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
              selectedFolder === null 
                ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-violet-300 font-bold border border-violet-500/30' 
                : 'text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox size={18} className={selectedFolder === null ? 'text-violet-400' : ''} />
              <span className="text-sm">Todos</span>
            </div>
            <span className={`text-xs font-mono ${selectedFolder === null ? 'text-violet-400' : 'text-white/30'}`}>
              {totalProjects}
            </span>
          </button>

          {/* Custom Folders */}
          {folders.sort().map(folder => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group border ${
                selectedFolder === folder 
                  ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-violet-300 font-bold border-violet-500/30' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {folder.toLowerCase().includes('urgente') ? (
                  <AlertCircle size={18} className={selectedFolder === folder ? 'text-amber-400' : 'text-amber-400/60'} />
                ) : folder.toLowerCase().includes('ciudad') || folder.toLowerCase().includes('zona') ? (
                  <MapPin size={18} className={selectedFolder === folder ? 'text-violet-400' : ''} />
                ) : (
                  <Folder size={18} className={selectedFolder === folder ? 'text-violet-400' : ''} />
                )}
                <span className="text-sm truncate max-w-[130px]">{folder}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${selectedFolder === folder ? 'text-violet-400' : 'text-white/30'}`}>
                  {projectCounts[folder] || 0}
                </span>
                <ChevronRight size={14} className={`transition-opacity ${selectedFolder === folder ? 'text-violet-400/50' : 'opacity-0 group-hover:opacity-50'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tip Card */}
      <div className="pt-6 border-t border-white/5">
        <div className="p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 rounded-2xl border border-violet-500/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-violet-500/10 rounded-full blur-xl" />
          <h4 className="text-xs font-bold text-violet-400 mb-2 flex items-center gap-1.5">
            <Layers size={12} />
            Tip
          </h4>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Selecciona múltiples proyectos y organízalos en carpetas para una mejor gestión.
          </p>
        </div>
      </div>
    </div>
  );
};
