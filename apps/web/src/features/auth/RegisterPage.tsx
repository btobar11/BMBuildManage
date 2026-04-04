import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, ShieldCheck, HardHat, BarChart3, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

const benefits = [
  { icon: <BarChart3 size={22} />, title: 'Presupuestos y APU', desc: 'Analiza costos directos e indirectos conectando tus bases de recursos maestras en la nube.', color: 'violet' },
  { icon: <ShieldCheck size={22} />, title: 'Historial Inmutable', desc: 'Audit Log completo: quién modificó qué, cuándo y qué valor cambió.', color: 'emerald' },
  { icon: <HardHat size={22} />, title: 'Control de Campo', desc: 'Asigna cuadrillas eficientemente y evita sobreposiciones de turnos.', color: 'amber' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'admin' }
        }
      });

      if (authError) throw authError;
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
      
      localStorage.removeItem('DEV_TOKEN');
      navigate('/onboarding');
    } catch (err: unknown) {
      console.error('Registration Error:', err);
      const errorMsg = err instanceof Error ? err.message : (err as { message?: string }).message || 'Error al registrar';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-foreground font-sans flex overflow-hidden">
      {/* Left Panel - Feature Showcase */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-violet-950/50 via-[#0a0a12] to-fuchsia-950/30 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/20 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 animate-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/15 blur-[120px] rounded-full translate-x-1/3 translate-y-1/3 animate-float-delayed" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
        
        <div className="relative z-10 w-full flex flex-col justify-center p-12 xl:p-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-lg">
              <img src="/logo-full.png" alt="BMBuildManage" className="h-9 object-contain" />
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-6">
              <Sparkles size={16} />
              <span>Únete a +500 constructoras</span>
            </div>
            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white leading-tight mb-4">
              Construye sin límites, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400">
                controla todo
              </span>
            </h1>
            <p className="text-base text-white/50 max-w-md leading-relaxed">
              La plataforma centralizada para constructoras que buscan precisión financiera, control de campo y un registro claro de auditoría.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border transition-all ${
                  benefit.color === 'violet' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 group-hover:bg-violet-500/20' :
                  benefit.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20' :
                  'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20'
                }`}>
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{benefit.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-6 text-white/30 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Datos seguros</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-violet-400" />
              <span>Configuración en 2 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10 bg-[#0a0a12]">
        {/* Mobile Header */}
        <div className="absolute top-6 left-4 sm:left-8 flex lg:hidden items-center gap-3 cursor-pointer z-20" onClick={() => navigate('/')}>
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
            <img src="/logo-full.png" alt="BMBuildManage" className="h-5 object-contain" />
          </div>
        </div>

        <div className="w-full max-w-md pt-16 lg:pt-0">
          <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-violet-900/10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-2">Crear Cuenta</h2>
              <p className="text-sm text-white/50">Configura tu empresa en minutos</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Empresa</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400">
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                      placeholder="Constructora ABC SpA"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Correo</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                      placeholder="nombre@empresa.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 group transition-all transform active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Crear mi cuenta
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-white/50">
                ¿Ya tienes cuenta?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
                  type="button"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
