import { useState, useEffect, useRef } from 'react';
import { useOnboardingSeeding } from './onboarding.mutations';
import { 
  Building2, 
  Pickaxe, 
  Target, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Loader2,
  Sparkles,
  Briefcase,
  TrendingUp,
  Users,
  Wrench,
  Ruler,
  Truck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingState {
  companyName: string;
  specialty: string;
  painPoint: string;
}

const specialties = [
  { icon: <Building2 size={24} />, label: 'Edificación', desc: 'Casas, departamentos, oficinas' },
  { icon: <Ruler size={24} />, label: 'Obras Civiles', desc: 'Puentes, túneles, contención' },
  { icon: <Wrench size={24} />, label: 'Industrial', desc: 'Plantas, faenas, minería' },
  { icon: <Truck size={24} />, label: 'Infraestructura', desc: 'Caminos, agua, saneamiento' },
  { icon: <Briefcase size={24} />, label: 'Remodelación', desc: 'Ampliaciones y renovaciones' },
  { icon: <Factory size={24} />, label: 'Estructuras Metálicas', desc: 'Galpones, tinglados' },
];

const painPoints = [
  { icon: <TrendingUp size={20} />, label: 'Descontrol en Presupuesto', desc: 'No sabes cuánto gastas realmente' },
  { icon: <Users size={20} />, label: 'Pérdida de Cuadrillas', desc: 'Dificultad para gestionar trabajadores' },
  { icon: <BarChart3 size={20} />, label: 'Reportes Confusos', desc: 'No tienes claridad del avance' },
  { icon: <Calculator size={20} />, label: 'Cálculos Manuales', desc: 'Pierdes tiempo en Excel' },
];

function Factory(props: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
    </svg>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
    </svg>
  );
}

function Calculator(props: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>
    </svg>
  );
}

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [data, setData] = useState<OnboardingState>({
    companyName: '',
    specialty: '',
    painPoint: ''
  });
  const [animationKey, setAnimationKey] = useState(0);

  const onboardingMutation = useOnboardingSeeding();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [step]);

  const handleNext = () => {
    if (step === 1 && !data.companyName.trim()) {
      toast.error('Ingresa el nombre de tu empresa');
      return;
    }
    setDirection('forward');
    setAnimationKey(prev => prev + 1);
    setStep((s) => (s + 1) as OnboardingStep);
  };

  const handleBack = () => {
    setDirection('backward');
    setAnimationKey(prev => prev + 1);
    setStep((s) => (s - 1) as OnboardingStep);
  };

  const handleFinish = () => {
    if (!data.painPoint) {
      toast.error('Selecciona el desafío principal que quieres resolver');
      return;
    }
    onboardingMutation.mutate({
      companyName: data.companyName,
      specialty: data.specialty,
      painPoint: data.painPoint
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/15 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-fuchsia-600/10 blur-[100px] rounded-full animate-float-delayed" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 shadow-lg shadow-violet-500/10 transform hover:scale-[1.02] transition-transform">
            <img src="/logo-full.png" alt="BMBuildManage" className="h-10 object-contain" />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                  s === step 
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 scale-110' 
                    : s < step 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 text-white/30'
                }`}
              >
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 sm:w-20 h-1 rounded-full transition-all duration-500 ${
                  s < step ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps Container */}
        <div 
          key={animationKey}
          className={`bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden min-h-[420px] shadow-2xl shadow-violet-900/20 ${
            direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          }`}
        >
          {/* Step 1: Company Name */}
          {step === 1 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Building2 size={28} className="text-violet-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Paso 1 de 3</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">¿Cómo se llama tu empresa?</h2>
                  </div>
                </div>
                <p className="text-white/50 mb-8 leading-relaxed">
                  Configuraremos tu espacio de trabajo con este nombre. Lo verás en todos tus documentos y reportes.
                </p>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ej: Constructora Horizon SpA"
                    className="relative w-full bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-4 text-white text-lg font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all placeholder:text-white/30"
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                  />
                </div>
              </div>

              <button 
                onClick={handleNext}
                className="w-full mt-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.01] active:scale-[0.99]"
              >
                Continuar <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Specialty */}
          {step === 2 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Pickaxe size={28} className="text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Paso 2 de 3</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">¿Cuál es tu especialidad?</h2>
                  </div>
                </div>
                <p className="text-white/50 mb-6 leading-relaxed">
                  Esto nos ayudará a mostrarte las mejores plantillas y funciones para tu tipo de obra.
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specialties.map((spec) => (
                    <button
                      key={spec.label}
                      onClick={() => setData({ ...data, specialty: spec.label })}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        data.specialty === spec.label 
                          ? 'bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border-violet-500/50 shadow-lg shadow-violet-500/20' 
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className={`mb-2 ${data.specialty === spec.label ? 'text-violet-400' : 'text-white/50'}`}>
                        {spec.icon}
                      </div>
                      <p className={`text-sm font-semibold ${data.specialty === spec.label ? 'text-white' : 'text-white/70'}`}>
                        {spec.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleBack}
                  className="px-6 py-4 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={18} /> Volver
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Siguiente <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pain Points */}
          {step === 3 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Target size={28} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Paso 3 de 3</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">¿Qué quieres resolver?</h2>
                  </div>
                </div>
                <p className="text-white/50 mb-6 leading-relaxed">
                  Selecciona el desafío principal. Personalizaremos tu Dashboard para que veas exactamente lo que necesitas.
                </p>
                
                <div className="space-y-3">
                  {painPoints.map((pain) => (
                    <button
                      key={pain.label}
                      onClick={() => setData({ ...data, painPoint: pain.label })}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                        data.painPoint === pain.label 
                          ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        data.painPoint === pain.label ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/5 text-white/50'
                      }`}>
                        {pain.icon}
                      </div>
                      <div>
                        <p className={`font-semibold ${data.painPoint === pain.label ? 'text-white' : 'text-white/70'}`}>
                          {pain.label}
                        </p>
                        <p className="text-xs text-white/40">{pain.desc}</p>
                      </div>
                      {data.painPoint === pain.label && (
                        <CheckCircle2 size={20} className="text-emerald-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleBack}
                  disabled={onboardingMutation.isPending}
                  className="px-6 py-4 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft size={18} /> Volver
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={onboardingMutation.isPending || !data.painPoint}
                  className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {onboardingMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Configurando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} /> Empezar a Construir
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-white/30 text-sm mt-6">
          Solo tardarás 2 minutos en configurar todo
        </p>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
