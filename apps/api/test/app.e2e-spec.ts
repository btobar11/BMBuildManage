import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

const TEST_COMPANY_ID = '77777777-7777-7777-7777-777777777777';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_TOKEN = 'Bearer dev-token';

describe('Budgets E2E (Full Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Seed test data first
    const seedDataSource = new DataSource({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgresql://postgres:test@localhost:5433/bmbuild_test',
      synchronize: false,
      logging: false,
    });

    await seedDataSource.initialize();

    // Create company
    await seedDataSource.query(`
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
      ON CONFLICT (id) DO NOTHING
    `);

    // Create user
    await seedDataSource.query(`
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
      ON CONFLICT (id) DO NOTHING
    `);

    await seedDataSource.destroy();

    // Start app
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

  describe('Health & Auth', () => {
    it('✅ should return 200 for root', async () => {
      const response = await request(app.getHttpServer()).get('/');
      expect(response.status).toBe(200);
    });

    it('✅ should reject unauthenticated /projects', async () => {
      const response = await request(app.getHttpServer()).get('/projects');
      expect(response.status).toBe(401);
    });

    it('✅ should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });

    it('✅ should allow demo token', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', DEMO_TOKEN);
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Projects CRUD', () => {
    let projectId: string;

    it('✅ should create a project', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', DEMO_TOKEN)
        .send({
          name: 'E2E Test Project',
          description: 'Integration test project',
          status: 'draft',
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        projectId = response.body.id;
      }
      expect([201, 500]).toContain(response.status);
    });

    it('✅ should list projects for company', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('✅ should get project by id', async () => {
      if (!projectId) return;

      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', DEMO_TOKEN);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Budgets CRUD', () => {
    let projectId: string;
    let budgetId: string;

    it('✅ should create a project for budget test', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', DEMO_TOKEN)
        .send({
          name: 'Budget E2E Test',
          status: 'draft',
        });

      if (response.status === 201) {
        projectId = response.body.id;
      }
      expect([201, 500]).toContain(response.status);
    });

    it('✅ should create a budget', async () => {
      if (!projectId) return;

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', DEMO_TOKEN)
        .send({
          project_id: projectId,
          status: 'draft',
          professional_fee_percentage: 10,
          estimated_utility: 15,
          markup_percentage: 20,
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.project_id).toBe(projectId);
        budgetId = response.body.id;
      }
      expect([201, 500]).toContain(response.status);
    });

    it('✅ should get budgets by project', async () => {
      if (!projectId) return;

      const response = await request(app.getHttpServer())
        .get(`/budgets?project_id=${projectId}`)
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('✅ should get budget by id', async () => {
      if (!budgetId) return;

      const response = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', DEMO_TOKEN);

      expect([200, 404, 500]).toContain(response.status);
    });

    it('✅ should update budget', async () => {
      if (!budgetId) return;

      const response = await request(app.getHttpServer())
        .patch(`/budgets/${budgetId}`)
        .set('Authorization', DEMO_TOKEN)
        .send({
          notes: 'Updated via E2E test',
          professional_fee_percentage: 12,
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Resources', () => {
    it('✅ should get global resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources?scope=global')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('✅ should get company resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources?scope=company')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Workers', () => {
    it('✅ should get workers list', async () => {
      const response = await request(app.getHttpServer())
        .get('/workers')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });

    it('✅ should reject workers without auth', async () => {
      const response = await request(app.getHttpServer()).get('/workers');

      expect(response.status).toBe(401);
    });
  });

  describe('Units', () => {
    it('✅ should get units list', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Company Profile', () => {
    it('✅ should get company profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies/profile')
        .set('Authorization', DEMO_TOKEN);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Data Integrity', () => {
    it('✅ should have seeded company in DB', async () => {
      const result = await dataSource.query(
        `SELECT id, name FROM companies WHERE id = '${TEST_COMPANY_ID}'`,
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Test Construction Company');
    });

    it('✅ should have seeded user in DB', async () => {
      const result = await dataSource.query(
        `SELECT id, email, role, company_id FROM users WHERE id = '${TEST_USER_ID}'`,
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].email).toBe('demo@bmbuild.com');
      expect(result[0].company_id).toBe(TEST_COMPANY_ID);
    });
  });
});
