require('dotenv').config({path: 'apps/api/.env'});
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  await client.connect();
  const dbSchema = {};
  
  let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items';");
  dbSchema.items = res.rows;
  
  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resources';");
  dbSchema.resources = res.rows;
  
  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'apu_templates';");
  dbSchema.apu_templates = res.rows;

  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'apu_resources';");
  dbSchema.apu_resources = res.rows;

  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'units';");
  dbSchema.units = res.rows;
  
  require('fs').writeFileSync('scripts/db_schemas.json', JSON.stringify(dbSchema, null, 2));
  console.log('Saved to scripts/db_schemas.json');
  await client.end();
}

check().catch(console.error);
