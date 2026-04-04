import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Calculator, 
  LogOut,
  ChevronRight,
  User,
  Users,
  Settings,
  DollarSign,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Proyectos', icon: <LayoutDashboard size={20} />, path: '/dashboard', color: 'violet' },
  { label: 'Base de Recursos', icon: <Package size={20} />, path: '/resources', color: 'amber' },
  { label: 'Biblioteca APU', icon: <Calculator size={20} />, path: '/apu-library', color: 'emerald' },
  { label: 'Trabajadores', icon: <Users size={20} />, path: '/workers', color: 'sky' },
  { label: 'Gastos y Facturas', icon: <DollarSign size={20} />, path: '/invoices', color: 'pink' },
  { label: 'Mi Empresa', icon: <Settings size={20} />, path: '/company-settings', color: 'slate' },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', glow: 'shadow-pink-500/20' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', glow: 'shadow-slate-500/20' },
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getCurrentColor = () => {
    const currentItem = NAV_ITEMS.find(item => location.pathname === item.path);
    return currentItem ? colorMap[currentItem.color] : colorMap.violet;
  };

  const currentColor = getCurrentColor();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-72 h-full
        bg-gradient-to-b from-card to-background 
        border-r border-border/50 lg:border-r
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/20 shadow-lg">
                <img src="/logo-full.png" alt="BMBuildManage" className="h-7 object-contain" />
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const colors = colorMap[item.color];
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                  group relative overflow-hidden
                  ${isActive 
                    ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg ${colors.glow}` 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-current/5 to-transparent" />
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  <span className={isActive ? colors.text : 'group-hover:text-foreground'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                
                {isActive && (
                  <ChevronRight size={16} className={`${colors.text} relative z-10`} />
                )}
                
                {/* Hover/Active line indicator */}
                <div className={`
                  absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all
                  ${isActive ? 'h-8 bg-current' : 'h-0 group-hover:h-4 bg-muted-foreground/30'}
                `} />
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/50 space-y-3">
          {/* User Info Card */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30">
              {user?.name?.[0]?.toUpperCase() || <User size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-bold truncate">{user?.name}</p>
              <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                theme === 'light' 
                  ? 'bg-white text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun size={14} />
              <span>Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon size={14} />
              <span>Oscuro</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                theme === 'system' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor size={14} />
              <span>Auto</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dynamic background glow based on current route */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] ${currentColor.bg.replace('/10', '/5')} blur-[150px] -z-10 rounded-full transition-all duration-500`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] ${currentColor.bg.replace('/10', '/3')} blur-[100px] -z-10 rounded-full transition-all duration-500`} />
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu size={24} className="text-foreground" />
          </button>
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
            <img src="/logo-full.png" alt="BMBuildManage" className="h-6 object-contain" />
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell size={20} className="text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
