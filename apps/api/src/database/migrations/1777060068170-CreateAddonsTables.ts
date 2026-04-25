import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddonsTables1777060068170 implements MigrationInterface {
  name = 'CreateAddonsTables1777060068170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."addon_type_enum" AS ENUM('feature', 'usage', 'service');
      CREATE TYPE "public"."addon_billing_cycle_enum" AS ENUM('monthly', 'one_time');
      CREATE TYPE "public"."company_addon_status_enum" AS ENUM('active', 'cancelled');

      CREATE TABLE "addons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "type" "public"."addon_type_enum" NOT NULL,
        "price_monthly" integer,
        "price_one_time" integer,
        "required_plan" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_addon_code" UNIQUE ("code"),
        CONSTRAINT "PK_addons" PRIMARY KEY ("id")
      );

      CREATE TABLE "company_addons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "addon_code" varchar NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "billing_cycle" "public"."addon_billing_cycle_enum" NOT NULL,
        "start_date" TIMESTAMP NOT NULL DEFAULT now(),
        "end_date" TIMESTAMP,
        "status" "public"."company_addon_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_addons" PRIMARY KEY ("id")
      );

      ALTER TABLE "company_addons" ADD CONSTRAINT "FK_company_addons_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      ALTER TABLE "company_addons" ADD CONSTRAINT "FK_company_addons_addon_code" FOREIGN KEY ("addon_code") REFERENCES "addons"("code") ON DELETE RESTRICT ON UPDATE NO ACTION;

      -- Seed data
      INSERT INTO "addons" ("code", "name", "description", "type", "price_monthly", "price_one_time", "required_plan") VALUES
      ('bim_module', 'BIM 3D + 4D + 5D', 'Desbloquea funcionalidades completas de BIM', 'feature', 49990, NULL, 'pro'),
      ('ai_pack', 'AI Assistant + análisis', 'Asistente de inteligencia artificial', 'feature', 19990, NULL, 'lite'),
      ('advanced_analytics', 'BI avanzado', 'Dashboards y métricas avanzadas', 'feature', 24990, NULL, 'pro'),
      ('api_access', 'API externa', 'Acceso a la API REST de BMBuildManage', 'feature', 29990, NULL, 'pro'),
      ('extra_user', '+1 usuario', 'Añade un usuario adicional a tu equipo', 'usage', 4990, NULL, 'lite'),
      ('extra_project', '+5 proyectos', 'Añade capacidad para 5 proyectos más', 'usage', 9990, NULL, 'lite'),
      ('extra_storage', '+5GB storage', 'Añade 5GB de almacenamiento adicional', 'usage', 5990, NULL, 'lite'),
      ('extra_ai', '+500 requests AI', 'Añade 500 solicitudes a la IA', 'usage', 9990, NULL, 'lite'),
      ('extra_bim_models', '+10 modelos BIM', 'Añade capacidad para 10 modelos adicionales', 'usage', 14990, NULL, 'lite'),
      ('priority_support', 'Soporte prioritario', 'Atención en menos de 2 horas', 'service', 29990, NULL, 'lite'),
      ('onboarding_pro', 'Onboarding guiado', 'Sesiones 1-a-1 de implementación', 'service', NULL, 99990, 'lite'),
      ('data_migration', 'Migración de datos', 'Importación completa de tus sistemas anteriores', 'service', NULL, 149990, 'lite');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_addons" DROP CONSTRAINT "FK_company_addons_addon_code";
      ALTER TABLE "company_addons" DROP CONSTRAINT "FK_company_addons_company_id";
      DROP TABLE "company_addons";
      DROP TABLE "addons";
      DROP TYPE "public"."company_addon_status_enum";
      DROP TYPE "public"."addon_billing_cycle_enum";
      DROP TYPE "public"."addon_type_enum";
    `);
  }
}
