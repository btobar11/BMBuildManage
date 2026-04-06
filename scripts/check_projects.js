const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sfzkrnfyfwonxyceugya.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5MDcsImV4cCI6MjA4ODk5NzkwN30.4AAIwrvdA1LK5w-mDDqvmr_EVzfJ502j6nJ2JT3xjeg');
supabase.from('projects').select('*').limit(1).then(console.log).catch(console.error);
