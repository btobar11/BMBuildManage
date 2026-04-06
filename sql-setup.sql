-- ============================================
-- BMBuildManage - SQL COMPLETO PARA SUPABASE
-- Ejecutar todo este script en el SQL Editor
-- ============================================

-- ============================================
-- LIMPIAR TABLAS EXISTENTES (si hay conflictos)
-- ============================================
DROP TABLE IF EXISTS punch_items CASCADE;
DROP TABLE IF EXISTS submittals CASCADE;
DROP TABLE IF EXISTS rfis CASCADE;
DROP TABLE IF EXISTS bim_clashes CASCADE;
DROP TABLE IF EXISTS bim_clash_jobs CASCADE;
DROP TABLE IF EXISTS bim_elements CASCADE;
DROP TABLE IF EXISTS project_models CASCADE;
DROP TABLE IF EXISTS template_items CASCADE;
DROP TABLE IF EXISTS template_stages CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS project_contingencies CASCADE;
DROP TABLE IF EXISTS worker_payments CASCADE;
DROP TABLE IF EXISTS worker_assignments CASCADE;
DROP TABLE IF EXISTS project_payments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS apu_resources CASCADE;
DROP TABLE IF EXISTS apu_templates CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  client_id UUID,
  name VARCHAR(255) NOT NULL,
  location TEXT,
  estimated_budget DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'planning',
  folder VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  nit VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  total_estimated_cost DECIMAL(15,2) DEFAULT 0,
  total_estimated_price DECIMAL(15,2) DEFAULT 0,
  professional_fee_percentage DECIMAL(5,2) DEFAULT 10,
  estimated_utility DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'editing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stages
CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0,
  progress DECIMAL(5,2) DEFAULT 0
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  quantity DECIMAL(15,4) DEFAULT 0,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  unit_price DECIMAL(15,2) DEFAULT 0,
  position INTEGER DEFAULT 0,
  quantity_executed DECIMAL(15,4) DEFAULT 0,
  ifc_global_id VARCHAR(255),
  cubication_mode VARCHAR(50) DEFAULT 'manual',
  dim_length DECIMAL(10,4),
  dim_width DECIMAL(10,4),
  dim_height DECIMAL(10,4),
  dim_thickness DECIMAL(10,4),
  formula TEXT,
  apu_template_id UUID
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  unit_cost DECIMAL(15,2) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'material',
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  skills TEXT,
  daily_rate DECIMAL(10,2),
  rating DECIMAL(3,2),
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APU Templates
CREATE TABLE IF NOT EXISTS apu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  unit_cost DECIMAL(15,2) DEFAULT 0,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APU Resources (recursos dentro de un APU)
CREATE TABLE IF NOT EXISTS apu_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apu_template_id UUID NOT NULL REFERENCES apu_templates(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id),
  quantity DECIMAL(10,4) DEFAULT 1,
  unit_cost DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  invoice_number VARCHAR(100),
  client_name VARCHAR(255),
  total_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_type VARCHAR(50),
  file_size BIGINT,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Payments
CREATE TABLE IF NOT EXISTS project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Assignments
CREATE TABLE IF NOT EXISTS worker_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  budget_id UUID REFERENCES budgets(id),
  start_date DATE,
  end_date DATE,
  daily_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Payments
CREATE TABLE IF NOT EXISTS worker_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  project_id UUID REFERENCES projects(id),
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contingencies
CREATE TABLE IF NOT EXISTS project_contingencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  percentage DECIMAL(5,2),
  total_cost DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Stages
CREATE TABLE IF NOT EXISTS template_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0
);

-- Template Items
CREATE TABLE IF NOT EXISTS template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_stage_id UUID NOT NULL REFERENCES template_stages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  quantity DECIMAL(15,4),
  unit_cost DECIMAL(15,2),
  position INTEGER DEFAULT 0
);

-- BIM Models
CREATE TABLE IF NOT EXISTS project_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIM Elements
CREATE TABLE IF NOT EXISTS bim_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES project_models(id) ON DELETE CASCADE,
  ifc_guid VARCHAR(255),
  name VARCHAR(255),
  type VARCHAR(100),
  properties JSONB,
  quantity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIM Clash Jobs
CREATE TABLE IF NOT EXISTS bim_clash_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  model_a_id UUID,
  model_b_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIM Clashes
CREATE TABLE IF NOT EXISTS bim_clashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bim_clash_jobs(id) ON DELETE CASCADE,
  element_a_guid VARCHAR(255),
  element_b_guid VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NUEVAS TABLAS - RFIs, Submittals, Punch List
-- ============================================

-- RFIs (Requests for Information)
CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  question TEXT,
  answer TEXT,
  submitted_by VARCHAR(255),
  answered_by VARCHAR(255),
  due_date TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submittals
CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'other',
  status VARCHAR(50) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'medium',
  spec_section VARCHAR(100),
  submitted_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  due_date TIMESTAMPTZ,
  submitted_date TIMESTAMPTZ,
  reviewed_date TIMESTAMPTZ,
  comments TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Punch Items
CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  location VARCHAR(255),
  reported_by VARCHAR(255),
  assigned_to VARCHAR(255),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clash_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_clashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE ACCESO (Permitir todo para desarrollo)
-- ============================================

-- Crear política "Allow all" para cada tabla
DO $$
BEGIN
  -- Companies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all companies') THEN
    CREATE POLICY "Allow all" ON companies FOR ALL USING (true);
  END IF;
  
  -- Users
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users') THEN
    CREATE POLICY "Allow all" ON users FOR ALL USING (true);
  END IF;
  
  -- Projects
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all projects') THEN
    CREATE POLICY "Allow all" ON projects FOR ALL USING (true);
  END IF;
  
  -- Clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all clients') THEN
    CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
  END IF;
  
  -- Budgets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all budgets') THEN
    CREATE POLICY "Allow all" ON budgets FOR ALL USING (true);
  END IF;
  
  -- Stages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all stages') THEN
    CREATE POLICY "Allow all" ON stages FOR ALL USING (true);
  END IF;
  
  -- Items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all items') THEN
    CREATE POLICY "Allow all" ON items FOR ALL USING (true);
  END IF;
  
  -- Resources
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all resources') THEN
    CREATE POLICY "Allow all" ON resources FOR ALL USING (true);
  END IF;
  
  -- Workers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all workers') THEN
    CREATE POLICY "Allow all" ON workers FOR ALL USING (true);
  END IF;
  
  -- apu_templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all apu_templates') THEN
    CREATE POLICY "Allow all" ON apu_templates FOR ALL USING (true);
  END IF;
  
  -- apu_resources
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all apu_resources') THEN
    CREATE POLICY "Allow all" ON apu_resources FOR ALL USING (true);
  END IF;
  
  -- units
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all units') THEN
    CREATE POLICY "Allow all" ON units FOR ALL USING (true);
  END IF;
  
  -- expenses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all expenses') THEN
    CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
  END IF;
  
  -- invoices
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all invoices') THEN
    CREATE POLICY "Allow all" ON invoices FOR ALL USING (true);
  END IF;
  
  -- documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all documents') THEN
    CREATE POLICY "Allow all" ON documents FOR ALL USING (true);
  END IF;
  
  -- project_payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all project_payments') THEN
    CREATE POLICY "Allow all" ON project_payments FOR ALL USING (true);
  END IF;
  
  -- worker_assignments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all worker_assignments') THEN
    CREATE POLICY "Allow all" ON worker_assignments FOR ALL USING (true);
  END IF;
  
  -- worker_payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all worker_payments') THEN
    CREATE POLICY "Allow all" ON worker_payments FOR ALL USING (true);
  END IF;
  
  -- project_contingencies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all project_contingencies') THEN
    CREATE POLICY "Allow all" ON project_contingencies FOR ALL USING (true);
  END IF;
  
  -- templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all templates') THEN
    CREATE POLICY "Allow all" ON templates FOR ALL USING (true);
  END IF;
  
  -- template_stages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all template_stages') THEN
    CREATE POLICY "Allow all" ON template_stages FOR ALL USING (true);
  END IF;
  
  -- template_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all template_items') THEN
    CREATE POLICY "Allow all" ON template_items FOR ALL USING (true);
  END IF;
  
  -- project_models
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all project_models') THEN
    CREATE POLICY "Allow all" ON project_models FOR ALL USING (true);
  END IF;
  
  -- bim_elements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all bim_elements') THEN
    CREATE POLICY "Allow all" ON bim_elements FOR ALL USING (true);
  END IF;
  
  -- bim_clash_jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all bim_clash_jobs') THEN
    CREATE POLICY "Allow all" ON bim_clash_jobs FOR ALL USING (true);
  END IF;
  
  -- bim_clashes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all bim_clashes') THEN
    CREATE POLICY "Allow all" ON bim_clashes FOR ALL USING (true);
  END IF;
  
  -- rfis (NUEVO)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all rfis') THEN
    CREATE POLICY "Allow all" ON rfis FOR ALL USING (true);
  END IF;
  
  -- submittals (NUEVO)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all submittals') THEN
    CREATE POLICY "Allow all" ON submittals FOR ALL USING (true);
  END IF;
  
  -- punch_items (NUEVO)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all punch_items') THEN
    CREATE POLICY "Allow all" ON punch_items FOR ALL USING (true);
  END IF;
END $$;

-- ============================================
-- DATOS DE EJEMPLO (Demo)
-- ============================================

-- Company demo
INSERT INTO companies (id, name) VALUES 
  ('77777777-7777-7777-7777-777777777777', 'Empresa Demo')
ON CONFLICT (id) DO NOTHING;

-- User demo
INSERT INTO users (id, email, name, role, company_id) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'demo@bmbuild.com', 'Usuario Demo', 'admin', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO NOTHING;

-- Units
INSERT INTO units (name, abbreviation) VALUES
  ('Metro', 'm'),
  ('Metro cuadrado', 'm2'),
  ('Metro cúbico', 'm3'),
  ('Kilogramo', 'kg'),
  ('Unidad', 'und'),
  ('Jornal', 'jrn'),
  ('Hora', 'hr'),
  ('Global', 'glb'),
  ('Pie cuadrado', 'pie2'),
  ('Libra', 'lb')
ON CONFLICT DO NOTHING;

-- ============================================
-- ¡COMPLETADO!
-- ============================================

SELECT '✅ Base de datos actualizada correctamente!' as mensaje;