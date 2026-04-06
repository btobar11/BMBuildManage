const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sfzkrnfyfwonxyceugya.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTkwNywiZXhwIjoyMDg4OTk3OTA3fQ.4MZdd_SOgzPCuvNfx49AswALEkPifrTZUL3OWYpybOo');

async function check() {
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@bmbuildmanage.com',
    password: 'demo123456'
  });
  
  if (error) {
    console.log('❌ Error:', error.message);
    
    // Try signing up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'demo@bmbuildmanage.com',
      password: 'demo123456'
    });
    
    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message);
    } else {
      console.log('✅ User created:', signUpData.user?.email);
    }
  } else {
    console.log('✅ Logged in as:', data.user?.email);
  }
}

check();
