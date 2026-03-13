-- Initial Seed Data
-- Company UUID: 550e8400-e29b-41d4-a716-446655440000

INSERT INTO companies (id, name, country, currency)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Constructora Demo SpA', 'Chile', 'CLP')
ON CONFLICT (id) DO NOTHING;

-- Client
INSERT INTO clients (id, company_id, name, email)
VALUES ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Juan Pérez', 'juan.perez@email.com')
ON CONFLICT (id) DO NOTHING;

-- Project
INSERT INTO projects (id, company_id, client_id, name, description, status, estimated_budget)
VALUES ('990e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'Remodelación Baño Pérez', 'Remodelación completa de baño principal con acabados de lujo.', 'in_progress', 2600000)
ON CONFLICT (id) DO NOTHING;

-- Budget
INSERT INTO budgets (id, project_id, version, status)
VALUES ('aa0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', 1, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Stages
INSERT INTO stages (id, budget_id, name, position)
VALUES 
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440000', 'Demolición y Retiro', 0),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440000', 'Instalaciones Sanitarias', 1)
ON CONFLICT (id) DO NOTHING;

-- Items
INSERT INTO items (id, stage_id, name, quantity, unit, unit_cost)
VALUES 
('cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'Desmonte de artefactos', 1, 'glb', 45000),
('cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', 'Demolición de cerámica muro', 12, 'm2', 8500),
('cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440002', 'Tubería PVC 110mm', 6, 'mt', 6500)
ON CONFLICT (id) DO NOTHING;
