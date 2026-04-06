const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const query = `ALTER TABLE resources ADD COLUMN IF NOT EXISTS has_vat boolean DEFAULT false;`;
    console.log('Aplicando migracion...', query);
    await client.query(query);
    console.log('Exito!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

run();
