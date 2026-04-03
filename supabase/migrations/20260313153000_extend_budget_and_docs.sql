-- Add type to items
CREATE TYPE item_type AS ENUM ('material', 'labor', 'machinery', 'subcontract');
ALTER TABLE items ADD COLUMN type item_type DEFAULT 'material';

-- Machinery Catalog
CREATE TABLE machinery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price_per_hour NUMERIC(12, 2) DEFAULT 0,
  price_per_day NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials Library
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  default_price NUMERIC(12, 2) DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expand Documents and add uploaded_by
CREATE TYPE document_type_new AS ENUM ('plan', 'quantity_takeoff', 'contract', 'invoice', 'receipt', 'purchase_order', 'permit', 'photo', 'other');
ALTER TABLE documents ALTER COLUMN type TYPE document_type_new USING type::text::document_type_new;
ALTER TABLE documents ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);

-- Digital Invoice Registry
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  date DATE NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_machinery_company_id ON machinery(company_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
