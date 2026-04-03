import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, ShieldCheck, HardHat, BarChart3 } from 'lucide-react';

import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 1. Sign up user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'admin',
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user || !authData.session) {
        throw new Error('No se pudo crear la sesión. Verifica tu correo si requiere confirmación.');
      }

      // 2. Set the Authorization header for api calls manually since AuthContext might not have picked it up yet
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.session.access_token}`;

      // 3. Create Company in Backend
      console.log('Creando empresa...');
      const companyResponse = await api.post('/companies', {
        name: companyName,
      });
      const newCompany = companyResponse.data;

      // 4. Update Supabase User Metadata with company_id
      await supabase.auth.updateUser({
        data: { company_id: newCompany.id }
      });

      // 5. Create User profile in Backend
      console.log('Creando perfil de usuario...');
      await api.post('/users', {
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        company_id: newCompany.id,
      });
      
      // Clear dev token if it exists
      localStorage.removeItem('DEV_TOKEN');
      navigate('/onboarding');
    } catch (err: unknown) {
      console.error('Registration Error:', err);
      const errorMsg = err instanceof Error ? err.message : (err as { message?: string }).message || 'Error al registrar el usuario';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
      
      {/* Left Panel - Feature Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-900/40 via-[#06080a] to-blue-900/20 border-r border-white/5 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        
        <div className="relative z-10 w-full flex flex-col justify-center p-16 xl:p-24">
          <div className="flex items-center gap-3 mb-16 cursor-pointer bg-white/95 backdrop-blur px-5 py-2.5 w-max rounded-2xl border border-black/10 shadow-xl" onClick={() => navigate('/')}>
            <img 
              src="/logo-full.png" 
              alt="BMBuildManage" 
              className="h-10 object-contain"
            />
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-8">
            Comienza a controlar <span className="text-blue-500">cada etapa</span> de tus proyectos
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-lg leading-relaxed">
            Únete a la plataforma centralizada para contratistas y constructoras que buscan precisión financiera, control de campo y un registro claro de auditoría.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                <BarChart3 className="text-indigo-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Presupuestos y APU</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Analiza costos directos e indirectos conectando tus bases de recursos maestras en la nube.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                <ShieldCheck className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Historial Inmutable</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Con nuestro *Audit Log* nunca perderás de vista qué cantidad se modificó, quién la modificó y cuándo.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                <HardHat className="text-orange-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Asignaciones en Campo</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Opera y asigna a tu cuadrilla de trabajadores eficientemente previniendo sobreposiciones de turnos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="absolute top-8 left-6 sm:left-12 flex lg:hidden items-center gap-3 cursor-pointer z-20" onClick={() => navigate('/')}>
          <img 
            src="/logo-full.png" 
            alt="BMBuildManage" 
            className="h-6 object-contain"
          />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white sm:bg-transparent sm:border-0 p-8 sm:p-0 rounded-3xl shadow-xl sm:shadow-none border border-slate-200 sm:border-transparent">
            <div className="flex flex-col mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Crear Cuenta</h2>
              <p className="text-slate-500 text-sm">
                Rellena estos pocos datos para configurar tu entorno corporativo
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Nombre Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Nombre de la Empresa
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Building2 size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Constructora ABC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="nombre@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group transition-all transform active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Registrar Empresa
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-sm">
                ¿Ya eres miembro?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors focus:outline-none focus:underline"
                  type="button"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
