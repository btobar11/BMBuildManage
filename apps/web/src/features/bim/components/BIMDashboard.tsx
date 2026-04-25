import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Area,
  AreaChart,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  Target,
  BarChart3,
} from 'lucide-react';
import api from '../../../lib/api';
import { captureException } from '../../../lib/telemetry';

interface BIMDashboardProps {
  projectId: string;
  companyId: string;
  refreshInterval?: number; // milliseconds
}

interface BIMMetrics {
  overview: {
    totalElements: number;
    completedElements: number;
    progressPercentage: number;
    totalVolume: number;
    totalCost: number;
    qualityScore: number;
    activeClashes: number;
    criticalIssues: number;
  };
  performance: {
    fps: number;
    memoryUsageMB: number;
    loadTime: number;
    renderTime: number;
    triangleCount: number;
  };
  clashes: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolvedPercentage: number;
    avgResolutionTime: number;
  };
  progress: {
    byPhase: Array<{
      phase: string;
      progress: number;
      elements: number;
      status: 'not_started' | 'in_progress' | 'delayed' | 'completed';
    }>;
    byStorey: Array<{
      storey: string;
      progress: number;
      elements: number;
      volume: number;
    }>;
  };
  costs: {
    byCategory: Array<{
      category: string;
      planned: number;
      actual: number;
      variance: number;
    }>;
    timeline: Array<{
      date: string;
      planned: number;
      actual: number;
    }>;
  };
  quality: {
    overall: number;
    geometry: number;
    data: number;
    integration: number;
    issues: Array<{
      type: string;
      count: number;
      severity: 'minor' | 'major' | 'critical';
    }>;
  };
  realTimeUpdates: {
    lastUpdate: Date;
    activeUsers: number;
    recentChanges: Array<{
      timestamp: Date;
      user: string;
      action: string;
      element: string;
    }>;
  };
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const STATUS_COLORS = {
  not_started: '#6b7280',
  in_progress: '#3b82f6',
  delayed: '#ef4444',
  completed: '#10b981',
};

export const BIMDashboard: React.FC<BIMDashboardProps> = ({
  projectId,
  companyId,
  refreshInterval = 5000, // 5 seconds default
}) => {
  const [metrics, setMetrics] = useState<BIMMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch BIM metrics from API
  const fetchBIMMetrics = async () => {
    try {
      const res = await api.get(`/bim/dashboard/${projectId}`);
      setMetrics(res.data);
      setLastUpdateTime(new Date());
      setError(null);
    } catch (err) {
      captureException(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    fetchBIMMetrics();

    const interval = setInterval(fetchBIMMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [projectId, companyId, refreshInterval]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!metrics) return null;

    return {
      progressTrend: metrics.overview.progressPercentage > 75 ? 'positive' : 
                    metrics.overview.progressPercentage > 50 ? 'neutral' : 'negative',
      clashTrend: metrics.clashes.critical > 5 ? 'critical' :
                  metrics.clashes.high > 10 ? 'warning' : 'good',
      performanceStatus: metrics.performance.fps > 30 ? 'excellent' :
                        metrics.performance.fps > 20 ? 'good' :
                        metrics.performance.fps > 10 ? 'fair' : 'poor',
      memoryStatus: metrics.performance.memoryUsageMB > 1500 ? 'high' :
                   metrics.performance.memoryUsageMB > 1000 ? 'medium' : 'low',
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading BIM dashboard: {error}</span>
            </div>
            <Button onClick={fetchBIMMetrics} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BIM Dashboard</h1>
          <p className="text-gray-600">
            Real-time BIM monitoring and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-3xl font-bold">
                  {metrics.overview.progressPercentage}%
                </p>
                <div className="flex items-center mt-2">
                  {derivedMetrics?.progressTrend === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${
                    derivedMetrics?.progressTrend === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.overview.completedElements}/{metrics.overview.totalElements} elements
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress 
              value={metrics.overview.progressPercentage} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        {/* Active Clashes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clashes</p>
                <p className="text-3xl font-bold text-red-600">
                  {metrics.overview.activeClashes}
                </p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 ml-1">
                    {metrics.clashes.critical} critical
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Resolved: {metrics.clashes.resolvedPercentage}%</span>
                <span>Avg: {metrics.clashes.avgResolutionTime}d</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.overview.qualityScore}%
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">
                    {metrics.quality.issues.filter(i => i.severity === 'critical').length} critical issues
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-3xl font-bold">
                  {metrics.performance.fps} FPS
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">
                    {metrics.performance.memoryUsageMB}MB memory
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Badge 
              variant={derivedMetrics?.performanceStatus === 'excellent' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {derivedMetrics?.performanceStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="clashes">Clashes</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress by Phase */}
            <Card>
              <CardHeader>
                <CardTitle>Progress by Construction Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.progress.byPhase}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="phase" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="progress" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Clash Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Clash Distribution by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: metrics.clashes.critical, fill: SEVERITY_COLORS.critical },
                        { name: 'High', value: metrics.clashes.high, fill: SEVERITY_COLORS.high },
                        { name: 'Medium', value: metrics.clashes.medium, fill: SEVERITY_COLORS.medium },
                        { name: 'Low', value: metrics.clashes.low, fill: SEVERITY_COLORS.low },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Recent Activity</span>
                <Badge variant="outline">{metrics.realTimeUpdates.activeUsers} active users</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.realTimeUpdates.recentChanges.map((change, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <strong>{change.user}</strong> {change.action} <strong>{change.element}</strong>
                      </p>
                      <p className="text-xs text-gray-500">
                        {change.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress by Storey */}
            <Card>
              <CardHeader>
                <CardTitle>Progress by Building Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.progress.byStorey.map((storey, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{storey.storey}</span>
                        <span className="text-sm text-gray-500">
                          {storey.progress}% ({storey.elements} elements)
                        </span>
                      </div>
                      <Progress value={storey.progress} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Volume Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Volume Progress by Level</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.progress.byStorey}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="storey" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clashes Tab */}
        <TabsContent value="clashes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clash Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Clash Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Clashes</span>
                  <Badge variant="outline">{metrics.clashes.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resolution Rate</span>
                  <Badge variant="default">{metrics.clashes.resolvedPercentage}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Resolution Time</span>
                  <Badge variant="secondary">{metrics.clashes.avgResolutionTime}d</Badge>
                </div>
                <Progress value={metrics.clashes.resolvedPercentage} />
              </CardContent>
            </Card>

            {/* Clash Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Clash Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Critical', count: metrics.clashes.critical, color: 'bg-red-500' },
                    { label: 'High', count: metrics.clashes.high, color: 'bg-orange-500' },
                    { label: 'Medium', count: metrics.clashes.medium, color: 'bg-yellow-500' },
                    { label: 'Low', count: metrics.clashes.low, color: 'bg-green-500' },
                  ].map((item, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <div className={`w-8 h-8 ${item.color} rounded-full mx-auto mb-2`}></div>
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="text-sm text-gray-600">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Variance by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Variance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.costs.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="variance" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Timeline: Planned vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.costs.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="planned" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Overall Quality', value: metrics.quality.overall, color: 'bg-blue-500' },
                  { label: 'Geometry Quality', value: metrics.quality.geometry, color: 'bg-green-500' },
                  { label: 'Data Quality', value: metrics.quality.data, color: 'bg-yellow-500' },
                  { label: 'Integration Score', value: metrics.quality.integration, color: 'bg-purple-500' },
                ].map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{metric.label}</span>
                      <span className="text-sm font-bold">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quality Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Issues by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.quality.issues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{issue.type}</p>
                        <p className="text-sm text-gray-500">{issue.count} occurrences</p>
                      </div>
                      <Badge 
                        variant={issue.severity === 'critical' ? 'destructive' : 
                               issue.severity === 'major' ? 'default' : 'secondary'}
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
