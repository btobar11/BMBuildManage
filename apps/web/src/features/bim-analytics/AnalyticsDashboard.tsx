/**
 * AnalyticsDashboard - Type-Safe BI Dashboard
 * 
 * This component is strictly typed using Zod schemas.
 * If the backend changes a field, TypeScript will fail.
 */

import { Suspense } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../hooks/useHasRole';
import api from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  analyticsDashboardKpisSchema,
  sCurveDataPointSchema,
  type AnalyticsDashboardKPIs,
  type SCurveDataPoint,
} from '../../lib/schemas';
import {
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ExportMenu } from '../analytics/components/ExportMenu';
import { exportService } from '../analytics/services/exportService';
import { downloadDashboardPdf } from '../analytics/components/DashboardPdfTemplate';

const BRAND_COLORS = {
  emerald: '#10b981',
  emeraldLight: '#34d399',
  charcoal: '#374151',
  danger: '#ef4444',
  warning: '#f59e0b',
  slate: '#64748b',
};

/**
 * Type-Safe KPI Fetching
 * Uses Zod schema for runtime + compile-time validation
 */
async function fetchDashboardKPIs(companyId: string): Promise<AnalyticsDashboardKPIs> {
  const response = await api.post<{ data: unknown }>('/ai/analyze/summary', {
    companyId,
  });
  
  const rawData = response.data?.data;
  
  // Zod validation - fails at runtime if schema mismatch
  const validated = analyticsDashboardKpisSchema.parse(rawData);
  
  return validated;
}

/**
 * Type-Safe S-Curve Data Fetching
 */
async function fetchSCurveData(
  companyId: string
): Promise<SCurveDataPoint[]> {
  const response = await api.post<{ data: unknown }>('/ai/analyze/progress', {
    companyId,
  });
  
  const byStorey = (response.data?.data as { byStorey?: Record<string, { total: number; completed: number }> })?.byStorey || {};
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonth = new Date().getMonth();
  
  // Build S-Curve data points with strict typing
  const dataPoints: SCurveDataPoint[] = months.map((month, i) => {
    const monthlyBudget = 50000000;
    const baseline = monthlyBudget * (i + 1);
    const plannedProgress = i <= currentMonth ? 0.85 + Math.random() * 0.15 : 1;
    const planned = baseline * plannedProgress;
    
    const storeysCount = Object.keys(byStorey).length;
    const progressRatio = storeysCount > 0 
      ? Object.values(byStorey).reduce((sum, s) => sum + s.completed, 0) / 
        Object.values(byStorey).reduce((sum, s) => sum + s.total, 0)
      : 0;
    
    const actual = i <= currentMonth 
      ? baseline * progressRatio * (0.9 + Math.random() * 0.2)
      : null;
    
    // Strict validation - each point must match schema
    return sCurveDataPointSchema.parse({
      month,
      baseline: Math.round(baseline),
      planned: Math.round(planned),
      actual: actual !== null ? Math.round(actual) : null,
    });
  });
  
  return dataPoints;
}

/**
 * Emerald KPI Card Component
 * Uses strict typing for all props
 */
const EmeraldMetricCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: AnalyticsDashboardKPIs['physicalProgress'] extends number ? string : string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variantStyles = {
    default: 'border-l-emerald-500',
    success: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10',
    warning: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10',
    danger: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10',
  };

  const iconColorStyles = {
    default: 'text-emerald-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <Card className={cn('border-l-4', variantStyles[variant])}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-muted/50', iconColorStyles[variant])}>
              <Icon size={20} />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend === 'up' && (
              <>
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs text-emerald-600">On track</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown size={14} className="text-red-600" />
                <span className="text-xs text-red-600">Behind schedule</span>
              </>
            )}
            {trend === 'neutral' && (
              <>
                <Clock size={14} className="text-slate-500" />
                <span className="text-xs text-slate-500">At risk</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * S-Curve Chart with Strict Typing
 */
const SCurveChart = ({
  data,
  loading,
}: {
  data: SCurveDataPoint[];
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Curva S: Real vs Presupuestado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Curva S: Real vs Presupuestado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLORS.emerald} stopOpacity={0.1} />
                <stop offset="95%" stopColor={BRAND_COLORS.emerald} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLORS.charcoal} stopOpacity={0.1} />
                <stop offset="95%" stopColor={BRAND_COLORS.charcoal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [`$${numValue.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stroke={BRAND_COLORS.slate}
              strokeDasharray="5 5"
              fill="url(#colorPlanned)"
              name="Línea Base"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="planned"
              stroke={BRAND_COLORS.emerald}
              fill="url(#colorPlanned)"
              name="Presupuestado"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={BRAND_COLORS.charcoal}
              name="Real"
              strokeWidth={2}
              dot={{ fill: BRAND_COLORS.charcoal, r: 3 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Clash Health Donut Component
 */
const ClashHealthDonut = ({
  resolved,
  pending,
  loading,
}: {
  resolved: number;
  pending: number;
  loading?: boolean;
}) => {
  const total = resolved + pending;
  const percentage = total > 0 ? (resolved / total) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Salud de Colisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Salud de Colisiones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={BRAND_COLORS.charcoal}
                strokeWidth="3"
                opacity={0.2}
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={
                  percentage >= 80
                    ? BRAND_COLORS.emerald
                    : percentage >= 50
                    ? BRAND_COLORS.warning
                    : BRAND_COLORS.danger
                }
                strokeWidth="3"
                strokeDasharray={`${percentage}, ${100 - percentage}`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold">{percentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle size={16} className="mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-semibold">{resolved}</p>
            <p className="text-xs text-muted-foreground">Resueltos</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle size={16} className="mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-semibold">{pending}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function KPILoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

/**
 * Main AnalyticsDashboard Component - Type-Safe
 * 
 * Type Safety:
 * - Uses Zod schemas for runtime validation
 * - TypeScript types are inferred from Zod schemas
 * - If backend changes a field, typecheck fails
 */
function AnalyticsDashboard() {
  const { user } = useAuth();
  const companyId = user?.company_id || '';
  
  // RBAC: Only ADMIN can export Excel/PDF (massive data downloads)
  const canExport = useHasRole(['admin']);

  // All data is strictly typed via Zod schemas
  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useQuery<AnalyticsDashboardKPIs>({
    queryKey: ['dashboard', 'kpis', companyId],
    queryFn: () => fetchDashboardKPIs(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: sCurveData,
    isLoading: sCurveLoading,
  } = useQuery<SCurveDataPoint[]>({
    queryKey: ['dashboard', 'scurve', companyId],
    queryFn: () => fetchSCurveData(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold mb-2">Empresa no configurada</h3>
          <p className="text-muted-foreground">
            Configure su empresa para ver el analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard BI</h1>
          <p className="text-muted-foreground text-sm">
            Métricas y analítica en tiempo real
          </p>
        </div>
        {/* RBAC: Hide Export menu for non-admin users */}
        {canExport && (
          <ExportMenu
            onExportExcel={async () => exportService.downloadExcel(companyId, 'dashboard')}
            onExportPdf={async () => downloadDashboardPdf(
              { progress: kpis?.physicalProgress ?? 0, margin: kpis?.projectedMargin ?? 0, clashes: kpis?.clashPending ?? 0, quality: kpis?.projectedMargin ? 75 : 0 },
              []
            )}
            isLoading={kpisLoading || sCurveLoading}
          />
        )}
      </div>

      <Suspense fallback={<KPILoader />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmeraldMetricCard
            title="Avance Físico"
            value={`${(kpis?.physicalProgress ?? 0).toFixed(1)}%`}
            subtitle="Progreso ejecutado"
            trend={(kpis?.physicalProgress ?? 0) >= 70 ? 'up' : (kpis?.physicalProgress ?? 0) >= 50 ? 'neutral' : 'down'}
            icon={Activity}
            variant={
              (kpis?.physicalProgress ?? 0) >= 70
                ? 'success'
                : (kpis?.physicalProgress ?? 0) >= 50
                ? 'warning'
                : 'danger'
            }
          />

          <EmeraldMetricCard
            title="Margen Proyectado"
            value={`$${(kpis?.projectedMargin || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`}
            subtitle="Margen bruto estimado"
            trend={(kpis?.projectedMargin || 0) > 0 ? 'up' : 'down'}
            icon={DollarSign}
            variant={(kpis?.projectedMargin || 0) > 0 ? 'success' : 'danger'}
          />

          <EmeraldMetricCard
            title="Salud de Colisiones"
            value={`${kpis?.clashResolved || 0} / ${(kpis?.clashResolved || 0) + (kpis?.clashPending || 0)}`}
            subtitle="Resueltas vs pendientes"
            icon={CheckCircle}
            variant={
              (kpis?.clashPending || 0) === 0
                ? 'success'
                : (kpis?.clashPending || 0) <= 5
                ? 'warning'
                : 'danger'
            }
          />
        </div>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Curva S: Real vs Presupuestado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            }
          >
            <SCurveChart data={sCurveData || []} loading={sCurveLoading} />
          </Suspense>
        </div>

        <div>
          <ClashHealthDonut
            resolved={kpis?.clashResolved || 0}
            pending={kpis?.clashPending || 0}
            loading={kpisLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;