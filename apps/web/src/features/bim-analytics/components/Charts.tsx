import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  slate: '#64748b',
};

const DEFAULT_COLORS = Object.values(COLORS);

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

function ChartCard({ title, children, className, loading }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface CostAnalysisChartProps {
  data?: Array<{
    ifcType: string;
    totalCost: number;
    totalVolume: number;
    costPerM3: number;
    executionProgress: number;
  }>;
  loading?: boolean;
}

export function CostAnalysisBarChart({ data, loading }: CostAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    return (data || []).map((item) => ({
      name: item.ifcType.replace('Ifc', ''),
      Costo: item.totalCost,
      'Costo/m³': item.costPerM3,
      Volumen: item.totalVolume,
      Avance: item.executionProgress,
    }));
  }, [data]);

  return (
    <ChartCard title="Análisis de Costos por Tipo de Elemento" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`$${(typeof value === 'number' ? value : 0).toLocaleString('es-CL')}`, '']}
          />
          <Legend />
          <Bar dataKey="Costo" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CostVolumeComboChart({ data, loading }: CostAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    return (data || []).map((item) => ({
      name: item.ifcType.replace('Ifc', ''),
      Costo: item.totalCost,
      Volumen: item.totalVolume,
    }));
  }, [data]);

  return (
    <ChartCard title="Costo vs Volumen por Tipo" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="Costo" fill={COLORS.primary} radius={[4, 4, 0, 0]} yAxisId="left" />
          <Line type="monotone" dataKey="Volumen" stroke={COLORS.warning} strokeWidth={2} yAxisId="right" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProgressPieChart({ 
  data, 
  loading 
}: { 
  data: Array<{ ifcType: string; executionProgress: number }> | undefined; 
  loading?: boolean;
}) {
  const chartData = React.useMemo(() => {
    return (data || []).map((item, index) => ({
      name: item.ifcType.replace('Ifc', ''),
      value: item.executionProgress,
      fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [data]);

  if (!data?.length) {
    return (
      <ChartCard title="Distribución de Avance" loading={loading}>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No hay datos disponibles
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Distribución de Avance por Tipo" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : '0'}%`, 'Avance']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ClashAnalysisChartProps {
  data: {
    totalClashes: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    byType: { hard: number; soft: number; clearance: number };
  } | undefined;
  loading?: boolean;
}

export function ClashSeverityChart({ data, loading }: ClashAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Crítico', value: data.bySeverity.critical, fill: COLORS.danger },
      { name: 'Alto', value: data.bySeverity.high, fill: COLORS.warning },
      { name: 'Medio', value: data.bySeverity.medium, fill: COLORS.info },
      { name: 'Bajo', value: data.bySeverity.low, fill: COLORS.success },
    ];
  }, [data]);

  return (
    <ChartCard title="Clashes por Severidad" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ClashTypeChart({ data, loading }: ClashAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Duro', value: data.byType.hard },
      { name: 'Suavio', value: data.byType.soft },
      { name: 'Clearance', value: data.byType.clearance },
    ];
  }, [data]);

  return (
    <ChartCard title="Clashes por Tipo" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ProgressAnalysisChartProps {
  data: {
    byStorey: Record<string, { total: number; completed: number; percentage: number; volume: number }>;
    progressPercentage: number;
  } | undefined;
  loading?: boolean;
}

export function ProgressByStoreyChart({ data, loading }: ProgressAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byStorey || {}).map(([storey, stats]) => ({
      name: storey,
      Total: stats.total,
      Completados: stats.completed,
      Avance: stats.percentage,
    }));
  }, [data]);

  return (
    <ChartCard title="Avance por Nivel" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="Completados" fill={COLORS.success} stackId="a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Total" fill={COLORS.slate} stackId="a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProgressTrendChart({ data, loading }: ProgressAnalysisChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byStorey || {}).map(([storey, stats]) => ({
      name: storey,
      Avance: stats.percentage,
    }));
  }, [data]);

  return (
    <ChartCard title="Porcentaje de Avance por Nivel" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : '0'}%`, 'Avance']}
          />
          <Area
            type="monotone"
            dataKey="Avance"
            stroke={COLORS.primary}
            fill={COLORS.primary}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface QualityChartProps {
  data: {
    qualityScore: number;
    modelCompleteness: number;
    dataConsistency: number;
    elementsWithIssues: number;
  } | undefined;
  loading?: boolean;
}

export function QualityMetricsRadar({ data, loading }: QualityChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      { metric: 'Quality Score', value: data.qualityScore, fullMark: 100 },
      { metric: 'Model Completeness', value: data.modelCompleteness, fullMark: 100 },
      { metric: 'Data Consistency', value: data.dataConsistency, fullMark: 100 },
    ];
  }, [data]);

  return (
    <ChartCard title="Métricas de Calidad" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis dataKey="metric" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : '0'}%`, '']}
          />
          <Bar dataKey="value" fill={COLORS.info} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ResourceChartProps {
  data: {
    laborEfficiency: Array<{ zone: string; plannedHours: number; actualHours: number; efficiency: number }>;
  } | undefined;
  loading?: boolean;
}

export function LaborEfficiencyChart({ data, loading }: ResourceChartProps) {
  const chartData = React.useMemo(() => {
    return (data?.laborEfficiency || []).map((item) => ({
      name: item.zone,
      Planificadas: item.plannedHours,
      Reales: item.actualHours,
      Eficiencia: item.efficiency,
    }));
  }, [data]);

  return (
    <ChartCard title="Eficiencia de Mano de Obra" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="Planificadas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Reales" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EfficiencyTrendChart({ data, loading }: ResourceChartProps) {
  const chartData = React.useMemo(() => {
    return (data?.laborEfficiency || []).map((item) => ({
      name: item.zone,
      Eficiencia: item.efficiency,
    }));
  }, [data]);

  return (
    <ChartCard title="Tendencia de Eficiencia por Zona" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : '0'}%`, 'Eficiencia']}
          />
          <Line
            type="monotone"
            dataKey="Eficiencia"
            stroke={COLORS.success}
            strokeWidth={2}
            dot={{ fill: COLORS.success }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}