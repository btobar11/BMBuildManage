import { DataSource } from 'typeorm';

const TEST_COMPANY_ID = '77777777-7777-7777-7777-777777777777';
const TEST_COMPANY_2_ID = '88888888-8888-8888-8888-888888888888';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_USER_2_ID = '22222222-2222-2222-2222-222222222222';

async function seedTestDatabase() {
  console.log('🌱 Seeding test database with full schema...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5433/bmbuild_test',
    synchronize: true,
    dropSchema: true,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    await dataSource.query(`CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY, name VARCHAR(200) NOT NULL, country VARCHAR(100),
      tax_id VARCHAR(50), address TEXT, logo_url VARCHAR, email VARCHAR,
      phone VARCHAR, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await dataSource.query(`INSERT INTO companies (id, name, tax_id, country, address, email, phone, created_at, updated_at)
      VALUES ('${TEST_COMPANY_ID}', 'Test Construction Company', '12.345.678-9', 'Chile', 'Av. Principal 123, Santiago', 'contacto@testcompany.cl', '+56 9 1234 5678', NOW(), NOW())`);

    await dataSource.query(`INSERT INTO companies (id, name, tax_id, country, address, email, phone, created_at, updated_at)
      VALUES ('${TEST_COMPANY_2_ID}', 'Competitor Company', '98.765.432-1', 'Chile', 'Av. Secundaria 456, Santiago', 'contacto@competitor.cl', '+56 9 8765 4321', NOW(), NOW())`);

    console.log(`✅ Companies created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY, email VARCHAR UNIQUE NOT NULL, name VARCHAR(200) NOT NULL,
      role VARCHAR(50) DEFAULT 'engineer', company_id UUID, created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await dataSource.query(`INSERT INTO users (id, email, name, role, company_id, created_at, updated_at)
      VALUES ('${TEST_USER_ID}', 'demo@bmbuild.com', 'Demo User', 'admin', '${TEST_COMPANY_ID}', NOW(), NOW())`);

    await dataSource.query(`INSERT INTO users (id, email, name, role, company_id, created_at, updated_at)
      VALUES ('${TEST_USER_2_ID}', 'other@bmbuild.com', 'Other User', 'engineer', '${TEST_COMPANY_ID}', NOW(), NOW())`);

    console.log(`✅ Users created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      rut VARCHAR(20), email VARCHAR, phone VARCHAR, address TEXT,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Clients table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, client_id UUID, name VARCHAR(200) NOT NULL,
      code VARCHAR(50), description TEXT, status VARCHAR(50) DEFAULT 'planning',
      folder VARCHAR(200), start_date DATE, end_date DATE, total_budget DECIMAL(15,2),
      total_spent DECIMAL(15,2) DEFAULT 0, latitude DECIMAL(10,8), longitude DECIMAL(11,8),
      seismic_zone VARCHAR(10), soil_type VARCHAR(50), created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Projects table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS budgets (
      id UUID PRIMARY KEY, project_id UUID NOT NULL, version INTEGER DEFAULT 1,
      name VARCHAR(200), description TEXT, status VARCHAR(50) DEFAULT 'draft',
      direct_cost DECIMAL(15,2) DEFAULT 0, indirect_cost DECIMAL(15,2) DEFAULT 0,
      professional_fee DECIMAL(5,2) DEFAULT 0, utility DECIMAL(5,2) DEFAULT 0,
      contingency DECIMAL(15,2) DEFAULT 0, total_cost DECIMAL(15,2) DEFAULT 0,
      total_price DECIMAL(15,2) DEFAULT 0, is_active BOOLEAN DEFAULT false,
      created_by UUID, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Budgets table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS stages (
      id UUID PRIMARY KEY, budget_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      code VARCHAR(50), description TEXT, position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Stages table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY, stage_id UUID NOT NULL, budget_id UUID NOT NULL,
      name VARCHAR(500) NOT NULL, code VARCHAR(50), description TEXT,
      quantity DECIMAL(15,4) DEFAULT 0, unit VARCHAR(20), unit_cost DECIMAL(15,2) DEFAULT 0,
      unit_price DECIMAL(15,2) DEFAULT 0, total_cost DECIMAL(15,2) DEFAULT 0,
      total_price DECIMAL(15,2) DEFAULT 0, position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Items table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY, project_id UUID, stage_id UUID, company_id UUID NOT NULL,
      description VARCHAR(500) NOT NULL, amount DECIMAL(15,2) NOT NULL,
      category VARCHAR(100), date DATE, created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Expenses table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS workers (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      rut VARCHAR(20), trade VARCHAR(100), daily_rate DECIMAL(10,2) DEFAULT 0,
      phone VARCHAR(20), email VARCHAR, active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Workers table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS worker_assignments (
      id UUID PRIMARY KEY, worker_id UUID NOT NULL, project_id UUID NOT NULL,
      stage_id UUID, start_date DATE, end_date DATE, hours_per_day DECIMAL(4,1) DEFAULT 8,
      daily_rate DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Worker Assignments table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS worker_payments (
      id UUID PRIMARY KEY, worker_id UUID NOT NULL, project_id UUID,
      amount DECIMAL(10,2) NOT NULL, payment_date DATE, period_start DATE,
      period_end DATE, status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Worker Payments table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, project_id UUID, client_id UUID,
      invoice_number VARCHAR(50), type VARCHAR(50), amount DECIMAL(15,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'draft', issue_date DATE, due_date DATE,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Invoices table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      type VARCHAR(50), unit VARCHAR(20), unit_cost DECIMAL(10,2) DEFAULT 0,
      supplier VARCHAR(200), created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Resources table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      type VARCHAR(50), description TEXT, created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Templates table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY, project_id UUID, company_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL, type VARCHAR(50), url VARCHAR(500),
      size INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Documents table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS units (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(100) NOT NULL,
      abbreviation VARCHAR(20) NOT NULL, type VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ Units table created`);

    await dataSource.query(`CREATE TABLE IF NOT EXISTS apu_templates (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      unit VARCHAR(20), unit_cost DECIMAL(15,2) DEFAULT 0,
      unit_price DECIMAL(15,2) DEFAULT 0, materials_cost DECIMAL(15,2) DEFAULT 0,
      labor_cost DECIMAL(15,2) DEFAULT 0, equipment_cost DECIMAL(15,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log(`✅ APU Templates table created`);

    // Seed materials
    await dataSource.query(`CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY, company_id UUID NOT NULL, name VARCHAR(200) NOT NULL,
      unit VARCHAR(20), unit_cost DECIMAL(15,2) DEFAULT 0,
      supplier VARCHAR(200), category VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);

    const materials = [
      'Cemento Portland Tipo I|kg|580|Cementos Bío Bío|Hormigón',
      'Arena Gruesa|m³|15000|Áridos Central|Hormigón',
      'Ripio 5-20mm|m³|18000|Áridos Central|Hormigón',
      'Fierro AT56-50H 8mm|kg|920|CAP Acero|Fierrería',
      'Fierro AT56-50H 10mm|kg|890|CAP Acero|Fierrería',
      'Fierro AT56-50H 12mm|kg|880|CAP Acero|Fierrería',
      'Ladrillo Princesa 14x29x7|un|320|Ladrillera Princesa|Albañilería',
      'Bloque H20 14x20x39|un|1250|Melón Hormigones|Albañilería',
      'Mortero Prepardo M5|kg|180|Sika|Albañilería',
      'Pintura Látex Blanco|lt|4500|Sherwin Williams|Terminaciones',
      'Pasta Muro Interior|kg|890|Andesita|Terminaciones',
      'Cerámica 30x30 1ª|m²|8900|Cordillera|Terminaciones',
      'Perfil Metalcon 60x25|ml|1250|Cintac|Estructura',
      'Placa Yeso Cartón 10mm|m²|3200|Volcán|Tabiquería',
      'Aislante Lana Mineral 50mm|m²|2800|Aislapol|Aislación'
    ];

    for (const mat of materials) {
      const [name, unit, cost, supplier, category] = mat.split('|');
      await dataSource.query(`INSERT INTO materials (id, company_id, name, unit, unit_cost, supplier, category, created_at, updated_at)
        VALUES (gen_random_uuid(), '${TEST_COMPANY_ID}', '${name}', '${unit}', ${cost}, '${supplier}', '${category}', NOW(), NOW())`);
    }
    console.log(`✅ ${materials.length} Materials seeded`);

    // Seed workers
    const workers = [
      'Juan Pérez|Maestro Mayor|45000|9.8765432-1|+56987654321',
      'María González|Soldador|38000|12.345678-9|+56912345678',
      'Carlos Silva|Carpintero|42000|15.678901-2|+56915678901',
      'Ana Rodríguez|Electricista|40000|18.901234-5|+56918901234',
      'Pedro Martín|Gasfiter|35000|21.234567-8|+56921234567',
      'Luis Fernández|Albañil|32000|24.567890-1|+56924567890',
      'Carmen López|Pintora|28000|27.890123-4|+56927890123',
      'Roberto Torres|Ayudante|25000|30.123456-7|+56930123456'
    ];

    for (const worker of workers) {
      const [name, specialty, hourlyRate, rut, phone] = worker.split('|');
      await dataSource.query(`INSERT INTO workers (id, company_id, name, specialty, hourly_rate, rut, phone, status, created_at, updated_at)
        VALUES (gen_random_uuid(), '${TEST_COMPANY_ID}', '${name}', '${specialty}', ${hourlyRate}, '${rut}', '${phone}', 'active', NOW(), NOW())`);
    }
    console.log(`✅ ${workers.length} Workers seeded`);

    // Seed APU Templates
    const apuTemplates = [
      'Hormigón H20 en Losas|m³|85000|Hormigón estructural losas',
      'Hormigón H25 en Muros|m³|95000|Hormigón estructural muros',
      'Enfierradura Ø8mm|kg|1200|Armadura fierro corrugado',
      'Enfierradura Ø10mm|kg|1150|Armadura fierro corrugado',
      'Enfierradura Ø12mm|kg|1100|Armadura fierro corrugado',
      'Albañilería Ladrillo 14cm|m²|25000|Muro ladrillo princesa',
      'Albañilería Bloque 20cm|m²|18000|Muro bloque hormigón',
      'Estuco Interior|m²|4500|Pasta + pintura interior',
      'Estuco Exterior|m²|6500|Pasta + pintura exterior',
      'Cerámica Baños|m²|12000|Cerámica + fragüe + instalación',
      'Tabique Metalcon 60mm|m²|15000|Estructura + placa yeso',
      'Cubierta Teja Asfáltica|m²|8500|Teja + fieltro + instalación'
    ];

    for (const apu of apuTemplates) {
      const [name, unit, price, description] = apu.split('|');
      await dataSource.query(`INSERT INTO apu_templates (id, company_id, name, unit, unit_price, materials_cost, labor_cost, equipment_cost, created_at, updated_at)
        VALUES (gen_random_uuid(), '${TEST_COMPANY_ID}', '${name}', '${unit}', ${price}, ${Math.floor(parseFloat(price) * 0.6)}, ${Math.floor(parseFloat(price) * 0.25)}, ${Math.floor(parseFloat(price) * 0.15)}, NOW(), NOW())`);
    }
    console.log(`✅ ${apuTemplates.length} APU Templates seeded`);

    console.log('\n🎉 Full test database with demo data created successfully!');
    console.log('\n📋 Test credentials:');
    console.log(`   Company ID: ${TEST_COMPANY_ID}`);
    console.log(`   Company 2 ID: ${TEST_COMPANY_2_ID}`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   User 2 ID: ${TEST_USER_2_ID}`);

  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seedTestDatabase().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
