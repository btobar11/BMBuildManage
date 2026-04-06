export interface ProjectTemplate {
  id: string;
  name: string;
  category: 'residential' | 'commercial' | 'industrial' | 'remodel';
  description: string;
  defaultStages: string[];
  defaultMarkupByType: Record<string, number>;
  professionalFeePercentage: number;
  estimatedUtilityPercentage: number;
  targetMargin: number;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'casa-playa',
    name: 'Casa de Playa / Residencial',
    category: 'residential',
    description: 'Vivienda unifamiliar, casa de campo, chalet',
    defaultStages: [
      'Fundaciones',
      'Estructura',
      'Muros',
      'Techumbre',
      'Instalaciones',
      'Terminaciones',
    ],
    defaultMarkupByType: { material: 20, labor: 35, machinery: 25, subcontract: 15 },
    professionalFeePercentage: 10,
    estimatedUtilityPercentage: 20,
    targetMargin: 28,
  },
  {
    id: 'costo-edificio',
    name: 'Edificio / Torre',
    category: 'commercial',
    description: 'Edificio de departamentos u oficinas',
    defaultStages: [
      'Fundaciones',
      'Estructura',
      'Muros Exterior',
      'Muros Interior',
      'Ascensores',
      'Instalaciones',
      'Terminaciones',
    ],
    defaultMarkupByType: { material: 18, labor: 30, machinery: 22, subcontract: 12 },
    professionalFeePercentage: 12,
    estimatedUtilityPercentage: 18,
    targetMargin: 25,
  },
  {
    id: 'oficina',
    name: 'Oficina / Local Comercial',
    category: 'commercial',
    description: 'Remodelación o construcción de oficina',
    defaultStages: [
      'Demolición',
      'Muros y Tabiquería',
      'Instalaciones Eléctricas',
      'Instalaciones Sanitarias',
      'Aire Acondicionado',
      'Terminaciones',
      'Equipamiento',
    ],
    defaultMarkupByType: { material: 22, labor: 32, machinery: 20, subcontract: 18 },
    professionalFeePercentage: 10,
    estimatedUtilityPercentage: 22,
    targetMargin: 30,
  },
  {
    id: 'nave-industrial',
    name: 'Nave Industrial',
    category: 'industrial',
    description: 'Bodega, fábrica, planta',
    defaultStages: [
      'Fundaciones',
      'Estructura Metálica',
      'Muro Cortina',
      'Techumbre',
      'Puertas y Portones',
      'Instalaciones',
    ],
    defaultMarkupByType: { material: 15, labor: 25, machinery: 18, subcontract: 10 },
    professionalFeePercentage: 8,
    estimatedUtilityPercentage: 15,
    targetMargin: 20,
  },
  {
    id: 'remodelacion',
    name: 'Remodelación / Ampliación',
    category: 'remodel',
    description: 'Remodelación o ampliación existente',
    defaultStages: [
      'Demolición',
      'Obra Gruesa',
      'Instalaciones',
      'Terminaciones',
    ],
    defaultMarkupByType: { material: 25, labor: 40, machinery: 30, subcontract: 20 },
    professionalFeePercentage: 15,
    estimatedUtilityPercentage: 25,
    targetMargin: 35,
  },
  {
    id: 'piscina',
    name: 'Piscina y Áreas Exterior',
    category: 'residential',
    description: 'Piscina, quincho,jardín',
    defaultStages: [
      'Excavación',
      'Estructura Piscina',
      'Sistema Hidráulico',
      'Terminaciones Piscina',
      'Área de Quincho',
      'Jardinería',
    ],
    defaultMarkupByType: { material: 20, labor: 35, machinery: 28, subcontract: 18 },
    professionalFeePercentage: 12,
    estimatedUtilityPercentage: 20,
    targetMargin: 28,
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  if (!category) return PROJECT_TEMPLATES;
  return PROJECT_TEMPLATES.filter(t => t.category === category);
}

export function applyProjectTemplate(template: ProjectTemplate): {
  professionalFeePercentage: number;
  estimatedUtility: number;
  targetMargin: number;
  markupByType: Record<string, number>;
} {
  return {
    professionalFeePercentage: template.professionalFeePercentage,
    estimatedUtility: template.estimatedUtilityPercentage,
    targetMargin: template.targetMargin,
    markupByType: template.defaultMarkupByType,
  };
}

export const CATEGORY_LABELS: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  remodel: 'Remodelación',
};
