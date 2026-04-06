import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('🌱 Starting minimal seed...');

  const companyId = '11111111-1111-1111-1111-111111111111';
  const userId = '11111111-1111-1111-1111-111111111111';
  const clientId = '11111111-1111-1111-1111-111111111112';
  const projectId = '11111111-1111-1111-1111-111111111113';
  const budgetId = '11111111-1111-1111-1111-111111111114';

  try {
    await pool.query(`INSERT INTO companies (id, name) VALUES ($1, 'Constructora Demo C.A.') ON CONFLICT (id) DO NOTHING`, [companyId]);
    console.log('✅ Company');

    await pool.query(`INSERT INTO users (id, email, name, company_id) VALUES ($1, 'demo@bmbuildmanage.com', 'Usuario Demo', $2) ON CONFLICT (id) DO NOTHING`, [userId, companyId]);
    console.log('✅ User');

    await pool.query(`INSERT INTO clients (id, company_id, name) VALUES ($1, $2, 'Inmobiliaria Horizonte C.A.') ON CONFLICT (id) DO NOTHING`, [clientId, companyId]);
    console.log('✅ Client');

    await pool.query(`INSERT INTO projects (id, company_id, client_id, name, location, status, estimated_budget) VALUES ($1, $2, $3, 'Edificio Torres del Parque', 'Caracas', 'in_progress', 4500000) ON CONFLICT (id) DO NOTHING`, [projectId, companyId, clientId]);
    console.log('✅ Project');

    await pool.query(`INSERT INTO budgets (id, project_id, is_active) VALUES ($1, $2, true) ON CONFLICT (id) DO NOTHING`, [budgetId, projectId]);
    console.log('✅ Budget');

    const stages = ['Cimentación', 'Estructura', 'Muros', 'Electricidad', 'Hidrosanitaria', 'Acabados'];
    for (let i = 0; i < stages.length; i++) {
      const stageId = `22222222-2222-2222-2222-${String(i).padStart(10, '2')}`;
      await pool.query(`INSERT INTO stages (id, budget_id, name, position) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`, [stageId, budgetId, stages[i], i + 1]);
    }
    console.log('✅ Stages');

    const workers = ['Carlos Martínez', 'José Rodríguez', 'Pedro Sánchez', 'Miguel Torres'];
    for (let i = 0; i < workers.length; i++) {
      const workerId = `33333333-3333-3333-3333-${String(i).padStart(10, '3')}`;
      await pool.query(`INSERT INTO workers (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [workerId, companyId, workers[i]]);
    }
    console.log('✅ Workers');

    console.log('\n✅ Seed completo!');
    console.log('\n📝 Login con: demo@bmbuildmanage.com');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();