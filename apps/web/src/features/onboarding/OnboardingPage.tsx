import { useState, useEffect, useRef } from 'react';
import { useOnboardingSeeding } from './onboarding.mutations';
import { BMLogo } from '../../components/ui/BMLogo';
import { 
  Building2, 
  Pickaxe, 
  Target, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Loader2,
  Sparkles,
  Building2 as Briefcase,
  Wrench,
  Ruler,
  Truck,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingState {
  companyName: string;
  rut: string;
  legalType: string;
  address: string;
  industry: string[];
  companySize: string;
  phone: string;
  specialty: string;
  challenges: string[];
}

const LEGAL_TYPES = [
  { value: 'SpA', label: 'SpA (Sociedad por Acciones)' },
  { value: 'EIRL', label: 'EIRL (Empresa Individual)' },
  { value: 'Ltda.', label: 'Ltda. (Sociedad de Responsabilidad Limitada)' },
  { value: 'S.A.', label: 'S.A. (Sociedad Anónima)' },
  { value: 'Empresa Individual', label: 'Empresa Individual (sin constitución legal)' },
];

const INDUSTRIES = [
  { value: 'construction', label: 'Construcción', icon: <Building2 size={20} /> },
  { value: 'engineering', label: 'Ingeniería', icon: <Wrench size={20} /> },
  { value: 'architecture', label: 'Arquitectura', icon: <Ruler size={20} /> },
  { value: 'real_estate', label: 'Bienes Raíces', icon: <Briefcase size={20} /> },
  { value: 'industrial', label: 'Industrial', icon: <Truck size={20} /> },
];

const CHALLENGES = [
  { value: 'budget_control', label: 'Descontrol en Presupuesto', desc: 'No sabes cuánto gastas realmente' },
  { value: 'team_management', label: 'Pérdida de Cuadrillas', desc: 'Dificultad para gestionar trabajadores' },
  { value: 'reporting', label: 'Reportes Confusos', desc: 'No tienes claridad del avance' },
  { value: 'calculations', label: 'Cálculos Manuales', desc: 'Pierdes tiempo en Excel' },
  { value: 'schedule_delays', label: 'Retrasos en Cronograma', desc: 'Dificultad para controlar plazos' },
  { value: 'material_waste', label: 'Desperdicio de Materiales', desc: 'Sin control de desperdicio' },
];

const SPECIALTIES = [
  { value: 'edificacion', label: 'Edificación' },
  { value: 'obras_civiles', label: 'Obras Civiles' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'remodelacion', label: 'Remodelación' },
  { value: 'estructuras_metalicas', label: 'Estructuras Metálicas' },
];

const CHILEAN_RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

function formatRut(value: string): string {
  const clean = value.replace(/[^kK0-9]/g, '');
  if (clean.length <= 1) return clean;
  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return clean.slice(0, -1) + '-' + clean.slice(-1);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/(\d)(?=(\d{3})+$)/g, '$1.');
  return formatted + '-' + dv;
}

function validateChileanRut(rut: string): boolean {
  const cleanRut = rut.replace(/[.-]/g, '');
  if (cleanRut.length < 7) return false;
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : String(expectedDv);
  return dv === calculatedDv;
}

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [data, setData] = useState<OnboardingState>({
    companyName: '',
    rut: '',
    legalType: '',
    address: '',
    industry: [],
    companySize: '1-10',
    phone: '',
    specialty: '',
    challenges: []
  });
  const [animationKey, setAnimationKey] = useState(0);

  const onboardingMutation = useOnboardingSeeding();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  const toggleIndustry = (value: string) => {
    setData(prev => ({
      ...prev,
      industry: prev.industry.includes(value)
        ? prev.industry.filter(i => i !== value)
        : [...prev.industry, value]
    }));
  };

  const toggleChallenge = (value: string) => {
    setData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(value)
        ? prev.challenges.filter(c => c !== value)
        : [...prev.challenges, value]
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!data.companyName.trim()) {
        toast.error('Ingresa el nombre o razón social');
        return;
      }
      if (!data.rut.trim() || !CHILEAN_RUT_REGEX.test(data.rut) || !validateChileanRut(data.rut)) {
        toast.error('Ingresa un RUT válido (formato: XX.XXX.XXX-X)');
        return;
      }
      if (!data.legalType) {
        toast.error('Selecciona el tipo de empresa');
        return;
      }
      if (!data.address.trim()) {
        toast.error('Ingresa la dirección de la casa matriz');
        return;
      }
      if (data.industry.length === 0) {
        toast.error('Selecciona al menos un tipo de construcción');
        return;
      }
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
    if (data.challenges.length === 0) {
      toast.error('Selecciona al menos un desafío');
      return;
    }
    onboardingMutation.mutate({
      companyName: data.companyName,
      rut: data.rut,
      legalType: data.legalType,
      address: data.address,
      industry: data.industry,
      companySize: data.companySize,
      phone: data.phone,
      specialty: data.specialty,
      challenges: data.challenges
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <BMLogo variant="full" className="h-8" />
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
          {/* Step 1: Legal Data */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Paso 1 de 3</p>
                  <h2 className="text-xl font-semibold text-foreground">Datos Legales</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Ingresa los datos legales de tu empresa.
              </p>
              
              {/* Company Name / Razón Social */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">Nombre o Razón Social</label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ej: Constructora Horizon SpA"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                />
              </div>
              
              {/* RUT with format mask */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">RUT Empresa</label>
                <input
                  type="text"
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  value={data.rut}
                  onChange={(e) => setData({ ...data, rut: formatRut(e.target.value) })}
                  maxLength={12}
                />
              </div>
              
              {/* Legal Type Dropdown */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">Tipo de Empresa</label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={data.legalType}
                  onChange={(e) => setData({ ...data, legalType: e.target.value })}
                >
                  <option value="">Selecciona tipo legal...</option>
                  {LEGAL_TYPES.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">Dirección Casa Matriz</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Av. Libertador Bernardo O''Higgins 1449"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Industry Multi-select */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">Tipo de Construcción (selección múltiple)</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => toggleIndustry(ind.value)}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                        data.industry.includes(ind.value) 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'bg-background border-border hover:border-emerald-300'
                      }`}
                    >
                      <span className={data.industry.includes(ind.value) ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {ind.icon}
                      </span>
                      <span className="text-sm font-medium">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Size & Phone Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tamaño</label>
                  <select
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={data.companySize}
                    onChange={(e) => setData({ ...data, companySize: e.target.value })}
                  >
                    <option value="1-10">1-10 empleados</option>
                    <option value="11-50">11-50 empleados</option>
                    <option value="51-200">51-200 empleados</option>
                    <option value="201-500">201-500 empleados</option>
                    <option value="500+">500+ empleados</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <button 
                onClick={handleNext}
                disabled={!data.companyName.trim() || !data.rut.trim() || !data.legalType || !data.address.trim() || data.industry.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Specialty */}
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
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec.value}
                    onClick={() => setData({ ...data, specialty: spec.value })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      data.specialty === spec.value 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-background border-border hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{spec.label}</span>
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

          {/* Step 3: Challenges Multi-select */}
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
                Selecciona todos los desafíos que aplique (selección múltiple).
              </p>
              <div className="space-y-3">
                {CHALLENGES.map((pain) => (
                  <button
                    key={pain.value}
                    type="button"
                    onClick={() => toggleChallenge(pain.value)}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      data.challenges.includes(pain.value) 
                        ? 'bg-emerald-50 border-emerald-500' 
                        : 'bg-background border-border hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      data.challenges.includes(pain.value) 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-slate-300'
                    }`}>
                      {data.challenges.includes(pain.value) && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${data.challenges.includes(pain.value) ? 'text-emerald-700' : 'text-foreground'}`}>
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
                  disabled={onboardingMutation.isPending || data.challenges.length === 0}
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