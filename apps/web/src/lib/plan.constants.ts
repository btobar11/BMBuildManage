/**
 * Shared SaaS plan constants for the frontend.
 * Mirrors the backend plan.constants.ts — keep in sync.
 */

export type PlanTier = 'lite' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export const FeatureCodes = {
  // LITE
  PROJECTS: 'projects',
  BUDGETS_BASIC: 'budgets_basic',
  ITEMS: 'items',
  RESOURCES_BASIC: 'resources_basic',
  WORKERS_BASIC: 'workers_basic',
  EXPENSES: 'expenses',
  TEMPLATES_BASIC: 'templates_basic',
  EXPORT_PDF: 'export_pdf',
  EXPORT_EXCEL: 'export_excel',
  DOCUMENTS: 'documents',
  CLIENTS: 'clients',
  // PRO
  APU: 'apu',
  FORMULA_ENGINE: 'formula_engine',
  PURCHASE_ORDERS: 'purchase_orders',
  INVOICES_SII: 'invoices_sii',
  EXECUTION: 'execution',
  ANALYTICS_BASIC: 'analytics_basic',
  SCHEDULE: 'schedule',
  SUBCONTRACTORS: 'subcontractors',
  CONTINGENCIES: 'contingencies',
  WORKER_ASSIGNMENTS: 'worker_assignments',
  WORKER_PAYMENTS: 'worker_payments',
  MACHINERY: 'machinery',
  MATERIALS: 'materials',
  RFIS: 'rfis',
  SUBMITTALS: 'submittals',
  PUNCH_LIST: 'punch_list',
  // ENTERPRISE
  BIM_VIEWER: 'bim_viewer',
  BIM_4D: 'bim_4d',
  BIM_5D: 'bim_5d',
  BIM_CLASHES: 'bim_clashes',
  BIM_APU_LINK: 'bim_apu_link',
  AI_ASSISTANT: 'ai_assistant',
  ANALYTICS_ADVANCED: 'analytics_advanced',
  AUDIT_LOGS: 'audit_logs',
  API_ACCESS: 'api_access',
  REALTIME_COLLAB: 'realtime_collab',
} as const;

export type FeatureCode = (typeof FeatureCodes)[keyof typeof FeatureCodes];

/**
 * Minimum plan required for each feature (for UI upsell messaging).
 */
export const FEATURE_MIN_PLAN: Record<string, PlanTier> = {
  [FeatureCodes.PROJECTS]: 'lite',
  [FeatureCodes.BUDGETS_BASIC]: 'lite',
  [FeatureCodes.ITEMS]: 'lite',
  [FeatureCodes.RESOURCES_BASIC]: 'lite',
  [FeatureCodes.WORKERS_BASIC]: 'lite',
  [FeatureCodes.EXPENSES]: 'lite',
  [FeatureCodes.TEMPLATES_BASIC]: 'lite',
  [FeatureCodes.EXPORT_PDF]: 'lite',
  [FeatureCodes.EXPORT_EXCEL]: 'lite',
  [FeatureCodes.DOCUMENTS]: 'lite',
  [FeatureCodes.CLIENTS]: 'lite',
  [FeatureCodes.APU]: 'pro',
  [FeatureCodes.FORMULA_ENGINE]: 'pro',
  [FeatureCodes.PURCHASE_ORDERS]: 'pro',
  [FeatureCodes.INVOICES_SII]: 'pro',
  [FeatureCodes.EXECUTION]: 'pro',
  [FeatureCodes.ANALYTICS_BASIC]: 'pro',
  [FeatureCodes.SCHEDULE]: 'pro',
  [FeatureCodes.SUBCONTRACTORS]: 'pro',
  [FeatureCodes.CONTINGENCIES]: 'pro',
  [FeatureCodes.WORKER_ASSIGNMENTS]: 'pro',
  [FeatureCodes.WORKER_PAYMENTS]: 'pro',
  [FeatureCodes.MACHINERY]: 'pro',
  [FeatureCodes.MATERIALS]: 'pro',
  [FeatureCodes.RFIS]: 'pro',
  [FeatureCodes.SUBMITTALS]: 'pro',
  [FeatureCodes.PUNCH_LIST]: 'pro',
  [FeatureCodes.BIM_VIEWER]: 'enterprise',
  [FeatureCodes.BIM_4D]: 'enterprise',
  [FeatureCodes.BIM_5D]: 'enterprise',
  [FeatureCodes.BIM_CLASHES]: 'enterprise',
  [FeatureCodes.BIM_APU_LINK]: 'enterprise',
  [FeatureCodes.AI_ASSISTANT]: 'enterprise',
  [FeatureCodes.ANALYTICS_ADVANCED]: 'enterprise',
  [FeatureCodes.AUDIT_LOGS]: 'enterprise',
  [FeatureCodes.API_ACCESS]: 'enterprise',
  [FeatureCodes.REALTIME_COLLAB]: 'enterprise',
};

export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  lite: 'Lite',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const PLAN_DESCRIPTIONS: Record<PlanTier, string> = {
  lite: 'Para pequeñas constructoras y contratistas independientes',
  pro: 'Para constructoras medianas con operaciones complejas',
  enterprise: 'Para empresas grandes con necesidades BIM + AI avanzadas',
};
