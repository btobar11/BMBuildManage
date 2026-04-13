import { z } from 'zod';

// =====================================================================
// ONBOARDING STEP SCHEMAS - Zod Validation
// =====================================================================

const LEGAL_TYPES = ['SpA', 'EIRL', 'Ltda.', 'S.A.', 'Empresa Individual'] as const;
const INDUSTRY_TYPES = ['construction', 'engineering', 'architecture', 'real_estate', 'industrial'] as const;
const CHALLENGES = ['budget_control', 'team_management', 'reporting', 'calculations', 'schedule_delays', 'material_waste'] as const;

const CHILEAN_RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

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

// Step 1: Company Setup - Requires valid Chilean RUT and company name
export const companySetupSchema = z.object({
  companyName: z
    .string()
    .min(2, 'El nombre o razón social debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  rut: z
    .string()
    .min(9, 'RUT inválido')
    .max(12, 'RUT inválido')
    .refine(
      (rut) => CHILEAN_RUT_REGEX.test(rut) && validateChileanRut(rut),
      { message: 'RUT inválido. Formato correcto: XX.XXX.XXX-X' }
    ),
  legalType: z.enum(LEGAL_TYPES, { required_error: 'Selecciona el tipo de empresa' }),
  address: z
    .string()
    .min(5, 'Ingresa la dirección de la casa matriz')
    .max(300, 'La dirección no puede exceder 300 caracteres'),
  industry: z
    .array(z.enum(INDUSTRY_TYPES))
    .min(1, 'Selecciona al menos un tipo de construcción'),
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