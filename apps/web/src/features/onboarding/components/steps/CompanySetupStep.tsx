import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useOnboardingSubmit } from '../../hooks/useOnboardingMutations';
import { companySetupSchema, type CompanySetupData } from '../../schemas/onboarding.schema';
import { useState } from 'react';
import { Loader2, AlertCircle, ChevronRight, Building2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export function CompanySetupStep() {
  const { companyData, setCompanyData, lastError, clearValidationErrors } = useOnboardingStore();
  const { submitStep, isLoading, error: submitError } = useOnboardingSubmit();
  const [showRutHelp, setShowRutHelp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CompanySetupData>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: companyData || {
      companyName: '',
      rut: '',
      industry: 'construction',
      companySize: '1-10',
      phone: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: CompanySetupData) => {
    setCompanyData(data);
    await submitStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Configura tu Empresa</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa los datos de tu empresa para comenzar
        </p>
      </div>

      {/* Error Display */}
      {(lastError || submitError) && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{lastError || (submitError as Error)?.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Company Name */}
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium">
            Nombre de la Empresa <span className="text-danger">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            {...register('companyName')}
            className={cn(
              'w-full rounded-lg border bg-background px-4 py-2.5 text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              errors.companyName ? 'border-danger' : 'border-border'
            )}
            placeholder="Ej. Constructora XYZ SpA"
          />
          {errors.companyName && (
            <p className="text-sm text-danger">{errors.companyName.message}</p>
          )}
        </div>

        {/* RUT with help toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="rut" className="text-sm font-medium">
              RUT Empresa <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowRutHelp(!showRutHelp)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ¿Qué es el RUT?
            </button>
          </div>
          
          {showRutHelp && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              El RUT (Rol Único Tributario) es el identificador fiscal chileno. 
              Formato: 12.345.678-9 o 12345678-9
            </div>
          )}
          
          <input
            id="rut"
            type="text"
            {...register('rut')}
            className={cn(
              'w-full rounded-lg border bg-background px-4 py-2.5 text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              errors.rut ? 'border-danger' : 'border-border'
            )}
            placeholder="12.345.678-9"
          />
          {errors.rut && (
            <p className="text-sm text-danger">{errors.rut.message}</p>
          )}
        </div>

        {/* Industry & Size Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Industry */}
          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium">
              Rubro
            </label>
            <select
              id="industry"
              {...register('industry')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="construction">Construcción</option>
              <option value="engineering">Ingeniería</option>
              <option value="architecture">Arquitectura</option>
              <option value="real_estate">Bienes Raíces</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <label htmlFor="companySize" className="text-sm font-medium">
              Tamaño
            </label>
            <select
              id="companySize"
              {...register('companySize')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="1-10">1-10 empleados</option>
              <option value="11-50">11-50 empleados</option>
              <option value="51-200">51-200 empleados</option>
              <option value="201-500">201-500 empleados</option>
              <option value="500+">500+ empleados</option>
            </select>
          </div>
        </div>

        {/* Phone (optional) */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={cn(
              'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              errors.phone ? 'border-danger' : 'border-border'
            )}
            placeholder="+56 9 1234 5678"
          />
          {errors.phone && (
            <p className="text-sm text-danger">{errors.phone.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all',
            'bg-primary text-white hover:bg-primary/90',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando empresa...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}