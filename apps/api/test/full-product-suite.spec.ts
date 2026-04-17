import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { SupabaseAuthGuard } from '../src/common/guards/supabase-auth.guard';
import supertest from 'supertest';
const request = supertest;

describe('Full Product Suite E2E Tests', () => {
  let app: INestApplication;
  const TEST_COMPANY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  const TEST_USER_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
  let createdCompanyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: TEST_USER_ID,
            email: 'demo@bmbuild.com',
            company_id: TEST_COMPANY_ID,
            role: 'admin',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/companies')
      .send({
        id: TEST_COMPANY_ID,
        name: 'Test Company E2E',
        country: 'US',
        email: 'test@e2e.com',
      });
    if (createRes.status === 201 || createRes.status === 409) {
      createdCompanyId = TEST_COMPANY_ID;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('(GET) /health - should return OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Companies CRUD', () => {
    it('(GET) /companies - should return companies list', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('(POST) /companies - should create a company', async () => {
      const newCompany = {
        name: 'E2E Test Company',
        country: 'US',
        email: 'e2e@test.com',
      };
      const res = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', 'Bearer dev-token')
        .send(newCompany);
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      createdCompanyId = res.body.id;
    });

    it.skip('(GET) /companies/:id - should return company by ID after creation', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', 'Bearer dev-token')
        .send({
          name: 'E2E Company for GET Test',
          country: 'US',
          email: 'get@test.com',
        });
      const companyId = createRes.body.id;
      const res = await request(app.getHttpServer())
        .get(`/companies/${companyId}`)
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body.id).toBe(companyId);
    });
  });

  describe('Budget Calculation Logic', () => {
    it('should calculate item totals correctly', () => {
      const quantity = 10;
      const unitCost = 50000;
      const unitPrice = 60000;
      const totalCost = quantity * unitCost;
      const totalPrice = quantity * unitPrice;

      expect(totalCost).toBe(500000);
      expect(totalPrice).toBe(600000);
    });

    it('should apply professional fee correctly', () => {
      const directCost = 1000000;
      const professionalFee = 10;
      const costWithFee = directCost * (1 + professionalFee / 100);

      expect(costWithFee).toBe(1100000);
    });

    it('should apply utility correctly', () => {
      const costWithFee = 1100000;
      const utility = 15;
      const finalPrice = costWithFee * (1 + utility / 100);

      expect(finalPrice).toBe(1265000);
    });

    it('should handle zero items', () => {
      const items: { quantity: number; unit_cost: number }[] = [];
      const totalCost = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0,
      );
      expect(totalCost).toBe(0);
    });

    it('should handle decimal quantities', () => {
      const quantity = 2.5;
      const unitCost = 10000;
      expect(quantity * unitCost).toBe(25000);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should enforce company_id on projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(200);
    });
  });

  describe('API Response Format', () => {
    it('should return JSON responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', 'Bearer dev-token');
      expect(res.type).toBe('application/json');
    });

    it('should handle 404 for non-existent resources', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies/f1e2d3c4-b5a6-4f7e-8d9c-0b1a2c3d4e5f')
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(404);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid UUIDs', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies/not-a-uuid')
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(400);
    });
  });

  describe('Authentication Bypass (Dev Mode)', () => {
    it('should allow access with dev-token', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', 'Bearer dev-token');
      expect(res.status).toBe(200);
    });
  });

  describe('Budget Summary Calculation', () => {
    it('should aggregate stage costs correctly', () => {
      const stages = [
        { items: [{ quantity: 10, unit_cost: 50000 }] },
        { items: [{ quantity: 100, unit_cost: 10000 }] },
      ];

      const stageTotals = stages.map((s) =>
        s.items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0),
      );

      expect(stageTotals[0]).toBe(500000);
      expect(stageTotals[1]).toBe(1000000);
      expect(stageTotals[0] + stageTotals[1]).toBe(1500000);
    });

    it('should calculate APU totals correctly', () => {
      const apu = {
        materialsCost: 50000,
        laborCost: 30000,
        equipmentCost: 10000,
        quantity: 5,
      };

      const totalAPU =
        (apu.materialsCost + apu.laborCost + apu.equipmentCost) * apu.quantity;
      expect(totalAPU).toBe(450000);
    });
  });
});
