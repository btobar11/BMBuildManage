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
  { icon: <Building2 size={20} />, label: 'Edificación' },
  { icon: <Ruler size={20} />, label: 'Obras Civiles' },
  { icon: <Wrench size={20} />, label: 'Industrial' },
  { icon: <Truck size={20} />, label: 'Infraestructura' },
  { icon: <Briefcase size={20} />, label: 'Remodelación' },
  { icon: <Building2 size={20} />, label: 'Estructuras Metálicas' },
];

const painPoints = [
  { label: 'Descontrol en Presupuesto', desc: 'No sabes cuánto gastas realmente' },
  { label: 'Pérdida de Cuadrillas', desc: 'Dificultad para gestionar trabajadores' },
  { label: 'Reportes Confusos', desc: 'No tienes claridad del avance' },
  { label: 'Cálculos Manuales', desc: 'Pierdes tiempo en Excel' },
];

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
      setTimeout(() => inputRef.current?.focus(), 300);
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
      toast.error('Selecciona el desafío principal');
      return;
    }
    onboardingMutation.mutate({
      companyName: data.companyName,
      specialty: data.specialty,
      painPoint: data.painPoint
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src="/logo-full.png" alt="BMBuildManage" className="h-8 object-contain" />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  s === step 
                    ? 'bg-emerald-600 text-white' 
                    : s < step 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 rounded ${s < step ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div 
          key={animationKey}
          className={`bg-card rounded-xl border border-border p-8 transition-all duration-300 ${
            direction === 'forward' ? 'animate-fade-up' : ''
          }`}
        >
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Paso 1 de 3</p>
                  <h2 className="text-xl font-semibold text-foreground">¿Cómo se llama tu empresa?</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Configuraremos tu espacio de trabajo con este nombre.
              </p>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ej: Constructora Horizon SpA"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
              />
              <button 
                onClick={handleNext}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <Pickaxe size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Paso 2 de 3</p>
                  <h2 className="text-xl font-semibold text-foreground">¿Cuál es tu especialidad?</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Esto nos ayudará a mostrarte las mejores plantillas.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((spec) => (
                  <button
                    key={spec.label}
                    onClick={() => setData({ ...data, specialty: spec.label })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      data.specialty === spec.label 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-background border-border hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={data.specialty === spec.label ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {spec.icon}
                      </span>
                      <span className="text-sm font-medium">{spec.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleBack}
                  className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Volver
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Siguiente <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Paso 3 de 3</p>
                  <h2 className="text-xl font-semibold text-foreground">¿Qué quieres resolver?</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Personalizaremos tu Dashboard para mostrarte lo que necesitas.
              </p>
              <div className="space-y-3">
                {painPoints.map((pain) => (
                  <button
                    key={pain.label}
                    onClick={() => setData({ ...data, painPoint: pain.label })}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      data.painPoint === pain.label 
                        ? 'bg-emerald-50 border-emerald-500' 
                        : 'bg-background border-border hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      data.painPoint === pain.label 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-slate-300'
                    }`}>
                      {data.painPoint === pain.label && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${data.painPoint === pain.label ? 'text-emerald-700' : 'text-foreground'}`}>
                        {pain.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{pain.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleBack}
                  disabled={onboardingMutation.isPending}
                  className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft size={16} /> Volver
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={onboardingMutation.isPending || !data.painPoint}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {onboardingMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Configurando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Empezar a Construir
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Solo tardarás 2 minutos
        </p>
      </div>
    </div>
  );
}
