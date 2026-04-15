-- Add currency columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget_currency varchar(10) DEFAULT 'CLP',
ADD COLUMN IF NOT EXISTS price_currency varchar(10) DEFAULT 'CLP';

-- Add comment
COMMENT ON COLUMN public.projects.budget_currency IS 'Moneda del presupuesto estimado (ej. CLP, UF)';
COMMENT ON COLUMN public.projects.price_currency IS 'Moneda del precio estimado (ej. CLP, UF)';
