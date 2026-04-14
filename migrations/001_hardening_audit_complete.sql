-- ============================================================================
-- MIGRACIÓN: Auditoría + Hardening BM Build Manage
-- Fecha: 2026-04-14
-- Vectores: 1) Adquisiciones 3-Way Match, 2) Compliance, 3) Multi-Tenant, 4) Enums
-- ============================================================================
-- INSTRUCCIONES: Ejecutar este SQL completo en Supabase SQL Editor.
-- Es idempotente (usa IF NOT EXISTS donde sea posible).
-- ============================================================================

BEGIN;

-- ============================================================================
-- BLOQUE 1: ENUMS NUEVOS
-- ============================================================================

-- Enum para estado de Órdenes de Compra
DO $$ BEGIN
  CREATE TYPE purchase_order_status AS ENUM (
    'draft', 'sent', 'partially_received', 'fully_received', 
    'invoiced', 'closed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para estado de pago de facturas (match 3 vías)
DO $$ BEGIN
  CREATE TYPE invoice_payment_status AS ENUM (
    'pending_reception', 'pending_match', 'ready_for_payment', 'paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Crear el enum de DocumentType si no existe
DO $$ BEGIN
  CREATE TYPE documents_type_enum AS ENUM (
    'plan', 'quantity_takeoff', 'contract', 'invoice', 'receipt', 
    'purchase_order', 'permit', 'photo', 'labor_compliance', 
    'social_security', 'insurance_policy', 'work_contract', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- BLOQUE 2: TABLA purchase_orders (Órdenes de Compra)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  po_number VARCHAR(50),
  supplier_name VARCHAR(300) NOT NULL,
  supplier_rut VARCHAR(12),
  supplier_contact VARCHAR(200),
  description TEXT,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_delivery_date DATE,
  sent_date DATE,
  invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- ============================================================================
-- BLOQUE 3: TABLA purchase_order_items (Detalle de ítems de la OC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  budget_item_id UUID,
  resource_id UUID,
  description VARCHAR(300) NOT NULL,
  unit VARCHAR(50),
  quantity_ordered DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);

-- ============================================================================
-- BLOQUE 4: TABLA purchase_order_receipts (Recepciones en terreno)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  received_by VARCHAR(200) NOT NULL,
  reception_date DATE NOT NULL,
  guia_despacho_number VARCHAR(100),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_receipts_po ON purchase_order_receipts(purchase_order_id);

-- ============================================================================
-- BLOQUE 5: TABLA receipt_items (Detalle de ítems recibidos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_order_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);

-- ============================================================================
-- BLOQUE 6: MODIFICAR invoices (vincular con OC + estado de pago)
-- ============================================================================

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID,
  ADD COLUMN IF NOT EXISTS payment_status invoice_payment_status DEFAULT 'pending_match';

-- ============================================================================
-- BLOQUE 7: MODIFICAR documents (vincular con subcontratista + período + type)
-- ============================================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS type documents_type_enum DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS subcontractor_id UUID,
  ADD COLUMN IF NOT EXISTS period VARCHAR(7);

-- ============================================================================
-- BLOQUE 8: MODIFICAR subcontractor_payments (campos de compliance)
-- ============================================================================

ALTER TABLE subcontractor_payments
  ADD COLUMN IF NOT EXISTS compliance_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS compliance_document_id UUID,
  ADD COLUMN IF NOT EXISTS payment_period VARCHAR(7);

-- ============================================================================
-- BLOQUE 9: MULTI-TENANT FIX — Agregar company_id a 7 entidades
-- ============================================================================

-- 9.1 budget_execution_log
ALTER TABLE budget_execution_log
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_budget_exec_logs_company ON budget_execution_log(company_id);

-- 9.2 resource_consumption
ALTER TABLE resource_consumption
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_resource_consumption_company ON resource_consumption(company_id);

-- 9.3 project_contingencies
ALTER TABLE project_contingencies
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_project_contingencies_company ON project_contingencies(company_id);

-- 9.4 materials
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);

-- 9.5 schedule_tasks
ALTER TABLE schedule_tasks
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_schedule_tasks_company ON schedule_tasks(company_id);

-- 9.6 schedule_milestones
ALTER TABLE schedule_milestones
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_schedule_milestones_company ON schedule_milestones(company_id);

-- 9.7 schedule_resources
ALTER TABLE schedule_resources
  ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_schedule_resources_company ON schedule_resources(company_id);

-- ============================================================================
-- BLOQUE 10: BACKFILL company_id desde proyecto padre (datos existentes)
-- ============================================================================
-- Para filas que ya existen, hereda el company_id del proyecto padre.

UPDATE budget_execution_log bel
SET company_id = p.company_id
FROM budgets b
JOIN projects p ON p.id = b.project_id
WHERE bel.budget_id = b.id
  AND bel.company_id IS NULL;

UPDATE resource_consumption rc
SET company_id = p.company_id
FROM projects p
WHERE rc.project_id = p.id
  AND rc.company_id IS NULL;

UPDATE project_contingencies pc
SET company_id = p.company_id
FROM projects p
WHERE pc.project_id = p.id
  AND pc.company_id IS NULL;

UPDATE schedule_tasks st
SET company_id = p.company_id
FROM projects p
WHERE st.project_id = p.id
  AND st.company_id IS NULL;

UPDATE schedule_milestones sm
SET company_id = p.company_id
FROM projects p
WHERE sm.project_id = p.id
  AND sm.company_id IS NULL;

UPDATE schedule_resources sr
SET company_id = p.company_id
FROM schedule_tasks st
JOIN projects p ON p.id = st.project_id
WHERE sr.task_id = st.id
  AND sr.company_id IS NULL;

-- Materials: asignar al primer company que exista (son catálogo)
UPDATE materials m
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE m.company_id IS NULL;

-- ============================================================================
-- BLOQUE 11: RLS POLICIES para tablas nuevas
-- ============================================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Policy: purchase_orders aisladas por company_id
CREATE POLICY "purchase_orders_company_isolation" ON purchase_orders
  USING (company_id = (auth.jwt()->>'company_id')::uuid);

-- Policy: purchase_order_items via OC padre
CREATE POLICY "po_items_via_parent" ON purchase_order_items
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = (auth.jwt()->>'company_id')::uuid
    )
  );

-- Policy: purchase_order_receipts via OC padre
CREATE POLICY "po_receipts_via_parent" ON purchase_order_receipts
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = (auth.jwt()->>'company_id')::uuid
    )
  );

-- Policy: receipt_items via receipt padre
CREATE POLICY "receipt_items_via_parent" ON receipt_items
  USING (
    receipt_id IN (
      SELECT id FROM purchase_order_receipts
      WHERE purchase_order_id IN (
        SELECT id FROM purchase_orders 
        WHERE company_id = (auth.jwt()->>'company_id')::uuid
      )
    )
  );

-- ============================================================================
-- BLOQUE 12: Trigger para updated_at automático en purchase_orders
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================================
-- VERIFICACIÓN: Ejecutar después para confirmar que todo se creó correctamente
-- ============================================================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('purchase_orders', 'purchase_order_items', 'purchase_order_receipts', 'receipt_items');
--
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'invoices' AND column_name IN ('purchase_order_id', 'payment_status');
--
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'subcontractor_payments' AND column_name LIKE 'compliance%';
