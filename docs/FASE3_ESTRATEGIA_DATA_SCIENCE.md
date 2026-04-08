# FASE 3: ESTRATEGIA DATA SCIENCE - IFC + ZONIFICACIÓN CHILENA
## Diferenciador LatAm: Extracción Automática de Quantities + Zonificación Sísmica

---

## 1. VISIÓN DEL MÓDULO

### Objetivo
Cuando el visor BIM extraiga perfiles de acero o volúmenes de hormigón del modelo IFC, el sistema debe:
1. Extraer automáticamente quantities (volúmenes, áreas, pesos)
2. Cruzar con zonificación sísmica chilena actualizada (NCh433)
3. Calcular contingencias estructurales según norma chilena
4. Generar presupuesto diferenciado por zona de riesgo

### Flujo de Datos
```
Modelo IFC → Parser IFC → Extracción Quantities → Zonificación Chile → Cálculo Contingencias → Presupuesto
```

---

## 2. ZONIFICACIÓN SÍSMICA CHILENA (NCh433.Mod2015)

### Zonas Sismicas Actualizadas ( reemplazos antigua Zona 4 → Zona E para costa )

| Zona Antigua | Nueva Denominación | Tipo de Zona | Factor Riesgo |
|--------------|-------------------|--------------|---------------|
| Zona 1 | - | Interior | 1.0x |
| Zona 2 | - | Transición | 1.2x |
| Zona 3 | - | Urbana | 1.4x |
| ~~Zona 4~~ | **Zona E** | Costa / Sísmica Alta | **2.0x** |
| Zona 5 | - | Sísmica Crítica | 2.5x |

### Soluciones Estructurales por Zona

| Elemento | Zona Normal | Zona E (Costa) | Zona Sísmica Crítica |
|----------|------------|----------------|---------------------|
| Hormigón | H25 (25 MPa) | H30 (30 MPa) | H35 (35 MPa) |
| Acero | A420-270H | A560-500H | A630-600H |
| Estructura | Convencional | Antisísmica Especial | Alto Desempeño |
| Cimientos | Zapatas | Zapatas + Vigas | Platea + Pilotes |
| Precio Base | 100% | 135% | 175% |

---

## 3. ARQUITECTURA DEL SCRIPT DE EXTRACCIÓN IFC

### 3.1 Parser de IfcPropertySet

```typescript
// src/modules/bim-models/ifc-quantity-extractor.ts

interface IfcElement {
  expressId: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  quantities: {
    volume?: number;
    area?: number;
    length?: number;
    count?: number;
  };
}

interface StructuralElement extends IfcElement {
  material: string;
  grade: string;
  zone: SeismicZone;
  contingencyFactor: number;
}

export enum SeismicZone {
  INTERIOR = 'INTERIOR',
  TRANSITION = 'TRANSITION', 
  URBAN = 'URBAN',
  COASTAL = 'COASTAL',  // Antigua Zona 4 → Nueva Zona E
  CRITICAL = 'CRITICAL'
}

export class IFCQuantityExtractor {
  
  extractQuantities(model: any): StructuralElement[] {
    const elements = this.getStructuralElements(model);
    const projectLocation = this.getProjectLocation(model);
    const zone = this.mapLocationToZone(projectLocation);
    
    return elements.map(element => ({
      ...element,
      zone,
      contingencyFactor: this.getContingencyFactor(zone, element.type)
    }));
  }

  private mapLocationToZone(location: ProjectLocation): SeismicZone {
    const lat = location.latitude;
    const lon = location.longitude;
    
    // Chile: Costa pacífica = Alta sismicidad
    if (this.isCoastalLocation(lat, lon)) {
      return SeismicZone.COASTAL; // Zona E
    }
    
    // Santiago y ciudades principales = Zona urbana
    if (this.isMajorCity(lat, lon)) {
      return SeismicZone.URBAN;
    }
    
    // Interior norte = Menor riesgo
    return SeismicZone.INTERIOR;
  }

  private getContingencyFactor(zone: SeismicZone, elementType: string): number {
    const zoneFactors = {
      [SeismicZone.INTERIOR]: 1.0,
      [SeismicZone.TRANSITION]: 1.15,
      [SeismicZone.URBAN]: 1.35,
      [SeismicZone.COASTAL]: 2.0,  // Mayor resistencia para costa
      [SeismicZone.CRITICAL]: 2.5
    };

    const materialFactors = {
      'IfcColumn': 1.2,
      'IfcBeam': 1.1,
      'IfcWall': 1.0,
      'IfcSlab': 1.15,
      'IfcFooting': 1.3
    };

    return zoneFactors[zone] * (materialFactors[elementType] || 1.0);
  }
}
```

### 3.2 Mapeo de Materiales Chilenos

```typescript
const CHILEAN_MATERIALS: Record<string, ChileanMaterial> = {
  'CONCRETE:H25': {
    f'c: 25, // MPa
    zonaE: 'H30', // Upgrade para zona sísmica
    pricePerM3: 105000,
    zonaEPricePerM3: 120000
  },
  'CONCRETE:H30': {
    f'c: 30,
    zonaE: 'H35',
    pricePerM3: 120000,
    zonaEPricePerM3: 140000
  },
  'REBAR:A420': {
    fy: 420,
    zonaE: 'A560',
    pricePerKg: 1050,
    zonaEPricePerKg: 1200
  },
  'REBAR:A560': {
    fy: 560,
    zonaE: 'A630',
    pricePerKg: 1200,
    zonaEPricePerKg: 1350
  }
};
```

### 3.3 Cálculo de Contingencias

```typescript
export function calculateStructuralContingency(
  elements: StructuralElement[],
  projectLocation: ProjectLocation
): ContingencyReport {
  
  const zone = determineSeismicZone(projectLocation);
  
  const totals = elements.reduce((acc, elem) => {
    const baseCost = calculateBaseCost(elem);
    const adjustedCost = baseCost * elem.contingencyFactor;
    
    acc.baseCost += baseCost;
    acc.adjustedCost += adjustedCost;
    acc.contingency += (adjustedCost - baseCost);
    
    if (elem.zone === SeismicZone.COASTAL) {
      acc.coastalAdjustment += adjustedCost;
    }
    
    return acc;
  }, { baseCost: 0, adjustedCost: 0, contingency: 0, coastalAdjustment: 0 });

  return {
    zone,
    totalBaseCost: totals.baseCost,
    totalWithContingency: totals.adjustedCost,
    contingencyAmount: totals.contingency,
    contingencyPercentage: (totals.contingency / totals.baseCost) * 100,
    coastalAdjustmentAmount: totals.coastalAdjustment,
    requiresSpecialInspection: zone === SeismicZone.COASTAL || zone === SeismicZone.CRITICAL
  };
}
```

---

## 4. SCHEMA DE BASE DE DATOS

```sql
-- Tabla de zonificación sísmica
CREATE TABLE seismic_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code VARCHAR(20) UNIQUE NOT NULL,  -- 'E' para costa
  zone_name VARCHAR(100) NOT NULL,
  risk_factor DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  requires_special_inspection BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de elementos estructurales extraídos del IFC
CREATE TABLE bim_quantities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES project_models(id) ON DELETE CASCADE,
  element_express_id VARCHAR(100),
  element_type VARCHAR(50),  -- IfcColumn, IfcBeam, etc.
  material_grade VARCHAR(20),
  quantity_type VARCHAR(20),  -- volume, area, length, count
  quantity_value DECIMAL(15,4) NOT NULL,
  unit VARCHAR(20),
  seismic_zone VARCHAR(20) REFERENCES seismic_zones(zone_code),
  contingency_factor DECIMAL(5,2) DEFAULT 1.0,
  base_cost DECIMAL(15,2),
  adjusted_cost DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries analíticas
CREATE INDEX idx_bim_quantities_zone ON bim_quantities(seismic_zone);
CREATE INDEX idx_bim_quantities_model ON bim_quantities(model_id);
CREATE INDEX idx_bim_quantities_type ON bim_quantities(element_type);

-- RLS
ALTER TABLE seismic_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_quantities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seismic_zones_read_all" ON seismic_zones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bim_quantities_isolation" ON bim_quantities
  FOR ALL TO authenticated USING (
    model_id IN (
      SELECT pm.id FROM project_models pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
    )
  );
```

---

## 5. ENDPOINTS API

```typescript
// POST /api/v1/bim-models/:id/extract-quantities
// Extrae quantities del modelo IFC y guarda en bim_quantities

// GET /api/v1/bim-models/:id/contingency-report
// Genera reporte de contingencias estructurales según zona sísmica

// GET /api/v1/bim-models/:id/structural-summary
// Resumen de quantities por tipo de elemento y zona
```

---

## 6. INTEGRACIÓN CON MÓDULO DE PRESUPUESTOS

```typescript
// Cuando se importan quantities del BIM al presupuesto:
// 1. Se verifica la ubicación del proyecto
// 2. Se determina la zona sísmica automáticamente
// 3. Se ajustan los costos según factor de contingencia
// 4. Se genera línea de "Contingencia Estructural Sísmica" en presupuesto
```

---

## 7. ROADMAP DE IMPLEMENTACIÓN

| Fase | Tarea | Prioridad | Tiempo Est. |
|------|-------|-----------|-------------|
| 3.1 | Script parser IFC → bim_quantities | 🔴 ALTA | 1 semana |
| 3.2 | Tabla seismic_zones + datos NCh433 | 🔴 ALTA | 2 días |
| 3.3 | Lógica zonificación automática | 🟡 MEDIA | 3 días |
| 3.4 | Endpoint contingency-report | 🟡 MEDIA | 2 días |
| 3.5 | Integración con módulo presupuestos | 🟢 BAJA | 1 semana |

---

## 8. DIFERENCIADOR COMPETITIVO

| Feature | Procore | Autodesk | RIB CostX | **BMBuildManage** |
|---------|---------|----------|-----------|-------------------|
| Extracción IFC | ❌ | ⚠️ | ✅ | ✅ **+ Chile** |
| Zonificación Sísmica | ❌ | ❌ | ❌ | ✅ **ÚNICO** |
| Contingencias Auto | ❌ | ❌ | ⚠️ | ✅ **+ NCh433** |
| Precios Chile | ❌ | ❌ | ❌ | ✅ **ÚNICO** |

---

*Documento preparado para agente Data-BI-Strategist*
*Fecha: 7 Abril 2026*
