const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres', 
  ssl: { rejectUnauthorized: false } 
});

async function fix() {
  console.log('🔍 Buscando usuario demo@bmbuildmanage.com...');
  
  const userResult = await pool.query(
    "SELECT id, email, company_id FROM users WHERE email = 'demo@bmbuildmanage.com' LIMIT 1"
  );
  
  if (userResult.rows.length === 0) {
    console.log('❌ No hay usuario demo@bmbuildmanage.com');
    
    // Create user
    const companyId = '99999999-9999-9999-9999-999999999999';
    const userId = '99999999-9999-9999-9999-999999999999';
    
    await pool.query(`INSERT INTO companies (id, name) VALUES ($1, 'Empresa de Prueba') ON CONFLICT (id) DO NOTHING`, [companyId]);
    await pool.query(`INSERT INTO users (id, email, company_id) VALUES ($1, 'demo@bmbuildmanage.com', $2) ON CONFLICT (id) DO NOTHING`, [userId, companyId]);
    console.log('✅ Usuario creado');
    
    // Create project for this company
    const projectId = '99999999-9999-9999-9999-999999999998';
    await pool.query(
      `INSERT INTO projects (id, company_id, name, status, estimated_budget) VALUES ($1, $2, 'Proyecto Demo', 'in_progress', 1000000) ON CONFLICT (id) DO NOTHING`,
      [projectId, companyId]
    );
    console.log('✅ Proyecto creado');
    
  } else {
    const user = userResult.rows[0];
    console.log('✅ Usuario encontrado:', user);
    
    // Check projects for this company
    const projectResult = await pool.query(
      'SELECT id, name, company_id FROM projects WHERE company_id = $1',
      [user.company_id]
    );
    
    console.log('✅ Proyectos:', projectResult.rows);
    
    if (projectResult.rows.length === 0) {
      // Create project for this user
      const projectId = '99999999-9999-9999-9999-999999999998';
      await pool.query(
        `INSERT INTO projects (id, company_id, name, status, estimated_budget) VALUES ($1, $2, 'Edificio Demo', 'in_progress', 5000000) ON CONFLICT (id) DO NOTHING`,
        [projectId, user.company_id]
      );
      console.log('✅ Proyecto creado para la empresa');
    }
  }
  
  pool.end();
}

fix().catch(console.error);
