import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useCompleteOnboarding } from '../../hooks/useOnboardingMutations';
import { supabase } from '../../../../lib/supabase';
import { Loader2, AlertCircle, CheckCircle, Sparkles, LayoutDashboard } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export function CompleteStep() {
  const navigate = useNavigate();
  const { companyData, teamData, settingsData, lastError, prevStep } = useOnboardingStore();
  const { mutateAsync: completeOnboarding, isPending } = useCompleteOnboarding();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      setIsCompleted(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', session.user.id)
          .single();
        
        if (userData?.company_id) {
          window.location.reload();
          return;
        }
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-pulse">
          <Sparkles className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-success">¡Onboarding Completado!</h2>
        <p className="mt-2 text-muted-foreground">
          Redirigiendo al Dashboard...
        </p>
        <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <h2 className="text-xl font-semibold">¡Estás Listo!</h2>
        <p className="text-sm text-muted-foreground">
          Revisa el resumen de tu configuración antes de continuar
        </p>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{lastError}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="space-y-3">
        {/* Company Summary */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-bold text-primary">
                {companyData?.companyName?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium">{companyData?.companyName || 'Empresa'}</p>
              <p className="text-sm text-muted-foreground">RUT: {companyData?.rut || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Team Summary */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <span className="text-lg font-bold text-blue-600">
                  {teamData?.invites?.length || 0}
                </span>
              </div>
              <div>
                <p className="font-medium">Miembros Invitados</p>
                <p className="text-sm text-muted-foreground">
                  {teamData?.invites?.filter(i => i.email).length || 0} correos enviados
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {teamData?.invites?.filter(i => i.role === 'admin').length || 0} admins
              </p>
              <p className="text-xs text-muted-foreground">
                {teamData?.invites?.filter(i => i.role === 'manager').length || 0} managers
              </p>
            </div>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <span className="text-lg font-bold text-green-600">
                  {settingsData?.currency || 'CLP'}
                </span>
              </div>
              <div>
                <p className="font-medium">Configuración</p>
                <p className="text-sm text-muted-foreground">
                  {settingsData?.language === 'es' ? 'Español' : 
                   settingsData?.language === 'en' ? 'English' : 'Português'}
                  {' • '}
                  {settingsData?.measurementUnit === 'metric' ? 'Métrico' : 'Imperial'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settingsData?.enableNotifications && (
                <span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">
                  Notificaciones
                </span>
              )}
              {settingsData?.enable2FA && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                  2FA
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Checkbox */}
      <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer hover:bg-muted/50">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <div>
          <span className="text-sm font-medium">
            Confirmo que la información es correcta
          </span>
          <p className="text-xs text-muted-foreground">
            Al continuar, aceptas los términos y condiciones del servicio
          </p>
        </div>
      </label>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-muted"
        >
          Atrás
        </button>
        
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all',
            'bg-success text-white hover:bg-success/90',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Completando...
            </>
          ) : (
            <>
              <LayoutDashboard className="h-4 w-4" />
              Ir al Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  );
}