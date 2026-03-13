import type { Budget, Stage, LineItem } from './types';
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
          { name: 'Demolición cerámica', quantity: 12, unit: 'm2', unitPrice: 15000, costCode: 'DEM-01' },
          { name: 'Retiro de escombros', quantity: 1, unit: 'viaje', unitPrice: 80000, costCode: 'DEM-02' },
        ],
      },
      {
        name: 'Instalaciones',
        items: [
          { name: 'Gasfitería baño completo', quantity: 1, unit: 'gl', unitPrice: 350000, costCode: 'INS-01' },
          { name: 'Instalación eléctrica', quantity: 1, unit: 'gl', unitPrice: 150000, costCode: 'INS-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Enchape muro cerámico', quantity: 18, unit: 'm2', unitPrice: 22000, costCode: 'TER-01' },
          { name: 'Enchape piso', quantity: 5, unit: 'm2', unitPrice: 20000, costCode: 'TER-02' },
          { name: 'Instalación sanitarios', quantity: 1, unit: 'gl', unitPrice: 200000, costCode: 'TER-03' },
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
          { name: 'Excavación', quantity: 80, unit: 'm2', unitPrice: 12000, costCode: 'FUN-01' },
          { name: 'Hormigón radier', quantity: 80, unit: 'm2', unitPrice: 45000, costCode: 'FUN-02' },
        ],
      },
      {
        name: 'Estructura',
        items: [
          { name: 'Muro tabiquería', quantity: 120, unit: 'm2', unitPrice: 35000, costCode: 'EST-01' },
          { name: 'Cubierta techo', quantity: 90, unit: 'm2', unitPrice: 28000, costCode: 'EST-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Piso flotante', quantity: 60, unit: 'm2', unitPrice: 18000, costCode: 'TER-01' },
          { name: 'Pintura interior', quantity: 200, unit: 'm2', unitPrice: 8000, costCode: 'TER-02' },
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
          { name: 'Muro nuevo', quantity: 30, unit: 'm2', unitPrice: 35000, costCode: 'EST-01' },
          { name: 'Losa o cubierta', quantity: 15, unit: 'm2', unitPrice: 55000, costCode: 'EST-02' },
        ],
      },
      {
        name: 'Terminaciones',
        items: [
          { name: 'Ventana aluminio', quantity: 2, unit: 'un', unitPrice: 120000, costCode: 'TER-01' },
          { name: 'Piso flotante', quantity: 15, unit: 'm2', unitPrice: 18000, costCode: 'TER-02' },
          { name: 'Pintura', quantity: 60, unit: 'm2', unitPrice: 8000, costCode: 'TER-03' },
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
          { name: 'Retiro muebles viejos', quantity: 1, unit: 'gl', unitPrice: 60000, costCode: 'DEM-01' },
        ],
      },
      {
        name: 'Instalaciones',
        items: [
          { name: 'Gasfitería cocina', quantity: 1, unit: 'gl', unitPrice: 180000, costCode: 'INS-01' },
          { name: 'Instalación eléctrica', quantity: 1, unit: 'gl', unitPrice: 120000, costCode: 'INS-02' },
        ],
      },
      {
        name: 'Muebles y Terminaciones',
        items: [
          { name: 'Muebles bajos cocina', quantity: 4, unit: 'ml', unitPrice: 185000, costCode: 'TER-01' },
          { name: 'Muebles altos cocina', quantity: 3, unit: 'ml', unitPrice: 155000, costCode: 'TER-02' },
          { name: 'Mesón cuarzo', quantity: 3, unit: 'ml', unitPrice: 220000, costCode: 'TER-03' },
          { name: 'Enchape muros', quantity: 10, unit: 'm2', unitPrice: 22000, costCode: 'TER-04' },
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
      total: i.quantity * i.unitPrice,
    }));
    return stage;
  });
}
