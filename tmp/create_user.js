const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in apps/api/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'password123';
  const companyId = '6739920f-65cb-4dd7-9f07-67f5aa9218ea';

  console.log(`Creating user: ${email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      full_name: 'Test Manager',
      company_id: companyId,
      role: 'manager'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('User created successfully:', data.user.id);

  // Now link to public.users if necessary
  // Check if we can reach the DB to insert into public.users
  // If not, we might need the user to do it or wait for the backend to handle it if there's a trigger.
}

createTestUser();
