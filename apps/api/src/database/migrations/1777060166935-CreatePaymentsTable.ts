import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1777060166935 implements MigrationInterface {
  name = 'CreatePaymentsTable1777060166935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled');

      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "mercadopago_payment_id" varchar,
        "amount" integer NOT NULL,
        "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending',
        "plan" varchar,
        "addon_code" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      );

      ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

      -- Add last_payment_id and next_billing_date to subscriptions
      ALTER TABLE "subscriptions" ADD "last_payment_id" varchar;
      ALTER TABLE "subscriptions" ADD "next_billing_date" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP COLUMN "next_billing_date";
      ALTER TABLE "subscriptions" DROP COLUMN "last_payment_id";
      
      ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_company_id";
      DROP TABLE "payments";
      DROP TYPE "public"."payment_status_enum";
    `);
  }
}
