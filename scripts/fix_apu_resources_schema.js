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

    // 1. Rename apu_template_id to apu_id
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_resources' AND column_name = 'apu_template_id') THEN
          ALTER TABLE apu_resources RENAME COLUMN apu_template_id TO apu_id;
        END IF;
      END $$;
    `);

    // 2. Rename quantity to coefficient
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_resources' AND column_name = 'quantity') THEN
          ALTER TABLE apu_resources RENAME COLUMN quantity TO coefficient;
        END IF;
      END $$;
    `);

    // 3. Add resource_type if missing (NestJS entity has it as a column in some versions, or it's needed for the seed)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_resources' AND column_name = 'resource_type') THEN
          ALTER TABLE apu_resources ADD COLUMN resource_type varchar;
        END IF;
      END $$;
    `);

    console.log('apu_resources schema fixed!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

run();
