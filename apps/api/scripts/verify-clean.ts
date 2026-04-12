import 'dotenv/config';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
});

async function verify() {
  await AppDataSource.initialize();
  
  const users = await AppDataSource.query('SELECT COUNT(*) as c FROM users');
  const companies = await AppDataSource.query('SELECT COUNT(*) as c FROM companies');
  const projects = await AppDataSource.query('SELECT COUNT(*) as c FROM projects');
  
  console.log('=== VERIFICACIÓN FINAL ===');
  console.log('👤 Usuarios:', users[0].c);
  console.log('🏢 Compañías:', companies[0].c);
  console.log('📁 Proyectos:', projects[0].c);
  
  if (users[0].c == 0 && companies[0].c == 0 && projects[0].c == 0) {
    console.log('\n✅ BASE DE DATOS 100% LIMPIA');
  }
  
  await AppDataSource.destroy();
}

verify();