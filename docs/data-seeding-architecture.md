# BMBuildManage - Arquitectura de Data Seeding Dinámico

## Objetivo
Implementar un sistema de seeding dinámico que permita a cada nueva empresa iniciar con una biblioteca completa de recursos y APUs preconfigurada según su especialidad de construcción.

## Arquitectura Actual (Revisada)

### Fortalezas Existentes
- ✅ Recursos y APUs globales (`company_id IS NULL`) ya implementados
- ✅ RLS estricto con aislamiento perfecto multi-tenant
- ✅ Sistema de historial de precios automático
- ✅ Importación masiva de bibliotecas globales disponible
- ✅ 93%+ cobertura de testing

### Limitaciones Identificadas
- ❌ Sin especialidades de empresa para seeding específico
- ❌ Sin clonación automática al crear empresa
- ❌ Biblioteca global limitada (pocos APUs predefinidos)
- ❌ Sin parámetros regulatorios chilenos (zonas sísmicas)

## Nueva Arquitectura Propuesta

### 1. Extensión de Company Entity

```typescript
// company.entity.ts - NUEVOS CAMPOS
export enum CompanySpecialty {
  RESIDENTIAL = 'residential',      // Vivienda
  CIVIL_WORKS = 'civil_works',      // Obras Civiles  
  RENOVATIONS = 'renovations',      // Remodelaciones
  INDUSTRIAL = 'industrial',        // Industrial
  COMMERCIAL = 'commercial'         // Comercial
}

@Entity('companies')
export class Company {
  // ... campos existentes ...
  
  @Column({ 
    type: 'enum', 
    enum: CompanySpecialty, 
    nullable: true 
  })
  specialty: CompanySpecialty;
  
  @Column({ 
    type: 'enum', 
    enum: ['E', 'D', 'C', 'B', 'A'], // Zonas sísmicas Chile
    nullable: true 
  })
  seismic_zone: string;
  
  @Column({ type: 'boolean', default: false })
  library_seeded: boolean;
  
  @Column({ type: 'timestamptz', nullable: true })
  seeded_at: Date;
}
```

### 2. Tablas de Plantillas Globales por Especialidad

```sql
-- Nueva tabla: global_resource_templates
CREATE TABLE global_resource_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  type resource_type NOT NULL,
  unit_id UUID REFERENCES units(id),
  category VARCHAR(150),
  description TEXT,
  base_price DECIMAL(15,2) NOT NULL,
  has_vat BOOLEAN DEFAULT false,
  
  -- SEEDING PARAMETERS
  specialties TEXT[] NOT NULL, -- ['residential', 'civil_works']
  priority INTEGER DEFAULT 1, -- 1=essential, 2=common, 3=optional
  seismic_zones TEXT[], -- ['E', 'D', 'C'] o NULL para todas
  region_code VARCHAR(10), -- 'CL-RM', 'CL-BI', etc.
  
  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: global_apu_templates  
CREATE TABLE global_apu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  unit_id UUID REFERENCES units(id),
  description TEXT,
  category VARCHAR(100),
  default_formula TEXT,
  default_geometry_layer VARCHAR(100),
  
  -- SEEDING PARAMETERS
  specialties TEXT[] NOT NULL,
  priority INTEGER DEFAULT 1,
  seismic_zones TEXT[],
  region_code VARCHAR(10),
  
  -- REGULATORY COMPLIANCE (Chile 2026)
  nch_standards TEXT[], -- ['NCh433', 'NCh1537'] normativas aplicables
  building_codes TEXT[], -- códigos de construcción relevantes
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recursos de las plantillas globales APU
CREATE TABLE global_apu_template_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_apu_template_id UUID REFERENCES global_apu_templates(id) ON DELETE CASCADE,
  global_resource_template_id UUID REFERENCES global_resource_templates(id) ON DELETE CASCADE,
  coefficient DECIMAL(12,5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Políticas RLS para Plantillas Globales

```sql
-- Solo lectura para todos los usuarios autenticados
ALTER TABLE global_resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_apu_template_resources ENABLE ROW LEVEL SECURITY;

-- Política de solo lectura
CREATE POLICY "Global templates are readable by authenticated users" 
ON global_resource_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Global APU templates are readable by authenticated users" 
ON global_apu_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Global APU resources are readable by authenticated users" 
ON global_apu_template_resources FOR SELECT 
TO authenticated 
USING (true);

-- Solo administradores pueden modificar plantillas globales
-- (se implementará con roles de Supabase)
```

### 4. Función de Clonación Automática

```sql
-- Función principal de seeding
CREATE OR REPLACE FUNCTION seed_company_library(
  p_company_id UUID,
  p_specialty company_specialty,
  p_seismic_zone VARCHAR(1) DEFAULT NULL,
  p_region_code VARCHAR(10) DEFAULT 'CL-RM'
) 
RETURNS JSON AS $$
DECLARE
  resources_count INTEGER := 0;
  apu_count INTEGER := 0;
  result JSON;
BEGIN
  -- 1. Validar que la empresa no esté ya seeded
  IF EXISTS (
    SELECT 1 FROM companies 
    WHERE id = p_company_id AND library_seeded = true
  ) THEN
    RAISE EXCEPTION 'Company library already seeded';
  END IF;

  -- 2. Clonar recursos globales filtrados por especialidad
  WITH inserted_resources AS (
    INSERT INTO resources (
      company_id, name, type, unit_id, category, description, 
      base_price, has_vat
    )
    SELECT 
      p_company_id,
      grt.name,
      grt.type,
      grt.unit_id,
      grt.category,
      grt.description,
      grt.base_price,
      grt.has_vat
    FROM global_resource_templates grt
    WHERE 
      p_specialty = ANY(grt.specialties)
      AND (
        grt.seismic_zones IS NULL 
        OR p_seismic_zone = ANY(grt.seismic_zones)
      )
      AND (
        grt.region_code IS NULL 
        OR grt.region_code = p_region_code
      )
    ORDER BY grt.priority, grt.name
    RETURNING id
  )
  SELECT COUNT(*) INTO resources_count FROM inserted_resources;

  -- 3. Clonar APU templates
  WITH inserted_apus AS (
    INSERT INTO apu_templates (
      company_id, name, unit_id, description, category,
      default_formula, default_geometry_layer
    )
    SELECT 
      p_company_id,
      gat.name,
      gat.unit_id,
      gat.description,
      gat.category,
      gat.default_formula,
      gat.default_geometry_layer
    FROM global_apu_templates gat
    WHERE 
      p_specialty = ANY(gat.specialties)
      AND (
        gat.seismic_zones IS NULL 
        OR p_seismic_zone = ANY(gat.seismic_zones)
      )
      AND (
        gat.region_code IS NULL 
        OR gat.region_code = p_region_code
      )
    ORDER BY gat.priority, gat.name
    RETURNING id, name
  )
  SELECT COUNT(*) INTO apu_count FROM inserted_apus;

  -- 4. Relacionar recursos con APUs (usando mapeo por nombres)
  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient)
  SELECT DISTINCT
    at.id,
    r.id,
    r.type,
    gatr.coefficient
  FROM apu_templates at
  JOIN global_apu_templates gat ON gat.name = at.name
  JOIN global_apu_template_resources gatr ON gatr.global_apu_template_id = gat.id
  JOIN global_resource_templates grt ON grt.id = gatr.global_resource_template_id
  JOIN resources r ON r.name = grt.name AND r.company_id = p_company_id
  WHERE at.company_id = p_company_id;

  -- 5. Marcar empresa como seeded
  UPDATE companies 
  SET 
    specialty = p_specialty,
    seismic_zone = p_seismic_zone,
    library_seeded = true,
    seeded_at = NOW()
  WHERE id = p_company_id;

  -- 6. Retornar resumen
  result := json_build_object(
    'success', true,
    'company_id', p_company_id,
    'specialty', p_specialty,
    'resources_created', resources_count,
    'apus_created', apu_count,
    'seeded_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Trigger Automático en Creación de Empresa

```sql
-- Función trigger
CREATE OR REPLACE FUNCTION auto_seed_company_library() 
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar si specialty está definida y no está seeded
  IF NEW.specialty IS NOT NULL AND NEW.library_seeded = false THEN
    PERFORM seed_company_library(
      NEW.id, 
      NEW.specialty, 
      NEW.seismic_zone,
      COALESCE(NEW.region_code, 'CL-RM')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en INSERT y UPDATE
CREATE TRIGGER trigger_auto_seed_company_library
  AFTER INSERT OR UPDATE OF specialty, seismic_zone
  ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_company_library();
```

## Data Seeds por Especialidad (Chile 2026)

### Vivienda Residencial
**Recursos Esenciales (50 items):**
- Materiales: Cemento, Arena, Grava, Fierro, Madera, Cerámicos, Pintura
- Mano de Obra: Maestro, Albañil, Enfierrador, Carpintero, Gasfiter, Electricista
- Equipos: Betonera, Andamios, Herramientas menores

**APUs Fundamentales (20 items):**
- Excavación manual y mecánica
- Hormigones de cimiento y estructural (H20, H25, H30)
- Albañilerías (ladrillo, bloque)
- Techumbre (tejas, planchas)
- Terminaciones (cerámico, pintura, piso flotante)

### Obras Civiles
**Recursos Esenciales:**
- Materiales: Hormigón premezclado, Acero estructural, Geotextiles
- Equipos: Excavadoras, Compactadores, Bombas de hormigón
- Mano de Obra: Operadores, Topógrafos, Soldadores

**APUs Fundamentales:**
- Movimiento de tierras masivo
- Pavimentación asfáltica y rígida
- Obras de arte (puentes, alcantarillas)
- Señalización vial

### Remodelaciones
**Recursos Esenciales:**
- Materiales: Drywall, Aislación, Parquet, Porcelanatos
- Herramientas: Taladros, Sierras, Lijadoras
- Mano de Obra: Instaladores especializados

**APUs Fundamentales:**
- Demoliciones controladas
- Instalación sistemas (eléctrico, sanitario)
- Terminaciones premium
- Restauración elementos existentes

## Precios Referenciales Chile 2026

### Materiales Base (CLP)
- Cemento especial: $8.500/saco 25kg
- Arena lavada: $18.000/m³
- Grava: $22.000/m³
- Fierro A630-420H: $1.450/kg
- Madera pino seco: $850/pie tablar

### Mano de Obra (CLP/día incluye leyes sociales 65%)
- Maestro primera: $85.000
- Albañil especializado: $65.000
- Jornal: $45.000
- Operador maquinaria: $95.000

### Equipos (CLP/día incluye combustible y operador)
- Retroexcavadora: $280.000
- Betonera 350L: $45.000
- Vibrador hormigón: $25.000

## Implementación por Fases

### Fase 1: Backend Core
- [ ] Migración DB con nuevas tablas
- [ ] Extensión Company entity
- [ ] Función seed_company_library()
- [ ] Trigger automático
- [ ] Tests unitarios

### Fase 2: Data Population
- [ ] Seed 150+ recursos por especialidad
- [ ] Seed 40+ APUs por especialidad
- [ ] Validación precios mercado
- [ ] Parámetros regulatorios Chile

### Fase 3: API Integration
- [ ] Endpoints seeding manual
- [ ] Webhook creación empresa
- [ ] Progress tracking
- [ ] Error handling robusto

### Fase 4: Frontend UX
- [ ] Wizard onboarding
- [ ] Progress indicators
- [ ] Success dashboard
- [ ] Error messaging

## Criterios de Éxito
- ✅ Nueva empresa tiene biblioteca 100% funcional en <30 segundos
- ✅ Aislamiento RLS perfecto (empresa A no ve precios de empresa B)
- ✅ Performance: seeding no afecta respuesta API (<2s total)
- ✅ Escalabilidad: soporte 1000+ empresas concurrentes
- ✅ Compliance: normativas chilenas aplicables incluidas