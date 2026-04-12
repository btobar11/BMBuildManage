import 'dotenv/config';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
});

async function forceDelete() {
  await AppDataSource.initialize();
  
  console.log('=== ELIMINANDO COMPAÑÍAS FORZADAMENTE ===\n');
  
  // Ver compañías actuales
  const companies = await AppDataSource.query('SELECT id, name FROM companies');
  console.log('Compañías encontradas:', companies.length);
  
  // Forzar eliminación usando TRUNCATE con CASCADE
  try {
    await AppDataSource.query('TRUNCATE TABLE companies CASCADE');
    console.log('✅ Companies eliminadas con CASCADE');
  } catch (e: any) {
    console.log('Error con TRUNCATE:', e.message);
    
    // Alternativa: delete manual
    console.log('Intentando DELETE manual...');
    await AppDataSource.query('DELETE FROM companies');
    console.log('✅ DELETE completado');
  }
  
  // Verificar
  const remaining = await AppDataSource.query('SELECT COUNT(*) as c FROM companies');
  console.log('\n👥 Compañías restantes:', remaining[0].c);
  
  if (remaining[0].c == 0) {
    console.log('\n✅ TODO ELIMINADO - BASE 100% LIMPIA');
  }
  
  await AppDataSource.destroy();
}

forceDelete();