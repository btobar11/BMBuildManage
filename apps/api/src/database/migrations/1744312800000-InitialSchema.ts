import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1744312800000 implements MigrationInterface {
  name = 'InitialSchema1744312800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla companies
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "rut" character varying,
        "address" character varying,
        "phone" character varying,
        "email" character varying,
        "logo_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);

    // Tabla users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "full_name" character varying,
        "role" character varying NOT NULL DEFAULT 'user',
        "company_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Tabla clients
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "rut" character varying,
        "contact_name" character varying,
        "contact_email" character varying,
        "contact_phone" character varying,
        "address" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id")
      )
    `);

    // Tabla projects
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "client_id" uuid,
        "name" character varying NOT NULL,
        "code" character varying,
        "description" text,
        "address" character varying,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "status" character varying NOT NULL DEFAULT 'planning',
        "total_budget" numeric,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id")
      )
    `);

    // Tabla budgets
    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "total_material" numeric NOT NULL DEFAULT 0,
        "total_equipment" numeric NOT NULL DEFAULT 0,
        "total_labor" numeric NOT NULL DEFAULT 0,
        "total_other" numeric NOT NULL DEFAULT 0,
        "contingency_percentage" numeric NOT NULL DEFAULT 0,
        "contingency_amount" numeric NOT NULL DEFAULT 0,
        "grand_total" numeric NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets" PRIMARY KEY ("id")
      )
    `);

    // Tabla stages
    await queryRunner.query(`
      CREATE TABLE "stages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "budget_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stages" PRIMARY KEY ("id")
      )
    `);

    // Tabla items
    await queryRunner.query(`
      CREATE TABLE "items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "stage_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "unit_id" uuid,
        "quantity" numeric NOT NULL DEFAULT 1,
        "unit_price" numeric NOT NULL DEFAULT 0,
        "total_price" numeric NOT NULL DEFAULT 0,
        "category" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_items" PRIMARY KEY ("id")
      )
    `);

    // Tabla units
    await queryRunner.query(`
      CREATE TABLE "units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "abbreviation" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_units" PRIMARY KEY ("id")
      )
    `);

    // Tabla resources
    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "unit_id" uuid,
        "unit_price" numeric NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resources" PRIMARY KEY ("id")
      )
    `);

    // Tabla workers
    await queryRunner.query(`
      CREATE TABLE "workers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying,
        "daily_rate" numeric,
        "phone" character varying,
        "skills" text,
        "rating" numeric,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workers" PRIMARY KEY ("id")
      )
    `);

    // Tabla expenses
    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "category" character varying NOT NULL,
        "description" character varying,
        "amount" numeric NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "receipt_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
      )
    `);

    // Tabla invoices
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "invoice_number" character varying NOT NULL,
        "client_name" character varying,
        "client_rut" character varying,
        "client_address" character varying,
        "subtotal" numeric NOT NULL,
        "tax" numeric NOT NULL DEFAULT 0,
        "total" numeric NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "issue_date" TIMESTAMP NOT NULL,
        "due_date" TIMESTAMP,
        "paid_date" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )
    `);

    // Tabla templates
    await queryRunner.query(`
      CREATE TABLE "templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "category" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_templates" PRIMARY KEY ("id")
      )
    `);

    // Tabla documents
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "project_id" uuid,
        "name" character varying NOT NULL,
        "type" character varying,
        "file_url" character varying NOT NULL,
        "file_size" integer,
        "mime_type" character varying,
        "uploaded_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    // Tabla machinery
    await queryRunner.query(`
      CREATE TABLE "machinery" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying,
        "brand" character varying,
        "model" character varying,
        "plate" character varying,
        "daily_rate" numeric,
        "status" character varying NOT NULL DEFAULT 'available',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_machinery" PRIMARY KEY ("id")
      )
    `);

    // Tabla materials
    await queryRunner.query(`
      CREATE TABLE "materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "unit_id" uuid,
        "unit_price" numeric NOT NULL DEFAULT 0,
        "category" character varying,
        "supplier" character varying,
        "sku" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_materials" PRIMARY KEY ("id")
      )
    `);

    // Tabla contingencies
    await queryRunner.query(`
      CREATE TABLE "contingencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "amount" numeric NOT NULL DEFAULT 0,
        "used_amount" numeric NOT NULL DEFAULT 0,
        "remaining_amount" numeric NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contingencies" PRIMARY KEY ("id")
      )
    `);

    // Tabla audit_logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "user_id" uuid,
        "action" character varying NOT NULL,
        "entity_type" character varying NOT NULL,
        "entity_id" uuid,
        "old_values" text,
        "new_values" text,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Habilitar extensión uuid-ossp si no existe
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Crear índices para mejorar rendimiento
    await queryRunner.query(
      `CREATE INDEX "IDX_users_company_id" ON "users" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_company_id" ON "clients" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_company_id" ON "projects" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_budgets_company_id" ON "budgets" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stages_company_id" ON "stages" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_items_company_id" ON "items" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_expenses_company_id" ON "expenses" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_company_id" ON "invoices" ("company_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_invoices_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_expenses_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_items_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_stages_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_projects_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_clients_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_company_id"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "contingencies"`);
    await queryRunner.query(`DROP TABLE "materials"`);
    await queryRunner.query(`DROP TABLE "machinery"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "workers"`);
    await queryRunner.query(`DROP TABLE "resources"`);
    await queryRunner.query(`DROP TABLE "units"`);
    await queryRunner.query(`DROP TABLE "items"`);
    await queryRunner.query(`DROP TABLE "stages"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
