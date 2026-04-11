import { create } from 'zustand';
import { 
  OnboardingStep, 
  ONBOARDING_STEPS, 
  CompanySetupData, 
  InviteTeamData, 
  GlobalSettingsData 
} from './schemas/onboarding.schema';

// =====================================================================
// ONBOARDING STORE STATE
// =====================================================================

interface OnboardingState {
  // Current step in the wizard
  currentStep: OnboardingStep;
  
  // Step data storage
  companyData: CompanySetupData | null;
  teamData: InviteTeamData | null;
  settingsData: GlobalSettingsData | null;
  
  // Navigation history (for back button)
  history: OnboardingStep[];
  
  // Error tracking
  lastError: string | null;
  validationErrors: Record<string, string>;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Completion tracking
  completedSteps: Set<OnboardingStep>;
  
  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => boolean; // Returns false if transition invalid
  
  // Data actions
  setCompanyData: (data: CompanySetupData) => void;
  setTeamData: (data: InviteTeamData) => void;
  setSettingsData: (data: GlobalSettingsData) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  setValidationError: (field: string, message: string) => void;
  clearValidationErrors: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  
  // Reset
  reset: () => void;
  
  // Getters
  getCurrentStepIndex: () => number;
  isStepAccessible: (step: OnboardingStep) => boolean;
  canProceed: () => boolean;
  canGoBack: () => boolean;
}

// =====================================================================
// ONBOARDING STORE IMPLEMENTATION
// =====================================================================

const initialState = {
  currentStep: 'SETUP_COMPANY' as OnboardingStep,
  companyData: null,
  teamData: null,
  settingsData: null,
  history: [] as OnboardingStep[],
  lastError: null,
  validationErrors: {} as Record<string, string>,
  isLoading: false,
  isSaving: false,
  completedSteps: new Set<OnboardingStep>(),
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  // ------------------------------------------------------------------------
  // Navigation Actions
  // ------------------------------------------------------------------------

  setCurrentStep: (step: OnboardingStep) => {
    const { currentStep, history, completedSteps } = get();
    
    // Add to history if moving forward
    const stepIndex = ONBOARDING_STEPS.indexOf(step);
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    
    // Mark current step as completed when moving forward
    if (stepIndex > currentIndex) {
      completedSteps.add(currentStep);
    }
    
    set({
      currentStep: step,
      history: stepIndex > currentIndex 
        ? [...history, currentStep] 
        : history.slice(0, -1),
      completedSteps,
      lastError: null, // Clear errors on step change
    });
  },

  nextStep: () => {
    const { currentStep, companyData } = get();
    
    // Guard: Cannot proceed from SETUP_COMPANY without company data
    if (currentStep === 'SETUP_COMPANY' && !companyData) {
      set({ 
        lastError: 'Debes completar la información de la empresa antes de continuar' 
      });
      return;
    }
    
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentIndex + 1];
      get().setCurrentStep(nextStep);
    }
  },

  prevStep: () => {
    const { history } = get();
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      get().setCurrentStep(prevStep);
    }
  },

  goToStep: (step: OnboardingStep) => {
    const { currentStep, companyData } = get();
    
    const targetIndex = ONBOARDING_STEPS.indexOf(step);
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    
    // Guard: Cannot skip to later step without completing required data
    if (targetIndex > currentIndex) {
      // Check if required prerequisites are met
      if (step === 'INVITE_TEAM' && !companyData) {
        set({ 
          lastError: 'Debes completar la información de la empresa primero' 
        });
        return false;
      }
      
      if (step === 'GLOBAL_SETTINGS' && !companyData) {
        set({ 
          lastError: 'Debes completar la información de la empresa y el equipo primero' 
        });
        return false;
      }
    }
    
    get().setCurrentStep(step);
    return true;
  },

  // ------------------------------------------------------------------------
  // Data Actions
  // ------------------------------------------------------------------------

  setCompanyData: (data: CompanySetupData) => {
    set({ 
      companyData: data, 
      completedSteps: new Set([...get().completedSteps, 'SETUP_COMPANY']),
      lastError: null 
    });
  },

  setTeamData: (data: InviteTeamData) => {
    set({ 
      teamData: data, 
      completedSteps: new Set([...get().completedSteps, 'INVITE_TEAM']),
      lastError: null 
    });
  },

  setSettingsData: (data: GlobalSettingsData) => {
    set({ 
      settingsData: data, 
      completedSteps: new Set([...get().completedSteps, 'GLOBAL_SETTINGS']),
      lastError: null 
    });
  },

  // ------------------------------------------------------------------------
  // Error Handling
  // ------------------------------------------------------------------------

  setError: (error: string | null) => {
    set({ lastError: error });
  },

  setValidationError: (field: string, message: string) => {
    set((state) => ({
      validationErrors: { ...state.validationErrors, [field]: message },
    }));
  },

  clearValidationErrors: () => {
    set({ validationErrors: {} });
  },

  // ------------------------------------------------------------------------
  // Loading States
  // ------------------------------------------------------------------------

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSaving: (saving: boolean) => {
    set({ isSaving: saving });
  },

  // ------------------------------------------------------------------------
  // Reset
  // ------------------------------------------------------------------------

  reset: () => {
    set(initialState);
  },

  // ------------------------------------------------------------------------
  // Getters / Computed
  // ------------------------------------------------------------------------

  getCurrentStepIndex: () => {
    return ONBOARDING_STEPS.indexOf(get().currentStep);
  },

  isStepAccessible: (step: OnboardingStep) => {
    const { companyData, completedSteps } = get();
    const stepIndex = ONBOARDING_STEPS.indexOf(step);
    const currentIndex = get().getCurrentStepIndex();
    
    // Always allow going back
    if (stepIndex <= currentIndex) return true;
    
    // Allow going forward only if prerequisites completed
    if (stepIndex === 1 && companyData) return true; // INVITE_TEAM needs company
    if (stepIndex === 2 && companyData) return true; // GLOBAL_SETTINGS needs company
    if (stepIndex === 3 && completedSteps.has('SETUP_COMPANY')) return true;
    
    return false;
  },

  canProceed: () => {
    const { currentStep, companyData, isSaving, isLoading } = get();
    
    if (isSaving || isLoading) return false;
    
    if (currentStep === 'SETUP_COMPANY') return !!companyData;
    if (currentStep === 'INVITE_TEAM') return !!get().teamData;
    if (currentStep === 'GLOBAL_SETTINGS') return !!get().settingsData;
    if (currentStep === 'COMPLETE') return true;
    
    return false;
  },

  canGoBack: () => {
    const { history } = get();
    return history.length > 0;
  },
}));

// =====================================================================
// SELECTORS - Optimized selectors for components
// =====================================================================

export const selectCurrentStep = (state: OnboardingState) => state.currentStep;
export const selectCompanyData = (state: OnboardingState) => state.companyData;
export const selectTeamData = (state: OnboardingState) => state.teamData;
export const selectSettingsData = (state: OnboardingState) => state.settingsData;
export const selectCanProceed = (state: OnboardingState) => state.canProceed();
export const selectCanGoBack = (state: OnboardingState) => state.canGoBack();
export const selectError = (state: OnboardingState) => state.lastError;
export const selectIsLoading = (state: OnboardingState) => state.isLoading;
export const selectIsSaving = (state: OnboardingState) => state.isSaving;