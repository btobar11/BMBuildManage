/**
 * BIM Audit Service — Logs BIM-sourced cubication updates
 * 
 * Records audit trail entries when quantities are updated
 * from the 3D model, providing traceability for construction budgets.
 */
import api from '../../../lib/api';
import type { BimAuditEntry } from '../types';

/**
 * Log a BIM cubication update to the backend audit system.
 * 
 * Creates an audit log entry with format:
 * "Cubicación actualizada automáticamente desde Modelo 3D (Elemento ID: GlobalId)"
 */
export async function logBimCubicationUpdate(entry: BimAuditEntry): Promise<void> {
  const description = [
    `Cubicación actualizada automáticamente desde Modelo 3D.`,
    `Elemento: ${entry.elementName} (${entry.elementCategory}).`,
    `ID: ${entry.elementGlobalId}.`,
    `Cantidad: ${entry.previousQuantity.toFixed(3)} → ${entry.quantityValue.toFixed(3)} ${entry.unit}.`,
  ].join(' ');

  // Log to console for debugging
  console.log(
    `%c[BIM Audit] %c${description}`,
    'color: #6366f1; font-weight: bold',
    'color: inherit'
  );

  try {
    await api.post('/audit-logs', {
      entity_name: 'Item',
      entity_id: entry.targetItemId,
      action: 'UPDATE',
      description,
      old_value: {
        quantity: entry.previousQuantity,
        source: 'manual',
      },
      new_value: {
        quantity: entry.quantityValue,
        unit: entry.unit,
        source: 'bim',
        ifc_global_id: entry.elementGlobalId,
        ifc_category: entry.elementCategory,
        ifc_element_name: entry.elementName,
        quantity_type: entry.quantityType,
      },
    });
  } catch (error) {
    // Non-critical: don't block the UI if audit logging fails
    console.error('[BIM Audit] Failed to log audit entry:', error);
  }
}

/**
 * Format a BIM audit entry for display in the UI
 */
export function formatAuditDescription(entry: BimAuditEntry): string {
  return `Cubicación actualizada desde Modelo 3D (Elemento ID: ${entry.elementGlobalId.substring(0, 12)}…)`;
}
