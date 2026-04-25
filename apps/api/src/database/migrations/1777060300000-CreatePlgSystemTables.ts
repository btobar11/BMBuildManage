import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlgSystemTables1777060300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "onboarding_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "step_code" varchar(50) NOT NULL,
        "completed" boolean DEFAULT false,
        "completed_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        UNIQUE("company_id", "user_id", "step_code")
      );
      CREATE INDEX "idx_onboarding_company" ON "onboarding_progress"("company_id");

      CREATE TABLE "activation_status" (
        "company_id" uuid PRIMARY KEY,
        "is_activated" boolean DEFAULT false,
        "activated_at" timestamptz,
        "activation_score" int DEFAULT 0,
        "last_calculated" timestamptz DEFAULT now()
      );

      CREATE TABLE "engagement_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "event_type" varchar(50) NOT NULL,
        "metadata" jsonb,
        "created_at" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_engagement_company" ON "engagement_events"("company_id");

      CREATE TABLE "retention_signals" (
        "company_id" uuid PRIMARY KEY,
        "risk_level" varchar(10),
        "last_activity" timestamptz,
        "engagement_score" int,
        "updated_at" timestamptz DEFAULT now()
      );

      CREATE TABLE "plg_metrics_snapshot" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "date" date,
        "activation_rate" decimal,
        "churn_rate" decimal,
        "dau" int,
        "wau" int,
        "created_at" timestamptz DEFAULT now()
      );

      -- RLS Policies
      ALTER TABLE "onboarding_progress" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "onboarding_progress_tenant_isolation" ON "onboarding_progress"
        USING (company_id = current_setting('app.company_id', true)::uuid);

      ALTER TABLE "activation_status" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "activation_status_tenant_isolation" ON "activation_status"
        USING (company_id = current_setting('app.company_id', true)::uuid);

      ALTER TABLE "engagement_events" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "engagement_events_tenant_isolation" ON "engagement_events"
        USING (company_id = current_setting('app.company_id', true)::uuid);

      ALTER TABLE "retention_signals" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "retention_signals_tenant_isolation" ON "retention_signals"
        USING (company_id = current_setting('app.company_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "plg_metrics_snapshot";
      DROP TABLE IF EXISTS "retention_signals";
      DROP TABLE IF EXISTS "engagement_events";
      DROP TABLE IF EXISTS "activation_status";
      DROP TABLE IF EXISTS "onboarding_progress";
    `);
  }
}
