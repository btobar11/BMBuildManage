const { Client } = require('pg');
require('dotenv').config({ path: '../apps/api/.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Renaming column...');
    await client.query('ALTER TABLE units RENAME COLUMN abbreviation TO symbol');
    console.log('Column renamed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

run();
