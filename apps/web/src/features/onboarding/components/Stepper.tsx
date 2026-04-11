import { useOnboardingStore } from '../store/useOnboardingStore';
import { ONBOARDING_STEPS, STEP_LABELS, type OnboardingStep } from '../schemas/onboarding.schema';
import { Check, Circle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface StepperProps {
  className?: string;
  showDescriptions?: boolean;
}

export function Stepper({ className, showDescriptions = false }: StepperProps) {
  const { currentStep, completedSteps, goToStep, isStepAccessible } = useOnboardingStore();

  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);

  return (
    <nav className={cn('w-full', className)} aria-label="Progreso del onboarding">
      <ol className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step);
          const isCurrent = step === currentStep;
          const isAccessible = isStepAccessible(step);
          
          const handleClick = () => {
            if (isAccessible) {
              goToStep(step);
            }
          };

          return (
            <li 
              key={step} 
              className={cn(
                'relative flex items-center',
                index !== ONBOARDING_STEPS.length - 1 && 'flex-1'
              )}
            >
              {/* Step Circle */}
              <button
                type="button"
                onClick={handleClick}
                disabled={!isAccessible}
                className={cn(
                  'relative flex flex-col items-center',
                  isAccessible ? 'cursor-pointer' : 'cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isCompleted && 'border-success-500 bg-success-500 text-white',
                    isCurrent && !isCompleted && 'border-primary bg-primary text-white',
                    !isCompleted && !isCurrent && 'border-muted bg-background text-muted-foreground',
                    !isAccessible && 'opacity-50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Circle className={cn('h-4 w-4', isCurrent && 'fill-current')} />
                  )}
                </span>
                
                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-success-600',
                    !isCompleted && !isCurrent && 'text-muted-foreground',
                    !isAccessible && 'opacity-50'
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
                
                {/* Description (optional) */}
                {showDescriptions && (
                  <span className="absolute -bottom-6 text-xs text-muted-foreground whitespace-nowrap">
                    {step === 'SETUP_COMPANY' && 'Empresa'}
                    {step === 'INVITE_TEAM' && 'Equipo'}
                    {step === 'GLOBAL_SETTINGS' && 'Ajustes'}
                    {step === 'COMPLETE' && 'Fin'}
                  </span>
                )}
              </button>

              {/* Connector Line */}
              {index !== ONBOARDING_STEPS.length - 1 && (
                <div 
                  className={cn(
                    'mx-4 h-0.5 flex-1 transition-colors duration-200',
                    index < currentStepIndex ? 'bg-success-500' : 'bg-muted'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// =====================================================================
// COMPACT STEPPER (for mobile or smaller spaces)
// =====================================================================

export function CompactStepper({ className }: { className?: string }) {
  const { currentStep } = useOnboardingStore();
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {ONBOARDING_STEPS.map((step, index) => (
        <div
          key={step}
          className={cn(
            'h-2 flex-1 rounded-full transition-all duration-300',
            index <= currentStepIndex ? 'bg-primary' : 'bg-muted',
            index === currentStepIndex && 'w-8'
          )}
        />
      ))}
    </div>
  );
}