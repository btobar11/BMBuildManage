import { Injectable, BadRequestException } from '@nestjs/common';
import { Item, CubicationMode } from '../items/item.entity';
import { Budget } from './budget.entity';

@Injectable()
export class BusinessRulesService {
  /**
   * Validates a budget and its items against construction business rules.
   * Throws BadRequestException for blocking rules.
   * Returns an array of warning messages for soft rules.
   */
  async validateBudget(budget: Budget): Promise<string[]> {
    const warnings: string[] = [];
    const items = budget.stages?.flatMap(s => s.items || []) || [];

    for (const item of items) {
      // 1. Blocking: Negative values
      if (Number(item.quantity) < 0) {
        throw new BadRequestException(`El ítem "${item.name}" no puede tener cantidad negativa.`);
      }
      if (Number(item.unit_price) < 0 || Number(item.unit_cost) < 0) {
        throw new BadRequestException(`El ítem "${item.name}" no puede tener precios o costos negativos.`);
      }

      // 2. Cubicación Rules (Business rule #4)
      if (item.cubication_mode === CubicationMode.DIMENSIONS) {
        const l = Number(item.dim_length) || 0;
        const w = Number(item.dim_width) || 0;
        const h = Number(item.dim_height) || 0;
        const t = Number(item.dim_thickness) || 0;

        if (l <= 0 && w <= 0 && h <= 0 && t <= 0) {
          warnings.push(`Aviso: El ítem "${item.name}" está en modo dimensiones pero no tiene dimensiones válidas.`);
        }

        // Logical checks based on units
        if (item.unit?.toLowerCase() === 'm2' && l > 0 && w === 0 && h === 0) {
          warnings.push(`Aviso: El ítem "${item.name}" tiene unidad m2 pero solo una dimensión (Largo).`);
        }
        if (item.unit?.toLowerCase() === 'm3' && (l === 0 || w === 0 || h === 0)) {
           warnings.push(`Aviso: El ítem "${item.name}" tiene unidad m3 pero le faltan dimensiones para el cálculo cúbico.`);
        }
      }

      // 3. Execution alignment (Business rule #5 - Warning threshold)
      const executed = Number(item.quantity_executed) || 0;
      const estimated = Number(item.quantity) || 0;
      if (executed > estimated && estimated > 0) {
        const overage = (executed / estimated) - 1;
        if (overage > 0.05) { // 5% warning
          warnings.push(`Aviso: El ítem "${item.name}" ha superado su cantidad presupuestada por un ${Math.round(overage * 100)}%.`);
        }
      }
    }

    return warnings;
  }
}
