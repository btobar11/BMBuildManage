import type { ExtractionResult } from '../../bim/services/ifcExtractionService';
import type { LineItem, Stage } from '../types';
import { nanoid } from '../utils';

export interface IfcToBudgetMapping {
  ifcType: string;
  stageName: string;
  itemName: string;
  unit: string;
  quantityField: 'netVolume' | 'netArea' | 'grossVolume' | 'grossArea' | 'length' | 'width' | 'height';
}

export const DEFAULT_IFC_MAPPINGS: IfcToBudgetMapping[] = [
  { ifcType: 'IfcWall', stageName: 'Obra Gruesa', itemName: 'Muro', unit: 'm2', quantityField: 'netArea' },
  { ifcType: 'IfcWallStandardCase', stageName: 'Obra Gruesa', itemName: 'Muro', unit: 'm2', quantityField: 'netArea' },
  { ifcType: 'IfcSlab', stageName: 'Obra Gruesa', itemName: 'Losa', unit: 'm2', quantityField: 'netArea' },
  { ifcType: 'IfcColumn', stageName: 'Obra Gruesa', itemName: 'Columna', unit: 'm3', quantityField: 'netVolume' },
  { ifcType: 'IfcBeam', stageName: 'Obra Gruesa', itemName: 'Viga', unit: 'm3', quantityField: 'netVolume' },
  { ifcType: 'IfcFooting', stageName: 'Fundaciones', itemName: 'Zapata', unit: 'm3', quantityField: 'netVolume' },
  { ifcType: 'IfcPile', stageName: 'Fundaciones', itemName: 'Pilote', unit: 'm3', quantityField: 'netVolume' },
  { ifcType: 'IfcRoof', stageName: 'Techumbre', itemName: 'Techumbre', unit: 'm2', quantityField: 'netArea' },
  { ifcType: 'IfcDoor', stageName: 'Carpintería', itemName: 'Puerta', unit: 'un', quantityField: 'length' },
  { ifcType: 'IfcWindow', stageName: 'Carpintería', itemName: 'Ventana', unit: 'un', quantityField: 'length' },
  { ifcType: 'IfcStair', stageName: 'Obra Gruesa', itemName: 'Escalera', unit: 'un', quantityField: 'length' },
  { ifcType: 'IfcRailing', stageName: 'Terminaciones', itemName: 'Baranda', unit: 'ml', quantityField: 'length' },
  { ifcType: 'IfcCovering', stageName: 'Terminaciones', itemName: 'Revestimiento', unit: 'm2', quantityField: 'netArea' },
  { ifcType: 'IfcCurtainWall', stageName: 'Fachada', itemName: 'Muro cortina', unit: 'm2', quantityField: 'netArea' },
];

export function convertIfcToBudget(
  extractionResult: ExtractionResult,
  customMappings?: Partial<IfcToBudgetMapping>[]
): { stages: Stage[]; summary: IfcConversionSummary } {
  const mappings = [...DEFAULT_IFC_MAPPINGS, ...(customMappings || [])];
  const stageMap = new Map<string, Stage>();
  const summary: IfcConversionSummary = {
    totalElements: extractionResult.elementCount,
    mappedElements: 0,
    unmappedElements: 0,
    byType: {},
  };

  for (const element of extractionResult.elements) {
    const mapping = mappings.find(m => m.ifcType === element.ifcType);
    
    if (!mapping) {
      summary.unmappedElements++;
      summary.byType[element.ifcType] = (summary.byType[element.ifcType] || 0) + 1;
      continue;
    }

    summary.mappedElements++;

    const stageName = mapping.stageName ?? 'Obra Gruesa';
    const itemName = mapping.itemName ?? 'Elemento';
    const unit = mapping.unit ?? 'un';
    const quantityKey = mapping.quantityField as keyof typeof element.quantities;

    let stage = stageMap.get(stageName);
    if (!stage) {
      stage = {
        id: nanoid(),
        name: stageName,
        progress: 0,
        items: [],
      };
      stageMap.set(stageName, stage);
    }

    const quantity = element.quantities[quantityKey] as number | null;
    if (quantity === null || quantity === undefined || quantity <= 0) {
      continue;
    }

    const storeyName = element.storeyName ?? 'Sin asignar';

    const item: LineItem = {
      id: nanoid(),
      name: `${itemName} - ${element.name}`,
      quantity: Math.round(quantity * 100) / 100,
      unit: unit,
      unit_cost: 0,
      unit_price: 0,
      ifc_global_id: element.ifcGuid,
      cubication_mode: 'bim',
      geometry_data: {
        storey: storeyName,
        ...element.quantities,
      },
    };

    stage.items.push(item);
  }

  const stageOrder = ['Fundaciones', 'Obra Gruesa', 'Techumbre', 'Fachada', 'Carpintería', 'Terminaciones'];
  const stages = Array.from(stageMap.values()).sort((a, b) => {
    const orderA = stageOrder.indexOf(a.name);
    const orderB = stageOrder.indexOf(b.name);
    return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
  });

  return { stages, summary };
}

export interface IfcConversionSummary {
  totalElements: number;
  mappedElements: number;
  unmappedElements: number;
  byType: Record<string, number>;
}

export function generateIfcReport(extractionResult: ExtractionResult): string {
  const { statistics } = extractionResult;
  
  let report = `# Informe de Extracción BIM\n\n`;
  report += `## Estadísticas del Modelo\n`;
  const totalCount = statistics.byType ? Object.values(statistics.byType).reduce((a, b) => a + b, 0) : 0;
  report += `- Total de elementos: ${totalCount}\n`;
  report += `- Volumen total: ${(statistics.totalVolume || 0).toFixed(2)} m³\n`;
  report += `- Área total: ${(statistics.totalArea || 0).toFixed(2)} m²\n`;
  report += `- Longitud total: ${(statistics.totalLength || 0).toFixed(2)} m\n\n`;
  
  if (statistics.byType) {
    report += `## Elementos por Tipo\n`;
    for (const [type, count] of Object.entries(statistics.byType)) {
      report += `- ${type}: ${count}\n`;
    }
  }
  
  if (statistics.byStorey) {
    report += `\n## Elementos por Piso\n`;
    for (const [storey, count] of Object.entries(statistics.byStorey)) {
      report += `- ${storey}: ${count}\n`;
    }
  }
  
  return report;
}
