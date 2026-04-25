const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const mig1 = fs.readFileSync(path.join(__dirname, 'apps/api/src/modules/subscriptions/migrations/001_create_subscription_system.sql'), 'utf8');
    const mig2 = fs.readFileSync(path.join(__dirname, 'apps/api/src/modules/subscriptions/migrations/002_saas_monetization.sql'), 'utf8');

    console.log('Running 001...');
    await client.query(mig1);
    console.log('001 complete.');

    console.log('Running 002...');
    await client.query(mig2);
    console.log('002 complete.');
  } catch (err) {
    console.error('Error applying migrations', err);
  } finally {
    await client.end();
  }
}

run();
