-- ============================================================
-- Migration: Pilot Demo Data Seeding
-- Date: 2026-04-01
-- Purpose: Generate complete demo project for field pilot testing
-- ============================================================
--
-- This script creates:
-- 1. Demo Company "Constructora Demo SpA"
-- 2. Demo Project "Edificio Piloto"
-- 3. 5 APU Templates with Chilean construction terminology
-- 4. Budget with stages and items linked to APU templates
--
-- IMPORTANT: Run as superuser or with RLS bypass
-- All constraints respected: non-negative values, proper FKs
-- ============================================================

-- ============================================================
-- PART 1: DEMO COMPANY
-- ============================================================

-- Create demo company (idempotent)
INSERT INTO companies (id, name, country, currency, tax_id, address, email, phone)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
  'Constructora Demo SpA',
  'CL',
  'CLP',
  '76.123.456-7',
  'Av. Providencia 1234, Oficina 501, Santiago',
  'contacto@constructorademo.cl',
  '+56 2 2345 6789'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 2: UNITS (ensure common units exist)
-- ============================================================

-- Seed units if they don't exist
INSERT INTO units (id, name, symbol, category) VALUES
  ('11111111-1111-1111-1111-111111111111'::UUID, 'Metro cuadrado', 'm²', 'area'),
  ('22222222-2222-2222-2222-222222222222'::UUID, 'Metro cúbico', 'm³', 'volume'),
  ('33333333-3333-3333-3333-333333333333'::UUID, 'Metro lineal', 'ml', 'length'),
  ('44444444-4444-4444-4444-444444444444'::UUID, 'Unidad', 'un', 'quantity'),
  ('55555555-5555-5555-5555-555555555555'::UUID, 'Kilogramo', 'kg', 'weight'),
  ('66666666-6666-6666-6666-666666666666'::UUID, 'Jornada', 'jr', 'time'),
  ('77777777-7777-7777-7777-777777777777'::UUID, 'Hora', 'hr', 'time'),
  ('88888888-8888-8888-8888-888888888888'::UUID, 'Global', 'gl', 'other')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 3: RESOURCES (Chilean construction materials/labor/equipment)
-- ============================================================

-- Materials
INSERT INTO resources (id, company_id, name, type, unit, base_price) VALUES
  -- Materiales
  ('r0000001-0000-0000-0000-000000000001'::UUID, NULL, 'Hormigón H25 premezclado', 'material', 'm³', 95000.00),
  ('r0000001-0000-0000-0000-000000000002'::UUID, NULL, 'Hormigón G20 fundaciones', 'material', 'm³', 85000.00),
  ('r0000001-0000-0000-0000-000000000003'::UUID, NULL, 'Arena gruesa', 'material', 'm³', 28000.00),
  ('r0000001-0000-0000-0000-000000000004'::UUID, NULL, 'Grava 3/4"', 'material', 'm³', 32000.00),
  ('r0000001-0000-0000-0000-000000000005'::UUID, NULL, 'Cemento Polpaico 42.5', 'material', 'saco', 9500.00),
  ('r0000001-0000-0000-0000-000000000006'::UUID, NULL, 'Fierro A630-420H Ø10mm', 'material', 'kg', 1150.00),
  ('r0000001-0000-0000-0000-000000000007'::UUID, NULL, 'Fierro A630-420H Ø8mm', 'material', 'kg', 1200.00),
  ('r0000001-0000-0000-0000-000000000008'::UUID, NULL, 'Alambre negro N°18', 'material', 'kg', 2500.00),
  ('r0000001-0000-0000-0000-000000000009'::UUID, NULL, 'Madera pino 2x4"', 'material', 'ml', 4500.00),
  ('r0000001-0000-0000-0000-000000000010'::UUID, NULL, 'Placa OSB 15mm', 'material', 'm²', 16500.00),
  ('r0000001-0000-0000-0000-000000000011'::UUID, NULL, 'Polietileno 0.2mm', 'material', 'm²', 950.00),
  ('r0000001-0000-0000-0000-000000000012'::UUID, NULL, 'Clavos 2"', 'material', 'kg', 3200.00),
  ('r0000001-0000-0000-0000-000000000013'::UUID, NULL, 'Aceite desmoldante', 'material', 'lt', 3500.00),
  -- Mano de obra
  ('r0000002-0000-0000-0000-000000000001'::UUID, NULL, 'Maestro 1a', 'labor', 'jr', 65000.00),
  ('r0000002-0000-0000-0000-000000000002'::UUID, NULL, 'Maestro 2a', 'labor', 'jr', 55000.00),
  ('r0000002-0000-0000-0000-000000000003'::UUID, NULL, 'Ayudante', 'labor', 'jr', 40000.00),
  ('r0000002-0000-0000-0000-000000000004'::UUID, NULL, 'Hormigonero especializado', 'labor', 'jr', 70000.00),
  ('r0000002-0000-0000-0000-000000000005'::UUID, NULL, 'Enfierrador', 'labor', 'jr', 60000.00),
  ('r0000002-0000-0000-0000-000000000006'::UUID, NULL, 'Carpintero de obra gruesa', 'labor', 'jr', 58000.00),
  -- Equipos
  ('r0000003-0000-0000-0000-000000000001'::UUID, NULL, 'Mixer hormigonera 400L', 'equipment', 'hr', 12000.00),
  ('r0000003-0000-0000-0000-000000000002'::UUID, NULL, 'Vibrador inmersivo', 'equipment', 'hr', 8500.00),
  ('r0000003-0000-0000-0000-000000000003'::UUID, NULL, 'Compactadora plato', 'equipment', 'hr', 15000.00),
  ('r0000003-0000-0000-0000-000000000004'::UUID, NULL, 'Excavadora retroexcavadora', 'equipment', 'hr', 55000.00),
  ('r0000003-0000-0000-0000-000000000005'::UUID, NULL, 'Camión volteo 10m³', 'equipment', 'hr', 45000.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 4: APU TEMPLATES (5 real Chilean construction items)
-- ============================================================

-- APU 1: Excavación masiva (m³)
INSERT INTO apu_templates (id, company_id, name, unit_id, description, category, default_formula)
VALUES (
  'apu-0001-0000-0000-0000-000000000001'::UUID,
  NULL, -- Global template
  'Excavación masiva en terreno natural',
  '22222222-2222-2222-2222-222222222222'::UUID, -- m³
  'Excavación mecánica en terreno natural clase II, incluye carguío y transporte a botadero hasta 500m de distancia. No incluye sobreexcavación ni relleno.',
  'Movimiento de tierras',
  'largo * ancho * alto'
) ON CONFLICT (id) DO NOTHING;

-- APU 1 resources
INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient) VALUES
  ('apr-0001-0000-0000-0000-000000000001'::UUID, 'apu-0001-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000003'::UUID, 'labor', 0.05000),     -- Ayudante: 0.05 jr/m³
  ('apr-0001-0000-0000-0000-000000000002'::UUID, 'apu-0001-0000-0000-0000-000000000001'::UUID, 'r0000003-0000-0000-0000-000000000004'::UUID, 'equipment', 0.10000), -- Excavadora: 0.1 hr/m³
  ('apr-0001-0000-0000-0000-000000000003'::UUID, 'apu-0001-0000-0000-0000-000000000001'::UUID, 'r0000003-0000-0000-0000-000000000005'::UUID, 'equipment', 0.08000)  -- Camión volteo: 0.08 hr/m³
ON CONFLICT (id) DO NOTHING;

-- APU 2: Hormigón de fundaciones G20 (m³)
INSERT INTO apu_templates (id, company_id, name, unit_id, description, category, default_formula)
VALUES (
  'apu-0002-0000-0000-0000-000000000001'::UUID,
  NULL,
  'Hormigón de fundaciones G20',
  '22222222-2222-2222-2222-222222222222'::UUID, -- m³
  'Hormigón grado 20 para fundaciones, incluye: preparación en obra, vaciado, vibrado y curado. Sin considerar enfierradura ni moldaje.',
  'Estructuras',
  'largo * ancho * alto'
) ON CONFLICT (id) DO NOTHING;

-- APU 2 resources
INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient) VALUES
  ('apr-0002-0000-0000-0000-000000000001'::UUID, 'apu-0002-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000002'::UUID, 'material', 1.00000), -- Hormigón G20: 1 m³/m³
  ('apr-0002-0000-0000-0000-000000000002'::UUID, 'apu-0002-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000011'::UUID, 'material', 1.20000), -- Polietileno: 1.2 m²/m³
  ('apr-0002-0000-0000-0000-000000000003'::UUID, 'apu-0002-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000004'::UUID, 'labor', 0.25000),   -- Hormigonero: 0.25 jr/m³
  ('apr-0002-0000-0000-0000-000000000004'::UUID, 'apu-0002-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000003'::UUID, 'labor', 0.50000),   -- Ayudante: 0.5 jr/m³
  ('apr-0002-0000-0000-0000-000000000005'::UUID, 'apu-0002-0000-0000-0000-000000000001'::UUID, 'r0000003-0000-0000-0000-000000000002'::UUID, 'equipment', 0.15000) -- Vibrador: 0.15 hr/m³
ON CONFLICT (id) DO NOTHING;

-- APU 3: Moldaje de losas (m²)
INSERT INTO apu_templates (id, company_id, name, unit_id, description, category, default_formula)
VALUES (
  'apu-0003-0000-0000-0000-000000000001'::UUID,
  NULL,
  'Moldaje de losas',
  '11111111-1111-1111-1111-111111111111'::UUID, -- m²
  'Moldaje para losas hormigón H25, incluye: construcción, apuntalamiento, desmoldaje y limpieza. Reutilización considerada 5 veces.',
  'Moldajes',
  'largo * ancho'
) ON CONFLICT (id) DO NOTHING;

-- APU 3 resources
INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient) VALUES
  ('apr-0003-0000-0000-0000-000000000001'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000009'::UUID, 'material', 0.80000),  -- Madera 2x4: 0.8 ml/m²
  ('apr-0003-0000-0000-0000-000000000002'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000010'::UUID, 'material', 0.20000),  -- OSB 15mm: 0.2 m²/m² (1 uso de 5)
  ('apr-0003-0000-0000-0000-000000000003'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000012'::UUID, 'material', 0.05000),  -- Clavos: 0.05 kg/m²
  ('apr-0003-0000-0000-0000-000000000004'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000013'::UUID, 'material', 0.02000),  -- Aceite: 0.02 lt/m²
  ('apr-0003-0000-0000-0000-000000000005'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000006'::UUID, 'labor', 0.35000),    -- Carpintero: 0.35 jr/m²
  ('apr-0003-0000-0000-0000-000000000006'::UUID, 'apu-0003-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000003'::UUID, 'labor', 0.70000)     -- Ayudante: 0.7 jr/m²
ON CONFLICT (id) DO NOTHING;

-- APU 4: Acero de refuerzo A630 (kg)
INSERT INTO apu_templates (id, company_id, name, unit_id, description, category, default_formula)
VALUES (
  'apu-0004-0000-0000-0000-000000000001'::UUID,
  NULL,
  'Acero de refuerzo A630-420H',
  '55555555-5555-5555-5555-555555555555'::UUID, -- kg
  'Enfierradura con acero A630-420H, incluye: corte, doblado, armado en taller y colocación en obra. No incluye traslapes ni desperdicios.',
  'Enfierradura',
  'cantidad * peso_unitario'
) ON CONFLICT (id) DO NOTHING;

-- APU 4 resources
INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient) VALUES
  ('apr-0004-0000-0000-0000-000000000001'::UUID, 'apu-0004-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000006'::UUID, 'material', 1.05000), -- Fierro Ø10: 1.05 kg/kg (5% desperdicio)
  ('apr-0004-0000-0000-0000-000000000002'::UUID, 'apu-0004-0000-0000-0000-000000000001'::UUID, 'r0000001-0000-0000-0000-000000000008'::UUID, 'material', 0.01500), -- Alambre: 0.015 kg/kg
  ('apr-0004-0000-0000-0000-000000000003'::UUID, 'apu-0004-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000005'::UUID, 'labor', 0.01200)   -- Enfierrador: 0.012 jr/kg
ON CONFLICT (id) DO NOTHING;

-- APU 5: Instalación de faenas (Global)
INSERT INTO apu_templates (id, company_id, name, unit_id, description, category, default_formula)
VALUES (
  'apu-0005-0000-0000-0000-000000000001'::UUID,
  NULL,
  'Instalación de faenas',
  '88888888-8888-8888-8888-888888888888'::UUID, -- gl (Global)
  'Instalación de faenas provisorias, incluye: oficinas, bodegas, baños químicos, cerco perimetral, carteles, agua potable y electricidad provisional.',
  'Instalaciones',
  NULL -- Manual calculation
) ON CONFLICT (id) DO NOTHING;

-- APU 5 resources (percentage-based for global items)
INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient) VALUES
  ('apr-0005-0000-0000-0000-000000000001'::UUID, 'apu-0005-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000002'::UUID, 'labor', 5.00000), -- Maestro 2a: 5 jornadas/gl
  ('apr-0005-0000-0000-0000-000000000002'::UUID, 'apu-0005-0000-0000-0000-000000000001'::UUID, 'r0000002-0000-0000-0000-000000000003'::UUID, 'labor', 10.00000) -- Ayudante: 10 jornadas/gl
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 5: DEMO PROJECT
-- ============================================================

-- Create demo project
INSERT INTO projects (id, company_id, name, description, location, status, start_date, end_date, estimated_budget, type)
VALUES (
  'b1c2d3e4-f5a6-7890-bcde-f12345678901'::UUID,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
  'Edificio Piloto',
  'Proyecto piloto para demostración de sistema de control de presupuesto en terreno. Edificio de 5 pisos, 80 departamentos, estacionamientos subterráneos.',
  'Av. Las Condes 5678, Las Condes, Santiago',
  'in_progress',
  '2026-04-01',
  '2027-12-31',
  2500000000.00, -- $2.500.000.000 CLP estimated
  'Edificio residencial'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 6: BUDGET WITH STAGES AND ITEMS
-- ============================================================

-- Create budget
INSERT INTO budgets (id, project_id, version, status, is_active, notes, total_estimated_cost, total_estimated_price)
VALUES (
  'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID,
  'b1c2d3e4-f5a6-7890-bcde-f12345678901'::UUID,
  1,
  'draft',
  true,
  'Presupuesto inicial para piloto. Pendiente cubicación detallada.',
  0.00,
  0.00
) ON CONFLICT (id) DO NOTHING;

-- Create stages (partidas mayores)
INSERT INTO stages (id, budget_id, name, position) VALUES
  ('s1a1b1c1-d1e1-f1a1-b1c1-d1e1f1a1b1c1'::UUID, 'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID, 'Obras Preliminares', 1),
  ('s2a2b2c2-d2e2-f2a2-b2c2-d2e2f2a2b2c2'::UUID, 'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID, 'Estructuras', 2),
  ('s3a3b3c3-d3e3-f3a3-b3c3-d3e3f3a3b3c3'::UUID, 'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID, 'Enfierradura', 3),
  ('s4a4b4c4-d4e4-f4a4-b4c4-d4e4f4a4b4c4'::UUID, 'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID, 'Terminaciones', 4),
  ('s5a5b5c5-d5e5-f5a5-b5c5-d5e5f5a5b5c5'::UUID, 'c1d2e3f4-a5b6-7890-cdef-123456789012'::UUID, 'Gastos Generales', 5)
ON CONFLICT (id) DO NOTHING;

-- Create items (partidas) linked to APU templates - INITIAL QUANTITIES = 0
INSERT INTO items (id, stage_id, name, type, description, quantity, unit, unit_cost, unit_price, apu_template_id, cubication_mode, position) VALUES
  -- Item 1: Excavación masiva (Obras Preliminares)
  (
    'i1a1b1c1-d1e1-f1a1-b1c1-d1e1f1a1b1c1'::UUID,
    's1a1b1c1-d1e1-f1a1-b1c1-d1e1f1a1b1c1'::UUID,
    'Excavación masiva',
    'material',
    'Excavación mecánica para fundaciones y subterráneos',
    0.000, -- quantity = 0 (pending cubication)
    'm³',
    8500.00, -- unit_cost (approximate from APU calculation)
    12000.00, -- unit_price (with margin)
    'apu-0001-0000-0000-0000-000000000001'::UUID,
    'manual',
    1
  ),
  -- Item 2: Hormigón fundaciones (Estructuras)
  (
    'i2a2b2c2-d2e2-f2a2-b2c2-d2e2f2a2b2c2'::UUID,
    's2a2b2c2-d2e2-f2a2-b2c2-d2e2f2a2b2c2'::UUID,
    'Hormigón de fundaciones G20',
    'material',
    'Hormigón grado 20 para zapatas y fundaciones corridas',
    0.000, -- quantity = 0 (pending cubication)
    'm³',
    125000.00, -- unit_cost (includes materials + labor + equipment)
    165000.00, -- unit_price (with margin)
    'apu-0002-0000-0000-0000-000000000001'::UUID,
    'manual',
    1
  ),
  -- Item 3: Moldaje losas (Estructuras)
  (
    'i3a3b3c3-d3e3-f3a3-b3c3-d3e3f3a3b3c3'::UUID,
    's2a2b2c2-d2e2-f2a2-b2c2-d2e2f2a2b2c2'::UUID,
    'Moldaje de losas',
    'material',
    'Moldaje para losas de entrepiso y cubierta',
    0.000, -- quantity = 0 (pending cubication)
    'm²',
    18500.00, -- unit_cost (includes wood + OSB + labor)
    25000.00, -- unit_price (with margin)
    'apu-0003-0000-0000-0000-000000000001'::UUID,
    'manual',
    2
  ),
  -- Item 4: Acero refuerzo (Enfierradura)
  (
    'i4a4b4c4-d4e4-f4a4-b4c4-d4e4f4a4b4c4'::UUID,
    's3a3b3c3-d3e3-f3a3-b3c3-d3e3f3a3b3c3'::UUID,
    'Acero de refuerzo A630',
    'material',
    'Enfierradura para fundaciones, muros y losas',
    0.000, -- quantity = 0 (pending cubication)
    'kg',
    1450.00, -- unit_cost (includes steel + wire + labor)
    1950.00, -- unit_price (with margin)
    'apu-0004-0000-0000-0000-000000000001'::UUID,
    'manual',
    1
  ),
  -- Item 5: Instalación faenas (Gastos Generales)
  (
    'i5a5b5c5-d5e5-f5a5-b5c5-d5e5f5a5b5c5'::UUID,
    's5a5b5c5-d5e5-f5a5-b5c5-d5e5f5a5b5c5'::UUID,
    'Instalación de faenas',
    'subcontract',
    'Instalación completa de faenas provisionales',
    0.000, -- quantity = 0 (pending assignment)
    'gl',
    8500000.00, -- unit_cost (estimated global cost)
    10000000.00, -- unit_price (with margin)
    'apu-0005-0000-0000-0000-000000000001'::UUID,
    'manual',
    1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 7: VERIFICATION QUERIES
-- ============================================================

-- Run these queries to verify the seed was successful:
-- SELECT * FROM companies WHERE name = 'Constructora Demo SpA';
-- SELECT * FROM projects WHERE name = 'Edificio Piloto';
-- SELECT * FROM apu_templates ORDER BY name;
-- SELECT i.name, i.quantity, i.unit, i.unit_cost, i.unit_price FROM items i JOIN stages s ON i.stage_id = s.id JOIN budgets b ON s.budget_id = b.id WHERE b.project_id = 'b1c2d3e4-f5a6-7890-bcde-f12345678901'::UUID;

-- ============================================================
-- END OF SEED SCRIPT
-- ============================================================