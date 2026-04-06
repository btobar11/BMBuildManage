import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('🌱 Starting seed via direct PostgreSQL...');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000001';
  const clientId = '00000000-0000-0000-0000-000000000002';
  const projectId = '00000000-0000-0000-0000-000000000003';
  const budgetId = '00000000-0000-0000-0000-000000000004';

  try {
    // Insert company
    await pool.query(`
      INSERT INTO companies (id, name, email, phone, address)
      VALUES ($1, 'Constructora Demo C.A.', 'demo@bmbuildmanage.com', '+58 212 555 1234', 'Av. Principal, Caracas')
      ON CONFLICT (id) DO NOTHING
    `, [companyId]);
    console.log('✅ Company created');

    // Insert user
    await pool.query(`
      INSERT INTO users (id, email, name, company_id, role)
      VALUES ($1, 'demo@bmbuildmanage.com', 'Usuario Demo', $2, 'admin')
      ON CONFLICT (id) DO NOTHING
    `, [userId, companyId]);
    console.log('✅ User created');

    // Insert client
    await pool.query(`
      INSERT INTO clients (id, company_id, name, email, phone, address)
      VALUES ($1, $2, 'Inmobiliaria Horizonte C.A.', 'jperez@horizonte.com', '+58 212 555 5678', 'Torre Business, Caracas')
      ON CONFLICT (id) DO NOTHING
    `, [clientId, companyId]);
    console.log('✅ Client created');

    // Insert project
    await pool.query(`
      INSERT INTO projects (id, company_id, client_id, name, location, status, start_date, end_date, estimated_budget)
      VALUES ($1, $2, $3, 'Edificio Residencial Torres del Parque', 'Av. Libertador, Caracas', 'in_progress', '2025-01-15', '2026-06-30', 4500000)
      ON CONFLICT (id) DO NOTHING
    `, [projectId, companyId, clientId]);
    console.log('✅ Project created');

    // Insert budget
    await pool.query(`
      INSERT INTO budgets (id, project_id, status, version, is_active, total_estimated_cost, total_estimated_price)
      VALUES ($1, $2, 'approved', 1, true, 4200000, 5800000)
      ON CONFLICT (id) DO NOTHING
    `, [budgetId, projectId]);
    console.log('✅ Budget created');

    // Insert stages and items
    const stages = [
      { name: 'Cimentación', cost: 450000, price: 600000 },
      { name: 'Estructura', cost: 1200000, price: 1600000 },
      { name: 'Muros y Divisiones', cost: 600000, price: 800000 },
      { name: 'Instalaciones Eléctricas', cost: 350000, price: 480000 },
      { name: 'Instalaciones Hidrosanitarias', cost: 400000, price: 550000 },
      { name: 'Acabados', cost: 800000, price: 1100000 },
      { name: 'Equipamiento', cost: 400000, price: 670000 },
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageId = `00000000-0000-0000-1000-${String(i).padStart(10, '0')}`;
      
      await pool.query(`
        INSERT INTO stages (id, budget_id, name, position, total_cost, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [stageId, budgetId, stage.name, i + 1, stage.cost, stage.price]);

      const items = getItemsForStage(i);
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        const itemId = `00000000-0000-0000-2000-${String(i).padStart(2, '0')}${String(j).padStart(8, '0')}`;
        
        await pool.query(`
          INSERT INTO items (id, stage_id, name, quantity, unit, unit_cost, unit_price, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [itemId, stageId, item.name, item.quantity, item.unit, item.unit_cost, item.unit_price, j]);
      }
    }
    console.log('✅ Stages and items created');

    // Insert workers
    const workers = [
      { name: 'Carlos Martínez', role: 'Albañil', rate: 45 },
      { name: 'José Rodríguez', role: 'Albañil', rate: 45 },
      { name: 'Pedro Sánchez', role: 'Carpintero', rate: 55 },
      { name: 'Miguel Torres', role: 'Electricista', rate: 60 },
      { name: 'Luis Hernández', role: 'Plomero', rate: 58 },
      { name: 'Juan García', role: 'Ing. Civil', rate: 120 },
      { name: 'Andrea López', role: 'Arquitecto', rate: 100 },
      { name: 'Roberto Díaz', role: 'Maestro de Obra', rate: 80 },
    ];

    for (let i = 0; i < workers.length; i++) {
      const w = workers[i];
      const workerId = `00000000-0000-0000-3000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO workers (id, company_id, name, role, daily_rate, rating)
        VALUES ($1, $2, $3, $4, $5, 4.5)
        ON CONFLICT (id) DO NOTHING
      `, [workerId, companyId, w.name, w.role, w.rate]);
    }
    console.log('✅ Workers created');

    // Insert schedule tasks
    const tasks = [
      { name: 'Cimentación completa', start: '2025-01-15', end: '2025-03-15', progress: 100, status: 'completed' },
      { name: 'Estructura pisos 1-10', start: '2025-03-16', end: '2025-07-30', progress: 85, status: 'in_progress' },
      { name: 'Estructura pisos 11-20', start: '2025-08-01', end: '2025-12-15', progress: 30, status: 'in_progress' },
      { name: 'Instalaciones eléctricas', start: '2025-08-15', end: '2026-02-28', progress: 20, status: 'in_progress' },
      { name: 'Acabados finales', start: '2026-01-15', end: '2026-05-30', progress: 0, status: 'pending' },
      { name: 'Entrega del proyecto', start: '2026-06-01', end: '2026-06-30', progress: 0, status: 'pending' },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const taskId = `00000000-0000-0000-8000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO schedule_tasks (id, project_id, name, start_date, end_date, progress, status, priority, duration, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 30, $9)
        ON CONFLICT (id) DO NOTHING
      `, [taskId, projectId, t.name, t.start, t.end, t.progress, t.status, t.progress > 50 ? 'high' : 'medium', i]);
    }
    console.log('✅ Schedule tasks created');

    // Insert RFIs
    const rfis = [
      { title: 'Aclaración de especificación de tubería', status: 'open', priority: 'high' },
      { title: 'Solicitud de detalle de unión de vigas', status: 'answered', priority: 'medium' },
      { title: 'Consulta sobre material de acabado', status: 'closed', priority: 'low' },
    ];

    for (let i = 0; i < rfis.length; i++) {
      const r = rfis[i];
      const rfiId = `00000000-0000-0000-5000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO rfis (id, project_id, title, status, priority, question)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [rfiId, projectId, r.title, r.status, r.priority, `Se requiere aclaración sobre: ${r.title}`]);
    }
    console.log('✅ RFIs created');

    // Insert submittals
    const submittals = [
      { title: 'Muestras de piso porcelánico', status: 'pending', spec_section: '09 30 00' },
      { title: 'Catálogo de griferías', status: 'approved', spec_section: '22 40 00' },
      { title: 'Certificación de acero estructural', status: 'in_review', spec_section: '05 12 00' },
    ];

    for (let i = 0; i < submittals.length; i++) {
      const s = submittals[i];
      const subId = `00000000-0000-0000-6000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO submittals (id, project_id, title, status, spec_section)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [subId, projectId, s.title, s.status, s.spec_section]);
    }
    console.log('✅ Submittals created');

    // Insert punch items
    const punchItems = [
      { title: 'Reparar grieta en pared cocina', status: 'open', location: 'Apartamento 501' },
      { title: 'Ajustar puerta baño', status: 'completed', location: 'Apartamento 302' },
      { title: 'Pintura retoca pasillo piso 5', status: 'in_progress', location: 'Pasillo piso 5' },
    ];

    for (let i = 0; i < punchItems.length; i++) {
      const p = punchItems[i];
      const punchId = `00000000-0000-0000-7000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO punch_items (id, project_id, title, status, location)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [punchId, projectId, p.title, p.status, p.location]);
    }
    console.log('✅ Punch items created');

    // Insert expenses
    const expenses = [
      { description: 'Compra de materiales estructurales', amount: 250000, category: 'materials' },
      { description: 'Alquiler de grúa torre', amount: 45000, category: 'equipment' },
      { description: 'Transporte de materiales', amount: 18000, category: 'logistics' },
      { description: 'Permiso de construcción', amount: 12000, category: 'permits' },
      { description: 'Servicios profesionales ingeniería', amount: 35000, category: 'services' },
    ];

    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      const expId = `00000000-0000-0000-9000-${String(i).padStart(10, '0')}`;
      await pool.query(`
        INSERT INTO expenses (id, project_id, description, amount, category)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [expId, projectId, e.description, e.amount, e.category]);
    }
    console.log('✅ Expenses created');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Credenciales:');
    console.log('Email: demo@bmbuildmanage.com');
    console.log('Password: demo123456');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

function getItemsForStage(stageIndex: number): any[] {
  const itemsByStage = [
    [
      { name: 'Excavación mecánica', quantity: 2500, unit: 'm3', unit_cost: 18, unit_price: 24 },
      { name: 'Fundación zapata aislada', quantity: 120, unit: 'und', unit_cost: 850, unit_price: 1150 },
      { name: 'Fundación zapata corrida', quantity: 85, unit: 'm3', unit_cost: 420, unit_price: 560 },
      { name: 'Viga de cimentación', quantity: 180, unit: 'm3', unit_cost: 480, unit_price: 640 },
    ],
    [
      { name: 'Columnas estructura', quantity: 450, unit: 'm3', unit_cost: 520, unit_price: 700 },
      { name: 'Vigas entrepiso', quantity: 680, unit: 'm3', unit_cost: 490, unit_price: 650 },
      { name: 'Losa entrepiso', quantity: 1250, unit: 'm2', unit_cost: 120, unit_price: 160 },
    ],
    [
      { name: 'Bloques estructurales', quantity: 8500, unit: 'und', unit_cost: 3.5, unit_price: 4.8 },
      { name: 'Mortero pega', quantity: 45, unit: 'm3', unit_cost: 185, unit_price: 250 },
    ],
    [
      { name: 'Cableado eléctrico', quantity: 8500, unit: 'm', unit_cost: 4.2, unit_price: 5.8 },
      { name: 'Tableros eléctricos', quantity: 25, unit: 'und', unit_cost: 2500, unit_price: 3400 },
    ],
    [
      { name: 'Tubería agua potable', quantity: 2200, unit: 'm', unit_cost: 12, unit_price: 16 },
      { name: 'Sanitarios', quantity: 120, unit: 'und', unit_cost: 350, unit_price: 480 },
    ],
    [
      { name: 'Piso porcelánico', quantity: 4500, unit: 'm2', unit_cost: 45, unit_price: 62 },
      { name: 'Pintura', quantity: 8200, unit: 'm2', unit_cost: 8, unit_price: 12 },
    ],
    [
      { name: 'Equipos de cocina', quantity: 120, unit: 'und', unit_cost: 1800, unit_price: 2500 },
      { name: 'Aire acondicionado', quantity: 125, unit: 'und', unit_cost: 2200, unit_price: 3000 },
    ],
  ];
  return itemsByStage[stageIndex] || [];
}

seed();