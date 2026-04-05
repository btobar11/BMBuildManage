-- ============================================================
-- Migration: Giant Global Resource & APU Library
-- Date: 2026-04-04
-- Purpose: Provide a comprehensive database of construction resources 
--          and APU templates organized by stages.
-- ============================================================

DO $$
DECLARE
  u_m3 UUID := (SELECT id FROM units WHERE symbol = 'm3' LIMIT 1);
  u_m2 UUID := (SELECT id FROM units WHERE symbol = 'm2' LIMIT 1);
  u_ml UUID := (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1);
  u_un UUID := (SELECT id FROM units WHERE symbol = 'un' LIMIT 1);
  u_gl UUID := (SELECT id FROM units WHERE symbol = 'gl' LIMIT 1);
  u_kg UUID := (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1);
  u_hr UUID := (SELECT id FROM units WHERE symbol = 'hr' LIMIT 1);
  u_dia UUID := (SELECT id FROM units WHERE symbol = 'día' LIMIT 1);
BEGIN

  -- PART 1: GLOBAL RESOURCES
  -- ------------------------------------------------------------
  
  -- Áridos y Tierras
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Arena estuco', 'material', u_m3, 28500, 'Áridos'),
  ('Arena hormigón', 'material', u_m3, 25000, 'Áridos'),
  ('Arena de planta', 'material', u_m3, 32000, 'Áridos'),
  ('Gravilla 3/4"', 'material', u_m3, 35000, 'Áridos'),
  ('Grava 1 1/2"', 'material', u_m3, 33000, 'Áridos'),
  ('Maicillo grueso', 'material', u_m3, 18000, 'Áridos'),
  ('Tierra de hoja', 'material', u_m3, 45000, 'Áridos'),
  ('Relleno de estabilizado', 'material', u_m3, 22000, 'Áridos'),
  ('Bolón desplazador', 'material', u_m3, 42000, 'Áridos');

  -- Cementos y Hormigones
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cemento Especial 42.5 kg', 'material', u_kg, 9800, 'Cementos'),
  ('Cemento Alta Resistencia 25 kg', 'material', u_kg, 7500, 'Cementos'),
  ('Cal Hidráulica 20 kg', 'material', u_kg, 6500, 'Cementos'),
  ('Yeso Cartón 25 kg', 'material', u_kg, 8200, 'Cementos'),
  ('Hormigón premezclado H20', 'material', u_m3, 88000, 'Hormigones'),
  ('Hormigón premezclado H25', 'material', u_m3, 95000, 'Hormigones'),
  ('Hormigón premezclado H30', 'material', u_m3, 105000, 'Hormigones'),
  ('Hormigón premezclado H35', 'material', u_m3, 115000, 'Hormigones');

  -- Aceros y Metales
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø8mm x 6m', 'material', u_kg, 1250, 'Aceros'),
  ('Fierro estriado Ø10mm x 6m', 'material', u_kg, 1200, 'Aceros'),
  ('Fierro estriado Ø12mm x 6m', 'material', u_kg, 1200, 'Aceros'),
  ('Fierro estriado Ø16mm x 6m', 'material', u_kg, 1180, 'Aceros'),
  ('Malla ACMA C-92 (2.6x4.8m)', 'material', u_m2, 45000, 'Aceros'),
  ('Malla ACMA C-139 (2.6x4.8m)', 'material', u_m2, 58000, 'Aceros'),
  ('Alambre negro N°18', 'material', u_kg, 2800, 'Aceros'),
  ('Clavo corriente 4"', 'material', u_kg, 3200, 'Ferretería');

  -- Drywall (Tabiquería)
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Volcanita ST 10mm 1.2x2.4', 'material', u_m2, 8500, 'Tabiquería'),
  ('Plancha Volcanita RH 12.5mm 1.2x2.4', 'material', u_m2, 12800, 'Tabiquería'),
  ('Perfil Metalcon Montante 60x38x0.5', 'material', u_ml, 4500, 'Tabiquería'),
  ('Perfil Metalcon Canal 62x28x0.5', 'material', u_ml, 3800, 'Tabiquería'),
  ('Cinta Junta Invisible 75m', 'material', u_ml, 5200, 'Tabiquería'),
  ('Masilla Base para Juntas 25kg', 'material', u_kg, 18500, 'Tabiquería'),
  ('Lana de Vidrio e=50mm Rollo 14.4m2', 'material', u_m2, 25000, 'Aislación');

  -- Instalaciones
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tubo PVC Sanitario 110mm x 6m', 'material', u_ml, 28000, 'Sanitario'),
  ('Tubo PVC Sanitario 75mm x 6m', 'material', u_ml, 18500, 'Sanitario'),
  ('Cable EVA 1.5mm² (Blanco)', 'material', u_ml, 550, 'Eléctrico'),
  ('Conduit PVC 20mm x 3m', 'material', u_ml, 2200, 'Eléctrico'),
  ('Caja de derivación embutida', 'material', u_un, 450, 'Eléctrico'),
  ('Porcelanato Beige 60x60', 'material', u_m2, 14500, 'Terminaciones'),
  ('Adhesivo Bekron AC 25kg', 'material', u_kg, 8500, 'Terminaciones'),
  ('Pintura Látex 1gl', 'material', u_gl, 25000, 'Pinturas');

  -- LABOR
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro albañil 1a', 'labor', u_dia, 68000, 'Personal'),
  ('Maestro carpintero 1a', 'labor', u_dia, 65000, 'Personal'),
  ('Maestro gásfiter 1a', 'labor', u_dia, 75000, 'Personal'),
  ('Maestro electricista 1a', 'labor', u_dia, 78000, 'Personal'),
  ('Maestro pintor 1a', 'labor', u_dia, 58000, 'Personal'),
  ('Instalador cerámico', 'labor', u_dia, 65000, 'Personal'),
  ('Jornal / Peón', 'labor', u_dia, 38000, 'Personal'),
  ('Capataz general', 'labor', u_dia, 85000, 'Personal');

  -- EQUIPMENT
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Retroexcavadora 4x4', 'equipment', u_hr, 35000, 'Maquinaria'),
  ('Camión Tolva 12m3', 'equipment', u_hr, 42000, 'Maquinaria'),
  ('Vibrador de inmersión 2"', 'equipment', u_hr, 8500, 'Herramientas'),
  ('Placa compactadora 90kg', 'equipment', u_hr, 12500, 'Herramientas'),
  ('Betonera 150L eléctrica', 'equipment', u_hr, 6500, 'Herramientas');

  -- PART 2: APU TEMPLATES
  -- ------------------------------------------------------------
  DECLARE
    m_cur_id UUID;
    r_helper_id UUID := (SELECT id FROM resources WHERE name = 'Jornal / Peón' AND company_id IS NULL LIMIT 1);
    r_worker_id UUID := (SELECT id FROM resources WHERE name = 'Maestro albañil 1a' AND company_id IS NULL LIMIT 1);
    r_carp_id UUID := (SELECT id FROM resources WHERE name = 'Maestro carpintero 1a' AND company_id IS NULL LIMIT 1);
    r_gasf_id UUID := (SELECT id FROM resources WHERE name = 'Maestro gásfiter 1a' AND company_id IS NULL LIMIT 1);
    r_elec_id UUID := (SELECT id FROM resources WHERE name = 'Maestro electricista 1a' AND company_id IS NULL LIMIT 1);
  BEGIN
    -- 1. Excavación a mano
    INSERT INTO apu_templates (name, unit_id, category, description) 
    VALUES ('Excavación de zanjas a mano', u_m3, 'Movimiento de Tierras', 'Excavación manual en terreno natural.')
    RETURNING id INTO m_cur_id;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (m_cur_id, r_helper_id, 'labor', 0.85);

    -- 2. Cimiento ciclópeo
    INSERT INTO apu_templates (name, unit_id, category, description) 
    VALUES ('Cimiento hormigón ciclópeo H15', u_m3, 'Fundaciones', 'Cimiento con 20% bolón desplazador.')
    RETURNING id INTO m_cur_id;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (m_cur_id, r_worker_id, 'labor', 0.25),
    (m_cur_id, r_helper_id, 'labor', 0.75);

    -- 3. Muro de albañilería
    INSERT INTO apu_templates (name, unit_id, category, description) 
    VALUES ('Muro Ladrillo Fiscal', u_m2, 'Obra Gruesa', 'Muro soga, incluye hilada.')
    RETURNING id INTO m_cur_id;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (m_cur_id, r_worker_id, 'labor', 0.45),
    (m_cur_id, r_helper_id, 'labor', 0.35);

    -- 4. Tabique Volcanita
    INSERT INTO apu_templates (name, unit_id, category, description) 
    VALUES ('Tabique Interior Volcanita', u_m2, 'Tabiquería', 'Estructura Metalcon, Volcanita ambas caras.')
    RETURNING id INTO m_cur_id;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (m_cur_id, r_carp_id, 'labor', 0.35),
    (m_cur_id, r_helper_id, 'labor', 0.25);

    -- 5. Pintura
    INSERT INTO apu_templates (name, unit_id, category, description) 
    VALUES ('Pintura Látex 3 manos', u_m2, 'Terminaciones', 'Preparación y aplicación en muros.')
    RETURNING id INTO m_cur_id;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (m_cur_id, (SELECT id FROM resources WHERE name = 'Maestro pintor 1a' AND company_id IS NULL LIMIT 1), 'labor', 0.12);
  END;

END $$;
