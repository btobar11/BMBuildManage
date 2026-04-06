import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from apps/api
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Starting Global Library Seeding...");

  // 1. Unidades Base
  const unitsData = [
    { name: 'Metro Lineal', symbol: 'ml', category: 'length' },
    { name: 'Metro Cuadrado', symbol: 'm2', category: 'area' },
    { name: 'Metro Cúbico', symbol: 'm3', category: 'volume' },
    { name: 'Litro', symbol: 'L', category: 'volume' },
    { name: 'Kilogramo', symbol: 'kg', category: 'weight' },
    { name: 'Saco / Bolsa', symbol: 'saco', category: 'unit' },
    { name: 'Unidad', symbol: 'un', category: 'unit' },
    { name: 'Global', symbol: 'glb', category: 'global' },
    { name: 'Hora', symbol: 'hr', category: 'time' },
    { name: 'Día', symbol: 'dia', category: 'time' },
    { name: 'Mes', symbol: 'mes', category: 'time' }
  ];

  console.log("Upserting Units...");
  const { data: units, error: unitError } = await supabase
    .from('units')
    .upsert(unitsData, { onConflict: 'symbol' })
    .select();

  if (unitError) throw new Error(`Unit Error: ${unitError.message}`);
  
  const getUnitId = (symbol: string) => units.find(u => u.symbol === symbol)?.id;

  if (!getUnitId('hr')) {
    throw new Error('Failed to load base units');
  }

  // 2. Recursos Globales
  const resourcesData = [
    // --- Mano de Obra ---
    { name: 'Maestro Albañil', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
    { name: 'Ayudante General', type: 'labor', unit_id: getUnitId('hr'), base_price: 4500, category: 'Mano de Obra', company_id: null },
    { name: 'Maestro Carpintero', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
    { name: 'Maestro Enfierrador', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
    { name: 'Maestro Pintor', type: 'labor', unit_id: getUnitId('hr'), base_price: 6000, category: 'Mano de Obra', company_id: null },
    { name: 'Maestro Eléctrico', type: 'labor', unit_id: getUnitId('hr'), base_price: 7000, category: 'Mano de Obra', company_id: null },
    { name: 'Maestro Gafíter', type: 'labor', unit_id: getUnitId('hr'), base_price: 7000, category: 'Mano de Obra', company_id: null },
    { name: 'Supervisor Técnico', type: 'labor', unit_id: getUnitId('hr'), base_price: 10000, category: 'Mano de Obra Especializada', company_id: null },

    // --- Materiales Obra Gruesa ---
    { name: 'Cemento Portland (Saco de 25kg)', type: 'material', unit_id: getUnitId('saco'), base_price: 4500, category: 'Obra Gruesa', company_id: null },
    { name: 'Arena Fina', type: 'material', unit_id: getUnitId('m3'), base_price: 18000, category: 'Obra Gruesa', company_id: null },
    { name: 'Arena Gruesa', type: 'material', unit_id: getUnitId('m3'), base_price: 16000, category: 'Obra Gruesa', company_id: null },
    { name: 'Gravilla', type: 'material', unit_id: getUnitId('m3'), base_price: 18000, category: 'Obra Gruesa', company_id: null },
    { name: 'Hormigón Premezclado H20', type: 'material', unit_id: getUnitId('m3'), base_price: 85000, category: 'Obra Gruesa', company_id: null },
    { name: 'Acero Estructural A630 (Barras 12mm)', type: 'material', unit_id: getUnitId('kg'), base_price: 1200, category: 'Enfierradura', company_id: null },
    { name: 'Acero Estructural A630 (Barras 8mm)', type: 'material', unit_id: getUnitId('kg'), base_price: 1200, category: 'Enfierradura', company_id: null },
    { name: 'Madera Pino Bruto 2x4" x 3.2m', type: 'material', unit_id: getUnitId('un'), base_price: 3500, category: 'Obra Gruesa', company_id: null },
    { name: 'Panel OSB 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 14500, category: 'Obra Gruesa', company_id: null },
    { name: 'Ladrillo Titán', type: 'material', unit_id: getUnitId('un'), base_price: 360, category: 'Albañilería', company_id: null },
    { name: 'Ladrillo Princesa', type: 'material', unit_id: getUnitId('un'), base_price: 420, category: 'Albañilería', company_id: null },
    { name: 'Mortero Pega Predosificado 25kg', type: 'material', unit_id: getUnitId('saco'), base_price: 3200, category: 'Albañilería', company_id: null },

    // --- Materiales Terminaciones ---
    { name: 'Pintura Esmalte al Agua (Tinetta 15L)', type: 'material', unit_id: getUnitId('un'), base_price: 45000, category: 'Terminaciones', company_id: null },
    { name: 'Pintura Látex Interior (Tinetta 15L)', type: 'material', unit_id: getUnitId('un'), base_price: 38000, category: 'Terminaciones', company_id: null },
    { name: 'Pasta Muro Interior (Tineta 25kg)', type: 'material', unit_id: getUnitId('un'), base_price: 18000, category: 'Terminaciones', company_id: null },
    { name: 'Cerámica de Piso 40x40cm (Caja 2m2)', type: 'material', unit_id: getUnitId('un'), base_price: 14000, category: 'Revestimientos', company_id: null },
    { name: 'Adhesivo Cerámico Polvo 25kg', type: 'material', unit_id: getUnitId('saco'), base_price: 4500, category: 'Revestimientos', company_id: null },
    { name: 'Yeso Cartón Standard 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 6800, category: 'Tabiquería', company_id: null },
    { name: 'Yeso Cartón RH 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 9800, category: 'Tabiquería', company_id: null },
    { name: 'Montante 60mmx3m x0.85', type: 'material', unit_id: getUnitId('un'), base_price: 2500, category: 'Tabiquería', company_id: null },

    // --- Materiales Instalaciones ---
    { name: 'Tubería PVC Sanitario 110mm x 6m', type: 'material', unit_id: getUnitId('un'), base_price: 12000, category: 'Instalación Sanitaria', company_id: null },
    { name: 'Cable de Cobre THHN 12 AWG (100m)', type: 'material', unit_id: getUnitId('un'), base_price: 65000, category: 'Instalación Eléctrica', company_id: null },
    { name: 'Tubería Conduit PVC 20mm x 3m', type: 'material', unit_id: getUnitId('un'), base_price: 1200, category: 'Instalación Eléctrica', company_id: null },
    { name: 'Caja de Derivación Plástica Redonda', type: 'material', unit_id: getUnitId('un'), base_price: 500, category: 'Instalación Eléctrica', company_id: null },
    { name: 'Módulo Enchufe Doble 10A Bticino', type: 'material', unit_id: getUnitId('un'), base_price: 3500, category: 'Instalación Eléctrica', company_id: null },

    // --- Equipos ---
    { name: 'Hormigonera 150L (Arriendo Diario)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 15000, category: 'Maquinaria Menor', company_id: null },
    { name: 'Vibrador de Inmersión (Arriendo Diario)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 18000, category: 'Maquinaria Menor', company_id: null },
    { name: 'Herramientas Menores', type: 'equipment', unit_id: getUnitId('glb'), base_price: 500, category: 'Herramientas', company_id: null },
    { name: 'Andamio Metálico (Cuerpo x Día)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 3500, category: 'Equipamiento Auxiliar', company_id: null },
  ];

  console.log(`Checking existing Global Resources for UPSERT...`);
  
  // Custom upsert by name for global items
  let resourceIds: Record<string, string> = {};
  
  for (const res of resourcesData) {
    const { data: existing } = await supabase
      .from('resources')
      .select('id, name')
      .eq('name', res.name)
      .is('company_id', null)
      .maybeSingle();
      
    if (existing) {
      // Update
      await supabase.from('resources').update(res).eq('id', existing.id);
      resourceIds[res.name] = existing.id;
    } else {
      // Insert
      const { data: inserted, error } = await supabase.from('resources').insert([res]).select('id').single();
      if (error) {
        console.error("Error inserting resource", res.name, error);
      } else {
        resourceIds[res.name] = inserted.id;
      }
    }
  }

  // Helper fetching Resource IDs securely
  const getResId = (name: string) => {
    if(!resourceIds[name]) throw new Error(`Resource missing: ${name}`);
    return resourceIds[name];
  };

  // 3. APU Templates
  const apusData = [
    {
      name: 'Excavación Manual Zanjas para Fundaciones',
      description: 'Excavación en terreno blando, hasta 1,5m de profundidad.',
      unit_id: getUnitId('m3'),
      category: 'Obras Previas y Excavaciones',
      resources: [
        { name: 'Ayudante General', type: 'labor', coefficient: 3.5 }, // 3.5 horas por m3
        { name: 'Herramientas Menores', type: 'equipment', coefficient: 1 }, 
      ]
    },
    {
      name: 'Hormigón Tipo H20 para Sobrecimientos',
      description: 'Hormigón preparado en obra H20 (175 kg/cm2). Incluye materiales y confección.',
      unit_id: getUnitId('m3'),
      category: 'Obra Gruesa - Hormigones',
      resources: [
        { name: 'Cemento Portland (Saco de 25kg)', type: 'material', coefficient: 12 }, // 300kg por m3
        { name: 'Arena Gruesa', type: 'material', coefficient: 0.5 },
        { name: 'Gravilla', type: 'material', coefficient: 0.8 },
        { name: 'Maestro Albañil', type: 'labor', coefficient: 1.5 },
        { name: 'Ayudante General', type: 'labor', coefficient: 3 },
        { name: 'Hormigonera 150L (Arriendo Diario)', type: 'equipment', coefficient: 0.25 },
        { name: 'Vibrador de Inmersión (Arriendo Diario)', type: 'equipment', coefficient: 0.25 }
      ]
    },
    {
      name: 'Muro de Albañilería Ladrillo Titán 14cm',
      description: 'Muro de albañilería tradicional soga, ladrillo tipo titán. Codos y tendeles con mortero premezclado.',
      unit_id: getUnitId('m2'),
      category: 'Obra Gruesa - Albañilería',
      resources: [
        { name: 'Ladrillo Titán', type: 'material', coefficient: 40 }, // Aprox 40 u/m2 considerando mermas
        { name: 'Mortero Pega Predosificado 25kg', type: 'material', coefficient: 1.2 }, // 1.2 sacos por m2
        { name: 'Maestro Albañil', type: 'labor', coefficient: 0.8 },
        { name: 'Ayudante General', type: 'labor', coefficient: 0.8 },
        { name: 'Herramientas Menores', type: 'equipment', coefficient: 1 }
      ]
    },
    {
      name: 'Estuco Interior Muros (Espesor 2.5cm)',
      description: 'Revoque grueso afina con mortero hecho en obra.',
      unit_id: getUnitId('m2'),
      category: 'Terminaciones - Revestimientos',
      resources: [
        { name: 'Cemento Portland (Saco de 25kg)', type: 'material', coefficient: 0.35 },
        { name: 'Arena Fina', type: 'material', coefficient: 0.03 },
        { name: 'Maestro Albañil', type: 'labor', coefficient: 0.5 },
        { name: 'Ayudante General', type: 'labor', coefficient: 0.5 },
      ]
    },
    {
      name: 'Enfierradura Refuerzo Losa A630',
      description: 'Instalación y dimensionado de enfierradura de losa, amarras.',
      unit_id: getUnitId('kg'),
      category: 'Obra Gruesa - Enfierradura',
      resources: [
        { name: 'Acero Estructural A630 (Barras 12mm)', type: 'material', coefficient: 1.05 }, // 5% mermas
        { name: 'Maestro Enfierrador', type: 'labor', coefficient: 0.05 }, // 20 kg por hr -> 0.05 hr/kg
        { name: 'Ayudante General', type: 'labor', coefficient: 0.05 },
      ]
    },
    {
      name: 'Tabiquería Yeso Cartón 15mm 1 Cara',
      description: 'Tabique simple, montantes c/60cm, placa yeso cartón 15mm estándar.',
      unit_id: getUnitId('m2'),
      category: 'Terminaciones - Tabiquería',
      resources: [
        { name: 'Yeso Cartón Standard 15mm 1.22x2.44m', type: 'material', coefficient: 0.35 }, // 1 placa cubre ~3m2 -> 0.33 + mermas
        { name: 'Montante 60mmx3m x0.85', type: 'material', coefficient: 0.7 }, // 0.7 por m2 aprox
        { name: 'Maestro Carpintero', type: 'labor', coefficient: 0.35 },
        { name: 'Ayudante General', type: 'labor', coefficient: 0.35 },
      ]
    },
    {
      name: 'Cerámica de Piso 40x40cm',
      description: 'Provisión e instalación de cerámica de piso interior, pegamento estándar.',
      unit_id: getUnitId('m2'),
      category: 'Terminaciones - Pisos',
      resources: [
        { name: 'Cerámica de Piso 40x40cm (Caja 2m2)', type: 'material', coefficient: 0.55 }, // Medio paquete por m2 + merma 10%
        { name: 'Adhesivo Cerámico Polvo 25kg', type: 'material', coefficient: 0.15 }, // Un saco por ~6m2
        { name: 'Maestro Albañil', type: 'labor', coefficient: 0.8 },
        { name: 'Ayudante General', type: 'labor', coefficient: 0.4 },
      ]
    },
    {
      name: 'Empaste y Pintura Interior Látex (2 manos)',
      description: 'Lijado, 1 mano de pasta muro completa, y 2 manos de látex.',
      unit_id: getUnitId('m2'),
      category: 'Terminaciones - Pintura',
      resources: [
        { name: 'Pasta Muro Interior (Tineta 25kg)', type: 'material', coefficient: 0.04 }, // Una tineta de 25kg da para ~25m2 
        { name: 'Pintura Látex Interior (Tinetta 15L)', type: 'material', coefficient: 0.015 }, // Una tinetta ~65m2 en 2 manos
        { name: 'Maestro Pintor', type: 'labor', coefficient: 0.25 }, // 4 m2 por hora empaste + pintura
      ]
    },
    {
      name: 'Instalación de Enchufe Doble Completo',
      description: 'Punto eléctrico incl. tubería conduit (6m), cable 12AWG (18m), caja y módulo Bticino.',
      unit_id: getUnitId('un'),
      category: 'Instalaciones - Eléctricas',
      resources: [
        { name: 'Tubería Conduit PVC 20mm x 3m', type: 'material', coefficient: 2 },
        { name: 'Cable de Cobre THHN 12 AWG (100m)', type: 'material', coefficient: 0.18 }, // 18m -> 0.18 de 100m
        { name: 'Caja de Derivación Plástica Redonda', type: 'material', coefficient: 1 },
        { name: 'Módulo Enchufe Doble 10A Bticino', type: 'material', coefficient: 1 },
        { name: 'Maestro Eléctrico', type: 'labor', coefficient: 1.5 },
      ]
    },
    {
      name: 'Tubería Matriz Alcantarillado PVC 110mm',
      description: 'Suministro e instalación de tubería 110mm por metro lineal en zanja superficial.',
      unit_id: getUnitId('ml'),
      category: 'Instalaciones - Sanitarias',
      resources: [
        { name: 'Tubería PVC Sanitario 110mm x 6m', type: 'material', coefficient: 0.17 }, // 1/6 + mermas
        { name: 'Maestro Gafíter', type: 'labor', coefficient: 0.25 },
        { name: 'Ayudante General', type: 'labor', coefficient: 0.25 },
      ]
    }
  ];

  console.log(`Checking existing Global APUs for UPSERT...`);

  for (const apuDef of apusData) {
    const { data: existingApu } = await supabase
      .from('apu_templates')
      .select('id')
      .eq('name', apuDef.name)
      .is('company_id', null)
      .maybeSingle();

    let apuId = existingApu?.id;

    if (!apuId) {
      const { data: inserted, error } = await supabase
        .from('apu_templates')
        .insert([{
          name: apuDef.name,
          description: apuDef.description,
          unit_id: apuDef.unit_id,
          category: apuDef.category,
          company_id: null
        }])
        .select('id')
        .single();
      
      if (error) {
        console.error("Error inserting APU", apuDef.name, error);
        continue;
      }
      apuId = inserted.id;
    } else {
      // Update main
      await supabase.from('apu_templates').update({
        description: apuDef.description,
        unit_id: apuDef.unit_id,
        category: apuDef.category,
      }).eq('id', apuId);
      
      // Delete existing connected resources as we will re-insert them cleanly
      await supabase.from('apu_resources').delete().eq('apu_id', apuId);
    }

    // Insert apu_resources relationships
    if (apuId) {
      const links = apuDef.resources.map(resDef => {
        const rid = getResId(resDef.name);
        return {
          apu_id: apuId,
          resource_id: rid,
          resource_type: resDef.type,
          coefficient: resDef.coefficient
        };
      });
      await supabase.from('apu_resources').insert(links);
    }
  }

  console.log("✅ Global Library Seeding Completed Successfully.");
}

seed().catch(err => {
  console.error("Fatal Seeding Error:", err);
  process.exit(1);
});
