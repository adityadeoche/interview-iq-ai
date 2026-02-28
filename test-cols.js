require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Error:', error);
  console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : (data ? 'No rows but success' : 'null'));
  process.exit(0);
}
run();
