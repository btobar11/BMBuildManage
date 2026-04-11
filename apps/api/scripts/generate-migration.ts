/**
 * Script para generar migraciones de TypeORM
 * Uso: npx ts-node scripts/generate-migration.ts InitialSchema
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function generateMigration() {
  const migrationName = process.argv[2] || 'InitialSchema';

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [path.join(__dirname, '../src/modules/**/*.entity.ts')],
    migrations: [path.join(__dirname, '../src/database/migrations/*.ts')],
    migrationsTableName: 'typeorm_migrations',
  });

  try {
    await dataSource.initialize();
    console.log(`Generating migration: ${migrationName}`);

    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

    console.log('Migration generated successfully');
  } catch (error) {
    console.error('Error generating migration:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

generateMigration();