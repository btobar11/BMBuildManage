import { z } from 'zod';

// =====================================================================
// ONBOARDING STEP SCHEMAS - Zod Validation
// =====================================================================

// Step 1: Company Setup - Requires valid Chilean RUT and company name
export const companySetupSchema = z.object({
  companyName: z
    .string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  rut: z
    .string()
    .min(7, 'RUT inválido')
    .max(12, 'RUT inválido')
    .refine(
      (rut) => {
        // Chilean RUT validation (basic format check)
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
      },
      { message: 'RUT inválido (formato chileno)' }
    ),
  industry: z
    .enum(['construction', 'engineering', 'architecture', 'real_estate', 'other'])
    .default('construction'),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '500+'])
    .default('1-10'),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => !phone || phone.length >= 8,
      { message: 'Teléfono debe tener al menos 8 dígitos' }
    ),
});

// Step 2: Invite Team Members
export const inviteTeamSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().email('Email inválido'),
        role: z.enum(['admin', 'manager', 'viewer', 'worker']),
        name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
      })
    )
    .min(1, 'Debes invitar al menos un miembro')
    .max(20, 'Máximo 20 invitaciones por sesión'),
});

// Step 3: Global Settings (currency, timezone, language)
export const globalSettingsSchema = z.object({
  currency: z
    .enum(['CLP', 'USD', 'EUR', 'ARS', 'MXN'])
    .default('CLP'),
  timezone: z
    .string()
    .default('America/Santiago'),
  language: z
    .enum(['es', 'en', 'pt'])
    .default('es'),
  dateFormat: z
    .enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
    .default('DD/MM/YYYY'),
  measurementUnit: z
    .enum(['metric', 'imperial'])
    .default('metric'),
  fiscalYearStart: z
    .number()
    .min(1)
    .max(12)
    .default(1),
  enableNotifications: z.boolean().default(true),
  enable2FA: z.boolean().default(false),
});

// Step 4: Complete - No validation needed (summary step)
export const onboardingCompleteSchema = z.object({
  confirmed: z.literal(true, {
    error: 'Debes confirmar para continuar',
  }),
});

// =====================================================================
// TYPE EXPORTS
// =====================================================================

export type CompanySetupData = z.infer<typeof companySetupSchema>;
export type InviteTeamData = z.infer<typeof inviteTeamSchema>;
export type GlobalSettingsData = z.infer<typeof globalSettingsSchema>;
export type OnboardingCompleteData = z.infer<typeof onboardingCompleteSchema>;

// Union type for all step data
export type OnboardingStepData = 
  | { step: 'SETUP_COMPANY'; data: CompanySetupData }
  | { step: 'INVITE_TEAM'; data: InviteTeamData }
  | { step: 'GLOBAL_SETTINGS'; data: GlobalSettingsData }
  | { step: 'COMPLETE'; data: OnboardingCompleteData };

// Step order enum
export const ONBOARDING_STEPS = ['SETUP_COMPANY', 'INVITE_TEAM', 'GLOBAL_SETTINGS', 'COMPLETE'] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];

// Step to schema mapping
export const STEP_SCHEMAS = {
  SETUP_COMPANY: companySetupSchema,
  INVITE_TEAM: inviteTeamSchema,
  GLOBAL_SETTINGS: globalSettingsSchema,
  COMPLETE: onboardingCompleteSchema,
} as const;

// Step labels for UI
export const STEP_LABELS: Record<OnboardingStep, string> = {
  SETUP_COMPANY: 'Empresa',
  INVITE_TEAM: 'Equipo',
  GLOBAL_SETTINGS: 'Configuración',
  COMPLETE: 'Completar',
};

// Step descriptions
export const STEP_DESCRIPTIONS: Record<OnboardingStep, string> = {
  SETUP_COMPANY: 'Configura los datos de tu empresa',
  INVITE_TEAM: 'Invita a tu equipo de trabajo',
  GLOBAL_SETTINGS: 'Ajusta las preferencias globales',
  COMPLETE: '¡Listo para comenzar!',
};