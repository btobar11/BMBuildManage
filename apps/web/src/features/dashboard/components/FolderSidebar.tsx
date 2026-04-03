import React from 'react';
import { Folder, Inbox, AlertCircle, MapPin, ChevronRight } from 'lucide-react';

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
    <div className="w-64 flex-shrink-0 space-y-6 pr-4 border-r border-border/50 hidden lg:block">
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 px-2">
          Organización
        </h3>
        
        <div className="space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              selectedFolder === null 
                ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox size={18} />
              <span className="text-sm">Todos los proyectos</span>
            </div>
            <span className="text-xs opacity-60 font-mono">{totalProjects}</span>
          </button>

          {/* Custom Folders */}
          {folders.sort().map(folder => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                selectedFolder === folder 
                  ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                {folder.toLowerCase().includes('urgente') ? (
                  <AlertCircle size={18} className="text-amber-500" />
                ) : folder.toLowerCase().includes('ciudad') || folder.toLowerCase().includes('zona') ? (
                  <MapPin size={18} />
                ) : (
                  <Folder size={18} />
                )}
                <span className="text-sm truncate max-w-[120px]">{folder}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 font-mono">{projectCounts[folder] || 0}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-border/50">
        <div className="p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
          <h4 className="text-xs font-bold text-indigo-400 mb-1">Tip Antigravity</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Puedes seleccionar varios proyectos y arrastrarlos a una carpeta para organizarlos rápidamente.
          </p>
        </div>
      </div>
    </div>
  );
};
