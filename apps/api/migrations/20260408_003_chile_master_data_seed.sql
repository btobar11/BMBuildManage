-- Migration: Chile Master Data Seed 2026
-- Created: 2026-04-08
-- Purpose: Seed global templates with Chilean construction standards and current market prices

-- Ensure we have the required units first
INSERT INTO units (id, name, symbol, abbreviation, type) VALUES
  ('m', 'Metro', 'm', 'm', 'length'),
  ('m2', 'Metro cuadrado', 'm²', 'm2', 'area'),
  ('m3', 'Metro cúbico', 'm³', 'm3', 'volume'),
  ('kg', 'Kilogramo', 'kg', 'kg', 'weight'),
  ('ton', 'Tonelada', 'ton', 'ton', 'weight'),
  ('dia', 'Día', 'día', 'día', 'time'),
  ('hr', 'Hora', 'hr', 'hr', 'time'),
  ('un', 'Unidad', 'un', 'un', 'unit'),
  ('lt', 'Litro', 'lt', 'lt', 'volume'),
  ('saco', 'Saco', 'saco', 'saco', 'unit')
ON CONFLICT (id) DO NOTHING;

-- 1. GLOBAL RESOURCE TEMPLATES - MATERIALES

-- Cemento y Aglomerantes
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, region_code, nch_standards) VALUES
('Cemento Especial MELÓN 25kg', 'material', 'saco', 'Cemento', 'Cemento especial alta resistencia para hormigones estructurales', 8500, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, 'CL-RM', ARRAY['NCh148']),
('Cemento Alta Resistencia POLPAICO 25kg', 'material', 'saco', 'Cemento', 'Cemento grado estructural para elementos de alta exigencia', 9200, true, ARRAY['civil_works', 'industrial'], 1, 'CL-RM', ARRAY['NCh148']),
('Cemento Corriente BIOBÍO 25kg', 'material', 'saco', 'Cemento', 'Cemento uso general para obras menores', 7800, true, ARRAY['residential', 'renovations'], 2, 'CL-BI', ARRAY['NCh148']),
('Cal Hidratada 25kg', 'material', 'saco', 'Cemento', 'Cal para morteros y estucos', 4500, true, ARRAY['residential', 'renovations'], 2, NULL, ARRAY['NCh721']);

-- Áridos
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, region_code) VALUES
('Arena Lavada de Río', 'material', 'm3', 'Áridos', 'Arena lavada para hormigones y morteros', 18000, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, NULL),
('Grava 20mm', 'material', 'm3', 'Áridos', 'Grava chancada tamaño 20mm para hormigones estructurales', 22000, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, NULL),
('Gravilla 10mm', 'material', 'm3', 'Áridos', 'Gravilla para hormigones especiales y pavimentos', 25000, true, ARRAY['civil_works'], 2, NULL),
('Ripio 40mm', 'material', 'm3', 'Áridos', 'Ripio para rellenos y fundaciones', 15000, true, ARRAY['residential', 'civil_works'], 2, NULL),
('Arena de Peña', 'material', 'm3', 'Áridos', 'Arena de peña para revoques y estucos', 16500, true, ARRAY['residential', 'renovations'], 2, NULL);

-- Fierro y Acero
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, seismic_zones, nch_standards) VALUES
('Fierro A630-420H Ø8mm', 'material', 'kg', 'Fierro', 'Fierro para hormigón armado diámetro 8mm', 1450, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh204']),
('Fierro A630-420H Ø10mm', 'material', 'kg', 'Fierro', 'Fierro para hormigón armado diámetro 10mm', 1420, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh204']),
('Fierro A630-420H Ø12mm', 'material', 'kg', 'Fierro', 'Fierro para hormigón armado diámetro 12mm', 1380, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh204']),
('Fierro A630-420H Ø16mm', 'material', 'kg', 'Fierro', 'Fierro para hormigón armado diámetro 16mm', 1350, true, ARRAY['civil_works', 'industrial', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh204']),
('Malla ACMA C-188', 'material', 'm2', 'Fierro', 'Malla electrosoldada 6mm cada 15cm', 8500, true, ARRAY['residential', 'renovations'], 1, NULL, ARRAY['NCh204']),
('Alambre Negro Nº18', 'material', 'kg', 'Fierro', 'Alambre para amarra de fierros', 2800, true, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1, NULL, ARRAY['NCh204']);

-- Madera
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, nch_standards) VALUES
('Pino Radiata Seco 2x4"', 'material', 'm', 'Madera', 'Pino radiata seco cepillado 2x4 pulgadas', 1200, true, ARRAY['residential', 'renovations'], 1, ARRAY['NCh1207']),
('Pino Radiata Seco 2x6"', 'material', 'm', 'Madera', 'Pino radiata seco cepillado 2x6 pulgadas', 1800, true, ARRAY['residential', 'renovations'], 1, ARRAY['NCh1207']),
('Pino Radiata Seco 2x8"', 'material', 'm', 'Madera', 'Pino radiata seco cepillado 2x8 pulgadas', 2400, true, ARRAY['residential', 'renovations'], 1, ARRAY['NCh1207']),
('Terciado Estructural 15mm', 'material', 'm2', 'Madera', 'Terciado fenólico estructural 15mm', 12500, true, ARRAY['residential', 'renovations'], 1, ARRAY['NCh1207']),
('Terciado Estructural 18mm', 'material', 'm2', 'Madera', 'Terciado fenólico estructural 18mm', 15000, true, ARRAY['residential', 'renovations'], 1, ARRAY['NCh1207']),
('OSB 11mm', 'material', 'm2', 'Madera', 'Tablero OSB oriented strand board 11mm', 8900, true, ARRAY['residential', 'renovations'], 2, ARRAY['NCh1207']);

-- Albañilería
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, seismic_zones, nch_standards) VALUES
('Ladrillo Fiscal', 'material', 'un', 'Albañilería', 'Ladrillo cerámico macizo tradicional', 350, true, ARRAY['residential', 'renovations'], 1, ARRAY['D', 'E'], ARRAY['NCh167']),
('Ladrillo Princesa', 'material', 'un', 'Albañilería', 'Ladrillo cerámico hueco 14x19x33cm', 820, true, ARRAY['residential'], 1, ARRAY['D', 'E'], ARRAY['NCh167']),
('Bloque Hormigón 14cm', 'material', 'un', 'Albañilería', 'Bloque de hormigón vibrado 14x19x39cm', 1450, true, ARRAY['residential', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh181']),
('Bloque Hormigón 19cm', 'material', 'un', 'Albañilería', 'Bloque de hormigón vibrado 19x19x39cm', 1850, true, ARRAY['residential', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh181']),
('Mortero Predosificado Seco 25kg', 'material', 'saco', 'Albañilería', 'Mortero predosificado para pega y estucos', 5200, true, ARRAY['residential', 'renovations'], 2, NULL, ARRAY['NCh2256']);

-- Techumbres
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority, region_code) VALUES
('Teja Española GREDA', 'material', 'm2', 'Techumbre', 'Teja española de greda natural', 12500, true, ARRAY['residential'], 1, NULL),
('Teja ZINCTEJA Ondulada', 'material', 'm2', 'Techumbre', 'Plancha galvanizada ondulada calibre 28', 8900, true, ARRAY['residential', 'industrial'], 1, NULL),
('Plancha Galvanizada Lisa 0.5mm', 'material', 'm2', 'Techumbre', 'Plancha galvanizada lisa calibre 0.5mm', 11500, true, ARRAY['industrial', 'commercial'], 1, NULL),
('Membrana Asfáltica 4mm', 'material', 'm2', 'Techumbre', 'Membrana asfáltica aluminio 4mm', 7800, true, ARRAY['residential', 'commercial'], 1, NULL),
('Aislación Térmica Lana Mineral 50mm', 'material', 'm2', 'Techumbre', 'Lana mineral con papel kraft 50mm espesor', 3200, true, ARRAY['residential'], 2, NULL);

-- 2. GLOBAL RESOURCE TEMPLATES - MANO DE OBRA

-- Mano de obra especializada (incluye leyes sociales 65%)
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority) VALUES
('Maestro Primera', 'labor', 'dia', 'Mano de Obra', 'Maestro especializado con leyes sociales incluidas', 85000, false, ARRAY['residential', 'civil_works', 'industrial', 'commercial', 'renovations'], 1),
('Albañil Especializado', 'labor', 'dia', 'Mano de Obra', 'Albañil con experiencia en obras complejas', 65000, false, ARRAY['residential', 'civil_works', 'commercial', 'renovations'], 1),
('Enfierrador', 'labor', 'dia', 'Mano de Obra', 'Especialista en armaduras de fierro', 68000, false, ARRAY['residential', 'civil_works', 'industrial', 'commercial'], 1),
('Carpintero', 'labor', 'dia', 'Mano de Obra', 'Carpintero especializado en moldajes y terminaciones', 62000, false, ARRAY['residential', 'renovations'], 1),
('Jornal', 'labor', 'dia', 'Mano de Obra', 'Trabajador general sin especialización', 45000, false, ARRAY['residential', 'civil_works', 'industrial', 'commercial', 'renovations'], 1);

-- Especialistas MEP
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority) VALUES
('Gasfiter Especializado', 'labor', 'dia', 'MEP', 'Gasfiter instalador con leyes sociales', 72000, false, ARRAY['residential', 'commercial', 'renovations'], 1),
('Electricista Autorizado', 'labor', 'dia', 'MEP', 'Electricista con certificación SEC', 78000, false, ARRAY['residential', 'commercial', 'industrial', 'renovations'], 1),
('Técnico HVAC', 'labor', 'dia', 'MEP', 'Técnico especialista en climatización', 82000, false, ARRAY['commercial', 'industrial'], 1),
('Soldador Calificado', 'labor', 'dia', 'MEP', 'Soldador certificado para cañerías y estructuras', 75000, false, ARRAY['industrial', 'civil_works'], 1);

-- Operadores de maquinaria
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority) VALUES
('Operador Retroexcavadora', 'labor', 'dia', 'Operadores', 'Operador certificado de maquinaria pesada', 95000, false, ARRAY['civil_works'], 1),
('Operador Grúa Torre', 'labor', 'dia', 'Operadores', 'Operador certificado de grúa torre', 110000, false, ARRAY['civil_works', 'commercial'], 1),
('Operador Bomba Hormigón', 'labor', 'dia', 'Operadores', 'Operador especializado en bombeo de hormigón', 88000, false, ARRAY['residential', 'civil_works', 'commercial'], 1);

-- 3. GLOBAL RESOURCE TEMPLATES - EQUIPOS Y HERRAMIENTAS

-- Equipos de construcción (arriendo diario incluye combustible y mantención)
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority) VALUES
('Retroexcavadora CAT 320', 'equipment', 'dia', 'Maquinaria Pesada', 'Retroexcavadora sobre oruga con martillo', 280000, true, ARRAY['civil_works'], 1),
('Minicargador BOBCAT S650', 'equipment', 'dia', 'Maquinaria Pesada', 'Minicargador con implementos múltiples', 120000, true, ARRAY['residential', 'civil_works'], 1),
('Grúa Torre LIEBHERR 63K', 'equipment', 'dia', 'Maquinaria Pesada', 'Grúa torre alcance 50m capacidad 1.3t', 350000, true, ARRAY['civil_works', 'commercial'], 1),
('Bomba Hormigón 28m', 'equipment', 'dia', 'Hormigonado', 'Bomba estacionaria alcance 28 metros', 180000, true, ARRAY['residential', 'civil_works', 'commercial'], 1);

-- Herramientas y equipos menores
INSERT INTO global_resource_templates (name, type, unit_id, category, description, base_price, has_vat, specialties, priority) VALUES
('Betonera MONZÓN 350L', 'equipment', 'dia', 'Herramientas', 'Betonera eléctrica 350 litros', 45000, true, ARRAY['residential', 'renovations'], 1),
('Vibrador Hormigón ENAR', 'equipment', 'dia', 'Herramientas', 'Vibrador de inmersión con motor 2HP', 25000, true, ARRAY['residential', 'civil_works'], 1),
('Andamio Metálico Torre', 'equipment', 'dia', 'Herramientas', 'Torre de andamio metálico altura 6m', 18000, true, ARRAY['residential', 'renovations'], 1),
('Herramientas Menores', 'equipment', 'dia', 'Herramientas', 'Set herramientas básicas albañilería', 8500, true, ARRAY['residential', 'civil_works', 'renovations'], 1);

-- 4. GLOBAL APU TEMPLATES - VIVIENDA RESIDENCIAL

INSERT INTO global_apu_templates (name, unit_id, description, category, specialties, priority, seismic_zones, nch_standards) VALUES
('Excavación Manual Terreno Semi-Duro', 'm3', 'Excavación manual para fundaciones en terreno semi-duro hasta 1.5m profundidad', 'Movimiento Tierras', ARRAY['residential', 'renovations'], 1, NULL, ARRAY['NCh1508']),
('Hormigón de Cimiento H20 en Obra', 'm3', 'Hormigón grado H20 para cimientos corridos dosificación 1:3:3', 'Hormigones', ARRAY['residential'], 1, ARRAY['D', 'E'], ARRAY['NCh170', 'NCh1017']),
('Hormigón Estructural H25 Bombeado', 'm3', 'Hormigón estructural H25 colocado con bomba para elementos resistentes', 'Hormigones', ARRAY['residential', 'civil_works', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh170', 'NCh430']),
('Albañilería Ladrillo Fiscal Soga', 'm2', 'Muro de ladrillo fiscal en aparejo soga con mortero 1:4', 'Albañilería', ARRAY['residential'], 1, ARRAY['D', 'E'], ARRAY['NCh167']),
('Albañilería Bloque Hormigón 14cm', 'm2', 'Muro de bloque de hormigón 14cm con mortero certificado', 'Albañilería', ARRAY['residential', 'commercial'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh181', 'NCh2123']);

-- APU Templates para techumbre
INSERT INTO global_apu_templates (name, unit_id, description, category, specialties, priority, nch_standards) VALUES
('Techumbre Teja Española s/Entablado', 'm2', 'Instalación teja española sobre entablado con fieltro y gancho galvanizado', 'Techumbre', ARRAY['residential'], 1, ARRAY['NCh3308']),
('Cubierta Zinc Ondulado s/Costanera', 'm2', 'Cubierta zinc alum ondulada sobre estructura costaneras pino 2x3"', 'Techumbre', ARRAY['residential'], 1, ARRAY['NCh3308']),
('Cielo Falso Yeso Cartón 10mm', 'm2', 'Cielo falso placa yeso-cartón 10mm sobre estructura metálica', 'Cielos', ARRAY['residential', 'commercial'], 2, NULL);

-- 5. GLOBAL APU TEMPLATES - OBRAS CIVILES

INSERT INTO global_apu_templates (name, unit_id, description, category, specialties, priority, nch_standards) VALUES
('Excavación Mecánica Material Común', 'm3', 'Excavación mecánica con retroexcavadora en material común incluye carga', 'Movimiento Tierras', ARRAY['civil_works'], 1, ARRAY['NCh1508']),
('Relleno Compactado c/Material Préstamo', 'm3', 'Relleno compactado con material seleccionado en capas de 20cm', 'Movimiento Tierras', ARRAY['civil_works'], 1, ARRAY['NCh1508']),
('Pavimento Asfáltico Mezcla Densa 5cm', 'm2', 'Carpeta asfáltica mezcla densa en caliente espesor 5cm', 'Pavimentación', ARRAY['civil_works'], 1, ARRAY['NCh1157']),
('Base Granular Estabilizada 20cm', 'm2', 'Base granular estabilizada espesor 20cm CBR>80%', 'Pavimentación', ARRAY['civil_works'], 1, ARRAY['NCh1132']),
('Hormigón Estructural H30 Bombeado', 'm3', 'Hormigón grado H30 para estructuras especiales con bomba', 'Hormigones', ARRAY['civil_works'], 1, ARRAY['A', 'B', 'C'], ARRAY['NCh170', 'NCh430']);

-- 6. GLOBAL APU TEMPLATES - MEP (Instalaciones)

INSERT INTO global_apu_templates (name, unit_id, description, category, specialties, priority) VALUES
('Tubería Cobre 1/2" Agua Fría', 'm', 'Instalación tubería cobre tipo K 1/2" para agua fría incluye fittings', 'Agua Potable', ARRAY['residential', 'commercial', 'renovations'], 1),
('Tubería PVC 110mm Alcantarillado', 'm', 'Instalación tubería PVC 110mm alcantarillado domiciliario con uniones', 'Alcantarillado', ARRAY['residential', 'commercial', 'renovations'], 1),
('Canalización Eléctrica PVC 20mm', 'm', 'Canalización eléctrica PVC rígido 20mm embutida en muro', 'Electricidad', ARRAY['residential', 'commercial', 'renovations'], 1),
('Tablero Eléctrico Trifásico 24 Circuitos', 'un', 'Tablero eléctrico metálico trifásico 24 circuitos con automáticos', 'Electricidad', ARRAY['residential', 'commercial'], 1);

-- 7. POPULATE APU RESOURCE RELATIONSHIPS

-- Excavación Manual
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient) 
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Jornal' THEN 0.8
    WHEN grt.name = 'Herramientas Menores' THEN 0.2
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Excavación Manual Terreno Semi-Duro'
  AND grt.name IN ('Jornal', 'Herramientas Menores');

-- Hormigón H20 Cimiento
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient)
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Cemento Especial MELÓN 25kg' THEN 7.0  -- 7 sacos por m3
    WHEN grt.name = 'Arena Lavada de Río' THEN 0.42  -- 0.42 m3 por m3
    WHEN grt.name = 'Grava 20mm' THEN 0.84  -- 0.84 m3 por m3
    WHEN grt.name = 'Albañil Especializado' THEN 0.8  -- 0.8 días por m3
    WHEN grt.name = 'Jornal' THEN 1.2  -- 1.2 días por m3
    WHEN grt.name = 'Betonera MONZÓN 350L' THEN 0.8  -- 0.8 días por m3
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Hormigón de Cimiento H20 en Obra'
  AND grt.name IN ('Cemento Especial MELÓN 25kg', 'Arena Lavada de Río', 'Grava 20mm', 'Albañil Especializado', 'Jornal', 'Betonera MONZÓN 350L');

-- Hormigón H25 Bombeado
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient)
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Cemento Especial MELÓN 25kg' THEN 8.5  -- 8.5 sacos por m3
    WHEN grt.name = 'Arena Lavada de Río' THEN 0.40  -- 0.40 m3 por m3
    WHEN grt.name = 'Grava 20mm' THEN 0.82  -- 0.82 m3 por m3
    WHEN grt.name = 'Albañil Especializado' THEN 0.4  -- 0.4 días por m3
    WHEN grt.name = 'Jornal' THEN 0.8  -- 0.8 días por m3
    WHEN grt.name = 'Bomba Hormigón 28m' THEN 0.2  -- 0.2 días por m3
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Hormigón Estructural H25 Bombeado'
  AND grt.name IN ('Cemento Especial MELÓN 25kg', 'Arena Lavada de Río', 'Grava 20mm', 'Albañil Especializado', 'Jornal', 'Bomba Hormigón 28m');

-- Albañilería Ladrillo Fiscal
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient)
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Ladrillo Fiscal' THEN 64.0  -- 64 ladrillos por m2
    WHEN grt.name = 'Cemento Especial MELÓN 25kg' THEN 0.35  -- 0.35 sacos por m2
    WHEN grt.name = 'Arena de Peña' THEN 0.028  -- 0.028 m3 por m2
    WHEN grt.name = 'Albañil Especializado' THEN 0.35  -- 0.35 días por m2
    WHEN grt.name = 'Jornal' THEN 0.15  -- 0.15 días por m2
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Albañilería Ladrillo Fiscal Soga'
  AND grt.name IN ('Ladrillo Fiscal', 'Cemento Especial MELÓN 25kg', 'Arena de Peña', 'Albañil Especializado', 'Jornal');

-- Albañilería Bloque Hormigón
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient)
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Bloque Hormigón 14cm' THEN 12.8  -- 12.8 bloques por m2
    WHEN grt.name = 'Mortero Predosificado Seco 25kg' THEN 0.8  -- 0.8 sacos por m2
    WHEN grt.name = 'Albañil Especializado' THEN 0.28  -- 0.28 días por m2
    WHEN grt.name = 'Jornal' THEN 0.12  -- 0.12 días por m2
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Albañilería Bloque Hormigón 14cm'
  AND grt.name IN ('Bloque Hormigón 14cm', 'Mortero Predosificado Seco 25kg', 'Albañil Especializado', 'Jornal');

-- Techumbre Teja Española
INSERT INTO global_apu_template_resources (global_apu_template_id, global_resource_template_id, coefficient)
SELECT 
  gat.id,
  grt.id,
  CASE 
    WHEN grt.name = 'Teja Española GREDA' THEN 1.1  -- 1.1 m2 teja por m2 (incluye pérdida)
    WHEN grt.name = 'Terciado Estructural 15mm' THEN 1.05  -- 1.05 m2 entablado por m2
    WHEN grt.name = 'Pino Radiata Seco 2x4"' THEN 2.8  -- 2.8 ml costaneras por m2
    WHEN grt.name = 'Carpintero' THEN 0.35  -- 0.35 días por m2
    WHEN grt.name = 'Jornal' THEN 0.15  -- 0.15 días por m2
  END
FROM global_apu_templates gat
CROSS JOIN global_resource_templates grt
WHERE gat.name = 'Techumbre Teja Española s/Entablado'
  AND grt.name IN ('Teja Española GREDA', 'Terciado Estructural 15mm', 'Pino Radiata Seco 2x4"', 'Carpintero', 'Jornal');

-- Add more APU resource relationships for other templates...

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_global_apu_template_resources_lookup 
ON global_apu_template_resources (global_apu_template_id, global_resource_template_id);

-- Migration complete
SELECT 'Chilean master data seed completed successfully - ' || 
       (SELECT COUNT(*) FROM global_resource_templates) || ' resources and ' ||
       (SELECT COUNT(*) FROM global_apu_templates) || ' APU templates loaded' as result;