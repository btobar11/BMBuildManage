const { Client } = require('pg');

const poolerUrl = 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: poolerUrl,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // We cannot easily alter ENUM values in Postgres without dropping/recreating or using ADD VALUE
    // Let's change the status column to VARCHAR so we don't have ENUM issues
    await client.query(`ALTER TABLE "projects" ALTER COLUMN "status" TYPE VARCHAR(255)`);
    await client.query(`ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'draft'`);
    
    // Add missing columns
    await client.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "type" VARCHAR(255)`);
    await client.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimated_price" NUMERIC(15,2) DEFAULT 0`);
    
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Error in migration', err.stack);
  } finally {
    client.end();
  }
}

run();
