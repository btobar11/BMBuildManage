const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: 'c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\apps\\api\\.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Ensure units exist and get them
    const requiredUnits = [
      { symbol: 'un', name: 'Unidad', category: 'cantidad' },
      { symbol: 'm3', name: 'Metro Cúbico', category: 'volumen' },
      { symbol: 'm2', name: 'Metro Cuadrado', category: 'area' },
      { symbol: 'glb', name: 'Global', category: 'cantidad' },
      { symbol: 'kg', name: 'Kilogramo', category: 'peso' },
      { symbol: 'l', name: 'Litro', category: 'volumen' },
      { symbol: 'día', name: 'Día', category: 'tiempo' }
    ];

    for (const u of requiredUnits) {
       // Search for symbol or 'und' (Chilean variation)
       const { rows } = await client.query('SELECT id FROM units WHERE symbol = $1 OR symbol = $2', [u.symbol, u.symbol === 'un' ? 'und' : u.symbol]);
       if (rows.length === 0) {
         console.log(`Inserting unit ${u.symbol}...`);
         await client.query('INSERT INTO units (id, name, symbol, category) VALUES ($1, $2, $3, $4)', [crypto.randomUUID(), u.name, u.symbol, u.category]);
       }
    }

    const { rows: units } = await client.query('SELECT id, symbol FROM units');
    const getUnit = (sym) => {
      const u = units.find(u => u.symbol.toLowerCase() === sym.toLowerCase());
      if (u) return u.id;
      if (sym === 'un') {
        const und = units.find(u => u.symbol.toLowerCase() === 'und');
        if (und) return und.id;
      }
      return units[0]?.id;
    };
    const uNo = getUnit('un');
    const uM3 = getUnit('m3');
    const uM2 = getUnit('m2');
    const uGlb = getUnit('glb');
    const uKg = getUnit('kg');
    const uLit = getUnit('l');
    const uDia = getUnit('día');

    console.log('Unit IDs mapping completed.');

    // 2. Define global resources
    const globalResources = [
      // Materiales
      { name: 'Hormigón H25', type: 'material', unit_id: uM3, base_price: 95000, desc: 'Hormigón premezclado', cat: 'Obra Gruesa' },
      { name: 'Hormigón G17', type: 'material', unit_id: uM3, base_price: 80000, desc: 'Emplantillado', cat: 'Obra Gruesa' },
      { name: 'Acero A630-420H', type: 'material', unit_id: uKg, base_price: 1100, desc: 'Fierro estriado', cat: 'Enfierradura' },
      { name: 'Alambre Cocido', type: 'material', unit_id: uKg, base_price: 1500, desc: 'Para amarras', cat: 'Enfierradura' },
      { name: 'Madera Pino 2x2', type: 'material', unit_id: uNo, base_price: 2500, desc: 'Pino aserrado 3.2m', cat: 'Moldaje' },
      { name: 'Placa Terciado Estructural 15mm', type: 'material', unit_id: uNo, base_price: 18000, desc: 'Moldaje', cat: 'Moldaje' },
      { name: 'Clavos', type: 'material', unit_id: uKg, base_price: 2200, desc: 'Diferentes pulgadas', cat: 'Moldaje' },
      { name: 'Yeso', type: 'material', unit_id: uKg, base_price: 300, desc: 'Saco 30kg', cat: 'Terminaciones' },
      { name: 'Pintura Esmalte al Agua', type: 'material', unit_id: uLit, base_price: 4500, desc: 'Tinte blanco', cat: 'Pintura' },

      // Mano de obra
      { name: 'Concretero', type: 'labor', unit_id: uDia, base_price: 35000, desc: 'Maestro Especialista', cat: 'Obra Gruesa' },
      { name: 'Enfierrador', type: 'labor', unit_id: uDia, base_price: 40000, desc: 'Maestro Primera', cat: 'Enfierradura' },
      { name: 'Carpintero Moldajista', type: 'labor', unit_id: uDia, base_price: 45000, desc: 'Maestro Primera', cat: 'Moldaje' },
      { name: 'Pintor', type: 'labor', unit_id: uDia, base_price: 30000, desc: 'Terminaciones', cat: 'Pintura' },
      { name: 'Ayudante', type: 'labor', unit_id: uDia, base_price: 22000, desc: 'Peoneta / Jornal', cat: 'General' },

      // Equipos
      { name: 'Vibrador de Inmersión', type: 'equipment', unit_id: uDia, base_price: 12000, desc: 'Gasolinero', cat: 'Maquinaria Menor' },
      { name: 'Camión Tolva 12m3', type: 'equipment', unit_id: uDia, base_price: 180000, desc: 'Transporte de aridos', cat: 'Transporte' },
      { name: 'Betonera 150L', type: 'equipment', unit_id: uDia, base_price: 15000, desc: 'Mezcladora', cat: 'Maquinaria Menor' }
    ];

    console.log('Inserting Resources...');
    const insertedResources = {};
    for (const r of globalResources) {
      if (!r.unit_id) {
        console.warn(`Skipping resource ${r.name} - Unit ID not found`);
        continue;
      }
      const { rows: existing } = await client.query('SELECT id, type FROM resources WHERE name = $1 AND company_id IS NULL', [r.name]);
      let resourceId;
      if (existing.length > 0) {
        resourceId = existing[0].id;
        console.log(`Resource ${r.name} already exists.`);
      } else {
        resourceId = crypto.randomUUID();
        await client.query(`
          INSERT INTO resources (id, name, type, unit_id, base_price, description, category, company_id, has_vat)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, false)
        `, [resourceId, r.name, r.type, r.unit_id, r.base_price, r.desc, r.cat]);
        console.log(`Inserted resource ${r.name}`);
      }
      insertedResources[r.name] = { id: resourceId, type: r.type };
    }

    // 3. Define global APUs
    const globalApus = [
      {
        name: 'Hormigón H25 en Muros',
        unit_id: uM3,
        description: 'Vaciado y vibrado',
        category: 'Obra Gruesa',
        resources: [
          { name: 'Hormigón H25', quantity: 1.05 },
          { name: 'Concretero', quantity: 0.8 },
          { name: 'Ayudante', quantity: 0.8 },
          { name: 'Vibrador de Inmersión', quantity: 0.1 }
        ]
      },
      {
        name: 'Suministro y Colocación Acero A630',
        unit_id: uKg,
        description: 'Corte, doblado y amarre',
        category: 'Enfierradura',
        resources: [
          { name: 'Acero A630-420H', quantity: 1.07 },
          { name: 'Alambre Cocido', quantity: 0.02 },
          { name: 'Enfierrador', quantity: 0.015 },
          { name: 'Ayudante', quantity: 0.015 }
        ]
      },
      {
        name: 'Pintura Interior 2 Manos',
        unit_id: uM2,
        description: 'Pintura esmalte',
        category: 'Terminaciones',
        resources: [
          { name: 'Pintura Esmalte al Agua', quantity: 0.2 },
          { name: 'Pintor', quantity: 0.04 }
        ]
      }
    ];

    console.log('Inserting APU Templates...');
    for (const apu of globalApus) {
      const { rows: existingApu } = await client.query('SELECT id FROM apu_templates WHERE name = $1 AND company_id IS NULL', [apu.name]);
      let apuId;
      if (existingApu.length > 0) {
        apuId = existingApu[0].id;
        console.log(`APU ${apu.name} already exists.`);
      } else {
        apuId = crypto.randomUUID();
        await client.query(`
          INSERT INTO apu_templates (id, name, unit_id, description, category, company_id)
          VALUES ($1, $2, $3, $4, $5, NULL)
        `, [apuId, apu.name, apu.unit_id, apu.description, apu.category]);
        console.log(`Inserted APU ${apu.name}`);
      }

      for (const res of apu.resources) {
        const resourceData = insertedResources[res.name];
        if (resourceData) {
          const { rows: existingLink } = await client.query('SELECT id FROM apu_resources WHERE apu_id = $1 AND resource_id = $2', [apuId, resourceData.id]);
          if (existingLink.length === 0) {
            await client.query(`
              INSERT INTO apu_resources (id, apu_id, resource_id, resource_type, coefficient)
              VALUES ($1, $2, $3, $4, $5)
            `, [crypto.randomUUID(), apuId, resourceData.id, resourceData.type, res.quantity]);
          }
        }
      }
    }

    console.log('Global catalog seeded successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await client.end();
  }
}

run();
