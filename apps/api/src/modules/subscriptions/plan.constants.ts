import { PlanTier } from './entities/subscription.entity';

/**
 * Feature Codes — The canonical list of gatable capabilities.
 *
 * Convention: module_capability
 * Every guard and frontend check references these codes.
 */
export const FeatureCodes = {
  // ─── LITE (always included) ───
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

  // ─── PRO ───
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

  // ─── ENTERPRISE ───
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
 * Plan → Feature mapping.
 * Each plan includes all features from lower tiers plus its own.
 * This is the seed data for the plan_features table.
 */
export const PLAN_FEATURE_MAP: Record<PlanTier, FeatureCode[]> = {
  [PlanTier.LITE]: [
    FeatureCodes.PROJECTS,
    FeatureCodes.BUDGETS_BASIC,
    FeatureCodes.ITEMS,
    FeatureCodes.RESOURCES_BASIC,
    FeatureCodes.WORKERS_BASIC,
    FeatureCodes.EXPENSES,
    FeatureCodes.TEMPLATES_BASIC,
    FeatureCodes.EXPORT_PDF,
    FeatureCodes.EXPORT_EXCEL,
    FeatureCodes.DOCUMENTS,
    FeatureCodes.CLIENTS,
  ],

  [PlanTier.PRO]: [
    // Inherits all LITE features
    FeatureCodes.PROJECTS,
    FeatureCodes.BUDGETS_BASIC,
    FeatureCodes.ITEMS,
    FeatureCodes.RESOURCES_BASIC,
    FeatureCodes.WORKERS_BASIC,
    FeatureCodes.EXPENSES,
    FeatureCodes.TEMPLATES_BASIC,
    FeatureCodes.EXPORT_PDF,
    FeatureCodes.EXPORT_EXCEL,
    FeatureCodes.DOCUMENTS,
    FeatureCodes.CLIENTS,
    // PRO-exclusive
    FeatureCodes.APU,
    FeatureCodes.FORMULA_ENGINE,
    FeatureCodes.PURCHASE_ORDERS,
    FeatureCodes.INVOICES_SII,
    FeatureCodes.EXECUTION,
    FeatureCodes.ANALYTICS_BASIC,
    FeatureCodes.SCHEDULE,
    FeatureCodes.SUBCONTRACTORS,
    FeatureCodes.CONTINGENCIES,
    FeatureCodes.WORKER_ASSIGNMENTS,
    FeatureCodes.WORKER_PAYMENTS,
    FeatureCodes.MACHINERY,
    FeatureCodes.MATERIALS,
    FeatureCodes.RFIS,
    FeatureCodes.SUBMITTALS,
    FeatureCodes.PUNCH_LIST,
  ],

  [PlanTier.ENTERPRISE]: [
    // Inherits all PRO features
    FeatureCodes.PROJECTS,
    FeatureCodes.BUDGETS_BASIC,
    FeatureCodes.ITEMS,
    FeatureCodes.RESOURCES_BASIC,
    FeatureCodes.WORKERS_BASIC,
    FeatureCodes.EXPENSES,
    FeatureCodes.TEMPLATES_BASIC,
    FeatureCodes.EXPORT_PDF,
    FeatureCodes.EXPORT_EXCEL,
    FeatureCodes.DOCUMENTS,
    FeatureCodes.CLIENTS,
    FeatureCodes.APU,
    FeatureCodes.FORMULA_ENGINE,
    FeatureCodes.PURCHASE_ORDERS,
    FeatureCodes.INVOICES_SII,
    FeatureCodes.EXECUTION,
    FeatureCodes.ANALYTICS_BASIC,
    FeatureCodes.SCHEDULE,
    FeatureCodes.SUBCONTRACTORS,
    FeatureCodes.CONTINGENCIES,
    FeatureCodes.WORKER_ASSIGNMENTS,
    FeatureCodes.WORKER_PAYMENTS,
    FeatureCodes.MACHINERY,
    FeatureCodes.MATERIALS,
    FeatureCodes.RFIS,
    FeatureCodes.SUBMITTALS,
    FeatureCodes.PUNCH_LIST,
    // ENTERPRISE-exclusive
    FeatureCodes.BIM_VIEWER,
    FeatureCodes.BIM_4D,
    FeatureCodes.BIM_5D,
    FeatureCodes.BIM_CLASHES,
    FeatureCodes.BIM_APU_LINK,
    FeatureCodes.AI_ASSISTANT,
    FeatureCodes.ANALYTICS_ADVANCED,
    FeatureCodes.AUDIT_LOGS,
    FeatureCodes.API_ACCESS,
    FeatureCodes.REALTIME_COLLAB,
  ],
};

/**
 * Usage limits per plan tier.
 * -1 means unlimited.
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    max_projects: number;
    max_users: number;
    max_storage_mb: number;
    max_ai_requests_month: number;
    max_bim_models: number;
  }
> = {
  [PlanTier.LITE]: {
    max_projects: 3,
    max_users: 5,
    max_storage_mb: 500,
    max_ai_requests_month: 0,
    max_bim_models: 0,
  },
  [PlanTier.PRO]: {
    max_projects: 20,
    max_users: 25,
    max_storage_mb: 5000,
    max_ai_requests_month: 100,
    max_bim_models: 0,
  },
  [PlanTier.ENTERPRISE]: {
    max_projects: -1,
    max_users: -1,
    max_storage_mb: -1,
    max_ai_requests_month: -1,
    max_bim_models: -1,
  },
};

/**
 * Base pricing in CLP (monthly).
 * Discount percentages applied per billing cycle.
 */
export const PLAN_PRICING: Record<
  PlanTier,
  {
    base_monthly_clp: number;
    allowed_cycles: readonly string[];
  }
> = {
  [PlanTier.LITE]: {
    base_monthly_clp: 29990,
    allowed_cycles: ['monthly', 'quarterly', 'annual'] as const,
  },
  [PlanTier.PRO]: {
    base_monthly_clp: 89990,
    allowed_cycles: ['monthly', 'quarterly', 'annual'] as const,
  },
  [PlanTier.ENTERPRISE]: {
    base_monthly_clp: 249990,
    allowed_cycles: ['monthly', 'quarterly', 'annual'] as const,
  },
};

export const BILLING_CYCLE_DISCOUNT: Record<string, number> = {
  monthly: 0,
  quarterly: 0.1,
  semiannual: 0.15,
  annual: 0.25,
};

export const BILLING_CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

/** Trial duration in days */
export const TRIAL_DURATION_DAYS = 14;
