/**
 * Zod Schemas - Frontend Type Validation
 * 
 * Diese Schemas spiegeln die DTOs des Backends.
 * Bei Änderung der Backend-DTOs muss dieses File aktualisiert werden.
 * npm run typecheck wird fehlschlagen bei Desynchronisation.
 */

import { z } from 'zod';

// ==============================================================================
// PROJECTS
// ==============================================================================

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  name: z.string().max(300),
  description: z.string().optional(),
  address: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  commune: z.string().max(100).optional(),
  location: z.string().optional(),
  type: z.array(z.string()).optional(),
  status: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  budget: z.coerce.number().min(0).optional(),
  estimated_area: z.coerce.number().optional().nullable(),
  estimated_price: z.coerce.number().min(0).optional(),
});

export const createProjectSchema = projectSchema.pick({
  company_id: true,
  client_id: true,
  name: true,
  description: true,
  address: true,
  region: true,
  commune: true,
  type: true,
  status: true,
  start_date: true,
  end_date: true,
  budget: true,
  estimated_area: true,
  estimated_price: true,
}).required({ name: true });

export const updateProjectSchema = projectSchema.partial();

export type ProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectUpdate = z.infer<typeof updateProjectSchema>;

// ==============================================================================
// BUDGETS
// ==============================================================================

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  unit: z.string().optional(),
  quantity: z.number().min(0),
  unit_cost: z.number().min(0),
  unit_price: z.number().min(0),
  position: z.number().optional(),
  apu_template_id: z.string().uuid().optional(),
  cubication_mode: z.string().optional(),
  dim_length: z.number().optional(),
  dim_width: z.number().optional(),
  dim_height: z.number().optional(),
  dim_thickness: z.number().optional(),
  quantity_executed: z.number().min(0).optional(),
});

const stageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  position: z.number().optional(),
  items: z.array(itemSchema).optional(),
});

export const budgetSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  version: z.number().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'revision']).optional(),
  notes: z.string().optional(),
  total_estimated_cost: z.number().min(0).optional(),
  total_estimated_price: z.number().min(0).optional(),
  professional_fee_percentage: z.number().min(0).optional(),
  estimated_utility: z.number().min(0).optional(),
  markup_percentage: z.number().min(0).optional(),
  stages: z.array(stageSchema).optional(),
});

export const createBudgetSchema = budgetSchema.pick({
  project_id: true,
  version: true,
  status: true,
  notes: true,
  total_estimated_cost: true,
  total_estimated_price: true,
  professional_fee_percentage: true,
  estimated_utility: true,
  markup_percentage: true,
  stages: true,
}).required({ project_id: true });

export const updateBudgetSchema = budgetSchema.partial();

export type BudgetInput = z.infer<typeof createBudgetSchema>;
export type BudgetUpdate = z.infer<typeof updateBudgetSchema>;
export type StageInput = z.infer<typeof stageSchema>;
export type ItemInput = z.infer<typeof itemSchema>;

// ==============================================================================
// BIM CLASHES
// ==============================================================================

export const clashJobSchema = z.object({
  project_id: z.string().uuid(),
  model_a_id: z.string().uuid(),
  model_b_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
});

export const createClashJobSchema = clashJobSchema.required({
  project_id: true,
  model_a_id: true,
  model_b_id: true,
});

export const clashResultSchema = z.object({
  id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  clash_name: z.string().optional(),
  severity: z.enum(['warning', 'error', 'critical']).optional(),
  status: z.enum(['new', 'reviewed', 'approved', 'resolved']).optional(),
  description: z.string().optional(),
  element_a_id: z.string().optional(),
  element_b_id: z.string().optional(),
  distance: z.number().optional(),
});

export const updateClashSchema = clashResultSchema.partial();

export type ClashJobInput = z.infer<typeof createClashJobSchema>;
export type ClashUpdate = z.infer<typeof updateClashSchema>;

// ==============================================================================
// VALIDATION HELPERS
// ==============================================================================

export function validateProject(data: unknown): ProjectInput {
  return createProjectSchema.parse(data);
}

export function validateBudget(data: unknown): BudgetInput {
  return createBudgetSchema.parse(data);
}

export function validateClashJob(data: unknown): ClashJobInput {
  return createClashJobSchema.parse(data);
}

export function safeValidateProject(data: unknown): ProjectInput | undefined {
  const result = createProjectSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

export function safeValidateBudget(data: unknown): BudgetInput | undefined {
  const result = createBudgetSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

export function safeValidateClashJob(data: unknown): ClashJobInput | undefined {
  const result = createClashJobSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

// ==============================================================================
// ANALYTICS - DASHBOARD ENDPOINTS
// ==============================================================================

export const analyticsDashboardKpisSchema = z.object({
  physicalProgress: z.number().min(0).max(100),
  projectedMargin: z.number().min(0),
  clashResolved: z.number().int().min(0),
  clashPending: z.number().int().min(0),
  totalBudget: z.number().min(0),
  actualSpent: z.number().min(0),
  scheduleVariance: z.number(),
});

export const analyticsProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['draft', 'sent', 'approved', 'in_progress', 'completed']),
  progress: z.number().min(0).max(100),
  budget: z.number().min(0),
  spent: z.number().min(0),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export const analyticsBudgetSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  version: z.number().int().positive(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'revision']),
  totalCost: z.number().min(0),
  totalPrice: z.number().min(0),
  executedAmount: z.number().min(0),
  margin: z.number(),
  lastUpdated: z.string(),
});

export const analyticsClashSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  severity: z.enum(['warning', 'error', 'critical']),
  status: z.enum(['new', 'reviewed', 'approved', 'resolved']),
  description: z.string(),
  elementAId: z.string().nullable(),
  elementBId: z.string().nullable(),
  detectedAt: z.string(),
  resolvedAt: z.string().nullable(),
});

export const sCurveDataPointSchema = z.object({
  month: z.string(),
  planned: z.number().min(0),
  actual: z.number().min(0).nullable(),
  baseline: z.number().min(0),
});

// ==============================================================================
// TYPE INFERENCE - Strict TypeScript Types
// ==============================================================================

export type AnalyticsDashboardKPIs = z.infer<typeof analyticsDashboardKpisSchema>;
export type AnalyticsProject = z.infer<typeof analyticsProjectSchema>;
export type AnalyticsBudget = z.infer<typeof analyticsBudgetSchema>;
export type AnalyticsClash = z.infer<typeof analyticsClashSchema>;
export type SCurveDataPoint = z.infer<typeof sCurveDataPointSchema>;

// Build validation constant - typecheck will fail if schemas are out of sync
export const SCHEMAS = {
  project: createProjectSchema,
  budget: createBudgetSchema,
  clashJob: createClashJobSchema,
  dashboardKPIs: analyticsDashboardKpisSchema,
  analyticsProject: analyticsProjectSchema,
  analyticsBudget: analyticsBudgetSchema,
  analyticsClash: analyticsClashSchema,
  sCurvePoint: sCurveDataPointSchema,
} as const;

// Type guard functions - returns false if data doesn't match schema
export function isAnalyticsDashboardKPIs(data: unknown): data is AnalyticsDashboardKPIs {
  return analyticsDashboardKpisSchema.safeParse(data).success;
}

export function isAnalyticsProject(data: unknown): data is AnalyticsProject {
  return analyticsProjectSchema.safeParse(data).success;
}

export function isAnalyticsBudget(data: unknown): data is AnalyticsBudget {
  return analyticsBudgetSchema.safeParse(data).success;
}

export function isAnalyticsClash(data: unknown): data is AnalyticsClash {
  return analyticsClashSchema.safeParse(data).success;
}