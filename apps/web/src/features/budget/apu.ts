import type { ApuComponent } from './types';
import { nanoid } from './utils';
import { CHILEAN_COSTS, DEFAULT_MARKUP_BY_CATEGORY } from './costLibrary';

export const DEFAULT_APU_MARKUP: Record<string, number> = {
  material: 20,
  labor: 30,
  machinery: 25,
};

export function generateApuFromCostLibrary(
  itemName: string,
  itemQuantity: number,
  itemUnit: string,
  category: 'material' | 'labor' | 'machinery' = 'material'
): ApuComponent[] {
  const relevantCosts = CHILEAN_COSTS.filter(c => c.category === category).slice(0, 5);
  const markup = DEFAULT_MARKUP_BY_CATEGORY[category] || 20;
  
  if (relevantCosts.length === 0) {
    return [{
      id: nanoid(),
      name: `${itemName} - ${category}`,
      category,
      unit: itemUnit,
      quantity: itemQuantity,
      unitCost: 0,
      unitPrice: 0,
      totalCost: 0,
      totalPrice: 0,
    }];
  }

  return relevantCosts.slice(0, 3).map((cost: typeof CHILEAN_COSTS[0]) => ({
    id: nanoid(),
    name: cost.name,
    category: cost.category as 'material' | 'labor' | 'machinery',
    unit: cost.unit,
    quantity: itemQuantity,
    unitCost: cost.unitCost,
    unitPrice: Math.round(cost.unitCost * (1 + markup / 100)),
    totalCost: cost.unitCost * itemQuantity,
    totalPrice: Math.round(cost.unitCost * (1 + markup / 100)) * itemQuantity,
  }));
}

export function calculateApuTotals(components: ApuComponent[]): {
  totalCost: number;
  totalPrice: number;
  costByCategory: Record<string, number>;
  priceByCategory: Record<string, number>;
} {
  let totalCost = 0;
  let totalPrice = 0;
  const costByCategory: Record<string, number> = {};
  const priceByCategory: Record<string, number> = {};

  for (const comp of components) {
    totalCost += comp.totalCost;
    totalPrice += comp.totalPrice;
    
    const cat = comp.category;
    costByCategory[cat] = (costByCategory[cat] || 0) + comp.totalCost;
    priceByCategory[cat] = (priceByCategory[cat] || 0) + comp.totalPrice;
  }

  return { totalCost, totalPrice, costByCategory, priceByCategory };
}

export function calculateItemPriceFromApu(
  components: ApuComponent[],
  markupOverride?: number
): number {
  const { totalPrice } = calculateApuTotals(components);
  
  if (markupOverride && markupOverride > 0) {
    const basePrice = totalPrice / (1 + (markupOverride / 100));
    return Math.round(basePrice * (1 + markupOverride / 100));
  }
  
  return totalPrice;
}

export function generateSimpleApu(
  itemName: string,
  unitCost: number,
  quantity: number,
  itemType: 'material' | 'labor' | 'machinery' = 'material'
): ApuComponent[] {
  const markup = DEFAULT_APU_MARKUP[itemType] || 20;
  
  return [{
    id: nanoid(),
    name: itemName,
    category: itemType,
    unit: 'un',
    quantity: quantity,
    unitCost: unitCost,
    unitPrice: Math.round(unitCost * (1 + markup / 100)),
    totalCost: unitCost * quantity,
    totalPrice: Math.round(unitCost * (1 + markup / 100)) * quantity,
  }];
}

export function createEmptyApu(): ApuComponent[] {
  return [];
}

export function addApuComponent(
  components: ApuComponent[],
  name: string,
  category: 'material' | 'labor' | 'machinery',
  unit: string,
  quantity: number,
  unitCost: number,
  markup?: number
): ApuComponent[] {
  const mark = markup || DEFAULT_APU_MARKUP[category] || 20;
  
  const newComponent: ApuComponent = {
    id: nanoid(),
    name,
    category,
    unit,
    quantity,
    unitCost,
    unitPrice: Math.round(unitCost * (1 + mark / 100)),
    totalCost: unitCost * quantity,
    totalPrice: Math.round(unitCost * (1 + mark / 100)) * quantity,
  };
  
  return [...components, newComponent];
}

export function updateApuComponent(
  components: ApuComponent[],
  componentId: string,
  updates: Partial<Omit<ApuComponent, 'id' | 'totalCost' | 'totalPrice'>>
): ApuComponent[] {
  return components.map(comp => {
    if (comp.id !== componentId) return comp;
    
    const updated = { ...comp, ...updates };
    updated.totalCost = (updated.unitCost || 0) * (updated.quantity || 0);
    updated.totalPrice = (updated.unitPrice || 0) * (updated.quantity || 0);
    
    return updated;
  });
}

export function removeApuComponent(
  components: ApuComponent[],
  componentId: string
): ApuComponent[] {
  return components.filter(comp => comp.id !== componentId);
}

export const ITEM_TYPE_OPTIONS = [
  { value: 'material', label: 'Material', color: 'blue' },
  { value: 'labor', label: 'Mano de Obra', color: 'green' },
  { value: 'machinery', label: 'Equipos', color: 'orange' },
  { value: 'subcontract', label: 'Subcontrato', color: 'purple' },
];

export function getItemTypeColor(type?: string): string {
  const colors: Record<string, string> = {
    material: 'text-blue-400',
    labor: 'text-green-400',
    machinery: 'text-orange-400',
    subcontract: 'text-purple-400',
  };
  return colors[type || ''] || 'text-gray-400';
}

export function getItemTypeBgColor(type?: string): string {
  const colors: Record<string, string> = {
    material: 'bg-blue-500/20 border-blue-500/30',
    labor: 'bg-green-500/20 border-green-500/30',
    machinery: 'bg-orange-500/20 border-orange-500/30',
    subcontract: 'bg-purple-500/20 border-purple-500/30',
  };
  return colors[type || ''] || 'bg-gray-500/20 border-gray-500/30';
}
