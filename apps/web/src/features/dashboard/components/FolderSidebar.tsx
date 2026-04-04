import React from 'react';
import { Folder, Inbox, AlertCircle, MapPin, Layers } from 'lucide-react';

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
  return (
    <div className="w-56 xl:w-64 flex-shrink-0 space-y-6 pr-4 border-r border-border hidden lg:block">
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Layers size={14} className="text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Organizar
          </h3>
        </div>
        
        <div className="space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
              selectedFolder === null 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox size={18} />
              <span className="text-sm">Todos</span>
            </div>
            <span className="text-xs text-muted-foreground data-mono">{allProjectsCount}</span>
          </button>

          {folders.sort().map(folder => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                selectedFolder === folder 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium' 
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
                <span className="text-sm truncate max-w-[130px]">{folder}</span>
              </div>
              <span className="text-xs text-muted-foreground data-mono">{projectCounts[folder] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tip Card */}
      <div className="pt-6 border-t border-border">
        <div className="p-4 bg-muted/50 rounded-xl">
          <h4 className="text-xs font-bold text-emerald-600 mb-1">Tip</h4>
          <p className="text-[11px] text-muted-foreground">
            Selecciona múltiples proyectos y organízalos en carpetas.
          </p>
        </div>
      </div>
    </div>
  );
};
