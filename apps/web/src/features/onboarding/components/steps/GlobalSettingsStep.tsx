import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useOnboardingSubmit } from '../../hooks/useOnboardingMutations';
import { globalSettingsSchema, type GlobalSettingsData } from '../../schemas/onboarding.schema';
import { Loader2, AlertCircle, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const CURRENCIES = [
  { value: 'CLP', label: 'Peso Chileno (CLP)', symbol: '$' },
  { value: 'USD', label: 'Dólar Americano (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'ARS', label: 'Peso Argentino (ARS)', symbol: '$' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
];

const TIMEZONES = [
  { value: 'America/Santiago', label: 'Santiago (Chile)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Lima', label: 'Lima (Perú)' },
  { value: 'America/Bogota', label: 'Bogotá (Colombia)' },
  { value: 'America/New_York', label: 'Nueva York (EE.UU.)' },
  { value: 'Europe/Madrid', label: 'Madrid (España)' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export function GlobalSettingsStep() {
  const { settingsData, setSettingsData, lastError, prevStep } = useOnboardingStore();
  const { submitStep, isLoading, error: submitError } = useOnboardingSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<GlobalSettingsData>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: settingsData || {
      currency: 'CLP',
      timezone: 'America/Santiago',
      language: 'es',
      dateFormat: 'DD/MM/YYYY',
      measurementUnit: 'metric',
      fiscalYearStart: 1,
      enableNotifications: true,
      enable2FA: false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: GlobalSettingsData) => {
    setSettingsData(data);
    await submitStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Configuración Global</h2>
        <p className="text-sm text-muted-foreground">
          Ajusta las preferencias de tu cuenta
        </p>
      </div>

      {/* Error Display */}
      {(lastError || submitError) && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{lastError || (submitError as Error)?.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Currency & Language Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium">
              Moneda
            </label>
            <select
              id="currency"
              {...register('currency')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              Idioma
            </label>
            <select
              id="language"
              {...register('language')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone & Date Format Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium">
              Zona Horaria
            </label>
            <select
              id="timezone"
              {...register('timezone')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dateFormat" className="text-sm font-medium">
              Formato de Fecha
            </label>
            <select
              id="dateFormat"
              {...register('dateFormat')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {DATE_FORMATS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Measurement & Fiscal Year Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="measurementUnit" className="text-sm font-medium">
              Sistema de Medidas
            </label>
            <select
              id="measurementUnit"
              {...register('measurementUnit')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="metric">Métrico (m, m², m³)</option>
              <option value="imperial">Imperial (ft, ft², ft³)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="fiscalYearStart" className="text-sm font-medium">
              Inicio Año Fiscal
            </label>
            <select
              id="fiscalYearStart"
              {...register('fiscalYearStart', { valueAsNumber: true })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div>
              <span className="text-sm font-medium">Notificaciones</span>
              <p className="text-xs text-muted-foreground">
                Recibir alertas sobre proyectos y presupuestos
              </p>
            </div>
            <input
              type="checkbox"
              {...register('enableNotifications')}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div>
              <span className="text-sm font-medium">Autenticación de Dos Factores</span>
              <p className="text-xs text-muted-foreground">
                Mayor seguridad para tu cuenta
              </p>
            </div>
            <input
              type="checkbox"
              {...register('enable2FA')}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={prevStep}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </button>
          
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all',
              'bg-primary text-white hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}