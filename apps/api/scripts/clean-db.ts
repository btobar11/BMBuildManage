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
    
    console.log('=== LIMPIEZA TOTAL Y FORZADA ===\n');
    
    // Primero desactivar FK
    await AppDataSource.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Eliminar TODAS las tablas en orden
    // 1. Tablas de datos operativos
    await AppDataSource.query('DELETE FROM resources'); console.log('🗑️ resources');
    await AppDataSource.query('DELETE FROM workers'); console.log('🗑️ workers');
    await AppDataSource.query('DELETE FROM apu_resources'); console.log('🗑️ apu_resources');
    await AppDataSource.query('DELETE FROM clients'); console.log('🗑️ clients');
    await AppDataSource.query('DELETE FROM apu_templates'); console.log('🗑️ apu_templates');
    await AppDataSource.query('DELETE FROM subcontractors'); console.log('🗑️ subcontractors');
    await AppDataSource.query('DELETE FROM materials'); console.log('🗑️ materials');
    await AppDataSource.query('DELETE FROM machinery'); console.log('🗑️ machinery');
    await AppDataSource.query('DELETE FROM documents'); console.log('🗑️ documents');
    await AppDataSource.query('DELETE FROM templates'); console.log('🗑️ templates');
    await AppDataSource.query('DELETE FROM template_items'); console.log('🗑️ template_items');
    await AppDataSource.query('DELETE FROM template_stages'); console.log('🗑️ template_stages');
    await AppDataSource.query('DELETE FROM units'); console.log('🗑️ units');
    await AppDataSource.query('DELETE FROM rfis'); console.log('🗑️ rfis');
    await AppDataSource.query('DELETE FROM submittals'); console.log('🗑️ submittals');
    await AppDataSource.query('DELETE FROM punch_items'); console.log('🗑️ punch_items');
    await AppDataSource.query('DELETE FROM schedule'); console.log('🗑️ schedule');
    await AppDataSource.query('DELETE FROM audit_logs'); console.log('🗑️ audit_logs');
    await AppDataSource.query('DELETE FROM project_contingencies'); console.log('🗑️ project_contingencies');
    await AppDataSource.query('DELETE FROM project_payments'); console.log('🗑️ project_payments');
    await AppDataSource.query('DELETE FROM expenses'); console.log('🗑️ expenses');
    await AppDataSource.query('DELETE FROM worker_payments'); console.log('🗑️ worker_payments');
    await AppDataSource.query('DELETE FROM worker_assignments'); console.log('🗑️ worker_assignments');
    
    // 2. Tablas de presupuesto
    await AppDataSource.query('DELETE FROM items'); console.log('🗑️ items');
    await AppDataSource.query('DELETE FROM stages'); console.log('🗑️ stages');
    await AppDataSource.query('DELETE FROM budgets'); console.log('🗑️ budgets');
    
    // 3. Tablas de proyectos
    await AppDataSource.query('DELETE FROM projects'); console.log('🗑️ projects');
    
    // 4. Tablas de empresas
    await AppDataSource.query('DELETE FROM companies'); console.log('🗑️ companies');
    await AppDataSource.query('DELETE FROM users'); console.log('🗑️ users');
    
    console.log('\n=== VERIFICANDO ===');
    const total = await AppDataSource.query('SELECT COUNT(*)::int as c FROM users');
    console.log(`👤 Usuarios: ${total[0].c}`);
    
    const companies = await AppDataSource.query('SELECT COUNT(*)::int as c FROM companies');
    console.log(`🏢 Compañías: ${companies[0].c}`);
    
    const projects = await AppDataSource.query('SELECT COUNT(*)::int as c FROM projects');
    console.log(`📁 Proyectos: ${projects[0].c}`);
    
    console.log('\n✅ BASE DE DATOS 100% LIMPIA - LISTO PARA NUEVA CUENTA');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

run();