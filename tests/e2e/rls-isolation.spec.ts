import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';

describe('RLS Multi-Tenant Security (e2e)', () => {
  let app: INestApplication;

  const COMPANY_A_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5MDcsImV4cCI6MjA4ODk5NzkwN30.4AAIwrvdA1LK5w-mDDqvmr_EVzfJ502j6nJ2JT3xjeg';
  
  const COMPANY_B_ID = '88888888-8888-8888-8888-888888888888';
  const COMPANY_A_ID = '77777777-7777-7777-7777-777777777777';

  const BUDGET_ID_COMPANY_B = 'budget-from-company-b-id';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Multi-Tenant Isolation via RLS', () => {
    it('should BLOCK Company A from reading Company B budget', async () => {
      const response = await request(app.getHttpServer())
        .get(`/budgets/${BUDGET_ID_COMPANY_B}`)
        .set('Authorization', COMPANY_A_TOKEN);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not found');
    });

    it('should BLOCK Company A from PATCH Company B budget', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/budgets/${BUDGET_ID_COMPANY_B}`)
        .set('Authorization', COMPANY_A_TOKEN)
        .send({ notes: 'Trying to hack!' });

      expect(response.status).toBe(403);
    });

    it('should BLOCK Company A from accessing Company B projects', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${COMPANY_B_ID}`)
        .set('Authorization', COMPANY_A_TOKEN);

      expect(response.status).toBe(403);
    });

    it('should allow Company A to read their own budgets', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', COMPANY_A_TOKEN);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
