-- ============================================================
-- Migration: SaaS Advanced Monetization
-- Creates: subscription_addons, addon_features, usage_tracking, upgrade_attempts
-- ============================================================

-- 1. Subscription Add-ons
CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  addon_code VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_addons_sub_code ON subscription_addons(subscription_id, addon_code);

-- 2. Add-on Features (Mapping)
CREATE TABLE IF NOT EXISTS addon_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_code VARCHAR(100) NOT NULL,
  feature_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_addon_features_code ON addon_features(addon_code, feature_code);

-- 3. Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_code VARCHAR(100) NOT NULL,
  usage_value INT NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_company_metric_period ON usage_tracking(company_id, metric_code, period_start, period_end);

-- 4. Upgrade Attempts (Metrics)
CREATE TABLE IF NOT EXISTS upgrade_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_attempts_company ON upgrade_attempts(company_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_addons_company_isolation ON subscription_addons
  USING (subscription_id IN (SELECT id FROM subscriptions WHERE company_id = current_setting('app.company_id', true)::UUID));

CREATE POLICY addon_features_read ON addon_features FOR SELECT USING (true);

CREATE POLICY usage_tracking_company_isolation ON usage_tracking
  USING (company_id = current_setting('app.company_id', true)::UUID);

CREATE POLICY upgrade_attempts_company_isolation ON upgrade_attempts
  USING (company_id = current_setting('app.company_id', true)::UUID);

-- ============================================================
-- Seed: Add-ons & Features
-- ============================================================

-- Register Add-ons Features in feature_flags if not exist
INSERT INTO feature_flags (code, name, category) VALUES
  ('ai_pack', 'Pack IA Avanzado', 'addon'),
  ('bim_pro', 'BIM Profesional', 'addon'),
  ('scenario_engine', 'Motor de Escenarios', 'addon'),
  ('supplier_intelligence', 'Inteligencia de Proveedores', 'addon')
ON CONFLICT (code) DO NOTHING;

-- Map Add-ons to specific features
INSERT INTO addon_features (addon_code, feature_code) VALUES
  ('ai_pack', 'ai_assistant'),
  ('ai_pack', 'analytics_advanced'),
  ('bim_pro', 'bim_viewer'),
  ('bim_pro', 'bim_4d'),
  ('bim_pro', 'bim_5d'),
  ('bim_pro', 'bim_clashes'),
  ('scenario_engine', 'scenario_engine'),
  ('supplier_intelligence', 'supplier_intelligence')
ON CONFLICT (addon_code, feature_code) DO NOTHING;
