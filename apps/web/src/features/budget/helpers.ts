import type { Budget, FinancialSummary, Stage, LineItem } from './types';
import { nanoid } from './utils';

// ─── Financial computations ────────────────────────────────────────────────

export function calcLineItem(item: Omit<LineItem, 'total'>): LineItem {
  return { ...item, total: item.quantity * item.unitPrice };
}

export function calcStageTotal(stage: Stage): number {
  return stage.items.reduce((sum, i) => sum + i.total, 0);
}

export function calcFinancials(budget: Budget): FinancialSummary {
  const estimatedCost = budget.stages.reduce(
    (s, stage) => s + calcStageTotal(stage),
    0
  );
  const realExpenses = budget.expenses.reduce((s, e) => s + e.amount, 0);
  const workerPayments = budget.workers.reduce((s, w) => s + w.totalPaid, 0);
  const totalRealCost = realExpenses + workerPayments;
  const projectedProfit = budget.clientPrice - estimatedCost;
  const currentProfit = budget.clientPrice - totalRealCost;
  const margin =
    budget.clientPrice > 0
      ? Math.round((projectedProfit / budget.clientPrice) * 100)
      : 0;

  return {
    estimatedCost,
    realExpenses,
    workerPayments,
    totalRealCost,
    projectedProfit,
    currentProfit,
    margin,
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
    unitPrice: 0,
    costCode: '',
    total: 0,
  };
}
