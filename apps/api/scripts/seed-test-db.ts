import { DataSource } from 'typeorm';

const testDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5433/bmbuild_test',
  synchronize: true,
  dropSchema: true,
  entities: ['src/**/*.entity.ts'],
});

async function seedTestDatabase() {
  console.log('🌱 Seeding test database...');
  
  await testDataSource.initialize();
  console.log('✅ Database connected');

  const companyRepo = testDataSource.getRepository('Company');
  const userRepo = testDataSource.getRepository('User');

  // Create test company
  const company = await companyRepo.save({
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Test Construction Company',
    rut: '12.345.678-9',
    address: 'Test Address 123',
    phone: '+56 9 1234 5678',
    email: 'test@company.cl',
  });
  console.log('✅ Company created:', company.id);

  // Create test user
  const user = await userRepo.save({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'demo@bmbuild.com',
    full_name: 'Demo User',
    company_id: company.id,
    role: 'admin',
  });
  console.log('✅ User created:', user.id);

  await testDataSource.destroy();
  console.log('🎉 Test database seeded successfully!');
}

seedTestDatabase().catch((error) => {
  console.error('❌ Error seeding test database:', error);
  process.exit(1);
});
