import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertProjectTypeToArray1747123456789 implements MigrationInterface {
  name = 'ConvertProjectTypeToArray1747123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects ALTER COLUMN type TYPE TEXT[] USING ARRAY[type]::TEXT[];
      ALTER TABLE projects ALTER COLUMN type DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert array back to single string (takes first element if exists)
    await queryRunner.query(`
      UPDATE projects SET type = CASE 
        WHEN array_length(type, 1) > 0 THEN type[1]
        ELSE NULL
      END;
      ALTER TABLE projects ALTER COLUMN type TYPE TEXT;
      ALTER TABLE projects ALTER COLUMN type SET NOT NULL;
    `);
  }
}
