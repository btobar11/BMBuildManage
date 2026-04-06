import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkColumns(table: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table]
  );
  return result.rows.map(r => r.column_name);
}

async function seed() {
  console.log('🌱 Starting minimal seed...');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000001';
  const clientId = '00000000-0000-0000-0000-000000000002';
  const projectId = '00000000-0000-0000-0000-000000000003';
  const budgetId = '00000000-0000-0000-0000-000000000004';

  try {
    // Insert company (basic columns only)
    await pool.query(`
      INSERT INTO companies (id, name)
      VALUES ($1, 'Constructora Demo C.A.')
      ON CONFLICT (id) DO NOTHING
    `, [companyId]);
    console.log('✅ Company');

    // Insert user
    await pool.query(`
      INSERT INTO users (id, email, name, company_id)
      VALUES ($1, 'demo@bmbuildmanage.com', 'Usuario Demo', $2)
      ON CONFLICT (id) DO NOTHING
    `, [userId, companyId]);
    console.log('✅ User');

    // Check clients columns
    const clientCols = await checkColumns('clients');
    console.log('Client columns:', clientCols.join(', '));
    
    // Insert client with available columns
    const clientValues = [clientId, companyId, 'Inmobiliaria Horizonte C.A.'];
    const clientColsStr = clientCols.slice(0, 3).join(', ');
    await pool.query(`
      INSERT INTO clients (${clientColsStr})
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `, clientValues);
    console.log('✅ Client');

    // Check projects columns
    const projectCols = await checkColumns('projects');
    console.log('Project columns:', projectCols.join(', '));

    // Check if estimated_price exists
    const hasEstimatedPrice = projectCols.includes('estimated_price');
    let projectValues: any[];
    
    if (hasEstimatedPrice) {
      projectValues = [projectId, companyId, clientId, 'Edificio Residencial Torres del Parque', 'Av. Libertador, Caracas', 'in_progress', '2025-01-15', '2026-06-30', 4500000, 5800000];
    } else {
      projectValues = [projectId, companyId, clientId, 'Edificio Residencial Torres del Parque', 'Av. Libertador, Caracas', 'in_progress', '2025-01-15', '2026-06-30', 4500000];
    }

    const projectColsFiltered = projectCols.filter(c => c !== 'id' && c !== 'company_id' && c !== 'client_id').slice(0, projectValues.length);
    await pool.query(`
      INSERT INTO projects (id, company_id, client_id, ${projectColsFiltered.join(', ')})
      VALUES ($1, $2, $3, ${projectColsFiltered.map((_, i) => `$${i + 4}`).join(', ')})
      ON CONFLICT (id) DO NOTHING
    `, [projectId, companyId, clientId, ...projectValues]);
    console.log('✅ Project');

    // Insert budget
    await pool.query(`
      INSERT INTO budgets (id, project_id, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (id) DO NOTHING
    `, [budgetId, projectId]);
    console.log('✅ Budget');

    // Check stages columns
    const stageCols = await checkColumns('stages');
    console.log('Stage columns:', stageCols.join(', '));

    // Insert stages
    const stages = ['Cimentación', 'Estructura', 'Muros y Divisiones', 'Instalaciones Eléctricas', 'Instalaciones Hidrosanitarias', 'Acabados', 'Equipamiento'];
    for (let i = 0; i < stages.length; i++) {
      const stageId = `00000000-0000-0000-1000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO stages (id, budget_id, name, position)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [stageId, budgetId, stages[i], i + 1]);
    }
    console.log('✅ Stages');

    // Insert workers
    const workers = ['Carlos Martínez', 'José Rodríguez', 'Pedro Sánchez', 'Miguel Torres', 'Luis Hernández', 'Juan García', 'Andrea López', 'Roberto Díaz'];
    for (let i = 0; i < workers.length; i++) {
      const workerId = `00000000-0000-0000-3000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO workers (id, company_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [workerId, companyId, workers[i]]);
    }
    console.log('✅ Workers');

    console.log('\n✅ Seed completed!');
    console.log('\n📝 Login con:');
    console.log('Email: demo@bmbuildmanage.com');
    console.log('Password: demo123456 (o el que ya tengas)');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();