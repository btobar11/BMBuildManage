import type { Budget, FinancialSummary, Stage, LineItem } from './types';
import { nanoid } from './utils';

export const DEFAULT_MARKUP_PERCENTAGE = 20;
export const DEFAULT_PROFESSIONAL_FEE_PERCENTAGE = 10;
export const DEFAULT_UTILITY_PERCENTAGE = 15;

export function calculateUnitPrice(unitCost: number, markupPercentage: number = DEFAULT_MARKUP_PERCENTAGE): number {
  return Math.round(unitCost * (1 + markupPercentage / 100));
}

export function calculateUnitCost(unitPrice: number, markupPercentage: number = DEFAULT_MARKUP_PERCENTAGE): number {
  if (markupPercentage === 0) return unitPrice;
  return Math.round(unitPrice / (1 + markupPercentage / 100));
}

export function calculateClientPrice(
  totalCost: number,
  professionalFeePercentage: number = DEFAULT_PROFESSIONAL_FEE_PERCENTAGE,
  utilityPercentage: number = DEFAULT_UTILITY_PERCENTAGE
): number {
  const withProfessionalFee = totalCost * (1 + professionalFeePercentage / 100);
  const clientPrice = withProfessionalFee * (1 + utilityPercentage / 100);
  return Math.round(clientPrice);
}

export function calculateClientPriceBreakdown(
  totalCost: number,
  professionalFeePercentage: number = DEFAULT_PROFESSIONAL_FEE_PERCENTAGE,
  utilityPercentage: number = DEFAULT_UTILITY_PERCENTAGE
): {
  professionalFee: number;
  subtotalAfterFee: number;
  utility: number;
  clientPrice: number;
} {
  const professionalFee = totalCost * (professionalFeePercentage / 100);
  const subtotalAfterFee = totalCost + professionalFee;
  const utility = subtotalAfterFee * (utilityPercentage / 100);
  const clientPrice = subtotalAfterFee + utility;
  return {
    professionalFee: Math.round(professionalFee),
    subtotalAfterFee: Math.round(subtotalAfterFee),
    utility: Math.round(utility),
    clientPrice: Math.round(clientPrice),
  };
}

export function calculateMarginFromPrice(clientPrice: number, totalCost: number): number {
  if (clientPrice === 0) return 0;
  return Math.round(((clientPrice - totalCost) / clientPrice) * 100);
}

export function getMarkupFromMargin(margin: number): number {
  if (margin >= 100) return 0;
  return Math.round((margin / (100 - margin)) * 100);
}

// ─── Financial computations ────────────────────────────────────────────────

export function calcLineItem(item: Omit<LineItem, 'total' | 'total_cost' | 'total_price'>): LineItem {
  const quantity = item.quantity || 0;
  const unit_cost = item.unit_cost || 0;
  let unit_price = item.unit_price || 0;
  
  if (!item.is_price_overridden && unit_cost > 0 && unit_price === 0) {
    unit_price = calculateUnitPrice(unit_cost);
  }
  
  return { 
    ...item, 
    unit_price,
    total: quantity * unit_price,
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
  const professionalFeePercentage = budget.professionalFeePercentage ?? DEFAULT_PROFESSIONAL_FEE_PERCENTAGE;
  const utilityPercentage = budget.estimatedUtility ?? DEFAULT_UTILITY_PERCENTAGE;
  
  let estimatedCost = 0;
  let estimatedPrice = 0;
  let executedValue = 0;

  (budget.stages || []).forEach(stage => {
    (stage.items || []).forEach(i => {
      const q = i.quantity || 0;
      const qe = i.quantity_executed || 0;
      const uc = i.unit_cost || 0;
      let up = i.unit_price || 0;
      
      if (!i.is_price_overridden && uc > 0 && up === 0) {
        up = calculateUnitPrice(uc);
      }
      
      estimatedCost += q * uc;
      estimatedPrice += q * up;
      executedValue += qe * up;
    });
  });
  
  const autoClientPrice = calculateClientPrice(estimatedCost, professionalFeePercentage, utilityPercentage);
  
  const realExpenses = apiRealExpenses !== undefined ? apiRealExpenses : (budget.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0);
  const workerPayments = apiWorkerPayments !== undefined ? apiWorkerPayments : (budget.workers?.reduce((s, w) => s + ((w as any).totalPaid || 0), 0) || 0);
  const contingenciesTotal = apiContingencies !== undefined ? apiContingencies : 0;
  
  const totalRealCost = realExpenses + workerPayments + contingenciesTotal;
  const clientPrice = budget.clientPrice || autoClientPrice;
  const projectedProfit = clientPrice - estimatedCost;
  const currentProfit = clientPrice - totalRealCost;
  
  const margin = clientPrice > 0 ? Math.round((projectedProfit / clientPrice) * 100) : 0;
  const realMargin = clientPrice > 0 ? Math.round((currentProfit / clientPrice) * 100) : 0;
  const variance = estimatedCost - totalRealCost;

  return {
    estimatedCost,
    estimatedPrice: clientPrice,
    autoCalculatedPrice: autoClientPrice,
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
    estimatedUtility: utilityPercentage,
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
