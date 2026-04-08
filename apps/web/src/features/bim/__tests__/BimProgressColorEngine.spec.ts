/**
 * BimProgressColorEngine Unit Tests
 * Tests the 4D progress state visual engine (No Iniciado → En Progreso → Ejecutado → Verificado)
 */

import * as THREE from 'three';
import {
  PROGRESS_COLORS,
  getProgressMaterial,
  getStatusColor,
  getStatusEmissive,
  getProgressGradientColor,
  applyProgressColorsToModel,
  applyProgressColorToElement,
  highlightExecutedElements,
  applyBatchHighlights,
  createColorTransition,
  interpolateTransition,
  disposeProgressMaterials,
  type ElementProgressState,
  type ProgressStateMap,
  type HighlightBatch,
} from '../BimProgressColorEngine';
import type { ElementStatus } from '../types-bim5d';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeMeshWithId(globalId?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshStandardMaterial(),
  );
  if (globalId) mesh.userData.GlobalId = globalId;
  return mesh;
}

function makeProgressMap(entries: [string, ElementStatus, number][]): ProgressStateMap {
  const map = new Map<string, ElementProgressState>();
  entries.forEach(([globalId, status, progress]) => {
    map.set(globalId, { globalId, status, progress });
  });
  return map;
}

// ─── PROGRESS_COLORS ──────────────────────────────────────────────────────────

describe('PROGRESS_COLORS', () => {
  const statuses: ElementStatus[] = ['no_iniciado', 'en_progreso', 'ejecutado', 'verificado'];

  it('defines all four construction statuses', () => {
    statuses.forEach((s) => expect(PROGRESS_COLORS[s]).toBeDefined());
  });

  it('all statuses have a valid hex colour', () => {
    statuses.forEach((s) => {
      expect(PROGRESS_COLORS[s].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('all statuses have an opacity in [0, 1]', () => {
    statuses.forEach((s) => {
      expect(PROGRESS_COLORS[s].opacity).toBeGreaterThan(0);
      expect(PROGRESS_COLORS[s].opacity).toBeLessThanOrEqual(1);
    });
  });

  it('no_iniciado has zero emissive intensity (no glow for unstarted)', () => {
    expect(PROGRESS_COLORS.no_iniciado.emissiveIntensity).toBe(0);
  });

  it('ejecutado (Emerald Green) uses correct hex #10B981', () => {
    expect(PROGRESS_COLORS.ejecutado.hex).toBe('#10B981');
  });

  it('verificado has highest emissive intensity (most complete)', () => {
    const intensities = ['no_iniciado', 'en_progreso', 'ejecutado', 'verificado'].map(
      (s) => PROGRESS_COLORS[s as ElementStatus].emissiveIntensity,
    );
    expect(intensities[3]).toBeGreaterThanOrEqual(intensities[2]);
  });
});

// ─── getProgressMaterial ──────────────────────────────────────────────────────

describe('getProgressMaterial', () => {
  beforeEach(() => disposeProgressMaterials());

  it('returns MeshStandardMaterial for each status', () => {
    (['no_iniciado', 'en_progreso', 'ejecutado', 'verificado'] as ElementStatus[]).forEach((s) => {
      expect(getProgressMaterial(s)).toBeInstanceOf(THREE.MeshStandardMaterial);
    });
  });

  it('caches and returns same instance on repeated calls', () => {
    const a = getProgressMaterial('ejecutado');
    const b = getProgressMaterial('ejecutado');
    expect(a).toBe(b);
  });

  it('transparent mode returns a different cached instance', () => {
    const opaque = getProgressMaterial('ejecutado', false);
    const transparent = getProgressMaterial('ejecutado', true);
    expect(opaque).not.toBe(transparent);
  });

  it('transparent material has transparent flag set', () => {
    const mat = getProgressMaterial('ejecutado', true);
    expect(mat.transparent).toBe(true);
  });

  it('materials use DoubleSide to show interior faces', () => {
    (['no_iniciado', 'en_progreso', 'ejecutado', 'verificado'] as ElementStatus[]).forEach((s) => {
      const mat = getProgressMaterial(s);
      expect(mat.side).toBe(THREE.DoubleSide);
    });
  });
});

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns correct hex string for each status', () => {
    expect(getStatusColor('no_iniciado')).toBe(PROGRESS_COLORS.no_iniciado.hex);
    expect(getStatusColor('en_progreso')).toBe(PROGRESS_COLORS.en_progreso.hex);
    expect(getStatusColor('ejecutado')).toBe(PROGRESS_COLORS.ejecutado.hex);
    expect(getStatusColor('verificado')).toBe(PROGRESS_COLORS.verificado.hex);
  });

  it('falls back to slate grey for unknown status', () => {
    const color = getStatusColor('unknown_status' as ElementStatus);
    expect(color).toBe('#64748B');
  });
});

// ─── getStatusEmissive ────────────────────────────────────────────────────────

describe('getStatusEmissive', () => {
  it('returns numeric hex color for each status', () => {
    (['no_iniciado', 'en_progreso', 'ejecutado', 'verificado'] as ElementStatus[]).forEach((s) => {
      expect(typeof getStatusEmissive(s)).toBe('number');
    });
  });

  it('returns 0x000000 for unknown status', () => {
    expect(getStatusEmissive('bad' as ElementStatus)).toBe(0x000000);
  });
});

// ─── getProgressGradientColor ─────────────────────────────────────────────────

describe('getProgressGradientColor', () => {
  it('returns no_iniciado color at 0%', () => {
    expect(getProgressGradientColor(0)).toBe(PROGRESS_COLORS.no_iniciado.hex);
  });

  it('returns en_progreso color at 1–49%', () => {
    [1, 25, 49].forEach((p) => {
      expect(getProgressGradientColor(p)).toBe(PROGRESS_COLORS.en_progreso.hex);
    });
  });

  it('returns en_progreso color at 50–99%', () => {
    [50, 75, 99].forEach((p) => {
      expect(getProgressGradientColor(p)).toBe(PROGRESS_COLORS.en_progreso.hex);
    });
  });

  it('returns ejecutado color at 100%', () => {
    expect(getProgressGradientColor(100)).toBe(PROGRESS_COLORS.ejecutado.hex);
  });
});

// ─── applyProgressColorsToModel ───────────────────────────────────────────────

describe('applyProgressColorsToModel', () => {
  beforeEach(() => disposeProgressMaterials());

  it('applies no_iniciado to mesh without state entry', () => {
    const model = new THREE.Group();
    const mesh = makeMeshWithId('G-UNKNOWN');
    model.add(mesh);

    applyProgressColorsToModel(model, new Map(), null, new THREE.MeshStandardMaterial());

    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.color.getHex()).toBe(PROGRESS_COLORS.no_iniciado.color);
  });

  it('applies correct color based on state map entry', () => {
    const model = new THREE.Group();
    const mesh = makeMeshWithId('G-EXEC');
    model.add(mesh);

    const stateMap = makeProgressMap([['G-EXEC', 'ejecutado', 100]]);
    applyProgressColorsToModel(model, stateMap, null, new THREE.MeshStandardMaterial());

    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.color.getHex()).toBe(PROGRESS_COLORS.ejecutado.color);
  });

  it('applies selectedMaterial when mesh matches selectedGlobalId', () => {
    const model = new THREE.Group();
    const mesh = makeMeshWithId('G-SEL');
    model.add(mesh);

    const selectedMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    applyProgressColorsToModel(model, new Map(), 'G-SEL', selectedMat);

    expect(mesh.material).toBe(selectedMat);
  });

  it('selected state takes priority over state map', () => {
    const model = new THREE.Group();
    const mesh = makeMeshWithId('G-BOTH');
    model.add(mesh);

    const stateMap = makeProgressMap([['G-BOTH', 'ejecutado', 100]]);
    const selectedMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    applyProgressColorsToModel(model, stateMap, 'G-BOTH', selectedMat);
    expect(mesh.material).toBe(selectedMat);
  });
});

// ─── applyProgressColorToElement ──────────────────────────────────────────────

describe('applyProgressColorToElement', () => {
  beforeEach(() => disposeProgressMaterials());

  it('applies progress material when not selected', () => {
    const mesh = makeMeshWithId('M1');
    applyProgressColorToElement(mesh, 'en_progreso', false);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.color.getHex()).toBe(PROGRESS_COLORS.en_progreso.color);
  });

  it('applies selectedMaterial when isSelected = true', () => {
    const mesh = makeMeshWithId('M2');
    const selMat = new THREE.MeshBasicMaterial({ color: 0xaabbcc });

    applyProgressColorToElement(mesh, 'ejecutado', true, selMat);
    expect(mesh.material).toBe(selMat);
  });
});

// ─── highlightExecutedElements ────────────────────────────────────────────────

describe('highlightExecutedElements', () => {
  beforeEach(() => disposeProgressMaterials());

  it('highlights only elements in the executedGlobalIds set', () => {
    const model = new THREE.Group();
    const exec = makeMeshWithId('EXEC-01');
    const pending = makeMeshWithId('PEND-01');
    model.add(exec);
    model.add(pending);

    highlightExecutedElements(model, new Set(['EXEC-01']));

    const execMat = exec.material as THREE.MeshStandardMaterial;
    expect(execMat.color.getHex()).toBe(PROGRESS_COLORS.ejecutado.color);
  });

  it('skips meshes not in the executedGlobalIds set', () => {
    const model = new THREE.Group();
    const originalMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), originalMat);
    mesh.userData.GlobalId = 'NOT-EXEC';
    model.add(mesh);

    highlightExecutedElements(model, new Set(['EXEC-01']));
    // Material shouldn't have changed
    expect(mesh.material).toBe(originalMat);
  });
});

// ─── applyBatchHighlights ─────────────────────────────────────────────────────

describe('applyBatchHighlights', () => {
  beforeEach(() => disposeProgressMaterials());

  it('applies correct status color per batch group', () => {
    const model = new THREE.Group();
    const m1 = makeMeshWithId('A');
    const m2 = makeMeshWithId('B');
    const m3 = makeMeshWithId('C');
    model.add(m1, m2, m3);

    const batches: HighlightBatch[] = [
      { status: 'ejecutado', globalIds: ['A', 'B'] },
      { status: 'en_progreso', globalIds: ['C'] },
    ];

    applyBatchHighlights(model, batches);

    expect((m1.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(PROGRESS_COLORS.ejecutado.color);
    expect((m2.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(PROGRESS_COLORS.ejecutado.color);
    expect((m3.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(PROGRESS_COLORS.en_progreso.color);
  });

  it('applies defaultStatus to meshes not in any batch', () => {
    const model = new THREE.Group();
    const mesh = makeMeshWithId('NO-BATCH');
    model.add(mesh);

    applyBatchHighlights(model, [], 'verificado');

    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.color.getHex()).toBe(PROGRESS_COLORS.verificado.color);
  });
});

// ─── createColorTransition ────────────────────────────────────────────────────

describe('createColorTransition', () => {
  it('creates a transition with correct start and end colors', () => {
    const transition = createColorTransition('no_iniciado', 'ejecutado');

    const expectedStart = new THREE.Color(PROGRESS_COLORS.no_iniciado.color);
    const expectedEnd = new THREE.Color(PROGRESS_COLORS.ejecutado.color);

    expect(transition.startColor.r).toBeCloseTo(expectedStart.r, 3);
    expect(transition.endColor.r).toBeCloseTo(expectedEnd.r, 3);
  });

  it('transition from same state to same state has identical start/end colors', () => {
    const t = createColorTransition('ejecutado', 'ejecutado');
    expect(t.startColor.getHex()).toBe(t.endColor.getHex());
  });
});

// ─── interpolateTransition ────────────────────────────────────────────────────

describe('interpolateTransition', () => {
  it('at progress=0, material matches start state', () => {
    const mat = new THREE.MeshStandardMaterial();
    const transition = createColorTransition('no_iniciado', 'ejecutado');
    interpolateTransition(mat, transition, 0);

    const startColor = new THREE.Color(PROGRESS_COLORS.no_iniciado.color);
    expect(mat.color.r).toBeCloseTo(startColor.r, 3);
  });

  it('at progress=1, material matches end state', () => {
    const mat = new THREE.MeshStandardMaterial();
    const transition = createColorTransition('no_iniciado', 'ejecutado');
    interpolateTransition(mat, transition, 1);

    const endColor = new THREE.Color(PROGRESS_COLORS.ejecutado.color);
    expect(mat.color.r).toBeCloseTo(endColor.r, 3);
  });

  it('at progress=0.5, emissiveIntensity is the midpoint', () => {
    const mat = new THREE.MeshStandardMaterial();
    const transition = createColorTransition('en_progreso', 'verificado');
    interpolateTransition(mat, transition, 0.5);

    const expected =
      (PROGRESS_COLORS.en_progreso.emissiveIntensity + PROGRESS_COLORS.verificado.emissiveIntensity) / 2;
    expect(mat.emissiveIntensity).toBeCloseTo(expected, 5);
  });
});
