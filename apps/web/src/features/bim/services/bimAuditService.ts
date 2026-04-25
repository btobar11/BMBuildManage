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

  try {
    await api.post('/audit-logs', {
      entity_name: 'Item',
      entity_id: entry.targetItemId,
      action: 'UPDATE',
      description,
    });
  } catch {
    // Non-critical: audit logging failed — ignore
  }
}

/**
 * Format a BIM audit entry for display in the UI
 */
export function formatAuditDescription(entry: BimAuditEntry): string {
  return `Cubicación actualizada desde Modelo 3D (Elemento ID: ${entry.elementGlobalId.substring(0, 12)}…)`;
}
