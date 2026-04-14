/**
 * Federated BIM System E2E Tests
 *
 * Tests the complete workflow of:
 * 1. Company creation and library seeding
 * 2. Multi-discipline model upload
 * 3. Federated clash detection
 * 4. Clash management workflow
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Federated BIM System (e2e)', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let authToken: string;
  let companyId: string;
  let projectId: string;
  let federatedJobId: string;

  const testUser = {
    email: 'test@bmbuildomega.com',
    company_id: '77777777-7777-7777-7777-777777777777', // Demo company
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup Supabase client
    const configService = app.get(ConfigService);
    supabase = createClient(
      configService.get('supabase.url') || process.env.SUPABASE_URL || '',
      configService.get('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );

    // Use dev token for testing
    authToken = 'dev-token';
    companyId = testUser.company_id;

    // Cleanup any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('1. Company Library Seeding', () => {
    it('should get available specialties', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies/specialties/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.specialties).toHaveLength(5);
      expect(response.body.seismicZones).toHaveLength(5);
      expect(response.body.specialties[0]).toHaveProperty('value');
      expect(response.body.specialties[0]).toHaveProperty('label');
      expect(response.body.specialties[0]).toHaveProperty('description');
    });

    it('should seed company library successfully', async () => {
      const seedData = {
        specialty: 'residential',
        seismic_zone: 'C',
        region_code: 'CL-RM',
      };

      const response = await request(app.getHttpServer())
        .post(`/companies/${companyId}/seed-library`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(seedData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.resources_created).toBeGreaterThan(0);
      expect(response.body.apus_created).toBeGreaterThan(0);
      expect(response.body.specialty).toBe('residential');
      expect(response.body.seismic_zone).toBe('C');
    });

    it('should get library stats after seeding', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${companyId}/library-stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isSeeded).toBe(true);
      expect(response.body.specialty).toBe('residential');
      expect(response.body.seismicZone).toBe('C');
      expect(response.body.resourcesCount).toBeGreaterThan(50);
      expect(response.body.apusCount).toBeGreaterThan(10);
    });

    it('should prevent double seeding', async () => {
      const seedData = {
        specialty: 'civil_works',
        seismic_zone: 'B',
      };

      const response = await request(app.getHttpServer())
        .post(`/companies/${companyId}/seed-library`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(seedData)
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already seeded');
    });
  });

  describe('2. Project and Model Setup', () => {
    it('should create a test project', async () => {
      // First, get or create a test project
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', 'E2E Test Project Federated BIM')
        .limit(1);

      if (projects && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            company_id: companyId,
            name: 'E2E Test Project Federated BIM',
            description: 'Test project for federated BIM E2E testing',
            status: 'active',
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(newProject).toBeDefined();
        projectId = newProject!.id;
      }

      expect(projectId).toBeDefined();
    });

    it('should simulate model upload for multiple disciplines', async () => {
      // Create mock BIM models for different disciplines
      const disciplines = ['architecture', 'structure', 'mep_hvac'];

      for (const discipline of disciplines) {
        const { error } = await supabase.from('bim_models').insert({
          company_id: companyId,
          project_id: projectId,
          name: `Test Model ${discipline.charAt(0).toUpperCase() + discipline.slice(1)}`,
          discipline: discipline,
          file_type: 'ifc',
          storage_path: `${companyId}/models/test-${discipline}.ifc`,
          file_size: 1024000 + Math.floor(Math.random() * 500000),
          processing_status: 'completed',
        });

        expect(error).toBeNull();
      }

      // Verify models were created
      const { data: models, error } = await supabase
        .from('bim_models')
        .select('*')
        .eq('project_id', projectId);

      expect(error).toBeNull();
      expect(models).toHaveLength(3);
    });

    it('should create spatial index entries for models', async () => {
      // Create mock spatial index entries for each model
      const { data: models } = await supabase
        .from('bim_models')
        .select('*')
        .eq('project_id', projectId);

      for (const model of models || []) {
        // Create mock elements with bounding boxes
        for (let i = 0; i < 5; i++) {
          await supabase.from('bim_spatial_index').insert({
            element_id: `element-${model.id}-${i}`,
            model_id: model.id,
            company_id: companyId,
            discipline: model.discipline,
            element_type: 'IFCWALL',
            ifc_guid: `guid-${model.id}-${i}`,
            min_x: Math.random() * 100,
            min_y: Math.random() * 100,
            min_z: 0,
            max_x: Math.random() * 100 + 50,
            max_y: Math.random() * 100 + 50,
            max_z: 3,
          });
        }
      }

      // Verify spatial index entries
      const { data: spatialEntries } = await supabase
        .from('bim_spatial_index')
        .select('*')
        .eq('company_id', companyId);

      expect(spatialEntries).toHaveLength(15); // 3 models * 5 elements each
    });
  });

  describe('3. Federated Clash Detection', () => {
    it('should create a federated clash detection job', async () => {
      const jobData = {
        project_id: projectId,
        federation_id: projectId,
        tolerance_mm: 10,
        enabled_disciplines: ['architecture', 'structure', 'mep_hvac'],
        severity_threshold: 'medium',
      };

      const response = await request(app.getHttpServer())
        .post('/bim-clashes/federated/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('pending');
      expect(response.body.tolerance_mm).toBe(10);
      expect(response.body.enabled_disciplines).toEqual([
        'architecture',
        'structure',
        'mep_hvac',
      ]);

      federatedJobId = response.body.id;
    });

    it('should start federated clash detection', async () => {
      const response = await request(app.getHttpServer())
        .post(`/bim-clashes/federated/jobs/${federatedJobId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Federated clash detection started');
    });

    it('should get job progress', async () => {
      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/bim-clashes/federated/jobs/${federatedJobId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toMatch(/running|completed/);
      expect(response.body.progress).toBeGreaterThanOrEqual(0);
      expect(response.body.progress).toBeLessThanOrEqual(100);
    });

    it('should wait for job completion', async () => {
      // Poll until job is complete (with timeout)
      let attempts = 0;
      let jobComplete = false;

      while (!jobComplete && attempts < 30) {
        const response = await request(app.getHttpServer())
          .get(`/bim-clashes/federated/jobs/${federatedJobId}/progress`)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.body.status === 'completed') {
          jobComplete = true;
          expect(response.body.progress).toBe(100);
        }

        if (!jobComplete) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }
      }

      expect(jobComplete).toBe(true);
    });

    it('should retrieve detected clashes', async () => {
      const response = await request(app.getHttpServer())
        .get('/bim-clashes/federated/clashes')
        .query({ federatedJobId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const clash = response.body[0];
        expect(clash.federation_job_id).toBe(federatedJobId);
        expect(clash.discipline_a).toBeDefined();
        expect(clash.discipline_b).toBeDefined();
        expect(clash.severity).toMatch(/low|medium|high|critical/);
        expect(clash.clash_type).toMatch(/hard|soft|clearance/);
        expect(clash.status).toBe('open');
      }
    });

    it('should filter clashes by discipline', async () => {
      const response = await request(app.getHttpServer())
        .get('/bim-clashes/federated/clashes')
        .query({
          federatedJobId,
          disciplineA: 'architecture',
          disciplineB: 'structure',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach((clash: any) => {
        expect([clash.discipline_a, clash.discipline_b]).toContain(
          'architecture',
        );
        expect([clash.discipline_a, clash.discipline_b]).toContain('structure');
      });
    });
  });

  describe('4. Clash Management Workflow', () => {
    let testClashId: string;

    beforeAll(async () => {
      // Get a clash to work with
      const response = await request(app.getHttpServer())
        .get('/bim-clashes/federated/clashes')
        .query({ federatedJobId })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.body.length > 0) {
        testClashId = response.body[0].id;
      }
    });

    it('should update clash status', async () => {
      if (!testClashId) {
        console.log('Skipping clash management tests - no clashes detected');
        return;
      }

      const updateData = {
        status: 'assigned',
        assigned_to: 'engineer@bmbuildomega.com',
        resolution_notes: 'Assigned to structural engineer for review',
      };

      const response = await request(app.getHttpServer())
        .patch(`/bim-clashes/federated/clashes/${testClashId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('assigned');
      expect(response.body.assigned_to).toBe('engineer@bmbuildomega.com');
      expect(response.body.resolution_notes).toBe(
        'Assigned to structural engineer for review',
      );
    });

    it('should add comment to clash', async () => {
      if (!testClashId) return;

      const commentData = {
        content:
          'This clash needs immediate attention due to structural implications.',
        author_email: 'coordinator@bmbuildomega.com',
        author_name: 'BIM Coordinator',
      };

      const response = await request(app.getHttpServer())
        .post(`/bim-clashes/federated/clashes/${testClashId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.content).toBe(commentData.content);
      expect(response.body.author_email).toBe(commentData.author_email);
    });

    it('should get clash comments', async () => {
      if (!testClashId) return;

      const response = await request(app.getHttpServer())
        .get(`/bim-clashes/federated/clashes/${testClashId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const comment = response.body[0];
      expect(comment.content).toBeDefined();
      expect(comment.author_email).toBeDefined();
      expect(comment.created_at).toBeDefined();
    });

    it('should resolve clash', async () => {
      if (!testClashId) return;

      const updateData = {
        status: 'resolved',
        resolution_notes:
          'Structural element moved to avoid collision. Issue resolved.',
      };

      const response = await request(app.getHttpServer())
        .patch(`/bim-clashes/federated/clashes/${testClashId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('resolved');
      expect(response.body.resolved_at).toBeDefined();
    });

    it('should get clash statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/bim-clashes/stats/summary')
        .query({ projectId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalJobs).toBeGreaterThanOrEqual(1);
      expect(response.body.totalClashes).toBeGreaterThanOrEqual(0);
      expect(response.body.byStatus).toBeDefined();
      expect(response.body.bySeverity).toBeDefined();
      expect(response.body.byType).toBeDefined();
    });
  });

  describe('5. Data Integrity and Security', () => {
    it('should enforce RLS - cannot access other company data', async () => {
      const otherCompanyId = '88888888-8888-8888-8888-888888888888';

      // Try to access another company's clash jobs
      const response = await request(app.getHttpServer())
        .get('/bim-clashes/federated/jobs')
        .set('Authorization', `Bearer dev-token`)
        .expect(200);

      // Should only return jobs for test company
      response.body.forEach((job: any) => {
        expect(job.company_id).toBe(companyId);
      });
    });

    it('should validate input parameters', async () => {
      const invalidJobData = {
        project_id: projectId,
        federation_id: projectId,
        tolerance_mm: 150, // Invalid - over 100mm limit
        enabled_disciplines: ['invalid_discipline'],
        severity_threshold: 'invalid_threshold',
      };

      await request(app.getHttpServer())
        .post('/bim-clashes/federated/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidJobData)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/bim-clashes/federated/jobs')
        .expect(401);
    });
  });

  describe('6. Performance and Scalability', () => {
    it('should handle multiple concurrent clash detection jobs', async () => {
      const jobs = [];

      // Create multiple jobs
      for (let i = 0; i < 3; i++) {
        const jobData = {
          project_id: projectId,
          federation_id: projectId,
          tolerance_mm: 5 + i * 5,
          enabled_disciplines: ['architecture', 'structure'],
          severity_threshold: 'low',
        };

        const jobPromise = request(app.getHttpServer())
          .post('/bim-clashes/federated/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData);

        jobs.push(jobPromise);
      }

      const responses = await Promise.all(jobs);

      responses.forEach((response: Response) => {
        expect(response.status).toBe(201);
        expect(response.body.status).toBe('pending');
      });
    });

    it('should efficiently query spatial index', async () => {
      const startTime = Date.now();

      // Query potential clash pairs using spatial indexing function
      const { data, error } = await supabase.rpc('get_potential_clash_pairs', {
        p_company_id: companyId,
        p_discipline_a: 'architecture',
        p_discipline_b: 'structure',
        p_tolerance_mm: 10,
      });

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  // Helper function to cleanup test data
  async function cleanupTestData() {
    try {
      // Delete in correct order due to foreign key constraints
      await supabase
        .from('bim_clash_comments')
        .delete()
        .eq('company_id', companyId);
      await supabase.from('bim_clashes').delete().eq('company_id', companyId);
      await supabase
        .from('bim_federated_clash_jobs')
        .delete()
        .eq('company_id', companyId);
      await supabase
        .from('bim_spatial_index')
        .delete()
        .eq('company_id', companyId);
      await supabase.from('bim_models').delete().eq('company_id', companyId);

      // Clean up projects created for testing
      await supabase
        .from('projects')
        .delete()
        .eq('company_id', companyId)
        .eq('name', 'E2E Test Project Federated BIM');

      // Reset company seeding status for future tests
      await supabase
        .from('companies')
        .update({
          library_seeded: false,
          seeded_at: null,
          specialty: null,
          seismic_zone: null,
        })
        .eq('id', companyId);

      // Clean up seeded resources and APUs
      await supabase.from('resources').delete().eq('company_id', companyId);
      await supabase.from('apu_templates').delete().eq('company_id', companyId);
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }
});
