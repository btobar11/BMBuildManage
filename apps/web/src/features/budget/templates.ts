import type { Budget, LineItem } from './types';
import { nanoid } from './utils';
import { newStage, newLineItem } from './helpers';

// ─── Built-in templates ────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  stages: Array<{ name: string; items: Array<Omit<LineItem, 'id' | 'total'>> }>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'bath',
    name: '🚿 Remodelación Baño',
    stages: [
      {
        name: 'Demolición',
        items: [
          { name: 'Demolición cerámica', quantity: 12, unit: 'm2', unit_price: 15000, cost_code: 'DEM-01' },
          { name: 'Retiro de escombros', quantity: 1, unit: 'viaje', unit_price: 80000, cost_code: 'DEM-02' },
        ],
      },
      {
        name: 'Instalaciones',
        items: [
          { name: 'Gasfitería baño completo', quantity: 1, unit: 'gl', unit_price: 350000, cost_code: 'INS-01' },
          { name: 'Instalación eléctrica', quantity: 1, unit: 'gl', unit_price: 150000, cost_code: 'INS-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Enchape muro cerámico', quantity: 18, unit: 'm2', unit_price: 22000, cost_code: 'TER-01' },
          { name: 'Enchape piso', quantity: 5, unit: 'm2', unit_price: 20000, cost_code: 'TER-02' },
          { name: 'Instalación sanitarios', quantity: 1, unit: 'gl', unit_price: 200000, cost_code: 'TER-03' },
        ],
      },
    ],
  },
  {
    id: 'house80',
    name: '🏠 Construcción Casa 80m²',
    stages: [
      {
        name: 'Fundaciones',
        items: [
          { name: 'Excavación', quantity: 80, unit: 'm2', unit_price: 12000, cost_code: 'FUN-01' },
          { name: 'Hormigón radier', quantity: 80, unit: 'm2', unit_price: 45000, cost_code: 'FUN-02' },
        ],
      },
      {
        name: 'Estructura',
        items: [
          { name: 'Muro tabiquería', quantity: 120, unit: 'm2', unit_price: 35000, cost_code: 'EST-01' },
          { name: 'Cubierta techo', quantity: 90, unit: 'm2', unit_price: 28000, cost_code: 'EST-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Piso flotante', quantity: 60, unit: 'm2', unit_price: 18000, cost_code: 'TER-01' },
          { name: 'Pintura interior', quantity: 200, unit: 'm2', unit_price: 8000, cost_code: 'TER-02' },
        ],
      },
    ],
  },
  {
    id: 'room',
    name: '🛏️ Ampliación Dormitorio',
    stages: [
      {
        name: 'Estructura',
        items: [
          { name: 'Muro nuevo', quantity: 30, unit: 'm2', unit_price: 35000, cost_code: 'EST-01' },
          { name: 'Losa o cubierta', quantity: 15, unit: 'm2', unit_price: 55000, cost_code: 'EST-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Ventana aluminio', quantity: 2, unit: 'un', unit_price: 120000, cost_code: 'TER-01' },
          { name: 'Piso flotante', quantity: 15, unit: 'm2', unit_price: 18000, cost_code: 'TER-02' },
          { name: 'Pintura', quantity: 60, unit: 'm2', unit_price: 8000, cost_code: 'TER-03' },
        ],
      },
    ],
  },
  {
    id: 'kitchen',
    name: '🍳 Cocina Integral',
    stages: [
      {
        name: 'Demolición',
        items: [
          { name: 'Retiro muebles viejos', quantity: 1, unit: 'gl', unit_price: 60000, cost_code: 'DEM-01' },
        ],
      },
      {
        name: 'Instalaciones',
        items: [
          { name: 'Gasfitería cocina', quantity: 1, unit: 'gl', unit_price: 180000, cost_code: 'INS-01' },
          { name: 'Instalación eléctrica', quantity: 1, unit: 'gl', unit_price: 120000, cost_code: 'INS-02' },
        ],
      },
      {
        name: 'Muebles y Terminaciones',
        items: [
          { name: 'Muebles bajos cocina', quantity: 4, unit: 'ml', unit_price: 185000, cost_code: 'TER-01' },
          { name: 'Muebles altos cocina', quantity: 3, unit: 'ml', unit_price: 155000, cost_code: 'TER-02' },
          { name: 'Mesón cuarzo', quantity: 3, unit: 'ml', unit_price: 220000, cost_code: 'TER-03' },
          { name: 'Enchape muros', quantity: 10, unit: 'm2', unit_price: 22000, cost_code: 'TER-04' },
        ],
      },
    ],
  },
];

export function applyTemplate(template: Template): Budget['stages'] {
  return template.stages.map((s) => {
    const stage = newStage(s.name);
    stage.items = s.items.map((i) => ({
      ...newLineItem(),
      ...i,
      id: nanoid(),
      total: (i.quantity || 0) * (i.unit_price || 0),
    }));
    return stage;
  });
}
