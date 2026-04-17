/**
 * Cost4DSimulation - 4D Cost Simulation (Schedule + Cashflow)
 * 
 * Integra cronograma con flujo de caja para visualizar
 * el gasto proyectado por semana/mes.
 */
import { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';

interface ScheduleTask {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  duration: number;
}

interface Cost4DSimulationProps {
  scheduleTasks: ScheduleTask[];
  totalBudget: number;
  startDate: string;
  endDate: string;
}

interface TimeSeriesPoint {
  week: string;
  plannedCost: number;
  cumulativePlanned: number;
  actualCost: number;
  cumulativeActual: number;
  variance: number;
  progress: number;
}

function getWeekLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function Cost4DSimulation({
  scheduleTasks,
  totalBudget,
  startDate,
  endDate,
}: Cost4DSimulationProps) {
  const timeSeriesData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weeks: TimeSeriesPoint[] = [];
    
    let current = new Date(start);
    while (current <= end) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      let weekPlannedCost = 0;
      let weekActualCost = 0;
      
      scheduleTasks.forEach(task => {
        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.end_date);
        
        if (taskStart <= weekEnd && taskEnd >= current) {
          const overlapDays = Math.min(
            Math.max(0, weekEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24),
            Math.min(6, (taskEnd.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
          );
          
          const overlap = Math.max(0, 7 - overlapDays);
          const costShare = totalBudget / (scheduleTasks.length || 1);
          weekPlannedCost += (task.progress / 100) * costShare * (overlap / 7);
          
          if (task.status === 'completed') {
            weekActualCost += costShare * (overlap / 7);
          }
        }
      });
      
      weeks.push({
        week: getWeekLabel(new Date(current)),
        plannedCost: Math.round(weekPlannedCost),
        cumulativePlanned: 0,
        actualCost: Math.round(weekActualCost),
        cumulativeActual: 0,
        variance: 0,
        progress: 0,
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    let cumPlanned = 0;
    let cumActual = 0;
    weeks.forEach((w, i) => {
      cumPlanned += w.plannedCost;
      cumActual += w.actualCost;
      weeks[i].cumulativePlanned = cumPlanned;
      weeks[i].cumulativeActual = cumActual;
      weeks[i].variance = cumPlanned - cumActual;
      weeks[i].progress = cumPlanned > 0 ? (cumActual / cumPlanned) * 100 : 0;
    });
    
    return weeks;
  }, [scheduleTasks, totalBudget, startDate, endDate]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  };

  const cumulativeBudget = timeSeriesData[timeSeriesData.length - 1]?.cumulativePlanned || totalBudget;
  const currentSpending = timeSeriesData.reduce((sum, w) => sum + w.actualCost, 0);
  const projectedOverspend = cumulativeBudget - totalBudget;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Presupuesto Total</p>
          <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Gasto Acumulado</p>
          <p className="text-xl font-bold text-blue-500">{formatCurrency(currentSpending)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Proyectado Final</p>
          <p className={`text-xl font-bold ${projectedOverspend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatCurrency(cumulativeBudget)}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Variación</p>
          <p className={`text-xl font-bold ${projectedOverspend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {projectedOverspend > 0 ? '+' : ''}{formatCurrency(projectedOverspend)}
          </p>
        </div>
      </div>

      {/* Curve Chart */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Curva S - Proyección de Costo</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis 
                tick={{ fontSize: 10 }} 
                stroke="#94a3b8"
                tickFormatter={(v) => formatCurrency(v as number)}
              />
              <Area
                type="monotone"
                dataKey="cumulativePlanned"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                name="Planificado"
              />
              <Line
                type="monotone"
                dataKey="cumulativeActual"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                name="Real"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Desglose Semanal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2">Semana</th>
                <th className="text-right py-2">Planificado</th>
                <th className="text-right py-2">Real</th>
                <th className="text-right py-2">Acumulado</th>
                <th className="text-right py-2">Variación</th>
                <th className="text-center py-2">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {timeSeriesData.map((week, i) => (
                <tr key={i} className="border-b border-dashed last:border-0">
                  <td className="py-2">{week.week}</td>
                  <td className="text-right">{formatCurrency(week.plannedCost)}</td>
                  <td className="text-right text-blue-500">{formatCurrency(week.actualCost)}</td>
                  <td className="text-right font-medium">{formatCurrency(week.cumulativeActual)}</td>
                  <td className={`text-right ${week.variance < 0 ? 'text-emerald-500' : week.variance > 0 ? 'text-red-500' : ''}`}>
                    {formatCurrency(week.variance)}
                  </td>
                  <td className="text-center">
                    <div className="w-16 mx-auto bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, week.progress)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}