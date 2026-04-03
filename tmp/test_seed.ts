import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { SeedService } from '../apps/api/src/modules/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  try {
    console.log('Starting seed...');
    await seedService.seedDemoData();
    console.log('Seed successful');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
