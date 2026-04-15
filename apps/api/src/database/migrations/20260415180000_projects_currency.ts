import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ProjectsCurrency1744762800000 implements MigrationInterface {
  name = 'ProjectsCurrency1744762800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add budget_currency column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'budget_currency',
        type: 'varchar',
        length: '10',
        default: "'CLP'",
        isNullable: true,
      }),
    );

    // Add price_currency column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'price_currency',
        type: 'varchar',
        length: '10',
        default: "'CLP'",
        isNullable: true,
      }),
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON COLUMN public.projects.budget_currency IS 'Moneda del presupuesto estimado (ej. CLP, UF)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN public.projects.price_currency IS 'Moneda del precio estimado (ej. CLP, UF)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'price_currency');
    await queryRunner.dropColumn('projects', 'budget_currency');
  }
}