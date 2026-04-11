/**
 * Analytics DTOs - API Response Types
 * 
 * These DTOs mirror the SQL view results for type-safe API responses.
 * IMPORTANT: Must stay in sync with frontend Zod schemas in apps/web/src/lib/schemas/index.ts
 * 
 * Run: npm run typecheck (frontend) to verify sync
 */

import { z } from 'zod';

// ==============================================================================
// FINANCIAL SUMMARY (Curva S)
// ==============================================================================

export const financialSummarySchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string(),
  total_budgeted: z.number().min(0),
  total_spent: z.number().min(0),
  variance: z.number(),
  percent_executed: z.number().min(0).max(100),
  material_budgeted: z.number().min(0),
  labor_budgeted: z.number().min(0),
  equipment_budgeted: z.number().min(0),
  material_spent: z.number().min(0),
  labor_spent: z.number().min(0),
  equipment_spent: z.number().min(0),
  calculated_at: z.string().datetime(), // ISO 8601 string for frontend compatibility
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

// ==============================================================================
// PHYSICAL PROGRESS
// ==============================================================================

export const physicalProgressSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string(),
  total_quantity_budgeted: z.number().min(0),
  total_quantity_executed: z.number().min(0),
  physical_progress_percent: z.number().min(0).max(100),
  total_items: z.number().int().min(0),
  items_with_progress: z.number().int().min(0),
  completed_items: z.number().int().min(0),
  calculated_at: z.string().datetime(),
});

export type PhysicalProgress = z.infer<typeof physicalProgressSchema>;

// ==============================================================================
// CLASH HEALTH
// ==============================================================================

export const clashHealthSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  total_clashes: z.number().int().min(0),
  pending_clashes: z.number().int().min(0),
  accepted_clashes: z.number().int().min(0),
  resolved_clashes: z.number().int().min(0),
  ignored_clashes: z.number().int().min(0),
  resolution_rate_percent: z.number().min(0).max(100),
  critical_count: z.number().int().min(0),
  high_count: z.number().int().min(0),
  medium_count: z.number().int().min(0),
  low_count: z.number().int().min(0),
  calculated_at: z.string().datetime(),
});

export type ClashHealth = z.infer<typeof clashHealthSchema>;

// ==============================================================================
// DASHBOARD AGGREGATE RESPONSE
// ==============================================================================

export const dashboardSummaryResponseSchema = z.object({
  financial: z.array(financialSummarySchema),
  physical: z.array(physicalProgressSchema),
  clash: z.array(clashHealthSchema),
});

export type DashboardSummaryResponse = z.infer<typeof dashboardSummaryResponseSchema>;

// ==============================================================================
// ERROR RESPONSE
// ==============================================================================

export const analyticsErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

export type AnalyticsErrorResponse = z.infer<typeof analyticsErrorResponseSchema>;

// ==============================================================================
// FALLBACK RESPONSE (for error states)
// ==============================================================================

export const financialSummaryFallbackSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string().default('Sin datos'),
  total_budgeted: z.number().default(0),
  total_spent: z.number().default(0),
  variance: z.number().default(0),
  percent_executed: z.number().default(0),
  material_budgeted: z.number().default(0),
  labor_budgeted: z.number().default(0),
  equipment_budgeted: z.number().default(0),
  material_spent: z.number().default(0),
  labor_spent: z.number().default(0),
  equipment_spent: z.number().default(0),
  calculated_at: z.string().default(new Date().toISOString()),
});

export const physicalProgressFallbackSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string().default('Sin datos'),
  total_quantity_budgeted: z.number().default(0),
  total_quantity_executed: z.number().default(0),
  physical_progress_percent: z.number().default(0),
  total_items: z.number().default(0),
  items_with_progress: z.number().default(0),
  completed_items: z.number().default(0),
  calculated_at: z.string().default(new Date().toISOString()),
});

export const clashHealthFallbackSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  total_clashes: z.number().default(0),
  pending_clashes: z.number().default(0),
  accepted_clashes: z.number().default(0),
  resolved_clashes: z.number().default(0),
  ignored_clashes: z.number().default(0),
  resolution_rate_percent: z.number().default(0),
  critical_count: z.number().default(0),
  high_count: z.number().default(0),
  medium_count: z.number().default(0),
  low_count: z.number().default(0),
  calculated_at: z.string().default(new Date().toISOString()),
});