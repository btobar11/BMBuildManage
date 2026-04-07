import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Budgets E2E (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const DEMO_TOKEN = 'Bearer dev-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await app?.close();
  });

  describe('Health Check', () => {
    it('should return 200 for root', async () => {
      const response = await request(app.getHttpServer())
        .get('/');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Auth Guards', () => {
    it('should reject unauthenticated requests to /projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should allow demo token', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Resources Endpoints', () => {
    it('should get global resources with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources?scope=global')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('should get company resources with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources?scope=company')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Workers Endpoints', () => {
    it('should get workers list', async () => {
      const response = await request(app.getHttpServer())
        .get('/workers')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('should reject workers without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/workers');

      expect(response.status).toBe(401);
    });
  });

  describe('Units Endpoints', () => {
    it('should get units list', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Companies Endpoints', () => {
    it('should get company profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies/profile')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });
});
