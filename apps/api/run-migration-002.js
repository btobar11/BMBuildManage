const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    console.log('🔧 Running Migration 002: Add missing multi-tenant columns and tables');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database/migrations/002-add-missing-multi-tenant-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded');
    console.log('⚠️  This migration will:');
    console.log('   1. Add company_id to documents table');
    console.log('   2. Create invoices table with proper multi-tenancy');
    console.log('   3. Create project_models table for BIM files');
    console.log('   4. Enable Row Level Security (RLS) policies');
    console.log('   5. Backfill existing documents with company_id');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration 002 completed successfully!');
    console.log('🔒 Multi-tenant security has been enhanced');
    console.log('📊 Tables updated:');
    console.log('   - documents (added company_id)');
    console.log('   - invoices (created with company_id)');
    console.log('   - project_models (created with company_id)');
    console.log('🛡️  Row Level Security enabled for all tables');
    
  } catch (error) {
    console.error('💥 Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();