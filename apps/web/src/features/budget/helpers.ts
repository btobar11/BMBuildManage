import type { Budget, FinancialSummary, Stage, LineItem } from './types';
import { nanoid } from './utils';

// ─── Financial computations ────────────────────────────────────────────────

export function calcLineItem(item: Omit<LineItem, 'total' | 'total_cost' | 'total_price'>): LineItem {
  const quantity = item.quantity || 0;
  const unit_cost = item.unit_cost || 0;
  const unit_price = item.unit_price || 0;
  
  return { 
    ...item, 
    total: quantity * unit_price, // legacy
    total_cost: quantity * unit_cost,
    total_price: quantity * unit_price
  };
}

export function calcStageTotal(stage: Stage, type: 'cost' | 'price' = 'price'): number {
  return (stage.items || []).reduce((sum, i) => {
    const val = type === 'price' ? (i.total_price || i.total || 0) : (i.total_cost || 0);
    return sum + val;
  }, 0);
}

export function calcFinancials(
  budget: Budget,
  apiRealExpenses: number = 0,
  apiWorkerPayments: number = 0,
  apiContingencies: number = 0
): FinancialSummary {
  let estimatedCost = 0;
  let estimatedPrice = 0;
  let executedValue = 0;

  (budget.stages || []).forEach(stage => {
    (stage.items || []).forEach(i => {
      const q = i.quantity || 0;
      const qe = i.quantity_executed || 0;
      estimatedCost += q * (i.unit_cost || 0);
      estimatedPrice += q * (i.unit_price || 0);
      executedValue += qe * (i.unit_price || 0);
    });
  });
  
  const realExpenses = apiRealExpenses !== undefined ? apiRealExpenses : (budget.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0);
  const workerPayments = apiWorkerPayments !== undefined ? apiWorkerPayments : (budget.workers?.reduce((s, w) => s + ((w as any).totalPaid || 0), 0) || 0);
  const contingenciesTotal = apiContingencies !== undefined ? apiContingencies : 0;
  
  const totalRealCost = realExpenses + workerPayments + contingenciesTotal;
  const projectedProfit = estimatedPrice - estimatedCost;
  const currentProfit = estimatedPrice - totalRealCost;
  
  const margin = estimatedPrice > 0 ? Math.round((projectedProfit / estimatedPrice) * 100) : 0;
  const realMargin = estimatedPrice > 0 ? Math.round((currentProfit / estimatedPrice) * 100) : 0;
  const variance = estimatedCost - totalRealCost;

  return {
    estimatedCost,
    estimatedPrice,
    realExpenses,
    workerPayments,
    contingenciesTotal,
    totalRealCost,
    projectedProfit,
    currentProfit,
    margin,
    realMargin,
    variance,
    executedValue,
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────

export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Stage / item helpers ─────────────────────────────────────────────────

export function newStage(name: string): Stage {
  return { id: nanoid(), name, progress: 0, items: [] };
}

export function newLineItem(): LineItem {
  return {
    id: nanoid(),
    name: '',
    quantity: 1,
    unit: 'm2',
    unit_cost: 0,
    unit_price: 0,
    cost_code: '',
    total: 0,
  };
}
