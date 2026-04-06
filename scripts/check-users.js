const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query('SELECT email, name FROM users');
  console.log('Users:', JSON.stringify(res.rows));
  pool.end();
}

check().catch(console.error);
