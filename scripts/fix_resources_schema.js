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

    // 1. Rename unit_cost to base_price if it exists
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'unit_cost') THEN
          ALTER TABLE resources RENAME COLUMN unit_cost TO base_price;
        END IF;
      END $$;
    `);

    // 2. Rename unit to unit_id and change type to uuid if needed, OR add unit_id
    const { rows: unitRows } = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'unit'");
    if (unitRows.length > 0) {
      console.log('Replacing unit (legacy) with unit_id (uuid)...');
      await client.query('ALTER TABLE resources RENAME COLUMN unit TO unit_legacy');
      await client.query('ALTER TABLE resources ADD COLUMN unit_id uuid REFERENCES units(id)');
    } else {
        const { rows: unitIdRows } = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'unit_id'");
        if (unitIdRows.length === 0) {
            await client.query('ALTER TABLE resources ADD COLUMN unit_id uuid REFERENCES units(id)');
        }
    }

    // 3. Add description if missing
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'description') THEN
          ALTER TABLE resources ADD COLUMN description text;
        END IF;
      END $$;
    `);

    console.log('Resources schema fixed (description added, price renamed, units handled)!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

run();
