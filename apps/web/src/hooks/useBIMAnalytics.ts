import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface BIMCostAnalysis {
  ifcType: string;
  elementCount: number;
  totalVolume: number;
  totalArea: number;
  totalCost: number;
  totalPrice: number;
  costPerM3: number;
  costPerM2: number;
  averageElementCost: number;
  budgetItems: number;
  executionProgress: number;
}

export interface BIMClashAnalysis {
  totalClashes: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    hard: number;
    soft: number;
    clearance: number;
  };
  byDiscipline: Record<string, number>;
  resolvedPercentage: number;
  avgResolutionTime: number;
  criticalUnresolved: number;
}

export interface BIMProgressAnalysis {
  totalElements: number;
  completedElements: number;
  progressPercentage: number;
  byStorey: Record<string, {
    total: number;
    completed: number;
    percentage: number;
    volume: number;
  }>;
  byType: Record<string, {
    total: number;
    completed: number;
    percentage: number;
  }>;
  predictedCompletion: string | null;
  delayRiskFactors: string[];
}

export interface BIMQualityMetrics {
  elementsWithIssues: number;
  qualityScore: number;
  commonIssues: Array<{
    issue: string;
    count: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  modelCompleteness: number;
  dataConsistency: number;
}

export interface BIMResourceOptimization {
  materialWaste: Array<{
    type: string;
    plannedQuantity: number;
    actualQuantity: number;
    wastePercentage: number;
    costImpact: number;
  }>;
  laborEfficiency: Array<{
    zone: string;
    plannedHours: number;
    actualHours: number;
    efficiency: number;
  }>;
  equipmentUtilization: Array<{
    equipment: string;
    plannedUsage: number;
    actualUsage: number;
    utilization: number;
  }>;
  optimizationRecommendations: string[];
}

export interface BIMSummaryInsights {
  totalElements: number;
  totalVolume: number;
  totalCost: number;
  progressPercentage: number;
  qualityScore: number;
  activeClashes: number;
  criticalIssues: string[];
  keyRecommendations: string[];
}

interface UseBIMAnalyticsOptions {
  companyId: string;
  projectId?: string;
  enabled?: boolean;
}

function buildAnalyticsEndpoints(companyId: string, projectId?: string) {
  const baseParams = { companyId };
  const projectParams = projectId ? { ...baseParams, projectId } : baseParams;
  
  return {
    costAnalysis: async () => {
      const response = await api.post<{
        data: BIMCostAnalysis[];
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/costs', projectParams);
      return response.data?.data ?? response.data ?? [];
    },
    clashAnalysis: async () => {
      const response = await api.post<{
        data: BIMClashAnalysis;
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/clashes', projectParams);
      return response.data?.data ?? response.data;
    },
    progressAnalysis: async () => {
      const response = await api.post<{
        data: BIMProgressAnalysis;
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/progress', projectParams);
      return response.data?.data ?? response.data;
    },
    qualityMetrics: async () => {
      const response = await api.post<{
        data: BIMQualityMetrics;
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/quality', projectParams);
      return response.data?.data ?? response.data;
    },
    resourceOptimization: async () => {
      const response = await api.post<{
        data: BIMResourceOptimization;
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/resources', projectParams);
      return response.data?.data ?? response.data;
    },
    summaryInsights: async () => {
      const response = await api.post<{
        data: BIMSummaryInsights;
        companyId: string;
        projectId?: string;
      }>('/ai/analyze/summary', projectParams);
      return response.data?.data ?? response.data;
    },
  };
}

export function useBIMCostAnalysis({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'cost-analysis', companyId, projectId],
    queryFn: endpoints.costAnalysis,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBIMClashAnalysis({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'clash-analysis', companyId, projectId],
    queryFn: endpoints.clashAnalysis,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBIMProgressAnalysis({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'progress-analysis', companyId, projectId],
    queryFn: endpoints.progressAnalysis,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBIMQualityMetrics({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'quality-metrics', companyId, projectId],
    queryFn: endpoints.qualityMetrics,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBIMResourceOptimization({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'resource-optimization', companyId, projectId],
    queryFn: endpoints.resourceOptimization,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBIMSummaryInsights({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const endpoints = buildAnalyticsEndpoints(companyId, projectId);
  
  return useQuery({
    queryKey: ['bim', 'summary-insights', companyId, projectId],
    queryFn: endpoints.summaryInsights,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAllBIMAnalytics({ companyId, projectId, enabled = true }: UseBIMAnalyticsOptions) {
  const costAnalysis = useBIMCostAnalysis({ companyId, projectId, enabled });
  const clashAnalysis = useBIMClashAnalysis({ companyId, projectId, enabled });
  const progressAnalysis = useBIMProgressAnalysis({ companyId, projectId, enabled });
  const qualityMetrics = useBIMQualityMetrics({ companyId, projectId, enabled });
  const resourceOptimization = useBIMResourceOptimization({ companyId, projectId, enabled });
  const summaryInsights = useBIMSummaryInsights({ companyId, projectId, enabled });
  
  const isLoading = 
    costAnalysis.isLoading || 
    clashAnalysis.isLoading || 
    progressAnalysis.isLoading || 
    qualityMetrics.isLoading || 
    resourceOptimization.isLoading || 
    summaryInsights.isLoading;
  
  const isError = 
    costAnalysis.isError || 
    clashAnalysis.isError || 
    progressAnalysis.isError || 
    qualityMetrics.isError || 
    resourceOptimization.isError || 
    summaryInsights.isError;
  
  const error = costAnalysis.error || clashAnalysis.error || progressAnalysis.error || 
    qualityMetrics.error || resourceOptimization.error || summaryInsights.error;
  
  return {
    costAnalysis: costAnalysis.data,
    clashAnalysis: clashAnalysis.data,
    progressAnalysis: progressAnalysis.data,
    qualityMetrics: qualityMetrics.data,
    resourceOptimization: resourceOptimization.data,
    summaryInsights: summaryInsights.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      costAnalysis.refetch();
      clashAnalysis.refetch();
      progressAnalysis.refetch();
      qualityMetrics.refetch();
      resourceOptimization.refetch();
      summaryInsights.refetch();
    },
  };
}