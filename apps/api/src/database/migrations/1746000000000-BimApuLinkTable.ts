import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Create bim_apu_links table
 *
 * Enables automated BIM-to-APU quantity takeoff synchronization.
 * Maps IFC elements to budget items (APU).
 */
export class BimApuLinkTable1746000000000 implements MigrationInterface {
  name = 'BimApuLinkTable1746000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bim_apu_links',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'item_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ifc_global_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'ifc_type',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'element_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'net_volume',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'net_area',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'gross_volume',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'gross_area',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'length',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'width',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'height',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'quantity_type',
            type: 'varchar',
            length: '20',
            default: "'volume'",
          },
          {
            name: 'quantity_multiplier',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 1,
          },
          {
            name: 'auto_sync_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_synced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_synced_by',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            name: 'fk_bim_apu_links_project',
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'fk_bim_apu_links_item',
            columnNames: ['item_id'],
            referencedTableName: 'items',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'bim_apu_links',
      new TableIndex({
        name: 'idx_bim_apu_links_company',
        columnNames: ['company_id'],
      }),
    );

    await queryRunner.createIndex(
      'bim_apu_links',
      new TableIndex({
        name: 'idx_bim_apu_links_project',
        columnNames: ['project_id'],
      }),
    );

    await queryRunner.createIndex(
      'bim_apu_links',
      new TableIndex({
        name: 'idx_bim_apu_links_item',
        columnNames: ['item_id'],
      }),
    );

    await queryRunner.createIndex(
      'bim_apu_links',
      new TableIndex({
        name: 'idx_bim_apu_links_ifc',
        columnNames: ['ifc_global_id'],
      }),
    );

    // Enable UUID extension if not exists
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('bim_apu_links', 'idx_bim_apu_links_ifc');
    await queryRunner.dropIndex('bim_apu_links', 'idx_bim_apu_links_item');
    await queryRunner.dropIndex('bim_apu_links', 'idx_bim_apu_links_project');
    await queryRunner.dropIndex('bim_apu_links', 'idx_bim_apu_links_company');
    await queryRunner.dropTable('bim_apu_links');
  }
}
