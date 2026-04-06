-- Insert Base Units
INSERT INTO units (symbol, name, category) SELECT 'ml', 'Metro Lineal', 'length' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'ml');
INSERT INTO units (symbol, name, category) SELECT 'm2', 'Metro Cuadrado', 'area' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'm2');
INSERT INTO units (symbol, name, category) SELECT 'm3', 'Metro Cúbico', 'volume' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'm3');
INSERT INTO units (symbol, name, category) SELECT 'L', 'Litro', 'volume' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'L');
INSERT INTO units (symbol, name, category) SELECT 'kg', 'Kilogramo', 'weight' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'kg');
INSERT INTO units (symbol, name, category) SELECT 'saco', 'Saco / Bolsa', 'unit' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'saco');
INSERT INTO units (symbol, name, category) SELECT 'un', 'Unidad', 'unit' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'un');
INSERT INTO units (symbol, name, category) SELECT 'glb', 'Global', 'global' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'glb');
INSERT INTO units (symbol, name, category) SELECT 'hr', 'Hora', 'time' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'hr');
INSERT INTO units (symbol, name, category) SELECT 'dia', 'Día', 'time' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'dia');
INSERT INTO units (symbol, name, category) SELECT 'mes', 'Mes', 'time' WHERE NOT EXISTS (SELECT 1 FROM units WHERE symbol = 'mes');

-- Insert Global Resources
-- CTE is not needed if we do UPSERT based on name and company_id, but name is NOT unique globally.
-- Wait, we can just delete global resources/apus to do a clean recreate, or just insert them if they don't exist.

DO $$
DECLARE
  v_hr_id UUID;
  v_saco_id UUID;
  v_m3_id UUID;
  v_m2_id UUID;
  v_kg_id UUID;
  v_un_id UUID;
  v_dia_id UUID;
  v_glb_id UUID;
  v_ml_id UUID;

  -- Res IDs
  r_maestro_albanil UUID;
  r_ayudante UUID;
  r_maestro_carpintero UUID;
  r_maestro_enfierrador UUID;
  r_maestro_pintor UUID;
  r_maestro_electrico UUID;
  r_maestro_gafiter UUID;
  r_supervisor UUID;

  r_cemento UUID;
  r_arena_fina UUID;
  r_arena_gruesa UUID;
  r_gravilla UUID;
  r_hormigon_h20 UUID;
  r_acero_12mm UUID;
  r_acero_8mm UUID;
  r_madera_pino UUID;
  r_osb UUID;
  r_ladrillo_titan UUID;
  r_ladrillo_princesa UUID;
  r_mortero_pega UUID;

  r_pintura_esmalte UUID;
  r_pintura_latex UUID;
  r_pasta_muro UUID;
  r_ceramica_40x40 UUID;
  r_adhesivo_ceramico UUID;
  r_yeso_carton_std UUID;
  r_yeso_carton_rh UUID;
  r_montante UUID;

  r_tuberia_sanitaria UUID;
  r_cable_thhn UUID;
  r_tuberia_conduit UUID;
  r_caja_derivacion UUID;
  r_modulo_enchufe UUID;

  r_hormigonera UUID;
  r_vibrador UUID;
  r_herramientas UUID;
  r_andamio UUID;

  -- APU IDs
  a_excavacion UUID;
  a_hormigon_sobrecimientos UUID;
  a_muro_ladrillo UUID;
  a_estuco_interior UUID;
  a_enfierradura_losa UUID;
  a_tabiqueria_yeso UUID;
  a_ceramica_piso UUID;
  a_pintura_latex UUID;
  a_enchufe_doble UUID;
  a_tuberia_alcantarillado UUID;

BEGIN
  -- Get unit IDs
  SELECT id INTO v_hr_id FROM units WHERE symbol = 'hr';
  SELECT id INTO v_saco_id FROM units WHERE symbol = 'saco';
  SELECT id INTO v_m3_id FROM units WHERE symbol = 'm3';
  SELECT id INTO v_m2_id FROM units WHERE symbol = 'm2';
  SELECT id INTO v_kg_id FROM units WHERE symbol = 'kg';
  SELECT id INTO v_un_id FROM units WHERE symbol = 'un';
  SELECT id INTO v_dia_id FROM units WHERE symbol = 'dia';
  SELECT id INTO v_glb_id FROM units WHERE symbol = 'glb';
  SELECT id INTO v_ml_id FROM units WHERE symbol = 'ml';

  -- Ensure clean state for global APUs and their resources to avoid duplication
  -- THIS ONLY TOUCHES company_id IS NULL globals!
  DELETE FROM apu_resources WHERE apu_id IN (SELECT id FROM apu_templates WHERE company_id IS NULL);
  DELETE FROM apu_templates WHERE company_id IS NULL;
  DELETE FROM resources WHERE company_id IS NULL;

  -- Insert Resources and save IDs
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Albañil', 'labor', v_hr_id, 6500, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_albanil;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Ayudante General', 'labor', v_hr_id, 4500, 'Mano de Obra', NULL) RETURNING id INTO r_ayudante;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Carpintero', 'labor', v_hr_id, 6500, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_carpintero;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Enfierrador', 'labor', v_hr_id, 6500, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_enfierrador;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Pintor', 'labor', v_hr_id, 6000, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_pintor;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Eléctrico', 'labor', v_hr_id, 7000, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_electrico;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Maestro Gafíter', 'labor', v_hr_id, 7000, 'Mano de Obra', NULL) RETURNING id INTO r_maestro_gafiter;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Supervisor Técnico', 'labor', v_hr_id, 10000, 'Mano de Obra Especializada', NULL) RETURNING id INTO r_supervisor;

  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Cemento Portland (Saco de 25kg)', 'material', v_saco_id, 4500, 'Obra Gruesa', NULL) RETURNING id INTO r_cemento;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Arena Fina', 'material', v_m3_id, 18000, 'Obra Gruesa', NULL) RETURNING id INTO r_arena_fina;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Arena Gruesa', 'material', v_m3_id, 16000, 'Obra Gruesa', NULL) RETURNING id INTO r_arena_gruesa;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Gravilla', 'material', v_m3_id, 18000, 'Obra Gruesa', NULL) RETURNING id INTO r_gravilla;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Hormigón Premezclado H20', 'material', v_m3_id, 85000, 'Obra Gruesa', NULL) RETURNING id INTO r_hormigon_h20;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Acero Estructural A630 (Barras 12mm)', 'material', v_kg_id, 1200, 'Enfierradura', NULL) RETURNING id INTO r_acero_12mm;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Acero Estructural A630 (Barras 8mm)', 'material', v_kg_id, 1200, 'Enfierradura', NULL) RETURNING id INTO r_acero_8mm;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Madera Pino Bruto 2x4" x 3.2m', 'material', v_un_id, 3500, 'Obra Gruesa', NULL) RETURNING id INTO r_madera_pino;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Panel OSB 15mm 1.22x2.44m', 'material', v_un_id, 14500, 'Obra Gruesa', NULL) RETURNING id INTO r_osb;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Ladrillo Titán', 'material', v_un_id, 360, 'Albañilería', NULL) RETURNING id INTO r_ladrillo_titan;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Ladrillo Princesa', 'material', v_un_id, 420, 'Albañilería', NULL) RETURNING id INTO r_ladrillo_princesa;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Mortero Pega Predosificado 25kg', 'material', v_saco_id, 3200, 'Albañilería', NULL) RETURNING id INTO r_mortero_pega;

  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Pintura Esmalte al Agua (Tinetta 15L)', 'material', v_un_id, 45000, 'Terminaciones', NULL) RETURNING id INTO r_pintura_esmalte;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Pintura Látex Interior (Tinetta 15L)', 'material', v_un_id, 38000, 'Terminaciones', NULL) RETURNING id INTO r_pintura_latex;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Pasta Muro Interior (Tineta 25kg)', 'material', v_un_id, 18000, 'Terminaciones', NULL) RETURNING id INTO r_pasta_muro;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Cerámica de Piso 40x40cm (Caja 2m2)', 'material', v_un_id, 14000, 'Revestimientos', NULL) RETURNING id INTO r_ceramica_40x40;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Adhesivo Cerámico Polvo 25kg', 'material', v_saco_id, 4500, 'Revestimientos', NULL) RETURNING id INTO r_adhesivo_ceramico;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Yeso Cartón Standard 15mm 1.22x2.44m', 'material', v_un_id, 6800, 'Tabiquería', NULL) RETURNING id INTO r_yeso_carton_std;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Yeso Cartón RH 15mm 1.22x2.44m', 'material', v_un_id, 9800, 'Tabiquería', NULL) RETURNING id INTO r_yeso_carton_rh;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Montante 60mmx3m x0.85', 'material', v_un_id, 2500, 'Tabiquería', NULL) RETURNING id INTO r_montante;

  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Tubería PVC Sanitario 110mm x 6m', 'material', v_un_id, 12000, 'Instalación Sanitaria', NULL) RETURNING id INTO r_tuberia_sanitaria;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Cable de Cobre THHN 12 AWG (100m)', 'material', v_un_id, 65000, 'Instalación Eléctrica', NULL) RETURNING id INTO r_cable_thhn;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Tubería Conduit PVC 20mm x 3m', 'material', v_un_id, 1200, 'Instalación Eléctrica', NULL) RETURNING id INTO r_tuberia_conduit;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Caja de Derivación Plástica Redonda', 'material', v_un_id, 500, 'Instalación Eléctrica', NULL) RETURNING id INTO r_caja_derivacion;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Módulo Enchufe Doble 10A Bticino', 'material', v_un_id, 3500, 'Instalación Eléctrica', NULL) RETURNING id INTO r_modulo_enchufe;

  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Hormigonera 150L (Arriendo Diario)', 'equipment', v_dia_id, 15000, 'Maquinaria Menor', NULL) RETURNING id INTO r_hormigonera;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Vibrador de Inmersión (Arriendo Diario)', 'equipment', v_dia_id, 18000, 'Maquinaria Menor', NULL) RETURNING id INTO r_vibrador;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Herramientas Menores', 'equipment', v_glb_id, 500, 'Herramientas', NULL) RETURNING id INTO r_herramientas;
  INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES 
  ('Andamio Metálico (Cuerpo x Día)', 'equipment', v_dia_id, 3500, 'Equipamiento Auxiliar', NULL) RETURNING id INTO r_andamio;

  -- Insert APU Templates
  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Excavación Manual Zanjas para Fundaciones', 'Excavación en terreno blando, hasta 1,5m de profundidad.', v_m3_id, 'Obras Previas y Excavaciones', NULL) RETURNING id INTO a_excavacion;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_excavacion, r_ayudante, 'labor', 3.5),
  (a_excavacion, r_herramientas, 'equipment', 1);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Hormigón Tipo H20 para Sobrecimientos', 'Hormigón preparado en obra H20 (175 kg/cm2). Incluye materiales y confección.', v_m3_id, 'Obra Gruesa - Hormigones', NULL) RETURNING id INTO a_hormigon_sobrecimientos;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_hormigon_sobrecimientos, r_cemento, 'material', 12),
  (a_hormigon_sobrecimientos, r_arena_gruesa, 'material', 0.5),
  (a_hormigon_sobrecimientos, r_gravilla, 'material', 0.8),
  (a_hormigon_sobrecimientos, r_maestro_albanil, 'labor', 1.5),
  (a_hormigon_sobrecimientos, r_ayudante, 'labor', 3),
  (a_hormigon_sobrecimientos, r_hormigonera, 'equipment', 0.25),
  (a_hormigon_sobrecimientos, r_vibrador, 'equipment', 0.25);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Muro de Albañilería Ladrillo Titán 14cm', 'Muro de albañilería tradicional soga, ladrillo tipo titán. Codos y tendeles con mortero premezclado.', v_m2_id, 'Obra Gruesa - Albañilería', NULL) RETURNING id INTO a_muro_ladrillo;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_muro_ladrillo, r_ladrillo_titan, 'material', 40),
  (a_muro_ladrillo, r_mortero_pega, 'material', 1.2),
  (a_muro_ladrillo, r_maestro_albanil, 'labor', 0.8),
  (a_muro_ladrillo, r_ayudante, 'labor', 0.8),
  (a_muro_ladrillo, r_herramientas, 'equipment', 1);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Estuco Interior Muros (Espesor 2.5cm)', 'Revoque grueso afina con mortero hecho en obra.', v_m2_id, 'Terminaciones - Revestimientos', NULL) RETURNING id INTO a_estuco_interior;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_estuco_interior, r_cemento, 'material', 0.35),
  (a_estuco_interior, r_arena_fina, 'material', 0.03),
  (a_estuco_interior, r_maestro_albanil, 'labor', 0.5),
  (a_estuco_interior, r_ayudante, 'labor', 0.5);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Enfierradura Refuerzo Losa A630', 'Instalación y dimensionado de enfierradura de losa, amarras.', v_kg_id, 'Obra Gruesa - Enfierradura', NULL) RETURNING id INTO a_enfierradura_losa;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_enfierradura_losa, r_acero_12mm, 'material', 1.05),
  (a_enfierradura_losa, r_maestro_enfierrador, 'labor', 0.05),
  (a_enfierradura_losa, r_ayudante, 'labor', 0.05);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Tabiquería Yeso Cartón 15mm 1 Cara', 'Tabique simple, montantes c/60cm, placa yeso cartón 15mm estándar.', v_m2_id, 'Terminaciones - Tabiquería', NULL) RETURNING id INTO a_tabiqueria_yeso;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_tabiqueria_yeso, r_yeso_carton_std, 'material', 0.35),
  (a_tabiqueria_yeso, r_montante, 'material', 0.7),
  (a_tabiqueria_yeso, r_maestro_carpintero, 'labor', 0.35),
  (a_tabiqueria_yeso, r_ayudante, 'labor', 0.35);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Cerámica de Piso 40x40cm', 'Provisión e instalación de cerámica de piso interior, pegamento estándar.', v_m2_id, 'Terminaciones - Pisos', NULL) RETURNING id INTO a_ceramica_piso;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_ceramica_piso, r_ceramica_40x40, 'material', 0.55),
  (a_ceramica_piso, r_adhesivo_ceramico, 'material', 0.15),
  (a_ceramica_piso, r_maestro_albanil, 'labor', 0.8),
  (a_ceramica_piso, r_ayudante, 'labor', 0.4);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Empaste y Pintura Interior Látex (2 manos)', 'Lijado, 1 mano de pasta muro completa, y 2 manos de látex.', v_m2_id, 'Terminaciones - Pintura', NULL) RETURNING id INTO a_pintura_latex;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_pintura_latex, r_pasta_muro, 'material', 0.04),
  (a_pintura_latex, r_pintura_latex, 'material', 0.015),
  (a_pintura_latex, r_maestro_pintor, 'labor', 0.25);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Instalación de Enchufe Doble Completo', 'Punto eléctrico incl. tubería conduit (6m), cable 12AWG (18m), caja y módulo Bticino.', v_un_id, 'Instalaciones - Eléctricas', NULL) RETURNING id INTO a_enchufe_doble;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_enchufe_doble, r_tuberia_conduit, 'material', 2),
  (a_enchufe_doble, r_cable_thhn, 'material', 0.18),
  (a_enchufe_doble, r_caja_derivacion, 'material', 1),
  (a_enchufe_doble, r_modulo_enchufe, 'material', 1),
  (a_enchufe_doble, r_maestro_electrico, 'labor', 1.5);


  INSERT INTO apu_templates (name, description, unit_id, category, company_id) VALUES 
  ('Tubería Matriz Alcantarillado PVC 110mm', 'Suministro e instalación de tubería 110mm por metro lineal en zanja superficial.', v_ml_id, 'Instalaciones - Sanitarias', NULL) RETURNING id INTO a_tuberia_alcantarillado;

  INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES 
  (a_tuberia_alcantarillado, r_tuberia_sanitaria, 'material', 0.17),
  (a_tuberia_alcantarillado, r_maestro_gafiter, 'labor', 0.25),
  (a_tuberia_alcantarillado, r_ayudante, 'labor', 0.25);

END $$;
