import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Calculator, 
  User,
  Users,
  Settings,
  DollarSign,
  Menu,
  Bell,
  Moon,
  Sun,
  Box,
  FileQuestion,
  FileText,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BMLogo } from '../ui/BMLogo';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Proyectos', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'RFIs', icon: <FileQuestion size={20} />, path: '/rfis' },
  { label: 'Submittals', icon: <FileText size={20} />, path: '/submittals' },
  { label: 'Punch List', icon: <ClipboardCheck size={20} />, path: '/punch-list' },
  { label: 'Recursos', icon: <Package size={20} />, path: '/resources' },
  { label: 'APU', icon: <Calculator size={20} />, path: '/apu-library' },
  { label: 'Modelos BIM', icon: <Box size={20} />, path: '/bim' },
  { label: 'Trabajadores', icon: <Users size={20} />, path: '/workers' },
  { label: 'Gastos', icon: <DollarSign size={20} />, path: '/invoices' },
  { label: 'Empresa', icon: <Settings size={20} />, path: '/company-settings' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-16 hover:w-64 transition-all duration-200 ease-out
        bg-card border-r border-border flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-border px-4">
          {sidebarExpanded ? (
            <BMLogo variant="full" className="h-6" />
          ) : (
            <BMLogo variant="icon" className="h-8 w-8" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap
                  ${isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                title={item.label}
              >
                <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                  {item.icon}
                </span>
                <span className={`text-sm font-medium sidebar-label ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-0 w-0'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
               onClick={handleLogout}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() || <User size={16} />}
            </div>
            <div className="sidebar-label overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded ${theme === 'light' ? 'bg-background shadow-sm' : ''}`}
              >
                <Sun size={16} className={theme === 'light' ? 'text-foreground' : 'text-muted-foreground'} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded ${theme === 'dark' ? 'bg-background shadow-sm' : ''}`}
              >
                <Moon size={16} className={theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'} />
              </button>
            </div>

            <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </main>

      <style>{`
        .sidebar-label {
          transition: opacity 0.15s ease, width 0.15s ease;
        }
      `}</style>
    </div>
  );
};
