const { Client } = require('pg');
const path = require('path');
const envPath = path.resolve(__dirname, '../apps/api/.env');
require('dotenv').config({ path: envPath });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Running migration...');
    
    // 1. Fix units table
    const { rows: unitCols } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'units'");
    const unitColsList = unitCols.map(c => c.column_name);
    
    if (!unitColsList.includes('category')) {
      console.log('Adding category to units...');
      await client.query('ALTER TABLE units ADD COLUMN category character varying DEFAULT \'otro\'');
    }
    if (!unitColsList.includes('created_at')) {
      console.log('Adding created_at to units...');
      await client.query('ALTER TABLE units ADD COLUMN created_at timestamp with time zone DEFAULT now()');
    }
    if (!unitColsList.includes('updated_at')) {
      console.log('Adding updated_at to units...');
      await client.query('ALTER TABLE units ADD COLUMN updated_at timestamp with time zone DEFAULT now()');
    }
    
    // 2. Fix apu_templates table
    const { rows: apuCols } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'apu_templates'");
    const apuColsList = apuCols.map(c => c.column_name);
    
    if (!apuColsList.includes('unit_id')) {
      console.log('Adding unit_id to apu_templates...');
      await client.query('ALTER TABLE apu_templates ADD COLUMN unit_id uuid');
      
      if (apuColsList.includes('unit')) {
        console.log('Migrating unit strings to unit_id...');
        await client.query(`
          UPDATE apu_templates 
          SET unit_id = (SELECT id FROM units WHERE symbol = apu_templates.unit LIMIT 1)
        `);
        console.log('Dropping old unit column...');
        await client.query('ALTER TABLE apu_templates DROP COLUMN unit');
      }
    }
    
    if (!apuColsList.includes('description')) {
      console.log('Adding description to apu_templates...');
      await client.query('ALTER TABLE apu_templates ADD COLUMN description text');
    }
    if (!apuColsList.includes('category')) {
      console.log('Adding category to apu_templates...');
      await client.query('ALTER TABLE apu_templates ADD COLUMN category character varying');
    }
    if (!apuColsList.includes('updated_at')) {
      console.log('Adding updated_at to apu_templates...');
      await client.query('ALTER TABLE apu_templates ADD COLUMN updated_at timestamp with time zone DEFAULT now()');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

run();
