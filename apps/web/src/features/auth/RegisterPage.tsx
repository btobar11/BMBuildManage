import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, ShieldCheck, BarChart3, HardHat, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import { BMLogo } from '../../components/ui/BMLogo';

const benefits = [
  { icon: <BarChart3 size={20} />, title: 'Presupuestos APU', desc: 'Costos directos e indirectos en la nube' },
  { icon: <ShieldCheck size={20} />, title: 'Audit Log', desc: 'Historial completo de cambios' },
  { icon: <HardHat size={20} />, title: 'Control de Campo', desc: 'Gestiona cuadrillas eficientemente' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: 'admin' } }
      });

      if (authError) throw authError;
      
      // Handle email confirmation required vs immediate login
      if (authData.user && !authData.session) {
        // Email confirmation required - show success message
        setLoading(false);
        setSuccessMessage('Revisa tu correo ' + email + ' para confirmar tu cuenta');
        return;
      }

      if (!authData.user || !authData.session) {
        throw new Error('No se pudo crear la sesión. Verifica tu correo si requiere confirmación.');
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${authData.session.access_token}`;
      const companyResponse = await api.post('/companies', { name: companyName });
      const newCompany = companyResponse.data;

      await supabase.auth.updateUser({ data: { company_id: newCompany.id } });
      await api.post('/users', {
        id: authData.user.id, email, name, role: 'admin', company_id: newCompany.id,
      });
      
      // Refresh session to get updated JWT with company_id
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh failed, continuing anyway:', refreshError);
      }
      
      localStorage.removeItem('DEV_TOKEN');
      navigate('/onboarding');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (err as { message?: string }).message || 'Error al registrar';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Info (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <BMLogo variant="full" className="h-8 mb-12" />
          
          <h1 className="text-3xl font-bold mb-4">
            Construye sin límites, <span className="text-emerald-400">controla todo</span>
          </h1>
          <p className="text-slate-400 mb-10">
            La plataforma centralizada para constructoras que buscan precisión financiera y control de campo.
          </p>

          <div className="space-y-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-medium mb-0.5">{benefit.title}</h3>
                  <p className="text-sm text-slate-400">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-12 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              Datos seguros
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              Configuración en 2 min
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <BMLogo variant="full" className="h-7" />
          </div>

          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-1">Crear Cuenta</h2>
            <p className="text-sm text-muted-foreground mb-8">Configura tu empresa en minutos</p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm flex items-start gap-3">
                <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="Constructora ABC SpA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Correo</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="nombre@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Crear mi cuenta <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => navigate('/login')} className="text-emerald-600 font-medium hover:text-emerald-700">
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
