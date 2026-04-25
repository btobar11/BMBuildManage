import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesInteractionsTable1777060200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "sales_interaction_opportunity_type" AS ENUM (
        'upgrade_plan',
        'buy_addon',
        'increase_usage_limit',
        'renew_subscription'
      );

      CREATE TABLE "sales_interactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "opportunity_type" "sales_interaction_opportunity_type" NOT NULL,
        "message" text NOT NULL,
        "cta" varchar NOT NULL,
        "urgency" varchar NOT NULL DEFAULT 'medium',
        "target_plan" varchar,
        "target_addon" varchar,
        "shown_at" timestamptz NOT NULL DEFAULT now(),
        "clicked_at" timestamptz,
        "converted" boolean NOT NULL DEFAULT false,
        "conversion_value" decimal(12,2),
        "dismissed" boolean NOT NULL DEFAULT false
      );

      CREATE INDEX "idx_sales_interactions_company" ON "sales_interactions" ("company_id");
      CREATE INDEX "idx_sales_interactions_user" ON "sales_interactions" ("user_id");
      CREATE INDEX "idx_sales_interactions_shown" ON "sales_interactions" ("shown_at");

      ALTER TABLE "sales_interactions" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "sales_interactions_tenant_isolation" ON "sales_interactions"
        USING (company_id = current_setting('app.company_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "sales_interactions";
      DROP TYPE IF EXISTS "sales_interaction_opportunity_type";
    `);
  }
}
