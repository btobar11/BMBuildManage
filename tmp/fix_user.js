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

    const demoCompanyId = '77777777-7777-7777-7777-777777777777';
    
    // Update test@example.com to point to demo company
    const res = await client.query('UPDATE users SET company_id = $1 WHERE email = $2', [demoCompanyId, 'test@example.com']);
    console.log(`Updated ${res.rowCount} user(s) to demo company`);

    // Verify
    const verifyRes = await client.query('SELECT u.email, c.name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.email = $1', ['test@example.com']);
    console.log('Verification:', verifyRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
