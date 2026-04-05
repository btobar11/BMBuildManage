/**
 * BimProgressColorEngine — 4D Progress Visual Feedback
 * 
 * Extends BimColorEngine to show construction progress states on BIM elements.
 * Colors elements based on their execution status (No Iniciado, En Progreso, Ejecutado, Verificado).
 * 
 * Uses Emerald Green (#10b981) as the primary success color for executed elements.
 */
import * as THREE from 'three';
import type { ElementStatus } from './types-bim5d';

// ─── Progress State Colors ──────────────────────────────────────────────────────

export const PROGRESS_COLORS: Record<ElementStatus, { 
  hex: string; 
  color: number; 
  emissive: number; 
  emissiveIntensity: number;
  opacity: number;
  label: string;
}> = {
  no_iniciado: { 
    hex: '#64748B', 
    color: 0x64748b, 
    emissive: 0x000000, 
    emissiveIntensity: 0,
    opacity: 1.0,
    label: 'No Iniciado',
  },
  en_progreso: { 
    hex: '#F59E0B', 
    color: 0xf59e0b, 
    emissive: 0xf59e0b, 
    emissiveIntensity: 0.15,
    opacity: 0.9,
    label: 'En Progreso',
  },
  ejecutado: { 
    hex: '#10B981', 
    color: 0x10b981, 
    emissive: 0x10b981, 
    emissiveIntensity: 0.2,
    opacity: 0.85,
    label: 'Ejecutado',
  },
  verificado: { 
    hex: '#06B6D4', 
    color: 0x06b6d4, 
    emissive: 0x06b6d4, 
    emissiveIntensity: 0.25,
    opacity: 0.8,
    label: 'Verificado',
  },
};

// ─── Progress Materials Cache ───────────────────────────────────────────────────

const progressMaterialsCache = new Map<ElementStatus, THREE.MeshStandardMaterial>();
const transparentMaterialsCache = new Map<ElementStatus, THREE.MeshStandardMaterial>();

export function getProgressMaterial(
  status: ElementStatus,
  transparent: boolean = false
): THREE.MeshStandardMaterial {
  const cache = transparent ? transparentMaterialsCache : progressMaterialsCache;
  if (cache.has(status)) return cache.get(status)!;

  const config = PROGRESS_COLORS[status];
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color),
    transparent: transparent || config.opacity < 1.0,
    opacity: config.opacity,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.1,
    emissive: new THREE.Color(config.emissive),
    emissiveIntensity: config.emissiveIntensity,
  });

  cache.set(status, mat);
  return mat;
}

// ─── State Color Helper ───────────────────────────────────────────────────────

export function getStatusColor(status: ElementStatus): string {
  return PROGRESS_COLORS[status]?.hex || '#64748B';
}

export function getStatusEmissive(status: ElementStatus): number {
  return PROGRESS_COLORS[status]?.emissive || 0x000000;
}

// ─── Element State Map ────────────────────────────────────────────────────────

export interface ElementProgressState {
  globalId: string;
  status: ElementStatus;
  progress: number;
  expressId?: number;
}

export type ProgressStateMap = Map<string, ElementProgressState>;

// ─── Apply Progress Colors to Model ───────────────────────────────────────────

export function applyProgressColorsToModel(
  model: THREE.Object3D,
  stateMap: ProgressStateMap,
  selectedGlobalId: string | null,
  selectedMaterial: THREE.Material
): void {
  model.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const globalId = extractGlobalId(mesh);
    const progressState = globalId ? stateMap.get(globalId) : null;

    if (globalId && globalId === selectedGlobalId) {
      mesh.material = selectedMaterial;
      return;
    }

    if (progressState) {
      mesh.material = getProgressMaterial(progressState.status);
    } else {
      mesh.material = getProgressMaterial('no_iniciado');
    }
  });
}

export function applyProgressColorToElement(
  mesh: THREE.Mesh,
  status: ElementStatus,
  isSelected: boolean = false,
  selectedMaterial?: THREE.Material
): void {
  if (isSelected && selectedMaterial) {
    mesh.material = selectedMaterial;
  } else {
    mesh.material = getProgressMaterial(status);
  }
}

// ─── Highlight Executed Elements ───────────────────────────────────────────────

export function highlightExecutedElements(
  model: THREE.Object3D,
  executedGlobalIds: Set<string>
): void {
  model.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const globalId = extractGlobalId(mesh);
    if (globalId && executedGlobalIds.has(globalId)) {
      mesh.material = getProgressMaterial('ejecutado');
    }
  });
}

// ─── Progress Bar Visual Feedback ─────────────────────────────────────────────

export function getProgressGradientColor(progress: number): string {
  if (progress === 0) return PROGRESS_COLORS.no_iniciado.hex;
  if (progress < 50) return PROGRESS_COLORS.en_progreso.hex;
  if (progress < 100) return PROGRESS_COLORS.en_progreso.hex;
  return PROGRESS_COLORS.ejecutado.hex;
}

// ─── Batch Element Highlighting ───────────────────────────────────────────────

export interface HighlightBatch {
  status: ElementStatus;
  globalIds: string[];
}

export function applyBatchHighlights(
  model: THREE.Object3D,
  batches: HighlightBatch[],
  defaultStatus: ElementStatus = 'no_iniciado'
): void {
  const statusGlobalIds = new Map<ElementStatus, Set<string>>();
  
  for (const batch of batches) {
    statusGlobalIds.set(batch.status, new Set(batch.globalIds));
  }

  model.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const globalId = extractGlobalId(mesh);
    if (!globalId) {
      mesh.material = getProgressMaterial(defaultStatus);
      return;
    }

    for (const [status, ids] of statusGlobalIds) {
      if (ids.has(globalId)) {
        mesh.material = getProgressMaterial(status);
        return;
      }
    }

    mesh.material = getProgressMaterial(defaultStatus);
  });
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function extractGlobalId(mesh: THREE.Mesh): string | null {
  return (
    mesh.userData?.GlobalId ||
    mesh.userData?.globalId ||
    mesh.userData?.expressID?.toString() ||
    mesh.name ||
    null
  );
}

// ─── Dispose ───────────────────────────────────────────────────────────────────

export function disposeProgressMaterials(): void {
  progressMaterialsCache.forEach((mat) => mat.dispose());
  progressMaterialsCache.clear();
  transparentMaterialsCache.forEach((mat) => mat.dispose());
  transparentMaterialsCache.clear();
}

// ─── Transition Animation ─────────────────────────────────────────────────────

export interface ColorTransition {
  startColor: THREE.Color;
  endColor: THREE.Color;
  startEmissive: THREE.Color;
  endEmissive: THREE.Color;
  startEmissiveIntensity: number;
  endEmissiveIntensity: number;
}

export function createColorTransition(
  fromStatus: ElementStatus,
  toStatus: ElementStatus
): ColorTransition {
  const from = PROGRESS_COLORS[fromStatus];
  const to = PROGRESS_COLORS[toStatus];

  return {
    startColor: new THREE.Color(from.color),
    endColor: new THREE.Color(to.color),
    startEmissive: new THREE.Color(from.emissive),
    endEmissive: new THREE.Color(to.emissive),
    startEmissiveIntensity: from.emissiveIntensity,
    endEmissiveIntensity: to.emissiveIntensity,
  };
}

export function interpolateTransition(
  material: THREE.MeshStandardMaterial,
  transition: ColorTransition,
  progress: number
): void {
  material.color.lerpColors(
    transition.startColor,
    transition.endColor,
    progress
  );
  material.emissive.lerpColors(
    transition.startEmissive,
    transition.endEmissive,
    progress
  );
  material.emissiveIntensity = THREE.MathUtils.lerp(
    transition.startEmissiveIntensity,
    transition.endEmissiveIntensity,
    progress
  );
}
