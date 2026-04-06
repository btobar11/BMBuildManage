const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
  });

  await client.connect();
  
  const query = `
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS type TEXT NULL,
      ADD COLUMN IF NOT EXISTS folder TEXT NULL,
      ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(15, 2) NULL;
  `;
  
  try {
    await client.query(query);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await client.end();
  }
}

migrate();
