import React from 'react';

interface PageHeaderProps {
  title: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; active?: boolean }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, actions, breadcrumbs }) => {
  return (
    <div className="flex items-center justify-between gap-4 mb-8">
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <span className={b.active ? 'text-indigo-400' : ''}>{b.label}</span>
                {i < breadcrumbs.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 border border-border/50 rounded-xl flex items-center justify-center text-indigo-400">
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
