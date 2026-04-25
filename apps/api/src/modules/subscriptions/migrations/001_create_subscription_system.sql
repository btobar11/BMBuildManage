-- ============================================================
-- Migration: SaaS Subscription System
-- Creates: subscriptions, feature_flags, plan_features, usage_limits
-- ============================================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'lite' CHECK (plan IN ('lite', 'pro', 'enterprise')),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'past_due', 'suspended', 'cancelled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  trial_ends_at DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- 2. Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_code ON feature_flags(code);

-- 3. Plan Features table (mapping)
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('lite', 'pro', 'enterprise')),
  feature_code VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_features_plan_code ON plan_features(plan, feature_code);

-- 4. Usage Limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan VARCHAR(20) NOT NULL UNIQUE CHECK (plan IN ('lite', 'pro', 'enterprise')),
  max_projects INT NOT NULL DEFAULT 3,
  max_users INT NOT NULL DEFAULT 5,
  max_storage_mb INT NOT NULL DEFAULT 500,
  max_ai_requests_month INT NOT NULL DEFAULT 0,
  max_bim_models INT NOT NULL DEFAULT 0
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_company_isolation ON subscriptions
  USING (company_id = current_setting('app.company_id', true)::UUID);

-- feature_flags and plan_features are public read, admin write
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_read ON feature_flags FOR SELECT USING (true);
CREATE POLICY plan_features_read ON plan_features FOR SELECT USING (true);
CREATE POLICY usage_limits_read ON usage_limits FOR SELECT USING (true);

-- ============================================================
-- Seed: Feature Flags
-- ============================================================

INSERT INTO feature_flags (code, name, category) VALUES
  -- LITE
  ('projects', 'Proyectos', 'core'),
  ('budgets_basic', 'Presupuestos Básicos', 'core'),
  ('items', 'Partidas', 'core'),
  ('resources_basic', 'Recursos', 'core'),
  ('workers_basic', 'Trabajadores', 'core'),
  ('expenses', 'Gastos', 'core'),
  ('templates_basic', 'Plantillas', 'core'),
  ('export_pdf', 'Exportar PDF', 'core'),
  ('export_excel', 'Exportar Excel', 'core'),
  ('documents', 'Documentos', 'core'),
  ('clients', 'Clientes', 'core'),
  -- PRO
  ('apu', 'APU Completo', 'pro'),
  ('formula_engine', 'Motor de Cubicación', 'pro'),
  ('purchase_orders', 'Órdenes de Compra', 'pro'),
  ('invoices_sii', 'Facturación SII', 'pro'),
  ('execution', 'Control de Ejecución', 'pro'),
  ('analytics_basic', 'Analytics Básico', 'pro'),
  ('schedule', 'Programación Gantt', 'pro'),
  ('subcontractors', 'Subcontratistas', 'pro'),
  ('contingencies', 'Contingencias', 'pro'),
  ('worker_assignments', 'Asignaciones', 'pro'),
  ('worker_payments', 'Pagos Trabajadores', 'pro'),
  ('machinery', 'Maquinaria', 'pro'),
  ('materials', 'Materiales', 'pro'),
  ('rfis', 'RFIs', 'pro'),
  ('submittals', 'Submittals', 'pro'),
  ('punch_list', 'Punch List', 'pro'),
  -- ENTERPRISE
  ('bim_viewer', 'Visor BIM 3D', 'enterprise'),
  ('bim_4d', 'Simulación 4D', 'enterprise'),
  ('bim_5d', 'Costos 5D', 'enterprise'),
  ('bim_clashes', 'Detección de Colisiones', 'enterprise'),
  ('bim_apu_link', 'Vinculación BIM-APU', 'enterprise'),
  ('ai_assistant', 'Asistente IA', 'enterprise'),
  ('analytics_advanced', 'Analytics Avanzado', 'enterprise'),
  ('audit_logs', 'Auditoría', 'enterprise'),
  ('api_access', 'Acceso API', 'enterprise'),
  ('realtime_collab', 'Colaboración en Tiempo Real', 'enterprise')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Seed: Plan Features (Lite)
-- ============================================================

INSERT INTO plan_features (plan, feature_code) VALUES
  ('lite', 'projects'), ('lite', 'budgets_basic'), ('lite', 'items'),
  ('lite', 'resources_basic'), ('lite', 'workers_basic'), ('lite', 'expenses'),
  ('lite', 'templates_basic'), ('lite', 'export_pdf'), ('lite', 'export_excel'),
  ('lite', 'documents'), ('lite', 'clients')
ON CONFLICT (plan, feature_code) DO NOTHING;

-- Seed: Plan Features (Pro = Lite + extras)
INSERT INTO plan_features (plan, feature_code) VALUES
  ('pro', 'projects'), ('pro', 'budgets_basic'), ('pro', 'items'),
  ('pro', 'resources_basic'), ('pro', 'workers_basic'), ('pro', 'expenses'),
  ('pro', 'templates_basic'), ('pro', 'export_pdf'), ('pro', 'export_excel'),
  ('pro', 'documents'), ('pro', 'clients'),
  ('pro', 'apu'), ('pro', 'formula_engine'), ('pro', 'purchase_orders'),
  ('pro', 'invoices_sii'), ('pro', 'execution'), ('pro', 'analytics_basic'),
  ('pro', 'schedule'), ('pro', 'subcontractors'), ('pro', 'contingencies'),
  ('pro', 'worker_assignments'), ('pro', 'worker_payments'),
  ('pro', 'machinery'), ('pro', 'materials'),
  ('pro', 'rfis'), ('pro', 'submittals'), ('pro', 'punch_list')
ON CONFLICT (plan, feature_code) DO NOTHING;

-- Seed: Plan Features (Enterprise = all)
INSERT INTO plan_features (plan, feature_code) VALUES
  ('enterprise', 'projects'), ('enterprise', 'budgets_basic'), ('enterprise', 'items'),
  ('enterprise', 'resources_basic'), ('enterprise', 'workers_basic'), ('enterprise', 'expenses'),
  ('enterprise', 'templates_basic'), ('enterprise', 'export_pdf'), ('enterprise', 'export_excel'),
  ('enterprise', 'documents'), ('enterprise', 'clients'),
  ('enterprise', 'apu'), ('enterprise', 'formula_engine'), ('enterprise', 'purchase_orders'),
  ('enterprise', 'invoices_sii'), ('enterprise', 'execution'), ('enterprise', 'analytics_basic'),
  ('enterprise', 'schedule'), ('enterprise', 'subcontractors'), ('enterprise', 'contingencies'),
  ('enterprise', 'worker_assignments'), ('enterprise', 'worker_payments'),
  ('enterprise', 'machinery'), ('enterprise', 'materials'),
  ('enterprise', 'rfis'), ('enterprise', 'submittals'), ('enterprise', 'punch_list'),
  ('enterprise', 'bim_viewer'), ('enterprise', 'bim_4d'), ('enterprise', 'bim_5d'),
  ('enterprise', 'bim_clashes'), ('enterprise', 'bim_apu_link'),
  ('enterprise', 'ai_assistant'), ('enterprise', 'analytics_advanced'),
  ('enterprise', 'audit_logs'), ('enterprise', 'api_access'), ('enterprise', 'realtime_collab')
ON CONFLICT (plan, feature_code) DO NOTHING;

-- ============================================================
-- Seed: Usage Limits
-- ============================================================

INSERT INTO usage_limits (plan, max_projects, max_users, max_storage_mb, max_ai_requests_month, max_bim_models)
VALUES
  ('lite', 3, 5, 500, 0, 0),
  ('pro', 20, 25, 5000, 100, 0),
  ('enterprise', -1, -1, -1, -1, -1)
ON CONFLICT (plan) DO UPDATE SET
  max_projects = EXCLUDED.max_projects,
  max_users = EXCLUDED.max_users,
  max_storage_mb = EXCLUDED.max_storage_mb,
  max_ai_requests_month = EXCLUDED.max_ai_requests_month,
  max_bim_models = EXCLUDED.max_bim_models;
