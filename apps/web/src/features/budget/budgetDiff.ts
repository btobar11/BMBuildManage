/**
 * Budget Diff Service - Visual Budget Comparison
 * 
 * Compara dos versiones de un presupuesto y genera diferencias visuales
 * para mostrar en el visor 3D (BIM 5D).
 */
import type { Stage, LineItem } from './types';

export interface BudgetVersion {
  id: string;
  name: string;
  timestamp: string;
  stages: Stage[];
}

export interface ItemDiff {
  itemId: string;
  itemName: string;
  stageName: string;
  previousValue: number;
  currentValue: number;
  difference: number;
  percentageChange: number;
  changeType: 'increase' | 'decrease' | 'unchanged';
  ifcGlobalId?: string;
}

export interface BudgetDiffResult {
  totalPrevious: number;
  totalCurrent: number;
  totalDifference: number;
  percentageChange: number;
  items: ItemDiff[];
  affectedElements: string[];
}

export function compareBudgetVersions(
  current: BudgetVersion,
  previous: BudgetVersion | null
): BudgetDiffResult {
  if (!previous) {
    const allItems = current.stages.flatMap(s => s.items);
    const totalCurrent = allItems.reduce((sum, item) => sum + (item.total || 0), 0);
    return {
      totalPrevious: 0,
      totalCurrent,
      totalDifference: totalCurrent,
      percentageChange: 100,
      items: [],
      affectedElements: [],
    };
  }

  const items: ItemDiff[] = [];
  const affectedElements: string[] = [];

  current.stages.forEach(stage => {
    const previousStage = previous.stages.find(ps => ps.id === stage.id);
    
    stage.items.forEach(item => {
      const previousItem = previousStage?.items.find((pi: LineItem) => pi.id === item.id);
      const previousValue = previousItem?.total || 0;
      const currentValue = item.total || 0;
      const difference = currentValue - previousValue;
      const percentageChange = previousValue !== 0 
        ? ((difference / previousValue) * 100) 
        : currentValue > 0 ? 100 : 0;

      const changeType = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'unchanged';

      if (difference !== 0 || item.ifc_global_id) {
        items.push({
          itemId: item.id,
          itemName: item.name,
          stageName: stage.name,
          previousValue,
          currentValue,
          difference,
          percentageChange,
          changeType,
          ifcGlobalId: item.ifc_global_id,
        });

        if (item.ifc_global_id) {
          affectedElements.push(item.ifc_global_id);
        }
      }
    });
  });

  const totalPrevious = previous.stages.reduce(
    (sum: number, s: Stage) => sum + s.items.reduce((s2: number, i: LineItem) => s2 + (i.total || 0), 0),
    0
  );
  const totalCurrent = current.stages.reduce(
    (sum: number, s: Stage) => sum + s.items.reduce((s2: number, i: LineItem) => s2 + (i.total || 0), 0),
    0
  );
  const totalDifference = totalCurrent - totalPrevious;
  const percentageChange = totalPrevious !== 0 
    ? ((totalDifference / totalPrevious) * 100) 
    : totalCurrent > 0 ? 100 : 0;

  return {
    totalPrevious,
    totalCurrent,
    totalDifference,
    percentageChange,
    items,
    affectedElements,
  };
}