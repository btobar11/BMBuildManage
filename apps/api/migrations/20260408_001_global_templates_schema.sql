-- Migration: Global Templates Schema for Dynamic Data Seeding
-- Created: 2026-04-08
-- Purpose: Enable dynamic seeding based on company specialty

-- 1. Add specialty and seeding fields to companies table
ALTER TABLE companies 
ADD COLUMN specialty TEXT CHECK (specialty IN ('residential', 'civil_works', 'renovations', 'industrial', 'commercial')),
ADD COLUMN seismic_zone TEXT CHECK (seismic_zone IN ('E', 'D', 'C', 'B', 'A')),
ADD COLUMN region_code VARCHAR(10) DEFAULT 'CL-RM',
ADD COLUMN library_seeded BOOLEAN DEFAULT false,
ADD COLUMN seeded_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX idx_companies_specialty ON companies(specialty);
CREATE INDEX idx_companies_seeded ON companies(library_seeded);

-- 2. Create global resource templates table
CREATE TABLE global_resource_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('material', 'labor', 'equipment')),
  unit_id UUID REFERENCES units(id),
  category VARCHAR(150),
  description TEXT,
  base_price DECIMAL(15,2) NOT NULL,
  has_vat BOOLEAN DEFAULT false,
  
  -- Seeding parameters
  specialties TEXT[] NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)),
  seismic_zones TEXT[],
  region_code VARCHAR(10),
  
  -- Regulatory compliance (Chile)
  nch_standards TEXT[],
  building_codes TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_specialties CHECK (
    specialties <@ ARRAY['residential', 'civil_works', 'renovations', 'industrial', 'commercial']
  ),
  CONSTRAINT valid_seismic_zones CHECK (
    seismic_zones IS NULL OR seismic_zones <@ ARRAY['E', 'D', 'C', 'B', 'A']
  )
);

-- 3. Create global APU templates table
CREATE TABLE global_apu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  unit_id UUID REFERENCES units(id),
  description TEXT,
  category VARCHAR(100),
  default_formula TEXT,
  default_geometry_layer VARCHAR(100),
  
  -- Seeding parameters
  specialties TEXT[] NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)),
  seismic_zones TEXT[],
  region_code VARCHAR(10),
  
  -- Regulatory compliance (Chile)
  nch_standards TEXT[],
  building_codes TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_apu_specialties CHECK (
    specialties <@ ARRAY['residential', 'civil_works', 'renovations', 'industrial', 'commercial']
  ),
  CONSTRAINT valid_apu_seismic_zones CHECK (
    seismic_zones IS NULL OR seismic_zones <@ ARRAY['E', 'D', 'C', 'B', 'A']
  )
);

-- 4. Create junction table for APU template resources
CREATE TABLE global_apu_template_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_apu_template_id UUID REFERENCES global_apu_templates(id) ON DELETE CASCADE,
  global_resource_template_id UUID REFERENCES global_resource_templates(id) ON DELETE CASCADE,
  coefficient DECIMAL(12,5) NOT NULL CHECK (coefficient > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique resource per APU template
  UNIQUE(global_apu_template_id, global_resource_template_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_global_resources_specialties ON global_resource_templates USING GIN(specialties);
CREATE INDEX idx_global_resources_priority ON global_resource_templates(priority);
CREATE INDEX idx_global_resources_zones ON global_resource_templates USING GIN(seismic_zones);

CREATE INDEX idx_global_apus_specialties ON global_apu_templates USING GIN(specialties);
CREATE INDEX idx_global_apus_priority ON global_apu_templates(priority);
CREATE INDEX idx_global_apus_zones ON global_apu_templates USING GIN(seismic_zones);

CREATE INDEX idx_global_apu_resources_apu ON global_apu_template_resources(global_apu_template_id);
CREATE INDEX idx_global_apu_resources_resource ON global_apu_template_resources(global_resource_template_id);

-- 6. Enable RLS for global templates (read-only for authenticated users)
ALTER TABLE global_resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_apu_template_resources ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read global templates
CREATE POLICY "Global resource templates are readable by authenticated users" 
ON global_resource_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Global APU templates are readable by authenticated users" 
ON global_apu_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Global APU template resources are readable by authenticated users" 
ON global_apu_template_resources FOR SELECT 
TO authenticated 
USING (true);

-- 7. Main seeding function
CREATE OR REPLACE FUNCTION seed_company_library(
  p_company_id UUID,
  p_specialty TEXT,
  p_seismic_zone TEXT DEFAULT NULL,
  p_region_code TEXT DEFAULT 'CL-RM'
) 
RETURNS JSON AS $$
DECLARE
  resources_count INTEGER := 0;
  apu_count INTEGER := 0;
  apu_resources_count INTEGER := 0;
  result JSON;
  resource_mapping JSONB := '{}';
BEGIN
  -- Validate inputs
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Company with id % does not exist', p_company_id;
  END IF;

  IF p_specialty NOT IN ('residential', 'civil_works', 'renovations', 'industrial', 'commercial') THEN
    RAISE EXCEPTION 'Invalid specialty: %', p_specialty;
  END IF;

  -- Check if already seeded
  IF EXISTS (
    SELECT 1 FROM companies 
    WHERE id = p_company_id AND library_seeded = true
  ) THEN
    RAISE EXCEPTION 'Company library already seeded';
  END IF;

  -- 1. Clone resources from global templates
  WITH inserted_resources AS (
    INSERT INTO resources (
      company_id, name, type, unit_id, category, description, 
      base_price, has_vat
    )
    SELECT 
      p_company_id,
      grt.name,
      grt.type::TEXT,
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
    RETURNING id, name
  )
  SELECT COUNT(*) INTO resources_count FROM inserted_resources;

  -- Build resource mapping for APU creation
  SELECT jsonb_object_agg(r.name, r.id) INTO resource_mapping
  FROM resources r
  WHERE r.company_id = p_company_id;

  -- 2. Clone APU templates
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

  -- 3. Create APU resource relationships
  WITH inserted_apu_resources AS (
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient)
    SELECT 
      at.id,
      (resource_mapping->grt.name)::UUID,
      grt.type::TEXT,
      gatr.coefficient
    FROM apu_templates at
    JOIN global_apu_templates gat ON gat.name = at.name
    JOIN global_apu_template_resources gatr ON gatr.global_apu_template_id = gat.id
    JOIN global_resource_templates grt ON grt.id = gatr.global_resource_template_id
    WHERE 
      at.company_id = p_company_id
      AND (resource_mapping->grt.name) IS NOT NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO apu_resources_count FROM inserted_apu_resources;

  -- 4. Mark company as seeded
  UPDATE companies 
  SET 
    specialty = p_specialty,
    seismic_zone = p_seismic_zone,
    region_code = p_region_code,
    library_seeded = true,
    seeded_at = NOW()
  WHERE id = p_company_id;

  -- 5. Build result JSON
  result := json_build_object(
    'success', true,
    'company_id', p_company_id,
    'specialty', p_specialty,
    'seismic_zone', p_seismic_zone,
    'region_code', p_region_code,
    'resources_created', resources_count,
    'apus_created', apu_count,
    'apu_resources_created', apu_resources_count,
    'seeded_at', NOW()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Seeding failed for company %: %', p_company_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger function for automatic seeding
CREATE OR REPLACE FUNCTION auto_seed_company_library() 
RETURNS TRIGGER AS $$
DECLARE
  seed_result JSON;
BEGIN
  -- Only seed if specialty is set and library not already seeded
  IF NEW.specialty IS NOT NULL 
     AND NEW.library_seeded = false 
     AND (OLD IS NULL OR OLD.specialty IS DISTINCT FROM NEW.specialty) THEN
    
    BEGIN
      SELECT seed_company_library(
        NEW.id, 
        NEW.specialty, 
        NEW.seismic_zone,
        COALESCE(NEW.region_code, 'CL-RM')
      ) INTO seed_result;
      
      -- Update the NEW record with seeding results
      NEW.library_seeded := true;
      NEW.seeded_at := NOW();
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't prevent company creation
        RAISE WARNING 'Auto-seeding failed for company %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger on companies table
DROP TRIGGER IF EXISTS trigger_auto_seed_company_library ON companies;
CREATE TRIGGER trigger_auto_seed_company_library
  BEFORE INSERT OR UPDATE OF specialty, seismic_zone
  ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_company_library();

-- 10. Grant necessary permissions
GRANT SELECT ON global_resource_templates TO authenticated;
GRANT SELECT ON global_apu_templates TO authenticated;
GRANT SELECT ON global_apu_template_resources TO authenticated;
GRANT EXECUTE ON FUNCTION seed_company_library(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 11. Add helpful comments
COMMENT ON TABLE global_resource_templates IS 'Master library of construction resources for seeding new companies';
COMMENT ON TABLE global_apu_templates IS 'Master library of APU templates for seeding new companies';
COMMENT ON TABLE global_apu_template_resources IS 'Resource coefficients for global APU templates';
COMMENT ON FUNCTION seed_company_library IS 'Seeds a company library based on specialty and regional parameters';

-- Migration complete
SELECT 'Global templates schema created successfully' as result;