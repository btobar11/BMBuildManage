'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { z } from 'zod';
import { captureMessage } from '../lib/telemetry';

// =====================================================
// Zod Schemas - Tipado estricto de respuesta JSON
// =====================================================

/**
 * Esquema para insight de IA
 */
export const AIInsightSchema = z.object({
  type: z.enum(['warning', 'opportunity', 'risk', 'recommendation']),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  action: z.string().optional(),
  metric: z.object({
    label: z.string(),
    value: z.number(),
    change: z.number().optional(),
  }).optional(),
});

/**
 * Esquema para predicción de riesgo de proyecto
 */
export const ProjectRiskPredictionSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  predictedDelay: z.number(),
  probability: z.number(),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.number(),
    weight: z.number(),
  })),
  recommendations: z.array(z.string()),
});

/**
 * Esquema principal de respuesta NLP
 */
export const NLPQueryResultSchema = z.object({
  answer: z.string(),
  data: z.unknown().optional(),
  sources: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  actionable: z.boolean().optional(),
  suggestedActions: z.array(z.string()).optional(),
});

/**
 * Esquema para análisis de presupuesto
 * (usado con /ai/analyze-budget)
 */
export const BudgetAnalysisResultSchema = z.object({
  summary: z.string(),
  healthStatus: z.enum(['healthy', 'warning', 'critical']),
  keyInsights: z.array(z.object({
    type: z.enum(['warning', 'opportunity', 'risk', 'recommendation']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })),
  varianceAnalysis: z.object({
    totalVariance: z.number(),
    overBudgetItems: z.number(),
    underBudgetItems: z.number(),
    criticalItems: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
  budgetSummary: z.object({
    projectName: z.string(),
    totalEstimated: z.number(),
    totalExecuted: z.number(),
    variance: z.number(),
  }).optional(),
});

// =====================================================
// TypeScript Types inferidos de Zod
// =====================================================

export type AIInsight = z.infer<typeof AIInsightSchema>;
export type ProjectRiskPrediction = z.infer<typeof ProjectRiskPredictionSchema>;
export type NLPQueryResult = z.infer<typeof NLPQueryResultSchema>;
export type BudgetAnalysisResult = z.infer<typeof BudgetAnalysisResultSchema>;

// =====================================================
// DTOs para requests
// =====================================================

interface NLPQueryDto {
  query: string;
  projectId?: string;
  budgetId?: string;
}

interface RecommendBudgetsDto {
  budgetId: string;
  prompt?: string;
}

// =====================================================
// Hooks
// =====================================================

interface UseAIChatOptions {
  companyId: string;
  projectId?: string;
  budgetId?: string;
}

/**
 * Hook para procesar queries en lenguaje natural con el asistente IA
 * Usa el endpoint POST /ai/query del backend NestJS
 */
export function useAIChat({ companyId, projectId, budgetId }: UseAIChatOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: string) => {
      const response = await api.post<{ data: NLPQueryResult }>('/ai/query', {
        query,
        projectId,
        budgetId,
      });
      
      // Validar respuesta con Zod
      const result = NLPQueryResultSchema.safeParse(response.data?.data);
      if (!result.success) {
        captureMessage('AI response validation failed', 'warning');
        // Retornar data cruda si la validación falla
        return response.data?.data as NLPQueryResult;
      }
      
      return result.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['ai', 'recommendations', companyId] });
    },
  });
}

/**
 * Hook para obtener recomendaciones de IA para proyectos
 * Usa el endpoint POST /ai/recommendations del backend NestJS
 */
export function useAIRecommendations({ companyId, projectId }: Omit<UseAIChatOptions, 'budgetId'>) {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: NLPQueryResult }>('/ai/recommendations', {
        companyId,
        projectId,
      });
      
      const result = NLPQueryResultSchema.safeParse(response.data?.data);
      if (!result.success) {
        captureMessage('AI recommendations validation failed', 'warning');
        return response.data?.data as NLPQueryResult;
      }
      
      return result.data;
    },
  });
}

/**
 * Hook para predecir resultados de proyectos
 * Usa el endpoint POST /ai/predict del backend NestJS
 */
export function useAIPrediction({ companyId, projectId }: Omit<UseAIChatOptions, 'budgetId'>) {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: NLPQueryResult }>('/ai/predict', {
        companyId,
        projectId,
      });
      
      const result = NLPQueryResultSchema.safeParse(response.data?.data);
      if (!result.success) {
        captureMessage('AI prediction validation failed', 'warning');
        return response.data?.data as NLPQueryResult;
      }
      
      return result.data;
    },
  });
}

/**
 * Hook para analizar presupuestos con IA
 * Usa el endpoint POST /ai/analyze-budget del backend NestJS
 */
export function useAIBudgetAnalysis() {
  return useMutation({
    mutationFn: async ({ budgetId, prompt }: RecommendBudgetsDto) => {
      const response = await api.post<{ data: BudgetAnalysisResult }>('/ai/analyze-budget', {
        budgetId,
        prompt,
      });
      
      const result = BudgetAnalysisResultSchema.safeParse(response.data?.data);
      if (!result.success) {
        captureMessage('Budget analysis validation failed', 'warning');
        return response.data?.data as BudgetAnalysisResult;
      }
      
      return result.data;
    },
  });
}

/**
 * Hook para generar reportes de proyecto
 * Usa el endpoint POST /ai/report del backend NestJS
 */
export function useAIReport() {
  return useMutation({
    mutationFn: async ({ projectId, type }: { projectId: string; type: 'executive' | 'financial' | 'technical' }) => {
      const response = await api.post<{ data: unknown }>('/ai/report', {
        projectId,
        type,
      });
      return response.data?.data;
    },
  });
}
