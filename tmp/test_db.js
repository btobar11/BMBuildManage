const { Client } = require('pg');
const poolerUrl = 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({
  connectionString: poolerUrl,
});
client.connect()
  .then(() => {
    console.log('Connected carefully');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Result:', res.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
