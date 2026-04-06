require('dotenv').config({path: 'apps/api/.env'});
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'benja11tobar@gmail.com',
    password: 'tumami11'
  });
  if (error) console.error(error);
  
  if (data?.session) {
    const apiURL = process.env.VERCEL_API_URL || 'https://bm-build-manage-api.vercel.app/api/v1';
    const res = await fetch(`${apiURL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        name: 'My New Test Project',
        description: 'Test integration',
        status: 'draft'
      })
    });
    
    const text = await res.text();
    fs.writeFileSync('scripts/api_response.json', text, 'utf8');
    console.log("Status:", res.status);
    console.log("Saved response to scripts/api_response.json");
  }
}

test();
