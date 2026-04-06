const { Client } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\apps\\api\\.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT name FROM resources WHERE company_id IS NULL ORDER BY name");
    console.log('ALL_GLOBAL_RESOURCES:' + res.rows.map(r => r.name).join(', '));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

run();
