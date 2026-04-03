const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'c:/Users/benja/OneDrive/Escritorio/BMBuildManage/apps/api/.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add company_id to expenses if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='company_id') THEN
          ALTER TABLE expenses ADD COLUMN company_id UUID;
        END IF;
      END $$;
    `);
    console.log('Checked/Added company_id to expenses');

    // Add company_id to other tables if they are missing but in entities
    // For now, only focus on what failed
    
    // Check project_contingencies for company_id (Wait, entity didn't have it, but maybe it should?)
    // Seed service was NOT sending it for contingencies.
    
    console.log('Migration complete');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await client.end();
  }
}

run();
