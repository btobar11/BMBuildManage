import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingMetricsTable1777060400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pricing_metrics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "active_users" int DEFAULT 0,
        "projects_count" int DEFAULT 0,
        "budgets_count" int DEFAULT 0,
        "bim_models_count" int DEFAULT 0,
        "ai_requests_month" int DEFAULT 0,
        "feature_usage_score" int DEFAULT 0,
        "churn_risk_score" decimal(3,2) DEFAULT 0,
        "expansion_score" decimal(3,2) DEFAULT 0,
        "recommended_actions" jsonb,
        "updated_at" timestamptz DEFAULT now(),
        UNIQUE("company_id")
      );

      ALTER TABLE "pricing_metrics" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "pricing_metrics_tenant_isolation" ON "pricing_metrics"
        USING (company_id = current_setting('app.company_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "pricing_metrics";
    `);
  }
}
