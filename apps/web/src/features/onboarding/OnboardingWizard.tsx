import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { Stepper } from './components/Stepper';
import { CompanySetupStep } from './components/steps/CompanySetupStep';
import { InviteTeamStep } from './components/steps/InviteTeamStep';
import { GlobalSettingsStep } from './components/steps/GlobalSettingsStep';
import { CompleteStep } from './components/steps/CompleteStep';
import { cn } from '../../utils/cn';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { 
    currentStep, 
    companyData,
    setError,
    lastError 
  } = useOnboardingStore();

  // Guard: If user already has company setup, redirect away from onboarding
  useEffect(() => {
    if (companyData) {
      // Optional: Check if onboarding was already completed
      // This would require an API call or stored flag
    }
  }, [companyData]);

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'SETUP_COMPANY':
        return <CompanySetupStep />;
      case 'INVITE_TEAM':
        return <InviteTeamStep />;
      case 'GLOBAL_SETTINGS':
        return <GlobalSettingsStep />;
      case 'COMPLETE':
        return <CompleteStep />;
      default:
        return <CompanySetupStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo / Brand */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                BM
              </div>
              <span className="text-lg font-semibold">BMBuildManage</span>
            </div>
            
            {/* Step Counter */}
            <div className="text-sm text-muted-foreground">
              Paso {currentStep === 'SETUP_COMPANY' && '1 de 4'}
              {currentStep === 'INVITE_TEAM' && '2 de 4'}
              {currentStep === 'GLOBAL_SETTINGS' && '3 de 4'}
              {currentStep === 'COMPLETE' && '4 de 4'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper showDescriptions />
        </div>

        {/* Error Toast (if any persistent error) */}
        {lastError && (
          <div className="mb-6 rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            <strong>Error:</strong> {lastError}
          </div>
        )}

        {/* Step Content Card */}
        <div className={cn(
          'rounded-2xl border border-border bg-background p-6 shadow-lg',
          'transition-all duration-300'
        )}>
          {renderStep()}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 BMBuildManage • Todos los datos se encriptan end-to-end</p>
        </div>
      </main>
    </div>
  );
}

// =====================================================================
// EXPORTS
// =====================================================================

export { useOnboardingStore } from './store/useOnboardingStore';
export { useOnboardingSubmit, useCreateCompany, useInviteTeam, useUpdateGlobalSettings, useCompleteOnboarding } from './hooks/useOnboardingMutations';
export * from './schemas/onboarding.schema';
export { Stepper } from './components/Stepper';
export { CompanySetupStep } from './components/steps/CompanySetupStep';
export { InviteTeamStep } from './components/steps/InviteTeamStep';
export { GlobalSettingsStep } from './components/steps/GlobalSettingsStep';
export { CompleteStep } from './components/steps/CompleteStep';