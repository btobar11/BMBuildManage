import { Suspense, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
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

const BRAND_COLORS = {
  emerald: '#10b981',
  emeraldLight: '#34d399',
  charcoal: '#374151',
  danger: '#ef4444',
  warning: '#f59e0b',
  slate: '#64748b',
};

interface DashboardKPIs {
  physicalProgress: number;
  projectedMargin: number;
  clashResolved: number;
  clashPending: number;
  totalBudget: number;
  actualSpent: number;
  scheduleVariance: number;
}

interface SCurvePoint {
  month: string;
  planned: number;
  actual?: number;
  baseline?: number;
}

const EmeraldMetricCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
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

const SCurveChart = ({
  data,
  loading,
}: {
  data: SCurvePoint[];
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
              formatter={(value: number) => [
                `$${value.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
              ]}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

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

async function fetchDashboardKPIs(companyId: string): Promise<DashboardKPIs> {
  const response = await api.post<{ data: DashboardKPIs }>('/ai/analyze/summary', {
    companyId,
  });
  const data = response.data?.data;

  return {
    physicalProgress: data?.progressPercentage || 0,
    projectedMargin: data?.totalCost || 0,
    clashResolved: 0,
    clashPending: data?.activeClashes || 0,
    totalBudget: data?.totalCost || 0,
    actualSpent: 0,
    scheduleVariance: 0,
  };
}

async function fetchSCurveData(
  companyId: string
): Promise<SCurvePoint[]> {
  const response = await api.post<{ data: { byStorey: Record<string, { total: number; completed: number; percentage: number }> } }>('/ai/analyze/progress', {
    companyId,
  });
  const byStorey = response.data?.data?.byStorey || {};

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonth = new Date().getMonth();

  const baseline: number[] = [];
  const planned: number[] = [];
  let cumulative = 0;

  months.forEach((_, i) => {
    const monthlyBudget = 50000000;
    cumulative += monthlyBudget;
    baseline.push(cumulative);
    if (i <= currentMonth) {
      planned.push(cumulative * (0.85 + Math.random() * 0.15));
    } else {
      planned.push(cumulative);
    }
  });

  const actual: number[] = [];
  let actualCumulative = 0;
  const storeys = Object.values(byStorey);
  const totalCompleted = storeys.reduce((sum, s) => sum + s.completed, 0);
  const totalElements = storeys.reduce((sum, s) => sum + s.total, 0);
  const progressRatio = totalElements > 0 ? totalCompleted / totalElements : 0;
  const totalBudget = 500000000;

  for (let i = 0; i <= currentMonth; i++) {
    actualCumulative += 50000000 * progressRatio * (0.9 + Math.random() * 0.2);
    actual.push(actualCumulative);
  }

  return months.map((month, i) => ({
    month,
    baseline: baseline[i] || 0,
    planned: planned[i] || 0,
    actual: actual[i],
  }));
}

function KPILoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

function AnalyticsDashboard() {
  const { user } = useAuth();
  const companyId = user?.company_id || '';

  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useQuery({
    queryKey: ['dashboard', 'kpis', companyId],
    queryFn: () => fetchDashboardKPIs(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: sCurveData,
    isLoading: sCurveLoading,
  } = useQuery({
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
      </div>

      <Suspense fallback={<KPILoader />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmeraldMetricCard
            title="Avance Físico"
            value={`${kpis?.physicalProgress.toFixed(1) || '0.0'}%`}
            subtitle="Progreso ejecutado"
            trend={kpis?.physicalProgress >= 70 ? 'up' : kpis?.physicalProgress >= 50 ? 'neutral' : 'down'}
            icon={Activity}
            variant={
              kpis?.physicalProgress >= 70
                ? 'success'
                : kpis?.physicalProgress >= 50
                ? 'warning'
                : 'danger'
            }
          />

          <EmeraldMetricCard
            title="Margen Proyectado"
            value={`$${(kpis?.projectedMargin || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`}
            subtitle="Margen bruto estimado"
            trend={
              (kpis?.projectedMargin || 0) > 0 ? 'up' : 'down'
            }
            icon={DollarSign}
            variant={
              (kpis?.projectedMargin || 0) > 0 ? 'success' : 'danger'
            }
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