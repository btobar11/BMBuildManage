const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
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
    console.log('🔧 Running Migration 002 (Fixed): Add missing multi-tenant columns and tables');
    console.log('🔗 Connecting to database...');
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read the fixed migration file
    const migrationPath = path.join(__dirname, 'database/migrations/002-add-missing-multi-tenant-columns-fixed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Fixed migration SQL loaded');
    console.log('🔄 Executing complete migration...');
    
    // Execute the entire migration as one transaction
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration 002 completed successfully!');
    console.log('🔒 Multi-tenant security has been enhanced');
    console.log('📊 Tables created/updated:');
    console.log('   - documents (company_id column added)');
    console.log('   - invoices (created with company_id)');
    console.log('   - project_models (created with company_id)');
    console.log('📋 All indexes created correctly');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('💥 Error running migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration();