import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { useOnboardingStore } from '../store/useOnboardingStore';
import type { CompanySetupData, InviteTeamData, GlobalSettingsData } from '../schemas/onboarding.schema';

// =====================================================================
// COMPANY SETUP MUTATION
// =====================================================================

interface CreateCompanyResponse {
  id: string;
  name: string;
  rut: string;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { setCompanyData, setError, setSaving } = useOnboardingStore();

  return useMutation({
    mutationFn: async (data: CompanySetupData) => {
      const response = await api.post<CreateCompanyResponse>('/companies', {
        name: data.companyName,
        rut: data.rut,
        industry: data.industry,
        size: data.companySize,
        phone: data.phone,
      });
      return response.data;
    },
    onMutate: () => {
      setSaving(true);
      setError(null);
    },
    onSuccess: async (data) => {
      // Store company ID in the onboarding store
      setCompanyData({
        ...useOnboardingStore.getState().companyData!,
        companyName: data.name,
        rut: data.rut,
      } as CompanySetupData);
      setSaving(false);
      
      // Force session refresh to inject new company_id into JWT before navigation
      await supabase.auth.refreshSession();
    },
    onError: (error: unknown) => {
      setSaving(false);
      const message = error instanceof Error ? error.message : 'Error al crear la empresa';
      setError(message);
    },
  });
}

// =====================================================================
// INVITE TEAM MUTATION
// =====================================================================

interface InviteMember {
  email: string;
  role: string;
  name: string;
}

interface InviteTeamResponse {
  invited: number;
  failed: Array<{ email: string; error: string }>;
}

export function useInviteTeam() {
  const queryClient = useQueryClient();
  const { setTeamData, setError, setSaving } = useOnboardingStore();

  return useMutation({
    mutationFn: async (data: InviteTeamData) => {
      const invites: InviteMember[] = data.invites.map((invite) => ({
        email: invite.email,
        role: invite.role,
        name: invite.name,
      }));

      const response = await api.post<InviteTeamResponse>('/users/invite', {
        invites,
      });
      return response.data;
    },
    onMutate: () => {
      setSaving(true);
      setError(null);
    },
    onSuccess: (data) => {
      setTeamData(useOnboardingStore.getState().teamData!);
      setSaving(false);
      
      // If some invites failed, show warning but don't block
      if (data.failed && data.failed.length > 0) {
        const failedEmails = data.failed.map((f) => f.email).join(', ');
        useOnboardingStore.getState().setError(
          `Algunos invites no pudieron ser enviados: ${failedEmails}`
        );
      }
    },
    onError: (error: unknown) => {
      setSaving(false);
      const message = error instanceof Error ? error.message : 'Error al invitar al equipo';
      setError(message);
    },
  });
}

// =====================================================================
// GLOBAL SETTINGS MUTATION
// =====================================================================

interface UpdateSettingsResponse {
  success: boolean;
}

export function useUpdateGlobalSettings() {
  const queryClient = useQueryClient();
  const { setSettingsData, setError, setSaving } = useOnboardingStore();

  return useMutation({
    mutationFn: async (data: GlobalSettingsData) => {
      const response = await api.post<UpdateSettingsResponse>('/settings/global', {
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        dateFormat: data.dateFormat,
        measurementUnit: data.measurementUnit,
        fiscalYearStart: data.fiscalYearStart,
        enableNotifications: data.enableNotifications,
        enable2FA: data.enable2FA,
      });
      return response.data;
    },
    onMutate: () => {
      setSaving(true);
      setError(null);
    },
    onSuccess: (data) => {
      setSettingsData(useOnboardingStore.getState().settingsData!);
      setSaving(false);
    },
    onError: (error: unknown) => {
      setSaving(false);
      const message = error instanceof Error 
        ? error.message 
        : 'Error al guardar la configuración';
      setError(message);
    },
  });
}

// =====================================================================
// COMPLETE ONBOARDING MUTATION
// =====================================================================

interface CompleteOnboardingResponse {
  success: boolean;
  redirectUrl: string;
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { reset, setError, setSaving } = useOnboardingStore();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<CompleteOnboardingResponse>('/onboarding/complete');
      return response.data;
    },
    onMutate: () => {
      setSaving(true);
      setError(null);
    },
    onSuccess: async () => {
      setSaving(false);
      
      // Force session refresh to ensure JWT has the new company_id
      await supabase.auth.refreshSession();
      
      // Invalidate all queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Reset onboarding state
      reset();
    },
    onError: (error: unknown) => {
      setSaving(false);
      const message = error instanceof Error 
        ? error.message 
        : 'Error al completar el onboarding';
      setError(message);
    },
  });
}

// =====================================================================
// COMBINED ONBOARDING SUBMIT HOOK
// =====================================================================

export function useOnboardingSubmit() {
  const {
    currentStep,
    companyData,
    teamData,
    settingsData,
    nextStep,
    setError,
  } = useOnboardingStore();

  const createCompany = useCreateCompany();
  const inviteTeam = useInviteTeam();
  const updateSettings = useUpdateGlobalSettings();
  const completeOnboarding = useCompleteOnboarding();

  const submitStep = async () => {
    try {
      switch (currentStep) {
        case 'SETUP_COMPANY':
          if (!companyData) {
            setError('Faltan datos de la empresa');
            return;
          }
          await createCompany.mutateAsync(companyData);
          nextStep();
          break;

        case 'INVITE_TEAM':
          if (!teamData) {
            setError('Faltan datos del equipo');
            return;
          }
          await inviteTeam.mutateAsync(teamData);
          nextStep();
          break;

        case 'GLOBAL_SETTINGS':
          if (!settingsData) {
            setError('Faltan datos de configuración');
            return;
          }
          await updateSettings.mutateAsync(settingsData);
          nextStep();
          break;

        case 'COMPLETE':
          await completeOnboarding.mutateAsync();
          break;
      }
    } catch (error) {
      // Error is already handled by individual mutations
      // Keep data in form (no unmount)
      console.error('Onboarding step error:', error);
    }
  };

  return {
    submitStep,
    isLoading: createCompany.isPending || 
              inviteTeam.isPending || 
              updateSettings.isPending || 
              completeOnboarding.isPending,
    error: createCompany.error || 
           inviteTeam.error || 
           updateSettings.error || 
           completeOnboarding.error,
  };
}