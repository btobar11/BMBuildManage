-- Master Construction Resource Library Seeding (Global) v2
-- Categories: Obra Gruesa, Terminaciones, Instalaciones, Mano de Obra, Maquinaria

-- 1. Materials: Obra Gruesa (Aglomerantes y Aridos)
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Cemento Especial 42.5kg', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 5500, 'Obra Gruesa', NULL),
('Arena Gruesa', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 18500, 'Obra Gruesa', NULL),
('Arena Fina / Estuco', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 22000, 'Obra Gruesa', NULL),
('Grava 3/4', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 19500, 'Obra Gruesa', NULL),
('Gravilla 1/2', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 21000, 'Obra Gruesa', NULL),
('Bolon desplazador', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 15000, 'Obra Gruesa', NULL),
('Hormigón Premezclado G25', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 95000, 'Obra Gruesa', NULL),
('Agua de obra', 'material', '35510fee-bd84-4b42-95ac-4735e41451cf', 1500, 'Obra Gruesa', NULL);

-- 2. Materials: Aceros y Moldajes
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Fierro Estriado 8mm (6m)', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 4800, 'Obra Gruesa', NULL),
('Fierro Estriado 10mm (6m)', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 7200, 'Obra Gruesa', NULL),
('Fierro Estriado 12mm (6m)', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 10500, 'Obra Gruesa', NULL),
('Malla ACMA AT56 (2.6x4.8m)', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 45000, 'Obra Gruesa', NULL),
('Alambre de amarre #18', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 2200, 'Obra Gruesa', NULL),
('Clavos corriente 3"', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 1800, 'Obra Gruesa', NULL),
('Madera Pino 2x4x3.2m', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 4500, 'Obra Gruesa', NULL),
('Terciado Estructural 12mm', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 24000, 'Obra Gruesa', NULL),
('Líquido Desmoldante', 'material', '7b04f3ac-ff63-4253-89aa-1a78b54ca6c6', 3500, 'Obra Gruesa', NULL);

-- 3. Materials: Albañilería y Cubiertas
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Ladrillo Princesa 29x14x7', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 550, 'Obra Gruesa', NULL),
('Bloque Cemento 19x19x39', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 850, 'Obra Gruesa', NULL),
('Plancha OSB 9mm', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 15000, 'Obra Gruesa', NULL),
('Teja Colonial Arcilla', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 18000, 'Cubiertas', NULL),
('Fieltro Asfáltico 15lb', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 800, 'Cubiertas', NULL);

-- 4. Materials: Terminaciones
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Cerámica Piso 45x45', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 8500, 'Terminaciones', NULL),
('Porcelanato Rectificado 60x60', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 14500, 'Terminaciones', NULL),
('Piso Flotante 8mm AC3', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 9800, 'Terminaciones', NULL),
('Adhesivo Cerámico Saco 25kg', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 4500, 'Terminaciones', NULL),
('Fragüe color 1kg', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 2800, 'Terminaciones', NULL),
('Látex Extracubriente Blanco 1gal', 'material', '7b04f3ac-ff63-4253-89aa-1a78b54ca6c6', 18000, 'Terminaciones', NULL),
('Esmalte al Agua Blanco 1gal', 'material', '7b04f3ac-ff63-4253-89aa-1a78b54ca6c6', 22000, 'Terminaciones', NULL),
('Pasta Muro Interior 20kg', 'material', '6a7bf511-95d3-4ea5-956f-108adcce356f', 12500, 'Terminaciones', NULL),
('Yeso Cartón St 10mm (1.2x2.4)', 'material', '73b4ca9c-896d-41a0-988f-34f43817e67f', 11000, 'Terminaciones', NULL);

-- 5. Materials: Instalaciones Sanitarias
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Cañería Cobre 1/2" (6m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 25000, 'Instalaciones', NULL),
('Tubo PVC Sanitario 110mm (6m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 18000, 'Instalaciones', NULL),
('Tubo PVC Sanitario 40mm (6m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 8500, 'Instalaciones', NULL),
('Terminal Cobre Hi 1/2"', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 1200, 'Instalaciones', NULL),
('Codo PVC 110mm x 90', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 2500, 'Instalaciones', NULL),
('Adhesivo PVC 240cc', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 4500, 'Instalaciones', NULL);

-- 6. Materials: Instalaciones Eléctricas
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Cable Eléctrico 1.5mm2 (100m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 28000, 'Instalaciones', NULL),
('Cable Eléctrico 2.5mm2 (100m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 42000, 'Instalaciones', NULL),
('Caja de Derivación Chuqui', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 850, 'Instalaciones', NULL),
('Ducto Conduit 20mm (3m)', 'material', 'c2589d28-4a2e-4406-b286-f1ec4424266e', 1400, 'Instalaciones', NULL),
('Interruptor Simple Bticino', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 3500, 'Instalaciones', NULL),
('Enchufe Hembra Triple Bticino', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 5200, 'Instalaciones', NULL),
('Tablero Eléctrico 12 mod.', 'material', '822cca63-76ab-4e8a-a293-54c597596a10', 18500, 'Instalaciones', NULL);

-- 7. Labor (Mano de Obra) - Values in CLP per Day
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Jornal de Obra', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 35000, 'Mano de Obra', NULL),
('Ayudante Técnico', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 45000, 'Mano de Obra', NULL),
('Maestro Albañil', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 65000, 'Mano de Obra', NULL),
('Maestro Carpintero', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 65000, 'Mano de Obra', NULL),
('Maestro Enfierrador', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 60000, 'Mano de Obra', NULL),
('Maestro Ceramista', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 75000, 'Mano de Obra', NULL),
('Maestro Pintor', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 55000, 'Mano de Obra', NULL),
('Maestro Electricista SEC', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 90000, 'Mano de Obra', NULL),
('Maestro Gasfíter Instalador', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 85000, 'Mano de Obra', NULL),
('Maestro Techador', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 70000, 'Mano de Obra', NULL),
('Capataz de Obra', 'labor', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 110000, 'Mano de Obra', NULL);

-- 8. Equipment (Maquinaria) - Values in CLP per Day (Rental/Amortization)
INSERT INTO resources (name, type, unit_id, base_price, category, company_id) VALUES
('Betonera 150L (Día)', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 15000, 'Maquinaria', NULL),
('Vibrador de Inmersión', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 12000, 'Maquinaria', NULL),
('Sonda Vibradora 5m', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 5000, 'Maquinaria', NULL),
('Retroexcavadora (Día)', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 220000, 'Maquinaria', NULL),
('Generador Eléctrico 5kW', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 18000, 'Maquinaria', NULL),
('Andamio Estándar Cuerpo', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 1500, 'Maquinaria', NULL),
('Compactador Pata de Cabra', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 35000, 'Maquinaria', NULL),
('Esmeril Angular 7"', 'equipment', '047aa3b5-d4cd-4776-9e3f-1b61ef4d1d6e', 8000, 'Maquinaria', NULL);
