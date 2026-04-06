import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected to database");
    
    const sql = fs.readFileSync(resolve(__dirname, 'seed_library.sql'), 'utf-8');
    
    await client.query(sql);
    console.log("✅ SQL Seed Executed successfully");
  } catch (error) {
    console.error("❌ Error executing SQL:", error.message);
  } finally {
    await client.end();
  }
}

run();
