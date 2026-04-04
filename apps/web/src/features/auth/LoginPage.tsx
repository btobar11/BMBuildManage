import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, LayoutDashboard, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      localStorage.removeItem('DEV_TOKEN');
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (err as { message?: string }).message || 'Error al iniciar sesión';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    signInDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0a0a12] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 blur-[150px] rounded-full animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/15 blur-[120px] rounded-full animate-float-delayed" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 shadow-lg shadow-violet-500/10 transform hover:scale-[1.02] transition-transform">
            <img src="/logo-full.png" alt="BMBuildManage" className="h-10 object-contain" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-violet-900/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">¡Bienvenido de vuelta!</h1>
            <p className="text-white/50 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
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
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Contraseña
                </label>
                <button type="button" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-violet-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
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
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 group transition-all transform active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Button */}
          <div className="mt-8 space-y-4">
            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all"
            >
              <LayoutDashboard size={18} className="text-violet-400" />
              <span>Acceso Demo (Desarrollo)</span>
            </button>
            
            <p className="text-center text-white/50 text-sm">
              ¿No tienes cuenta?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
                type="button"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          Al iniciar sesión, aceptas nuestros{' '}
          <a href="#" className="text-violet-400 hover:text-violet-300">Términos</a> y{' '}
          <a href="#" className="text-violet-400 hover:text-violet-300">Privacidad</a>
        </p>
      </div>
    </div>
  );
}
