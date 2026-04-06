import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfzkrnfyfwonxyceugya.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5MDcsImV4cCI6MjA4ODk5NzkwN30.4AAIwrvdA1LK5w-mDDqvmr_EVzfJ502j6nJ2JT3xjeg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
  console.log('👤 Creating demo user in Supabase Auth...');
  
  try {
    // Try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: 'demo@bmbuildmanage.com',
      password: 'demo123456',
      options: {
        data: {
          name: 'Usuario Demo'
        }
      }
    });

    if (error) {
      console.log('User might already exist, trying to get user...');
      // If user already exists, just note it
      console.log('Auth info:', error.message);
    } else {
      console.log('✅ User created successfully!');
      console.log('User ID:', data.user?.id);
    }
    
    console.log('');
    console.log('📝 Credenciales configuradas:');
    console.log('Email: demo@bmbuildmanage.com');
    console.log('Password: demo123456');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createDemoUser();