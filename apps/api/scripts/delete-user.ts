import 'dotenv/config';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
});

async function run() {
  try {
    await AppDataSource.initialize();
    
    console.log('🔍 Buscando usuario...');
    const user = await AppDataSource.query(
      "SELECT id, email, name FROM users WHERE email = 'jutobar06@gmail.com'"
    );
    
    console.log('📋 Resultado:', JSON.stringify(user, null, 2));
    
    if (user && user.length > 0) {
      console.log('🗑️ Eliminando usuario...');
      await AppDataSource.query(
        "DELETE FROM users WHERE email = 'jutobar06@gmail.com'"
      );
      console.log('✅ Usuario eliminado exitosamente');
    } else {
      console.log('⚠️ Usuario no encontrado');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

run();