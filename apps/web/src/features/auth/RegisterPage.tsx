import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, ShieldCheck, BarChart3, HardHat, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import { BMLogo } from '../../components/ui/BMLogo';

const benefits = [
  { icon: <BarChart3 size={20} />, title: 'Presupuestos APU', desc: 'Costos directos e indirectos en la nube' },
  { icon: <ShieldCheck size={20} />, title: 'Audit Log', desc: 'Historial completo de cambios' },
  { icon: <HardHat size={20} />, title: 'Control de Campo', desc: 'Gestiona cuadrillas eficientemente' },
];

// Password validation rules
const passwordRequirements = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos un número', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'Al menos un carácter especial (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

// Calculate password strength
function getPasswordStrength(password: string): { score: number; level: string; color: string } {
  const passed = passwordRequirements.filter(req => req.test(password)).length;
  const score = Math.round((passed / passwordRequirements.length) * 100);
  
  if (score <= 20) return { score, level: 'Muy débil', color: 'bg-red-500' };
  if (score <= 40) return { score, level: 'Débil', color: 'bg-orange-500' };
  if (score <= 60) return { score, level: 'Media', color: 'bg-yellow-500' };
  if (score <= 80) return { score, level: 'Fuerte', color: 'bg-green-500' };
  return { score, level: 'Muy fuerte', color: 'bg-emerald-500' };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Computed values
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordRequirementsMet = useMemo(() => 
    passwordRequirements.map(req => ({ ...req, passed: req.test(password) })), 
    [password]
  );
  
  // Validate email on blur
  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Ingresa un correo electrónico válido');
    } else {
      setEmailError(null);
    }
  };
  
  // Check if form is valid
  const isFormValid = useMemo(() => {
    const allPasswordReqsMet = passwordRequirements.every(req => req.test(password));
    const isEmailValid = isValidEmail(email);
    return firstName.trim() && lastName.trim() && companyName.trim() && isEmailValid && allPasswordReqsMet;
  }, [firstName, lastName, companyName, email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Final validation before submit
    if (!isValidEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      setLoading(false);
      return;
    }
    
    const allPasswordReqsMet = passwordRequirements.every(req => req.test(password));
    if (!allPasswordReqsMet) {
      setError('La contraseña no cumple con todos los requisitos de seguridad');
      setLoading(false);
      return;
    }
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            first_name: firstName, 
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            role: 'admin' 
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
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

      await api.post('/companies', { name: companyName });
      
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
              {/* Name Fields Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Juan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Apellido</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Pérez"
                    />
                  </div>
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
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    onBlur={handleEmailBlur}
                    className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                      emailError ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
                    }`}
                    placeholder="nombre@empresa.com"
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
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
                
                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Fortaleza:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-').replace('-500', '-600')}`}>
                        {passwordStrength.level}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Password Requirements */}
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirementsMet.map((req) => (
                      <div 
                        key={req.key} 
                        className={`flex items-center gap-1.5 text-xs ${
                          req.passed ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        <CheckCircle2 size={12} className={req.passed ? 'opacity-100' : 'opacity-30'} />
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
