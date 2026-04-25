import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeadsTable1777060500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL,
        "company_name" varchar NOT NULL,
        "status" varchar DEFAULT 'new',
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leads";`);
  }
}
