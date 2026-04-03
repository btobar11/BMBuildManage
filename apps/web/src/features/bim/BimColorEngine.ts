/**
 * BimColorEngine — Módulo 1: Lógica de Estados y Colores
 *
 * Classifies IFC model elements into visual states based on budget cubication data
 * and applies corresponding materials to Three.js fragments without losing geometry.
 */
import * as THREE from 'three';
import type { Stage } from '../budget/types';

// ─── Color Palette ─────────────────────────────────────────────────────────────

export const BIM_COLORS = {
  /** Cubicado: partida vinculada con quantity > 0 */
  CUBICATED: { hex: '#10B981', color: 0x10b981, opacity: 0.6, name: 'Cubicado' },
  /** Pendiente: sin partida asignada o quantity === 0 */
  PENDING:   { hex: '#6B7280', color: 0x6b7280, opacity: 1.0, name: 'Pendiente' },
  /** Selección actual: elemento activamente seleccionado */
  SELECTED:  { hex: '#F97316', color: 0xf97316, opacity: 1.0, name: 'Selección' },
} as const;

export type BimElementState = 'CUBICATED' | 'PENDING' | 'SELECTED';

export interface BimElementClassification {
  globalId: string;
  state: BimElementState;
  itemName?: string;
  stageId?: string;
  stageName?: string;
  quantity?: number;
}

// ─── Materials Cache ───────────────────────────────────────────────────────────

const materialsCache = new Map<BimElementState, THREE.MeshStandardMaterial>();

export function getMaterial(state: BimElementState): THREE.MeshStandardMaterial {
  if (materialsCache.has(state)) return materialsCache.get(state)!;

  const config = BIM_COLORS[state];
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color),
    transparent: config.opacity < 1.0,
    opacity: config.opacity,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.1,
  });

  if (state === 'SELECTED') {
    mat.emissive = new THREE.Color(0xf97316);
    mat.emissiveIntensity = 0.3;
  }

  if (state === 'CUBICATED') {
    mat.emissive = new THREE.Color(0x10b981);
    mat.emissiveIntensity = 0.08;
  }

  materialsCache.set(state, mat);
  return mat;
}

// ─── Classification Engine ─────────────────────────────────────────────────────

/**
 * Build a map of IFC GlobalId → BimElementClassification from budget stages.
 * Elements linked to items with quantity > 0 are CUBICATED, others PENDING.
 */
export function classifyElements(stages: Stage[]): Map<string, BimElementClassification> {
  const map = new Map<string, BimElementClassification>();

  for (const stage of stages) {
    for (const item of stage.items) {
      if (item.ifc_global_id) {
        const isCubicated = (item.quantity || 0) > 0;
        map.set(item.ifc_global_id, {
          globalId: item.ifc_global_id,
          state: isCubicated ? 'CUBICATED' : 'PENDING',
          itemName: item.name,
          stageId: stage.id,
          stageName: stage.name,
          quantity: item.quantity,
        });
      }
    }
  }

  return map;
}

/**
 * Get all unique IFC GlobalIds currently linked in the budget.
 */
export function getLinkedGlobalIds(stages: Stage[]): Set<string> {
  const ids = new Set<string>();
  for (const stage of stages) {
    for (const item of stage.items) {
      if (item.ifc_global_id) ids.add(item.ifc_global_id);
    }
  }
  return ids;
}

/**
 * Compute stats for the legend overlay.
 */
export function getClassificationStats(
  classification: Map<string, BimElementClassification>,
  totalElements: number
): { cubicated: number; pending: number; total: number; percentage: number } {
  let cubicated = 0;
  classification.forEach((c) => {
    if (c.state === 'CUBICATED') cubicated++;
  });

  return {
    cubicated,
    pending: totalElements - cubicated,
    total: totalElements,
    percentage: totalElements > 0 ? Math.round((cubicated / totalElements) * 100) : 0,
  };
}

/**
 * Apply colors to a Three.js model based on classification.
 * This traverses the model's meshes and sets override materials without
 * destroying the original geometry.
 */
export function applyColorsToModel(
  model: THREE.Object3D,
  classification: Map<string, BimElementClassification>,
  selectedGlobalId: string | null,
  hideCubicated: boolean
): void {
  model.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    // Extract the IFC GlobalId from mesh metadata
    const globalId =
      mesh.userData?.GlobalId ||
      mesh.userData?.globalId ||
      mesh.userData?.expressID?.toString() ||
      mesh.name;

    if (!globalId) {
      mesh.material = getMaterial('PENDING');
      mesh.visible = !hideCubicated; // show non-linked elements always
      return;
    }

    let state: BimElementState = 'PENDING';

    if (selectedGlobalId && globalId === selectedGlobalId) {
      state = 'SELECTED';
    } else {
      const entry = classification.get(globalId);
      if (entry) state = entry.state;
    }

    mesh.material = getMaterial(state);

    // Visibility filter
    if (hideCubicated && state === 'CUBICATED') {
      mesh.visible = false;
    } else {
      mesh.visible = true;
    }
  });
}

// ─── Dispose ───────────────────────────────────────────────────────────────────

export function disposeMaterials() {
  materialsCache.forEach((mat) => mat.dispose());
  materialsCache.clear();
}
