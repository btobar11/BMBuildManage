import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTechnicalFieldsToProjectsAndBudgets1777060600000 implements MigrationInterface {
  name = 'AddTechnicalFieldsToProjectsAndBudgets1777060600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "floors" integer,
      ADD COLUMN "underground_floors" integer,
      ADD COLUMN "land_area" decimal(10,2);
      
      ALTER TABLE "budgets" 
      ADD COLUMN "code" varchar(100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "budgets" DROP COLUMN "code";
      
      ALTER TABLE "projects" 
      DROP COLUMN "land_area",
      DROP COLUMN "underground_floors",
      DROP COLUMN "floors";
    `);
  }
}
