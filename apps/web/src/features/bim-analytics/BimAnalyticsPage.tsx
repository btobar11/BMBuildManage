import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAllBIMAnalytics } from '../../hooks/useBIMAnalytics';
import { MetricCard } from '../../components/ui/Card/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  CostAnalysisBarChart,
  CostVolumeComboChart,
  ClashSeverityChart,
  ClashTypeChart,
  ProgressByStoreyChart,
  ProgressTrendChart,
  QualityMetricsRadar,
  LaborEfficiencyChart,
  EfficiencyTrendChart,
} from './components/Charts';
import {
  CostAnalysisTable,
  ProgressByStoreyTable,
  QualityIssuesTable,
  ResourceOptimizationTable,
} from './components/Tables';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Layers,
  Gauge,
} from 'lucide-react';

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

function MetricsGrid({ 
  summaryInsights,
  loading 
}: {
  summaryInsights?: {
    totalElements: number;
    totalVolume: number;
    totalCost: number;
    progressPercentage: number;
    qualityScore: number;
    activeClashes: number;
    criticalIssues: string[];
    keyRecommendations: string[];
  };
  loading?: boolean;
}) {
  const metrics = [
    {
      title: 'Total Elementos',
      value: summaryInsights?.totalElements?.toLocaleString('es-CL') || '0',
      icon: Layers,
      iconColor: 'primary' as const,
      description: 'Elementos BIM totales',
    },
    {
      title: 'Avance',
      value: `${summaryInsights?.progressPercentage?.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      iconColor: (summaryInsights?.progressPercentage ?? 0) >= 70 
        ? 'success' as const 
        : (summaryInsights?.progressPercentage ?? 0) >= 50 
          ? 'warning' as const 
          : 'danger' as const,
      description: 'Progreso ejecutado',
    },
    {
      title: 'Calidad',
      value: `${summaryInsights?.qualityScore?.toFixed(1) || '0'}%`,
      icon: Gauge,
      iconColor: (summaryInsights?.qualityScore ?? 0) >= 80 
        ? 'success' as const 
        : (summaryInsights?.qualityScore ?? 0) >= 60 
          ? 'warning' as const 
          : 'danger' as const,
      description: 'Score de calidad',
    },
    {
      title: 'Clashes Activos',
      value: summaryInsights?.activeClashes?.toLocaleString('es-CL') || '0',
      icon: AlertTriangle,
      iconColor: (summaryInsights?.activeClashes ?? 0) === 0 
        ? 'success' as const 
        : (summaryInsights?.activeClashes ?? 0) <= 5 
          ? 'warning' as const 
          : 'danger' as const,
      description: 'Clashes sin resolver',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={loading ? '...' : metric.value}
          icon={metric.icon}
          iconColor={metric.iconColor}
          description={metric.description}
          loading={loading}
        />
      ))}
    </div>
  );
}

function InsightsPanel({ 
  summaryInsights,
  loading 
}: {
  summaryInsights?: {
    criticalIssues: string[];
    keyRecommendations: string[];
  };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Insights y Recomendaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(summaryInsights?.criticalIssues?.length ?? 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium text-danger-600 dark:text-danger-400 mb-2">
              Issues Críticos
            </h4>
            <ul className="space-y-1">
              {summaryInsights?.criticalIssues?.map((issue, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle size={14} className="text-danger-500 mt-0.5 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(summaryInsights?.keyRecommendations?.length ?? 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
              Recomendaciones
            </h4>
            <ul className="space-y-1">
              {summaryInsights?.keyRecommendations?.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Target size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(summaryInsights?.criticalIssues?.length ?? 0) === 0 && 
         (summaryInsights?.keyRecommendations?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay issues críticos ni recomendaciones en este momento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CostTab({ 
  costAnalysis, 
  loading 
}: { 
  costAnalysis?: Array<{
    ifcType: string;
    totalCost: number;
    totalVolume: number;
    costPerM3: number;
    executionProgress: number;
  }>;
  loading?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostAnalysisBarChart data={costAnalysis} loading={loading} />
        <CostVolumeComboChart data={costAnalysis} loading={loading} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Detalle por Tipo de Elemento</h3>
        <CostAnalysisTable data={costAnalysis || []} loading={loading} />
      </div>
    </div>
  );
}

function ClashTab({ 
  clashAnalysis, 
  loading 
}: { 
  clashAnalysis?: {
    totalClashes: number;
    resolvedPercentage: number;
    avgResolutionTime: number;
    criticalUnresolved: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    byType: { hard: number; soft: number; clearance: number };
  };
  loading?: boolean;
}) {
  const resolvedPercentage = clashAnalysis?.resolvedPercentage ?? 0;
  const avgResolutionTime = clashAnalysis?.avgResolutionTime ?? 0;
  const criticalUnresolved = clashAnalysis?.criticalUnresolved ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Clashes"
          value={clashAnalysis?.totalClashes?.toLocaleString('es-CL') || '0'}
          icon={AlertTriangle}
          iconColor="warning"
          loading={loading}
        />
        <MetricCard
          title="Resueltos"
          value={`${resolvedPercentage.toFixed(1)}%`}
          icon={CheckCircle}
          iconColor="success"
          loading={loading}
        />
        <MetricCard
          title="Tiempo Promedio"
          value={`${avgResolutionTime.toFixed(1)} días`}
          icon={Clock}
          iconColor="info"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClashSeverityChart data={clashAnalysis} loading={loading} />
        <ClashTypeChart data={clashAnalysis} loading={loading} />
      </div>

      {criticalUnresolved > 0 && (
        <div className="p-4 bg-danger-50 dark:bg-danger-950/20 border border-danger-200 dark:border-danger-800 rounded-lg">
          <div className="flex items-center gap-2 text-danger-700 dark:text-danger-400">
            <AlertTriangle size={18} />
            <span className="font-medium">
              {criticalUnresolved} clashes críticos sin resolver
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressTab({ 
  progressAnalysis, 
  loading 
}: { 
  progressAnalysis?: {
    byStorey: Record<string, { total: number; completed: number; percentage: number; volume: number }>;
    progressPercentage: number;
    totalElements: number;
    completedElements: number;
  };
  loading?: boolean;
}) {
  const storeyData = Object.entries(progressAnalysis?.byStorey || {}).map(
    ([storey, stats]) => ({
      storey,
      totalElements: stats.total,
      completedElements: stats.completed,
      progress: stats.percentage,
      volume: stats.volume,
    })
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Avance Global"
          value={`${progressAnalysis?.progressPercentage?.toFixed(1) || '0'}%`}
          icon={TrendingUp}
          iconColor={(progressAnalysis?.progressPercentage ?? 0) >= 70 
            ? 'success' as const 
            : (progressAnalysis?.progressPercentage ?? 0) >= 50 
              ? 'warning' as const 
              : 'danger' as const}
          loading={loading}
        />
        <MetricCard
          title="Elementos Totales"
          value={progressAnalysis?.totalElements?.toLocaleString('es-CL') || '0'}
          icon={Layers}
          iconColor="primary"
          loading={loading}
        />
        <MetricCard
          title="Completados"
          value={progressAnalysis?.completedElements?.toLocaleString('es-CL') || '0'}
          icon={CheckCircle}
          iconColor="success"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressByStoreyChart data={progressAnalysis} loading={loading} />
        <ProgressTrendChart data={progressAnalysis} loading={loading} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detalle por Nivel</h3>
        <ProgressByStoreyTable data={storeyData} loading={loading} />
      </div>
    </div>
  );
}

function QualityTab({ 
  qualityMetrics, 
  loading 
}: { 
  qualityMetrics?: {
    qualityScore: number;
    modelCompleteness: number;
    dataConsistency: number;
    elementsWithIssues: number;
    commonIssues: Array<{ issue: string; count: number; impact: 'low' | 'medium' | 'high' | 'critical' }>;
  };
  loading?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Quality Score"
          value={`${qualityMetrics?.qualityScore?.toFixed(1) || '0'}%`}
          icon={Gauge}
          iconColor={(qualityMetrics?.qualityScore ?? 0) >= 80 
            ? 'success' as const 
            : (qualityMetrics?.qualityScore ?? 0) >= 60 
              ? 'warning' as const 
              : 'danger' as const}
          loading={loading}
        />
        <MetricCard
          title="Model Completeness"
          value={`${qualityMetrics?.modelCompleteness?.toFixed(1) || '0'}%`}
          icon={CheckCircle}
          iconColor="success"
          loading={loading}
        />
        <MetricCard
          title="Data Consistency"
          value={`${qualityMetrics?.dataConsistency?.toFixed(1) || '0'}%`}
          icon={Activity}
          iconColor="info"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityMetricsRadar data={qualityMetrics} loading={loading} />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problemas Comunes</CardTitle>
          </CardHeader>
          <CardContent>
            <QualityIssuesTable 
              data={qualityMetrics?.commonIssues || []} 
              loading={loading} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResourcesTab({ 
  resourceOptimization, 
  loading 
}: { 
  resourceOptimization?: {
    materialWaste: Array<{ type: string; plannedQuantity: number; actualQuantity: number; wastePercentage: number; costImpact: number }>;
    laborEfficiency: Array<{ zone: string; plannedHours: number; actualHours: number; efficiency: number }>;
    optimizationRecommendations: string[];
  };
  loading?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LaborEfficiencyChart data={resourceOptimization} loading={loading} />
        <EfficiencyTrendChart data={resourceOptimization} loading={loading} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detalle por Zona</h3>
        <ResourceOptimizationTable 
          data={resourceOptimization?.laborEfficiency || []} 
          loading={loading} 
        />
      </div>

      {(resourceOptimization?.optimizationRecommendations?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recomendaciones de Optimización</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resourceOptimization?.optimizationRecommendations?.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Zap size={14} className="text-warning-500 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function BimAnalyticsPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  
  const companyId = user?.company_id || '';
  const projectIdParam = projectId;
  
  const {
    costAnalysis,
    clashAnalysis,
    progressAnalysis,
    qualityMetrics,
    resourceOptimization,
    summaryInsights,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllBIMAnalytics({
    companyId,
    projectId: projectIdParam,
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-warning-500" />
          <h3 className="text-lg font-semibold mb-2">Empresa no configurada</h3>
          <p className="text-muted-foreground">
            No se ha detectado una empresa asociada. Por favor, contacte al administrador.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-danger-500" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar análisis</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'No se pudieron cargar los datos de analítica BIM'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analítica BIM</h1>
          <p className="text-muted-foreground">
            Análisis y métricas de tus modelos BIM
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Overview Metrics */}
      <MetricsGrid
        summaryInsights={summaryInsights}
        loading={isLoading}
      />

      {/* Tabs */}
      <Tabs defaultValue="cost" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid lg:grid-cols-5">
          <TabsTrigger value="cost">Costos</TabsTrigger>
          <TabsTrigger value="clashes">Clashes</TabsTrigger>
          <TabsTrigger value="progress">Avance</TabsTrigger>
          <TabsTrigger value="quality">Calidad</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <CostTab costAnalysis={costAnalysis} loading={isLoading} />
          </Suspense>
        </TabsContent>

        <TabsContent value="clashes" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <ClashTab clashAnalysis={clashAnalysis} loading={isLoading} />
          </Suspense>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <ProgressTab progressAnalysis={progressAnalysis} loading={isLoading} />
          </Suspense>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <QualityTab qualityMetrics={qualityMetrics} loading={isLoading} />
          </Suspense>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <ResourcesTab resourceOptimization={resourceOptimization} loading={isLoading} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Insights Panel */}
      <InsightsPanel summaryInsights={summaryInsights} loading={isLoading} />
    </div>
  );
}

export default BimAnalyticsPage;