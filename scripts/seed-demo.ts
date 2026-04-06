import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfzkrnfyfwonxyceugya.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTkwNywiZXhwIjoyMDg4OTk3OTA3fQ.4MZdd_SOgzPCuvNfx49AswALEkPifrTZUL3OWYpybOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting seed with service role...');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000001';
  const clientId = '00000000-0000-0000-0000-000000000002';
  const projectId = '00000000-0000-0000-0000-000000000003';
  const budgetId = '00000000-0000-0000-0000-000000000004';

  console.log('📦 Creating company...');
  await supabase.from('companies').upsert({
    id: companyId,
    name: 'Constructora Demo C.A.',
    email: 'demo@bmbuildmanage.com',
    phone: '+58 212 555 1234',
    address: 'Av. Principal, Edificio Centro, Caracas',
  });

  console.log('👤 Creating user...');
  await supabase.from('users').upsert({
    id: userId,
    email: 'demo@bmbuildmanage.com',
    name: 'Usuario Demo',
    company_id: companyId,
    role: 'admin',
  });

  console.log('🏢 Creating client...');
  await supabase.from('clients').upsert({
    id: clientId,
    company_id: companyId,
    name: 'Inmobiliaria Horizonte C.A.',
    contact_name: 'Juan Pérez',
    email: 'jperez@horizonte.com',
    phone: '+58 212 555 5678',
    address: 'Torre Business, Piso 15, Caracas',
  });

  console.log('🏗️ Creating project...');
  await supabase.from('projects').upsert({
    id: projectId,
    company_id: companyId,
    client_id: clientId,
    name: 'Edificio Residencial Torres del Parque',
    description: 'Proyecto de construcción de edificio residencial de 20 pisos.',
    location: 'Av. Libertador, Caracas',
    type: 'residential',
    status: 'in_progress',
    start_date: '2025-01-15',
    end_date: '2026-06-30',
    estimated_budget: 4500000,
    estimated_price: 5800000,
  });

  console.log('💰 Creating budget...');
  await supabase.from('budgets').upsert({
    id: budgetId,
    project_id: projectId,
    status: 'approved',
    version: 1,
    is_active: true,
    total_estimated_cost: 4200000,
    total_estimated_price: 5800000,
  });

  const stages = [
    { name: 'Cimentación', position: 1, total_cost: 450000, total_price: 600000 },
    { name: 'Estructura', position: 2, total_cost: 1200000, total_price: 1600000 },
    { name: 'Muros y Divisiones', position: 3, total_cost: 600000, total_price: 800000 },
    { name: 'Instalaciones Eléctricas', position: 4, total_cost: 350000, total_price: 480000 },
    { name: 'Instalaciones Hidrosanitarias', position: 5, total_cost: 400000, total_price: 550000 },
    { name: 'Acabados', position: 6, total_cost: 800000, total_price: 1100000 },
    { name: 'Equipamiento', position: 7, total_cost: 400000, total_price: 670000 },
  ];

  console.log('📋 Creating stages and items...');
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const stageId = `00000000-0000-0000-1000-${String(i).padStart(10, '0')}`;
    
    await supabase.from('stages').upsert({
      id: stageId,
      budget_id: budgetId,
      name: stage.name,
      position: stage.position,
      total_cost: stage.total_cost,
      total_price: stage.total_price,
    });

    const items = getItemsForStage(i);
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const itemId = `00000000-0000-0000-2000-${String(i).padStart(2, '0')}${String(j).padStart(8, '0')}`;
      
      await supabase.from('items').upsert({
        id: itemId,
        stage_id: stageId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        unit_price: item.unit_price,
        position: j,
      });
    }
  }

  console.log('👷 Creating workers...');
  const workers = [
    { name: 'Carlos Martínez', role: 'Albañil', daily_rate: 45, rating: 4.5 },
    { name: 'José Rodríguez', role: 'Albañil', daily_rate: 45, rating: 4.2 },
    { name: 'Pedro Sánchez', role: 'Carpintero', daily_rate: 55, rating: 4.8 },
    { name: 'Miguel Torres', role: 'Electricista', daily_rate: 60, rating: 4.6 },
    { name: 'Luis Hernández', role: 'Plomero', daily_rate: 58, rating: 4.4 },
    { name: 'Juan García', role: 'Ing. Civil', daily_rate: 120, rating: 4.9 },
    { name: 'Andrea López', role: 'Arquitecto', daily_rate: 100, rating: 4.7 },
    { name: 'Roberto Díaz', role: 'Maestro de Obra', daily_rate: 80, rating: 4.5 },
  ];

  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    const workerId = `00000000-0000-0000-3000-${String(i).padStart(10, '0')}`;
    await supabase.from('workers').upsert({
      id: workerId,
      company_id: companyId,
      name: w.name,
      role: w.role,
      daily_rate: w.daily_rate,
      rating: w.rating,
    });
  }

  console.log('📝 Creating RFIs...');
  const rfis = [
    { title: 'Aclaración de especificación de tubería', status: 'open', priority: 'high' },
    { title: 'Solicitud de detalle de unión de vigas', status: 'answered', priority: 'medium' },
    { title: 'Consulta sobre material de acabado', status: 'closed', priority: 'low' },
  ];

  for (let i = 0; i < rfis.length; i++) {
    const r = rfis[i];
    await supabase.from('rfis').upsert({
      id: `00000000-0000-0000-5000-${String(i).padStart(10, '0')}`,
      project_id: projectId,
      title: r.title,
      status: r.status,
      priority: r.priority,
      question: `Se requiere aclaración sobre: ${r.title}`,
    });
  }

  console.log('📤 Creating submittals...');
  const submittals = [
    { title: 'Muestras de piso porcelánico', status: 'pending', spec_section: '09 30 00' },
    { title: 'Catálogo de griferías', status: 'approved', spec_section: '22 40 00' },
    { title: 'Certificación de acero estructural', status: 'in_review', spec_section: '05 12 00' },
  ];

  for (let i = 0; i < submittals.length; i++) {
    const s = submittals[i];
    await supabase.from('submittals').upsert({
      id: `00000000-0000-0000-6000-${String(i).padStart(10, '0')}`,
      project_id: projectId,
      title: s.title,
      status: s.status,
      spec_section: s.spec_section,
    });
  }

  console.log('✅ Creating punch list items...');
  const punchItems = [
    { title: 'Reparar grieta en pared cocina', status: 'open', location: 'Apartamento 501' },
    { title: 'Ajustar puerta baño', status: 'completed', location: 'Apartamento 302' },
    { title: 'Pintura retoca pasillo piso 5', status: 'in_progress', location: 'Pasillo piso 5' },
  ];

  for (let i = 0; i < punchItems.length; i++) {
    const p = punchItems[i];
    await supabase.from('punch_items').upsert({
      id: `00000000-0000-0000-7000-${String(i).padStart(10, '0')}`,
      project_id: projectId,
      title: p.title,
      status: p.status,
      location: p.location,
    });
  }

  console.log('📅 Creating schedule tasks...');
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
    await supabase.from('schedule_tasks').upsert({
      id: `00000000-0000-0000-8000-${String(i).padStart(10, '0')}`,
      project_id: projectId,
      name: t.name,
      start_date: t.start,
      end_date: t.end,
      progress: t.progress,
      status: t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'pending',
      priority: t.progress > 50 ? 'high' : 'medium',
      duration: 30,
      position: i,
    });
  }

  console.log('💵 Creating expenses...');
  const expenses = [
    { description: 'Compra de materiales estructurales', amount: 250000, category: 'materials' },
    { description: 'Alquiler de grúa torre', amount: 45000, category: 'equipment' },
    { description: 'Transporte de materiales', amount: 18000, category: 'logistics' },
    { description: 'Permiso de construcción', amount: 12000, category: 'permits' },
    { description: 'Servicios profesionales ingeniería', amount: 35000, category: 'services' },
  ];

  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];
    await supabase.from('expenses').upsert({
      id: `00000000-0000-0000-9000-${String(i).padStart(10, '0')}`,
      project_id: projectId,
      description: e.description,
      amount: e.amount,
      category: e.category,
    });
  }

  console.log('🏢 Creating subcontractors...');
  const subs = [
    { name: 'ElectroTech C.A.', trade: 'Electricidad', contract_value: 480000 },
    { name: 'AquaInstall C.A.', trade: 'Plomería', contract_value: 350000 },
    { name: 'SteelWorks C.A.', trade: 'Estructura Metálica', contract_value: 650000 },
    { name: 'FineFinishes C.A.', trade: 'Acabados', contract_value: 800000 },
  ];

  for (let i = 0; i < subs.length; i++) {
    const s = subs[i];
    await supabase.from('subcontractors').upsert({
      id: `00000000-0000-0000-a000-${String(i).padStart(10, '0')}`,
      company_id: companyId,
      name: s.name,
      trade: s.trade,
      contract_value: s.contract_value,
      status: 'active',
    });
  }

  // Create auth user
  console.log('👤 Creating auth user...');
  try {
    const { error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@bmbuildmanage.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: { name: 'Usuario Demo' }
    });
    
    if (authError && !authError.message.includes('already')) {
      console.log('Auth error:', authError.message);
    } else {
      console.log('✅ Auth user created or already exists');
    }
  } catch (e) {
    console.log('Auth creation skipped');
  }

  console.log('✅ Seed completed!');
  console.log('');
  console.log('📝 Credenciales de acceso:');
  console.log('Email: demo@bmbuildmanage.com');
  console.log('Password: demo123456');
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
      { name: 'Escaleras estructurales', quantity: 4, unit: 'und', unit_cost: 15000, unit_price: 20000 },
    ],
    [
      { name: 'Bloques estructurales', quantity: 8500, unit: 'und', unit_cost: 3.5, unit_price: 4.8 },
      { name: 'Mortero pega', quantity: 45, unit: 'm3', unit_cost: 185, unit_price: 250 },
      { name: 'Friso paredes', quantity: 4200, unit: 'm2', unit_cost: 28, unit_price: 38 },
    ],
    [
      { name: 'Cableado eléctrico', quantity: 8500, unit: 'm', unit_cost: 4.2, unit_price: 5.8 },
      { name: 'Tableros eléctricos', quantity: 25, unit: 'und', unit_cost: 2500, unit_price: 3400 },
      { name: 'Lámparas LED', quantity: 380, unit: 'und', unit_cost: 45, unit_price: 62 },
      { name: 'Tomacorrientes', quantity: 520, unit: 'und', unit_cost: 15, unit_price: 22 },
    ],
    [
      { name: 'Tubería agua potable', quantity: 2200, unit: 'm', unit_cost: 12, unit_price: 16 },
      { name: 'Tubería aguas negras', quantity: 1850, unit: 'm', unit_cost: 14, unit_price: 19 },
      { name: 'Sanitarios', quantity: 120, unit: 'und', unit_cost: 350, unit_price: 480 },
      { name: 'Lavamanos y llaves', quantity: 125, unit: 'und', unit_cost: 180, unit_price: 250 },
    ],
    [
      { name: 'Piso porcelánico', quantity: 4500, unit: 'm2', unit_cost: 45, unit_price: 62 },
      { name: 'Pintura', quantity: 8200, unit: 'm2', unit_cost: 8, unit_price: 12 },
      { name: 'Cerámica baños', quantity: 1450, unit: 'm2', unit_cost: 38, unit_price: 52 },
      { name: 'Ventanas aluminio', quantity: 185, unit: 'und', unit_cost: 850, unit_price: 1150 },
    ],
    [
      { name: 'Equipos de cocina', quantity: 120, unit: 'und', unit_cost: 1800, unit_price: 2500 },
      { name: 'Aire acondicionado', quantity: 125, unit: 'und', unit_cost: 2200, unit_price: 3000 },
      { name: 'Elevadores', quantity: 4, unit: 'und', unit_cost: 85000, unit_price: 115000 },
    ],
  ];
  return itemsByStage[stageIndex] || [];
}

seed();