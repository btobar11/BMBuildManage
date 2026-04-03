-- ============================================================
-- Migration: APU MVP Phase 1-6
-- Run this in Supabase SQL Editor
-- ============================================================

-- PHASE 1: Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name VARCHAR(300) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'material' CHECK (type IN ('material', 'labor', 'equipment')),
  unit VARCHAR(50),
  base_price DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_company ON resources(company_id);

-- Resource price history
CREATE TABLE IF NOT EXISTS resource_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  price DECIMAL(15, 2) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_price_history_resource ON resource_price_history(resource_id);

-- PHASE 2: APU Templates
CREATE TABLE IF NOT EXISTS apu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name VARCHAR(300) NOT NULL,
  base_unit VARCHAR(10) NOT NULL DEFAULT 'm2' CHECK (base_unit IN ('m2', 'm3', 'ml', 'un', 'gl', 'kg', 'hr', 'día')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apu_templates_company ON apu_templates(company_id);

-- APU Resources (resources used in an APU with coefficient)
CREATE TABLE IF NOT EXISTS apu_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apu_id UUID NOT NULL REFERENCES apu_templates(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('material', 'labor', 'equipment')),
  coefficient DECIMAL(12, 5) DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_apu_resources_apu ON apu_resources(apu_id);

-- PHASE 4: Extend items table with cubication and APU
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS apu_template_id UUID REFERENCES apu_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cubication_mode VARCHAR(15) DEFAULT 'manual' CHECK (cubication_mode IN ('manual', 'dimensions')),
  ADD COLUMN IF NOT EXISTS dim_length DECIMAL(12, 3),
  ADD COLUMN IF NOT EXISTS dim_width DECIMAL(12, 3),
  ADD COLUMN IF NOT EXISTS dim_height DECIMAL(12, 3),
  ADD COLUMN IF NOT EXISTS dim_thickness DECIMAL(12, 3),
  ADD COLUMN IF NOT EXISTS quantity_executed DECIMAL(12, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS real_cost DECIMAL(15, 2) DEFAULT 0;

-- PHASE 5: Execution logs
CREATE TABLE IF NOT EXISTS budget_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity_executed DECIMAL(12, 3) NOT NULL,
  real_cost DECIMAL(15, 2) DEFAULT 0,
  note TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_item ON budget_execution_logs(budget_item_id);

-- PHASE 6: Contingencies
CREATE TABLE IF NOT EXISTS project_contingencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(12, 3) DEFAULT 1,
  unit_cost DECIMAL(15, 2) DEFAULT 0,
  total_cost DECIMAL(15, 2) DEFAULT 0,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contingencies_project ON project_contingencies(project_id);

-- Auto-update updated_at for resources
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_apu_templates_updated_at BEFORE UPDATE ON apu_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- Seed data: Common construction resources (Chile)
-- ============================================================

-- Materials
INSERT INTO resources (name, type, unit, base_price) VALUES
  ('Hormigón H25', 'material', 'm3', 120000),
  ('Polietileno 0.2mm', 'material', 'm2', 850),
  ('Arena gruesa', 'material', 'm3', 25000),
  ('Alambre galvanizado', 'material', 'kg', 2800),
  ('Cemento 42.5', 'material', 'saco', 9500),
  ('Ladrillo fiscal', 'material', 'un', 280),
  ('Madera pino cepillada', 'material', 'm2', 12000),
  ('Planchas OSB 15mm', 'material', 'm2', 18000),
  ('Fierro A630-420H 8mm', 'material', 'kg', 1100),
  ('Pernos HV 20x60', 'material', 'un', 450)
ON CONFLICT DO NOTHING;

-- Labor
INSERT INTO resources (name, type, unit, base_price) VALUES
  ('Maestro Primera', 'labor', 'jornada', 58000),
  ('Ayudante general', 'labor', 'jornada', 38000),
  ('Maestro hormigonero', 'labor', 'jornada', 65000),
  ('Gásfiter', 'labor', 'jornada', 68000),
  ('Electricista', 'labor', 'jornada', 72000)
ON CONFLICT DO NOTHING;

-- Equipment
INSERT INTO resources (name, type, unit, base_price) VALUES
  ('Mixer de hormigón', 'equipment', 'hr', 15000),
  ('Vibrador de hormigón', 'equipment', 'hr', 8000),
  ('Compactadora de plato', 'equipment', 'hr', 12000),
  ('Andamio metálico', 'equipment', 'día', 5000)
ON CONFLICT DO NOTHING;
