import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

function uuid4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function seed() {
  console.log('🌱 Starting seed...');

  const companyId = uuid4();
  const userId = uuid4();
  const clientId = uuid4();
  const projectId = uuid4();
  const budgetId = uuid4();

  try {
    await pool.query(`INSERT INTO companies (id, name) VALUES ($1, 'Constructora Demo C.A.') ON CONFLICT (id) DO NOTHING`, [companyId]);
    console.log('✅ Company');

    await pool.query(`INSERT INTO users (id, email, name, company_id) VALUES ($1, 'demo@bmbuildmanage.com', 'Usuario Demo', $2) ON CONFLICT (id) DO NOTHING`, [userId, companyId]);
    console.log('✅ User');

    await pool.query(`INSERT INTO clients (id, company_id, name) VALUES ($1, $2, 'Inmobiliaria Horizonte') ON CONFLICT (id) DO NOTHING`, [clientId, companyId]);
    console.log('✅ Client');

    await pool.query(`INSERT INTO projects (id, company_id, client_id, name, status, estimated_budget) VALUES ($1, $2, $3, 'Edificio Torres del Parque', 'in_progress', 4500000) ON CONFLICT (id) DO NOTHING`, [projectId, companyId, clientId]);
    console.log('✅ Project');

    await pool.query(`INSERT INTO budgets (id, project_id, is_active) VALUES ($1, $2, true) ON CONFLICT (id) DO NOTHING`, [budgetId, projectId]);
    console.log('✅ Budget');

    const stages = ['Cimentación', 'Estructura', 'Muros', 'Electricidad', 'Hidrosanitaria', 'Acabados'];
    for (let i = 0; i < stages.length; i++) {
      await pool.query(`INSERT INTO stages (id, budget_id, name, position) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`, [uuid4(), budgetId, stages[i], i + 1]);
    }
    console.log('✅ Stages');

    const workers = ['Carlos Martínez', 'José Rodríguez', 'Pedro Sánchez', 'Miguel Torres'];
    for (let i = 0; i < workers.length; i++) {
      await pool.query(`INSERT INTO workers (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [uuid4(), companyId, workers[i]]);
    }
    console.log('✅ Workers');

    console.log('\n✅ Listo!');
    console.log('Email: demo@bmbuildmanage.com');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();