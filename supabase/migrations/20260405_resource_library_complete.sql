-- ============================================================
-- Master Construction Resource Library (Global - todas las cuentas)
-- Date: 2026-04-05
-- Purpose: Biblioteca completa de recursos construcción chilena
-- ============================================================

DO $$
DECLARE
  -- Unit lookups
  u_m3 UUID := (SELECT id FROM units WHERE symbol = 'm3' LIMIT 1);
  u_m2 UUID := (SELECT id FROM units WHERE symbol = 'm2' LIMIT 1);
  u_ml UUID := (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1);
  u_un UUID := (SELECT id FROM units WHERE symbol = 'un' LIMIT 1);
  u_gl UUID := (SELECT id FROM units WHERE symbol = 'gl' LIMIT 1);
  u_kg UUID := (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1);
  u_dia UUID := (SELECT id FROM units WHERE symbol = 'día' LIMIT 1);
  u_hr UUID := (SELECT id FROM units WHERE symbol = 'hr' LIMIT 1);
  
  -- Resource lookups for APUs
  r_helper UUID;
  r_worker UUID;
  r_carpenter UUID;
  r_painter UUID;
  r_electrician UUID;
  r_gasfiter UUID;
  r_ceramist UUID;
  r_capatace UUID;
  
  -- Template ID
  t_id UUID;
BEGIN

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: ÁRIDOS Y TIERRAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Arena estuco', 'material', u_m3, 28500, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Arena hormigón', 'material', u_m3, 25000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Arena de planta', 'material', u_m3, 32000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Gravilla 3/4"', 'material', u_m3, 35000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Grava 1 1/2"', 'material', u_m3, 33000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maicillo grueso', 'material', u_m3, 18000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tierra de hoja', 'material', u_m3, 45000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Relleno de estabilizado', 'material', u_m3, 22000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Bolón desplazador', 'material', u_m3, 42000, 'Áridos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tierra vegetal', 'material', u_m3, 38000, 'Áridos')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: CEMENTOS Y HORMIGONES
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cemento Especial 42.5 kg', 'material', u_kg, 850, 'Cementos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cemento Alta Resistencia 25 kg', 'material', u_kg, 680, 'Cementos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cal Hidráulica 20 kg', 'material', u_kg, 580, 'Cementos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Yeso Cartón 25 kg', 'material', u_kg, 720, 'Cementos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Hormigón premezclado H20', 'material', u_m3, 88000, 'Hormigones')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Hormigón premezclado H25', 'material', u_m3, 95000, 'Hormigones')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Hormigón premezclado H30', 'material', u_m3, 105000, 'Hormigones')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Hormigón premezclado H35', 'material', u_m3, 115000, 'Hormigones')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Mortero listo 25kg', 'material', u_kg, 1200, 'Cementos')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: ACEROS Y FIERROS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø8mm x 6m', 'material', u_kg, 1200, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø10mm x 6m', 'material', u_kg, 1180, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø12mm x 6m', 'material', u_kg, 1180, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø16mm x 6m', 'material', u_kg, 1150, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø18mm x 6m', 'material', u_kg, 1150, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø22mm x 6m', 'material', u_kg, 1150, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fierro estriado Ø25mm x 6m', 'material', u_kg, 1150, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Malla ACMA C-92 (2.6x4.8m)', 'material', u_m2, 45000, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Malla ACMA C-139 (2.6x4.8m)', 'material', u_m2, 58000, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Malla ACMA C-196 (2.6x4.8m)', 'material', u_m2, 72000, 'Aceros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Alambre negro N°18', 'material', u_kg, 2800, 'Ferretería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Alambre galvanizado 1.2mm', 'material', u_kg, 3200, 'Ferretería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Grampas fierro 2x30', 'material', u_kg, 3500, 'Ferretería')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: DRYWALL Y TABIQUERÍA
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Volcanita ST 10mm 1.2x2.4', 'material', u_m2, 8500, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Volcanita ST 12.5mm 1.2x2.4', 'material', u_m2, 9800, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Volcanita RH 12.5mm 1.2x2.4', 'material', u_m2, 12800, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Volcanita RF 15mm 1.2x2.4', 'material', u_m2, 15500, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Perfil Metalcon Montante 60x38x0.5', 'material', u_ml, 4500, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Perfil Metalcon Montante 90x38x0.5', 'material', u_ml, 5800, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Perfil Metalcon Canal 62x28x0.5', 'material', u_ml, 3800, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Perfil Metalcon Canal 92x28x0.5', 'material', u_ml, 4800, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cinta Junta Invisible 75m', 'material', u_ml, 5200, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Masilla Base para Juntas 25kg', 'material', u_kg, 18500, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tornillo drywall 25mm x 100', 'material', u_un, 50, 'Tabiquería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tornillo drywall 35mm x 100', 'material', u_un, 60, 'Tabiquería')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: AISLACIÓN
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Lana de Vidrio e=50mm Rollo 14.4m2', 'material', u_m2, 25000, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Lana de Vidrio e=75mm Rollo 11.5m2', 'material', u_m2, 32000, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Lana Mineral e=50mm Rollo 12m2', 'material', u_m2, 45000, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Poliestireno expandido 20mm', 'material', u_m2, 8500, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Poliestireno expandido 30mm', 'material', u_m2, 12000, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fieltro asfáltico 15lb', 'material', u_m2, 3200, 'Aislación')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Membrana impermeable 3mm', 'material', u_m2, 8500, 'Aislación')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: ALBAÑILERÍA
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ladrillo Princesa 29x14x7cm', 'material', u_un, 550, 'Albañilería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ladrillo fiscal 30x14x7cm', 'material', u_un, 480, 'Albañilería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Bloque cemento 19x19x39cm', 'material', u_un, 850, 'Albañilería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Adoquín concreto 20x10x6cm', 'material', u_un, 680, 'Albañilería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ladrillo vitroblock 19x19x39', 'material', u_un, 1500, 'Albañilería')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: TERMINACIONES - PAVIMENTOS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cerámica piso 33x33', 'material', u_m2, 6500, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cerámica piso 45x45', 'material', u_m2, 8500, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Porcelanato 60x60', 'material', u_m2, 14500, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Porcelanato 80x80', 'material', u_m2, 22000, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Piso flotante 8mm AC3', 'material', u_m2, 9800, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Piso vinílico 2.5mm', 'material', u_m2, 12000, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Granito 2cm pulido', 'material', u_m2, 45000, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Adhesivo cerámico 25kg', 'material', u_kg, 4500, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fragüe color 1kg', 'material', u_kg, 2800, 'Pavimentos')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Sello两道防潮剂', 'material', u_kg, 5500, 'Pavimentos')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: TERMINACIONES - MUROS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pasta muro interior 20kg', 'material', u_kg, 12500, 'Muros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pasta muro exterior 20kg', 'material', u_kg, 18000, 'Muros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Juntaoplast 15kg', 'material', u_kg, 15000, 'Muros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Redimix 25kg', 'material', u_kg, 8500, 'Muros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cornisa PVC 2"', 'material', u_ml, 2500, 'Muros')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Marquesina PVC 4"', 'material', u_ml, 4500, 'Muros')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: PINTURAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Látex Extracubriente 1gal', 'material', u_gl, 22000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Látex económico 1gal', 'material', u_gl, 15000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Esmalte al agua 1gal', 'material', u_gl, 25000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Esmalte sintetico 1gal', 'material', u_gl, 28000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Fondojateador 1gal', 'material', u_gl, 18000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Imprimante acrilico 1gal', 'material', u_gl, 15000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Barniz marine 1gal', 'material', u_gl, 35000, 'Pinturas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Diluyente celular 1gl', 'material', u_gl, 12000, 'Pinturas')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: INSTALACIONES SANITARIAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tubo PVC sanitario 110mm x 6m', 'material', u_ml, 28000, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tubo PVC sanitario 75mm x 6m', 'material', u_ml, 18500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tubo PVC sanitario 40mm x 6m', 'material', u_ml, 9500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tubo PVC sanitario 110mm x 3m', 'material', u_ml, 15000, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Codo PVC 110mm x 90°', 'material', u_un, 2500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Codo PVC 110mm x 45°', 'material', u_un, 2200, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Yee PVC 110mm', 'material', u_un, 3500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tee PVC 110mm', 'material', u_un, 3800, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Sifón PVC 110mm', 'material', u_un, 4500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Rejilla piso PVC 110mm', 'material', u_un, 3500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Adhesivo PVC 250cc', 'material', u_un, 4500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cinta teflón 18mm x 20m', 'material', u_un, 1500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pegamento limpiador PVC', 'material', u_un, 3500, 'Sanitario')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ladrillo sanitario', 'material', u_un, 850, 'Sanitario')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: INSTALACIONES ELÉCTRICAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cable eléctrico 1.5mm2 (100m)', 'material', u_ml, 280, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cable eléctrico 2.5mm2 (100m)', 'material', u_ml, 420, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cable eléctrico 4mm2 (100m)', 'material', u_ml, 650, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cable eléctrico 6mm2 (100m)', 'material', u_ml, 950, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cable coaxial 5C 100m', 'material', u_ml, 350, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ducto conduit 20mm x 3m', 'material', u_ml, 2200, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ducto conduit 25mm x 3m', 'material', u_ml, 3200, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Caja derivación embutida', 'material', u_un, 450, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Caja derivación superficial', 'material', u_un, 850, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Interruptor simple', 'material', u_un, 3500, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Interruptor doble', 'material', u_un, 4500, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Enchufe hembra 10A', 'material', u_un, 2800, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Enchufe hembra 16A', 'material', u_un, 3800, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tablero eléctrico 12 mod', 'material', u_un, 18500, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tablero eléctrico 24 mod', 'material', u_un, 35000, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Automatismo 10A', 'material', u_un, 8500, 'Eléctrico')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Diferencial 30mA', 'material', u_un, 15000, 'Eléctrico')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: CARPINTERÍA
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Puerta MDF 0.80x2.10', 'material', u_un, 65000, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Puerta MDF 0.90x2.10', 'material', u_un, 72000, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ventana aluminio 1.20x1.20', 'material', u_un, 95000, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ventana aluminio 1.50x1.20', 'material', u_un, 125000, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Marco puerta pino 3"', 'material', u_ml, 3500, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Marco ventana pino 2"', 'material', u_ml, 2800, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Vidrio float 4mm', 'material', u_m2, 8500, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Vidrio laminado 6mm', 'material', u_m2, 15000, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Silicona neutra 300cc', 'material', u_un, 4500, 'Carpintería')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Burletes goma', 'material', u_ml, 1500, 'Carpintería')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: CUBIERTAS Y TECHUMBRES
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Teja colonial arcilla', 'material', u_un, 18000, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Teja metálica Zincalum', 'material', u_m2, 12000, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plancha Zincalum 0.5mm', 'material', u_m2, 8500, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Tornillo autoperforante 14g', 'material', u_un, 350, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Sellante polyurethane 300cc', 'material', u_un, 5500, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Cumbrera teja colonial', 'material', u_ml, 5500, 'Cubiertas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Alero volado 60cm', 'material', u_ml, 8500, 'Cubiertas')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MATERIALES: MADERAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pino 2x4"x3.2m', 'material', u_ml, 4500, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pino 2x6"x3.2m', 'material', u_ml, 6800, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pino 2x8"x3.2m', 'material', u_ml, 9200, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Pino 1x6"x3.2m', 'material', u_ml, 3200, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Terciado estructurales 12mm', 'material', u_m2, 24000, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Terciado tradicionales 15mm', 'material', u_m2, 32000, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Puntal pino 3"x3m', 'material', u_un, 8500, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Costanera pino 2x2"x3.6m', 'material', u_ml, 2800, 'Maderas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Liq desmoldante 20L', 'material', u_gl, 25000, 'Maderas')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- MANO DE OBRA
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Jornal / Peón', 'labor', u_dia, 38000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ayudante técnico', 'labor', u_dia, 48000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro albañil 1a', 'labor', u_dia, 68000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro carpintero 1a', 'labor', u_dia, 65000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro enfierrador 1a', 'labor', u_dia, 62000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro gásfiter 1a', 'labor', u_dia, 75000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro electricista SEC', 'labor', u_dia, 78000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro pintor 1a', 'labor', u_dia, 58000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Instalador cerámico', 'labor', u_dia, 65000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro techador', 'labor', u_dia, 70000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Maestro instalador drywall', 'labor', u_dia, 62000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Capataz general', 'labor', u_dia, 85000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Ingeniero residente', 'labor', u_dia, 150000, 'Personal')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Supervisor de obra', 'labor', u_dia, 95000, 'Personal')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- EQUIPOS Y MAQUINARIAS
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Betonera 150L', 'equipment', u_hr, 6500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Vibrador de inmersión 2"', 'equipment', u_hr, 8500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Sierra circular 7"', 'equipment', u_hr, 5500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Esmeril angular 4"', 'equipment', u_hr, 4500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Taladro percutor', 'equipment', u_hr, 3500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Compresor neumáutico', 'equipment', u_hr, 12000, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Andamio tubular cuerpo', 'equipment', u_dia, 1500, 'Herramientas')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Plataforma telescópica', 'equipment', u_dia, 45000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Retroexcavadora', 'equipment', u_hr, 45000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Camión tolva 12m3', 'equipment', u_hr, 52000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Grúa torre 8 ton', 'equipment', u_hr, 85000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Montacarga 3 ton', 'equipment', u_hr, 35000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Placa compactadora 90kg', 'equipment', u_hr, 12500, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Rodillo compactador', 'equipment', u_hr, 25000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Hormigonera 350L', 'equipment', u_hr, 8500, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Generador eléctrico 5kW', 'equipment', u_hr, 12000, 'Maquinaria')
  ON CONFLICT DO NOTHING;
  INSERT INTO resources (name, type, unit_id, base_price, category) VALUES
  ('Soldadora eléctrica', 'equipment', u_hr, 6500, 'Maquinaria')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════
  -- APU TEMPLATES (Precios base - se actualizan con costos empresa)
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Obtener IDs de recursos para APUs
  r_helper := (SELECT id FROM resources WHERE name = 'Jornal / Peón' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_worker := (SELECT id FROM resources WHERE name = 'Maestro albañil 1a' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_carpenter := (SELECT id FROM resources WHERE name = 'Maestro carpintero 1a' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_painter := (SELECT id FROM resources WHERE name = 'Maestro pintor 1a' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_electrician := (SELECT id FROM resources WHERE name = 'Maestro electricista SEC' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_gasfiter := (SELECT id FROM resources WHERE name = 'Maestro gásfiter 1a' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_ceramist := (SELECT id FROM resources WHERE name = 'Instalador cerámico' AND type = 'labor' AND company_id IS NULL LIMIT 1);
  r_capatace := (SELECT id FROM resources WHERE name = 'Capataz general' AND type = 'labor' AND company_id IS NULL LIMIT 1);

  -- 1. Excavación manual
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Excavación de zanjas a mano', u_m3, 'Movimiento de Tierras', 'Excavación manual en terreno natural, prof. hasta 1.5m')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 1.00)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. Relleno compactado
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Relleno compactado con material existente', u_m3, 'Movimiento de Tierras', 'Relleno y compactación en capas de 20cm')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.60)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Placa compactadora 90kg' AND company_id IS NULL LIMIT 1), 'equipment', 0.15)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Cimiento ciclópeo H15
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Cimiento hormigón ciclópeo H15', u_m3, 'Fundaciones', 'Cimiento con 20% bolón desplazador, incluye moldaje')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.30)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.80)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Hormigón premezclado H20' AND company_id IS NULL LIMIT 1), 'material', 0.85)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Bolón desplazador' AND company_id IS NULL LIMIT 1), 'material', 0.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Betonera 150L' AND company_id IS NULL LIMIT 1), 'equipment', 0.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Vibrador de inmersión 2"' AND company_id IS NULL LIMIT 1), 'equipment', 0.20)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Sobrecimiento de hormigón
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Sobrecimiento H20 30cm', u_ml, 'Fundaciones', 'Sobrecimiento de 30cm de ancho, moldaje y hormigonado')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.25)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.50)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_capatace, 'labor', 0.05)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Hormigón premezclado H25' AND company_id IS NULL LIMIT 1), 'material', 0.04)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Pino 2x6"x3.2m' AND company_id IS NULL LIMIT 1), 'material', 0.08)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Radier H20
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Radier H20 e=10cm', u_m2, 'Pavimentos', 'Radier de 10cm con mallazo ACMA')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.25)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.40)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Hormigón premezclado H20' AND company_id IS NULL LIMIT 1), 'material', 0.11)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Malla ACMA C-92 (2.6x4.8m)' AND company_id IS NULL LIMIT 1), 'material', 0.18)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Betonera 150L' AND company_id IS NULL LIMIT 1), 'equipment', 0.25)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. Muro ladrillo princesa
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Muro ladrillo princesa soga', u_m2, 'Obra Gruesa', 'Muro de ladrillo princesa al hilo, incluye mortero y fragüe')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.55)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.35)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Ladrillo Princesa 29x14x7cm' AND company_id IS NULL LIMIT 1), 'material', 65)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Mortero listo 25kg' AND company_id IS NULL LIMIT 1), 'material', 0.15)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. Muro bloque cemento
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Muro bloque cemento 19cm', u_m2, 'Obra Gruesa', 'Muro de bloque de cemento 19x19x39')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.45)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.40)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Bloque cemento 19x19x39cm' AND company_id IS NULL LIMIT 1), 'material', 13)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Mortero listo 25kg' AND company_id IS NULL LIMIT 1), 'material', 0.18)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 8. Emplantillado
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Emplantillado cemento', u_m2, 'Obra Gruesa', 'Emplantillado de cemento 2cm')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.15)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cemento Especial 42.5 kg' AND company_id IS NULL LIMIT 1), 'material', 0.08)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Arena hormigón' AND company_id IS NULL LIMIT 1), 'material', 0.015)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 9. Tabique drywall interior
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Tabique Volcanita ST 2 caras', u_m2, 'Tabiquería', 'Tabique estructura Metalcon, Volcanita ST ambas caras, incluye Pasta muro')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Maestro instalador drywall' AND company_id IS NULL LIMIT 1), 'labor', 0.35)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Ayudante técnico' AND company_id IS NULL LIMIT 1), 'labor', 0.25)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Perfil Metalcon Montante 60x38x0.5' AND company_id IS NULL LIMIT 1), 'material', 0.80)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Perfil Metalcon Canal 62x28x0.5' AND company_id IS NULL LIMIT 1), 'material', 0.70)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Plancha Volcanita ST 12.5mm 1.2x2.4' AND company_id IS NULL LIMIT 1), 'material', 2.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Pasta muro interior 20kg' AND company_id IS NULL LIMIT 1), 'material', 0.25)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cinta Junta Invisible 75m' AND company_id IS NULL LIMIT 1), 'material', 0.15)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Tornillo drywall 35mm x 100' AND company_id IS NULL LIMIT 1), 'material', 8)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. Tabique volcanita con aislación
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Tabique Volcanita ST 2 caras c/aislación', u_m2, 'Tabiquería', 'Tabique con Lana de Vidrio e=50mm')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Maestro instalador drywall' AND company_id IS NULL LIMIT 1), 'labor', 0.40)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Ayudante técnico' AND company_id IS NULL LIMIT 1), 'labor', 0.30)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Perfil Metalcon Montante 60x38x0.5' AND company_id IS NULL LIMIT 1), 'material', 0.85)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Perfil Metalcon Canal 62x28x0.5' AND company_id IS NULL LIMIT 1), 'material', 0.75)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Plancha Volcanita ST 12.5mm 1.2x2.4' AND company_id IS NULL LIMIT 1), 'material', 2.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Lana de Vidrio e=50mm Rollo 14.4m2' AND company_id IS NULL LIMIT 1), 'material', 1.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Pasta muro interior 20kg' AND company_id IS NULL LIMIT 1), 'material', 0.30)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cinta Junta Invisible 75m' AND company_id IS NULL LIMIT 1), 'material', 0.18)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 11. Ceramico piso 45x45
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Cerámica piso 45x45', u_m2, 'Pavimentos', 'Cerámica 45x45 con adhesivo y fragüe')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_ceramist, 'labor', 0.45)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cerámica piso 45x45' AND company_id IS NULL LIMIT 1), 'material', 1.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Adhesivo cerámico 25kg' AND company_id IS NULL LIMIT 1), 'material', 0.12)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Fragüe color 1kg' AND company_id IS NULL LIMIT 1), 'material', 0.08)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 12. Porcelanato 60x60
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Porcelanato 60x60', u_m2, 'Pavimentos', 'Porcelanato rectificado con adhesivo y fragüe')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_ceramist, 'labor', 0.55)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.25)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Porcelanato 60x60' AND company_id IS NULL LIMIT 1), 'material', 1.05)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Adhesivo cerámico 25kg' AND company_id IS NULL LIMIT 1), 'material', 0.14)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Fragüe color 1kg' AND company_id IS NULL LIMIT 1), 'material', 0.06)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 13. Pintura látex muros
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Pintura látex muros 2 manos', u_m2, 'Pinturas', 'Látex extracubriente 2 manos sobre pasta muros')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_painter, 'labor', 0.08)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Látex Extracubriente 1gal' AND company_id IS NULL LIMIT 1), 'material', 0.12)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Fondojateador 1gal' AND company_id IS NULL LIMIT 1), 'material', 0.05)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 14. Pintura látex cielo
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Pintura látex cielo', u_m2, 'Pinturas', 'Látex para cielos 2 manos')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_painter, 'labor', 0.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Látex Extracubriente 1gal' AND company_id IS NULL LIMIT 1), 'material', 0.10)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Fondojateador 1gal' AND company_id IS NULL LIMIT 1), 'material', 0.04)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 15. Instalación sanitaria base
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Red sanitaria PVC 110mm', u_ml, 'Instalaciones', 'Tubo sanitario 110mm incluyendo fittings')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_gasfiter, 'labor', 0.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Tubo PVC sanitario 110mm x 6m' AND company_id IS NULL LIMIT 1), 'material', 0.18)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Codo PVC 110mm x 90°' AND company_id IS NULL LIMIT 1), 'material', 0.15)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Adhesivo PVC 250cc' AND company_id IS NULL LIMIT 1), 'material', 0.05)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 16. Instalación eléctrica básica
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Red eléctrica embutida', u_ml, 'Instalaciones', 'Ductos y cables 2.5mm2')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_electrician, 'labor', 0.15)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Ducto conduit 20mm x 3m' AND company_id IS NULL LIMIT 1), 'material', 0.35)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cable eléctrico 2.5mm2 (100m)' AND company_id IS NULL LIMIT 1), 'material', 0.12)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Caja derivación embutida' AND company_id IS NULL LIMIT 1), 'material', 0.10)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 17. Ventana aluminio
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Ventana aluminio 1.20x1.20', u_un, 'Carpintería', 'Ventana aluminio con vidrio 4mm')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_carpenter, 'labor', 1.50)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Ventana aluminio 1.20x1.20' AND company_id IS NULL LIMIT 1), 'material', 1.00)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Silicona neutra 300cc' AND company_id IS NULL LIMIT 1), 'material', 0.50)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 18. Puerta MDF
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Puerta MDF 0.90x2.10 con marco', u_un, 'Carpintería', 'Puerta MDF con marco pino')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_carpenter, 'labor', 1.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Puerta MDF 0.90x2.10' AND company_id IS NULL LIMIT 1), 'material', 1.00)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Marco puerta pino 3"' AND company_id IS NULL LIMIT 1), 'material', 2.50)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Silicona neutra 300cc' AND company_id IS NULL LIMIT 1), 'material', 0.30)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 19. Cubierta techo metálico
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Cubierta Zincalum 0.5mm', u_m2, 'Cubiertas', 'Plancha Zincalum con tornillos')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.12)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Maestro techador' AND company_id IS NULL LIMIT 1), 'labor', 0.05)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Plancha Zincalum 0.5mm' AND company_id IS NULL LIMIT 1), 'material', 1.15)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Tornillo autoperforante 14g' AND company_id IS NULL LIMIT 1), 'material', 4)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Sellante polyurethane 300cc' AND company_id IS NULL LIMIT 1), 'material', 0.08)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 20. Estuco exterior
  INSERT INTO apu_templates (name, unit_id, category, description) 
  VALUES ('Estuco exterior 2cm', u_m2, 'Terminaciones', 'Estuco de cemento 2cm con malla')
  ON CONFLICT DO NOTHING
  RETURNING id INTO t_id;
  IF t_id IS NOT NULL THEN
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_worker, 'labor', 0.35)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, r_helper, 'labor', 0.20)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Arena estuco' AND company_id IS NULL LIMIT 1), 'material', 0.035)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Cemento Especial 42.5 kg' AND company_id IS NULL LIMIT 1), 'material', 0.015)
    ON CONFLICT DO NOTHING;
    INSERT INTO apu_resources (apu_id, resource_id, resource_type, coefficient) VALUES
    (t_id, (SELECT id FROM resources WHERE name = 'Malla ACMA C-92 (2.6x4.8m)' AND company_id IS NULL LIMIT 1), 'material', 0.12)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Resource Library seeded successfully!';
END $$;
