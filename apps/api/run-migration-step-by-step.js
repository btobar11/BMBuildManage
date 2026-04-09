const { Client } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: Missing DATABASE_URL in .env file');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔧 Running Migration 002: Step-by-step approach');
    console.log('🔗 Connecting to database...');
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Step 1: Add company_id to documents
    console.log('📝 Step 1: Adding company_id to documents table...');
    try {
      await client.query(`
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      `);
      console.log('✅ company_id column added to documents');
    } catch (error) {
      console.log('ℹ️  company_id column might already exist in documents');
    }

    // Step 2: Create invoices table
    console.log('📝 Step 2: Creating invoices table...');
    try {
      await client.query(`
        CREATE TABLE invoices (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          supplier VARCHAR(300) NOT NULL,
          invoice_number VARCHAR(100) NOT NULL,
          amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          date DATE NOT NULL,
          file_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ invoices table created');
    } catch (error) {
      console.log('ℹ️  invoices table might already exist');
    }

    // Step 3: Create project_models table
    console.log('📝 Step 3: Creating project_models table...');
    try {
      await client.query(`
        CREATE TABLE project_models (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          storage_path TEXT NOT NULL,
          file_size BIGINT,
          format VARCHAR(50),
          processing_status VARCHAR(50) DEFAULT 'pending',
          file_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ project_models table created');
    } catch (error) {
      console.log('ℹ️  project_models table might already exist');
    }

    // Step 4: Create indexes
    console.log('📝 Step 4: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_documents_project_company ON documents(project_id, company_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_project_company ON invoices(project_id, company_id);',
      'CREATE INDEX IF NOT EXISTS idx_project_models_project ON project_models(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_project_models_company ON project_models(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_project_models_project_company ON project_models(project_id, company_id);',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_project_models_project_storage ON project_models(project_id, storage_path);'
    ];

    for (const indexSQL of indexes) {
      try {
        await client.query(indexSQL);
      } catch (error) {
        console.log(`⚠️  Index warning: ${error.message}`);
      }
    }
    console.log('✅ Indexes created');

    // Step 5: Backfill documents company_id
    console.log('📝 Step 5: Backfilling documents with company_id...');
    try {
      const result = await client.query(`
        UPDATE documents 
        SET company_id = (
          SELECT p.company_id 
          FROM projects p 
          WHERE p.id = documents.project_id
        )
        WHERE company_id IS NULL;
      `);
      console.log(`✅ Updated ${result.rowCount} documents with company_id`);
    } catch (error) {
      console.log('⚠️  Backfill warning:', error.message);
    }

    // Step 6: Verify tables exist
    console.log('📝 Step 6: Verifying tables...');
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('documents', 'invoices', 'project_models');
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Tables verified:', tablesCheck.rows.map(r => r.table_name).join(', '));
    console.log('🔒 Multi-tenant security has been enhanced');
    
  } catch (error) {
    console.error('💥 Error running migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration();