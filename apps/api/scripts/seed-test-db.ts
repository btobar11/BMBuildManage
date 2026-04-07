import { DataSource } from 'typeorm';

const TEST_COMPANY_ID = '77777777-7777-7777-7777-777777777777';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

async function seedTestDatabase() {
  console.log('🌱 Seeding test database...\n');
  
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

    // Create Company directly with SQL
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        country VARCHAR(100),
        tax_id VARCHAR(50),
        address TEXT,
        logo_url VARCHAR,
        email VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await dataSource.query(`
      INSERT INTO companies (id, name, tax_id, country, address, email, phone, created_at, updated_at)
      VALUES (
        '${TEST_COMPANY_ID}',
        'Test Construction Company',
        '12.345.678-9',
        'Chile',
        'Av. Principal 123, Santiago',
        'contacto@testcompany.cl',
        '+56 9 1234 5678',
        NOW(),
        NOW()
      )
    `);
    console.log(`✅ Company created: ${TEST_COMPANY_ID}`);

    // Create User table and data
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        role VARCHAR(50) DEFAULT 'engineer',
        company_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await dataSource.query(`
      INSERT INTO users (id, email, name, role, company_id, created_at, updated_at)
      VALUES (
        '${TEST_USER_ID}',
        'demo@bmbuild.com',
        'Demo User',
        'admin',
        '${TEST_COMPANY_ID}',
        NOW(),
        NOW()
      )
    `);
    console.log(`✅ User created: ${TEST_USER_ID}`);

    // Verify data
    const companyResult = await dataSource.query(`SELECT id, name FROM companies WHERE id = '${TEST_COMPANY_ID}'`);
    const userResult = await dataSource.query(`SELECT id, email, role, company_id FROM users WHERE id = '${TEST_USER_ID}'`);
    
    console.log('\n📋 Verification:');
    console.log(`   Company: ${companyResult.length > 0 ? '✅' : '❌'} ${companyResult[0]?.name}`);
    console.log(`   User: ${userResult.length > 0 ? '✅' : '❌'} ${userResult[0]?.email}`);
    console.log(`   User → Company: ${userResult[0]?.company_id === TEST_COMPANY_ID ? '✅' : '❌'}`);

    console.log('\n🎉 Test database seeded successfully!');
    console.log('\n📝 Test credentials:');
    console.log(`   Company ID: ${TEST_COMPANY_ID}`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   Email: demo@bmbuild.com`);
    console.log(`   Role: admin`);

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
