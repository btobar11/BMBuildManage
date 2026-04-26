import type { Budget, FinancialSummary, Stage, LineItem } from './types';
import { nanoid } from './utils';

export const DEFAULT_MARKUP_PERCENTAGE = 20;
export const DEFAULT_PROFESSIONAL_FEE_PERCENTAGE = 10;
export const DEFAULT_UTILITY_PERCENTAGE = 15;

export const DEFAULT_MARKUP_BY_ITEM_TYPE: Record<string, number> = {
  material: 20,
  labor: 30,
  machinery: 25,
  subcontract: 15,
};

export function calculateUnitPrice(
  unitCost: number, 
  markupPercentage: number = DEFAULT_MARKUP_PERCENTAGE,
  itemType?: string
): number {
  if (itemType && DEFAULT_MARKUP_BY_ITEM_TYPE[itemType]) {
    markupPercentage = DEFAULT_MARKUP_BY_ITEM_TYPE[itemType];
  }
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

export function calculateMarkupFromMargin(marginPercentage: number): number {
  if (marginPercentage >= 100) return 0;
  if (marginPercentage <= 0) return 0;
  return Math.round((marginPercentage / (100 - marginPercentage)) * 100);
}

export function calculateTargetMargin(
  totalCost: number,
  targetMarginPercentage: number,
  professionalFeePercentage: number = DEFAULT_PROFESSIONAL_FEE_PERCENTAGE
): {
  requiredUtility: number;
  clientPrice: number;
  actualMargin: number;
  breakdown: {
    baseCost: number;
    professionalFee: number;
    targetUtility: number;
    finalPrice: number;
  };
} {
  const baseCost = totalCost;
  const professionalFee = baseCost * (professionalFeePercentage / 100);
  const subtotal = baseCost + professionalFee;
  
  const requiredUtility = (subtotal * targetMarginPercentage) / (100 - targetMarginPercentage);
  const finalPrice = subtotal + requiredUtility;
  const actualMargin = Math.round(((finalPrice - baseCost) / finalPrice) * 100);
  
  return {
    requiredUtility: Math.round(requiredUtility),
    clientPrice: Math.round(finalPrice),
    actualMargin,
    breakdown: {
      baseCost: Math.round(baseCost),
      professionalFee: Math.round(professionalFee),
      targetUtility: Math.round(requiredUtility),
      finalPrice: Math.round(finalPrice),
    },
  };
}

export function calculateRequiredMarkupForTargetMargin(
  targetMarginPercentage: number,
  professionalFeePercentage: number = DEFAULT_PROFESSIONAL_FEE_PERCENTAGE
): number {
  const factor = (100 - targetMarginPercentage) / 100;
  const markupWithFee = (1 / factor) - 1;
  const markupWithoutFee = (100 + professionalFeePercentage) / 100;
  return Math.round((markupWithFee / markupWithoutFee - 1) * 100);
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
  
  const markupByType = item.markup_percentage ?? DEFAULT_MARKUP_BY_ITEM_TYPE[item.item_type || ''] ?? DEFAULT_MARKUP_PERCENTAGE;
  
  if (!item.is_price_overridden && unit_cost > 0 && unit_price === 0) {
    unit_price = calculateUnitPrice(unit_cost, markupByType, item.item_type);
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
  apiContingencies: number = 0,
  ufValue: number = 0
): FinancialSummary {
  const professionalFeePercentage = budget.professionalFeePercentage ?? DEFAULT_PROFESSIONAL_FEE_PERCENTAGE;
  const utilityPercentage = budget.estimatedUtility ?? DEFAULT_UTILITY_PERCENTAGE;
  const targetMargin = budget.targetMargin ?? 25;
  
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

  let autoClientPrice: number;
  let calculatedUtility: number;
  
  if (budget.targetMargin && budget.targetMargin > 0) {
    const targetResult = calculateTargetMargin(estimatedCost, targetMargin, professionalFeePercentage);
    autoClientPrice = targetResult.clientPrice;
    calculatedUtility = targetResult.requiredUtility;
  } else {
    autoClientPrice = calculateClientPrice(estimatedCost, professionalFeePercentage, utilityPercentage);
    calculatedUtility = utilityPercentage;
  }
  
  const realExpenses = apiRealExpenses !== undefined ? apiRealExpenses : (budget.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0);
  const workerPayments = apiWorkerPayments !== undefined ? apiWorkerPayments : (budget.workers?.reduce((s, w) => s + ((w as any).totalPaid || 0), 0) || 0);
  const contingenciesTotal = apiContingencies !== undefined ? apiContingencies : 0;
  
  const totalRealCost = realExpenses + workerPayments + contingenciesTotal;
  const clientPriceRaw = budget.clientPrice || autoClientPrice;
  
  // Convert to CLP for internal calculations if budget is in UF
  const clientPriceInCLP = (budget.currency === 'UF' && ufValue > 0) 
    ? clientPriceRaw * ufValue 
    : clientPriceRaw;

  const projectedProfit = clientPriceInCLP - estimatedCost;
  const currentProfit = clientPriceInCLP - totalRealCost;
  
  const margin = clientPriceInCLP > 0 ? Math.round((projectedProfit / clientPriceInCLP) * 100) : 0;
  const realMargin = clientPriceInCLP > 0 ? Math.round((currentProfit / clientPriceInCLP) * 100) : 0;
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
    estimatedUtility: calculatedUtility,
    targetMargin: budget.targetMargin ?? 25,
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
