export interface CostItem {
  name: string;
  category: 'material' | 'labor' | 'machinery' | 'subcontract';
  unit: string;
  unitCost: number;
  unitPrice: number;
  description?: string;
}

export const CHILEAN_COSTS: CostItem[] = [
  // === MATERIALES DE CONSTRUCCIÓN - OBRA GRUESA ===
  { name: 'Hormón Premezclado G25', category: 'material', unit: 'm3', unitCost: 95000, unitPrice: 105000, description: 'Hormón premezclado resistencia G25' },
  { name: 'Hormón Premezclado G30', category: 'material', unit: 'm3', unitCost: 105000, unitPrice: 120000, description: 'Hormón premezclado resistencia G30' },
  { name: 'Arena Gruesa', category: 'material', unit: 'm3', unitCost: 18500, unitPrice: 22000 },
  { name: 'Arena Fina / Estuco', category: 'material', unit: 'm3', unitCost: 22000, unitPrice: 26000 },
  { name: 'Grava 3/4', category: 'material', unit: 'm3', unitCost: 19500, unitPrice: 24000 },
  { name: 'Gravilla 1/2', category: 'material', unit: 'm3', unitCost: 21000, unitPrice: 25000 },
  { name: 'Bolón Desplazador', category: 'material', unit: 'm3', unitCost: 15000, unitPrice: 18000 },
  { name: 'Agua de Obra', category: 'material', unit: 'lt', unitCost: 1500, unitPrice: 1800 },
  { name: 'Cemento Portland', category: 'material', unit: 'saco 25kg', unitCost: 8500, unitPrice: 10500 },
  { name: 'Cemento Albañilería', category: 'material', unit: 'saco 25kg', unitCost: 6500, unitPrice: 8000 },
  { name: 'Yeso', category: 'material', unit: 'saco 25kg', unitCost: 5500, unitPrice: 6800 },
  { name: 'Cal', category: 'material', unit: 'saco 25kg', unitCost: 4500, unitPrice: 5500 },
  
  // === ACERO Y FIERROS ===
  { name: 'Fierro corrugado Ø10mm', category: 'material', unit: 'kg', unitCost: 890, unitPrice: 1050 },
  { name: 'Fierro corrugado Ø12mm', category: 'material', unit: 'kg', unitCost: 870, unitPrice: 1020 },
  { name: 'Fierro corrugado Ø16mm', category: 'material', unit: 'kg', unitCost: 850, unitPrice: 1000 },
  { name: 'Malla electrosoldada 150x150x4mm', category: 'material', unit: 'm2', unitCost: 3500, unitPrice: 4200 },
  { name: 'Alambre negro #18', category: 'material', unit: 'kg', unitCost: 1200, unitPrice: 1500 },
  { name: 'Alambre recocido', category: 'material', unit: 'kg', unitCost: 1100, unitPrice: 1350 },
  { name: 'Estribos prefabricados', category: 'material', unit: 'un', unitCost: 350, unitPrice: 420 },
  
  // === MADERA ===
  { name: 'Tabla pino 2x8x3m', category: 'material', unit: 'un', unitCost: 8500, unitPrice: 10500 },
  { name: 'Tabla pino 1x8x3m', category: 'material', unit: 'un', unitCost: 5500, unitPrice: 6800 },
  { name: 'Listón pino 2x4x3m', category: 'material', unit: 'un', unitCost: 3200, unitPrice: 4000 },
  { name: 'Pie derecho pino 2x4x3m', category: 'material', unit: 'un', unitCost: 4200, unitPrice: 5200 },
  { name: 'Costanero pino 2x2x3m', category: 'material', unit: 'un', unitCost: 2500, unitPrice: 3100 },
  { name: 'Panel OSB 15mm 1.22x2.44m', category: 'material', unit: 'un', unitCost: 35000, unitPrice: 42000 },
  { name: 'Triplay pino 12mm 1.22x2.44m', category: 'material', unit: 'un', unitCost: 28000, unitPrice: 34000 },
  { name: 'Frontera pino', category: 'material', unit: 'ml', unitCost: 1800, unitPrice: 2200 },
  
  // === TECHUMBRE ===
  { name: 'Teja asfáltica', category: 'material', unit: 'm2', unitCost: 8500, unitPrice: 10500 },
  { name: 'Teja fibrocemento', category: 'material', unit: 'un', unitCost: 12000, unitPrice: 15000 },
  { name: 'Plancha zinc 0.5mm 3x1m', category: 'material', unit: 'un', unitCost: 28000, unitPrice: 34000 },
  { name: 'Plancha fibrolit 6mm 2.44x1.22m', category: 'material', unit: 'un', unitCost: 18000, unitPrice: 22000 },
  { name: ' Lana de vidrio 50mm', category: 'material', unit: 'm2', unitCost: 2500, unitPrice: 3100 },
  { name: 'Bajadas pluviales PVC 110mm', category: 'material', unit: 'ml', unitCost: 4500, unitPrice: 5500 },
  
  // === TERMINACIONES - PAVIMENTOS ===
  { name: 'Porcelanato 60x60', category: 'material', unit: 'm2', unitCost: 14500, unitPrice: 18000 },
  { name: 'Cerámica piso 30x30', category: 'material', unit: 'm2', unitCost: 8500, unitPrice: 10500 },
  { name: 'Cerámica piso 40x40', category: 'material', unit: 'm2', unitCost: 9500, unitPrice: 12000 },
  { name: 'Cerámica baño 30x30', category: 'material', unit: 'm2', unitCost: 7800, unitPrice: 9500 },
  { name: 'Piso flotante 8mm', category: 'material', unit: 'm2', unitCost: 12500, unitPrice: 15500 },
  { name: 'Piso vinílico', category: 'material', unit: 'm2', unitCost: 15000, unitPrice: 18500 },
  { name: 'Granito nacional', category: 'material', unit: 'm2', unitCost: 35000, unitPrice: 45000 },
  { name: 'Mármol importado', category: 'material', unit: 'm2', unitCost: 65000, unitPrice: 80000 },
  
  // === TERMINACIONES - MUROS ===
  { name: 'Cerámica mural 20x30', category: 'material', unit: 'm2', unitCost: 6800, unitPrice: 8500 },
  { name: 'Cerámica mural 25x35', category: 'material', unit: 'm2', unitCost: 7500, unitPrice: 9200 },
  { name: ' papel mural vinilico', category: 'material', unit: 'm2', unitCost: 5500, unitPrice: 6800 },
  { name: 'Pintura látex interior', category: 'material', unit: 'galón', unitCost: 12000, unitPrice: 15000 },
  { name: 'Pintura látex exterior', category: 'material', unit: 'galón', unitCost: 15000, unitPrice: 18500 },
  { name: 'Pintura aceite', category: 'material', unit: 'galón', unitCost: 18000, unitPrice: 22000 },
  { name: 'Esmalte sintético', category: 'material', unit: 'galón', unitCost: 22000, unitPrice: 27000 },
  { name: 'Sellador acuoso', category: 'material', unit: 'galón', unitCost: 8500, unitPrice: 10500 },
  { name: 'Imprimante', category: 'material', unit: 'galón', unitCost: 9500, unitPrice: 12000 },
  { name: 'Estuco interior 25kg', category: 'material', unit: 'saco', unitCost: 6500, unitPrice: 8000 },
  { name: 'Estuco exterior 25kg', category: 'material', unit: 'saco', unitCost: 8500, unitPrice: 10500 },
  { name: 'Plancha de yeso 12.5mm 1.22x2.44m', category: 'material', unit: 'un', unitCost: 15000, unitPrice: 18500 },
  { name: 'Perfil omega钢ly', category: 'material', unit: 'ml', unitCost: 1200, unitPrice: 1500 },
  { name: 'Tornillo drywall', category: 'material', unit: 'kg', unitCost: 2500, unitPrice: 3100 },
  
  // === TERMINACIONES - CARPINTERÍA ===
  { name: 'Puerta interior pino 0.80x2.10m', category: 'material', unit: 'un', unitCost: 45000, unitPrice: 55000 },
  { name: 'Puerta interior MDF 0.80x2.10m', category: 'material', unit: 'un', unitCost: 65000, unitPrice: 80000 },
  { name: 'Puerta entrada seguridad', category: 'material', unit: 'un', unitCost: 180000, unitPrice: 220000 },
  { name: 'Ventana aluminio 1.20x1.20m', category: 'material', unit: 'un', unitCost: 85000, unitPrice: 105000 },
  { name: 'Ventana corrediza 1.50x1.20m', category: 'material', unit: 'un', unitCost: 95000, unitPrice: 120000 },
  { name: 'Ventana termopanel 1.20x1.20m', category: 'material', unit: 'un', unitCost: 145000, unitPrice: 180000 },
  { name: 'Baranda vidrio templado', category: 'material', unit: 'ml', unitCost: 85000, unitPrice: 105000 },
  { name: 'Closet MDF módulos', category: 'material', unit: 'ml', unitCost: 95000, unitPrice: 120000 },
  
  // === INSTALACIÓN ELÉCTRICA ===
  { name: 'Cable eléctrico 2.5mm', category: 'material', unit: 'ml', unitCost: 450, unitPrice: 550 },
  { name: 'Cable eléctrico 4mm', category: 'material', unit: 'ml', unitCost: 650, unitPrice: 800 },
  { name: 'Cable eléctrico 6mm', category: 'material', unit: 'ml', unitCost: 850, unitPrice: 1050 },
  { name: 'Cable telefónico 4x0.5mm', category: 'material', unit: 'ml', unitCost: 350, unitPrice: 420 },
  { name: 'Cable TV coaxial', category: 'material', unit: 'ml', unitCost: 280, unitPrice: 350 },
  { name: 'Interruptor simple', category: 'material', unit: 'un', unitCost: 3500, unitPrice: 4200 },
  { name: 'Interruptor doble', category: 'material', unit: 'un', unitCost: 4500, unitPrice: 5500 },
  { name: 'Enchufe simple', category: 'material', unit: 'un', unitCost: 3200, unitPrice: 4000 },
  { name: 'Enchufe doble', category: 'material', unit: 'un', unitCost: 4200, unitPrice: 5200 },
  { name: 'Toma corriente 20A', category: 'material', unit: 'un', unitCost: 5500, unitPrice: 6800 },
  { name: 'Toma telephone', category: 'material', unit: 'un', unitCost: 2800, unitPrice: 3500 },
  { name: 'Toma TV', category: 'material', unit: 'un', unitCost: 2500, unitPrice: 3100 },
  { name: 'Tablero eléctrico 12 circuitos', category: 'material', unit: 'un', unitCost: 65000, unitPrice: 80000 },
  { name: 'Automatismo breaker 20A', category: 'material', unit: 'un', unitCost: 12000, unitPrice: 15000 },
  { name: 'Artefacto LED empotrar 18W', category: 'material', unit: 'un', unitCost: 15000, unitPrice: 18500 },
  { name: 'Artefacto LED superficie 18W', category: 'material', unit: 'un', unitCost: 12000, unitPrice: 15000 },
  
  // === INSTALACIÓN SANITARIA ===
  { name: 'Tubo PVC sanitario 110mm', category: 'material', unit: 'ml', unitCost: 4500, unitPrice: 5500 },
  { name: 'Tubo PVC sanitario 160mm', category: 'material', unit: 'ml', unitCost: 7500, unitPrice: 9200 },
  { name: 'Tubo PVC presión 20mm', category: 'material', unit: 'ml', unitCost: 1200, unitPrice: 1500 },
  { name: 'Tubo PVC presión 25mm', category: 'material', unit: 'ml', unitCost: 1500, unitPrice: 1850 },
  { name: 'Codo PVC 110mm 90°', category: 'material', unit: 'un', unitCost: 2500, unitPrice: 3100 },
  { name: 'Codo PVC 110mm 45°', category: 'material', unit: 'un', unitCost: 2200, unitPrice: 2700 },
  { name: 'Yee PVC sanitario 110mm', category: 'material', unit: 'un', unitCost: 2800, unitPrice: 3500 },
  { name: 'Sifón PVC', category: 'material', unit: 'un', unitCost: 3500, unitPrice: 4200 },
  { name: 'Llave de paso 20mm', category: 'material', unit: 'un', unitCost: 8500, unitPrice: 10500 },
  { name: 'Llave de paso 25mm', category: 'material', unit: 'un', unitCost: 12000, unitPrice: 15000 },
  { name: 'Flexible agua 30cm', category: 'material', unit: 'un', unitCost: 3500, unitPrice: 4200 },
  { name: 'Canastillo desagüe', category: 'material', unit: 'un', unitCost: 4500, unitPrice: 5500 },
  
  // === ARQUITECTURA - BAÑOS ===
  { name: 'Lavamanos pedestal', category: 'material', unit: 'un', unitCost: 85000, unitPrice: 105000 },
  { name: 'Lavamanos sobreponer', category: 'material', unit: 'un', unitCost: 45000, unitPrice: 55000 },
  { name: 'Lavaplatos acero inoxidable', category: 'material', unit: 'un', unitCost: 65000, unitPrice: 80000 },
  { name: 'Inodoro estándar', category: 'material', unit: 'un', unitCost: 95000, unitPrice: 120000 },
  { name: 'Inodoroonespot', category: 'material', unit: 'un', unitCost: 145000, unitPrice: 180000 },
  { name: 'Urinal', category: 'material', unit: 'un', unitCost: 75000, unitPrice: 92000 },
  { name: 'Tina estándar 1.70m', category: 'material', unit: 'un', unitCost: 145000, unitPrice: 180000 },
  { name: 'DuchaBOX 80x80', category: 'material', unit: 'un', unitCost: 185000, unitPrice: 230000 },
  { name: 'Grifería lavamanos', category: 'material', unit: 'un', unitCost: 45000, unitPrice: 55000 },
  { name: 'Grifería ducha', category: 'material', unit: 'un', unitCost: 65000, unitPrice: 80000 },
  { name: 'Grifería lavaplatos', category: 'material', unit: 'un', unitCost: 55000, unitPrice: 68000 },
  { name: 'Accesorios baño (juego)', category: 'material', unit: 'un', unitCost: 28000, unitPrice: 35000 },
  
  // === MANO DE OBRA ===
  { name: 'Albañil', category: 'labor', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Maestro mayor', category: 'labor', unit: 'día', unitCost: 65000, unitPrice: 80000 },
  { name: 'Ayudante albañil', category: 'labor', unit: 'día', unitCost: 25000, unitPrice: 30000 },
  { name: 'Carpintero', category: 'labor', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Maestro carpintero', category: 'labor', unit: 'día', unitCost: 60000, unitPrice: 75000 },
  { name: 'Electricista', category: 'labor', unit: 'día', unitCost: 50000, unitPrice: 62000 },
  { name: 'Maestro electricista', category: 'labor', unit: 'día', unitCost: 65000, unitPrice: 80000 },
  { name: 'Gasfiter', category: 'labor', unit: 'día', unitCost: 50000, unitPrice: 62000 },
  { name: 'Maestro gasfiter', category: 'labor', unit: 'día', unitCost: 65000, unitPrice: 80000 },
  { name: 'Pintor', category: 'labor', unit: 'día', unitCost: 40000, unitPrice: 50000 },
  { name: 'Maestro pintor', category: 'labor', unit: 'día', unitCost: 55000, unitPrice: 68000 },
  { name: 'yesero', category: 'labor', unit: 'día', unitCost: 40000, unitPrice: 50000 },
  { name: 'Techador', category: 'labor', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Vidriero', category: 'labor', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Fierrero', category: 'labor', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Operador retroexcavadora', category: 'labor', unit: 'día', unitCost: 85000, unitPrice: 105000 },
  { name: 'Operador concretadora', category: 'labor', unit: 'día', unitCost: 55000, unitPrice: 68000 },
  { name: 'Gerencia de obra', category: 'labor', unit: 'día', unitCost: 120000, unitPrice: 150000 },
  { name: 'Jefe de obra', category: 'labor', unit: 'día', unitCost: 85000, unitPrice: 105000 },
  { name: 'Capataz', category: 'labor', unit: 'día', unitCost: 55000, unitPrice: 68000 },
  
  // === EQUIPOS Y MAQUINARIA ===
  { name: 'Concretadora 1 sack', category: 'machinery', unit: 'hr', unitCost: 15000, unitPrice: 18500 },
  { name: 'Vibrador de concreto', category: 'machinery', unit: 'hr', unitCost: 8000, unitPrice: 10000 },
  { name: 'Andamio modular', category: 'machinery', unit: 'día', unitCost: 25000, unitPrice: 31000 },
  { name: 'Escalera aluminio 4m', category: 'machinery', unit: 'día', unitCost: 8000, unitPrice: 10000 },
  { name: 'Escalera aluminio 6m', category: 'machinery', unit: 'día', unitCost: 12000, unitPrice: 15000 },
  { name: 'Elevador de материалes', category: 'machinery', unit: 'día', unitCost: 45000, unitPrice: 55000 },
  { name: 'Minicargador', category: 'machinery', unit: 'hr', unitCost: 35000, unitPrice: 42000 },
  { name: 'Retroexcavadora', category: 'machinery', unit: 'hr', unitCost: 65000, unitPrice: 80000 },
  { name: 'Camión tolva', category: 'machinery', unit: 'hr', unitCost: 45000, unitPrice: 55000 },
  { name: 'Planta eléctrica 5kW', category: 'machinery', unit: 'día', unitCost: 35000, unitPrice: 42000 },
  { name: 'Compresor', category: 'machinery', unit: 'día', unitCost: 25000, unitPrice: 31000 },
  { name: 'Amoladora', category: 'machinery', unit: 'día', unitCost: 8000, unitPrice: 10000 },
  { name: 'Sierra circular', category: 'machinery', unit: 'día', unitCost: 10000, unitPrice: 12500 },
  { name: 'Lijadora orbital', category: 'machinery', unit: 'día', unitCost: 6500, unitPrice: 8000 },
  { name: 'Hidrolavadora', category: 'machinery', unit: 'día', unitCost: 25000, unitPrice: 31000 },
  
  // === SUBCONTRATOS ===
  { name: 'Subcontrato demolición', category: 'subcontract', unit: 'm2', unitCost: 12000, unitPrice: 15000 },
  { name: 'Subcontrato excavación', category: 'subcontract', unit: 'm3', unitCost: 8500, unitPrice: 10500 },
  { name: 'Subcontrato estructura madera', category: 'subcontract', unit: 'm2', unitCost: 25000, unitPrice: 31000 },
  { name: 'Subcontrato estructura metal', category: 'subcontract', unit: 'kg', unitCost: 2500, unitPrice: 3100 },
  { name: 'Subcontrato radier', category: 'subcontract', unit: 'm2', unitCost: 18000, unitPrice: 22000 },
  { name: 'Subcontrato enfierradura', category: 'subcontract', unit: 'kg', unitCost: 1200, unitPrice: 1500 },
  { name: 'Subcontrato hormigonado', category: 'subcontract', unit: 'm3', unitCost: 15000, unitPrice: 18500 },
  { name: 'Subcontrato muros', category: 'subcontract', unit: 'm2', unitCost: 22000, unitPrice: 27000 },
  { name: 'Subcontrato estucado', category: 'subcontract', unit: 'm2', unitCost: 8500, unitPrice: 10500 },
  { name: 'Subcontrato pintura', category: 'subcontract', unit: 'm2', unitCost: 6500, unitPrice: 8000 },
  { name: 'Subcontrato ceramicapiso', category: 'subcontract', unit: 'm2', unitCost: 12000, unitPrice: 15000 },
  { name: 'Subcontrato ceramicapared', category: 'subcontract', unit: 'm2', unitCost: 14000, unitPrice: 17500 },
  { name: 'Subcontrato cielo falso', category: 'subcontract', unit: 'm2', unitCost: 12000, unitPrice: 15000 },
  { name: 'Subcontrato drywall', category: 'subcontract', unit: 'm2', unitCost: 15000, unitPrice: 18500 },
  { name: 'Subcontrato electricidad completa', category: 'subcontract', unit: 'm2', unitCost: 25000, unitPrice: 31000 },
  { name: 'Subcontrato sanitaria completa', category: 'subcontract', unit: 'm2', unitCost: 18000, unitPrice: 22000 },
  { name: 'Subcontrato gas', category: 'subcontract', unit: 'punto', unitCost: 45000, unitPrice: 55000 },
  { name: 'Subcontrato aire acondicionado', category: 'subcontract', unit: 'un', unitCost: 250000, unitPrice: 310000 },
  { name: 'Subcontrato paisajismo', category: 'subcontract', unit: 'm2', unitCost: 15000, unitPrice: 18500 },
  { name: 'Subcontrato piscina', category: 'subcontract', unit: 'un', unitCost: 2500000, unitPrice: 3100000 },
];

export function getChileanCosts(category?: string): CostItem[] {
  if (!category) return CHILEAN_COSTS;
  return CHILEAN_COSTS.filter(c => c.category === category);
}

export function searchChileanCosts(query: string): CostItem[] {
  const lowerQuery = query.toLowerCase();
  return CHILEAN_COSTS.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.description?.toLowerCase().includes(lowerQuery)
  );
}

export const COST_CATEGORIES = [
  { value: 'material', label: 'Materiales' },
  { value: 'labor', label: 'Mano de Obra' },
  { value: 'machinery', label: 'Equipos y Maquinaria' },
  { value: 'subcontract', label: 'Subcontratos' },
];

export const DEFAULT_MARKUP_BY_CATEGORY: Record<string, number> = {
  material: 20,
  labor: 30,
  machinery: 25,
  subcontract: 15,
};
