import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities: [path.join(process.cwd(), 'src/modules/**/*.entity.ts')],
  migrations: [path.join(process.cwd(), 'src/database/migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
});