import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables in database:');
    tablesResult.rows.forEach(t => console.log('  -', t.table_name));
    
    // Check companies count
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log('\nCompanies count:', countResult.rows[0].count);
    
    // Check projects count
    const projCount = await pool.query('SELECT COUNT(*) FROM projects');
    console.log('Projects count:', projCount.rows[0].count);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();