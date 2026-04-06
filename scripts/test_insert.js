const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config({ path: 'c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\apps\\api\\.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const id = crypto.randomUUID();
    const unitRes = await client.query('SELECT id FROM units LIMIT 1');
    const unitId = unitRes.rows[0].id;
    
    await client.query(`
      INSERT INTO resources (id, name, type, unit_id, base_price, description, category, company_id, has_vat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, false)
    `, [id, 'Test Resource ' + Date.now(), 'material', unitId, 100, 'Test desc', 'Test cat']);
    
    console.log('Test insert succeeded!');
  } catch (error) {
    const errInfo = `Error: ${error.message}\nDetail: ${error.detail}\nCode: ${error.code}\nStack: ${error.stack}`;
    fs.writeFileSync('error_log.txt', errInfo);
    console.error('Test insert failed. See error_log.txt');
  } finally {
    await client.end();
  }
}

run();
