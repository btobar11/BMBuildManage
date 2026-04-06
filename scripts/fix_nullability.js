const { Client } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\apps\\api\\.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Make company_id nullable in resources
    await client.query('ALTER TABLE resources ALTER COLUMN company_id DROP NOT NULL');

    // 2. Make company_id nullable in apu_templates if it exists
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_templates' AND column_name = 'company_id') THEN
          ALTER TABLE apu_templates ALTER COLUMN company_id DROP NOT NULL;
        END IF;
      END $$;
    `);

    console.log('Schema updated: company_id is now nullable in resources and apu_templates.');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

run();
