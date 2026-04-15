-- Migración para el módulo de Subcontratos

CREATE TYPE subcontractor_status_enum AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE contract_type_enum AS ENUM ('lump_sum', 'unit_price', 'cost_plus', 'time_and_materials');

CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(300) NOT NULL,
  trade VARCHAR(255),
  nit VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  address VARCHAR(255),
  contract_value DECIMAL(15,2),
  status subcontractor_status_enum NOT NULL DEFAULT 'active',
  rating DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractors_company_id ON subcontractors(company_id);

CREATE TABLE IF NOT EXISTS subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  scope VARCHAR(300) NOT NULL,
  description TEXT,
  contract_type contract_type_enum NOT NULL,
  contract_amount DECIMAL(15,2) NOT NULL,
  approved_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcon_contracts_project_id ON subcontractor_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_subcon_contracts_subcontractor_id ON subcontractor_contracts(subcontractor_id);

CREATE TABLE IF NOT EXISTS subcontractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES subcontractor_contracts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  invoice_number VARCHAR(100),
  description TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by VARCHAR(255),
  approved_date DATE,
  compliance_verified BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_document_id UUID,
  payment_period VARCHAR(7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcon_payments_contract_id ON subcontractor_payments(contract_id);

CREATE TABLE IF NOT EXISTS subcontractor_ram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES subcontractor_contracts(id) ON DELETE CASCADE,
  item VARCHAR(300) NOT NULL,
  description TEXT,
  approved_quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  executed_quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcon_ram_contract_id ON subcontractor_ram(contract_id);

-- Enable RLS
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_ram ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view subcontractors in their company"
  ON subcontractors FOR SELECT USING (company_id IN (
    SELECT company_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can manage subcontractors in their company"
  ON subcontractors FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can view subcontractor contracts in their company"
  ON subcontractor_contracts FOR SELECT USING (project_id IN (
    SELECT id FROM projects WHERE company_id IN (
      SELECT company_id FROM users WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage subcontractor contracts in their company"
  ON subcontractor_contracts FOR ALL USING (project_id IN (
    SELECT id FROM projects WHERE company_id IN (
      SELECT company_id FROM users WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view subcontractor payments in their company"
  ON subcontractor_payments FOR SELECT USING (contract_id IN (
    SELECT id FROM subcontractor_contracts WHERE project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM users WHERE auth_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage subcontractor payments in their company"
  ON subcontractor_payments FOR ALL USING (contract_id IN (
    SELECT id FROM subcontractor_contracts WHERE project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM users WHERE auth_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can view subcontractor ram in their company"
  ON subcontractor_ram FOR SELECT USING (contract_id IN (
    SELECT id FROM subcontractor_contracts WHERE project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM users WHERE auth_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage subcontractor ram in their company"
  ON subcontractor_ram FOR ALL USING (contract_id IN (
    SELECT id FROM subcontractor_contracts WHERE project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM users WHERE auth_id = auth.uid()
      )
    )
  ));
