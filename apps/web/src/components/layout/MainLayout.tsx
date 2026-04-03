import React from 'react';
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
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Proyectos', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Base de Recursos', icon: <Package size={20} />, path: '/resources' },
  { label: 'Biblioteca APU', icon: <Calculator size={20} />, path: '/apu-library' },
  { label: 'Trabajadores', icon: <Users size={20} />, path: '/workers' },
  { label: 'Gastos y Facturas', icon: <DollarSign size={20} />, path: '/invoices' },
  { label: 'Mi Empresa', icon: <Settings size={20} />, path: '/company-settings' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col z-40">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-[180px] flex items-center justify-start">
              <img src="/logo-full.png" alt="BMBuildManage" className="w-[110%] h-auto object-contain -ml-2 mix-blend-multiply dark:mix-blend-normal pointer-events-none" />
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 shadow-inner' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? 'text-indigo-500' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-indigo-500/50" />}
                </Link>
              );
            })}
          </nav>
  
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border">
              <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center border border-border shrink-0 capitalize text-foreground">
                {user?.name?.[0] || <User size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-xs font-bold truncate">{user?.name}</p>
                <p className="text-muted-foreground text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </aside>
  
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Background glow effects */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] -z-10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -z-10 rounded-full" />
          
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
    </div>
  );
};
