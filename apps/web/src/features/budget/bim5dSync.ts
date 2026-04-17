/**
 * BIM 5D Bidirectional Sync Service
 * 
 * Sincroniza información entre el modelo IFC y el presupuesto:
 * - BIM → Budget: Extraer cubicaciones del modelo
 * - Budget → BIM: Exportar costos actualizados al modelo
 */

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
}

export interface BimElementCost {
  ifcGlobalId: string;
  elementName: string;
  unitCost: number;
  totalCost: number;
  quantity: number;
  unit: string;
}

export interface BimSelectedElement {
  globalId: string;
  name?: string;
  category?: string;
  quantities?: Record<string, number>;
}

export interface LineItem {
  id: string;
  name: string;
  ifc_global_id?: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  total?: number;
  total_cost?: number;
}

export interface BudgetStage {
  id: string;
  items: LineItem[];
}

export function calculateElementCost(item: LineItem): BimElementCost | null {
  if (!item.ifc_global_id) return null;

  return {
    ifcGlobalId: item.ifc_global_id,
    elementName: item.name,
    unitCost: item.unit_cost || 0,
    totalCost: item.total_cost || item.total || 0,
    quantity: item.quantity,
    unit: item.unit,
  };
}

export function mergeBIMWithBudget(
  bimElements: BimSelectedElement[],
  budgetItems: LineItem[]
): Map<string, { bim: BimSelectedElement; budget: LineItem | null }> {
  const merged = new Map<string, { bim: BimSelectedElement; budget: LineItem | null }>();

  bimElements.forEach(bim => {
    const budget = budgetItems.find(item => item.ifc_global_id === bim.globalId);
    merged.set(bim.globalId, { bim, budget: budget || null });
  });

  return merged;
}

export function getLinkedElementsCount(stages: BudgetStage[]): number {
  return stages.reduce((count, stage) => {
    return count + stage.items.filter(item => !!item.ifc_global_id).length;
  }, 0);
}

export function getTotalElementCost(stages: BudgetStage[]): number {
  return stages.reduce((total, stage) => {
    return total + stage.items
      .filter(item => item.ifc_global_id)
      .reduce((stageTotal, item) => stageTotal + (item.total_cost || item.total || 0), 0);
  }, 0);
}