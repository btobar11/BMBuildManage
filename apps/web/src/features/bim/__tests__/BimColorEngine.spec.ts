/**
 * BimColorEngine Unit Tests
 * Tests the classification and Three.js material engine for BIM 5D coloring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  classifyElements,
  getLinkedGlobalIds,
  getClassificationStats,
  getMaterial,
  applyColorsToModel,
  disposeMaterials,
  BIM_COLORS,
  type BimElementState,
} from '../BimColorEngine';
import type { LineItem, Stage } from '../../budget/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'stage-1',
    name: 'Etapa 1',
    progress: 0,
    items: [],
    ...overrides,
  };
}

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'item-1',
    name: 'Hormigón H30',
    unit: 'm³',
    quantity: 10,
    unit_price: 60000,
    ...overrides,
  };
}

function makeMesh(globalId?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  if (globalId) {
    mesh.userData.GlobalId = globalId;
  }
  return mesh;
}

// ─── classifyElements ─────────────────────────────────────────────────────────

describe('classifyElements', () => {
  it('returns empty map when no stages', () => {
    const result = classifyElements([]);
    expect(result.size).toBe(0);
  });

  it('returns empty map when no items have ifc_global_id', () => {
    const stage = makeStage({ items: [makeItem({ ifc_global_id: undefined })] });
    const result = classifyElements([stage]);
    expect(result.size).toBe(0);
  });

  it('classifies an item with quantity > 0 as CUBICATED', () => {
    const stage = makeStage({
      items: [makeItem({ ifc_global_id: 'GUID-001', quantity: 10 })],
    });
    const result = classifyElements([stage]);
    expect(result.get('GUID-001')?.state).toBe('CUBICATED');
  });

  it('classifies an item with quantity === 0 as PENDING', () => {
    const stage = makeStage({
      items: [makeItem({ ifc_global_id: 'GUID-002', quantity: 0 })],
    });
    const result = classifyElements([stage]);
    expect(result.get('GUID-002')?.state).toBe('PENDING');
  });

  it('classifies an item with null quantity as PENDING', () => {
    const stage = makeStage({
      items: [makeItem({ ifc_global_id: 'GUID-003', quantity: 0 })],
    });
    const result = classifyElements([stage]);
    expect(result.get('GUID-003')?.state).toBe('PENDING');
  });

  it('stores item metadata correctly on classification', () => {
    const stage = makeStage({
      id: 'stage-abc',
      name: 'Structural',
      items: [makeItem({ ifc_global_id: 'GUID-010', name: 'Viga HEB', quantity: 5 })],
    });
    const result = classifyElements([stage]);
    const entry = result.get('GUID-010');
    expect(entry?.itemName).toBe('Viga HEB');
    expect(entry?.stageId).toBe('stage-abc');
    expect(entry?.stageName).toBe('Structural');
    expect(entry?.quantity).toBe(5);
  });

  it('handles multiple stages and multiple items', () => {
    const stages = [
      makeStage({
        id: 'stage-1',
        items: [
          makeItem({ ifc_global_id: 'G001', quantity: 5 }),
          makeItem({ ifc_global_id: 'G002', quantity: 0 }),
        ],
      }),
      makeStage({
        id: 'stage-2',
        items: [
          makeItem({ ifc_global_id: 'G003', quantity: 1 }),
        ],
      }),
    ];
    const result = classifyElements(stages);
    expect(result.size).toBe(3);
    expect(result.get('G001')?.state).toBe('CUBICATED');
    expect(result.get('G002')?.state).toBe('PENDING');
    expect(result.get('G003')?.state).toBe('CUBICATED');
  });

  it('last stage wins for duplicate GlobalIds', () => {
    const stages = [
      makeStage({ items: [makeItem({ ifc_global_id: 'DUP', quantity: 0 })] }),
      makeStage({ items: [makeItem({ ifc_global_id: 'DUP', quantity: 10 })] }),
    ];
    const result = classifyElements(stages);
    // Last stage overwrites
    expect(result.get('DUP')?.state).toBe('CUBICATED');
  });
});

// ─── getLinkedGlobalIds ────────────────────────────────────────────────────────

describe('getLinkedGlobalIds', () => {
  it('returns empty set for empty stages', () => {
    expect(getLinkedGlobalIds([])).toEqual(new Set());
  });

  it('returns only items with ifc_global_id', () => {
    const stage = makeStage({
      items: [
        makeItem({ ifc_global_id: 'G001' }),
        makeItem({ ifc_global_id: undefined }),
        makeItem({ ifc_global_id: 'G002' }),
      ],
    });
    const ids = getLinkedGlobalIds([stage]);
    expect(ids).toEqual(new Set(['G001', 'G002']));
  });

  it('deduplicates GlobalIds across stages', () => {
    const stages = [
      makeStage({ items: [makeItem({ ifc_global_id: 'SHARED' })] }),
      makeStage({ items: [makeItem({ ifc_global_id: 'SHARED' })] }),
    ];
    const ids = getLinkedGlobalIds(stages);
    expect(ids.size).toBe(1);
  });
});

// ─── getClassificationStats ────────────────────────────────────────────────────

describe('getClassificationStats', () => {
  it('returns zero stats for empty classification', () => {
    const stats = getClassificationStats(new Map(), 0);
    expect(stats).toEqual({ cubicated: 0, pending: 0, total: 0, percentage: 0 });
  });

  it('calculates percentage correctly', () => {
    const map = new Map<string, any>([
      ['G1', { state: 'CUBICATED' }],
      ['G2', { state: 'CUBICATED' }],
      ['G3', { state: 'PENDING' }],
      ['G4', { state: 'PENDING' }],
    ]);
    const stats = getClassificationStats(map, 4);
    expect(stats.cubicated).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.percentage).toBe(50);
  });

  it('handles 100% cubicated', () => {
    const map = new Map<string, any>([
      ['G1', { state: 'CUBICATED' }],
    ]);
    const stats = getClassificationStats(map, 1);
    expect(stats.percentage).toBe(100);
  });

  it('avoids division by zero with 0 total elements', () => {
    const stats = getClassificationStats(new Map(), 0);
    expect(stats.percentage).toBe(0);
  });

  it('pending = total - cubicated even when totalElements > map.size', () => {
    const map = new Map<string, any>([
      ['G1', { state: 'CUBICATED' }],
    ]);
    const stats = getClassificationStats(map, 100);
    expect(stats.pending).toBe(99);
    expect(stats.cubicated).toBe(1);
  });
});

// ─── getMaterial ───────────────────────────────────────────────────────────────

describe('getMaterial', () => {
  beforeEach(() => {
    disposeMaterials();
  });

  const states: BimElementState[] = ['CUBICATED', 'PENDING', 'SELECTED'];

  states.forEach((state) => {
    it(`returns a MeshStandardMaterial for state: ${state}`, () => {
      const mat = getMaterial(state);
      expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it(`returns the same cached instance on repeated calls for: ${state}`, () => {
      const a = getMaterial(state);
      const b = getMaterial(state);
      expect(a).toBe(b);
    });
  });

  it('CUBICATED has opacity < 1 (semi-transparent overlay)', () => {
    const mat = getMaterial('CUBICATED');
    expect(mat.opacity).toBe(BIM_COLORS.CUBICATED.opacity);
    expect(mat.opacity).toBeLessThan(1);
  });

  it('PENDING has full opacity', () => {
    const mat = getMaterial('PENDING');
    expect(mat.opacity).toBe(1.0);
  });

  it('SELECTED has emissive glow', () => {
    const mat = getMaterial('SELECTED');
    expect(mat.emissiveIntensity).toBeGreaterThan(0);
  });

  it('CUBICATED has subtle emissive', () => {
    const mat = getMaterial('CUBICATED');
    expect(mat.emissiveIntensity).toBeGreaterThan(0);
  });
});

// ─── applyColorsToModel ────────────────────────────────────────────────────────

describe('applyColorsToModel', () => {
  beforeEach(() => {
    disposeMaterials();
  });

  it('applies PENDING material to mesh with no GlobalId', () => {
    const model = new THREE.Group();
    const mesh = makeMesh(); // no GlobalId
    model.add(mesh);

    applyColorsToModel(model, new Map(), null, false);

    expect((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(BIM_COLORS.PENDING.color);
  });

  it('applies CUBICATED material to mesh matching a cubicated GlobalId', () => {
    const model = new THREE.Group();
    const mesh = makeMesh('GUID-100');
    model.add(mesh);

    const classification = new Map([
      ['GUID-100', { globalId: 'GUID-100', state: 'CUBICATED' as BimElementState }],
    ]);

    applyColorsToModel(model, classification, null, false);

    expect((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(BIM_COLORS.CUBICATED.color);
  });

  it('applies SELECTED material when element matches selectedGlobalId', () => {
    const model = new THREE.Group();
    const mesh = makeMesh('GUID-SEL');
    model.add(mesh);

    applyColorsToModel(model, new Map(), 'GUID-SEL', false);

    expect((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(BIM_COLORS.SELECTED.color);
  });

  it('SELECTED takes priority over CUBICATED classification', () => {
    const model = new THREE.Group();
    const mesh = makeMesh('GUID-PRIO');
    model.add(mesh);

    const classification = new Map([
      ['GUID-PRIO', { globalId: 'GUID-PRIO', state: 'CUBICATED' as BimElementState }],
    ]);

    applyColorsToModel(model, classification, 'GUID-PRIO', false);

    // Should be SELECTED, not CUBICATED
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(BIM_COLORS.SELECTED.color);
  });

  it('hides CUBICATED meshes when hideCubicated = true', () => {
    const model = new THREE.Group();
    const mesh = makeMesh('GUID-HIDE');
    model.add(mesh);

    const classification = new Map([
      ['GUID-HIDE', { globalId: 'GUID-HIDE', state: 'CUBICATED' as BimElementState }],
    ]);

    applyColorsToModel(model, classification, null, true);
    expect(mesh.visible).toBe(false);
  });

  it('keeps PENDING meshes visible when hideCubicated = true', () => {
    const model = new THREE.Group();
    const mesh = makeMesh('GUID-VIS');
    model.add(mesh);

    // Not in classification = PENDING
    applyColorsToModel(model, new Map(), null, true);
    expect(mesh.visible).toBe(true);
  });

  it('processes nested groups (Three.js traverse)', () => {
    const root = new THREE.Group();
    const child = new THREE.Group();
    const mesh = makeMesh('GUID-NESTED');
    child.add(mesh);
    root.add(child);

    const classification = new Map([
      ['GUID-NESTED', { globalId: 'GUID-NESTED', state: 'CUBICATED' as BimElementState }],
    ]);

    applyColorsToModel(root, classification, null, false);

    expect((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      .toBe(BIM_COLORS.CUBICATED.color);
  });
});
