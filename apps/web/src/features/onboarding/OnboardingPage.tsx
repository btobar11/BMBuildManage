import { useState } from 'react';
import { useOnboardingSeeding } from './onboarding.mutations';
import { Building2, Pickaxe, Target, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingState {
  companyName: string;
  specialty: string;
  painPoint: string;
}

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingState>({
    companyName: '',
    specialty: '',
    painPoint: ''
  });

  const onboardingMutation = useOnboardingSeeding();

  const handleNext = () => {
    if (step === 1 && !data.companyName) {
      toast.error('Por favor, ingresa el nombre de tu empresa');
      return;
    }
    if (step === 2 && !data.specialty) {
      toast.error('Platícanos tu campo principal o especialidad');
      return;
    }
    setStep((s) => (s + 1) as OnboardingStep);
  };

  const handleFinish = () => {
    if (!data.painPoint) {
      toast.error('Agrega el dolor o desafío principal que tienes actualmente');
      return;
    }
    // Fire the seed mutation!
    onboardingMutation.mutate({
      companyName: data.companyName,
      specialty: data.specialty,
      painPoint: data.painPoint
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-card to-blue-950/20">
      <div className="w-full max-w-xl">
        {/* Progress header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-2xl px-6 py-2 shadow-sm border border-black/5 inline-flex">
                <img src="/logo-full.png" alt="BMBuildManage" className="h-[60px] object-contain" />
              </div>
            </div>
            <p className="text-muted-foreground mt-2">Personaliza tu experiencia configurando tu perfil</p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps container */}
        <div className="bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-blue-900/10 rounded-3xl p-8 relative overflow-hidden min-h-[400px]">
          {step === 1 && (
            <div className="animate-in slide-in-from-right fade-in duration-500 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">¿Cómo se llama tu empresa?</h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">Configuraremos tu espacio de trabajo maestro usando este nombre.</p>
                
                <input
                  type="text"
                  placeholder="Ej: Constructora Horizon SpA"
                  className="w-full bg-background border border-border rounded-xl px-5 py-4 text-foreground font-semibold text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner placeholder:text-muted-foreground/50"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                  autoFocus
                />
              </div>

              <button 
                onClick={handleNext}
                className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20"
              >
                Continuar <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right fade-in duration-500 h-full flex flex-col justify-between">
               <div>
                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Pickaxe size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">¿Cuál es su especialidad principal?</h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">Esto nos ayudará a presentarte plantillas APU (Análisis de Precios Unitarios) a la medida.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {['Obras Civiles', 'Edificación', 'Remodelación', 'Industrial', 'Vialidad', 'Estructuras Metálicas'].map(esp => (
                    <button
                      key={esp}
                      onClick={() => setData({ ...data, specialty: esp })}
                      className={`text-left px-5 py-4 rounded-xl border transition-all font-medium ${data.specialty === esp ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-muted border-border hover:bg-muted/80 text-foreground'}`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl border border-border text-foreground hover:bg-muted font-bold transition-colors">Volver</button>
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  Siguiente <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right fade-in duration-500 h-full flex flex-col justify-between">
               <div>
                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Target size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">¿Qué desafío quieres resolver urgente?</h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">Conocer el "dolor" ("Pain Point") actual nos indicará hacia dónde generar los reportes gerenciales en tu Dashboard.</p>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    'Descontrol en Presupuesto y Financiamiento Real', 
                    'Pérdida de material y desfase de Cubicaciones',
                    'Dificultad en Reportes y Sobrecubos visuales',
                    'Problemas controlando los Tratos (Mano de Obra)'
                  ].map(des => (
                    <button
                      key={des}
                      onClick={() => setData({ ...data, painPoint: des })}
                      className={`text-left px-5 py-4 rounded-xl border transition-all text-sm font-medium ${data.painPoint === des ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-muted border-border hover:bg-muted/80 text-foreground'}`}
                    >
                      {des}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setStep(2)} 
                  disabled={onboardingMutation.isPending}
                  className="px-6 py-4 rounded-xl border border-border text-foreground hover:bg-muted font-bold transition-colors disabled:opacity-50"
                >
                  Volver
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={onboardingMutation.isPending || !data.painPoint}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/30 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {onboardingMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Configurando Inteligencia...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} /> Empezar a Construir
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
