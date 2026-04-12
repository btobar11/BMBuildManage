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
  Moon,
  Sun,
  Box,
  FileQuestion,
  FileText,
  ClipboardCheck,
  BarChart3,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BMLogo } from '../ui/BMLogo';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Proyectos', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'BI Dashboard', icon: <BarChart3 size={20} />, path: '/bi-dashboard' },
  { label: 'RFIs', icon: <FileQuestion size={20} />, path: '/rfis' },
  { label: 'Submittals', icon: <FileText size={20} />, path: '/submittals' },
  { label: 'Punch List', icon: <ClipboardCheck size={20} />, path: '/punch-list' },
  { label: 'Recursos', icon: <Package size={20} />, path: '/resources' },
  { label: 'APU', icon: <Calculator size={20} />, path: '/apu-library' },
  { label: 'Modelos BIM', icon: <Box size={20} />, path: '/bim' },
  { label: 'Analítica BIM', icon: <BarChart3 size={20} />, path: '/bim-analytics' },
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

  // Global onboarding guard - redirect if user has no company_id
  useEffect(() => {
    if (user && !user.company_id && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, location.pathname, navigate]);

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
        w-16 hover:w-64 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
        bg-card/95 backdrop-blur-lg border-r border-border flex flex-col
        shadow-lg lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-border px-4 relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 to-transparent dark:from-primary-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className={`transition-all duration-300 transform ${sidebarExpanded ? 'scale-100' : 'scale-110 hover:scale-125'}`}>
            {sidebarExpanded ? (
              <BMLogo variant="full" className="h-6 transition-all duration-200" />
            ) : (
              <BMLogo variant="icon" className="h-8 w-8 transition-all duration-200" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {NAV_ITEMS.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg 
                  transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) whitespace-nowrap
                  hover-lift
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                  }
                `}
                title={item.label}
                style={{ 
                  animationDelay: `${index * 50}ms` 
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full" />
                )}
                
                {/* Icon with micro-animation */}
                <span className={`
                  transition-all duration-200 transform
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400 scale-110' 
                    : 'group-hover:scale-110 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }
                `}>
                  {item.icon}
                </span>
                
                {/* Label with stagger animation */}
                <span className={`
                  text-sm font-medium sidebar-label transition-all duration-300
                  ${sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 lg:opacity-0 w-0'}
                  ${isActive ? 'font-semibold' : ''}
                `}>
                  {item.label}
                </span>
                
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10" />
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-border">
          <div className="group relative flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200 hover-lift"
               onClick={handleLogout}
               title={`${user?.name} - Click to logout`}
          >
            {/* User Avatar with status indicator */}
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm shrink-0 transition-transform duration-200 group-hover:scale-110">
                {user?.name?.[0]?.toUpperCase() || <User size={16} />}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-card rounded-full" />
            </div>
            
            {/* User Info */}
            <div className={`sidebar-label overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 w-0'}`}>
              <p className="text-sm font-medium text-foreground truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Profesional */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105"
              title="Abrir menú"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">BMBuildManage</span>
                <span>/</span>
                <span className="capitalize">
                  {location.pathname === '/dashboard' ? 'Proyectos' : 
                   location.pathname.replace('/', '').replace('-', ' ')}
                </span>
              </div>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search (desktop only) */}
            <div className="hidden md:flex items-center relative">
              <input 
                type="text" 
                placeholder="Buscar..."
                className="w-64 h-9 pl-3 pr-9 text-sm bg-muted border border-transparent rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary-300 focus:bg-background focus:ring-2 focus:ring-primary-500/20 transition-all duration-150"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            {/* Theme Toggle Premium */}
            <div className="hidden sm:flex items-center gap-0.5 p-1 bg-muted rounded-lg shadow-inner">
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  theme === 'light' 
                    ? 'bg-background shadow-sm text-foreground scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
                title="Modo claro"
              >
                <Sun size={16} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-background shadow-sm text-foreground scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
                title="Modo oscuro"
              >
                <Moon size={16} />
              </button>
            </div>

            

            {/* Quick Actions */}
            <div className="hidden lg:flex items-center border-l border-border pl-3 ml-1">
              <button 
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-all duration-200"
                title="Crear proyecto"
              >
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                Nuevo Proyecto
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/20 rounded-lg transition-all duration-200"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Cerrar Sesión</span>
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
